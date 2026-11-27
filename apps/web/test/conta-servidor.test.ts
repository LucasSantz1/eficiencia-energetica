import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { Contexto, Gateway } from "@/aplicacao/conta.servidor";
import type { TokensDaSessao } from "@/infraestrutura/conta/sessao.servidor";

vi.mock("server-only", () => ({}));

const conta = await import("@/aplicacao/conta.servidor");
const metricas = await import("@/aplicacao/metricas.servidor");
const { cifrarSessao, decifrarSessao } = await import("@/infraestrutura/conta/sessao.servidor");
const { chaveDaTentativa, redeDoIp } = await import("@/infraestrutura/conta/tentativas.servidor");
const { cifrarCasa, decifrarCasa } = await import("@/infraestrutura/conta/cofre.servidor");

const SEGREDO = new Uint8Array(32).fill(7);
const CONFIG = { urlDoSupabase: "https://exemplo.supabase.co", chaveAnonima: "anon", segredoDaSessao: SEGREDO, segredoDaCasa: new Uint8Array(32).fill(3) };
const AGORA_MS = Date.parse("2026-11-25T12:00:00Z");
const TOKENS: TokensDaSessao = { acesso: "jwt-de-acesso-com-ana@exemplo.org", renovacao: "renovacao-1", expiraEm: AGORA_MS / 1000 + 3600 };
const USUARIO = { id: "00000000-0000-4000-8000-00000000000a", email: "ana@exemplo.org" };

/** Supabase de mentira: cada função responde "ok" e guarda os argumentos para o teste conferir. */
function gatewayDeMentira(trocas: Partial<Gateway> = {}): Gateway & { chamadas: Record<string, unknown[][]> } {
  const chamadas: Record<string, unknown[][]> = {};
  const anotar = <A extends unknown[], R>(nome: string, resposta: R) => async (...args: A): Promise<R> => {
    (chamadas[nome] ??= []).push(args);
    return resposta;
  };
  const base: Gateway = {
    cadastrar: anotar("cadastrar", { ok: true, valor: null }),
    entrar: anotar("entrar", { ok: true, valor: TOKENS }),
    confirmarLink: anotar("confirmarLink", { ok: true, valor: TOKENS }),
    renovar: anotar("renovar", { ok: true, valor: { ...TOKENS, renovacao: "renovacao-2", expiraEm: AGORA_MS / 1000 + 3600 } }),
    sair: anotar("sair", { ok: true, valor: null }),
    pedirNovaSenha: anotar("pedirNovaSenha", { ok: true, valor: null }),
    trocarSenha: anotar("trocarSenha", { ok: true, valor: null }),
    quemEsta: anotar("quemEsta", { ok: true, valor: USUARIO }),
    lerCasa: anotar("lerCasa", { ok: true, valor: undefined }),
    gravarCasa: anotar("gravarCasa", { ok: true, valor: "2026-11-25T12:00:01.000Z" }),
    listarConvites: anotar("listarConvites", { ok: true, valor: [] }),
    criarConvite: anotar("criarConvite", { ok: true, valor: { id: "11111111-1111-4111-8111-111111111111", nome: "Mãe", criadoEm: "2026-11-25T12:00:00Z" } }),
    apagarConvite: anotar("apagarConvite", { ok: true, valor: null }),
    casaDoConvite: anotar("casaDoConvite", { ok: true, valor: undefined }),
    apagarConta: anotar("apagarConta", { ok: true, valor: null }),
    contarTentativa: anotar("contarTentativa", { ok: true, valor: true }),
    contarUso: anotar("contarUso", { ok: true, valor: null }),
    registrarOpiniao: anotar("registrarOpiniao", { ok: true, valor: null }),
  };
  return Object.assign({ ...base, ...trocas }, { chamadas });
}

function contexto(gateway: Gateway, ligada = true): Contexto {
  return { config: ligada ? CONFIG : undefined, gateway, enderecoDoSite: "https://site.exemplo", ip: "203.0.113.7", agora: () => AGORA_MS };
}

const cookieValido = (tokens: TokensDaSessao = TOKENS) => cifrarSessao(tokens, SEGREDO);

describe("cookie da sessão (ADR-007)", () => {
  it("é opaco: não traz e-mail nem token legível, e volta igual com a mesma chave", () => {
    const cookie = cookieValido();
    expect(cookie).not.toContain("ana");
    expect(Buffer.from(cookie, "base64url").toString("latin1")).not.toContain("renovacao-1");
    expect(decifrarSessao(cookie, SEGREDO)).toEqual(TOKENS);
  });

  it("recusa cookie mexido, de outra chave, enorme ou com caractere estranho", () => {
    const cookie = cookieValido();
    const mexido = `${cookie.slice(0, -2)}${cookie.at(-2) === "A" ? "B" : "A"}${cookie.at(-1)}`;
    expect(decifrarSessao(mexido, SEGREDO)).toBeUndefined();
    expect(decifrarSessao(cookie, new Uint8Array(32).fill(8))).toBeUndefined();
    expect(decifrarSessao("a".repeat(5000), SEGREDO)).toBeUndefined();
    expect(decifrarSessao("abc$", SEGREDO)).toBeUndefined();
    expect(decifrarSessao(undefined, SEGREDO)).toBeUndefined();
  });
});

describe("conta (casos de uso do servidor)", () => {
  it("sem as variáveis de ambiente, a conta fica desligada e nada chama o Supabase", async () => {
    const gateway = gatewayDeMentira();
    expect((await conta.estado(contexto(gateway, false), undefined)).corpo).toEqual({ conta: "desligada" });
    expect((await conta.entrar(contexto(gateway, false), { email: "ana@exemplo.org", senha: "12345678" })).status).toBe(503);
    expect(gateway.chamadas).toEqual({});
  });

  it("criar conta pede o 'concordo' (LGPD) e confere e-mail e senha antes do Supabase", async () => {
    const gateway = gatewayDeMentira();
    const ctx = contexto(gateway);
    expect((await conta.cadastrar(ctx, { email: "ana@exemplo.org", senha: "12345678" })).status).toBe(400);
    expect((await conta.cadastrar(ctx, { email: "ana", senha: "12345678", concordo: true })).status).toBe(400);
    expect((await conta.cadastrar(ctx, { email: "ana@exemplo.org", senha: "123", concordo: true })).status).toBe(400);
    expect(gateway.chamadas["cadastrar"]).toBeUndefined();
    expect((await conta.cadastrar(ctx, { email: " Ana@Exemplo.org", senha: "12345678", concordo: true })).status).toBe(200);
    expect(gateway.chamadas["cadastrar"]?.[0]?.slice(1, 4)).toEqual(["ana@exemplo.org", "12345678", "https://site.exemplo"]);
  });

  it("entrar grava o cookie cifrado; senha errada e e-mail sem conta têm a mesma resposta", async () => {
    const certo = await conta.entrar(contexto(gatewayDeMentira()), { email: "ana@exemplo.org", senha: "12345678" });
    expect(certo.status).toBe(200);
    expect(certo.cookie?.tipo).toBe("gravar");
    if (certo.cookie?.tipo === "gravar") expect(decifrarSessao(certo.cookie.valor, SEGREDO)).toEqual({ ...TOKENS, inicio: AGORA_MS / 1000 });
    const errado = await conta.entrar(contexto(gatewayDeMentira({ entrar: async () => ({ ok: false, erro: "credenciais" }) })), { email: "ana@exemplo.org", senha: "x".repeat(8) });
    const semEmail = await conta.entrar(contexto(gatewayDeMentira()), { email: "não é e-mail", senha: "12345678" });
    expect([errado.status, errado.corpo]).toEqual([semEmail.status, semEmail.corpo]);
  });

  it("estado: cookie mexido vira 'sem conta' e o cookie é apagado; token perto de vencer é renovado", async () => {
    const mexido = await conta.estado(contexto(gatewayDeMentira()), "lixo");
    expect(mexido).toMatchObject({ corpo: { conta: "sem-conta" }, cookie: { tipo: "apagar" } });
    const gateway = gatewayDeMentira();
    const quase = await conta.estado(contexto(gateway), cookieValido({ ...TOKENS, expiraEm: AGORA_MS / 1000 + 30 }));
    expect(quase.corpo).toEqual({ conta: "conectada", email: "ana@exemplo.org" });
    expect(gateway.chamadas["renovar"]).toHaveLength(1);
    if (quase.cookie?.tipo !== "gravar") throw new Error("devia regravar o cookie");
    expect(decifrarSessao(quase.cookie.valor, SEGREDO)?.renovacao).toBe("renovacao-2");
  });

  it("gravar a casa: passa pelo leitor da casa salva (nada estranho entra) e usa o id que o Supabase confirmou", async () => {
    const gateway = gatewayDeMentira();
    const corpo = JSON.parse('{"casa":{"comodos":[],"aparelhos":[],"contas":[],"leituras":[],"plano":[],"__proto__":{"x":1},"estranho":1},"versaoDoFormato":3,"atualizadaEm":null}');
    const resposta = await conta.gravarCasa(contexto(gateway), cookieValido(), corpo);
    expect(resposta.status).toBe(200);
    const [, acesso, dono, casa, conhecida] = gateway.chamadas["gravarCasa"]?.[0] ?? [];
    expect([acesso, dono, conhecida]).toEqual([TOKENS.acesso, USUARIO.id, undefined]);
    expect(casa).toEqual({ dados: { comodos: [], aparelhos: [], contas: [], leituras: [], plano: [] }, versaoDoFormato: 3 });
    expect((await conta.gravarCasa(contexto(gateway), undefined, corpo)).status).toBe(401);
    // Outra versão do formato (aba antiga, código guardado sem internet): 409 "versao", nada gravado (M4).
    const antes = gateway.chamadas["gravarCasa"]?.length;
    expect((await conta.gravarCasa(contexto(gateway), cookieValido(), { ...corpo, versaoDoFormato: 2 })).corpo).toEqual({ erro: "versao" });
    expect(gateway.chamadas["gravarCasa"]?.length).toBe(antes);
  });

  it("criar convite: o código volta uma vez, e o banco recebe só o SHA-256 dele", async () => {
    const gateway = gatewayDeMentira();
    const resposta = await conta.criarConvite(contexto(gateway), cookieValido(), { nome: "Mãe" });
    const codigo = resposta.corpo["codigo"];
    if (typeof codigo !== "string") throw new Error("sem código");
    expect(codigo).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const [, , dono, hash, nome] = gateway.chamadas["criarConvite"]?.[0] ?? [];
    expect([dono, nome]).toEqual([USUARIO.id, "Mãe"]);
    expect(hash).toEqual(createHash("sha256").update(codigo).digest());
    expect(JSON.stringify(gateway.chamadas)).not.toContain(codigo);
  });

  it("convidado: código mal formado nem chega ao Supabase; código certo devolve a casa, sem cookie", async () => {
    const gateway = gatewayDeMentira({ casaDoConvite: async () => ({ ok: true, valor: { dados: { comodos: [], aparelhos: [], contas: [], leituras: [], plano: [] }, versaoDoFormato: 3, atualizadaEm: "x" } }) });
    expect((await conta.casaDoConvidado(contexto(gateway), { codigo: "curto" })).status).toBe(404);
    const resposta = await conta.casaDoConvidado(contexto(gateway), { codigo: "a".repeat(43) });
    expect(resposta.status).toBe(200);
    expect(resposta.cookie).toBeUndefined();
    const semConvite = await conta.casaDoConvidado(contexto(gatewayDeMentira()), { codigo: "b".repeat(43) });
    expect(semConvite.status).toBe(404);
  });

  it("apagar link: só aceita id no formato uuid", async () => {
    const gateway = gatewayDeMentira();
    expect((await conta.apagarConvite(contexto(gateway), cookieValido(), { id: "1 or 1=1" })).status).toBe(400);
    expect(gateway.chamadas["apagarConvite"]).toBeUndefined();
  });

  it("sair apaga o cookie mesmo se o Supabase falhar", async () => {
    const gateway = gatewayDeMentira({ sair: async () => Promise.reject(new Error("fora do ar")) });
    expect((await conta.sair(contexto(gateway), cookieValido())).cookie).toEqual({ tipo: "apagar" });
  });

  it("M3: toda rota com sessão confere a sessão no Supabase (cookie copiado depois de 'Sair' não lê nem apaga nada)", async () => {
    const saiu = gatewayDeMentira({ quemEsta: async () => ({ ok: false, erro: "sessao" }) });
    for (const resposta of [
      await conta.lerCasa(contexto(saiu), cookieValido()),
      await conta.listarConvites(contexto(saiu), cookieValido()),
      await conta.apagarConvite(contexto(saiu), cookieValido(), { id: "11111111-1111-4111-8111-111111111111" }),
      await conta.apagarConta(contexto(saiu), cookieValido()),
    ]) {
      expect(resposta.status).toBe(401);
      expect(resposta.cookie).toEqual({ tipo: "apagar" });
    }
    expect(saiu.chamadas["lerCasa"]).toBeUndefined();
    expect(saiu.chamadas["apagarConta"]).toBeUndefined();
  });

  it("M2: falha passageira do Supabase não tira a pessoa da conta (o cookie fica)", async () => {
    const lotado = gatewayDeMentira({ renovar: async () => ({ ok: false, erro: "muitas-tentativas" }) });
    const quase = cookieValido({ ...TOKENS, expiraEm: AGORA_MS / 1000 + 10 });
    const r1 = await conta.lerCasa(contexto(lotado), quase);
    expect([r1.status, r1.cookie]).toEqual([429, undefined]);
    const fora = gatewayDeMentira({ quemEsta: async () => ({ ok: false, erro: "indisponivel" }) });
    const r2 = await conta.estado(contexto(fora), cookieValido());
    expect([r2.status, r2.cookie]).toEqual([503, undefined]);
  });

  it("M5: o convidado recebe só o que a tela dele usa (sem pessoas, meta, leituras, plano nem contas antigas)", async () => {
    const contas = ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10"].map((competencia, i) => ({ id: `c${i}`, competencia, kwh: 100 + i, valor: 80 + i }));
    const residencia = { uf: "SP", municipioIbge: 3541406, municipioNome: "Presidente Prudente", distribuidoraId: "ess", beneficio: "tarifa-social", ligacao: "monofasica", pessoas: 4 };
    const dados = { residencia, comodos: [], aparelhos: [], contas, leituras: [{ id: "l1", data: "2026-10-01", valorKwh: 1000 }], plano: ["x"], metaMensal: 100 };
    const gateway = gatewayDeMentira({ casaDoConvite: async () => ({ ok: true, valor: { dados, versaoDoFormato: 3, atualizadaEm: "x" } }) });
    const resposta = await conta.casaDoConvidado(contexto(gateway), { codigo: "a".repeat(43) });
    const casa = resposta.corpo["casa"];
    expect(casa).toMatchObject({ leituras: [], plano: [] });
    expect(JSON.stringify(casa)).not.toMatch(/pessoas|metaMensal|2026-06|2026-07/);
    expect(JSON.stringify(casa)).toContain("2026-10");
  });
});

describe("limite de tentativas (ADR-008)", () => {
  /** Banco de mentira que barra a partir da tentativa número `limite + 1` de cada ação e chave. */
  function comLimite(limite: number) {
    const contagem = new Map<string, number>();
    return gatewayDeMentira({
      contarTentativa: async (_config, acao, chave) => {
        const nome = `${acao}:${chave.toString("hex")}`;
        const total = (contagem.get(nome) ?? 0) + 1;
        contagem.set(nome, total);
        return { ok: true, valor: total <= limite };
      },
    });
  }

  it("entrar conta por IP e por e-mail; passou do limite, 429 antes de chamar o Supabase", async () => {
    const gateway = comLimite(2);
    const ctx = contexto(gateway);
    const pedido = { email: "ana@exemplo.org", senha: "errada123" };
    expect((await conta.entrar(ctx, pedido)).status).toBe(200);
    expect((await conta.entrar(ctx, pedido)).status).toBe(200);
    const barrado = await conta.entrar(ctx, pedido);
    expect(barrado).toMatchObject({ status: 429, corpo: { erro: "muitas-tentativas" } });
    expect(gateway.chamadas["entrar"]).toHaveLength(2);
  });

  it("o banco recebe um HMAC de 32 bytes, nunca o IP nem o e-mail", async () => {
    const gateway = gatewayDeMentira();
    await conta.entrar(contexto(gateway), { email: "ana@exemplo.org", senha: "12345678" });
    const chamadas = gateway.chamadas["contarTentativa"] ?? [];
    expect(chamadas.map((argumentos) => argumentos[1])).toEqual(["entrar-ip", "entrar-email"]);
    const chaves = chamadas.map((argumentos) => argumentos[2]).filter((chave): chave is Buffer => Buffer.isBuffer(chave));
    expect(chaves).toHaveLength(2);
    for (const chave of chaves) {
      expect(chave).toHaveLength(32);
      expect(chave.toString("latin1")).not.toMatch(/ana|203\.0/);
    }
    expect(chaves[0]?.equals(chaves[1] ?? Buffer.alloc(0))).toBe(false);
  });

  it("o mesmo e-mail com maiúscula ou espaço conta junto", async () => {
    const gateway = comLimite(1);
    expect((await conta.entrar(contexto(gateway), { email: "ana@exemplo.org", senha: "12345678" })).status).toBe(200);
    expect((await conta.entrar({ ...contexto(gateway), ip: "198.51.100.1" }, { email: " ANA@exemplo.org ", senha: "12345678" })).status).toBe(429);
  });

  it("'esqueci' para o mesmo e-mail demais: responde igual a sucesso e não manda mais e-mail", async () => {
    const gateway = comLimite(1);
    const ctx = (ip: string) => ({ ...contexto(gateway), ip });
    expect(await conta.pedirNovaSenha(ctx("198.51.100.1"), { email: "ana@exemplo.org" })).toEqual({ status: 200, corpo: { ok: true } });
    expect(await conta.pedirNovaSenha(ctx("198.51.100.2"), { email: "ana@exemplo.org" })).toEqual({ status: 200, corpo: { ok: true } });
    expect(gateway.chamadas["pedirNovaSenha"]).toHaveLength(1);
  });

  it("criar conta, links do e-mail e convidado também são limitados", async () => {
    const gateway = comLimite(0);
    const ctx = contexto(gateway);
    expect((await conta.cadastrar(ctx, { email: "ana@exemplo.org", senha: "12345678", concordo: true })).status).toBe(429);
    expect((await conta.confirmarEmail(ctx, { tokenHash: "abcdefgh12" })).status).toBe(429);
    expect((await conta.trocarSenhaPeloLink(ctx, { tokenHash: "abcdefgh12", senha: "12345678" })).status).toBe(429);
    expect((await conta.casaDoConvidado(ctx, { codigo: "x" })).status).toBe(429);
    expect(gateway.chamadas["cadastrar"] ?? []).toHaveLength(0);
    expect(gateway.chamadas["confirmarLink"] ?? []).toHaveLength(0);
    expect(gateway.chamadas["casaDoConvite"] ?? []).toHaveLength(0);
  });

  it("banco sem resposta na contagem: não deixa passar (falha fechada)", async () => {
    const gateway = gatewayDeMentira({ contarTentativa: async () => ({ ok: false, erro: "indisponivel" }) });
    expect((await conta.entrar(contexto(gateway), { email: "ana@exemplo.org", senha: "12345678" })).status).toBe(503);
    expect(gateway.chamadas["entrar"] ?? []).toHaveLength(0);
  });
});

describe("rotas da pessoa exigem sessão (pedido do dono, 26/11)", () => {
  it("sem cookie, ou com cookie mexido, ler/gravar casa, convites e apagar conta dão 401 e não tocam no banco", async () => {
    const gateway = gatewayDeMentira();
    const ctx = contexto(gateway);
    const mexido = `${cookieValido().slice(0, -3)}AAA`;
    for (const cookie of [undefined, mexido, "qualquer-coisa"]) {
      expect((await conta.lerCasa(ctx, cookie)).status).toBe(401);
      expect((await conta.gravarCasa(ctx, cookie, { casa: {}, versaoDoFormato: 3, atualizadaEm: null })).status).toBe(401);
      expect((await conta.listarConvites(ctx, cookie)).status).toBe(401);
      expect((await conta.criarConvite(ctx, cookie, {})).status).toBe(401);
      expect((await conta.apagarConvite(ctx, cookie, { id: "11111111-1111-4111-8111-111111111111" })).status).toBe(401);
      expect((await conta.apagarConta(ctx, cookie)).status).toBe(401);
    }
    expect(Object.keys(gateway.chamadas).filter((nome) => nome !== "quemEsta")).toEqual([]);
  });
});

describe("IP para contar tentativas (B4 da seguranca)", () => {
  it("IPv6 conta pela rede /64; IPv4 inteiro; IPv4 dentro de IPv6 vira IPv4", () => {
    expect(redeDoIp("2804:7f0:90b2:8595:d9bc:6c67:2844:42b8")).toBe("2804:7f0:90b2:8595::/64");
    expect(redeDoIp("2804:07f0:90b2:8595::1")).toBe("2804:7f0:90b2:8595::/64");
    expect(redeDoIp("2804::1")).toBe("2804:0:0:0::/64");
    expect(redeDoIp("::ffff:203.0.113.7")).toBe("203.0.113.7");
    expect(redeDoIp(" 203.0.113.7 ")).toBe("203.0.113.7");
  });

  it("dois endereços da mesma rede /64 gastam as mesmas tentativas; redes diferentes, não", () => {
    const a = chaveDaTentativa(SEGREDO, "ip", "2804:7f0:90b2:8595::1");
    const b = chaveDaTentativa(SEGREDO, "ip", "2804:7f0:90b2:8595:ffff:ffff:ffff:ffff");
    const c = chaveDaTentativa(SEGREDO, "ip", "2804:7f0:90b2:8596::1");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});

describe("cifra amarrada ao dono (M1 da seguranca)", () => {  it("a casa da Bia copiada para a linha da Ana não abre", () => {
    const chave = new Uint8Array(32).fill(3);
    const daBia = cifrarCasa({ comodos: [] }, chave, "bia");
    expect(decifrarCasa(daBia, chave, "bia")).toEqual({ comodos: [] });
    expect(decifrarCasa(daBia, chave, "ana")).toBeUndefined();
  });
});

describe("sessão: limite total, sair de todos e registro do 'concordo' (B4, B10)", () => {
  const DIA_S = 24 * 60 * 60;

  it("entrar marca o início da sessão; renovar mantém o início", async () => {
    const gateway = gatewayDeMentira();
    const entrou = await conta.entrar(contexto(gateway), { email: "ana@exemplo.org", senha: "12345678" });
    const cookie = entrou.cookie?.tipo === "gravar" ? entrou.cookie.valor : "";
    expect(decifrarSessao(cookie, SEGREDO)?.inicio).toBe(AGORA_MS / 1000);
    const quase = cookieValido({ ...TOKENS, expiraEm: AGORA_MS / 1000 + 10, inicio: AGORA_MS / 1000 - 5 * DIA_S });
    const lida = await conta.lerCasa(contexto(gateway), quase);
    const renovado = lida.cookie?.tipo === "gravar" ? decifrarSessao(lida.cookie.valor, SEGREDO) : undefined;
    expect(renovado?.renovacao).toBe("renovacao-2");
    expect(renovado?.inicio).toBe(AGORA_MS / 1000 - 5 * DIA_S);
  });

  it("depois de 30 dias desde que entrou, mesmo usando todo dia: sai e pede a senha de novo", async () => {
    const gateway = gatewayDeMentira();
    const velho = cookieValido({ ...TOKENS, inicio: AGORA_MS / 1000 - 31 * DIA_S });
    const resposta = await conta.lerCasa(contexto(gateway), velho);
    expect(resposta).toMatchObject({ status: 401, cookie: { tipo: "apagar" } });
    expect(gateway.chamadas["sair"]).toHaveLength(1);
    expect(gateway.chamadas["lerCasa"] ?? []).toHaveLength(0);
  });

  it("cookie de antes do limite (sem início) continua valendo", async () => {
    const gateway = gatewayDeMentira();
    expect((await conta.lerCasa(contexto(gateway), cookieValido(TOKENS))).status).toBe(200);
  });

  it("sair de todos os aparelhos pede o escopo global; se o Supabase falhar, a pessoa continua na conta", async () => {
    const gateway = gatewayDeMentira();
    const ok = await conta.sair(contexto(gateway), cookieValido(), { todos: true });
    expect(ok).toMatchObject({ status: 200, cookie: { tipo: "apagar" } });
    expect(gateway.chamadas["sair"]?.[0]?.[2]).toBe("global");
    const falhou = gatewayDeMentira({ sair: async () => ({ ok: false, erro: "indisponivel" }) });
    const resposta = await conta.sair(contexto(falhou), cookieValido(), { todos: true });
    expect(resposta.status).toBe(503);
    expect(resposta.cookie).toBeUndefined();
  });

  it("criar conta guarda a versão dos termos e quando a pessoa concordou", async () => {
    const gateway = gatewayDeMentira();
    await conta.cadastrar(contexto(gateway), { email: "ana@exemplo.org", senha: "12345678", concordo: true });
    const { VERSAO_DOS_TERMOS } = await import("@/config/termos");
    expect(gateway.chamadas["cadastrar"]?.[0]?.[4]).toEqual({ versao: VERSAO_DOS_TERMOS, em: new Date(AGORA_MS).toISOString() });
  });
});

describe("métricas anônimas (ADR-009)", () => {
  it("conta só evento da lista e responde 204 sem corpo; nada da casa nem de quem é", async () => {
    const gateway = gatewayDeMentira();
    expect(await metricas.contarUso(contexto(gateway), { evento: "visita" })).toEqual({ status: 204, corpo: {} });
    expect(gateway.chamadas["contarUso"]?.[0]?.slice(1)).toEqual(["visita"]);
    expect((await metricas.contarUso(contexto(gateway), { evento: "inventado" })).status).toBe(400);
    expect(gateway.chamadas["contarUso"]).toHaveLength(1);
  });

  it("a contagem de uso não usa o IP para nada (A1); conta desligada: não conta nada", async () => {
    const gateway = gatewayDeMentira();
    await metricas.contarUso(contexto(gateway), { evento: "visita" });
    expect(gateway.chamadas["contarTentativa"] ?? []).toHaveLength(0);
    const desligada = gatewayDeMentira();
    expect((await metricas.contarUso(contexto(desligada, false), { evento: "visita" })).status).toBe(204);
    expect(desligada.chamadas).toEqual({});
  });

  it("opinião: confere nota, momento e texto (sem telefone ou e-mail) antes do banco", async () => {
    const gateway = gatewayDeMentira();
    expect((await metricas.registrarOpiniao(contexto(gateway), { momento: "painel", nota: 5, texto: "  Ajudou  " })).status).toBe(200);
    expect(gateway.chamadas["registrarOpiniao"]?.[0]?.slice(1)).toEqual(["painel", 5, "Ajudou"]);
    expect((await metricas.registrarOpiniao(contexto(gateway), { momento: "painel", nota: 9 })).status).toBe(400);
    expect((await metricas.registrarOpiniao(contexto(gateway), { momento: "painel", nota: 4, texto: "zap 18 99123 4567" })).status).toBe(400);
    expect(gateway.chamadas["registrarOpiniao"]).toHaveLength(1);
  });

  it("teto de opiniões do dia: responde 429, não 'Obrigado'", async () => {
    const lotado = gatewayDeMentira({ registrarOpiniao: async () => ({ ok: false, erro: "muitas-tentativas" }) });
    expect((await metricas.registrarOpiniao(contexto(lotado), { momento: "painel", nota: 5 })).status).toBe(429);
  });

  it("confirmar o e-mail e criar link contam, mas a falha da contagem não atrapalha", async () => {
    const gateway = gatewayDeMentira({ contarUso: async () => { throw new Error("fora do ar"); } });
    expect((await conta.confirmarEmail(contexto(gateway), { tokenHash: "abcdefgh12" })).status).toBe(200);
  });
});

import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { Contexto, Gateway } from "@/aplicacao/conta.servidor";
import type { TokensDaSessao } from "@/infraestrutura/conta/sessao.servidor";

vi.mock("server-only", () => ({}));

const conta = await import("@/aplicacao/conta.servidor");
const { cifrarSessao, decifrarSessao } = await import("@/infraestrutura/conta/sessao.servidor");

const SEGREDO = new Uint8Array(32).fill(7);
const CONFIG = { urlDoSupabase: "https://exemplo.supabase.co", chaveAnonima: "anon", segredoDaSessao: SEGREDO };
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
    sair: anotar("sair", undefined),
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
  };
  return Object.assign({ ...base, ...trocas }, { chamadas });
}

function contexto(gateway: Gateway, ligada = true): Contexto {
  return { config: ligada ? CONFIG : undefined, gateway, enderecoDoSite: "https://site.exemplo", agora: () => AGORA_MS };
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
    expect(gateway.chamadas["cadastrar"]?.[0]?.slice(1)).toEqual(["ana@exemplo.org", "12345678", "https://site.exemplo"]);
  });

  it("entrar grava o cookie cifrado; senha errada e e-mail sem conta têm a mesma resposta", async () => {
    const certo = await conta.entrar(contexto(gatewayDeMentira()), { email: "ana@exemplo.org", senha: "12345678" });
    expect(certo.status).toBe(200);
    expect(certo.cookie?.tipo).toBe("gravar");
    if (certo.cookie?.tipo === "gravar") expect(decifrarSessao(certo.cookie.valor, SEGREDO)).toEqual(TOKENS);
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

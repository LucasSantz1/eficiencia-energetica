import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/** O que o Supabase de mentira devolve em cada chamada do auth. */
const respostas = vi.hoisted(() => {
  const inicio: { erro: null | { status?: number; code?: string }; gravada: unknown; linha: Record<string, unknown> | null } = { erro: null, gravada: undefined, linha: null };
  return inicio;
});
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      signUp: async () => ({ data: {}, error: respostas.erro }),
      resetPasswordForEmail: async () => ({ data: {}, error: respostas.erro }),
    },
    from: () => ({
      insert: async (linha: unknown) => {
        respostas.gravada = linha;
        return { error: null };
      },
      select: () => ({ maybeSingle: async () => ({ data: respostas.linha, error: null }) }),
    }),
  }),
}));

const gateway = await import("@/infraestrutura/conta/supabase.servidor");
const CONFIG = { urlDoSupabase: "https://x.supabase.co", chaveAnonima: "anon", segredoDaSessao: new Uint8Array(32), segredoDaCasa: new Uint8Array(32).fill(3) };

describe("Supabase: respostas que não revelam quais e-mails têm conta (M1 da seguranca)", () => {
  it("'espere 60 s para outro e-mail' (só acontece com e-mail que TEM conta) responde igual a sucesso", async () => {
    respostas.erro = { status: 429, code: "over_email_send_rate_limit" };
    expect(await gateway.pedirNovaSenha(CONFIG, "ana@exemplo.org", "https://site")).toEqual({ ok: true, valor: null });
    expect(await gateway.cadastrar(CONFIG, "ana@exemplo.org", "12345678", "https://site")).toEqual({ ok: true, valor: null });
  });

  it("o limite de pedidos de todos vira 'muitas tentativas'; Supabase fora do ar vira erro, nunca 'enviamos'", async () => {
    respostas.erro = { status: 429, code: "over_request_rate_limit" };
    expect(await gateway.pedirNovaSenha(CONFIG, "ana@exemplo.org", "https://site")).toEqual({ ok: false, erro: "muitas-tentativas" });
    respostas.erro = { status: 500, code: "unexpected_failure" };
    expect(await gateway.pedirNovaSenha(CONFIG, "ana@exemplo.org", "https://site")).toEqual({ ok: false, erro: "indisponivel" });
  });

  it("senha fraca no cadastro vira mensagem; e-mail que já tem conta responde igual a sucesso", async () => {
    respostas.erro = { status: 422, code: "weak_password" };
    expect(await gateway.cadastrar(CONFIG, "ana@exemplo.org", "12345678", "https://site")).toEqual({ ok: false, erro: "senha-fraca" });
    respostas.erro = { status: 422, code: "user_already_exists" };
    expect(await gateway.cadastrar(CONFIG, "ana@exemplo.org", "12345678", "https://site")).toEqual({ ok: true, valor: null });
  });
});

describe("Supabase: a casa vai cifrada e volta aberta (ADR-008)", () => {
  const CASA = { comodos: [{ nome: "Cozinha" }], residencia: { cidade: "Presidente Prudente" } };

  it("gravar manda só a cifra (e apaga a cópia aberta); ler decifra", async () => {
    await gateway.gravarCasa(CONFIG, "jwt", "dono-1", { dados: CASA, versaoDoFormato: 3 }, undefined);
    const gravada = respostas.gravada;
    expect(gravada).toMatchObject({ dono: "dono-1", dados: null, versao_do_formato: 3 });
    const cifra = typeof gravada === "object" && gravada !== null ? Reflect.get(gravada, "dados_cifrados") : undefined;
    expect(typeof cifra === "string" && cifra.startsWith("v1.")).toBe(true);
    expect(JSON.stringify(gravada)).not.toMatch(/Cozinha|Prudente/);
    respostas.linha = { dados: null, dados_cifrados: cifra, versao_do_formato: 3, atualizada_em: "2026-11-26T12:00:00Z" };
    expect(await gateway.lerCasa(CONFIG, "jwt", "dono-1")).toEqual({ ok: true, valor: { dados: CASA, versaoDoFormato: 3, atualizadaEm: "2026-11-26T12:00:00Z" } });
  });

  it("casa de antes da cifra ainda abre; cifra que não abre vira erro, nunca casa vazia", async () => {
    respostas.linha = { dados: CASA, dados_cifrados: null, versao_do_formato: 3, atualizada_em: "2026-11-26T12:00:00Z" };
    expect(await gateway.lerCasa(CONFIG, "jwt", "dono-1")).toMatchObject({ ok: true, valor: { dados: CASA } });
    respostas.linha = { dados: null, dados_cifrados: "v1.nao-abre", versao_do_formato: 3, atualizada_em: "2026-11-26T12:00:00Z" };
    expect(await gateway.lerCasa(CONFIG, "jwt", "dono-1")).toEqual({ ok: false, erro: "indisponivel" });
  });
});

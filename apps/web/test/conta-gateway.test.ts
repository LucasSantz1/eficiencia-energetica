import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/** O que o Supabase de mentira devolve em cada chamada do auth. */
const respostas = vi.hoisted(() => {
  const inicio: { erro: null | { status?: number; code?: string } } = { erro: null };
  return inicio;
});
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      signUp: async () => ({ data: {}, error: respostas.erro }),
      resetPasswordForEmail: async () => ({ data: {}, error: respostas.erro }),
    },
  }),
}));

const gateway = await import("@/infraestrutura/conta/supabase.servidor");
const CONFIG = { urlDoSupabase: "https://x.supabase.co", chaveAnonima: "anon", segredoDaSessao: new Uint8Array(32) };

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

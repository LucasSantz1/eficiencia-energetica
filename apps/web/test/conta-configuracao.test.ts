import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { configuracaoDaConta } = await import("@/infraestrutura/conta/configuracao.servidor");

const SEGREDO = Buffer.alloc(32, 7).toString("base64");

function jwtCom(role: string): string {
  const parte = (objeto: object) => Buffer.from(JSON.stringify(objeto)).toString("base64url");
  return `${parte({ alg: "HS256", typ: "JWT" })}.${parte({ iss: "supabase", role })}.assinatura`;
}

function comChave(chave: string) {
  vi.stubEnv("SUPABASE_URL", "https://exemplo.supabase.co");
  vi.stubEnv("SUPABASE_ANON_KEY", chave);
  vi.stubEnv("SESSAO_SEGREDO", SEGREDO);
  vi.stubEnv("CASA_SEGREDO", Buffer.alloc(32, 5).toString("base64"));
  return configuracaoDaConta();
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("configuracaoDaConta: qual chave do Supabase vale", () => {
  it("aceita a chave publishable dos projetos novos", () => {
    expect(comChave("sb_publishable_abc123")?.chaveAnonima).toBe("sb_publishable_abc123");
  });

  it("aceita a chave anon antiga", () => {
    expect(comChave(jwtCom("anon"))).toBeDefined();
  });

  it("recusa a chave secreta nova: ela passa por cima da RLS", () => {
    expect(comChave("sb_secret_abc123")).toBeUndefined();
  });

  it("recusa a service_role antiga", () => {
    expect(comChave(jwtCom("service_role"))).toBeUndefined();
  });
});

describe("configuracaoDaConta: chave da casa (ADR-008)", () => {
  function comChaveDaCasa(valor: string | undefined) {
    vi.stubEnv("SUPABASE_URL", "https://exemplo.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "sb_publishable_abc123");
    vi.stubEnv("SESSAO_SEGREDO", SEGREDO);
    if (valor !== undefined) vi.stubEnv("CASA_SEGREDO", valor);
    return configuracaoDaConta();
  }

  it("sem CASA_SEGREDO, a conta fica desligada: nunca grava casa sem cifra", () => {
    expect(comChaveDaCasa(undefined)).toBeUndefined();
  });

  it("recusa chave curta e chave igual à da sessão", () => {
    expect(comChaveDaCasa(Buffer.alloc(16, 5).toString("base64"))).toBeUndefined();
    expect(comChaveDaCasa(SEGREDO)).toBeUndefined();
  });

  it("aceita 32 bytes diferentes da sessão", () => {
    expect(comChaveDaCasa(Buffer.alloc(32, 5).toString("base64"))?.segredoDaCasa).toHaveLength(32);
  });
});

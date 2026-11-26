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

import { describe, expect, it } from "vitest";
import { conferirEmail, conferirNomeDoConvite, conferirSenha, FORMATO_DO_CODIGO_DO_CONVITE } from "../src/conta";

describe("conta (E4)", () => {
  it("e-mail: tira espaços, deixa minúsculo e recusa o que não é e-mail", () => {
    expect(conferirEmail(" Ana@Exemplo.ORG ")).toEqual({ ok: true, valor: "ana@exemplo.org" });
    for (const ruim of ["", "ana", "ana@", "@exemplo.org", "ana@exemplo", "ana @exemplo.org", "ana@exemplo..org", 42, `${"a".repeat(250)}@x.org`]) {
      expect(conferirEmail(ruim).ok, String(ruim)).toBe(false);
    }
  });

  it("senha: 8 caracteres ou mais, até 72 bytes (bcrypt), sem mexer no que foi digitado", () => {
    expect(conferirSenha("1234567").ok).toBe(false);
    expect(conferirSenha(" 12345678 ")).toEqual({ ok: true, valor: " 12345678 " });
    expect(conferirSenha("a".repeat(72)).ok).toBe(true);
    expect(conferirSenha("a".repeat(73)).ok).toBe(false);
    // "ç" tem 2 bytes: 37 deles passam de 72.
    expect(conferirSenha("ç".repeat(37)).ok).toBe(false);
    expect(conferirSenha(undefined).ok).toBe(false);
  });

  it("nome do convite: opcional, até 40 letras, sem quebra de linha", () => {
    expect(conferirNomeDoConvite(undefined)).toEqual({ ok: true, valor: undefined });
    expect(conferirNomeDoConvite("  ")).toEqual({ ok: true, valor: undefined });
    expect(conferirNomeDoConvite("Mãe\nda Ana")).toEqual({ ok: true, valor: "Mãe da Ana" });
    expect(conferirNomeDoConvite("a".repeat(41)).ok).toBe(false);
    expect(conferirNomeDoConvite({}).ok).toBe(false);
  });

  it("código do convite: 43 caracteres base64url", () => {
    expect(FORMATO_DO_CODIGO_DO_CONVITE.test("a".repeat(43))).toBe(true);
    expect(FORMATO_DO_CODIGO_DO_CONVITE.test(`${"a".repeat(42)}=`)).toBe(false);
    expect(FORMATO_DO_CODIGO_DO_CONVITE.test("a".repeat(44))).toBe(false);
  });
});

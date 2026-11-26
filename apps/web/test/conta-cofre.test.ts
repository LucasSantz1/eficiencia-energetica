import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { cifrarCasa, decifrarCasa } = await import("@/infraestrutura/conta/cofre.servidor");

const CHAVE = new Uint8Array(32).fill(3);
const CASA = { residencia: { cidade: "Presidente Prudente" }, comodos: [{ nome: "Cozinha" }] };

describe("casa cifrada no banco (ADR-008)", () => {
  it("volta igual com a mesma chave, e o texto guardado não mostra nada da casa", () => {
    const cifra = cifrarCasa(CASA, CHAVE);
    expect(cifra.startsWith("v1.")).toBe(true);
    expect(cifra).not.toMatch(/Prudente|Cozinha/);
    expect(Buffer.from(cifra.slice(3), "base64url").toString("latin1")).not.toMatch(/Prudente|Cozinha/);
    expect(decifrarCasa(cifra, CHAVE)).toEqual(CASA);
  });

  it("cada gravação sai diferente (IV aleatório): o banco não revela casas iguais", () => {
    expect(cifrarCasa(CASA, CHAVE)).not.toBe(cifrarCasa(CASA, CHAVE));
  });

  it("não abre com outra chave, mexida, cortada ou sem o prefixo", () => {
    const cifra = cifrarCasa(CASA, CHAVE);
    const mexida = `${cifra.slice(0, -2)}${cifra.at(-2) === "A" ? "B" : "A"}${cifra.at(-1)}`;
    expect(decifrarCasa(cifra, new Uint8Array(32).fill(4))).toBeUndefined();
    expect(decifrarCasa(mexida, CHAVE)).toBeUndefined();
    expect(decifrarCasa(cifra.slice(0, 20), CHAVE)).toBeUndefined();
    expect(decifrarCasa(cifra.slice(3), CHAVE)).toBeUndefined();
    expect(decifrarCasa('{"comodos":[]}', CHAVE)).toBeUndefined();
  });
});

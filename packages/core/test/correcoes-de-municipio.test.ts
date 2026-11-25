import { describe, expect, it } from "vitest";
import { CODIGOS_TROCADOS, trocaPorCodigoTrocado } from "../src/correcoes-de-municipio";

describe("trocaPorCodigoTrocado (HIS-206, critério 5)", () => {
  it("Nova Santa Rita (PI) com a CERTAJA passa para a Equatorial Piauí", () => {
    expect(trocaPorCodigoTrocado({ municipioIbge: 2207959, distribuidoraId: "certaja" })).toEqual({ de: "certaja", para: "equatorial-pi" });
  });
  it("a mesma CERTAJA na cidade certa (Nova Santa Rita, RS) não troca", () => {
    expect(trocaPorCodigoTrocado({ municipioIbge: 4313375, distribuidoraId: "certaja" })).toBeUndefined();
  });
  it("depois da troca não troca de novo (sem laço)", () => {
    expect(trocaPorCodigoTrocado({ municipioIbge: 2207959, distribuidoraId: "equatorial-pi" })).toBeUndefined();
  });
  it("a tabela não tem a mesma ligação duas vezes", () => {
    const chaves = CODIGOS_TROCADOS.map((c) => `${c.distribuidora}:${c.publicado}`);
    expect(new Set(chaves).size).toBe(chaves.length);
  });
});

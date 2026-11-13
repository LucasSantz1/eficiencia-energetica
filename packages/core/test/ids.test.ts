import { describe, expect, it } from "vitest";
import { idDaSigla } from "../src/ids";

describe("idDaSigla: a regra única do id publicado (HIS-111, h8)", () => {
  it("tira acentos, troca o resto por hífen e corta as pontas", () => {
    expect(idDaSigla("RGE SUL")).toBe("rge-sul");
    expect(idDaSigla("CEMIG-D")).toBe("cemig-d");
    expect(idDaSigla("Âmbar Roraima")).toBe("ambar-roraima");
    expect(idDaSigla("Neoenergia Brasília")).toBe("neoenergia-brasilia");
    expect(idDaSigla("  CPFL  Santa Cruz (SP)  ")).toBe("cpfl-santa-cruz-sp");
    expect(idDaSigla("--X--")).toBe("x");
  });

  it("o resultado cabe no formato do V8 ou é vazio", () => {
    for (const sigla of ["", "!!!", "ÇÃO", "a\n::add-mask::b", "__proto__", "Coop. Elétrica"]) {
      const id = idDaSigla(sigla);
      expect(id === "" || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)).toBe(true);
    }
  });
});

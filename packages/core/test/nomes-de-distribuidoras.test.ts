import { describe, expect, it } from "vitest";
import { nomeDaDistribuidora } from "../src";

describe("nomeDaDistribuidora (HIS-205)", () => {
  it("usa o nome da conta quando ele é diferente da sigla", () => {
    expect(nomeDaDistribuidora("ELFSM")).toBe("Santa Maria");
    expect(nomeDaDistribuidora("EFLUL")).toBe("Força e Luz Urussanga");
    expect(nomeDaDistribuidora("MUXENERGIA")).toBe("Mux Energia");
  });
  it("tira os sufixos da ANEEL que não aparecem na conta", () => {
    expect(nomeDaDistribuidora("CERAL-DIS")).toBe("CERAL");
    expect(nomeDaDistribuidora("CRELUZ-D")).toBe("CRELUZ");
    expect(nomeDaDistribuidora("CERSAD DISTRIBUI")).toBe("CERSAD");
    expect(nomeDaDistribuidora("CASTRO-DIS")).toBe("CASTRO");
  });
  it("não mexe em sigla que só termina parecido", () => {
    expect(nomeDaDistribuidora("CERAL ANITÁPOLIS")).toBe("CERAL ANITÁPOLIS");
    expect(nomeDaDistribuidora("DEMEI")).toBe("DEMEI");
    expect(nomeDaDistribuidora("CERCOS")).toBe("CERCOS");
  });
});

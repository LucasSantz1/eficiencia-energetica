import { describe, expect, it } from "vitest";
import {
  avaliarTarifaSocial,
  convocacaoAberta,
  salarioMinimoEmVigor,
  SALARIO_MINIMO,
  valorDaEnergiaDeGracaNoExemplo,
  type CasoDaTarifaSocial,
  type RespostasDaTarifaSocial,
} from "../src/tarifa-social";

// Casos C1–C13 da HIS-103 (dominio-energia), com o salário mínimo de 2026 (R$ 1.621,00). Renda em centavos.
const semBpc = (pessoas: number, reais: number, extra: Partial<RespostasDaTarifaSocial> = {}): RespostasDaTarifaSocial => ({
  bpc: "nao",
  cadUnico: "sim",
  pessoas,
  rendaCentavos: Math.round(reais * 100),
  saude: "nao",
  contaNoNome: "sim",
  ...extra,
});

const caso = (respostas: RespostasDaTarifaSocial): CasoDaTarifaSocial | "invalido" => {
  const resultado = avaliarTarifaSocial(respostas);
  return resultado.tipo === "invalido" ? "invalido" : resultado.caso;
};

describe("casos C1–C13 (HIS-103)", () => {
  it.each([
    ["C1: 4 pessoas, R$ 3.000,00 (750,00 por pessoa)", semBpc(4, 3000), "A"],
    ["C2: 4 pessoas, R$ 3.242,00 (810,50: meio salário mínimo, inclusive)", semBpc(4, 3242), "A"],
    ["C3: 4 pessoas, R$ 3.242,04 (810,51)", semBpc(4, 3242.04), "B"],
    ["C4: 3 pessoas, R$ 4.863,00 (1.621,00: um salário mínimo, inclusive)", semBpc(3, 4863), "B"],
    ["C5: 3 pessoas, R$ 4.863,03, sem saúde", semBpc(3, 4863.03), "D"],
    ["C6: 1 pessoa, R$ 1.621,00, recebe BPC", { ...semBpc(1, 1621), bpc: "sim" }, "A"],
    ["C7: 2 pessoas, R$ 4.000,00, saúde = sim", semBpc(2, 4000, { saude: "sim" }), "C"],
    ["C8: 2 pessoas, R$ 4.863,00, saúde = sim (3 salários mínimos, inclusive)", semBpc(2, 4863, { saude: "sim" }), "C"],
    ["C9: 2 pessoas, R$ 4.863,01, saúde = sim", semBpc(2, 4863.01, { saude: "sim" }), "D"],
    ["C10: 3 pessoas, R$ 2.000,00 (o Bolsa Família de R$ 600 não entra)", semBpc(3, 2000), "A"],
    ["C11: 2 pessoas, R$ 1.000,00 + BPC (BPC = sim já dá A)", { ...semBpc(2, 1000 + 1621), bpc: "sim" }, "A"],
  ] satisfies [string, RespostasDaTarifaSocial, CasoDaTarifaSocial][])("%s", (_nome, respostas, esperado) => {
    expect(caso(respostas)).toBe(esperado);
  });

  it("C12: 2 pessoas, R$ 1.200,00, sem CadÚnico e conta em outro nome: A com os dois avisos", () => {
    expect(avaliarTarifaSocial(semBpc(2, 1200, { cadUnico: "nao", contaNoNome: "nao" }))).toEqual({
      tipo: "resultado",
      caso: "A",
      comparacao: { base: "por-pessoa", rendaCentavos: 60_000, limiteCentavos: 81_050, salariosMinimos: 0.5 },
      fazerCadUnico: true,
      trocarNomeDaConta: true,
    });
  });

  it.each([
    ["0 pessoas", semBpc(0, 1000)],
    ["renda negativa", semBpc(3, -1)],
    ["21 pessoas", semBpc(21, 1000)],
    ["renda acima de R$ 100.000", semBpc(3, 100_000.01)],
    ["pessoas quebradas", semBpc(2.5, 1000)],
    ["meio centavo", { ...semBpc(2, 0), rendaCentavos: 0.5 }],
    ["sem a resposta da saúde", { ...semBpc(2, 1000), saude: undefined }],
  ] satisfies [string, RespostasDaTarifaSocial][])("C13: %s não calcula", (_nome, respostas) => {
    expect(caso(respostas)).toBe("invalido");
  });
});

describe("avisos e comparação", () => {
  it("\"Não sei\" no CadÚnico e na conta também pede o CadÚnico e a troca do nome", () => {
    const resultado = avaliarTarifaSocial(semBpc(4, 3000, { cadUnico: "nao-sei", contaNoNome: "nao-sei" }));
    expect(resultado).toMatchObject({ fazerCadUnico: true, trocarNomeDaConta: true });
  });

  it("no caso D não há aviso de CadÚnico nem de nome da conta", () => {
    expect(avaliarTarifaSocial(semBpc(3, 4863.03, { cadUnico: "nao", contaNoNome: "nao" }))).toMatchObject({ caso: "D", fazerCadUnico: false, trocarNomeDaConta: false });
  });

  it("C não passa na frente de A, mas passa na frente de B (a Tarifa Social é o desconto maior)", () => {
    expect(caso(semBpc(4, 3000, { saude: "sim" }))).toBe("A");
    expect(caso(semBpc(3, 3000, { saude: "sim" }))).toBe("C");
  });

  it("com BPC, a renda não é comparada; no C, a comparação é com 3 salários mínimos da renda total", () => {
    expect(avaliarTarifaSocial({ bpc: "sim", contaNoNome: "sim" })).toMatchObject({ caso: "A", comparacao: undefined, fazerCadUnico: true });
    expect(avaliarTarifaSocial(semBpc(2, 4000, { saude: "sim" }))).toMatchObject({ comparacao: { base: "total", rendaCentavos: 400_000, limiteCentavos: 486_300, salariosMinimos: 3 } });
  });
});

describe("vigência do salário mínimo e prazo da convocação", () => {
  it("R$ 1.621,00 vale de 01/01/2026 a 31/12/2026 (Decreto 12.797/2025)", () => {
    expect(SALARIO_MINIMO.centavos).toBe(162_100);
    expect(["2025-12-31", "2026-01-01", "2026-11-17", "2026-12-31", "2027-01-01"].map(salarioMinimoEmVigor)).toEqual([false, true, true, true, false]);
  });

  it("a convocação vai até 31/12/2026", () => {
    expect([convocacaoAberta("2026-12-31"), convocacaoAberta("2027-01-01")]).toEqual([true, false]);
  });

  it("exemplo do resultado A: 80 kWh × R$ 0,80 = R$ 64,00", () => {
    expect(valorDaEnergiaDeGracaNoExemplo()).toBeCloseTo(64, 9);
  });
});

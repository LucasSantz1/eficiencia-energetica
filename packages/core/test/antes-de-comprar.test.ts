import { describe, expect, it } from "vitest";
import { impactoDaCompra, type Aparelho, type PrecoKwh } from "../src";

const PRECO: PrecoKwh = { valor: 1, origem: "aneel", adicionalBandeira: 0, incluiImpostos: false };

/** Aparelho de N kWh por mês: N × 1000 W por 1 hora por dia, 30 dias... aqui pelo kWh da etiqueta, para a conta ser exata. */
function deKwh(kwhMes: number, id = "a"): Aparelho {
  return { id, comodoId: "sala", catalogoId: "geladeira", nome: "Aparelho", quantidade: 1, potenciaW: 100, minutosPorDia: 0, diasPorSemana: 7, kwhMesInformado: kwhMes };
}
const novo = (kwhMes: number) => {
  const { id: _id, comodoId: _comodo, ...resto } = deKwh(kwhMes);
  return resto;
};

describe("impactoDaCompra", () => {
  it("sem benefício e acima do mínimo: a conta sobe o consumo do aparelho × o preço", () => {
    const r = impactoDaCompra([deKwh(150)], novo(40), { beneficio: "nenhum", ligacao: "monofasica" }, PRECO);
    expect(r.kwhDoAparelho).toBeCloseTo(40, 6);
    expect(r.aMaisPorMes).toBeCloseTo(40, 6);
    expect(r.aMaisPorAno).toBeCloseTo(480, 6);
    expect(r.contaDepois - r.contaAntes).toBeCloseTo(40, 6);
  });

  it("casa abaixo do consumo mínimo: o aparelho só pesa no que passa do mínimo (monofásica, 30 kWh)", () => {
    // 10 kWh hoje (paga o mínimo de 30); com +40, vai a 50: paga 20 a mais, não 40.
    const r = impactoDaCompra([deKwh(10)], novo(40), { beneficio: "nenhum", ligacao: "monofasica" }, PRECO);
    expect(r.aMaisPorMes).toBeCloseTo(20, 6);
  });

  it("Tarifa Social: dentro dos 80 kWh de graça, o aparelho não muda a conta", () => {
    const r = impactoDaCompra([deKwh(30)], novo(40), { beneficio: "tarifa-social", ligacao: "monofasica" }, PRECO);
    expect(r.aMaisPorMes).toBe(0);
  });

  it("Tarifa Social: o que passa dos 80 kWh é cobrado", () => {
    const r = impactoDaCompra([deKwh(70)], novo(40), { beneficio: "tarifa-social", ligacao: "monofasica" }, PRECO);
    expect(r.aMaisPorMes).toBeCloseTo(30, 6);
  });
});

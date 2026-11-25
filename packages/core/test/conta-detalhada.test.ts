import { describe, expect, it } from "vitest";
import { estimarConta, type PrecoKwh, type Residencia } from "../src";
import { detalharConta } from "../src/conta-detalhada";

type Res = Pick<Residencia, "beneficio" | "ligacao" | "contaReferencia">;
const daAneel: PrecoKwh = { valor: 0.83, origem: "aneel", adicionalBandeira: 0.03, incluiImpostos: false };
const daConta: PrecoKwh = { valor: 0.8, origem: "conta", adicionalBandeira: 0, incluiImpostos: true };
const mono: Res = { beneficio: "nenhum", ligacao: "monofasica" };

const soma = (kwh: number, r: Res, p: PrecoKwh) => {
  const d = detalharConta(estimarConta(kwh, r, p));
  return { d, soma: d.linhas.reduce((s, l) => s + l.centavos, 0) };
};

describe("detalharConta (HIS-201)", () => {
  it("tarifa da ANEEL: energia e bandeira separadas, somando o total", () => {
    const { d, soma: s } = soma(200, mono, daAneel);
    expect(d.linhas.map((l) => [l.tipo, l.centavos])).toEqual([
      ["energia", 16_000],
      ["bandeira", 600],
    ]);
    expect(s).toBe(d.totalCentavos);
    expect(d.precoDaConta).toBe(false);
  });

  it("preço da conta de luz: uma linha de energia (já com impostos e bandeira) e a iluminação pública", () => {
    const { d, soma: s } = soma(200, { ...mono, contaReferencia: { kwh: 200, valor: 172, iluminacaoPublica: 12 } }, daConta);
    expect(d.linhas.map((l) => l.tipo)).toEqual(["energia", "iluminacao"]);
    expect(s).toBe(d.totalCentavos);
    expect(d.totalCentavos).toBe(17_200);
  });

  it("abaixo do mínimo: a diferença até o mínimo aparece em linha própria", () => {
    const { d, soma: s } = soma(10, mono, daAneel);
    const minimo = d.linhas.find((l) => l.tipo === "minimo");
    expect(minimo).toMatchObject({ kwh: 20, precoKwh: 0.83, centavos: 1_660 });
    expect(s).toBe(d.totalCentavos);
  });

  it("Tarifa Social: o desconto dos primeiros 80 kWh entra negativo e a soma bate", () => {
    const { d, soma: s } = soma(150, { beneficio: "tarifa-social", ligacao: "monofasica" }, daAneel);
    expect(d.linhas.find((l) => l.tipo === "tarifa-social")?.centavos).toBe(-6_640);
    expect(s).toBe(d.totalCentavos);
  });

  it("arredondamento: as linhas sempre somam o total da tela, centavo a centavo", () => {
    for (const kwh of [33.333, 77.777, 101.005, 0.5]) {
      const { d, soma: s } = soma(kwh, mono, { ...daAneel, valor: 0.91237, adicionalBandeira: 0.04463 });
      expect(s).toBe(d.totalCentavos);
    }
  });
});

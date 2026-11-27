import { describe, expect, it } from "vitest";
import { type BandeiraMes, type ContaMensal } from "../src";
import { adicionalDaConta, contaPareceAlta, mesAnterior, motivosDaContaAlta } from "../src/conta-alta";

const conta = (competencia: string, kwh: number, valor: number): ContaMensal => ({ id: competencia, competencia, kwh, valor });
const bandeira = (competencia: string, b: BandeiraMes["bandeira"], adicionalKwh: number): BandeiraMes => ({ competencia, bandeira: b, nome: b, adicionalKwh });

const VERDES = [bandeira("2026-08", "verde", 0), bandeira("2026-09", "verde", 0), bandeira("2026-10", "verde", 0), bandeira("2026-11", "verde", 0)];

describe("mesAnterior", () => {
  it("volta um mês, virando o ano em janeiro", () => {
    expect(mesAnterior("2026-11")).toBe("2026-10");
    expect(mesAnterior("2026-01")).toBe("2025-12");
  });
});

describe("contaPareceAlta", () => {
  it("15% acima da anterior, ou 25% acima da estimativa", () => {
    expect(contaPareceAlta(conta("2026-11", 200, 230), conta("2026-10", 200, 200), undefined)).toBe(true);
    expect(contaPareceAlta(conta("2026-11", 200, 220), conta("2026-10", 200, 200), undefined)).toBe(false);
    expect(contaPareceAlta(conta("2026-11", 250, 200), undefined, 200)).toBe(true);
    expect(contaPareceAlta(conta("2026-11", 240, 200), undefined, 200)).toBe(false);
    expect(contaPareceAlta(conta("2026-11", 240, 200), undefined, undefined)).toBe(false);
  });
});

describe("adicionalDaConta", () => {
  it("é a média do adicional do mês da conta e do anterior (dias meio a meio)", () => {
    const b = [bandeira("2026-10", "verde", 0), bandeira("2026-11", "vermelha-1", 0.04463)];
    expect(adicionalDaConta(b, "2026-11")?.adicionalKwh).toBeCloseTo(0.022315, 6);
    expect(adicionalDaConta(b, "2026-12")?.adicionalKwh).toBeCloseTo(0.04463, 6);
    expect(adicionalDaConta(b, "2025-01")).toBeUndefined();
  });
});

describe("motivosDaContaAlta", () => {
  it("consumo subiu: motivo forte, com os kWh a mais e quanto custaram; no verão, lembra do calor", () => {
    const motivos = motivosDaContaAlta({ conta: conta("2027-01", 260, 260), anterior: conta("2026-12", 200, 200), bandeiras: VERDES });
    expect(motivos.map((m) => m.id)).toEqual(["consumo-subiu", "calor"]);
    expect(motivos[0]?.forca).toBe("forte");
    expect(motivos[0]?.valorEstimado).toBeCloseTo(60, 6);
    expect(motivos[0]?.texto).toContain("60 kWh a mais");
  });

  it("variação pequena de consumo não vira motivo", () => {
    expect(motivosDaContaAlta({ conta: conta("2026-11", 215, 215), anterior: conta("2026-10", 200, 200), bandeiras: VERDES })).toEqual([]);
  });

  it("mesmo consumo, kWh mais caro: 'o preço subiu, não o seu consumo'", () => {
    const motivos = motivosDaContaAlta({ conta: conta("2026-11", 200, 240), anterior: conta("2026-10", 200, 200), bandeiras: VERDES });
    expect(motivos.map((m) => m.id)).toEqual(["preco-subiu"]);
    expect(motivos[0]?.valorEstimado).toBeCloseTo(40, 6);
  });

  it("bandeira vermelha nos meses da conta, mais cara que na anterior: forte, com o valor sem impostos", () => {
    const b = [...VERDES.filter((x) => x.competencia < "2026-10"), bandeira("2026-10", "vermelha-1", 0.04), bandeira("2026-11", "vermelha-1", 0.04)];
    const motivos = motivosDaContaAlta({ conta: conta("2026-11", 200, 230), anterior: conta("2026-09", 200, 200), bandeiras: b });
    const daBandeira = motivos.find((m) => m.id === "bandeira");
    expect(daBandeira?.forca).toBe("forte");
    expect(daBandeira?.valorEstimado).toBeCloseTo(8, 6);
    expect(daBandeira?.texto).toContain("sem os impostos");
  });

  it("bandeira igual à da anterior: só 'possível'", () => {
    const b = [bandeira("2026-09", "amarela", 0.0188), bandeira("2026-10", "amarela", 0.0188), bandeira("2026-11", "amarela", 0.0188)];
    const motivos = motivosDaContaAlta({ conta: conta("2026-11", 200, 200), anterior: conta("2026-10", 200, 200), bandeiras: b });
    expect(motivos.find((m) => m.id === "bandeira")?.forca).toBe("possivel");
  });

  it("mais dias de leitura: os dias a mais em kWh e em reais", () => {
    const motivos = motivosDaContaAlta({ conta: conta("2026-11", 330, 330), bandeiras: VERDES, dias: 33 });
    expect(motivos).toHaveLength(1);
    expect(motivos[0]?.id).toBe("mais-dias");
    expect(motivos[0]?.forca).toBe("forte");
    expect(motivos[0]?.valorEstimado).toBeCloseTo(30, 6);
    expect(motivos[0]?.texto).not.toContain("não pode cobrar");
    expect(motivosDaContaAlta({ conta: conta("2026-11", 330, 330), bandeiras: VERDES, dias: 30 })).toEqual([]);
  });

  it("mais de 33 dias: avisa que a cobrança é limitada a 33 (REN 1.000/2021, art. 285)", () => {
    const [motivo] = motivosDaContaAlta({ conta: conta("2026-11", 340, 340), bandeiras: VERDES, dias: 34 });
    expect(motivo?.texto).toContain("não pode cobrar mais de 33 dias");
  });

  it("acima do que a casa explica: 'possível', e aponta o teste do relógio", () => {
    const motivos = motivosDaContaAlta({ conta: conta("2026-11", 300, 300), estimativaKwh: 200, bandeiras: VERDES });
    expect(motivos.map((m) => m.id)).toEqual(["acima-da-estimativa"]);
    expect(motivos[0]?.texto).toContain("teste do relógio");
  });

  it("os fortes vêm antes, e entre eles o que pesou mais em reais", () => {
    const motivos = motivosDaContaAlta({
      conta: conta("2026-11", 330, 330),
      anterior: conta("2026-10", 250, 250),
      estimativaKwh: 200,
      bandeiras: VERDES,
      dias: 33,
    });
    expect(motivos.map((m) => m.id)).toEqual(["consumo-subiu", "mais-dias", "acima-da-estimativa"]);
  });

  it("conta de 0 kWh não quebra nem inventa preço", () => {
    expect(() => motivosDaContaAlta({ conta: conta("2026-11", 0, 50), anterior: conta("2026-10", 0, 40), bandeiras: VERDES, dias: 33 })).not.toThrow();
  });
});

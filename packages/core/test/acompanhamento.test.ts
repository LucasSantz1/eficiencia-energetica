import { describe, expect, it } from "vitest";
import { mediaDasContas } from "../src/acompanhamento";

describe("mediaDasContas", () => {
  it("sem contas não há média", () => {
    expect(mediaDasContas([])).toBeUndefined();
  });
  it("o preço médio pesa pelo consumo: total pago ÷ total de kWh", () => {
    const m = mediaDasContas([
      { id: "a", competencia: "2026-09", kwh: 100, valor: 100 },
      { id: "b", competencia: "2026-10", kwh: 300, valor: 180 },
    ]);
    expect(m?.kwhMes).toBe(200);
    expect(m?.valorMes).toBe(140);
    expect(m?.precoKwh).toBeCloseTo(0.7, 10);
  });
});

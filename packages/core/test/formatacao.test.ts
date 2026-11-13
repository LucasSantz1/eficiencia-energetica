import { describe, expect, it } from "vitest";
import { formatarQuantidade } from "../src/formatacao";

describe("formatarQuantidade", () => {
  it("usa ponto de milhar e não mostra casas (D-3a-3: 'Tiramos 9.500 aparelhos')", () => {
    expect(formatarQuantidade(9500)).toBe("9.500");
    expect(formatarQuantidade(2)).toBe("2");
    expect(formatarQuantidade(1_000_000)).toBe("1.000.000");
  });

  it("número que não é finito vira 0, sem NaN na tela", () => {
    expect(formatarQuantidade(Number.NaN)).toBe("0");
    expect(formatarQuantidade(Number.POSITIVE_INFINITY)).toBe("0");
  });
});

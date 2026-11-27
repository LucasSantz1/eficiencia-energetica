import { describe, expect, it } from "vitest";
import { conferirOpiniao, ehEventoDeUso, faixaDaEstimativa } from "../src/metricas";

describe("métricas (E12, ADR-009)", () => {
  it("só eventos da lista", () => {
    expect(ehEventoDeUso("visita")).toBe(true);
    expect(ehEventoDeUso("qualquer")).toBe(false);
    expect(ehEventoDeUso(1)).toBe(false);
  });

  it("opinião: nota de 1 a 5, momento da lista, texto limpo e opcional", () => {
    expect(conferirOpiniao("painel", 5, "  Gostei\nmuito  ")).toEqual({ ok: true, momento: "painel", nota: 5, texto: "Gostei muito" });
    expect(conferirOpiniao("dica", 3, "   ")).toEqual({ ok: true, momento: "dica", nota: 3, texto: undefined });
    expect(conferirOpiniao("dica", 3, undefined)).toMatchObject({ ok: true, texto: undefined });
    expect(conferirOpiniao("painel", 0, "")).toMatchObject({ ok: false });
    expect(conferirOpiniao("painel", 4.5, "")).toMatchObject({ ok: false });
    expect(conferirOpiniao("outro", 4, "")).toMatchObject({ ok: false });
    expect(conferirOpiniao("painel", 4, "a".repeat(281))).toMatchObject({ ok: false });
  });

  it("opinião sem fórmula de planilha, caractere invisível nem troca de direção", () => {
    expect(conferirOpiniao("painel", 4, "=HYPERLINK(1)")).toMatchObject({ ok: true, texto: "HYPERLINK(1)" });
    expect(conferirOpiniao("painel", 4, "- bom")).toMatchObject({ ok: true, texto: "bom" });
    expect(conferirOpiniao("painel", 4, "oi\u202exyz\u200b")).toMatchObject({ ok: true, texto: "oixyz" });
    expect(conferirOpiniao("painel", 4, "a\u0085b")).toMatchObject({ ok: true, texto: "a b" });
  });

  it("opinião não guarda telefone nem e-mail", () => {
    expect(conferirOpiniao("painel", 4, "me liga 18 99123-4567")).toMatchObject({ ok: false });
    expect(conferirOpiniao("painel", 4, "ana@exemplo.org")).toMatchObject({ ok: false });
    expect(conferirOpiniao("painel", 4, "paguei 150 reais e gastei 120 kWh")).toMatchObject({ ok: true });
  });

  it("faixa da estimativa: até 10%, até 25% e mais", () => {
    expect(faixaDaEstimativa(100, 95)).toBe("estimativa-perto");
    expect(faixaDaEstimativa(100, 80)).toBe("estimativa-media");
    expect(faixaDaEstimativa(100, 60)).toBe("estimativa-longe");
    expect(faixaDaEstimativa(0, 60)).toBeUndefined();
    expect(faixaDaEstimativa(100, 0)).toBeUndefined();
  });
});

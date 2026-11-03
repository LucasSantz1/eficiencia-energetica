import { describe, expect, it } from "vitest";
import {
  alertaDaLeitura,
  consumoDaCasaForaDoComum,
  consumoMensalKwh,
  KWH_POR_DIA_ENTRE_LEITURAS,
  LIMITES,
  maiorConsumoDeEtiquetaDoCatalogoKwh,
  periodosDeLeitura,
  potenciaDoChuveiroMaisForteW,
  precoDaContaForaDoComum,
  precoKwh,
  validarFaixa,
  type Faixa,
  type LeituraRelogio,
} from "../src";

const leitura = (id: string, data: string, valorKwh: number): LeituraRelogio => ({ id, data, valorKwh });

describe("bordas de cada faixa (limite, limite + 1, NaN, Infinity)", () => {
  const faixas: [string, Faixa][] = Object.entries(LIMITES);

  it.each(faixas)("%s", (_nome, faixa) => {
    const dentro = (valor: number) => expect(validarFaixa(faixa, valor)).not.toBe("fora");
    const fora = (valor: number) => expect(validarFaixa(faixa, valor)).toBe("fora");

    if (faixa.minExclusivo) fora(faixa.min);
    else dentro(faixa.min);
    dentro(faixa.max);
    fora(faixa.max + 1);
    fora(faixa.min - 1);
    fora(Number.NaN);
    fora(Number.POSITIVE_INFINITY);
    fora(Number.NEGATIVE_INFINITY);
    if (faixa.inteiro) fora(faixa.max - 0.5);
    if (faixa.alerta !== undefined) {
      expect(validarFaixa(faixa, faixa.alerta)).toBe("ok");
      expect(validarFaixa(faixa, faixa.alerta + 1)).toBe("alerta");
    }
  });

  it("dinheiro aceita até 2 casas, sem cair no erro do ponto flutuante", () => {
    expect(validarFaixa(LIMITES.contaValorAcompanhamento, 135.9)).toBe("ok");
    expect(validarFaixa(LIMITES.contaValorAcompanhamento, 0.29)).toBe("ok");
    expect(validarFaixa(LIMITES.contaValorAcompanhamento, 199_999.99)).toBe("alerta");
    expect(validarFaixa(LIMITES.contaValorAcompanhamento, 135.905)).toBe("fora");
  });
});

describe("casos de negócio do dominio-energia (1 a 23)", () => {
  it("1 a 4: potência", () => {
    for (const v of [0, -5, Number.NaN, 75_001]) expect(validarFaixa(LIMITES.potenciaW, v)).toBe("fora");
    for (const v of [1, 10_000]) expect(validarFaixa(LIMITES.potenciaW, v)).toBe("ok");
    for (const v of [10_001, 75_000]) expect(validarFaixa(LIMITES.potenciaW, v)).toBe("alerta");
  });

  it("5: chuveiro com um zero a mais pede alerta de potência, mas não chega ao alerta da casa", () => {
    expect(validarFaixa(LIMITES.potenciaW, 55_000)).toBe("alerta");
    const kwh = consumoMensalKwh({ potenciaW: 55_000, minutosPorDia: 32, diasPorSemana: 7, quantidade: 1 });
    expect(kwh).toBeCloseTo(880, 6);
    expect(consumoDaCasaForaDoComum(kwh)).toBe(false);
  });

  it("6: `outro` de 10.000 W por 1 hora todo dia dá 300 kWh, sem alerta", () => {
    expect(validarFaixa(LIMITES.potenciaW, 10_000)).toBe("ok");
    const kwh = consumoMensalKwh({ potenciaW: 10_000, minutosPorDia: 60, diasPorSemana: 7, quantidade: 1 });
    expect(kwh).toBeCloseTo(300, 6);
    expect(consumoDaCasaForaDoComum(kwh)).toBe(false);
  });

  it("7: minutos por dia", () => {
    expect([0, 1, 1_440, 1_441].map((v) => validarFaixa(LIMITES.minutosPorDia, v))).toEqual(["fora", "ok", "ok", "fora"]);
  });

  it("8: dias por semana, com a fração 7/30", () => {
    expect([0.2, 7 / 30, 7, 7.01].map((v) => validarFaixa(LIMITES.diasPorSemana, v))).toEqual(["fora", "ok", "ok", "fora"]);
    expect(validarFaixa(LIMITES.diasPorSemana, (2 * 7) / 30)).toBe("ok");
  });

  it("9: banho 20 × 60 aceita (1.200 minutos); 21 banhos não", () => {
    expect(validarFaixa(LIMITES.banhosPorDia, 20)).toBe("ok");
    expect(validarFaixa(LIMITES.minutosPorBanho, 60)).toBe("ok");
    expect(validarFaixa(LIMITES.minutosPorDia, 20 * 60)).toBe("ok");
    expect(validarFaixa(LIMITES.banhosPorDia, 21)).toBe("fora");
  });

  it("11: quantidade", () => {
    expect([0, 2.5, 61, 60].map((v) => validarFaixa(LIMITES.quantidade, v))).toEqual(["fora", "fora", "fora", "ok"]);
  });

  it("12: consumo da etiqueta", () => {
    expect([0, 0.1, 150, 150.1, 300, 300.1].map((v) => validarFaixa(LIMITES.kwhMesInformado, v))).toEqual(["fora", "ok", "ok", "alerta", "alerta", "fora"]);
  });

  it("13 a 15: preço implícito da conta", () => {
    expect(precoDaContaForaDoComum({ kwh: 150, valor: 135.9 }, "nenhum")).toBeUndefined();
    expect(precoDaContaForaDoComum({ kwh: 150, valor: 1_359 }, "nenhum")).toBeCloseTo(9.06, 6);
    expect(precoDaContaForaDoComum({ kwh: 150, valor: 13.59 }, "nao-sei")).toBeCloseTo(0.0906, 6);
  });

  it("16: na Tarifa Social o alerta de preço não vale, e a calibração divide só o que foi cobrado", () => {
    expect(precoDaContaForaDoComum({ kwh: 100, valor: 15 }, "tarifa-social")).toBeUndefined();
    expect(precoKwh({ contaReferencia: { kwh: 100, valor: 15 }, beneficio: "tarifa-social" }, undefined, undefined).valor).toBeCloseTo(0.75, 6);
  });

  it("preço da conta abaixo de 30 kWh não pede alerta (o mínimo distorce)", () => {
    expect(precoDaContaForaDoComum({ kwh: 29.9, valor: 100 }, "nenhum")).toBeUndefined();
    expect(precoDaContaForaDoComum({ kwh: 30, valor: 100 }, "nenhum")).toBeCloseTo(100 / 30, 6);
    expect(precoDaContaForaDoComum({ kwh: 30, valor: 9 }, "nenhum")).toBeUndefined();
    expect(precoDaContaForaDoComum({ kwh: 30, valor: 90 }, "desconto-social")).toBeUndefined();
  });

  it("17: kWh da conta", () => {
    for (const faixa of [LIMITES.contaKwhCalibracao, LIMITES.contaKwhAcompanhamento]) {
      expect([2_000, 2_000.1, 54_000, 54_001].map((v) => validarFaixa(faixa, v))).toEqual(["ok", "alerta", "alerta", "fora"]);
    }
    expect(validarFaixa(LIMITES.contaKwhAcompanhamento, 0)).toBe("ok");
    expect(validarFaixa(LIMITES.contaKwhCalibracao, 0)).toBe("fora");
  });

  it("18: valor da conta", () => {
    expect(validarFaixa(LIMITES.contaValorAcompanhamento, 0)).toBe("ok");
    expect(validarFaixa(LIMITES.contaValorCalibracao, 0)).toBe("fora");
    expect(validarFaixa(LIMITES.contaValorCalibracao, 0.01)).toBe("ok");
    expect(validarFaixa(LIMITES.contaValorAcompanhamento, 200_000.01)).toBe("fora");
    expect(validarFaixa(LIMITES.contaValorCalibracao, 3_000.01)).toBe("alerta");
  });

  it("19: 35 kWh em 7 dias, sem alerta", () => {
    expect(alertaDaLeitura(leitura("a", "2026-10-01", 12_340), leitura("b", "2026-10-08", 12_375))).toBeUndefined();
  });

  it("20: 100 kWh por dia sem alerta; 101 com alerta", () => {
    expect(alertaDaLeitura(leitura("a", "2026-10-01", 12_340), leitura("b", "2026-10-08", 13_040))).toBeUndefined();
    expect(alertaDaLeitura(leitura("a", "2026-10-01", 12_340), leitura("b", "2026-10-08", 13_047))?.kwhPorDia).toBeCloseTo(101, 6);
    // A ordem dos argumentos não importa: vale a data.
    expect(alertaDaLeitura(leitura("b", "2026-10-08", 13_047), leitura("a", "2026-10-01", 12_340))?.kwhPorDia).toBeCloseTo(101, 6);
  });

  it("21: 1.800 kWh por dia fica com alerta; 1.801 tira o período", () => {
    const de = leitura("a", "2026-10-01", 12_340);
    const no1800 = leitura("b", "2026-10-08", 24_940);
    const no1801 = leitura("c", "2026-10-08", 24_947);
    expect(alertaDaLeitura(de, no1800)?.kwhPorDia).toBe(KWH_POR_DIA_ENTRE_LEITURAS.maximo);
    expect(periodosDeLeitura([de, no1800])).toMatchObject({ periodos: [{ kwhPorDia: 1_800 }], ignoradas: [] });
    expect(periodosDeLeitura([de, no1801])).toMatchObject({ periodos: [], ignoradas: [{ id: "c" }] });
  });

  it("21: a leitura ignorada não vira ponto de partida do período seguinte", () => {
    const { periodos, ignoradas } = periodosDeLeitura([
      leitura("a", "2026-10-01", 12_340),
      leitura("x", "2026-10-08", 99_999),
      leitura("b", "2026-10-15", 12_410),
    ]);
    expect(ignoradas.map((l) => l.id)).toEqual(["x"]);
    expect(periodos).toMatchObject([{ de: { id: "a" }, ate: { id: "b" }, dias: 14, kwh: 70 }]);
  });

  it("22 e 23: leitura e pessoas", () => {
    expect(validarFaixa(LIMITES.leituraKwh, 1_000_000)).toBe("fora");
    expect(validarFaixa(LIMITES.leituraKwh, 999_999)).toBe("ok");
    expect([0, 1, 20, 21].map((v) => validarFaixa(LIMITES.pessoas, v))).toEqual(["fora", "ok", "ok", "fora"]);
  });

  it("leitura com data inválida não pede alerta", () => {
    expect(alertaDaLeitura(leitura("a", "01/10/2026", 0), leitura("b", "2026-10-08", 99_999))).toBeUndefined();
  });
});

describe("faixas dos arquivos públicos (P-tl-2)", () => {
  it("P1 e P2: tarifa", () => {
    expect([0.05, 0.050001, 3, 3.000001, 875.71, 0.00087571].map((v) => validarFaixa(LIMITES.tarifaKwh, v))).toEqual(["fora", "ok", "ok", "fora", "fora", "fora"]);
  });

  it("P3: TE e TUSD", () => {
    expect([0, -0.01, 3.01].map((v) => validarFaixa(LIMITES.componenteDaTarifaKwh, v))).toEqual(["ok", "fora", "fora"]);
  });

  it("P5: acréscimo da bandeira", () => {
    expect([0.142, 1, 1.000001, 142, 14.2, -0.01].map((v) => validarFaixa(LIMITES.adicionalDaBandeiraKwh, v))).toEqual(["ok", "ok", "fora", "fora", "fora", "fora"]);
  });
});

describe("números de referência do \"Confere?\" saem do catálogo", () => {
  it("chuveiro forte: 7.800 W; geladeira que mais gasta: 115 kWh por mês", () => {
    expect(potenciaDoChuveiroMaisForteW()).toBe(7_800);
    expect(maiorConsumoDeEtiquetaDoCatalogoKwh()).toBe(115);
  });

  it("as referências ficam abaixo do alerta (senão o alerta pegaria aparelho comum)", () => {
    expect(potenciaDoChuveiroMaisForteW()).toBeLessThanOrEqual(LIMITES.potenciaW.alerta);
    expect(maiorConsumoDeEtiquetaDoCatalogoKwh()).toBeLessThanOrEqual(LIMITES.kwhMesInformado.alerta);
  });
});

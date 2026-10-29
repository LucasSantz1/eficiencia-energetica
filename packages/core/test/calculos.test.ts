import { describe, expect, it } from "vitest";
import {
  bandeiraDoMes,
  competenciaAtual,
  consumoDiarioKwh,
  consumoMensalKwh,
  estimarConta,
  formatarReais,
  gerarDicas,
  normalizarBandeira,
  precoKwh,
  resumirCasa,
  type Aparelho,
  type BandeiraMes,
} from "../src";

const base: Aparelho = { id: "a", comodoId: "c", nome: "x", quantidade: 1, potenciaW: 0, minutosPorDia: 0, diasPorSemana: 7 };
const semBeneficio = { beneficio: "nenhum", ligacao: "monofasica" } as const;

describe("consumo (E = P × t)", () => {
  it("reproduz o exemplo do artigo: geladeira de 75 W ligada 24 h", () => {
    const geladeira = { ...base, potenciaW: 75, minutosPorDia: 24 * 60 };
    expect(consumoDiarioKwh(geladeira)).toBeCloseTo(1.8, 6);
    expect(consumoMensalKwh(geladeira)).toBeCloseTo(54, 6);
    const preco = precoKwh({}, { tarifaKwh: 0.65 }, undefined);
    expect(consumoMensalKwh(geladeira) * preco.valor).toBeCloseTo(35.1, 6);
  });

  it("multiplica pela quantidade e respeita os dias por semana", () => {
    const lampadas = { ...base, potenciaW: 10, minutosPorDia: 60, quantidade: 3, diasPorSemana: 7 };
    expect(consumoMensalKwh(lampadas)).toBeCloseTo(0.9, 6);
    expect(consumoMensalKwh({ ...lampadas, diasPorSemana: 0 })).toBe(0);
    const maquina = { ...base, potenciaW: 500, minutosPorDia: 60, diasPorSemana: 3.5 };
    expect(consumoMensalKwh(maquina)).toBeCloseTo(7.5, 6);
  });

  it("usa o kWh/mês da etiqueta quando informado", () => {
    expect(consumoMensalKwh({ ...base, potenciaW: 500, minutosPorDia: 1440, kwhMesInformado: 25, quantidade: 2 })).toBe(50);
  });

  it("nunca devolve consumo negativo", () => {
    expect(consumoMensalKwh({ ...base, potenciaW: -100, minutosPorDia: 60 })).toBe(0);
  });
});

describe("preço do kWh", () => {
  it("soma TE + TUSD com o adicional da bandeira", () => {
    const p = precoKwh({}, { tarifaKwh: 0.8 }, { adicionalKwh: 0.04463 });
    expect(p.valor).toBeCloseTo(0.84463, 8);
    expect(p.origem).toBe("aneel");
    expect(p.incluiImpostos).toBe(false);
  });

  it("prefere o preço real da conta de luz, que já tem impostos", () => {
    const p = precoKwh({ contaReferencia: { kwh: 200, valor: 210 } }, { tarifaKwh: 0.8 }, { adicionalKwh: 0.04 });
    expect(p.valor).toBeCloseTo(1.05, 8);
    expect(p.origem).toBe("conta");
    expect(p.incluiImpostos).toBe(true);
    expect(p.adicionalBandeira).toBe(0);
  });

  it("na Tarifa Social, divide o valor da conta só pelos kWh cobrados", () => {
    const p = precoKwh({ beneficio: "tarifa-social", contaReferencia: { kwh: 180, valor: 100 } }, { tarifaKwh: 0.8 }, undefined);
    expect(p.valor).toBeCloseTo(1, 8);
    expect(precoKwh({ beneficio: "tarifa-social", contaReferencia: { kwh: 85, valor: 12 } }, { tarifaKwh: 0.8 }, undefined).origem).toBe("aneel");
  });

  it("ignora conta com valores zerados", () => {
    expect(precoKwh({ contaReferencia: { kwh: 0, valor: 50 } }, { tarifaKwh: 0.8 }, undefined).origem).toBe("aneel");
  });
});

describe("estimativa da conta", () => {
  const preco = precoKwh({}, { tarifaKwh: 1 }, undefined);

  it("cobra o consumo mínimo da ligação", () => {
    expect(estimarConta(10, { beneficio: "nenhum", ligacao: "monofasica" }, preco)).toMatchObject({ kwhCobrados: 30, valor: 30, cobradoPeloMinimo: true });
    expect(estimarConta(10, { beneficio: "nenhum", ligacao: "bifasica" }, preco).kwhCobrados).toBe(50);
    expect(estimarConta(10, { beneficio: "nenhum", ligacao: "trifasica" }, preco).kwhCobrados).toBe(100);
    expect(estimarConta(10, { beneficio: "nenhum", ligacao: "nao-sei" }, preco).kwhCobrados).toBe(30);
    expect(estimarConta(150, { beneficio: "nenhum", ligacao: "monofasica" }, preco)).toMatchObject({ kwhCobrados: 150, cobradoPeloMinimo: false });
  });

  it("Tarifa Social: os primeiros 80 kWh são isentos", () => {
    const ate80 = estimarConta(70, { beneficio: "tarifa-social", ligacao: "monofasica" }, preco);
    expect(ate80.valor).toBe(0);
    expect(ate80.economiaBeneficio).toBe(70);
    const acima = estimarConta(130, { beneficio: "tarifa-social", ligacao: "monofasica" }, preco);
    expect(acima.kwhCobrados).toBe(50);
    expect(acima.valor).toBe(50);
    expect(acima.economiaBeneficio).toBe(80);
  });

  it("separa quanto da conta é bandeira", () => {
    const comBandeira = precoKwh({}, { tarifaKwh: 0.8 }, { adicionalKwh: 0.05 });
    expect(estimarConta(200, semBeneficio, comBandeira).valorBandeira).toBeCloseTo(10, 8);
  });
});

describe("resumo da casa", () => {
  it("ordena do que mais gasta e a soma dos aparelhos fecha com o consumo", () => {
    const aparelhos: Aparelho[] = [
      { ...base, id: "tv", comodoId: "sala", potenciaW: 100, minutosPorDia: 300 },
      { ...base, id: "chuveiro", comodoId: "banheiro", potenciaW: 5500, minutosPorDia: 32 },
      { ...base, id: "lampada", comodoId: "sala", potenciaW: 9, minutosPorDia: 300 },
    ];
    const preco = precoKwh({}, { tarifaKwh: 0.9 }, undefined);
    const r = resumirCasa(aparelhos, semBeneficio, preco);
    expect(r.aparelhos.map((a) => a.aparelho.id)).toEqual(["chuveiro", "tv", "lampada"]);
    const soma = r.aparelhos.reduce((s, a) => s + a.valorMes, 0);
    expect(soma).toBeCloseTo(r.conta.valor, 6);
    expect(r.aparelhos.reduce((s, a) => s + a.participacao, 0)).toBeCloseTo(1, 8);
    expect(r.comodos[0]?.comodoId).toBe("banheiro");
  });

  it("com Tarifa Social a soma dos aparelhos fecha com o valor já descontado", () => {
    const aparelhos: Aparelho[] = [{ ...base, potenciaW: 1000, minutosPorDia: 240 }]; // 120 kWh
    const preco = precoKwh({}, { tarifaKwh: 1 }, undefined);
    const r = resumirCasa(aparelhos, { beneficio: "tarifa-social", ligacao: "monofasica" }, preco);
    expect(r.conta.valor).toBeCloseTo(40, 6);
    expect(r.aparelhos[0]?.valorMes).toBeCloseTo(40, 6);
  });

  it("casa vazia não quebra", () => {
    const r = resumirCasa([], semBeneficio, precoKwh({}, { tarifaKwh: 1 }, undefined));
    expect(r.aparelhos).toEqual([]);
    expect(r.conta.consumoKwh).toBe(0);
  });
});

describe("bandeiras", () => {
  const lista: BandeiraMes[] = [
    { competencia: "2026-08", bandeira: "amarela", nome: "Amarela", adicionalKwh: 0.01885 },
    { competencia: "2026-09", bandeira: "vermelha-1", nome: "Vermelha P1", adicionalKwh: 0.04463 },
  ];

  it("acha a bandeira do mês ou usa a mais recente publicada", () => {
    expect(bandeiraDoMes(lista, "2026-09")).toMatchObject({ exata: true, bandeira: { bandeira: "vermelha-1" } });
    expect(bandeiraDoMes(lista, "2026-10")).toMatchObject({ exata: false, bandeira: { competencia: "2026-09" } });
    expect(bandeiraDoMes([], "2026-10")).toBeUndefined();
  });

  it("normaliza os nomes publicados pela ANEEL", () => {
    expect(normalizarBandeira("Verde")).toBe("verde");
    expect(normalizarBandeira("AMARELA")).toBe("amarela");
    expect(normalizarBandeira("Vermelha P1")).toBe("vermelha-1");
    expect(normalizarBandeira("Vermelha Patamar 1")).toBe("vermelha-1");
    expect(normalizarBandeira("Vermelha P2")).toBe("vermelha-2");
    expect(normalizarBandeira("Vermelha - Patamar 2")).toBe("vermelha-2");
    expect(normalizarBandeira("Escassez Hídrica")).toBe("escassez-hidrica");
    expect(normalizarBandeira("Sem bandeira")).toBeUndefined();
  });

  it("calcula o mês atual no fuso de Brasília", () => {
    // 1º de novembro, 01h UTC ainda é 31 de outubro em Brasília
    expect(competenciaAtual(new Date("2026-11-01T01:00:00Z"))).toBe("2026-10");
  });
});

describe("dicas", () => {
  it("calcula a economia do banho mais curto e coloca no topo", () => {
    const chuveiro: Aparelho = { ...base, id: "ch", catalogoId: "chuveiro", potenciaW: 5500, minutosPorDia: 32, banho: { banhosPorDia: 4, minutosPorBanho: 8 } };
    const tv: Aparelho = { ...base, id: "tv", catalogoId: "tv-pequena", potenciaW: 60, minutosPorDia: 300 };
    const preco = precoKwh({}, { tarifaKwh: 1 }, undefined);
    const dicas = gerarDicas({ aparelhos: [chuveiro, tv], residencia: semBeneficio, preco });
    const banho = dicas.find((d) => d.id === "ch:banho-curto");
    // 4 banhos × 2 min × 30 dias × 5,5 kW = 22 kWh
    expect(banho?.economiaKwh).toBeCloseTo(22, 6);
    expect(banho?.economiaMes).toBeCloseTo(22, 6);
    expect(dicas[0]?.economiaMes).toBeGreaterThanOrEqual(dicas[1]?.economiaMes ?? 0);
  });

  it("avisa da bandeira cara quando o preço vem da ANEEL", () => {
    const preco = precoKwh({}, { tarifaKwh: 1 }, { adicionalKwh: 0.04463 });
    const dicas = gerarDicas({ aparelhos: [], residencia: semBeneficio, preco, bandeira: { competencia: "2026-10", bandeira: "vermelha-1", nome: "Vermelha P1", adicionalKwh: 0.04463 } });
    expect(dicas[0]?.id).toBe("bandeira");
    expect(dicas[0]?.texto).toContain(formatarReais(4.463));
  });

  it("sugere a Tarifa Social para quem não sabe se tem direito", () => {
    const preco = precoKwh({}, { tarifaKwh: 1 }, undefined);
    expect(gerarDicas({ aparelhos: [], residencia: { beneficio: "nao-sei", ligacao: "nao-sei" }, preco }).some((d) => d.id === "tarifa-social")).toBe(true);
    expect(gerarDicas({ aparelhos: [], residencia: { beneficio: "tarifa-social", ligacao: "nao-sei" }, preco }).some((d) => d.id === "tarifa-social")).toBe(false);
  });
});

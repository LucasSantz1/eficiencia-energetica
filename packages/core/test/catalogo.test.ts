import { describe, expect, it } from "vitest";
import {
  aparelhoInicial,
  aplicarVariantes,
  CATALOGO,
  CATALOGO_VISIVEL,
  consumoMensalKwh,
  descreverVariantes,
  FREQUENCIAS,
  formatarDias,
  frequenciaMaisProxima,
  gerarDicas,
  itemDoCatalogo,
  precoKwh,
  type Aparelho,
} from "../src";

const ar = itemDoCatalogo("ar-condicionado")!;
const r = { beneficio: "nenhum", ligacao: "monofasica" } as const;
const comoAparelho = (parcial: Partial<Aparelho>): Aparelho => ({ id: "x", comodoId: "c", nome: "x", quantidade: 1, potenciaW: 0, minutosPorDia: 0, diasPorSemana: 7, ...parcial });

describe("catálogo", () => {
  it("ids únicos e todos os itens com potência válida", () => {
    const ids = CATALOGO.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const i of CATALOGO) {
      expect(i.potenciaW, i.id).toBeGreaterThan(0);
      expect(i.faixaW[0], i.id).toBeLessThanOrEqual(i.faixaW[1]);
    }
    expect(CATALOGO_VISIVEL.some((i) => i.id === "tv-pequena")).toBe(false);
    expect(itemDoCatalogo("tv-pequena")).toBeDefined(); // continua funcionando para quem já cadastrou
  });

  it("as respostas padrão de cada pergunta existem nas opções", () => {
    for (const i of CATALOGO) for (const v of i.variantes ?? []) expect(v.opcoes.some((o) => o.id === v.padrao), `${i.id}.${v.id}`).toBe(true);
  });

  it("ar-condicionado: inverter gasta bem menos que o comum e o de janela", () => {
    const kwh = (tipo: string) => consumoMensalKwh(comoAparelho({ minutosPorDia: 480, ...aplicarVariantes(ar, { tipo, btus: "9000" }) }));
    const inverter = kwh("split-inverter");
    const comum = kwh("split-comum");
    const janela = kwh("janela");
    // 9.000 BTUs, 8 h por dia: inverter 765 W × 60% ≈ 110 kWh; comum 855 W × 85% ≈ 174 kWh
    expect(inverter).toBeCloseTo(0.765 * 0.6 * 8 * 30, 0);
    expect(comum).toBeCloseTo(0.855 * 0.85 * 8 * 30, 0);
    expect(inverter).toBeLessThan(comum);
    expect(comum).toBeLessThan(janela);
    expect(aplicarVariantes(ar, { tipo: "split-inverter", btus: "12000" }).nome).toBe("Ar split inverter 12.000 BTUs");
    expect(descreverVariantes(ar, { tipo: "split-inverter", btus: "12000" })).toBe("Split inverter, 12.000");
  });

  it("geladeira: modelo e idade mudam o consumo da etiqueta", () => {
    const g = itemDoCatalogo("geladeira")!;
    expect(aplicarVariantes(g, { modelo: "frost-free", idade: "antiga" }).kwhMesInformado).toBe(85);
    expect(aplicarVariantes(g, { modelo: "1-porta", idade: "nova" }).kwhMesInformado).toBe(25);
    expect(aparelhoInicial(g).kwhMesInformado).toBe(35); // 1 porta, 5 a 10 anos
  });

  it("chuveiro com aquecedor solar gasta só uma parte", () => {
    const c = itemDoCatalogo("chuveiro")!;
    const solar = aplicarVariantes(c, { potencia: "6800", aquecimento: "solar" });
    expect(solar.potenciaW).toBe(6800);
    expect(solar.fatorCiclo).toBeCloseTo(0.3);
  });

  it("TV: tecnologia e tamanho", () => {
    const tv = itemDoCatalogo("tv")!;
    expect(aplicarVariantes(tv, { tecnologia: "plasma", tamanho: "50-55" })).toMatchObject({ potenciaW: 350, nome: "TV de plasma de 50 a 55 polegadas" });
  });
});

describe("frequência de uso", () => {
  it("aceita uso uma vez por mês", () => {
    const umaVez = FREQUENCIAS.find((f) => f.rotulo === "1 vez por mês")!.diasPorSemana;
    // Lavadora de alta pressão: 1.500 W, 30 min, 1 vez por mês = 0,75 kWh
    expect(consumoMensalKwh(comoAparelho({ potenciaW: 1500, minutosPorDia: 30, diasPorSemana: umaVez }))).toBeCloseTo(0.75, 6);
    expect(formatarDias(umaVez)).toBe("1 vez por mês");
    expect(formatarDias((2 * 7) / 30)).toBe("2 vezes por mês");
    expect(formatarDias(3)).toBe("3 dias por semana");
    expect(frequenciaMaisProxima(0.24).rotulo).toBe("1 vez por mês");
  });
});

describe("dicas do catálogo novo", () => {
  it("sugere trocar o ar comum por inverter, com a economia calculada", () => {
    const aparelho = comoAparelho({ id: "ar", catalogoId: "ar-condicionado", minutosPorDia: 480, ...aplicarVariantes(ar, { tipo: "split-comum", btus: "12000" }) });
    const dica = gerarDicas({ aparelhos: [aparelho], residencia: r, preco: precoKwh({}, { tarifaKwh: 1 }, undefined) }).find((d) => d.id === "ar:ar-inverter");
    expect(dica?.economiaKwh).toBeGreaterThan(80);
  });

  it("não sugere inverter para quem já tem", () => {
    const aparelho = comoAparelho({ id: "ar", catalogoId: "ar-condicionado", minutosPorDia: 480, ...aplicarVariantes(ar, { tipo: "split-inverter" }) });
    expect(gerarDicas({ aparelhos: [aparelho], residencia: r, preco: precoKwh({}, { tarifaKwh: 1 }, undefined) }).some((d) => d.id === "ar:ar-inverter")).toBe(false);
  });

  it("geladeira antiga: sugere a troca por uma nova do mesmo modelo", () => {
    const g = itemDoCatalogo("geladeira")!;
    const aparelho = comoAparelho({ id: "g", catalogoId: "geladeira", ...aparelhoInicial(g), ...aplicarVariantes(g, { modelo: "frost-free", idade: "antiga" }) });
    const dica = gerarDicas({ aparelhos: [aparelho], residencia: r, preco: precoKwh({}, { tarifaKwh: 1 }, undefined) }).find((d) => d.id === "g:geladeira-nova");
    expect(dica?.economiaKwh).toBeCloseTo(85 - 42, 6);
  });
});

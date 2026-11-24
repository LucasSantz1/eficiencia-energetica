import { describe, expect, it } from "vitest";
import { aparelhoInicial, aplicarVariantes, itemDoCatalogo, type ItemCatalogo } from "../src";
import { faixaDeConsumo, GUIAS_VISUAIS, NAO_SEI, reconhecer } from "../src/reconhecer";

const item = (id: string): ItemCatalogo => {
  const i = itemDoCatalogo(id);
  if (!i) throw new Error(`${id} não está no catálogo`);
  return i;
};
const base = (id: string) => ({ ...aparelhoInicial(item(id)), quantidade: 1 });

describe("guias visuais", () => {
  it("cada item marcado com guiaVisual no catálogo tem guia, e vice-versa", async () => {
    const { CATALOGO } = await import("../src");
    expect(CATALOGO.filter((i) => i.guiaVisual).map((i) => i.id).sort()).toEqual(Object.keys(GUIAS_VISUAIS).sort());
  });

  it("só apontam para perguntas e opções que existem no catálogo", () => {
    for (const [id, perguntas] of Object.entries(GUIAS_VISUAIS)) {
      const variantes = item(id).variantes ?? [];
      for (const p of perguntas)
        for (const o of p.opcoes)
          for (const [variante, opcoes] of Object.entries(o.limita)) {
            const v = variantes.find((x) => x.id === variante);
            expect(v, `${id}/${p.id}/${o.id}: pergunta ${variante}`).toBeDefined();
            for (const opcao of opcoes) expect(v?.opcoes.map((x) => x.id), `${id}/${o.id}: opção ${opcao}`).toContain(opcao);
          }
    }
  });
});

describe("reconhecer", () => {
  it("ar: duas partes + INVERTER + quarto deixa só 7.500 ou 9.000 BTUs inverter, e grava o 9.000 (o mais comum)", () => {
    const r = reconhecer(item("ar-condicionado"), { formato: "split", inverter: "sim", lugar: "quarto" });
    expect(r.escolhas).toEqual({ tipo: "split-inverter", btus: "9000" });
    expect(r.possiveis).toHaveLength(2);
    expect(r.exato).toBe(false);
  });

  it("tudo 'não sei' deixa todas as combinações do catálogo e grava as respostas padrão", () => {
    const ar = item("ar-condicionado");
    const r = reconhecer(ar, { formato: NAO_SEI, inverter: NAO_SEI, lugar: NAO_SEI });
    expect(r.possiveis).toHaveLength(4 * 5);
    expect(r.escolhas).toEqual({ tipo: "split-comum", btus: "9000" });
  });

  it("resposta que contradiz as anteriores é ignorada (no chão e INVERTER)", () => {
    const r = reconhecer(item("ar-condicionado"), { formato: "portatil", inverter: "sim" });
    expect(r.escolhas.tipo).toBe("portatil");
  });

  it("geladeira de uma porta, junta gelo, mais de 10 anos: exata", () => {
    const r = reconhecer(item("geladeira"), { portas: "uma", gelo: "sim", idade: "antiga" });
    expect(r.exato).toBe(true);
    expect(r.escolhas).toEqual({ modelo: "1-porta", idade: "antiga" });
  });

  it("pergunta do catálogo que o guia não cobre fica com a escolha atual (chuveiro com aquecedor solar)", () => {
    const r = reconhecer(item("chuveiro"), {}, { potencia: "6800", aquecimento: "solar" });
    expect(r.possiveis.every((p) => p.aquecimento === "solar")).toBe(true);
    expect(r.possiveis.map((p) => p.potencia).sort()).toEqual(["4500", "5500", "6800", "7500"]);
  });
});

describe("faixaDeConsumo", () => {
  it("vai do mais econômico ao que mais gasta, e o valor usado fica dentro da faixa", () => {
    const tv = item("tv");
    const r = reconhecer(tv, { formato: "fina", apps: NAO_SEI, tamanho: "media" });
    const f = faixaDeConsumo(tv, base("tv"), r);
    expect(f.minKwh).toBeLessThan(f.maxKwh);
    expect(f.usadoKwh).toBeGreaterThanOrEqual(f.minKwh);
    expect(f.usadoKwh).toBeLessThanOrEqual(f.maxKwh);
  });

  it("resposta exata: faixa de um ponto só, igual a aplicar as escolhas", () => {
    const vent = item("ventilador");
    const r = reconhecer(vent, { lugar: "teto" });
    const f = faixaDeConsumo(vent, base("ventilador"), r);
    expect(f.minKwh).toBe(f.maxKwh);
    expect(aplicarVariantes(vent, r.escolhas).potenciaW).toBe(100);
  });
});

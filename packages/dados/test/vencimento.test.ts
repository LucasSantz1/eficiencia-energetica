import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ehTarifaResidencialB1, mapearColunasTarifas, selecionarTarifasVigentes, type ColunasTarifas } from "../src/aneel/tarifas";
import { lerCSV } from "../src/csv";
import type { Linha } from "../src/util";

const fixture = (nome: string) => fileURLToPath(new URL(`../fixtures/sucessao/${nome}`, import.meta.url));

async function lerTarifas(nome: string): Promise<{ linhas: Linha[]; colunas: ColunasTarifas }> {
  let colunas: ColunasTarifas | undefined;
  const lido = await lerCSV(fixture(nome), {
    aoLerCabecalho: (c) => (colunas = mapearColunasTarifas(c)),
    filtro: (l) => (colunas ? ehTarifaResidencialB1(l, colunas) : false),
  });
  if (!colunas) throw new Error("fixture sem cabeçalho");
  return { linhas: lido.linhas, colunas };
}

/** Uma tarifa B1 só, com o fim de vigência pedido, para testar as bordas do D4. */
function umaTarifa(fim: string, inicio = "2020-01-01"): { linhas: Linha[]; colunas: ColunasTarifas } {
  const colunas = mapearColunasTarifas(["SigAgente", "NumCNPJDistribuidora", "DatInicioVigencia", "DatFimVigencia", "VlrTUSD", "VlrTE"]);
  return { colunas, linhas: [{ SigAgente: "COOP B", NumCNPJDistribuidora: "33333333000133", DatInicioVigencia: inicio, DatFimVigencia: fim, VlrTUSD: "400,00", VlrTE: "300,00" }] };
}
const publicada = (fim: string, hoje: string) => {
  const { linhas, colunas } = umaTarifa(fim);
  return selecionarTarifasVigentes(linhas, colunas, hoje);
};

describe("D4: tarifa vencida (HIS-111, 6 meses)", () => {
  it("descarta a vencida há 7 meses, com o motivo e a data (critério 6)", async () => {
    const { linhas, colunas } = await lerTarifas("tarifas.csv");
    const r = selecionarTarifasVigentes(linhas, colunas, "2026-10-30");
    expect(r.tarifas.map((t) => t.sigla)).toEqual(["CEMIG-D", "ESS", "RGE"]);
    expect(r.descartadas).toContain("COOP Z: vencida desde 2026-03-31 (vigência até 2026-03-30)");
    expect(r.vencidasDescartadas.map((v) => [v.sigla, v.fimVigencia])).toEqual([
      ["COOP Z", "2026-03-30"],
      ["EDEVP", "2017-07-11"],
      ["RGE SUL", "2019-06-18"],
    ]);
    expect(r.vencidasEmUso).toEqual([]);
  });

  it("publica a vencida há 5 meses, com aviso (critério 6)", async () => {
    const { linhas, colunas } = await lerTarifas("tarifas.csv");
    const r = selecionarTarifasVigentes(linhas, colunas, "2026-08-30");
    expect(r.tarifas.find((t) => t.sigla === "COOP Z")?.fimVigencia).toBe("2026-03-30");
    expect(r.vencidasEmUso).toEqual([{ sigla: "COOP Z", cnpj: "22222222000122", fimVigencia: "2026-03-30" }]);
  });

  it("borda: fim no limite fica; um dia antes do limite sai", () => {
    expect(publicada("2026-04-30", "2026-10-30").tarifas).toHaveLength(1);
    expect(publicada("2026-04-29", "2026-10-30").tarifas).toHaveLength(0);
    expect(publicada("2026-04-29", "2026-10-30").vencidasDescartadas).toHaveLength(1);
  });

  it("borda: avisa desde o 1º dia vencida; vigente até hoje não avisa", () => {
    expect(publicada("2026-10-30", "2026-10-30").vencidasEmUso).toEqual([]);
    expect(publicada("2026-10-29", "2026-10-30").vencidasEmUso).toHaveLength(1);
  });

  it("borda: 31/08 menos 6 meses é 28/02, e 29/02 no ano bissexto", () => {
    expect(publicada("2026-02-28", "2026-08-31").tarifas).toHaveLength(1);
    expect(publicada("2026-02-27", "2026-08-31").tarifas).toHaveLength(0);
    expect(publicada("2024-02-29", "2024-08-31").tarifas).toHaveLength(1);
    expect(publicada("2024-02-28", "2024-08-31").tarifas).toHaveLength(0);
  });
});

describe("V7: mais de um valor B1 na vigência", () => {
  it("conta os valores diferentes da vigência escolhida", async () => {
    const { linhas, colunas } = await lerTarifas("tarifas-v7.csv");
    expect(selecionarTarifasVigentes(linhas, colunas, "2026-10-30").comMaisDeUmValor).toEqual([{ sigla: "ESS", cnpj: "07282377000120", valores: 2 }]);
  });

  it("não conta vigência antiga nem linha repetida com o mesmo valor", async () => {
    const { linhas, colunas } = await lerTarifas("tarifas.csv");
    const repetidas = [...linhas, ...linhas];
    expect(selecionarTarifasVigentes(repetidas, colunas, "2026-10-30").comMaisDeUmValor).toEqual([]);
  });
});

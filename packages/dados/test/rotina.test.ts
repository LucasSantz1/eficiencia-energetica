import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { arquivosNaPasta } from "../src/fontes";
import type { Relatorio } from "../src/montar";
import { anotacoesDoRelatorio, executarAtualizacao } from "../src/rotina";

const pasta = (nome: string) => fileURLToPath(new URL(`../fixtures/sucessao/${nome}`, import.meta.url));
const HOJE = "2026-10-30";
const pastasTemporarias: string[] = [];

afterEach(async () => {
  for (const p of pastasTemporarias.splice(0)) await rm(p, { recursive: true, force: true });
});

async function rodar(opcoes: { forcar?: boolean; tarifas?: string; sucessoes?: string } = {}) {
  const saida = await mkdtemp(join(tmpdir(), "ee-rotina-"));
  pastasTemporarias.push(saida);
  const log: string[] = [];
  const resultado = await executarAtualizacao({
    arquivos: { ...arquivosNaPasta(pasta("")), ...(opcoes.tarifas ? { tarifas: pasta(opcoes.tarifas) } : {}) },
    hoje: HOJE,
    geradoEm: `${HOJE}T12:00:00.000Z`,
    baixar: false,
    usarApiIbge: false,
    forcar: opcoes.forcar ?? false,
    pastaSaida: saida,
    caminhoSucessoes: pasta(opcoes.sucessoes ?? "sucessoes.json"),
    registrar: (l) => log.push(l),
    registrarErro: (l) => log.push(l),
  });
  return { ...resultado, texto: log.join("\n"), log, arquivos: await readdir(saida) };
}

describe("rotina de ponta a ponta (HIS-111)", () => {
  it("critério 6: tarifa vencida há 7 meses sem sucessora sai, a rotina para pelo V5 e não grava nada", async () => {
    const r = await rodar();
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain("descartada — COOP Z: vencida desde 2026-03-31 (vigência até 2026-03-30)");
    expect(r.texto).toMatch(/✗ V5: 1 agentes dos conjuntos sem tarifa publicada \(COOP Z\)/);
    expect(r.texto).toContain("Nada foi gravado. Use --forcar");
    expect(r.arquivos).toEqual([]);
  });

  it("--forcar passa o V5 e o V6, mas grava só o que passou na coerência", async () => {
    const r = await rodar({ forcar: true });
    expect(r.codigo).toBe(0);
    expect(r.arquivos.sort()).toEqual(["municipios", "relatorio.json", "tarifas.json"]);
    const saida = r.texto.match(/arquivos gravados em (.+)$/m)?.[1] ?? "";
    const tarifas: unknown = JSON.parse(await readFile(join(saida, "tarifas.json"), "utf8"));
    expect(tarifas).toMatchObject({ substituidas: { edevp: "ess", "rge-sul": "rge" } });
    // As chaves saem em ordem: a assinatura do arquivo fica estável.
    expect(JSON.stringify(tarifas)).toContain('"substituidas":{"edevp":"ess","rge-sul":"rge"}');
  });

  it("critério 12: sucessora com dois valores na vigência para a rotina pelo V7, mesmo com --forcar", async () => {
    const r = await rodar({ forcar: true, tarifas: "tarifas-v7.csv" });
    expect(r.codigo).toBe(1);
    expect(r.texto).toMatch(/✗ V7: ESS \(sucessora de EDEVP, sucessoes\[0\]\) tem 2 valores B1 diferentes na vigência/);
    expect(r.texto).toContain("não passam com --forcar");
    expect(r.arquivos).toEqual([]);
  });

  it("critério 12 (R3): V9 e V10 também não passam com --forcar", async () => {
    const v9 = await rodar({ forcar: true, sucessoes: "sucessoes-v9.json" });
    expect(v9.codigo).toBe(1);
    expect(v9.texto).toMatch(/✗ V9: sucessoes\[0\] \(CEMIG-D\)/);
    expect(v9.arquivos).toEqual([]);
    const v10 = await rodar({ forcar: true, sucessoes: "sucessoes-v10.json" });
    expect(v10.codigo).toBe(1);
    expect(v10.texto).toMatch(/✗ V10: sucessoes\[0\] \(EDEVP\): o CNPJ da sucessora \(07282377000210\) não aparece na ANEEL/);
    expect(v10.arquivos).toEqual([]);
  });

  it("critério 7: linha do sucessoes.json sem ato para a rotina, dizendo a linha", async () => {
    const r = await rodar({ forcar: true, sucessoes: "sucessoes-sem-ato.json" });
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('✗ sucessoes.json, sucessoes[0] (EDEVP): falta "ato".');
    expect(r.arquivos).toEqual([]);
    const ciclo = await rodar({ forcar: true, sucessoes: "sucessoes-ciclo.json" });
    expect(ciclo.texto).toMatch(/sucessoes\[0\] \(EDEVP\): .*ciclo/);
  });

  it("critério 9: as anotações mostram sucessões, vínculos extintos e tarifas vencidas", async () => {
    const { log } = await rodar();
    expect(log).toContain("::notice title=Sucessões aplicadas (HIS-111)::EDEVP → ESS: 1 municípios");
    expect(log).toContain("::notice title=Vínculos extintos descartados (HIS-111)::COOP Z: 1 municípios");
    expect(log).toContain(
      "::notice title=Tarifas descartadas por vencimento (HIS-111)::COOP Z (vigência até 2026-03-30); EDEVP (vigência até 2017-07-11); RGE SUL (vigência até 2019-06-18)",
    );
    expect(log).toContain("::warning title=Vínculos extintos mantidos (único da cidade)::COOP Z: 1 municípios");
  });
});

describe("anotações com texto de fora (R2)", () => {
  it("uma sigla com quebra de linha não abre linha nova de comando", () => {
    const relatorio: Relatorio = {
      distribuidoras: 0,
      distribuidorasSemMunicipio: [],
      agentesSemTarifa: [],
      municipios: 0,
      municipiosSemDistribuidora: 0,
      municipiosComVariasDistribuidoras: 0,
      anoMaisRecenteDosConjuntos: 2025,
      renomeacoesPorCnpj: [],
      sucessoesAplicadas: [{ de: "X\n::add-mask::a", para: "ESS", municipios: 1 }],
      vinculosExtintosDescartados: [],
      vinculosExtintosMantidos: [{ sigla: "Y\r\n::stop-commands::z", municipios: 1 }],
      tarifasDescartadasPorVencimento: [],
      tarifasVencidasEmUso: [],
      tarifasComMaisDeUmValor: [],
      sucessorasCandidatas: [],
      substituicoesEmConflito: [],
    };
    const linhas = anotacoesDoRelatorio(relatorio, ["aviso 100%"]);
    expect(linhas.every((l) => !/[\r\n]/.test(l) && l.startsWith("::"))).toBe(true);
    expect(linhas[0]).toBe("::notice title=Sucessões aplicadas (HIS-111)::X%0A::add-mask::a → ESS: 1 municípios");
    expect(linhas.at(-1)).toBe("::warning title=Linhas do sucessoes.json para revisar::aviso 100%25");
  });
});

import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { ehUf, lerArquivoMunicipios, lerArquivoTarifas, lerRelatorioDosDados, type ArquivoMunicipios } from "@ee/core";
import { escreverArquivos } from "../src/escrever";
import { conferirFormato } from "../src/formato";
import { validar, type Montagem } from "../src/montar";

const PUBLICADOS = fileURLToPath(new URL("../../../apps/web/public/dados/", import.meta.url));
const lerJson = async (caminho: string): Promise<unknown> => JSON.parse(await readFile(caminho, "utf8"));

/** Montagem pequena e válida, no formato que a rotina grava. */
function montagemValida(): Montagem {
  const tarifas: Montagem["tarifas"] = {
    geradoEm: "2026-10-29T13:55:43.455Z",
    origem: "aneel",
    fontes: ["ANEEL — Tarifas de aplicação"],
    distribuidoras: [{ id: "ess", sigla: "ESS", cnpj: "07282377000120", ufs: ["SP"], teKwh: 0.3, tusdKwh: 0.51424, tarifaKwh: 0.81424, inicioVigencia: "2026-07-12" }],
    bandeiras: [{ competencia: "2026-10", bandeira: "amarela", nome: "Amarela", adicionalKwh: 0.01885 }],
    estados: [{ uf: "SP", nome: "São Paulo", distribuidoras: ["ess"] }],
    // A rotina sempre grava `substituidas` (HIS-111, D7), mesmo vazio.
    substituidas: {},
  };
  const sp: ArquivoMunicipios = { uf: "SP", geradoEm: tarifas.geradoEm, origem: "aneel", municipios: [{ ibge: 3_541_406, nome: "Presidente Prudente", uf: "SP", distribuidoras: ["ess"] }] };
  return {
    tarifas,
    municipiosPorUF: [sp],
    relatorio: {
      distribuidoras: 1,
      distribuidorasSemMunicipio: [],
      agentesSemTarifa: [],
      municipios: 1,
      municipiosSemDistribuidora: 0,
      municipiosComVariasDistribuidoras: 0,
      // Campos da HIS-111 (D6), vazios: esta montagem não troca nada.
      anoMaisRecenteDosConjuntos: 2025,
      renomeacoesPorCnpj: [],
      sucessoesAplicadas: [],
      vinculosExtintosDescartados: [],
      vinculosExtintosMantidos: [],
      tarifasDescartadasPorVencimento: [],
      tarifasVencidasEmUso: [],
      tarifasComMaisDeUmValor: [],
      sucessorasCandidatas: [],
      substituicoesEmConflito: [],
      ligacoesPelaSiglaRecusadas: [],
    },
  };
}

describe("os arquivos publicados passam nos leitores do site com 0 descartes", () => {
  it("tarifas.json, relatorio.json e todos os municipios/{UF}.json", async () => {
    expect(lerArquivoTarifas(await lerJson(join(PUBLICADOS, "tarifas.json"))).descartados).toBe(0);
    const relatorio = await lerJson(join(PUBLICADOS, "relatorio.json"));
    expect(() => lerRelatorioDosDados(relatorio)).not.toThrow();
    const nomes = await readdir(join(PUBLICADOS, "municipios"));
    expect(nomes).toHaveLength(27);
    for (const nome of nomes) {
      const uf = nome.replace(/\.json$/, "");
      if (!ehUf(uf)) throw new Error(`arquivo de UF desconhecida: ${nome}`);
      expect(lerArquivoMunicipios(await lerJson(join(PUBLICADOS, "municipios", nome)), uf).descartados, nome).toBe(0);
    }
  });
});

describe("conferirFormato", () => {
  let pasta: string | undefined;
  afterEach(async () => {
    if (pasta) await rm(pasta, { recursive: true, force: true });
    pasta = undefined;
  });

  it("montagem válida: nenhum problema", () => {
    expect(conferirFormato(montagemValida())).toEqual([]);
  });

  it("recusa a tarifa -1, e escreverArquivos não grava nada (não existe --forcar para isso)", async () => {
    const m = montagemValida();
    const [ess] = m.tarifas.distribuidoras;
    if (!ess) throw new Error("montagem sem distribuidora");
    m.tarifas.distribuidoras = [{ ...ess, tarifaKwh: -1 }];
    expect(conferirFormato(m)).toEqual(["tarifas.json: 1 entrada(s) fora do formato ou da faixa (o site tiraria)."]);

    pasta = await mkdtemp(join(tmpdir(), "ee-formato-"));
    await expect(escreverArquivos(m, pasta)).rejects.toThrow(/Formato inválido; nada foi gravado/);
    expect(await readdir(pasta)).toEqual([]);
  });

  it("aponta município de outra UF, UF desconhecida e relatório inválido", () => {
    const m = montagemValida();
    const [sp] = m.municipiosPorUF;
    if (!sp) throw new Error("montagem sem SP");
    m.municipiosPorUF = [{ ...sp, municipios: [...sp.municipios, { ibge: 3_304_557, nome: "Rio de Janeiro", uf: "RJ", distribuidoras: ["light-sesa"] }] }, { ...sp, uf: "XX" }];
    m.relatorio = { ...m.relatorio, municipios: -1 };
    expect(conferirFormato(m)).toEqual([
      "municipios/SP.json: 1 entrada(s) fora do formato ou da faixa (o site tiraria).",
      "municipios/XX.json: UF desconhecida.",
      "relatorio.json: contagem de municípios inválida.",
    ]);
  });

  it("montagem válida é gravada", async () => {
    pasta = await mkdtemp(join(tmpdir(), "ee-formato-"));
    const { mudou } = await escreverArquivos(montagemValida(), pasta);
    expect(mudou).toBe(true);
    expect((await readdir(pasta)).sort()).toEqual(["municipios", "relatorio.json", "tarifas.json"]);
  });
});

describe("validar: bandeira acima de R$ 0,15 por kWh (unidade errada) aceita --forcar", () => {
  it("0,142 passa; 0,1885 vira erro de variação", () => {
    const m = montagemValida();
    const comBandeira = (adicionalKwh: number) => validar({ ...m, tarifas: { ...m.tarifas, bandeiras: [{ competencia: "2026-10", bandeira: "amarela", nome: "Amarela", adicionalKwh }] } }, "2026-10-30");
    expect(comBandeira(0.142).some((e) => e.startsWith("Bandeira acima"))).toBe(false);
    expect(comBandeira(0.1885).some((e) => e.startsWith("Bandeira acima"))).toBe(true);
  });
});

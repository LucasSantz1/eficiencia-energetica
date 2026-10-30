import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { VinculoMunicipio } from "../src/aneel/municipios";
import type { TarifaVigente } from "../src/aneel/tarifas";
import { arquivosNaPasta, lerFontes, type Fontes } from "../src/fontes";
import { montarArquivos, type Montagem } from "../src/montar";
import { montarComAsFontes } from "../src/rotina";
import { carregarSucessoes, lerSucessoes, type Sucessao } from "../src/sucessoes";

const pasta = (nome: string) => fileURLToPath(new URL(`../fixtures/sucessao/${nome}`, import.meta.url));
const HOJE = "2026-10-30";

let fontesLidas: Fontes | undefined;
async function fontes(): Promise<Fontes> {
  fontesLidas ??= await lerFontes({ arquivos: arquivosNaPasta(pasta("")), hoje: HOJE, baixar: false, usarApiIbge: false, registrar: () => {} });
  return fontesLidas;
}
async function montar(sucessoes?: Sucessao[]): Promise<Montagem> {
  return montarComAsFontes(await fontes(), { hoje: HOJE, geradoEm: `${HOJE}T12:00:00.000Z`, sucessoes: sucessoes ?? (await carregarSucessoes(pasta("sucessoes.json"))) });
}
const cidade = (m: Montagem, ibge: number) => m.municipiosPorUF.flatMap((a) => a.municipios).find((x) => x.ibge === ibge)?.distribuidoras;

const ALEGRETE = 4300406;
const ASSIS = 3504008;
const UBERABA = 3170107;
const MONTES_CLAROS = 3143302;
const RANCHARIA = 3542206;

describe("D1: mesmo CNPJ é a mesma empresa (critério 4)", () => {
  it("o conjunto com SigAgente RGE SUL fica com a RGE, e rge-sul vira substituída", async () => {
    const m = await montar();
    expect(cidade(m, ALEGRETE)).toEqual(["rge"]);
    expect(m.tarifas.substituidas).toMatchObject({ "rge-sul": "rge" });
    expect(m.tarifas.distribuidoras.map((d) => d.id)).not.toContain("rge-sul");
    expect(m.relatorio.renomeacoesPorCnpj).toEqual([{ de: "rge-sul", para: "rge", cnpj: "02016440000162", municipios: 1 }]);
  });

  it("duas siglas vigentes com o mesmo CNPJ ficam as duas (o V2 para a rotina)", () => {
    const tarifa = (sigla: string, inicio: string): TarifaVigente => ({ sigla, cnpj: "44444444000144", teKwh: 0.3, tusdKwh: 0.4, inicioVigencia: inicio, fimVigencia: "2027-06-30" });
    const m = montarArquivos({ ...vazia(), tarifas: [tarifa("AREA A", "2026-07-01"), tarifa("AREA B", "2026-01-01")] });
    expect(m.tarifas.distribuidoras.map((d) => d.id)).toEqual(["area-a", "area-b"]);
    expect(m.tarifas.substituidas).toEqual({});
  });
});

describe("D2 e D3: conjunto que parou de reportar (critério 5)", () => {
  it("com linha de sucessão, a cidade fica com a sucessora", async () => {
    const m = await montar();
    expect(m.relatorio.anoMaisRecenteDosConjuntos).toBe(2025);
    expect(cidade(m, ASSIS)).toEqual(["ess"]); // EDEVP parou em 2022, 3 anos antes de 2025
    expect(m.tarifas.substituidas).toEqual({ edevp: "ess", "rge-sul": "rge" });
    expect(m.relatorio.sucessoesAplicadas).toEqual([{ de: "EDEVP", para: "ESS", municipios: 1 }]);
  });

  it("sem linha de sucessão e com outro vínculo recente na cidade, o vínculo extinto sai", async () => {
    const m = await montar();
    expect(cidade(m, UBERABA)).toEqual(["ess"]);
    expect(m.relatorio.vinculosExtintosDescartados).toEqual([{ sigla: "CEMIG-D", municipios: 1 }]);
  });

  it("sem linha de sucessão e sendo o único vínculo, o vínculo fica, com aviso", async () => {
    const m = await montar();
    expect(cidade(m, MONTES_CLAROS)).toEqual(["cemig-d"]);
    expect(m.relatorio.vinculosExtintosMantidos).toEqual([{ sigla: "CEMIG-D", municipios: 1 }]);
  });

  it("sem o sucessoes.json, a empresa vencida fica sem tarifa (o V5 para a rotina)", async () => {
    const m = await montar([]);
    expect(cidade(m, ASSIS)).toEqual([]);
    expect(m.relatorio.agentesSemTarifa).toEqual(["COOP Z", "EDEVP"]);
    expect(m.relatorio.vinculosExtintosMantidos.map((c) => c.sigla)).toEqual(["CEMIG-D", "EDEVP"]);
    expect(m.tarifas.substituidas).toEqual({ "rge-sul": "rge" });
  });

  it("D4 na montagem: tarifa vencida há 7 meses tira a cidade e aparece no relatório", async () => {
    const m = await montar();
    expect(cidade(m, RANCHARIA)).toEqual([]);
    expect(m.relatorio.agentesSemTarifa).toEqual(["COOP Z"]);
    expect(m.relatorio.tarifasDescartadasPorVencimento.map((t) => t.sigla)).toEqual(["COOP Z", "EDEVP", "RGE SUL"]);
  });
});

describe("D2: regras da troca", () => {
  const linhaEbo = lerSucessoes({
    sucessoes: [
      {
        cnpjAntigo: "08826596000195",
        siglaAntiga: "EBO",
        cnpjSucessor: "09095183000140",
        siglaSucessora: "EPB",
        desde: "2023-08-28",
        ato: "REA ANEEL nº 12.687/2022",
        fonte: "https://abrapch.org.br/2022/09/diario-oficial-da-uniao-21-09-2022/",
        consultadoEm: "2026-10-30",
      },
    ],
  });
  const epb: TarifaVigente = { sigla: "EPB", cnpj: "09095183000140", teKwh: 0.3, tusdKwh: 0.4, inicioVigencia: "2026-08-28", fimVigencia: "2027-08-27" };

  it("tira o repetido (Campina Grande: EPB e EBO viram EPB uma vez)", () => {
    const vinculos = new Map<number, VinculoMunicipio[]>([
      [
        2504009,
        [
          { ibge: 2504009, agente: "EPB", cnpj: "09095183000140", ano: 2025 },
          { ibge: 2504009, agente: "EBO", cnpj: "08826596000195", ano: 2022 },
        ],
      ],
    ]);
    const m = montarArquivos({ ...vazia(), tarifas: [epb], vinculos, sucessoes: linhaEbo, anoMaisRecenteDosConjuntos: 2025 });
    expect(m.municipiosPorUF[0]?.municipios[0]?.distribuidoras).toEqual(["epb"]);
    expect(m.tarifas.substituidas).toEqual({ ebo: "epb" });
  });

  it("segue a sucessão pela sigla quando o vínculo não tem CNPJ", () => {
    const vinculos = new Map<number, VinculoMunicipio[]>([[2504009, [{ ibge: 2504009, agente: "EBO" }]]]);
    const m = montarArquivos({ ...vazia(), tarifas: [epb], vinculos, sucessoes: linhaEbo });
    expect(m.municipiosPorUF[0]?.municipios[0]?.distribuidoras).toEqual(["epb"]);
  });

  it("sucessora sem tarifa não entra em substituidas (o V4 acusa)", () => {
    const m = montarArquivos({ ...vazia(), tarifas: [], sucessoes: linhaEbo });
    expect(m.tarifas.substituidas).toEqual({});
  });
});

function vazia(): Parameters<typeof montarArquivos>[0] {
  return {
    tarifas: [],
    bandeiras: [],
    vinculos: new Map(),
    localidades: { estados: [{ uf: "PB", nome: "Paraíba" }], municipios: [{ ibge: 2504009, nome: "Campina Grande", uf: "PB" }] },
    hoje: HOJE,
    geradoEm: `${HOJE}T12:00:00.000Z`,
    origem: "aneel",
    fontes: [],
  };
}

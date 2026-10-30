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
const CAXIAS_DO_SUL = 4305108;
const ASSIS = 3504008;
const UBERABA = 3170107;
const MONTES_CLAROS = 3143302;
const UBERLANDIA = 3170206;
const RANCHARIA = 3542206;

describe("D1: mesmo CNPJ é a mesma empresa (critério 4)", () => {
  it("o conjunto com SigAgente RGE SUL fica com a RGE, e rge-sul vira substituída", async () => {
    const m = await montar();
    expect(cidade(m, ALEGRETE)).toEqual(["rge"]);
    expect(m.tarifas.substituidas).toMatchObject({ "rge-sul": "rge" });
    expect(m.tarifas.distribuidoras.map((d) => d.id)).not.toContain("rge-sul");
    expect(m.relatorio.renomeacoesPorCnpj).toEqual([{ de: "rge-sul", para: "rge", cnpj: "02016440000162", municipios: 1 }]);
  });

  // Passo 0 de novo (run 41130096649): a RGE antiga (02016439000138) foi incorporada pela RGE Sul, que virou a RGE de hoje
  // (02016440000162). Nome igual, CNPJ de outra raiz: sem a linha do sucessoes.json, 263 cidades ficavam sem a RGE.
  it("a RGE antiga (outro CNPJ) chega à RGE de hoje pela linha do sucessoes.json", async () => {
    const m = await montar();
    expect(cidade(m, CAXIAS_DO_SUL)).toEqual(["rge"]);
    expect(m.relatorio.ligacoesPelaSiglaRecusadas).toEqual([]);
    expect(m.relatorio.agentesSemTarifa).not.toContain("RGE");
    expect(Object.hasOwn(m.tarifas.substituidas, "rge")).toBe(false);
  });

  it("sem a linha, a RGE antiga fica sem tarifa e aparece como ligação recusada (o V5 para a rotina)", async () => {
    const semRge = (await carregarSucessoes(pasta("sucessoes.json"))).filter((s) => s.siglaAntiga !== "RGE");
    const m = await montar(semRge);
    expect(cidade(m, CAXIAS_DO_SUL)).toEqual([]);
    expect(m.relatorio.agentesSemTarifa).toContain("RGE");
    expect(m.relatorio.ligacoesPelaSiglaRecusadas).toEqual([{ sigla: "RGE", cnpj: "02016439000138", siglaDaTarifa: "RGE", cnpjDaTarifa: "02016440000162", municipios: 1 }]);
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
    expect(m.relatorio.sucessoesAplicadas).toEqual([
      { de: "EDEVP", para: "ESS", municipios: 1 },
      { de: "RGE", para: "RGE", municipios: 1 },
    ]);
  });

  it("sem linha de sucessão e com outro vínculo na cidade, o vínculo extinto sem tarifa sai", async () => {
    const m = await montar();
    // COOP Z (vencida, sem sucessão) parou em 2022; a ESS e a CEMIG-D ficam.
    expect(cidade(m, UBERABA)).toEqual(["cemig-d", "ess"]);
    expect(m.relatorio.vinculosExtintosDescartados).toEqual([{ sigla: "COOP Z", municipios: 1 }]);
  });

  it("sem linha de sucessão e sendo o único vínculo, o vínculo fica, com aviso (e o V5 acusa a falta de tarifa)", async () => {
    const m = await montar();
    expect(cidade(m, MONTES_CLAROS)).toEqual([]);
    expect(m.relatorio.vinculosExtintosMantidos).toEqual([{ sigla: "COOP Z", municipios: 1 }]);
    expect(m.relatorio.agentesSemTarifa).toContain("COOP Z");
  });

  // Passo 0: o D3 marcava a EQUATORIAL PI (vigente) como extinta em 222 cidades e tirava a ELETROCAR, a CEMIG-D e a
  // COELBA de outras. Empresa com tarifa publicada nunca é extinta, mesmo com um conjunto antigo.
  it("conjunto antigo de empresa vigente não é extinto: não sai da cidade nem entra no aviso", async () => {
    const m = await montar();
    expect(cidade(m, UBERLANDIA)).toEqual(["cemig-d"]);
    expect(cidade(m, UBERABA)).toContain("cemig-d");
    const extintos = [...m.relatorio.vinculosExtintosDescartados, ...m.relatorio.vinculosExtintosMantidos].map((c) => c.sigla);
    expect(extintos).not.toContain("CEMIG-D");
  });

  it("sem o sucessoes.json, a empresa vencida fica sem tarifa (o V5 para a rotina)", async () => {
    const m = await montar([]);
    expect(cidade(m, ASSIS)).toEqual([]);
    expect(m.relatorio.agentesSemTarifa).toEqual(["COOP Z", "EDEVP", "RGE"]);
    expect(m.relatorio.vinculosExtintosMantidos.map((c) => c.sigla)).toEqual(["COOP Z", "EDEVP"]);
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

  // Passo 0: a antiga CPFL SANTA CRUZ (61116265000144) caía na CPFL Santa Cruz de hoje (53859112000169) só pelo nome.
  describe("ADR-005: a sigla não liga CNPJs diferentes", () => {
    const santaCruz: TarifaVigente = { sigla: "CPFL Santa Cruz", cnpj: "53859112000169", teKwh: 0.3, tusdKwh: 0.5, inicioVigencia: "2026-04-22", fimVigencia: "2027-04-21" };
    const vinculo = (cnpj: string) => new Map<number, VinculoMunicipio[]>([[2504009, [{ ibge: 2504009, agente: "CPFL SANTA CRUZ", cnpj, ano: 2014 }]]]);
    const linhaSantaCruz = lerSucessoes({
      sucessoes: [
        {
          cnpjAntigo: "61116265000144",
          siglaAntiga: "CPFL SANTA CRUZ",
          cnpjSucessor: "53859112000169",
          siglaSucessora: "CPFL Santa Cruz",
          desde: "2018-01-01",
          ato: "Ato de teste",
          fonte: "https://exemplo.gov.br/ato",
          consultadoEm: "2026-10-30",
        },
      ],
    });

    it("sem linha de sucessão, o vínculo fica sem tarifa (o V5 acusa) e aparece no relatório", () => {
      const m = montarArquivos({ ...vazia(), tarifas: [santaCruz], vinculos: vinculo("61116265000144") });
      expect(m.municipiosPorUF[0]?.municipios[0]?.distribuidoras).toEqual([]);
      expect(m.relatorio.agentesSemTarifa).toEqual(["CPFL SANTA CRUZ"]);
      expect(m.relatorio.ligacoesPelaSiglaRecusadas).toEqual([
        { sigla: "CPFL SANTA CRUZ", cnpj: "61116265000144", siglaDaTarifa: "CPFL Santa Cruz", cnpjDaTarifa: "53859112000169", municipios: 1 },
      ]);
    });

    it("com a linha de sucessão, a cidade fica com a sucessora, sem entrar em substituidas (o id é o mesmo)", () => {
      const m = montarArquivos({ ...vazia(), tarifas: [santaCruz], vinculos: vinculo("61116265000144"), sucessoes: linhaSantaCruz });
      expect(m.municipiosPorUF[0]?.municipios[0]?.distribuidoras).toEqual(["cpfl-santa-cruz"]);
      expect(m.relatorio.sucessoesAplicadas).toEqual([{ de: "CPFL SANTA CRUZ", para: "CPFL Santa Cruz", municipios: 1 }]);
      expect(m.tarifas.substituidas).toEqual({});
      expect(m.relatorio.ligacoesPelaSiglaRecusadas).toEqual([]);
    });

    it("vínculo sem CNPJ com o nome da empresa de hoje fica com ela, sem contar como sucessão", () => {
      const semCnpj = new Map<number, VinculoMunicipio[]>([[2504009, [{ ibge: 2504009, agente: "CPFL Santa Cruz", ano: 2014 }]]]);
      const m = montarArquivos({ ...vazia(), tarifas: [santaCruz], vinculos: semCnpj, sucessoes: linhaSantaCruz });
      expect(m.municipiosPorUF[0]?.municipios[0]?.distribuidoras).toEqual(["cpfl-santa-cruz"]);
      expect(m.relatorio.sucessoesAplicadas).toEqual([]);
    });

    it("mesma raiz de CNPJ (outra filial) é a mesma empresa: a sigla liga", () => {
      const m = montarArquivos({ ...vazia(), tarifas: [santaCruz], vinculos: vinculo("53859112000250") });
      expect(m.municipiosPorUF[0]?.municipios[0]?.distribuidoras).toEqual(["cpfl-santa-cruz"]);
    });
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

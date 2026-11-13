import { describe, expect, it } from "vitest";
import publicadoMG from "../../../apps/web/public/dados/municipios/MG.json";
import relatorioPublicado from "../../../apps/web/public/dados/relatorio.json";
import tarifasPublicadas from "../../../apps/web/public/dados/tarifas.json";
import {
  CAMPOS_DOS_ARQUIVOS_PUBLICOS,
  ErroDeFormato,
  lerArquivoMunicipios,
  lerArquivoTarifas,
  lerRelatorioDosDados,
  type ArquivoMunicipios,
  type ArquivoTarifas,
  type BandeiraMes,
  type Distribuidora,
} from "../src";

const distribuidora: Required<Distribuidora> = {
  id: "ambar-amazonas",
  sigla: "Âmbar Amazonas",
  cnpj: "02341467000120",
  ufs: ["AM"],
  teKwh: 0.28111,
  tusdKwh: 0.5946,
  tarifaKwh: 0.87571,
  inicioVigencia: "2026-05-26",
  fimVigencia: "2027-05-25",
  resolucao: "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.588, DE 19 DE MAIO DE 2026",
};
const verde: BandeiraMes = { competencia: "2026-10", bandeira: "verde", nome: "Verde", adicionalKwh: 0 };
const amarela: BandeiraMes = { competencia: "2026-09", bandeira: "amarela", nome: "Amarela", adicionalKwh: 0.01885 };
const tarifas: ArquivoTarifas = {
  geradoEm: "2026-10-29T13:55:43.455Z",
  origem: "aneel",
  fontes: ["ANEEL — Tarifas de aplicação"],
  distribuidoras: [distribuidora],
  bandeiras: [amarela, verde],
  estados: [{ uf: "AM", nome: "Amazonas", distribuidoras: ["ambar-amazonas"] }],
};
const municipios: ArquivoMunicipios = {
  uf: "SP",
  geradoEm: "2026-10-29T13:55:43.455Z",
  origem: "aneel",
  municipios: [
    { ibge: 3_541_406, nome: "Presidente Prudente", uf: "SP", distribuidoras: ["ess"] },
    { ibge: 3_550_308, nome: "São Paulo", uf: "SP", distribuidoras: ["eletropaulo"] },
  ],
};

const comDistribuidora = (mudanca: Record<string, unknown>) => lerArquivoTarifas({ ...tarifas, distribuidoras: [{ ...distribuidora, ...mudanca }] });
const comBandeira = (mudanca: Record<string, unknown>) => lerArquivoTarifas({ ...tarifas, bandeiras: [{ ...amarela, ...mudanca }] });
const ficou = (lido: { descartados: number }) => lido.descartados === 0;

describe("arquivos publicados hoje passam com 0 descartes (contra falso positivo)", () => {
  it("P7: tarifas.json", () => {
    const lido = lerArquivoTarifas(tarifasPublicadas);
    expect(lido.descartados).toBe(0);
    expect(lido.arquivo).toEqual(tarifasPublicadas);
  });

  it("municipios/MG.json e relatorio.json", () => {
    const lido = lerArquivoMunicipios(publicadoMG, "MG");
    expect(lido.descartados).toBe(0);
    expect(lido.arquivo).toEqual(publicadoMG);
    expect(lerRelatorioDosDados(relatorioPublicado)).toEqual({ municipios: 5_571, municipiosSemDistribuidora: 10 });
  });

  it("cada leitor devolve todos os campos da sua lista (R4c)", () => {
    const chaves = (objeto: object | undefined) => Object.keys(objeto ?? {}).sort();
    const lido = lerArquivoTarifas(tarifas).arquivo;
    expect(chaves(lido)).toEqual([...CAMPOS_DOS_ARQUIVOS_PUBLICOS.tarifas].sort());
    expect(chaves(lido.distribuidoras[0])).toEqual([...CAMPOS_DOS_ARQUIVOS_PUBLICOS.distribuidora].sort());
    expect(chaves(lido.bandeiras[0])).toEqual([...CAMPOS_DOS_ARQUIVOS_PUBLICOS.bandeira].sort());
    expect(chaves(lido.estados[0])).toEqual([...CAMPOS_DOS_ARQUIVOS_PUBLICOS.estado].sort());
    const lidoSP = lerArquivoMunicipios(municipios, "SP").arquivo;
    expect(chaves(lidoSP)).toEqual([...CAMPOS_DOS_ARQUIVOS_PUBLICOS.municipios].sort());
    expect(chaves(lidoSP.municipios[0])).toEqual([...CAMPOS_DOS_ARQUIVOS_PUBLICOS.municipio].sort());
  });

  it("opcionais ausentes (sem cnpj, fim de vigência e resolução) passam", () => {
    const { cnpj: _c, fimVigencia: _f, resolucao: _r, ...minima } = distribuidora;
    const lido = lerArquivoTarifas({ ...tarifas, distribuidoras: [minima] });
    expect(lido.descartados).toBe(0);
    expect(lido.arquivo.distribuidoras).toEqual([minima]);
  });
});

describe("estrutura errada lança ErroDeFormato", () => {
  it.each([
    ["nulo", null],
    ["lista", []],
    ["texto HTML", "<!doctype html>"],
    ["objeto vazio", {}],
    ["sem a lista de distribuidoras", { ...tarifas, distribuidoras: undefined }],
    ["bandeiras que não são lista", { ...tarifas, bandeiras: {} }],
    ["origem desconhecida", { ...tarifas, origem: "outra" }],
    ["sem geradoEm", { ...tarifas, geradoEm: "" }],
  ])("tarifas: %s", (_caso, bruto) => {
    expect(() => lerArquivoTarifas(bruto)).toThrow(ErroDeFormato);
  });

  it("municípios: `uf` trocada lança", () => {
    expect(() => lerArquivoMunicipios(municipios, "RJ")).toThrow(ErroDeFormato);
    expect(() => lerArquivoMunicipios({ ...municipios, uf: "../x" }, "SP")).toThrow(ErroDeFormato);
    expect(() => lerArquivoMunicipios({ ...municipios, municipios: "x" }, "SP")).toThrow(ErroDeFormato);
  });

  it("relatório inválido lança", () => {
    for (const bruto of [null, {}, { municipios: -1, municipiosSemDistribuidora: 0 }, { municipios: 10, municipiosSemDistribuidora: 11 }, { municipios: "5571", municipiosSemDistribuidora: 10 }]) {
      expect(() => lerRelatorioDosDados(bruto)).toThrow(ErroDeFormato);
    }
  });
});

describe("entrada inválida sai e conta (faixas da P-tl-2)", () => {
  it("tarifa -1 ou em texto: 1 descartada, e as outras ficam", () => {
    const outra = { ...distribuidora, id: "outra", sigla: "OUTRA" };
    const lido = lerArquivoTarifas({ ...tarifas, distribuidoras: [{ ...distribuidora, tarifaKwh: -1 }, outra, { ...distribuidora, id: "x", tarifaKwh: "0,8" }] });
    expect(lido.descartados).toBe(2);
    expect(lido.arquivo.distribuidoras).toEqual([outra]);
  });

  it("P1 e P2: piso e teto da tarifa (com TE e TUSD coerentes)", () => {
    const comTarifa = (tarifaKwh: number) => comDistribuidora({ teKwh: 0, tusdKwh: tarifaKwh, tarifaKwh });
    expect([0.05, 0.050001, 3, 3.000001].map((t) => ficou(comTarifa(t)))).toEqual([false, true, true, false]);
    expect(ficou(comTarifa(875.71))).toBe(false);
    expect(ficou(comTarifa(0.00087571))).toBe(false);
  });

  it("P3: TE 0 fica; TE negativa e TUSD 3,01 saem", () => {
    expect(ficou(comDistribuidora({ teKwh: 0, tusdKwh: 0.87571 }))).toBe(true);
    expect(ficou(comDistribuidora({ teKwh: -0.01, tusdKwh: 0.88571 }))).toBe(false);
    expect(ficou(comDistribuidora({ teKwh: 0, tusdKwh: 3.01, tarifaKwh: 3.01 }))).toBe(false);
  });

  it("P4: TE + TUSD tem que dar a tarifa", () => {
    expect(ficou(comDistribuidora({ teKwh: 0.28111, tusdKwh: 0.5946, tarifaKwh: 0.87571 }))).toBe(true);
    expect(ficou(comDistribuidora({ teKwh: 0.28111, tusdKwh: 0.5946, tarifaKwh: 0.9 }))).toBe(false);
  });

  it("P5: acréscimo da bandeira", () => {
    expect([0.142, 1, 1.000001, 142, 14.2, -0.01].map((adicionalKwh) => ficou(comBandeira({ adicionalKwh })))).toEqual([true, true, false, false, false, false]);
  });

  it("P6: amarela com 0 sai; verde com acréscimo sai", () => {
    expect(ficou(comBandeira({ adicionalKwh: 0 }))).toBe(false);
    expect(ficou(comBandeira({ bandeira: "verde", adicionalKwh: 0.01885 }))).toBe(false);
  });

  it("distribuidora: id fora do formato, UF inválida, data que não existe ou CNPJ errado saem", () => {
    for (const mudanca of [{ id: "../x" }, { id: "CEMIG" }, { ufs: ["XX"] }, { ufs: "AM" }, { inicioVigencia: "2026-02-30" }, { fimVigencia: "amanhã" }, { cnpj: "123" }, { sigla: "" }]) {
      expect(ficou(comDistribuidora(mudanca)), JSON.stringify(mudanca)).toBe(false);
    }
  });

  it("id e competência repetidos saem", () => {
    expect(lerArquivoTarifas({ ...tarifas, distribuidoras: [distribuidora, distribuidora] }).descartados).toBe(1);
    expect(lerArquivoTarifas({ ...tarifas, bandeiras: [verde, verde] }).descartados).toBe(1);
  });

  it("município sem IBGE, de outra UF ou com distribuidora fora do formato sai", () => {
    const [prudente, saoPaulo] = municipios.municipios;
    const lido = lerArquivoMunicipios(
      { ...municipios, municipios: [prudente, { ...saoPaulo, ibge: undefined }, { ...saoPaulo, uf: "RJ" }, { ...saoPaulo, distribuidoras: ["a/b"] }, { ...saoPaulo, ibge: "3550308" }] },
      "SP",
    );
    expect(lido.descartados).toBe(4);
    expect(lido.arquivo.municipios).toEqual([prudente]);
  });

  it("`__proto__` e chave extra não passam para o resultado", () => {
    const bruto = JSON.parse(`{"geradoEm":"x","origem":"aneel","fontes":[],"distribuidoras":[],"bandeiras":[],"estados":[],"__proto__":{"origem":"exemplo"},"extra":1}`);
    const lido = lerArquivoTarifas(bruto);
    expect(Object.getPrototypeOf(lido.arquivo)).toBe(Object.prototype);
    expect(Object.hasOwn(lido.arquivo, "extra")).toBe(false);
  });
});

describe("P8: substituidas (HIS-111, V8 no leitor do site)", () => {
  const outra: Distribuidora = { ...distribuidora, id: "rge", sigla: "RGE" };
  const comSubstituidas = (substituidas: unknown) => lerArquivoTarifas({ ...tarifas, distribuidoras: [distribuidora, outra], substituidas });

  it("ausente vira {}, sem descarte", () => {
    const lido = lerArquivoTarifas(tarifas);
    expect(lido.arquivo.substituidas).toEqual({});
    expect(lido.descartados).toBe(0);
  });

  it('{"rge-sul": "rge"} fica', () => {
    const lido = comSubstituidas({ "rge-sul": "rge" });
    expect(lido.arquivo.substituidas).toEqual({ "rge-sul": "rge" });
    expect(lido.descartados).toBe(0);
  });

  it("valor que não está publicado, chave que é id publicado e valor fora do formato saem", () => {
    const lido = comSubstituidas({ "rge-sul": "nao-existe", "ambar-amazonas": "rge", antiga: "RGE", outra: 2, certa: "rge" });
    expect(lido.arquivo.substituidas).toEqual({ certa: "rge" });
    expect(lido.descartados).toBe(4);
  });

  it('chave "__proto__" sai e o protótipo continua o normal', () => {
    const lido = comSubstituidas(JSON.parse('{"__proto__": "rge", "rge-sul": "rge"}'));
    expect(lido.arquivo.substituidas).toEqual({ "rge-sul": "rge" });
    expect(Object.getPrototypeOf(lido.arquivo.substituidas)).toBe(Object.prototype);
    expect(lido.descartados).toBe(1);
  });

  it("cadeia a → b + b → rge: sai a entrada cujo valor também é chave, olhando o objeto original", () => {
    const lido = comSubstituidas({ a: "b", b: "rge" });
    expect(lido.arquivo.substituidas).toEqual({ b: "rge" });
    expect(lido.descartados).toBe(1);
    // A ordem não muda o resultado (R7 da seguranca).
    expect(comSubstituidas({ b: "rge", a: "b" }).arquivo.substituidas).toEqual({ b: "rge" });
  });

  it.each([
    ["nulo", null],
    ["lista", []],
    ["número", 1],
    ["texto", "rge"],
  ])("não objeto simples (%s) lança", (_nome, substituidas) => {
    expect(() => comSubstituidas(substituidas)).toThrow(ErroDeFormato);
  });

  it("500 entradas passam; 501 lançam", () => {
    const entradas = (n: number) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`antiga-${i}`, "rge"]));
    expect(comSubstituidas(entradas(500)).descartados).toBe(0);
    expect(() => comSubstituidas(entradas(501))).toThrow(ErroDeFormato);
  });

  it("distribuidoras: [null] não lança: a entrada sai e conta", () => {
    const lido = lerArquivoTarifas({ ...tarifas, distribuidoras: [null] });
    expect(lido.arquivo.distribuidoras).toEqual([]);
    expect(lido.descartados).toBe(1);
  });
});

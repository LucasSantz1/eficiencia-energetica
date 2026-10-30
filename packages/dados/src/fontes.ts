/**
 * Baixa (quando pedido) e lê os quatro CSVs da ANEEL e a lista do IBGE.
 *
 * Fica separado do `atualizar.ts` para que a rotina diária e o diagnóstico (`diagnosticar.ts`, HIS-111, T3) leiam
 * os dados com o mesmo código: o que o diagnóstico mostra é o que a rotina vai publicar.
 */
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BandeiraMes } from "@ee/core";
import { umaLinha } from "./anotacoes";
import { lerBandeiras, URL_BANDEIRAS } from "./aneel/bandeiras";
import {
  criarLeitorConjuntos,
  lerVinculos,
  mapearColunasConjuntos,
  mapearColunasMunicipios,
  URL_CONJUNTOS_DISTRIBUIDORAS,
  URL_CONJUNTOS_MUNICIPIOS,
  type VinculoMunicipio,
} from "./aneel/municipios";
import { ehTarifaResidencialB1, mapearColunasTarifas, selecionarTarifasVigentes, URL_TARIFAS, type ColunasTarifas } from "./aneel/tarifas";
import { baixar, lerCSV } from "./csv";
import { carregarLocalidades } from "./ibge";
import type { Localidades } from "./montar";
import type { Linha } from "./util";

/** Pasta onde a rotina guarda os CSVs baixados (está no `.gitignore`). */
export const PASTA_CACHE = fileURLToPath(new URL("../.cache/", import.meta.url));

export interface ArquivosDasFontes {
  tarifas: string;
  bandeiras: string;
  conjuntosMunicipios: string;
  conjuntosDistribuidoras: string;
}

/** Nomes dos CSVs dentro da pasta de cache (os mesmos usados pelas fixtures de `fixtures/sucessao/`). */
export function arquivosNaPasta(pasta: string): ArquivosDasFontes {
  return {
    tarifas: join(pasta, "tarifas.csv"),
    bandeiras: join(pasta, "bandeiras.csv"),
    conjuntosMunicipios: join(pasta, "conjuntos-municipios.csv"),
    conjuntosDistribuidoras: join(pasta, "conjuntos-distribuidoras.csv"),
  };
}

export type LeitorConjuntos = ReturnType<typeof criarLeitorConjuntos>;
export type ColunasMunicipios = ReturnType<typeof mapearColunasMunicipios>;

export interface Fontes {
  tarifas: { colunas: ColunasTarifas; linhasB1: Linha[]; totalDeLinhas: number; selecao: ReturnType<typeof selecionarTarifasVigentes> };
  bandeiras: BandeiraMes[];
  conjuntos: LeitorConjuntos;
  /** Linhas do IndQual Município (conjunto → município), guardadas para o diagnóstico. */
  indQual: { colunas: ColunasMunicipios; linhas: Linha[] };
  vinculos: Map<number, VinculoMunicipio[]>;
  conjuntosSemDono: number;
  localidades: Localidades;
  fonteIbge: string;
}

export interface OpcoesDeLeitura {
  arquivos: ArquivosDasFontes;
  hoje: string;
  /** false = reaproveita os CSVs que já estão em `arquivos` (testes e `--sem-baixar`). */
  baixar: boolean;
  /** false = usa só a cópia do IBGE em `base/` (a API do IBGE falha nos runners do GitHub). */
  usarApiIbge: boolean;
  /** Recebe cada linha de progresso já em uma linha só (R2). */
  registrar?: (linha: string) => void;
}

/** Fontes citadas no `tarifas.json`. */
export function descreverFontes(fonteIbge: string): string[] {
  return [
    "ANEEL — Tarifas de aplicação das distribuidoras de energia elétrica",
    "ANEEL — Bandeiras Tarifárias (acionamento)",
    "ANEEL — IndQual Município e Indicadores Coletivos de Continuidade (conjuntos elétricos)",
    fonteIbge,
  ];
}

export async function lerFontes(opcoes: OpcoesDeLeitura): Promise<Fontes> {
  const { arquivos, hoje } = opcoes;
  const escrever = opcoes.registrar ?? ((linha: string) => console.log(linha));
  const registrar = (texto: string) => escrever(umaLinha(texto));

  async function etapa<T>(nome: string, fn: () => Promise<T>): Promise<T> {
    const inicio = Date.now();
    registrar(`▶ ${nome}`);
    const r = await fn();
    registrar(`  ok em ${((Date.now() - inicio) / 1000).toFixed(1)} s`);
    return r;
  }

  if (opcoes.baixar) {
    await etapa("Baixando tarifas das distribuidoras (ANEEL)", () => baixar(URL_TARIFAS, arquivos.tarifas));
    await etapa("Baixando bandeiras tarifárias (ANEEL)", () => baixar(URL_BANDEIRAS, arquivos.bandeiras));
    await etapa("Baixando municípios de cada conjunto elétrico (ANEEL)", () => baixar(URL_CONJUNTOS_MUNICIPIOS, arquivos.conjuntosMunicipios));
    await etapa("Baixando distribuidora de cada conjunto elétrico (ANEEL)", () => baixar(URL_CONJUNTOS_DISTRIBUIDORAS, arquivos.conjuntosDistribuidoras));
  }

  const tarifas = await etapa("Lendo tarifas residenciais B1", async () => {
    let colunas: ColunasTarifas | undefined;
    const exigirColunas = (): ColunasTarifas => {
      if (!colunas) throw new Error("O CSV de tarifas não tem cabeçalho.");
      return colunas;
    };
    const lido = await lerCSV(arquivos.tarifas, {
      aoLerCabecalho: (cab) => {
        registrar(`  colunas: ${cab.join(" | ")}`);
        colunas = mapearColunasTarifas(cab);
      },
      filtro: (linha) => ehTarifaResidencialB1(linha, exigirColunas()),
    });
    const c = exigirColunas();
    registrar(`  ${lido.total} linhas no arquivo, ${lido.linhas.length} residenciais B1 convencionais`);
    const selecao = selecionarTarifasVigentes(lido.linhas, c, hoje);
    registrar(`  ${selecao.tarifas.length} distribuidoras com tarifa vigente`);
    for (const d of selecao.descartadas) registrar(`  descartada — ${d}`);
    const amostra = selecao.tarifas.slice(0, 5).map((t) => `${t.sigla}: R$ ${(t.teKwh + t.tusdKwh).toFixed(4)}/kWh desde ${t.inicioVigencia}`);
    registrar(`  amostra: ${amostra.join("; ")}`);
    return { colunas: c, linhasB1: lido.linhas, totalDeLinhas: lido.total, selecao };
  });

  const bandeiras = await etapa("Lendo bandeiras", async () => {
    const lido = await lerCSV(arquivos.bandeiras);
    registrar(`  colunas: ${lido.cabecalho.join(" | ")}`);
    const r = lerBandeiras(lido.cabecalho, lido.linhas);
    for (const a of r.avisos.slice(0, 5)) registrar(`  ${a}`);
    registrar(`  últimas: ${r.bandeiras.slice(-4).map((b) => `${b.competencia} ${b.nome} (+R$ ${b.adicionalKwh}/kWh)`).join("; ")}`);
    return r.bandeiras;
  });

  const municipios = await etapa("Ligando municípios às distribuidoras", async () => {
    let leitor: LeitorConjuntos | undefined;
    const exigirLeitor = (): LeitorConjuntos => {
      if (!leitor) throw new Error("O CSV de conjuntos elétricos não tem cabeçalho.");
      return leitor;
    };
    const atributos = await lerCSV(arquivos.conjuntosDistribuidoras, {
      aoLerCabecalho: (cab) => {
        registrar(`  colunas (conjuntos): ${cab.join(" | ")}`);
        leitor = criarLeitorConjuntos(mapearColunasConjuntos(cab));
      },
      filtro: (linha) => {
        exigirLeitor().ler(linha);
        return false; // não guarda as linhas: só o dono de cada conjunto
      },
    });
    const conjuntos = exigirLeitor();
    registrar(`  ${atributos.total} linhas, ${conjuntos.donos.size} conjuntos elétricos com distribuidora`);
    const lido = await lerCSV(arquivos.conjuntosMunicipios);
    registrar(`  colunas (municípios): ${lido.cabecalho.join(" | ")}`);
    const colunas = mapearColunasMunicipios(lido.cabecalho);
    const { vinculos, conjuntosSemDono } = lerVinculos(lido.linhas, colunas, conjuntos.donos);
    registrar(`  ${vinculos.size} municípios com distribuidora; ${conjuntosSemDono} conjuntos sem distribuidora conhecida`);
    return { conjuntos, indQual: { colunas, linhas: lido.linhas }, vinculos, conjuntosSemDono };
  });

  const { localidades, fonte: fonteIbge } = await etapa("Carregando municípios do IBGE", () => carregarLocalidades(opcoes.usarApiIbge));

  return { tarifas, bandeiras, ...municipios, localidades, fonteIbge };
}

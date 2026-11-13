import "server-only"; // primeiro import: o build falha se este arquivo chegar ao navegador (ADR-001)
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { lerArquivoTarifas, lerRelatorioDosDados, type ArquivoTarifas } from "@ee/core";

// Único lugar do site que lê o disco: os arquivos que a rotina diária publica em public/dados
// (dados abertos da ANEEL e do IBGE), lidos no servidor para a página inicial já sair com os números.
// Passam pelos mesmos leitores do navegador e da rotina (HIS-003a, D4). Arquivo fora do formato lança: no build, o
// build falha; na revalidação, o Next segue servindo a última versão boa da página.

export interface RelatorioDados {
  municipios: number;
  municipiosSemDistribuidora: number;
}

/** process.cwd() na chamada (não no carregamento do módulo), como a página fazia antes. */
function pastaDosDados(): string {
  return join(process.cwd(), "public", "dados");
}

async function lerJson(arquivo: string): Promise<unknown> {
  return JSON.parse(await readFile(join(pastaDosDados(), arquivo), "utf8"));
}

export async function lerTarifasPublicadas(): Promise<ArquivoTarifas> {
  return lerArquivoTarifas(await lerJson("tarifas.json")).arquivo;
}

export async function lerRelatorioPublicado(): Promise<RelatorioDados> {
  return lerRelatorioDosDados(await lerJson("relatorio.json"));
}

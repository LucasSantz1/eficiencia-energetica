import "server-only"; // primeiro import: o build falha se este arquivo chegar ao navegador (ADR-001)
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ArquivoTarifas } from "@ee/core";

// Único lugar do site que lê o disco: os arquivos que a rotina diária publica em public/dados
// (dados abertos da ANEEL e do IBGE), lidos no servidor para a página inicial já sair com os números.
// Os `as` ficam aqui, na fronteira; a validação com zod entra na HIS-003.

export interface RelatorioDados {
  municipios: number;
  municipiosSemDistribuidora: number;
}

/** process.cwd() na chamada (não no carregamento do módulo), como a página fazia antes. */
function pastaDosDados(): string {
  return join(process.cwd(), "public", "dados");
}

export async function lerTarifasPublicadas(): Promise<ArquivoTarifas> {
  return JSON.parse(await readFile(join(pastaDosDados(), "tarifas.json"), "utf8")) as ArquivoTarifas;
}

export async function lerRelatorioPublicado(): Promise<RelatorioDados> {
  return JSON.parse(await readFile(join(pastaDosDados(), "relatorio.json"), "utf8")) as RelatorioDados;
}

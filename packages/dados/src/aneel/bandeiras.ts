import { normalizarBandeira, BANDEIRAS, type BandeiraMes } from "@ee/core";
import { acharColuna, dataISO, numeroBR, type Linha } from "../util";

/**
 * Conjunto "Bandeiras Tarifárias — Acionamento" da ANEEL: a bandeira de cada mês.
 * https://dadosabertos.aneel.gov.br/dataset/bandeiras-tarifarias
 */
export const URL_BANDEIRAS =
  "https://dadosabertos.aneel.gov.br/dataset/7f43a020-6dc5-44b8-80b4-d97eaa94436c/resource/0591b8f6-fe54-437b-b72b-1aa2efd46e42/download/bandeira-tarifaria-acionamento.csv";

/**
 * O adicional da bandeira já foi divulgado em R$/kWh, R$/100 kWh e R$/MWh (o arquivo atual da ANEEL usa R$/MWh:
 * amarela = 18,85). A unidade é a mesma no arquivo inteiro, então ela é descoberta pelo MAIOR valor do arquivo —
 * a bandeira mais cara já cobrada ficou abaixo de R$ 0,15 por kWh.
 */
export function divisorDaUnidade(valores: number[]): number {
  const maior = Math.max(0, ...valores);
  if (maior <= 0.3) return 1; // R$/kWh
  if (maior <= 20) return 100; // R$/100 kWh
  return 1000; // R$/MWh
}

export function lerBandeiras(cabecalho: string[], linhas: Linha[]): { bandeiras: BandeiraMes[]; avisos: string[] } {
  const colCompetencia = acharColuna(cabecalho, "DatCompetencia", /competencia/);
  const colNome = acharColuna(cabecalho, "NomBandeiraAcionada", /bandeira/);
  const colValor = acharColuna(cabecalho, "VlrAdicionalBandeira", /adicional|valor|vlr/);
  if (!colCompetencia || !colNome || !colValor) {
    throw new Error(`Colunas de bandeiras não encontradas. Cabeçalho: ${cabecalho.join(" | ")}`);
  }

  const avisos: string[] = [];
  const divisor = divisorDaUnidade(linhas.map((l) => numeroBR(l[colValor]) ?? 0));
  const porMes = new Map<string, BandeiraMes>();
  for (const linha of linhas) {
    const data = dataISO(linha[colCompetencia]);
    const nome = (linha[colNome] ?? "").trim();
    const bandeira = normalizarBandeira(nome);
    const bruto = numeroBR(linha[colValor]);
    if (!data || !bandeira) {
      if (nome) avisos.push(`linha ignorada: ${JSON.stringify(linha)}`);
      continue;
    }
    const competencia = data.slice(0, 7);
    const adicionalKwh = bandeira === "verde" ? 0 : (bruto ?? 0) / divisor;
    porMes.set(competencia, { competencia, bandeira, nome: BANDEIRAS[bandeira].nome, adicionalKwh: Number(adicionalKwh.toFixed(6)) });
  }

  const bandeiras = [...porMes.values()].sort((a, b) => a.competencia.localeCompare(b.competencia));
  return { bandeiras, avisos };
}

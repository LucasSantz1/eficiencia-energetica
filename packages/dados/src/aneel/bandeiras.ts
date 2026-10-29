import { normalizarBandeira, BANDEIRAS, type BandeiraMes } from "@ee/core";
import { acharColuna, dataISO, numeroBR, type Linha } from "../util";

/**
 * Conjunto "Bandeiras Tarifárias — Acionamento" da ANEEL: a bandeira de cada mês.
 * https://dadosabertos.aneel.gov.br/dataset/bandeiras-tarifarias
 */
export const URL_BANDEIRAS =
  "https://dadosabertos.aneel.gov.br/dataset/7f43a020-6dc5-44b8-80b4-d97eaa94436c/resource/0591b8f6-fe54-437b-b72b-1aa2efd46e42/download/bandeira-tarifaria-acionamento.csv";

/**
 * A ANEEL já publicou o adicional em R$/kWh, R$/100 kWh e R$/MWh em versões diferentes.
 * Os adicionais reais ficam entre R$ 0 e R$ 0,15 por kWh, então dá para descobrir a unidade pela ordem de grandeza.
 */
export function adicionalParaKwh(valor: number): number {
  if (valor <= 0.3) return valor; // R$/kWh
  if (valor <= 30) return valor / 100; // R$/100 kWh
  return valor / 1000; // R$/MWh
}

export function lerBandeiras(cabecalho: string[], linhas: Linha[]): { bandeiras: BandeiraMes[]; avisos: string[] } {
  const colCompetencia = acharColuna(cabecalho, "DatCompetencia", /competencia/);
  const colNome = acharColuna(cabecalho, "NomBandeiraAcionada", /bandeira/);
  const colValor = acharColuna(cabecalho, "VlrAdicionalBandeira", /adicional|valor|vlr/);
  if (!colCompetencia || !colNome || !colValor) {
    throw new Error(`Colunas de bandeiras não encontradas. Cabeçalho: ${cabecalho.join(" | ")}`);
  }

  const avisos: string[] = [];
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
    const adicionalKwh = bandeira === "verde" ? 0 : adicionalParaKwh(bruto ?? 0);
    porMes.set(competencia, { competencia, bandeira, nome: BANDEIRAS[bandeira].nome, adicionalKwh: Number(adicionalKwh.toFixed(6)) });
  }

  const bandeiras = [...porMes.values()].sort((a, b) => a.competencia.localeCompare(b.competencia));
  return { bandeiras, avisos };
}

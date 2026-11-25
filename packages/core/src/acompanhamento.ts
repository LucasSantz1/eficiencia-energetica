import { DIAS_NO_MES } from "./calculos";
import { KWH_POR_DIA_ENTRE_LEITURAS } from "./limites";
import type { ContaMensal, LeituraRelogio } from "./tipos";

export interface PeriodoLeitura {
  de: LeituraRelogio;
  ate: LeituraRelogio;
  dias: number;
  /** Energia gasta entre as duas leituras, em kWh. */
  kwh: number;
  /** Média por dia no período. */
  kwhPorDia: number;
  /** Se o ritmo continuar, quanto daria em 30 dias. */
  projecaoMes: number;
}

function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
}

/**
 * Transforma leituras do relógio de luz em consumo por período.
 * Ex.: dia 1 marcava 12.340 e dia 8 marcava 12.375 → 35 kWh em 7 dias = 5 kWh por dia.
 * Leituras no mesmo dia ou que diminuem (erro de digitação ou troca do relógio) são ignoradas. Também é ignorada a
 * leitura que daria mais de 1.800 kWh por dia, o máximo físico de uma casa (`KWH_POR_DIA_ENTRE_LEITURAS`).
 */
export function periodosDeLeitura(leituras: LeituraRelogio[]): { periodos: PeriodoLeitura[]; ignoradas: LeituraRelogio[] } {
  const ordenadas = [...leituras].sort((x, y) => x.data.localeCompare(y.data));
  const periodos: PeriodoLeitura[] = [];
  const ignoradas: LeituraRelogio[] = [];
  let anterior: LeituraRelogio | undefined;
  for (const atual of ordenadas) {
    if (!anterior) {
      anterior = atual;
      continue;
    }
    const dias = diasEntre(anterior.data, atual.data);
    const kwh = atual.valorKwh - anterior.valorKwh;
    if (dias <= 0 || kwh < 0 || kwh / dias > KWH_POR_DIA_ENTRE_LEITURAS.maximo) {
      ignoradas.push(atual);
      continue;
    }
    periodos.push({ de: anterior, ate: atual, dias, kwh, kwhPorDia: kwh / dias, projecaoMes: (kwh / dias) * DIAS_NO_MES });
    anterior = atual;
  }
  return { periodos, ignoradas };
}

/**
 * Contas em ordem do mês mais antigo para o mais novo, com o preço médio do kWh de cada uma. Conta de 0 kWh (casa
 * fechada, que paga só o mínimo e as taxas) não tem preço por kWh: `undefined`, nunca "R$ 0,00 por kWh" (qa, 25/11).
 */
export function historicoContas(contas: ContaMensal[]): (ContaMensal & { precoKwh: number | undefined })[] {
  return [...contas].sort((x, y) => x.competencia.localeCompare(y.competencia)).map((c) => ({ ...c, precoKwh: c.kwh > 0 ? c.valor / c.kwh : undefined }));
}

export interface MediaDasContas {
  kwhMes: number;
  valorMes: number;
  /**
   * Total pago ÷ total de kWh (não a média dos preços de cada mês, que daria o mesmo peso a um mês de 30 kWh e a um de
   * 300). Sem nenhum kWh anotado, `undefined`.
   */
  precoKwh: number | undefined;
}

/** Média das contas anotadas, para o "Mês a mês". Sem contas, `undefined`. */
export function mediaDasContas(contas: readonly ContaMensal[]): MediaDasContas | undefined {
  if (contas.length === 0) return undefined;
  const kwh = contas.reduce((s, c) => s + c.kwh, 0);
  const valor = contas.reduce((s, c) => s + c.valor, 0);
  return { kwhMes: kwh / contas.length, valorMes: valor / contas.length, precoKwh: kwh > 0 ? valor / kwh : undefined };
}

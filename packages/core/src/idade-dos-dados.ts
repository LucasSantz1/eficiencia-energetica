/**
 * Idade dos preços publicados (HIS-303). A rotina de dados roda todo dia; quando a ANEEL fica fora do ar (como desde
 * 12/11/2026), os preços envelhecem sem ninguém ver. A tela avisa a data, com honestidade, depois de alguns dias.
 */

/**
 * Depois de quantos dias a tela mostra a data dos preços. Suposição de produto, não é regra do setor: a rotina roda
 * todo dia, então uma semana sem atualizar já é sinal de que algo travou. A tarifa muda poucas vezes por ano (reajuste
 * anual da ANEEL), mas a bandeira muda todo mês.
 */
export const DIAS_PARA_MOSTRAR_A_IDADE = 7;

const MS_POR_DIA = 86_400_000;

/** Dias inteiros entre a data dos preços e agora; `undefined` se a data não for uma data válida. Nunca negativo. */
export function diasDesde(dataIso: string, agora: Date): number | undefined {
  const quando = Date.parse(dataIso);
  if (Number.isNaN(quando)) return undefined;
  return Math.max(0, Math.floor((agora.getTime() - quando) / MS_POR_DIA));
}

export interface IdadeDosPrecos {
  dias: number;
  /** "10/11/2026", no fuso de Brasília. */
  data: string;
}

/** A idade para mostrar na tela, ou `undefined` quando os preços são recentes (ou a data não é válida). */
export function idadeDosPrecos(geradoEm: string, agora: Date): IdadeDosPrecos | undefined {
  const dias = diasDesde(geradoEm, agora);
  if (dias === undefined || dias < DIAS_PARA_MOSTRAR_A_IDADE) return undefined;
  const data = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(geradoEm));
  return { dias, data };
}

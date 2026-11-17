// Sem "use client": texto montado com funções puras do @ee/core, usado pelo Acompanhamento.

import { formatarKwh, mediaBrasilParaTexto } from "@ee/core";

/** T6, leitura do relógio. As datas chegam já escritas ("3 de outubro"). */
export function confereALeitura(dataAnterior: string, dataNova: string, kwhPorDia: number): string {
  return `Entre ${dataAnterior} e ${dataNova}, isso dá ${formatarKwh(kwhPorDia)} por dia. Uma casa costuma gastar perto de ${formatarKwh(mediaBrasilParaTexto().kwhDia)} por dia. Veja se você não pulou ou trocou um número do relógio.`;
}


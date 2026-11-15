// Sem "use client": só textos montados com funções puras do @ee/core, usados por componentes que já são de cliente.

import {
  formatarKwh,
  formatarReais,
  formatarWatts,
  LIMITES,
  maiorConsumoDeEtiquetaDoCatalogoKwh,
  mediaBrasilParaTexto,
  potenciaDoChuveiroMaisForteW,
  PRECO_DA_CONTA_POR_KWH,
  type Faixa,
} from "@ee/core";

/**
 * Textos do T5 (valor impossível) e do T6 ("Confere?", valor raro) da HIS-003b, escritos pela ux-acessibilidade.
 * Nenhum número de faixa fica aqui: o mínimo, o máximo e as referências vêm do `limites.ts` e do catálogo.
 */
export interface MensagensDoCampo {
  /** Campo vazio (só quando o campo é obrigatório). */
  vazio: string;
  malEscrito: string;
  fora: string;
  /** Zero que não vale (potência; conta usada para calibrar). Sem ele, o zero usa `fora`. */
  zero?: string;
  /** Texto do "Confere?" para o valor que a tela entendeu. Sem ele, o campo não tem alerta. */
  confere?: (valor: number) => string;
}

export const TITULO_CONFERE = "Confere?";
export const TITULO_CONFERE_OS_DOIS = "Confere os dois números?";

const MAL_ESCRITO_COM_VIRGULA = "Escreva só o número. Para centavos, use vírgula: 135,90.";

export function mensagensDaPotencia(): MensagensDoCampo {
  const { min, max } = LIMITES.potenciaW;
  const vazio = "Digite a potência do aparelho, em watts (W).";
  const fora = `A potência vai de ${formatarWatts(min)} a ${formatarWatts(max)}. Confira a etiqueta ou a plaquinha atrás do aparelho.`;
  return {
    vazio,
    zero: vazio,
    malEscrito: fora,
    fora,
    confere: (valor) => `${formatarWatts(valor)} é muito para um aparelho de casa. Um chuveiro forte tem até ${formatarWatts(potenciaDoChuveiroMaisForteW())}. Veja se não sobrou um zero.`,
  };
}

export function mensagensDaEtiqueta(): MensagensDoCampo {
  const { min, max } = LIMITES.kwhMesInformado;
  const fora = `Digite um consumo entre ${formatarKwh(min)} e ${formatarKwh(max)} por mês, como está na etiqueta.`;
  return {
    vazio: fora,
    malEscrito: MAL_ESCRITO_COM_VIRGULA,
    fora,
    confere: (valor) =>
      `${formatarKwh(valor)} por mês é muito para um aparelho. As geladeiras que mais gastam ficam perto de ${formatarKwh(maiorConsumoDeEtiquetaDoCatalogoKwh())} por mês. Veja se você copiou o número que vem com "kWh/mês".`,
  };
}

/** Onde a conta é usada. Na calibração, a conta zerada tem texto próprio, que muda entre o cadastro e os Ajustes. */
export type UsoDaConta = "cadastro" | "ajustes" | "acompanhamento";

export function faixaDoConsumoDaConta(uso: UsoDaConta): Faixa {
  return uso === "acompanhamento" ? LIMITES.contaKwhAcompanhamento : LIMITES.contaKwhCalibracao;
}

export function faixaDoValorDaConta(uso: UsoDaConta): Faixa {
  return uso === "acompanhamento" ? LIMITES.contaValorAcompanhamento : LIMITES.contaValorCalibracao;
}

/**
 * T5, conta zerada na calibração. Nos Ajustes não existe o botão "Pular": fica só a primeira frase da ux, para não
 * mandar a pessoa procurar um botão que não está na tela.
 */
function contaZerada(uso: UsoDaConta): string | undefined {
  const frase = "Com a conta zerada não dá para ajustar o cálculo.";
  if (uso === "cadastro") return `${frase} Se ela veio zerada, toque em "Pular, não tenho a conta agora".`;
  if (uso === "ajustes") return frase;
  return undefined;
}

export function mensagensDoConsumoDaConta(uso: UsoDaConta): MensagensDoCampo {
  const { min, max } = faixaDoConsumoDaConta(uso);
  const fora = `Digite um consumo entre ${formatarKwh(min)} e ${formatarKwh(max)}. Na conta, ele aparece como "Consumo (kWh)".`;
  return {
    vazio: fora,
    malEscrito: MAL_ESCRITO_COM_VIRGULA,
    fora,
    zero: contaZerada(uso),
    confere: (valor) =>
      `${formatarKwh(valor)} é muito mais do que uma casa costuma gastar: a média no Brasil é perto de ${formatarKwh(mediaBrasilParaTexto().kwhMes)} por mês. Veja se você copiou o consumo do mês, e não o número do relógio de luz.`,
  };
}

export function mensagensDoValorDaConta(uso: UsoDaConta): MensagensDoCampo {
  const { min, max } = faixaDoValorDaConta(uso);
  const fora = `Digite um valor entre ${formatarReais(min)} e ${formatarReais(max)}. É o valor total a pagar, com impostos.`;
  return {
    vazio: fora,
    malEscrito: MAL_ESCRITO_COM_VIRGULA,
    fora,
    zero: contaZerada(uso),
    confere: (valor) => `${formatarReais(valor)} é uma conta muito alta para uma casa. Veja se a vírgula dos centavos está no lugar certo.`,
  };
}

/** T6, consumo e valor juntos (preço por kWh, estimativa). */
export function confereOPrecoDaConta(kwh: number, valor: number, preco: number): string {
  return `Com ${formatarKwh(kwh)} e ${formatarReais(valor)}, cada kWh sairia por ${formatarReais(preco)}. Costuma ficar entre ${formatarReais(PRECO_DA_CONTA_POR_KWH.min)} e ${formatarReais(PRECO_DA_CONTA_POR_KWH.max)}. Veja se a vírgula está no lugar certo.`;
}

/** T6, leitura do relógio. As datas chegam já escritas ("3 de outubro"). */
export function confereALeitura(dataAnterior: string, dataNova: string, kwhPorDia: number): string {
  return `Entre ${dataAnterior} e ${dataNova}, isso dá ${formatarKwh(kwhPorDia)} por dia. Uma casa costuma gastar perto de ${formatarKwh(mediaBrasilParaTexto().kwhDia)} por dia. Veja se você não pulou ou trocou um número do relógio.`;
}

/** T5, nomes vazios. */
export const NOME_DO_COMODO_VAZIO = "Dê um nome ao cômodo, por exemplo: Quarto do casal.";
export const NOME_DO_APARELHO_VAZIO = "Dê um nome ao aparelho, por exemplo: Geladeira.";

/** T6, consumo estimado da casa (não é campo: vira aviso no resumo do cadastro e no painel). */
export function confereSeusAparelhos(kwhMes: number): string {
  return `A conta estimada da sua casa deu ${formatarKwh(kwhMes)} por mês, muito acima do comum. Veja se algum aparelho ficou com potência ou tempo a mais.`;
}

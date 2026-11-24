// Sem "use client": só textos montados com funções puras do @ee/core, usados por componentes que já são de cliente.

import { formatarKwh, formatarReais, LIMITES, mediaBrasilParaTexto, PRECO_DA_CONTA_POR_KWH, type Faixa } from "@ee/core";
import { MAL_ESCRITO_COM_VIRGULA, type MensagensDoCampo } from "@/ui/campos/mensagens";

export const TITULO_CONFERE_OS_DOIS = "Confere os dois números?";

/** Onde a conta é usada. Na calibração, a conta zerada tem texto próprio, que muda entre o cadastro e os Ajustes. */
export type UsoDaConta = "cadastro" | "ajustes" | "acompanhamento";

export function faixaDoConsumoDaConta(uso: UsoDaConta): Faixa {
  return uso === "acompanhamento" ? LIMITES.contaKwhAcompanhamento : LIMITES.contaKwhCalibracao;
}

export function faixaDoValorDaConta(uso: UsoDaConta): Faixa {
  return uso === "acompanhamento" ? LIMITES.contaValorAcompanhamento : LIMITES.contaValorCalibracao;
}

/**
 * T5, conta zerada na calibração. Nos Ajustes não existe o botão "Pular": a 2ª frase diz como seguir sem conta, sem
 * mandar a pessoa procurar um botão que não está na tela (decisão da ux, 2026-11-15).
 */
function contaZerada(uso: UsoDaConta): string | undefined {
  const frase = "Com a conta zerada não dá para ajustar o cálculo.";
  if (uso === "cadastro") return `${frase} Se ela veio zerada, toque em "Pular, não tenho a conta agora".`;
  if (uso === "ajustes") return `${frase} Para seguir sem conta, é só não tocar em “Usar estes valores”.`;
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


/**
 * Iluminação pública (CIP, HIS-104): opcional, de R$ 0,00 até o teto do `LIMITES` e sempre menor que o valor total,
 * porque ela vem dentro da conta (o leitor da casa salva descarta o que passar disso).
 */
export function faixaDaIluminacao(valorDaConta: number | undefined): Faixa {
  const { max } = LIMITES.iluminacaoPublica;
  return { ...LIMITES.iluminacaoPublica, max: valorDaConta === undefined ? max : Math.min(max, Math.max(0, valorDaConta - 0.01)) };
}

export function mensagensDaIluminacao(faixa: Faixa): MensagensDoCampo {
  const fora = `Digite um valor entre ${formatarReais(faixa.min)} e ${formatarReais(faixa.max)}. A taxa vem dentro do valor total da conta.`;
  return {
    vazio: fora,
    malEscrito: MAL_ESCRITO_COM_VIRGULA,
    fora,
    confere: (valor) => `${formatarReais(valor)} é muito para a iluminação pública. Veja se você copiou a linha certa da conta.`,
  };
}

// Sem "use client": só textos montados com funções puras do @ee/core, usados por componentes que já são de cliente.

import { formatarKwh, formatarWatts, LIMITES, maiorConsumoDeEtiquetaDoCatalogoKwh, potenciaDoChuveiroMaisForteW } from "@ee/core";
import { MAL_ESCRITO_COM_VIRGULA, type MensagensDoCampo } from "@/ui/campos/mensagens";

/** T5 e T6 da potência e do consumo na etiqueta (HIS-003b, textos da ux). */
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


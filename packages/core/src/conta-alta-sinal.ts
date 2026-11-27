import type { ContaMensal } from "./tipos";

/**
 * O sinal de "conta alta" que o "Mês a mês" usa para chamar o guia. Fica fora de conta-alta.ts (que é importado só pela
 * tela do guia, por "@ee/core/conta-alta"): os textos dos motivos não entram no JS de todas as páginas (peso-js).
 * Limites de produto, não regra da ANEEL.
 */
/** A conta "parece alta" (o site oferece o guia): 15% acima da anterior ou 25% acima da estimativa. */
export const PARECE_ALTA = { sobreAnterior: 0.15, sobreEstimativa: 0.25 } as const;
/** A conta pede o guia? 15% acima da anterior, ou 25% acima do que a casa cadastrada explica. */
export function contaPareceAlta(conta: ContaMensal, anterior: ContaMensal | undefined, estimativaKwh: number | undefined): boolean {
  if (anterior && anterior.valor > 0 && conta.valor >= anterior.valor * (1 + PARECE_ALTA.sobreAnterior)) return true;
  return estimativaKwh !== undefined && estimativaKwh > 0 && conta.kwh >= estimativaKwh * (1 + PARECE_ALTA.sobreEstimativa);
}


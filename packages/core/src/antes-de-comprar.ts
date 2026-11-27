import { consumoMensalDaCasaKwh, consumoMensalKwh, estimarConta, type PrecoKwh } from "./calculos";
import type { Aparelho, Residencia } from "./tipos";

/**
 * "Antes de comprar: quanto vai pesar?" (pedido do dono, 27/11). Quanto a conta da casa sobe com um aparelho novo.
 * Não é só "kWh do aparelho × preço": a conta tem o consumo mínimo e, na Tarifa Social, os primeiros 80 kWh de graça
 * (calculos.ts). Por isso a comparação é a conta estimada inteira, antes e depois, com as mesmas regras do painel.
 */
export interface ImpactoDaCompra {
  /** Consumo do aparelho novo, em kWh por mês. */
  kwhDoAparelho: number;
  contaAntes: number;
  contaDepois: number;
  /** contaDepois − contaAntes, em R$ por mês. */
  aMaisPorMes: number;
  /** O mesmo em um ano (12 meses), para comparar com o preço do aparelho. */
  aMaisPorAno: number;
}

export function impactoDaCompra(
  aparelhosDaCasa: readonly Aparelho[],
  novo: Omit<Aparelho, "id" | "comodoId">,
  residencia: Pick<Residencia, "beneficio" | "ligacao" | "contaReferencia">,
  preco: PrecoKwh,
): ImpactoDaCompra {
  const kwhDoAparelho = consumoMensalKwh(novo);
  const kwhAntes = consumoMensalDaCasaKwh([...aparelhosDaCasa]);
  const contaAntes = estimarConta(kwhAntes, residencia, preco).valor;
  const contaDepois = estimarConta(kwhAntes + kwhDoAparelho, residencia, preco).valor;
  const aMaisPorMes = Math.max(0, contaDepois - contaAntes);
  return { kwhDoAparelho, contaAntes, contaDepois, aMaisPorMes, aMaisPorAno: aMaisPorMes * 12 };
}

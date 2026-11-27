"use client";

import { impactoDaCompra, type Aparelho, type ImpactoDaCompra } from "@ee/core";
import { useCasa } from "./casa";
import { useResumo } from "./resumo";

/** "Antes de comprar" (27/11): o preço da casa e a conta antes/depois de um aparelho que ainda não está nela. */
export function useAntesDeComprar() {
  const { preco, residencia, aparelhos, comodos, carregando, arquivo } = useResumo();
  const adicionarAparelho = useCasa((s) => s.adicionarAparelho);
  const calcular = (novo: Omit<Aparelho, "id" | "comodoId">): ImpactoDaCompra =>
    impactoDaCompra(aparelhos, novo, residencia ?? { beneficio: "nao-sei", ligacao: "nao-sei" }, preco);
  return {
    preco,
    comodos,
    tarifaSocial: residencia?.beneficio === "tarifa-social",
    carregando: carregando && !arquivo,
    semPreco: preco.valor <= 0,
    calcular,
    /** "Comprei": põe o aparelho simulado na casa, no cômodo escolhido. */
    adicionarNaCasa: (novo: Omit<Aparelho, "id" | "comodoId">, comodoId: string) => adicionarAparelho({ ...novo, comodoId }),
  };
}

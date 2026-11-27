"use client";

import { useMemo } from "react";
import { historicoContas, type ContaMensal } from "@ee/core";
import { motivosDaContaAlta, type MotivoDaContaAlta } from "@ee/core/conta-alta";
import { useCasa } from "./casa";
import { useResumo } from "./resumo";

export interface ContaAlta {
  /** As contas anotadas, da mais nova para a mais velha (para escolher qual investigar). */
  contas: ContaMensal[];
  conta: ContaMensal | undefined;
  anterior: ContaMensal | undefined;
  motivos: MotivoDaContaAlta[];
  /** Ainda baixando as tarifas (a bandeira e a estimativa dependem delas). */
  carregando: boolean;
}

/**
 * "Por que minha conta veio alta?": junta a conta escolhida, a anterior, a estimativa da casa e o histórico das
 * bandeiras, e pede ao core os motivos. Sem conta escolhida, usa a mais nova.
 */
export function useContaAlta(idDaConta: string | undefined, dias: number | undefined): ContaAlta {
  const { arquivo, residencia, resumo, carregando } = useResumo();
  const anotadas = useCasa((s) => s.contas);
  return useMemo(() => {
    const ordem = historicoContas(anotadas);
    const indice = idDaConta ? ordem.findIndex((c) => c.id === idDaConta) : ordem.length - 1;
    const conta = indice >= 0 ? ordem[indice] : undefined;
    const anterior = indice > 0 ? ordem[indice - 1] : undefined;
    const estimativaKwh = residencia && resumo.conta.consumoKwh > 0 ? resumo.conta.consumoKwh : undefined;
    const motivos = conta ? motivosDaContaAlta({ conta, anterior, estimativaKwh, bandeiras: arquivo?.bandeiras ?? [], dias }) : [];
    return { contas: [...ordem].reverse(), conta, anterior, motivos, carregando: carregando && !arquivo };
  }, [anotadas, idDaConta, dias, arquivo, residencia, resumo.conta.consumoKwh, carregando]);
}

"use client";

import { bandeiraDoMes, competenciaAtual, gerarDicas, nomeDaDistribuidora, precoKwh, resumirCasa, simularPlano, type ArquivoTarifas, type Distribuidora } from "@ee/core";
import { useMemo } from "react";
import { useTarifas } from "./dados";
import { useCasa } from "./store";

/** Junta os dados da casa com a tarifa da distribuidora e a bandeira do mês. */
export function useResumo() {
  const tarifas = useTarifas();
  const residencia = useCasa((s) => s.residencia);
  const aparelhos = useCasa((s) => s.aparelhos);
  const comodos = useCasa((s) => s.comodos);
  const plano = useCasa((s) => s.plano);

  return useMemo(() => {
    const arquivo = tarifas.dados;
    const distribuidora = residencia && arquivo ? arquivo.distribuidoras.find((d) => d.id === residencia.distribuidoraId) : undefined;
    const bandeira = arquivo ? bandeiraDoMes(arquivo.bandeiras, competenciaAtual()) : undefined;
    const preco = precoKwh(residencia ?? {}, distribuidora, bandeira?.bandeira);
    const r = residencia ?? { beneficio: "nao-sei" as const, ligacao: "nao-sei" as const };
    const resumo = resumirCasa(aparelhos, r, preco);
    const dicas = gerarDicas({ aparelhos, residencia: r, preco, bandeira: bandeira?.bandeira });
    // Plano de economia: só conta as dicas marcadas que ainda existem (o aparelho pode ter mudado).
    const planoValido = plano.filter((id) => dicas.some((d) => d.id === id && d.simulavel));
    const resumoPlano = planoValido.length > 0 ? resumirCasa(simularPlano(aparelhos, planoValido), r, preco) : undefined;
    return { arquivo, carregando: tarifas.carregando, erro: tarifas.erro, residencia, aparelhos, comodos, distribuidora, bandeira, preco, resumo, dicas, plano: planoValido, resumoPlano };
  }, [tarifas.dados, tarifas.carregando, tarifas.erro, residencia, aparelhos, comodos, plano]);
}

/** Tarifa média nacional (sem impostos), usada no simulador da página inicial antes de saber onde a pessoa mora. */
export function tarifaMedia(arquivo: ArquivoTarifas | undefined): Pick<Distribuidora, "tarifaKwh"> | undefined {
  if (!arquivo || arquivo.distribuidoras.length === 0) return undefined;
  const soma = arquivo.distribuidoras.reduce((s, d) => s + d.tarifaKwh, 0);
  return { tarifaKwh: soma / arquivo.distribuidoras.length };
}

/** Nome amigável para a distribuidora (a ANEEL publica só a sigla). */
export function nomeDistribuidora(d: Pick<Distribuidora, "sigla"> | undefined): string {
  return d ? nomeDaDistribuidora(d.sigla) : "";
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { acharDistribuidora, bandeiraDoMes, competenciaAtual, historicoContas, nomeDaDistribuidora, precoKwh, resumirCasa, type DadosCasa } from "@ee/core";
import { useTarifas } from "@/infraestrutura/dados-publicos/navegador";
import { casaDoConvidado } from "./conta";

export type CasaDoConvidado = { tipo: "carregando" } | { tipo: "sem-codigo" } | { tipo: "erro"; mensagem: string } | { tipo: "pronta"; casa: DadosCasa; atualizadaEm: string };

/** Busca a casa do link uma vez (HIS-407). Sem código no endereço, nem pergunta ao servidor. */
export function useCasaDoConvidado(codigo: string): CasaDoConvidado {
  const [resultado, setResultado] = useState<{ codigo: string; casa: CasaDoConvidado }>();
  useEffect(() => {
    if (codigo === "") return;
    let valendo = true;
    void casaDoConvidado(codigo).then((r) => {
      if (valendo) setResultado({ codigo, casa: r.ok ? { tipo: "pronta", casa: r.casa, atualizadaEm: r.atualizadaEm } : { tipo: "erro", mensagem: r.mensagem } });
    });
    return () => {
      valendo = false;
    };
  }, [codigo]);
  if (codigo === "") return { tipo: "sem-codigo" };
  return resultado?.codigo === codigo ? resultado.casa : { tipo: "carregando" };
}

/** Os mesmos números do painel do dono, calculados no aparelho do convidado com os preços públicos da ANEEL. */
export function useResumoDaCasa(casa: DadosCasa | undefined) {
  const { dados: arquivo } = useTarifas();
  return useMemo(() => {
    if (!casa?.residencia || !arquivo) return undefined;
    const distribuidora = acharDistribuidora(arquivo, casa.residencia.distribuidoraId);
    const bandeira = bandeiraDoMes(arquivo.bandeiras, competenciaAtual());
    const preco = precoKwh(casa.residencia, distribuidora, bandeira?.bandeira);
    const resumo = resumirCasa(casa.aparelhos, casa.residencia, preco);
    return { resumo, preco, distribuidora: distribuidora ? nomeDaDistribuidora(distribuidora.sigla) : undefined, contas: historicoContas(casa.contas).slice(-3).reverse() };
  }, [casa, arquivo]);
}

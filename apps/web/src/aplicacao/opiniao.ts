"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { MomentoDeOpiniao } from "@ee/core";
import { useConta } from "./conta-estado";
import { useCadastrouNestaVisita } from "./convite-da-conta";
import { enviarOpiniao } from "./uso";

/**
 * "Isto te ajudou?" (ADR-009): aparece uma vez por momento neste aparelho. Respondeu ou tocou em "Agora não": não
 * volta. A marca fica no localStorage (conveniência deste aparelho; sem ela, a pergunta só aparece de novo). Sem a
 * conta ligada no site, não há onde guardar a opinião, e a pergunta não aparece.
 */
const PREFIXO = "eficiencia-energetica:opiniao:";
const ouvintes = new Set<() => void>();

function marcado(momento: MomentoDeOpiniao): boolean {
  try {
    return localStorage.getItem(PREFIXO + momento) !== null;
  } catch {
    return false;
  }
}

function marcar(momento: MomentoDeOpiniao, como: "respondida" | "dispensada") {
  try {
    localStorage.setItem(PREFIXO + momento, como);
  } catch {
    // Sem armazenamento: a pergunta pode voltar noutra visita, e tudo bem.
  }
  ouvintes.forEach((avisar) => avisar());
}

export function useOpiniao(momento: MomentoDeOpiniao) {
  const jaFoi = useSyncExternalStore(
    (avisar) => {
      ouvintes.add(avisar);
      return () => ouvintes.delete(avisar);
    },
    () => marcado(momento),
    () => true,
  );
  const tipo = useConta().tipo;
  // O painel logo depois do cadastro ainda não foi usado: a pergunta dele espera a próxima visita.
  const cedoDemais = useCadastrouNestaVisita() && momento === "painel";
  const enviar = useCallback(
    async (nota: number, texto: string) => {
      const resultado = await enviarOpiniao(momento, nota, texto);
      if (resultado.ok) marcar(momento, "respondida");
      return resultado;
    },
    [momento],
  );
  const dispensar = useCallback(() => marcar(momento, "dispensada"), [momento]);
  return { mostrar: !jaFoi && !cedoDemais && tipo !== "desligada" && tipo !== "carregando", enviar, dispensar };
}

/** "Apagar todos os meus dados" também leva as marcas das perguntas (LGPD: tudo deste aparelho). */
export function apagarMarcasDeOpiniao() {
  try {
    for (const chave of Object.keys(localStorage)) if (chave.startsWith(PREFIXO)) localStorage.removeItem(chave);
  } catch {
    // nada a apagar
  }
}

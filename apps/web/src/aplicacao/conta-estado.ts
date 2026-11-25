"use client";

import { useEffect, useSyncExternalStore } from "react";
import { pedirApi } from "@/infraestrutura/conta/api";

/**
 * Só o estado da conta (E4): é o que toda tela da casa precisa para saber se há conta. Fica separado das ações e da
 * sincronização (aplicacao/conta.ts), que só baixam quando há conta ligada: quem usa sem conta não paga esse peso.
 */
export type EstadoDaConta =
  | { tipo: "carregando" }
  | { tipo: "desligada" }
  | { tipo: "sem-conta" }
  | { tipo: "conectada"; email: string }
  | { tipo: "sem-internet" };

/* ---------- Estado da conta (um só para a página toda) ---------- */

let estadoAtual: EstadoDaConta = { tipo: "carregando" };
let pedido: Promise<void> | undefined;
const ouvintesDaConta = new Set<() => void>();
const avisarConta = () => ouvintesDaConta.forEach((avisar) => avisar());

function mudarConta(novo: EstadoDaConta) {
  estadoAtual = novo;
  avisarConta();
}

/** Pergunta ao servidor quem está na conta. Uma vez por página, a não ser que `deNovo`. */
export function atualizarConta(deNovo = false): Promise<void> {
  if (pedido && !deNovo) return pedido;
  pedido = pedirApi("/api/conta").then(({ status, corpo }) => {
    if (status === 0) return mudarConta({ tipo: "sem-internet" });
    const email = corpo["email"];
    if (corpo["conta"] === "conectada" && typeof email === "string") return mudarConta({ tipo: "conectada", email });
    mudarConta({ tipo: corpo["conta"] === "sem-conta" ? "sem-conta" : "desligada" });
  });
  return pedido;
}

const assinarConta = (avisar: () => void) => {
  ouvintesDaConta.add(avisar);
  return () => ouvintesDaConta.delete(avisar);
};
const naHidratacao: EstadoDaConta = { tipo: "carregando" };

export function useConta(): EstadoDaConta {
  useEffect(() => {
    void atualizarConta();
  }, []);
  return useSyncExternalStore(assinarConta, () => estadoAtual, () => naHidratacao);
}


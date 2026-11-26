"use client";

import { useSyncExternalStore } from "react";

/**
 * Lê um valor do pedaço do endereço depois do `#` (o link do e-mail e o do convidado). O navegador nunca manda esse
 * pedaço a servidor nenhum: o código não fica em log, nem no histórico do servidor, nem no Referer (ADR-007).
 * Na hidratação, vazio (igual ao servidor); depois, o do endereço. Com mais de uma chave, vale a primeira que
 * estiver no endereço (os e-mails novos usam `codigo`; os já enviados, o `token_hash` de antes).
 */
export function useCodigoDoEndereco(...chaves: string[]): string {
  return useSyncExternalStore(
    assinar,
    () => {
      const valores = new URLSearchParams(window.location.hash.slice(1));
      for (const chave of chaves) {
        const valor = valores.get(chave);
        if (valor) return valor;
      }
      return "";
    },
    () => "",
  );
}

function assinar(avisar: () => void) {
  window.addEventListener("hashchange", avisar);
  return () => window.removeEventListener("hashchange", avisar);
}

/** Tira o código do endereço depois de usar: ele não fica na barra nem no histórico do navegador. */
export function esquecerCodigoDoEndereco() {
  window.history.replaceState(null, "", window.location.pathname);
}

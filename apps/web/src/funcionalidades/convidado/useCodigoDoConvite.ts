"use client";

import { useSyncExternalStore } from "react";

/**
 * O código do link de convidado: tudo depois do `#` (`/convidado#<código>`). O navegador nunca manda esse pedaço a
 * servidor nenhum; a página manda o código no corpo de um POST para /api/convidado (ADR-007).
 */
export function useCodigoDoConvite(): string {
  return useSyncExternalStore(
    (avisar) => {
      window.addEventListener("hashchange", avisar);
      return () => window.removeEventListener("hashchange", avisar);
    },
    () => window.location.hash.slice(1),
    () => "",
  );
}

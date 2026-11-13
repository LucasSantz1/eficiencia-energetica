// Sem "use client" de propósito: só exporta um hook, usado por componentes que já são de cliente (HIS-112, L4).

import { useSyncExternalStore } from "react";

/**
 * A mesma consulta que o Tailwind 4 gera para o `lg:` (64rem, 1024 px com a letra padrão). Com o mesmo valor e a mesma
 * sintaxe, o zoom troca o CSS e o JS juntos, e um navegador que não entende a consulta cai no celular nos dois.
 */
const CONSULTA = "(width >= 64rem)";

function assinar(avisar: () => void): () => void {
  const lista = window.matchMedia(CONSULTA);
  lista.addEventListener("change", avisar);
  return () => lista.removeEventListener("change", avisar);
}

function ehLarga(): boolean {
  return window.matchMedia(CONSULTA).matches;
}

/** No servidor não há janela: o desenho do celular é o padrão (o mesmo de antes da HIS-112). */
function ehLargaNoServidor(): boolean {
  return false;
}

/**
 * Diz se a tela tem 1024 px ou mais. É `useSyncExternalStore` (e não estado + efeito) para não copiar estado num
 * efeito (HIS-109) e para o desenho certo já aparecer no primeiro render no navegador.
 */
export function useTelaLarga(): boolean {
  return useSyncExternalStore(assinar, ehLarga, ehLargaNoServidor);
}

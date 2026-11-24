"use client";

import { useSyncExternalStore } from "react";
import { assinarPreferenciaDeLeitura, gravarPreferenciaDeLeitura, LEITURA_PADRAO, lerPreferenciaDeLeitura, type PreferenciaDeLeitura } from "@/infraestrutura/armazenamento/leitura";

/**
 * A escolha de leitura (HIS-102) e como mudá-la. Por useSyncExternalStore, sem efeito que copia estado; no servidor e
 * na hidratação vale o padrão (o <html> já foi marcado pelo script do <head>, então não pisca).
 */
export function useLeitura(): [PreferenciaDeLeitura, (mudanca: Partial<PreferenciaDeLeitura>) => void] {
  const leitura = useSyncExternalStore(assinarPreferenciaDeLeitura, lerPreferenciaDeLeitura, () => LEITURA_PADRAO);
  return [leitura, (mudanca) => gravarPreferenciaDeLeitura({ ...lerPreferenciaDeLeitura(), ...mudanca })];
}

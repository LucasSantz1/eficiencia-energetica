"use client";

import { useSyncExternalStore } from "react";

/**
 * O convite para criar conta, uma vez, logo depois do cadastro da casa (pedido do dono, 26/11). Fica só na memória da
 * página: o cadastro marca, a tela da casa mostra, e "Agora não" ou "Fechar" desmarcam. Não grava nada no aparelho, e
 * quem recarrega a página não vê de novo: a conta é opcional e o convite não insiste.
 */
let pendente = false;
// Também só na memória: a casa foi cadastrada nesta visita. O "Isto te ajudou?" do painel espera uma próxima visita,
// quando a pessoa já usou a tela (e não aparece junto do convite, com dois "Agora não" na mesma tela).
let cadastrouNestaVisita = false;
const ouvintes = new Set<() => void>();

function mudar(valor: boolean) {
  pendente = valor;
  ouvintes.forEach((avisar) => avisar());
}

export function pedirConviteDaConta() {
  cadastrouNestaVisita = true;
  mudar(true);
}

export function dispensarConviteDaConta() {
  mudar(false);
}

export function useConviteDaConta(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      ouvintes.add(avisar);
      return () => ouvintes.delete(avisar);
    },
    () => pendente,
    () => false,
  );
}

export function useCadastrouNestaVisita(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      ouvintes.add(avisar);
      return () => ouvintes.delete(avisar);
    },
    () => cadastrouNestaVisita,
    () => false,
  );
}

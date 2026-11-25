"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { idadeDosPrecos, type IdadeDosPrecos } from "@ee/core";
import {
  abertoComoAplicativo,
  assinarConexao,
  assinarModoDeExibicao,
  assinarInstalacao,
  comInternetNoServidor,
  estaSemInternet,
  naoAbertoComoAplicativoNoServidor,
  naoPodeInstalarNoServidor,
  ouvirPedidoDeInstalacao,
  pedirInstalacao,
  podeInstalarAgora,
  registrarServicoOffline,
} from "@/infraestrutura/offline/servico";

/** No layout, uma vez: liga o modo sem internet e guarda o aviso de "dá para instalar" (HIS-301, HIS-302). */
export function useLigarOffline(): void {
  useEffect(() => {
    registrarServicoOffline();
    return ouvirPedidoDeInstalacao();
  }, []);
}

/** true sem internet (HIS-303). Na hidratação, sempre false, igual ao servidor. */
export function useSemInternet(): boolean {
  return useSyncExternalStore(assinarConexao, estaSemInternet, comInternetNoServidor);
}

/** `podeInstalar` só no navegador que avisa (Chrome no Android, Edge); no iPhone a instalação é pelo menu do Safari. */
export function useInstalacao(): { podeInstalar: boolean; instalado: boolean; instalar: () => Promise<void> } {
  const podeInstalar = useSyncExternalStore(assinarInstalacao, podeInstalarAgora, naoPodeInstalarNoServidor);
  const instalado = useSyncExternalStore(assinarModoDeExibicao, abertoComoAplicativo, naoAbertoComoAplicativoNoServidor);
  return { podeInstalar, instalado, instalar: pedirInstalacao };
}

/**
 * A data dos preços da ANEEL quando eles têm uma semana ou mais (HIS-303). `agora` é lido uma vez, ao abrir a tela: a
 * idade não precisa andar enquanto a pessoa olha.
 */
export function useIdadeDosPrecos(geradoEm: string | undefined): IdadeDosPrecos | undefined {
  const [agora] = useState(() => new Date());
  return geradoEm === undefined ? undefined : idadeDosPrecos(geradoEm, agora);
}

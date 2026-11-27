"use client";

import { useSyncExternalStore } from "react";
import type { EventoDeUso, MomentoDeOpiniao } from "@ee/core";
import { pedirApi } from "@/infraestrutura/conta/api";

/**
 * Contagem anônima de uso, do lado do navegador (ADR-009). Manda só o nome do evento: nada da casa, nenhum id, nenhum
 * cookie novo. Quem pediu ao navegador para não ser rastreado (Global Privacy Control ou "Do Not Track") não manda
 * nada. "visita" e "painel-aberto" contam uma vez por carga da página (na memória, sem guardar nada). Falhou (sem internet): esquece, não tenta de novo.
 */
const UMA_VEZ_POR_ABA: ReadonlySet<EventoDeUso> = new Set(["visita", "painel-aberto"]);

function pediuParaNaoRastrear(): boolean {
  if (typeof navigator === "undefined") return true;
  return Reflect.get(navigator, "globalPrivacyControl") === true || navigator.doNotTrack === "1" || desligouAContagem();
}

/**
 * "Contar o meu uso", em Minha casa (pedido da seguranca: quase ninguém liga o "Não rastrear"). Desligado, este
 * aparelho não manda nenhuma contagem. Fica de fora do "Apagar todos os meus dados" de propósito: apagar tudo não pode
 * voltar a contar quem pediu para não contar.
 */
const CHAVE_SEM_CONTAGEM = "eficiencia-energetica:nao-contar-uso";
const ouvintesDaContagem = new Set<() => void>();

function desligouAContagem(): boolean {
  try {
    return localStorage.getItem(CHAVE_SEM_CONTAGEM) === "1";
  } catch {
    return false;
  }
}

export function useContarMeuUso(): [boolean, (contar: boolean) => void] {
  const desligada = useSyncExternalStore(
    (avisar) => {
      ouvintesDaContagem.add(avisar);
      return () => ouvintesDaContagem.delete(avisar);
    },
    desligouAContagem,
    () => false,
  );
  const mudar = (contar: boolean) => {
    try {
      if (contar) localStorage.removeItem(CHAVE_SEM_CONTAGEM);
      else localStorage.setItem(CHAVE_SEM_CONTAGEM, "1");
    } catch {
      // Sem armazenamento: não dá para lembrar a escolha neste navegador.
    }
    ouvintesDaContagem.forEach((avisar) => avisar());
  };
  return [!desligada, mudar];
}

/** Na memória da página, não no aparelho: nada fica guardado só para contar (a Tarifa Social promete "nada guardado"). */
const contadosNestaPagina = new Set<EventoDeUso>();

function jaContouNestaAba(evento: EventoDeUso): boolean {
  if (!UMA_VEZ_POR_ABA.has(evento)) return false;
  if (contadosNestaPagina.has(evento)) return true;
  contadosNestaPagina.add(evento);
  return false;
}

export function contarUso(evento: EventoDeUso): void {
  if (pediuParaNaoRastrear() || jaContouNestaAba(evento)) return;
  void pedirApi("/api/uso", "POST", { evento });
}

export async function enviarOpiniao(momento: MomentoDeOpiniao, nota: number, texto: string): Promise<{ ok: true } | { ok: false; mensagem: string }> {
  const resposta = await pedirApi("/api/opiniao", "POST", { momento, nota, texto });
  if (resposta.status === 200) return { ok: true };
  const mensagem = resposta.corpo["mensagem"];
  if (typeof mensagem === "string") return { ok: false, mensagem };
  if (resposta.status === 0) return { ok: false, mensagem: "Sem internet agora. Tente de novo quando a conexão voltar." };
  if (resposta.status === 429) return { ok: false, mensagem: "Muitas opiniões daqui agora. Tente de novo mais tarde." };
  return { ok: false, mensagem: "Não deu para enviar agora. Tente de novo mais tarde." };
}

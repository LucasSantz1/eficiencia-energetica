"use client";

import type { EventoDeUso, MomentoDeOpiniao } from "@ee/core";
import { pedirApi } from "@/infraestrutura/conta/api";

/**
 * Contagem anônima de uso, do lado do navegador (ADR-009). Manda só o nome do evento: nada da casa, nenhum id, nenhum
 * cookie novo. Quem pediu ao navegador para não ser rastreado (Global Privacy Control ou "Do Not Track") não manda
 * nada. "visita" e "painel-aberto" contam uma vez por aba. Falhou (sem internet): esquece, não tenta de novo.
 */
const UMA_VEZ_POR_ABA: ReadonlySet<EventoDeUso> = new Set(["visita", "painel-aberto"]);

function pediuParaNaoRastrear(): boolean {
  if (typeof navigator === "undefined") return true;
  return Reflect.get(navigator, "globalPrivacyControl") === true || navigator.doNotTrack === "1";
}

function jaContouNestaAba(evento: EventoDeUso): boolean {
  if (!UMA_VEZ_POR_ABA.has(evento)) return false;
  try {
    const chave = `eficiencia-energetica:contou:${evento}`;
    if (sessionStorage.getItem(chave)) return true;
    sessionStorage.setItem(chave, "1");
  } catch {
    // Sem sessionStorage (aba privada estrita): conta, no máximo, uma vez por carga de página.
  }
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

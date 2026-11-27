"use client";

import { IstoAjudou } from "@/ui/IstoAjudou";

/** O "Isto te ajudou?" do painel, num pedaço à parte: só baixa para quem ainda não respondeu (peso de /casa). */
export function OpiniaoDoPainel({ aoEnviar, aoDispensar }: { aoEnviar: (nota: number, texto: string) => Promise<{ ok: true } | { ok: false; mensagem: string }>; aoDispensar: () => void }) {
  return <IstoAjudou pergunta="Esta página te ajudou a entender a sua conta de luz?" aoEnviar={aoEnviar} aoDispensar={aoDispensar} />;
}

"use client";

import { IstoAjudou } from "@/ui/IstoAjudou";

/** O "Isto te ajudou?" das dicas, num pedaço à parte: só baixa para quem usou o plano e ainda não respondeu. */
export function OpiniaoDasDicas({ aoEnviar, aoDispensar }: { aoEnviar: (nota: number, texto: string) => Promise<{ ok: true } | { ok: false; mensagem: string }>; aoDispensar: () => void }) {
  return <IstoAjudou pergunta="As dicas te ajudaram a pensar em como gastar menos?" aoEnviar={aoEnviar} aoDispensar={aoDispensar} />;
}

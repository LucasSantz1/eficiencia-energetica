"use client";

import type { TrocaDescrita } from "@ee/core";
import { Info } from "lucide-react";
import Link from "next/link";
import { Aviso } from "@/ui/Aviso";
import { Botao } from "@/ui/Botao";
import { IR_ADIANTE } from "@/ui/Movimento";

/** Textos da ux-acessibilidade (HIS-111, F1). Sem o nome antigo conhecido, o corpo não cita a empresa antiga. */
function corpoDoAviso({ nomeAntigo, nomeNovo }: Pick<TrocaDescrita, "nomeAntigo" | "nomeNovo">): string {
  return nomeAntigo
    ? `A ${nomeAntigo} hoje é a ${nomeNovo}. A gente ainda usava o preço antigo. Agora a conta estimada usa o preço de hoje da ${nomeNovo}, mais perto da conta que chega na sua casa.`
    : `A empresa de luz da sua cidade hoje é a ${nomeNovo}. A gente ainda usava um preço antigo. Agora a conta estimada usa o preço de hoje da ${nomeNovo}, mais perto da conta que chega na sua casa.`;
}

/**
 * Aviso de que a empresa de luz da casa mudou de nome ou foi incorporada e o preço foi atualizado (HIS-111, F1).
 * Entra dentro da região `role="status"` da `Casca`, por isso não põe o próprio `role`.
 */
export function AvisoTrocaDistribuidora({ troca, aoFechar }: { troca: Pick<TrocaDescrita, "nomeAntigo" | "nomeNovo">; aoFechar: () => void }) {
  return (
    <Aviso tom="faisca" anunciar={false} className="surgir" icone={<Info className="size-5" aria-hidden />}>
      <p>
        <strong>O preço da luz foi atualizado</strong>
      </p>
      <p className="mt-1">{corpoDoAviso(troca)}</p>
      <p>
        <Link href="/casa/ajustes#conta" transitionTypes={IR_ADIANTE} className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">
          Usar minha conta de luz
        </Link>
      </p>
      <Botao variante="secundario" className="mt-1" onClick={aoFechar}>
        Entendi
      </Botao>
    </Aviso>
  );
}

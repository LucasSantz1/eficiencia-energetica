"use client";

import type { TrocaDescrita } from "@ee/core";
import { Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Aviso } from "@/ui/Aviso";
import { Botao } from "@/ui/Botao";
import { IR_ADIANTE } from "@/ui/Movimento";

/**
 * Aviso de que a empresa de luz da casa mudou de nome ou foi incorporada e o preço foi atualizado (HIS-111, F1).
 * Entra dentro da região `role="status"` da `Casca`, por isso não põe o próprio `role`. Fica montado ao trocar de aba;
 * `mostrar` falso esconde sem desmontar, para "Entendi" continuar valendo se a conta de luz for tirada depois.
 */
export function AvisoTrocaDistribuidora({ troca: { nomeAntigo, nomeNovo }, mostrar }: { troca: TrocaDescrita; mostrar: boolean }) {
  const [fechado, setFechado] = useState(false);
  if (!mostrar || fechado) return null;
  // Textos da ux-acessibilidade (F1). Sem o nome antigo conhecido, o corpo não cita a empresa antiga.
  const corpo = `${nomeAntigo ? `A ${nomeAntigo}` : "A empresa de luz da sua cidade"} hoje é a ${nomeNovo}. A gente ainda usava ${nomeAntigo ? "o" : "um"} preço antigo. Agora a conta estimada usa o preço de hoje da ${nomeNovo}, mais perto da conta que chega na sua casa.`;
  return (
    <div className="surgir mb-6">
      <Aviso tom="faisca" anunciar={false} icone={<Info className="size-5" aria-hidden />}>
        <p>
          <strong>O preço da luz foi atualizado</strong>
        </p>
        <p className="mt-1">{corpo}</p>
        <Link href="/casa/ajustes#conta" transitionTypes={IR_ADIANTE} className="flex min-h-11 w-fit items-center font-bold underline underline-offset-4">
          Usar minha conta de luz
        </Link>
        <Botao
          variante="secundario"
          className="mt-1"
          onClick={() => {
            // O botão some com o aviso: o foco vai para o título da tela, e não para o começo da página (HIS-003).
            const titulo = document.querySelector<HTMLElement>("main h1");
            titulo?.setAttribute("tabindex", "-1");
            titulo?.focus();
            setFechado(true);
          }}
        >
          Entendi
        </Botao>
      </Aviso>
    </div>
  );
}

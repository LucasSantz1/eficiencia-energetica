"use client";

import Link from "next/link";
import { useContarMeuUso } from "@/aplicacao/uso";
import { Interruptor } from "@/ui/Interruptor";
import { SecaoDeAjuste } from "./SecaoDeAjuste";

/** "Contar o meu uso" (ADR-009): a contagem é anônima, mas a pessoa pode desligar neste aparelho. */
export function SecaoContagem() {
  const [contar, mudar] = useContarMeuUso();
  return (
    <SecaoDeAjuste titulo="Contagem de uso" id="contagem-de-uso" descricao="Ajuda a saber se o site está ajudando. Só o total do dia, sem saber quem é você.">
      <Interruptor
        rotulo="Contar o meu uso"
        descricao="Desligado, este aparelho não manda nenhuma contagem."
        ligado={contar}
        aoMudar={mudar}
      />
      <p className="mt-3 text-[0.95rem] text-tinta-suave">
        <Link href="/privacidade#contagem" className="font-bold text-energia underline underline-offset-4">
          O que é contado
        </Link>
      </p>
    </SecaoDeAjuste>
  );
}

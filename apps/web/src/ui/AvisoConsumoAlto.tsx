"use client";

import { CircleHelp } from "lucide-react";
import type { ReactNode } from "react";
import { consumoDaCasaForaDoComum, formatarKwh } from "@ee/core";
import { Aviso } from "@/ui/Aviso";

/**
 * T6 da casa inteira: consumo estimado acima do comum (quase sempre uma potência ou um tempo a mais). Não é campo,
 * então não tem "Sim/Corrigir": a ação leva aos aparelhos. Aparece também depois de um "Sim" na potência.
 */
export function AvisoConsumoAlto({ kwhMes, acao, className }: { kwhMes: number; acao: ReactNode; className?: string }) {
  if (!consumoDaCasaForaDoComum(kwhMes)) return null;
  return (
    <div className={className}>
      <Aviso tom="faisca" icone={<CircleHelp className="size-5" aria-hidden />}>
        <p>
          <strong>Confere seus aparelhos?</strong> {confereSeusAparelhos(kwhMes)}
        </p>
        <div className="mt-3">{acao}</div>
      </Aviso>
    </div>
  );
}

/** T6, consumo estimado da casa (não é campo: vira aviso no resumo do cadastro e no painel). */
export function confereSeusAparelhos(kwhMes: number): string {
  return `A conta estimada da sua casa deu ${formatarKwh(kwhMes)} por mês, muito acima do comum. Veja se algum aparelho ficou com potência ou tempo a mais.`;
}

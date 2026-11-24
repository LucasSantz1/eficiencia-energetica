"use client";

import { useMemo } from "react";
import { avaliarMeta, type SituacaoDaMeta } from "@ee/core/meta";
import { useCasa } from "@/infraestrutura/armazenamento/casa";
import type { useResumo } from "./resumo";

type Resumo = ReturnType<typeof useResumo>;

export interface Meta {
  /** Meta salva, em reais; `undefined` sem meta. */
  metaReais: number | undefined;
  situacao: SituacaoDaMeta | undefined;
  definirMeta: (reais: number | undefined) => void;
}

/**
 * Meta de gasto (HIS-104): recebe o resumo que a tela já calculou (um `useResumo` só por tela) e devolve a situação do
 * core. Nenhuma conta fica aqui: tudo vem do `avaliarMeta`.
 */
export function useMeta({ aparelhos, residencia, preco, dicas }: Pick<Resumo, "aparelhos" | "residencia" | "preco" | "dicas">): Meta {
  const metaReais = useCasa((s) => s.metaMensal);
  const definirMeta = useCasa((s) => s.definirMeta);
  const situacao = useMemo(() => {
    if (metaReais === undefined) return undefined;
    const r = residencia ?? { beneficio: "nao-sei" as const, ligacao: "nao-sei" as const };
    return avaliarMeta({ metaReais, aparelhos, residencia: r, preco, dicas });
  }, [metaReais, aparelhos, residencia, preco, dicas]);
  return { metaReais, situacao, definirMeta };
}

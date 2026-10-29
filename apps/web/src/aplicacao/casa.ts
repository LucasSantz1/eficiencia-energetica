"use client";

import type { Aparelho, Comodo } from "@ee/core";
import { useCasa } from "@/infraestrutura/armazenamento/casa";

// Porta das telas para a casa guardada no aparelho (ADR-001: aplicacao é a única porta para infraestrutura).
// Hoje é quase só reexportação; é aqui que a sincronização com o servidor vai entrar (E4) sem mudar as telas.
// Só reexportação nomeada: o Next não aceita `export *` em módulo "use client". O store tem um só `create`,
// em infraestrutura/armazenamento/casa.ts — nunca criar outro aqui.
export { useCasa, useCasaCarregada, type DadosCasa } from "@/infraestrutura/armazenamento/casa";
export { novoId } from "@/infraestrutura/identificador";

export interface EdicaoDeAparelho {
  comodos: Comodo[];
  /** Com id, atualiza o aparelho; sem id, cria um novo. */
  salvar: (dados: Omit<Aparelho, "id">, id?: string) => void;
  remover: (id: string) => void;
}

/** Liga o editor de aparelho (ui/aparelho/EditorAparelho) à casa guardada no aparelho da pessoa. */
export function useEdicaoDeAparelho(): EdicaoDeAparelho {
  const comodos = useCasa((s) => s.comodos);
  const adicionarAparelho = useCasa((s) => s.adicionarAparelho);
  const atualizarAparelho = useCasa((s) => s.atualizarAparelho);
  // A ação do store, e não um filtro novo: ela também tira do plano as dicas do aparelho removido.
  const remover = useCasa((s) => s.removerAparelho);
  const salvar = (dados: Omit<Aparelho, "id">, id?: string) => {
    if (id) atualizarAparelho(id, dados);
    else adicionarAparelho(dados);
  };
  return { comodos, salvar, remover };
}

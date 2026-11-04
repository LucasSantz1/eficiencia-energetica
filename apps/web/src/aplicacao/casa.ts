"use client";

import { useEffect, useState } from "react";
import { descreverTroca, trocaDeDistribuidora, type Aparelho, type Comodo, type TrocaDescrita } from "@ee/core";
import { useCasa } from "@/infraestrutura/armazenamento/casa";
import { useTarifas } from "@/infraestrutura/dados-publicos/navegador";

// Porta das telas para a casa guardada no aparelho (ADR-001: aplicacao é a única porta para infraestrutura).
// Hoje é quase só reexportação; é aqui que a sincronização com o servidor vai entrar (E4) sem mudar as telas.
// Só reexportação nomeada: o Next não aceita `export *` em módulo "use client". O store tem um só `create`,
// em infraestrutura/armazenamento/casa.ts — nunca criar outro aqui.
export { useCasa, useCasaCarregada, type DadosCasa } from "@/infraestrutura/armazenamento/casa";

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

/**
 * Regrava, uma vez, a casa salva com o id de uma distribuidora que saiu do `tarifas.json` (empresa renomeada ou
 * incorporada: `rge-sul` → `rge`), para a Minha casa marcar a opção certa (HIS-111, D7; ADR-005). O preço já vem certo
 * antes disso, pelo `acharDistribuidora` do `useResumo`.
 *
 * Devolve a troca feita nesta visita, com os nomes, para o aviso da `Casca` (F1). O par fica só na memória: depois da
 * regravação o id salvo já é o novo, e nada novo é guardado no aparelho, então o aviso não volta na próxima visita.
 * Contra laço (R6): `trocaDeDistribuidora` só pede troca quando o id salvo não está publicado e o de hoje está. Depois
 * da regravação o id salvo já é o de hoje, então a troca acontece uma vez só, sem precisar de memória.
 */
export function useDistribuidoraAtualizada(): TrocaDescrita | undefined {
  const idSalvo = useCasa((s) => s.residencia?.distribuidoraId);
  const atualizarResidencia = useCasa((s) => s.atualizarResidencia);
  const arquivo = useTarifas().dados;
  const [trocaDaVisita, setTrocaDaVisita] = useState<{ para: string; descrita: TrocaDescrita | undefined }>();

  // A troca é calculada no render (`trocaDeDistribuidora` é pura). Sem esperar o `useCasaCarregada`: o persist lê o
  // localStorage na hora, e antes disso `idSalvo` é `undefined`.
  const troca = arquivo && idSalvo !== undefined ? trocaDeDistribuidora(arquivo, idSalvo) : undefined;
  // O aviso da visita é guardado ajustando o estado no render, com guarda (padrão do React para "informação do render
  // anterior"), e não num efeito (D17-a da HIS-002b). Depois da regravação `troca` some, mas o aviso fica.
  if (arquivo && troca && trocaDaVisita?.para !== troca.para) {
    setTrocaDaVisita({ para: troca.para, descrita: descreverTroca(arquivo, troca) });
  }

  const paraId = troca?.para;
  useEffect(() => {
    // O efeito só regrava a casa no store, com dependência primitiva.
    if (paraId !== undefined) atualizarResidencia({ distribuidoraId: paraId });
  }, [paraId, atualizarResidencia]);

  return trocaDaVisita?.descrita;
}

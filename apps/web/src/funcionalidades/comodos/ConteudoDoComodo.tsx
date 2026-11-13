"use client";

import { Plus } from "lucide-react";
import { ehLampada, ILUMINACAO_PADRAO, itemDoCatalogo, SUGESTOES_COMODO, type Aparelho, type Comodo } from "@ee/core";
import { useCasa } from "@/aplicacao/casa";
import { useResumo } from "@/aplicacao/resumo";
import { BlocoIluminacao } from "@/ui/aparelho/BlocoIluminacao";
import { LinhaAparelho } from "@/ui/aparelho/LinhaAparelho";
import type { ItemComodo } from "@/ui/aparelho/tipos";

/**
 * O miolo de um cômodo: iluminação, aparelhos, "Também é comum ter aqui" e "Outro aparelho". Mora num arquivo só para
 * a sanfona do celular e o painel do computador usarem a mesma regra de lâmpada e de sugestão (HIS-112, L4).
 */
export function ConteudoDoComodo({ comodo, aparelhos, aoAdicionar, aoDetalhes }: { comodo: Comodo; aparelhos: Aparelho[]; aoAdicionar: () => void; aoDetalhes: (a: Aparelho) => void }) {
  const { preco } = useResumo();
  const atualizar = useCasa((s) => s.atualizarAparelho);
  const remover = useCasa((s) => s.removerAparelho);
  const adicionarDoCatalogo = useCasa((s) => s.adicionarDoCatalogo);

  const lampadas = aparelhos.filter(ehLampada);
  const lampadaPrincipal = lampadas[0];
  const outros = [...aparelhos.filter((a) => !ehLampada(a)), ...lampadas.slice(1)];
  const sugestoes = SUGESTOES_COMODO[comodo.tipo].filter((s) => !aparelhos.some((a) => a.catalogoId === s.catalogoId));

  const luzPadrao = ILUMINACAO_PADRAO[comodo.tipo];
  const lampadaVirtual: ItemComodo = lampadaPrincipal ?? {
    id: "nova",
    catalogoId: "lampada-led",
    nome: "Lâmpada de LED",
    quantidade: 0,
    potenciaW: itemDoCatalogo("lampada-led")!.potenciaW,
    minutosPorDia: luzPadrao.minutosPorDia,
    diasPorSemana: 7,
  };

  const mudarLampada = (p: Partial<ItemComodo>) => {
    if (!lampadaPrincipal) {
      if ((p.quantidade ?? 0) > 0) adicionarDoCatalogo("lampada-led", { comodoId: comodo.id, quantidade: p.quantidade, minutosPorDia: luzPadrao.minutosPorDia });
      return;
    }
    if (p.quantidade === 0) remover(lampadaPrincipal.id);
    else atualizar(lampadaPrincipal.id, p);
  };

  return (
    <>
      <BlocoIluminacao lampada={lampadaVirtual} aoMudar={mudarLampada} preco={preco} />
      <ul className="mt-3 space-y-2">
        {outros.map((a) => (
          <LinhaAparelho
            key={a.id}
            item={a}
            preco={preco}
            minimo={0}
            aoAbrirDetalhes={() => aoDetalhes(a)}
            aoMudar={(p) => {
              if (p.quantidade === 0) remover(a.id);
              else atualizar(a.id, p);
            }}
          />
        ))}
      </ul>
      {outros.length === 0 && <p className="px-1 py-3 text-tinta-suave">Nenhum aparelho aqui ainda.</p>}

      {sugestoes.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 px-1 text-[0.95rem] font-bold text-tinta-suave">Também é comum ter aqui:</p>
          <div className="flex flex-wrap gap-2">
            {sugestoes.map((s) => {
              const item = itemDoCatalogo(s.catalogoId)!;
              return (
                <button
                  key={s.catalogoId}
                  type="button"
                  onClick={() => adicionarDoCatalogo(s.catalogoId, { comodoId: comodo.id, ...(s.minutosPorDia ? { minutosPorDia: s.minutosPorDia } : {}) })}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-linha bg-papel px-3 font-bold hover:border-energia"
                >
                  <Plus className="size-4 text-energia" aria-hidden />
                  {item.nome}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <button type="button" onClick={aoAdicionar} className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-full px-2 font-bold text-energia hover:bg-energia-claro">
        <Plus className="size-5" aria-hidden /> Outro aparelho
      </button>
    </>
  );
}

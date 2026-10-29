import { aparelhoInicial, COMODOS_PADRAO, ILUMINACAO_PADRAO, itemDoCatalogo, nomesPadrao, SUGESTOES_COMODO, type Aparelho, type Comodo, type TipoComodo } from "@ee/core";
import type { ItemComodo } from "@/components/Comodo";
import { novoId } from "./store";

/** Cômodo sendo montado no cadastro: nome, aparelhos sugeridos (alguns com quantidade 0) e lâmpadas. */
export interface ComodoRascunho {
  id: string;
  tipo: TipoComodo;
  nome: string;
  itens: ItemComodo[];
  lampada: ItemComodo;
}

export function itemDoCatalogoParaComodo(catalogoId: string, extra: Partial<ItemComodo> = {}): ItemComodo {
  const item = itemDoCatalogo(catalogoId);
  if (!item) throw new Error(`Aparelho desconhecido: ${catalogoId}`);
  return { ...aparelhoInicial(item), id: novoId(), ...extra };
}

/** Cria um cômodo já com os aparelhos comuns daquele tipo. */
export function novoComodoRascunho(tipo: TipoComodo, nome: string, opcoes: { pessoas: number; primeiroDoTipo: boolean }): ComodoRascunho {
  const itens = SUGESTOES_COMODO[tipo].map((s) => {
    const extra: Partial<ItemComodo> = { quantidade: s.marcado ? s.quantidade : 0 };
    if (s.minutosPorDia) extra.minutosPorDia = s.minutosPorDia;
    if (s.catalogoId === "chuveiro") {
      // O primeiro banheiro recebe os banhos da família toda; os outros, um banho por dia.
      const banhosPorDia = opcoes.primeiroDoTipo ? Math.max(1, opcoes.pessoas) : 1;
      extra.banho = { banhosPorDia, minutosPorBanho: 8 };
      extra.minutosPorDia = banhosPorDia * 8;
    }
    return itemDoCatalogoParaComodo(s.catalogoId, extra);
  });
  const luz = ILUMINACAO_PADRAO[tipo];
  return { id: novoId(), tipo, nome, itens, lampada: itemDoCatalogoParaComodo("lampada-led", { quantidade: luz.quantidade, minutosPorDia: luz.minutosPorDia, nome: "Lâmpada de LED" }) };
}

/**
 * Ajusta a lista de cômodos às quantidades escolhidas, mantendo o que já foi preenchido
 * (ex.: passar de 2 para 3 quartos mantém os 2 primeiros como estavam).
 */
export function ajustarComodos(atuais: ComodoRascunho[], quantidades: Partial<Record<TipoComodo, number>>, pessoas: number): ComodoRascunho[] {
  const resultado: ComodoRascunho[] = [];
  for (const { tipo, nome } of COMODOS_PADRAO) {
    const quantos = quantidades[tipo] ?? 0;
    const existentes = atuais.filter((c) => c.tipo === tipo);
    const nomes = nomesPadrao(tipo, nome, quantos);
    for (let i = 0; i < quantos; i++) {
      const existente = existentes[i];
      // Renomeia os automáticos ("Quarto" → "Quarto 1") sem mexer nos que a pessoa já batizou.
      const nomeAutomatico = existente && (existente.nome === nome || /^\D+ \d+$/.test(existente.nome) && existente.nome.startsWith(nome));
      resultado.push(existente ? { ...existente, nome: nomeAutomatico ? nomes[i]! : existente.nome } : novoComodoRascunho(tipo, nomes[i]!, { pessoas, primeiroDoTipo: i === 0 }));
    }
  }
  return resultado;
}

/** Converte o rascunho na casa definitiva: só ficam os aparelhos com quantidade maior que zero. */
export function rascunhoParaCasa(rascunhos: ComodoRascunho[]): { comodos: Comodo[]; aparelhos: Aparelho[] } {
  const comodos: Comodo[] = rascunhos.map((r) => ({ id: r.id, tipo: r.tipo, nome: r.nome.trim() || COMODOS_PADRAO.find((c) => c.tipo === r.tipo)!.nome }));
  const aparelhos: Aparelho[] = rascunhos.flatMap((r) =>
    [...r.itens, r.lampada].filter((i) => i.quantidade > 0).map((i) => ({ ...i, id: novoId(), comodoId: r.id })),
  );
  return { comodos, aparelhos };
}

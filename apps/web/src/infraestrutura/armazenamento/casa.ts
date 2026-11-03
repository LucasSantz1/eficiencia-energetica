"use client";

import {
  aparelhoInicial,
  COMODOS_PADRAO,
  itemDoCatalogo,
  lerAparelho,
  lerCasaSalva,
  lerComodo,
  lerConta,
  lerIdDoPlano,
  lerLeitura,
  lerResidencia,
  LIMITES_DE_LISTA,
  type Aparelho,
  type AvisoDaCasaSalva,
  type Comodo,
  type ContaMensal,
  type DadosCasa,
  type LeituraRelogio,
  type Residencia,
  type TipoComodo,
} from "@ee/core";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { criarArmazenamentoSeguro } from "@/infraestrutura/armazenamento/armazenamento-local";
import { dadosSalvaveis, lerCasaNaHidratacao } from "@/infraestrutura/armazenamento/hidratacao";
import { novoId } from "@/infraestrutura/identificador";

/** O formato da casa salva mora no domínio (`DadosCasa` em `@ee/core`), junto do leitor que o confere. */
export type { DadosCasa };

/** Mesma chave e mesma versão de antes: o formato salvo não muda na HIS-003a (D1, item 4). */
const NOME_DA_CHAVE = "eficiencia-energetica:casa";
const VERSAO_DA_CASA = 2;
/**
 * Cópia do texto da casa que o leitor não conseguiu abrir, guardada antes de um cadastro novo gravar por cima (D10, 2).
 * Fica só no aparelho, ninguém a lê hoje; serve para uma versão corrigida do leitor recuperar a casa. Sai com
 * "Apagar tudo". Não é a casa: outra chave, sem `version`.
 */
const NOME_DA_COPIA_ILEGIVEL = "eficiencia-energetica:casa-ilegivel";

/**
 * Toda ação passa pelo mesmo leitor da casa salva antes de mudar o estado: a tela não é a única porta (console,
 * extensão do navegador). O que o leitor recusar não muda nada.
 */
interface Acoes {
  definirResidencia: (r: Residencia) => void;
  atualizarResidencia: (parcial: Partial<Residencia>) => void;
  adicionarComodo: (tipo: TipoComodo, nome?: string) => Comodo | undefined;
  renomearComodo: (id: string, nome: string) => void;
  removerComodo: (id: string) => void;
  /** Cria um aparelho a partir do catálogo, criando o cômodo sugerido se ainda não existir. */
  adicionarDoCatalogo: (catalogoId: string, extra?: Partial<Aparelho>) => Aparelho | undefined;
  adicionarAparelho: (a: Omit<Aparelho, "id">) => Aparelho | undefined;
  atualizarAparelho: (id: string, parcial: Partial<Aparelho>) => Aparelho | undefined;
  removerAparelho: (id: string) => void;
  /** Substitui a casa inteira (usado ao terminar o cadastro). */
  criarCasa: (dados: { residencia: Residencia; comodos: Comodo[]; aparelhos: Aparelho[] }) => void;
  salvarConta: (c: Omit<ContaMensal, "id"> & { id?: string }) => void;
  removerConta: (id: string) => void;
  salvarLeitura: (l: Omit<LeituraRelogio, "id"> & { id?: string }) => void;
  removerLeitura: (id: string) => void;
  alternarNoPlano: (dicaId: string) => void;
  apagarTudo: () => void;
  dispensarAvisoDaCasaSalva: () => void;
}

/** Fica só em memória (fora do `partialize`): só o tipo do aviso e números, nada do que saiu (T1). */
interface EstadoDoAviso {
  avisoDaCasaSalva?: AvisoDaCasaSalva;
}

type EstadoDaCasa = DadosCasa & EstadoDoAviso & Acoes;

function nomeDoComodo(tipo: TipoComodo, existentes: Comodo[]): string {
  const base = COMODOS_PADRAO.find((c) => c.tipo === tipo)?.nome ?? "Cômodo";
  const iguais = existentes.filter((c) => c.tipo === tipo).length;
  return iguais === 0 ? base : `${base} ${iguais + 1}`;
}

/** Aparelho válido, de um cômodo que existe. */
function aparelhoAceito(bruto: unknown, comodos: Comodo[]): Aparelho | undefined {
  const aparelho = lerAparelho(bruto);
  return aparelho && comodos.some((c) => c.id === aparelho.comodoId) ? aparelho : undefined;
}

const armazenamento = criarArmazenamentoSeguro(VERSAO_DA_CASA);

export const useCasa = create<EstadoDaCasa>()(
  persist(
    (set, get) => ({
      comodos: [],
      aparelhos: [],
      contas: [],
      leituras: [],
      plano: [],

      criarCasa: ({ residencia, comodos, aparelhos }) => {
        const { casa } = lerCasaSalva({ residencia, comodos, aparelhos, contas: get().contas, leituras: get().leituras, plano: [] });
        if (casa.residencia === undefined) return;
        // Cadastro novo confirmado com a gravação travada: guarda o texto que não deu para ler e solta a trava, porque o
        // trabalho novo da pessoa vale mais que um texto ilegível (se a cópia falhar, grava assim mesmo).
        if (armazenamento.gravacaoTravada()) {
          armazenamento.copiarTextoUmaVez(NOME_DA_CHAVE, NOME_DA_COPIA_ILEGIVEL);
          armazenamento.liberarGravacao();
        }
        set({ residencia: casa.residencia, comodos: casa.comodos, aparelhos: casa.aparelhos, contas: casa.contas, leituras: casa.leituras, plano: [] });
      },
      salvarConta: (c) => {
        const conta = lerConta({ ...c, id: c.id ?? novoId() });
        if (!conta) return;
        // Um registro por mês: salvar o mesmo mês de novo substitui o anterior.
        const outras = get().contas.filter((x) => x.id !== conta.id && x.competencia !== conta.competencia);
        if (outras.length >= LIMITES_DE_LISTA.contas) return;
        set({ contas: [...outras, conta] });
      },
      removerConta: (id) => set({ contas: get().contas.filter((c) => c.id !== id) }),
      salvarLeitura: (l) => {
        const leitura = lerLeitura({ ...l, id: l.id ?? novoId() });
        if (!leitura) return;
        const outras = get().leituras.filter((x) => x.id !== leitura.id && x.data !== leitura.data);
        if (outras.length >= LIMITES_DE_LISTA.leituras) return;
        set({ leituras: [...outras, leitura] });
      },
      removerLeitura: (id) => set({ leituras: get().leituras.filter((l) => l.id !== id) }),
      alternarNoPlano: (dicaId) => {
        const plano = get().plano;
        if (plano.includes(dicaId)) {
          set({ plano: plano.filter((d) => d !== dicaId) });
          return;
        }
        const id = lerIdDoPlano(dicaId);
        if (id === undefined || plano.length >= LIMITES_DE_LISTA.plano) return;
        set({ plano: [...plano, id] });
      },

      definirResidencia: (bruta) => {
        const residencia = lerResidencia(bruta);
        if (residencia) set({ residencia });
      },
      atualizarResidencia: (parcial) => {
        const atual = get().residencia;
        if (!atual) return;
        const residencia = lerResidencia({ ...atual, ...parcial });
        if (residencia) set({ residencia });
      },

      adicionarComodo: (tipo, nome) => {
        const comodos = get().comodos;
        if (comodos.length >= LIMITES_DE_LISTA.comodos) return undefined;
        const comodo = lerComodo({ id: novoId(), tipo, nome: nome?.trim() || nomeDoComodo(tipo, comodos) });
        if (comodo) set({ comodos: [...comodos, comodo] });
        return comodo;
      },
      renomearComodo: (id, nome) => {
        const comodos = get().comodos;
        const atual = comodos.find((c) => c.id === id);
        // Nome vazio mantém o anterior; nome que o leitor recusa (comprido demais) não muda nada.
        const renomeado = atual && lerComodo({ ...atual, nome: nome.trim() || atual.nome });
        if (renomeado) set({ comodos: comodos.map((c) => (c.id === id ? renomeado : c)) });
      },
      removerComodo: (id) =>
        set({
          comodos: get().comodos.filter((c) => c.id !== id),
          aparelhos: get().aparelhos.filter((a) => a.comodoId !== id),
        }),

      adicionarDoCatalogo: (catalogoId, extra = {}) => {
        const item = itemDoCatalogo(catalogoId);
        if (!item) return undefined;
        let comodoId = extra.comodoId;
        if (!comodoId) {
          const existente = get().comodos.find((c) => c.tipo === item.comodoSugerido);
          comodoId = existente?.id ?? get().adicionarComodo(item.comodoSugerido)?.id;
        }
        if (!comodoId) return undefined;
        return get().adicionarAparelho({ ...aparelhoInicial(item), ...extra, comodoId });
      },
      adicionarAparelho: (dados) => {
        const { aparelhos, comodos } = get();
        if (aparelhos.length >= LIMITES_DE_LISTA.aparelhos) return undefined;
        const aparelho = aparelhoAceito({ ...dados, id: novoId() }, comodos);
        if (aparelho) set({ aparelhos: [...aparelhos, aparelho] });
        return aparelho;
      },
      atualizarAparelho: (id, parcial) => {
        const { aparelhos, comodos } = get();
        const atual = aparelhos.find((a) => a.id === id);
        // Junta e depois lê: o id não muda, e o resultado precisa passar inteiro pelo leitor.
        const atualizado = atual && aparelhoAceito({ ...atual, ...parcial, id }, comodos);
        if (atualizado) set({ aparelhos: aparelhos.map((a) => (a.id === id ? atualizado : a)) });
        return atualizado;
      },
      removerAparelho: (id) => set({ aparelhos: get().aparelhos.filter((a) => a.id !== id), plano: get().plano.filter((d) => !d.startsWith(`${id}:`)) }),
      // "Apagar tudo" apaga de verdade (LGPD), também com a gravação travada: tira a chave e a cópia ilegível do
      // aparelho e solta a trava. A próxima ação grava do zero.
      apagarTudo: () => {
        set({ residencia: undefined, comodos: [], aparelhos: [], contas: [], leituras: [], plano: [], avisoDaCasaSalva: undefined });
        armazenamento.removeItem(NOME_DA_CHAVE);
        armazenamento.removeItem(NOME_DA_COPIA_ILEGIVEL);
        armazenamento.liberarGravacao();
      },
      dispensarAvisoDaCasaSalva: () => set({ avisoDaCasaSalva: undefined }),
    }),
    {
      name: NOME_DA_CHAVE,
      version: VERSAO_DA_CASA,
      storage: armazenamento,
      partialize: (estado): unknown => dadosSalvaveis(estado),
      // Da versão 1 para a 2 só entraram listas, e o leitor aceita as duas. Quem confere é o `merge`, que roda sempre.
      migrate: (salvo) => salvo,
      merge: (salvo, atual) => {
        const { casa, aviso } = lerCasaNaHidratacao(salvo, armazenamento);
        // `residencia` sempre presente na troca, para uma casa sem cidade não herdar a do estado atual.
        return { ...atual, residencia: casa.residencia, ...casa, avisoDaCasaSalva: aviso };
      },
      // Existe aviso exatamente quando algo saiu: só então a versão limpa é regravada, e o aviso não volta (T1).
      // Com a gravação travada (leitor falhou), o setItem não grava nada.
      onRehydrateStorage: () => (estado) => {
        if (estado?.avisoDaCasaSalva) armazenamento.setItem(NOME_DA_CHAVE, { state: dadosSalvaveis(estado), version: VERSAO_DA_CASA });
      },
    },
  ),
);

/** true depois que os dados guardados no aparelho foram carregados (evita piscar a tela vazia). */
export function useCasaCarregada(): boolean {
  const [carregada, setCarregada] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marca como carregada quando a casa já foi lida antes (HIS-109)
    if (useCasa.persist.hasHydrated()) setCarregada(true);
    return useCasa.persist.onFinishHydration(() => setCarregada(true));
  }, []);
  return carregada;
}

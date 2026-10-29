"use client";

import { COMODOS_PADRAO, itemDoCatalogo, type Aparelho, type Comodo, type Residencia, type TipoComodo } from "@ee/core";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Os dados da casa ficam guardados no próprio aparelho da pessoa (localStorage), sem precisar de conta.
 * Quando houver login, este mesmo formato será sincronizado com o servidor.
 */
export interface DadosCasa {
  residencia?: Residencia;
  comodos: Comodo[];
  aparelhos: Aparelho[];
}

interface Acoes {
  definirResidencia: (r: Residencia) => void;
  atualizarResidencia: (parcial: Partial<Residencia>) => void;
  adicionarComodo: (tipo: TipoComodo, nome?: string) => Comodo;
  renomearComodo: (id: string, nome: string) => void;
  removerComodo: (id: string) => void;
  /** Cria um aparelho a partir do catálogo, criando o cômodo sugerido se ainda não existir. */
  adicionarDoCatalogo: (catalogoId: string, extra?: Partial<Aparelho>) => Aparelho | undefined;
  adicionarAparelho: (a: Omit<Aparelho, "id">) => Aparelho;
  atualizarAparelho: (id: string, parcial: Partial<Aparelho>) => void;
  removerAparelho: (id: string) => void;
  apagarTudo: () => void;
}

export const novoId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function nomeDoComodo(tipo: TipoComodo, existentes: Comodo[]): string {
  const base = COMODOS_PADRAO.find((c) => c.tipo === tipo)?.nome ?? "Cômodo";
  const iguais = existentes.filter((c) => c.tipo === tipo).length;
  return iguais === 0 ? base : `${base} ${iguais + 1}`;
}

export const useCasa = create<DadosCasa & Acoes>()(
  persist(
    (set, get) => ({
      comodos: [],
      aparelhos: [],

      definirResidencia: (residencia) => set({ residencia }),
      atualizarResidencia: (parcial) => {
        const atual = get().residencia;
        if (atual) set({ residencia: { ...atual, ...parcial } });
      },

      adicionarComodo: (tipo, nome) => {
        const comodo: Comodo = { id: novoId(), tipo, nome: nome?.trim() || nomeDoComodo(tipo, get().comodos) };
        set({ comodos: [...get().comodos, comodo] });
        return comodo;
      },
      renomearComodo: (id, nome) => set({ comodos: get().comodos.map((c) => (c.id === id ? { ...c, nome: nome.trim() || c.nome } : c)) }),
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
          comodoId = existente?.id ?? get().adicionarComodo(item.comodoSugerido).id;
        }
        return get().adicionarAparelho({
          catalogoId: item.id,
          nome: item.nome,
          quantidade: 1,
          potenciaW: item.potenciaW,
          minutosPorDia: item.minutosPorDia,
          diasPorSemana: item.diasPorSemana,
          kwhMesInformado: item.modo === "etiqueta" ? item.kwhMes : undefined,
          banho: item.banho ? { ...item.banho } : undefined,
          ...extra,
          comodoId,
        });
      },
      adicionarAparelho: (dados) => {
        const aparelho: Aparelho = { ...dados, id: novoId() };
        set({ aparelhos: [...get().aparelhos, aparelho] });
        return aparelho;
      },
      atualizarAparelho: (id, parcial) => set({ aparelhos: get().aparelhos.map((a) => (a.id === id ? { ...a, ...parcial } : a)) }),
      removerAparelho: (id) => set({ aparelhos: get().aparelhos.filter((a) => a.id !== id) }),
      apagarTudo: () => set({ residencia: undefined, comodos: [], aparelhos: [] }),
    }),
    {
      name: "eficiencia-energetica:casa",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ residencia, comodos, aparelhos }) => ({ residencia, comodos, aparelhos }),
    },
  ),
);

/** true depois que os dados guardados no aparelho foram carregados (evita piscar a tela vazia). */
export function useCasaCarregada(): boolean {
  const [carregada, setCarregada] = useState(false);
  useEffect(() => {
    if (useCasa.persist.hasHydrated()) setCarregada(true);
    return useCasa.persist.onFinishHydration(() => setCarregada(true));
  }, []);
  return carregada;
}

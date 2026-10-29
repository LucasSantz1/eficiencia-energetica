"use client";

import type { ArquivoMunicipios, ArquivoTarifas } from "@ee/core";
import { useEffect, useState } from "react";

/**
 * Os dados de tarifas e municípios são arquivos estáticos em /dados, atualizados todo dia
 * por uma rotina que lê os dados abertos da ANEEL. O futuro app de celular usa os mesmos arquivos.
 */
const cache = new Map<string, Promise<unknown>>();

function carregar<T>(caminho: string): Promise<T> {
  let p = cache.get(caminho) as Promise<T> | undefined;
  if (!p) {
    p = fetch(caminho).then((r) => {
      if (!r.ok) throw new Error(`Não foi possível carregar ${caminho} (HTTP ${r.status})`);
      return r.json() as Promise<T>;
    });
    p.catch(() => cache.delete(caminho));
    cache.set(caminho, p);
  }
  return p;
}

type Estado<T> = { dados?: T; erro?: string; carregando: boolean };

function useArquivo<T>(caminho: string | undefined): Estado<T> & { tentarDeNovo: () => void } {
  const [estado, setEstado] = useState<Estado<T>>({ carregando: Boolean(caminho) });
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    if (!caminho) {
      setEstado({ carregando: false });
      return;
    }
    let ativo = true;
    setEstado((e) => ({ dados: e.dados, carregando: true }));
    carregar<T>(caminho)
      .then((dados) => ativo && setEstado({ dados, carregando: false }))
      .catch((e: Error) => ativo && setEstado({ erro: e.message, carregando: false }));
    return () => {
      ativo = false;
    };
  }, [caminho, tentativa]);
  return { ...estado, tentarDeNovo: () => setTentativa((t) => t + 1) };
}

export function useTarifas() {
  return useArquivo<ArquivoTarifas>("/dados/tarifas.json");
}

export function useMunicipios(uf: string | undefined) {
  return useArquivo<ArquivoMunicipios>(uf ? `/dados/municipios/${uf}.json` : undefined);
}

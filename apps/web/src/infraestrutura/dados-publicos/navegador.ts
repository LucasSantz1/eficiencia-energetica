"use client";

import { ehUf, lerArquivoMunicipios, lerArquivoTarifas, type ArquivoMunicipios, type ArquivoTarifas } from "@ee/core";
import { useCallback, useEffect, useState } from "react";

/**
 * Os dados de tarifas e municípios são arquivos estáticos em /dados, atualizados todo dia
 * por uma rotina que lê os dados abertos da ANEEL. O futuro app de celular usa os mesmos arquivos.
 * Cada arquivo passa pelo mesmo leitor do `@ee/core` usado no servidor e na rotina (HIS-003a, D4): estrutura errada
 * vira falha (a tela mostra "Tentar de novo"); entrada inválida sai sozinha, sem valor corrigido.
 */
type Leitor<T> = (bruto: unknown) => T;

/** Um cache por tipo de arquivo, para cada promessa guardar o tipo certo sem `as`. */
function criarCarregador<T>() {
  const cache = new Map<string, Promise<T>>();
  return (caminho: string, ler: Leitor<T>, recarregar: boolean): Promise<T> => {
    const guardada = recarregar ? undefined : cache.get(caminho);
    if (guardada) return guardada;
    // Na nova tentativa, `no-cache` pede ao servidor para conferir: o cache HTTP de 1 h devolveria o mesmo arquivo ruim.
    const promessa = fetch(caminho, recarregar ? { cache: "no-cache" } : {}).then(async (resposta) => {
      if (!resposta.ok) throw new Error("arquivo indisponível");
      const bruto: unknown = await resposta.json();
      return ler(bruto);
    });
    // Promessa que falhou sai do cache, para a próxima tentativa pedir de novo.
    promessa.catch(() => cache.delete(caminho));
    cache.set(caminho, promessa);
    return promessa;
  };
}

const carregarTarifas = criarCarregador<ArquivoTarifas>();
const carregarMunicipios = criarCarregador<ArquivoMunicipios>();
const lerTarifas: Leitor<ArquivoTarifas> = (bruto) => lerArquivoTarifas(bruto).arquivo;

/** O que a tela recebe. Sem texto técnico: a tela escolhe o texto pelo `semInternet` e pelo `falhasSeguidas` (T2). */
export interface ArquivoPublico<T> {
  dados?: T;
  carregando: boolean;
  /** Volta a 0 quando dá certo; não zera durante uma nova tentativa. */
  falhasSeguidas: number;
  /** O navegador dizia estar sem internet no momento da última falha. */
  semInternet: boolean;
  /** Pede o arquivo de novo; não faz nada enquanto está carregando. */
  tentarDeNovo: () => void;
}

/** Resultado da última tentativa que terminou, com a chave (caminho + tentativa) a que ele responde. */
interface Resultado<T> {
  caminho?: string;
  chave?: string;
  dados?: T;
  falhasSeguidas: number;
  semInternet: boolean;
}

/**
 * `carregando` é derivado (a última resposta é de outra chave), e não guardado: assim o efeito só muda o estado
 * nas respostas, nunca de forma síncrona (regra `react-hooks/set-state-in-effect` da HIS-002b).
 */
function useArquivo<T>(caminho: string | undefined, ler: Leitor<T>, carregar: (caminho: string, ler: Leitor<T>, recarregar: boolean) => Promise<T>): ArquivoPublico<T> {
  const [tentativa, setTentativa] = useState(0);
  const [resultado, setResultado] = useState<Resultado<T>>({ falhasSeguidas: 0, semInternet: false });
  const chave = caminho === undefined ? undefined : `${caminho}#${tentativa}`;

  useEffect(() => {
    if (caminho === undefined || chave === undefined) return;
    let ativo = true;
    carregar(caminho, ler, tentativa > 0)
      .then((dados) => {
        if (ativo) setResultado({ caminho, chave, dados, falhasSeguidas: 0, semInternet: false });
      })
      .catch(() => {
        if (!ativo) return;
        const semInternet = typeof navigator !== "undefined" && navigator.onLine === false;
        setResultado((anterior) =>
          anterior.caminho === caminho
            ? { caminho, chave, dados: anterior.dados, falhasSeguidas: anterior.falhasSeguidas + 1, semInternet }
            : { caminho, chave, falhasSeguidas: 1, semInternet },
        );
      });
    return () => {
      ativo = false;
    };
  }, [caminho, chave, tentativa, ler, carregar]);

  const doMesmoArquivo = caminho !== undefined && resultado.caminho === caminho;
  const carregando = chave !== undefined && resultado.chave !== chave;
  const tentarDeNovo = useCallback(() => {
    if (!carregando) setTentativa((t) => t + 1);
  }, [carregando]);
  return {
    ...(doMesmoArquivo && resultado.dados !== undefined ? { dados: resultado.dados } : {}),
    carregando,
    falhasSeguidas: doMesmoArquivo ? resultado.falhasSeguidas : 0,
    semInternet: doMesmoArquivo && resultado.semInternet,
    tentarDeNovo,
  };
}

export function useTarifas(): ArquivoPublico<ArquivoTarifas> {
  return useArquivo("/dados/tarifas.json", lerTarifas, carregarTarifas);
}

/** O caminho só é montado com uma das 27 UFs: um `uf` estranho salvo no aparelho não vira endereço de pedido (A6). */
export function useMunicipios(uf: string | undefined): ArquivoPublico<ArquivoMunicipios> {
  const ufValida = ehUf(uf) ? uf : undefined;
  const ler = useCallback((bruto: unknown) => {
    if (ufValida === undefined) throw new Error("UF inválida");
    return lerArquivoMunicipios(bruto, ufValida).arquivo;
  }, [ufValida]);
  return useArquivo(ufValida === undefined ? undefined : `/dados/municipios/${ufValida}.json`, ler, carregarMunicipios);
}

"use client";

import { useEffect, useRef } from "react";
import { Aviso } from "@/ui/Aviso";
import { Botao } from "@/ui/Botao";
import { focarTitulo } from "@/ui/foco";

/** Do que a tela precisava: os preços da luz (`tarifas.json`) ou as cidades de um estado (`municipios/{UF}.json`). */
export type AssuntoDaCarga = { tipo: "precos" } | { tipo: "cidades"; estado: string };

interface Props {
  assunto: AssuntoDaCarga;
  /** "Suas respostas não se perdem." no cadastro; "Sua casa continua salva." no painel. */
  fraseDeSeguranca: string;
  falhasSeguidas: number;
  semInternet: boolean;
  carregando: boolean;
  aoTentarDeNovo: () => void;
}

function titulo(assunto: AssuntoDaCarga, semInternet: boolean): string {
  if (semInternet) return "Você está sem internet.";
  return assunto.tipo === "precos" ? "Não conseguimos carregar os preços da luz." : `Não conseguimos carregar as cidades de ${assunto.estado}.`;
}

/**
 * Falha ao carregar um arquivo de /dados (T2): um texto só para internet caída e para arquivo fora do formato, porque
 * nos dois casos a pessoa faz a mesma coisa. Fica montado sempre (não mostra nada sem falha) para notar quando volta
 * a dar certo: aí o botão que tinha o foco some, e o foco vai para o título da tela.
 */
export function AvisoFalhaDeCarga({ assunto, fraseDeSeguranca, falhasSeguidas, semInternet, carregando, aoTentarDeNovo }: Props) {
  const falhasAntes = useRef(falhasSeguidas);
  useEffect(() => {
    if (falhasAntes.current > 0 && falhasSeguidas === 0) focarTitulo();
    falhasAntes.current = falhasSeguidas;
  }, [falhasSeguidas]);

  if (falhasSeguidas === 0) return null;
  const inicio = semInternet ? 'Ligue os dados móveis ou o Wi-Fi e toque em "Tentar de novo".' : "Pode ser a internet ou um problema do nosso lado.";
  // A frase nova muda o texto, e por isso o leitor de tela anuncia o aviso de novo.
  const fim = falhasSeguidas >= 2 ? " Se não der certo, tente mais tarde." : "";
  return (
    <Aviso tom="alerta">
      <p className="font-bold">{titulo(assunto, semInternet)}</p>
      <p className="mt-1">
        {inicio} {fraseDeSeguranca}
        {fim}
      </p>
      <Botao
        variante="secundario"
        className="mt-3"
        // aria-disabled, e não disabled: o botão continua com o foco enquanto carrega.
        aria-disabled={carregando || undefined}
        onClick={() => {
          if (!carregando) aoTentarDeNovo();
        }}
      >
        {carregando ? "Carregando…" : "Tentar de novo"}
      </Botao>
    </Aviso>
  );
}

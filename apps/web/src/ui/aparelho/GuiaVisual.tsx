"use client";

import { useState } from "react";
import { aplicarVariantes, formatarKwh, formatarReais, type Aparelho, type ItemCatalogo, type PrecoKwh } from "@ee/core";
import { faixaDeConsumo, GUIAS_VISUAIS, NAO_SEI, reconhecer } from "@ee/core/reconhecer";
import { Botao } from "@/ui/Botao";
import { Desenho } from "./Desenhos";

export type BaseDoGuia = Pick<Aparelho, "potenciaW" | "minutosPorDia" | "quantidade" | "diasPorSemana" | "kwhMesInformado" | "fatorCiclo">;

/**
 * Modo "não sei qual é o meu aparelho": perguntas sobre o que dá para ver, com desenhos e sempre um "Não sei". O que
 * ficar em aberto vira uma faixa de valor, com o caminho para deixar exato (a etiqueta). Toda conta vem do core.
 */
export function GuiaVisual({
  catalogo,
  escolhas,
  base,
  preco,
  aoUsar,
  aoVoltar,
}: {
  catalogo: ItemCatalogo;
  escolhas?: Record<string, string>;
  base?: BaseDoGuia;
  preco?: PrecoKwh;
  aoUsar: (mudancas: Partial<Aparelho>) => void;
  aoVoltar: () => void;
}) {
  const perguntas = GUIAS_VISUAIS[catalogo.id] ?? [];
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const resultado = reconhecer(catalogo, respostas, escolhas);
  const faixa = base ? faixaDeConsumo(catalogo, { ...base, quantidade: Math.max(1, base.quantidade) }, resultado) : undefined;
  const dinheiro = (kwh: number) => (preco && preco.valor > 0 ? formatarReais(kwh * preco.valor) : formatarKwh(kwh));
  const nome = aplicarVariantes(catalogo, resultado.escolhas).nome ?? catalogo.nome;

  return (
    <div className="space-y-6 rounded-[var(--radius-controle)] bg-fundo p-4">
      <p className="font-bold">Responda pelo que você vê. Se não souber alguma, toque em “Não sei”.</p>
      {perguntas.map((p) => (
        <fieldset key={p.id} className="space-y-2">
          <legend className="font-bold">{p.pergunta}</legend>
          {p.ajuda && <p className="text-[0.92rem] text-tinta-suave">{p.ajuda}</p>}
          <div role="radiogroup" aria-label={p.pergunta} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[...p.opcoes, { id: NAO_SEI, rotulo: "Não sei", descricao: undefined, desenho: "" }].map((o) => {
              const marcada = (respostas[p.id] ?? "") === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={marcada}
                  onClick={() => setRespostas((r) => ({ ...r, [p.id]: o.id }))}
                  className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-[var(--radius-controle)] border-2 px-2 py-3 text-center transition-colors ${
                    marcada ? "border-energia bg-energia-claro" : "border-separador bg-papel hover:border-linha"
                  }`}
                >
                  {o.desenho ? <Desenho nome={o.desenho} className={`size-11 ${marcada ? "text-energia" : "text-tinta-suave"}`} /> : <span aria-hidden className="text-2xl font-extrabold text-tinta-suave">?</span>}
                  <span className="text-[0.95rem] leading-tight font-bold">{o.rotulo}</span>
                  {o.descricao && <span className="text-[0.82rem] leading-tight text-tinta-suave">{o.descricao}</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div aria-live="polite" className="rounded-[var(--radius-controle)] bg-papel p-4">
        {resultado.exato ? (
          <p>
            Pelo que você respondeu: <strong>{nome}</strong>
            {faixa && (
              <>
                , cerca de <strong className="numeros">{dinheiro(faixa.usadoKwh)}</strong> por mês
              </>
            )}
            .
          </p>
        ) : (
          <>
            {faixa && faixa.minKwh !== faixa.maxKwh ? (
              <p>
                Fica entre <strong className="numeros">{dinheiro(faixa.minKwh)}</strong> e <strong className="numeros">{dinheiro(faixa.maxKwh)}</strong> por mês. Vamos usar{" "}
                <strong className="numeros">{dinheiro(faixa.usadoKwh)}</strong>, o mais comum.
              </p>
            ) : (
              <p>
                Vamos usar o mais comum: <strong>{nome}</strong>.
              </p>
            )}
            <p className="mt-2 text-[0.95rem] text-tinta-suave">Para deixar o valor certo: {catalogo.ondeEncontrar}</p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Botao type="button" onClick={() => aoUsar(aplicarVariantes(catalogo, resultado.escolhas))}>
          Usar este
        </Botao>
        <Botao type="button" variante="fantasma" onClick={aoVoltar}>
          Voltar
        </Botao>
      </div>
    </div>
  );
}

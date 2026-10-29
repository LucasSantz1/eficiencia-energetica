"use client";

import { useState } from "react";

export interface Barra {
  id: string;
  /** Rótulo curto embaixo da barra (ex.: "out"). */
  rotulo: string;
  valor: number;
  /** Texto completo mostrado ao tocar ou passar o mouse. */
  detalhe: string;
}

/**
 * Gráfico de barras de uma série só (consumo mês a mês ou dia a dia), com uma linha de referência
 * opcional — a estimativa da casa — rotulada direto no gráfico. Tocar numa barra mostra o detalhe.
 */
export function Barras({ barras, referencia, unidade, rotulo }: { barras: Barra[]; referencia?: { valor: number; rotulo: string }; unidade: string; rotulo: string }) {
  const [selecionada, setSelecionada] = useState<string>();
  const maximo = Math.max(1, ...barras.map((b) => b.valor), referencia?.valor ?? 0) * 1.12;
  const ativa = barras.find((b) => b.id === selecionada) ?? barras.at(-1);
  const escala = [maximo / 1.12, maximo / 2.24];

  return (
    <figure aria-label={rotulo} className="m-0">
      <div className="relative">
        {/* Grade discreta */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-7" aria-hidden>
          {escala.map((v) => (
            <div key={v} className="absolute inset-x-0 border-t border-dashed border-linha" style={{ bottom: `${(v / maximo) * 100}%` }}>
              <span className="numeros absolute -top-2.5 right-0 bg-papel pl-1 text-[0.78rem] text-tinta-suave">{Math.round(v)}</span>
            </div>
          ))}
          {referencia && referencia.valor > 0 && (
            <div className="absolute inset-x-0 border-t-2 border-faixa-d" style={{ bottom: `${(referencia.valor / maximo) * 100}%` }}>
              <span className="absolute -top-6 left-0 rounded bg-papel px-1 text-[0.85rem] font-bold text-tinta">{referencia.rotulo}</span>
            </div>
          )}
        </div>
        <ol className="relative flex h-52 items-end gap-[2px] pr-8" role="list">
          {barras.map((b) => {
            const marcada = ativa?.id === b.id;
            return (
              <li key={b.id} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <button
                  type="button"
                  onClick={() => setSelecionada(b.id)}
                  onMouseEnter={() => setSelecionada(b.id)}
                  aria-label={b.detalhe}
                  title={b.detalhe}
                  className="group flex h-[calc(100%-1.75rem)] w-full items-end justify-center px-[3px]"
                >
                  <span className={`block w-full max-w-12 rounded-t-[4px] transition-colors ${marcada ? "bg-energia-forte" : "bg-energia/70 group-hover:bg-energia"}`} style={{ height: `${Math.max(1.5, (b.valor / maximo) * 100)}%` }} />
                </button>
                <span className={`numeros mt-1 block h-6 truncate text-center text-[0.8rem] ${marcada ? "font-bold text-tinta" : "text-tinta-suave"}`}>{b.rotulo}</span>
              </li>
            );
          })}
        </ol>
      </div>
      {ativa && (
        <figcaption className="mt-2 rounded-[var(--radius-controle)] bg-fundo px-3 py-2 text-[0.95rem]" aria-live="polite">
          {ativa.detalhe}
          <span className="sr-only"> ({unidade})</span>
        </figcaption>
      )}
    </figure>
  );
}

"use client";

import { Minus, Plus } from "lucide-react";

/** Contador com botões grandes de − e +. */
export function Contador({
  valor,
  aoMudar,
  min = 0,
  max = 99,
  passo = 1,
  rotulo,
  unidade,
  compacto = false,
}: {
  valor: number;
  aoMudar: (v: number) => void;
  min?: number;
  max?: number;
  passo?: number;
  rotulo: string;
  unidade?: string;
  /** Versão mais estreita, para listas no celular. */
  compacto?: boolean;
}) {
  const botao = compacto ? "size-10" : "size-11";
  const mudar = (v: number) => aoMudar(Math.min(max, Math.max(min, Math.round(v * 100) / 100)));
  return (
    <div className="inline-flex items-center rounded-[var(--radius-controle)] border-2 border-linha bg-papel">
      <button type="button" aria-label={`Diminuir ${rotulo}`} onClick={() => mudar(valor - passo)} disabled={valor <= min} className={`grid ${botao} place-items-center text-energia disabled:text-linha`}>
        <Minus className="size-5" strokeWidth={2.5} />
      </button>
      <output aria-live="polite" aria-label={rotulo} className={`numeros text-center font-extrabold ${compacto ? "min-w-9 text-lg" : "min-w-14 text-xl"}`}>
        <span key={valor} className="pulo">
          {valor}
        </span>
        {unidade && <span className="ml-1 text-base font-bold text-tinta-suave">{unidade}</span>}
      </output>
      <button type="button" aria-label={`Aumentar ${rotulo}`} onClick={() => mudar(valor + passo)} disabled={valor >= max} className={`grid ${botao} place-items-center text-energia disabled:text-linha`}>
        <Plus className="size-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

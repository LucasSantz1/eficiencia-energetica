"use client";

import { useId } from "react";

/**
 * Interruptor liga/desliga (role="switch", toque de 44 px ou mais). O nome acessível é só o rótulo; a frase, quando
 * há, entra como descrição. Sem frase, é a versão pequena para o topo da tela. O estado aparece também pela posição
 * da bolinha, não só pela cor.
 */
export function Interruptor({ rotulo, descricao, ligado, aoMudar }: { rotulo: string; descricao?: string; ligado: boolean; aoMudar: (ligado: boolean) => void }) {
  const id = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-labelledby={`${id}r`}
      aria-describedby={descricao ? `${id}d` : undefined}
      onClick={() => aoMudar(!ligado)}
      className={
        descricao
          ? `flex min-h-11 w-full items-center gap-4 rounded-[var(--radius-controle)] border-2 bg-papel px-4 py-3 text-left ${ligado ? "border-energia" : "border-linha hover:border-tinta-suave"}`
          : "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-2 text-[0.95rem] hover:bg-fundo"
      }
    >
      <span className="min-w-0 flex-1">
        <span id={`${id}r`} className="block font-bold">
          {rotulo}
        </span>
        {descricao && (
          <span id={`${id}d`} className="block text-[0.95rem] text-tinta-suave">
            {descricao}
          </span>
        )}
      </span>
      <span aria-hidden className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 ${ligado ? "justify-end bg-energia" : "justify-start bg-tinta-suave"}`}>
        <span className="size-5 rounded-full bg-papel" />
      </span>
    </button>
  );
}

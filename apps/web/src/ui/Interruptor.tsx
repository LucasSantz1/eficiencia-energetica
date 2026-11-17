"use client";

import { useId } from "react";

/**
 * Interruptor liga/desliga (role="switch"). O botão inteiro, com o rótulo e a frase, é a área de toque (44 px ou
 * mais); o nome acessível é o rótulo, e a frase entra como descrição.
 */
export function Interruptor({ rotulo, descricao, ligado, aoMudar }: { rotulo: string; descricao: string; ligado: boolean; aoMudar: (ligado: boolean) => void }) {
  const idDescricao = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-describedby={idDescricao}
      onClick={() => aoMudar(!ligado)}
      className={`flex min-h-11 w-full items-center gap-4 rounded-[var(--radius-controle)] border-2 bg-papel px-4 py-3 text-left ${ligado ? "border-energia" : "border-linha hover:border-tinta-suave"}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{rotulo}</span>
        <span id={idDescricao} className="block text-[0.95rem] text-tinta-suave">
          {descricao}
        </span>
      </span>
      {/* O trilho mostra o estado também pela posição da bolinha e pela palavra, não só pela cor. */}
      <span aria-hidden className="flex shrink-0 items-center gap-2 text-[0.9rem] font-bold">
        <span className={ligado ? "text-energia" : "text-tinta-suave"}>{ligado ? "Ligado" : "Desligado"}</span>
        <span className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${ligado ? "justify-end bg-energia" : "justify-start bg-tinta-suave"}`}>
          <span className="size-5 rounded-full bg-papel" />
        </span>
      </span>
    </button>
  );
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Janela que sobe de baixo no celular (usa o <dialog> nativo: acessível e fecha com Esc). O <dialog> cobre a tela e é
 * transparente; tocar fora da folha fecha. `alta`: abre quase na tela toda (os ajustes de Minha casa).
 */
export function Folha({
  aberta,
  aoFechar,
  titulo,
  children,
  rodape,
  alta = false,
}: {
  aberta: boolean;
  aoFechar: () => void;
  titulo: string;
  children: ReactNode;
  rodape?: ReactNode;
  alta?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberta && !d.open) d.showModal();
    if (!aberta && d.open) d.close();
  }, [aberta]);
  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      onClick={(e) => e.target === ref.current && aoFechar()}
      aria-label={titulo}
      className="folha-tela text-tinta open:flex"
    >
      <div
        className={`folha flex flex-col overflow-hidden bg-papel ${alta ? "folha-alta" : ""}`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-linha px-5 py-4">
          <h2 className="min-w-0 text-xl font-extrabold">{titulo}</h2>
          <button
            type="button"
            onClick={aoFechar}
            className="min-h-11 shrink-0 whitespace-nowrap rounded-full px-3 font-bold text-energia [overflow-wrap:normal] hover:bg-energia-claro"
          >
            Fechar
          </button>
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 ${rodape ? "pb-5" : "pb-[max(1.25rem,env(safe-area-inset-bottom))]"}`}>
          {children}
        </div>
        {rodape && (
          <div className="border-t border-linha bg-papel px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {rodape}
          </div>
        )}
      </div>
    </dialog>
  );
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Janela que sobe de baixo no celular (usa o <dialog> nativo: acessível e fecha com Esc). */
export function Folha({ aberta, aoFechar, titulo, children, rodape }: { aberta: boolean; aoFechar: () => void; titulo: string; children: ReactNode; rodape?: ReactNode }) {
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
      className="folha flex-col overflow-hidden bg-papel p-0 text-tinta open:flex"
    >
      <div className="flex items-center justify-between gap-4 border-b border-linha px-5 py-4">
        <h2 className="text-xl font-extrabold">{titulo}</h2>
        <button type="button" onClick={aoFechar} className="min-h-11 rounded-full px-3 font-bold text-energia hover:bg-energia-claro">
          Fechar
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
      {rodape && <div className="border-t border-linha bg-papel px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{rodape}</div>}
    </dialog>
  );
}

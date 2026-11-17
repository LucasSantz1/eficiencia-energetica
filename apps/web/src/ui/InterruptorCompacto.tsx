"use client";

/** Interruptor pequeno para o topo da tela (role="switch", toque de 44 px), com o rótulo sempre visível. */
export function InterruptorCompacto({ rotulo, ligado, aoMudar }: { rotulo: string; ligado: boolean; aoMudar: (ligado: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={() => aoMudar(!ligado)}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-2 text-[0.95rem] font-bold text-tinta hover:bg-fundo"
    >
      {rotulo}
      {/* O estado aparece pela posição da bolinha, não só pela cor. */}
      <span aria-hidden className={`flex h-6 w-10 items-center rounded-full p-0.5 ${ligado ? "justify-end bg-energia" : "justify-start bg-tinta-suave"}`}>
        <span className="size-5 rounded-full bg-papel" />
      </span>
    </button>
  );
}

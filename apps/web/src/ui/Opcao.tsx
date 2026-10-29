"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

/** Opção que se marca e desmarca (radio ou checkbox visual), com área de toque grande. */
export function Opcao({
  selecionada,
  onClick,
  children,
  descricao,
  icone,
  papel = "radio",
  className = "",
}: {
  selecionada: boolean;
  onClick: () => void;
  children: ReactNode;
  descricao?: ReactNode;
  icone?: ReactNode;
  papel?: "radio" | "checkbox";
  className?: string;
}) {
  return (
    <button
      type="button"
      role={papel}
      aria-checked={selecionada}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[var(--radius-controle)] border-2 px-4 py-3 text-left transition-[background-color,border-color,transform] duration-200 active:scale-[0.985] ${
        selecionada ? "border-energia bg-energia-claro" : "border-linha bg-papel hover:border-tinta-suave"
      } ${className}`}
    >
      {icone && <span className={`shrink-0 ${selecionada ? "text-energia" : "text-tinta-suave"}`}>{icone}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-bold leading-snug">{children}</span>
        {descricao && <span className="mt-0.5 block text-[0.95rem] leading-snug text-tinta-suave">{descricao}</span>}
      </span>
      <span
        aria-hidden
        className={`grid size-6 shrink-0 place-items-center border-2 ${papel === "radio" ? "rounded-full" : "rounded-md"} ${
          selecionada ? "border-energia bg-energia" : "border-linha bg-papel"
        }`}
      >
        {selecionada && (papel === "radio" ? <span className="pulo size-2.5 rounded-full bg-white" /> : <Check className="pulo size-4 text-white" strokeWidth={3.5} />)}
      </span>
    </button>
  );
}

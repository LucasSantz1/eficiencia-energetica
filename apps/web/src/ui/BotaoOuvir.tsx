"use client";

import { Square, Volume2 } from "lucide-react";

/**
 * "Ouvir" (HIS-101): para quem lê com dificuldade ou prefere escutar. O texto do botão diz o que o toque faz agora
 * ("Ouvir" ou "Parar de ouvir"); o `rotulo` diz o que vai ser lido, para o leitor de tela (ex.: "Ouvir o resumo").
 */
export function BotaoOuvir({ falando, aoTocar, rotulo, className = "" }: { falando: boolean; aoTocar: () => void; rotulo: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={aoTocar}
      aria-label={falando ? "Parar de ouvir" : rotulo}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-[0.98rem] font-bold transition-colors ${
        falando ? "border-energia bg-energia text-white hover:bg-energia-forte" : "border-linha bg-papel text-energia hover:bg-energia-claro"
      } ${className}`}
    >
      {falando ? <Square className="size-4 fill-current" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
      {falando ? "Parar de ouvir" : "Ouvir"}
    </button>
  );
}

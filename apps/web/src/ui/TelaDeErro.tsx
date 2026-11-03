"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { classesDeBotao } from "@/ui/estilosDeBotao";

// O toque em "Tentar de novo" fica guardado fora do componente: se o retry() falha, o Next pode montar a tela de erro
// de novo, e o estado do componente não sobrevive. Uma falha nova até 10 s depois do toque conta como a 2ª (D5).
const JANELA_DA_SEGUNDA_FALHA_MS = 10_000;
let instanteDoUltimoToque = 0;

/**
 * Tela de erro geral (T3), usada por app/error.tsx e app/global-error.tsx. Não usa o store nem o erro: o texto é
 * fixo, sem mensagem técnica (A8). O link de volta vem de fora, porque no global-error ele precisa ser um <a> comum.
 */
export function TelaDeErro({ aoTentarDeNovo, voltarAoInicio }: { aoTentarDeNovo: () => void; voltarAoInicio: ReactNode }) {
  const [segundaFalha] = useState(() => Date.now() - instanteDoUltimoToque < JANELA_DA_SEGUNDA_FALHA_MS);
  const titulo = useRef<HTMLHeadingElement>(null);
  // Ao abrir, o foco vai para o título: o leitor lê o título e o Tab seguinte cai em "Tentar de novo".
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  return (
    <main className="mx-auto max-w-[34rem] px-4 py-12 sm:px-6">
      {/* O CircleAlert do lucide, desenhado aqui: esta tela vai em toda rota e precisa ser leve. */}
      <svg viewBox="0 0 24 24" className="size-10 text-alerta" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </svg>
      <h1 ref={titulo} tabIndex={-1} className="mt-4 text-[2rem] leading-tight font-extrabold tracking-tight outline-none">
        Algo deu errado nesta tela.
      </h1>
      <p className="mt-3 text-lg text-tinta-suave">Não foi culpa sua. O que você cadastrou continua salvo.</p>
      <p aria-live="polite" className="mt-2 text-lg text-tinta-suave">
        {segundaFalha ? "Ainda não deu certo. Tente mais tarde ou volte ao início." : 'Toque em "Tentar de novo". Se não funcionar, volte ao início.'}
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          className={classesDeBotao("principal", true)}
          onClick={() => {
            instanteDoUltimoToque = Date.now();
            aoTentarDeNovo();
          }}
        >
          Tentar de novo
        </button>
        {voltarAoInicio}
      </div>
    </main>
  );
}

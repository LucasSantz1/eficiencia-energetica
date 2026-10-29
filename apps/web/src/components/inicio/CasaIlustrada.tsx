"use client";

import { useState } from "react";
import { Icone } from "../Icone";

/** Exemplo de casa com 3 pessoas, calculado com a tarifa da Energisa Sul-Sudeste (out/2026). */
const COMODOS = [
  { id: "quarto", nome: "Quarto", icones: ["fan", "smartphone"], valor: 21.74, parte: 0.19, maior: "o ventilador", classe: "col-span-3" },
  { id: "banheiro", nome: "Banheiro", icones: ["shower-head"], valor: 53.74, parte: 0.47, maior: "o chuveiro", classe: "col-span-3" },
  { id: "sala", nome: "Sala", icones: ["tv", "router"], valor: 12.82, parte: 0.11, maior: "a TV", classe: "col-span-2" },
  { id: "cozinha", nome: "Cozinha", icones: ["refrigerator", "microwave"], valor: 20.36, parte: 0.18, maior: "a geladeira", classe: "col-span-2" },
  { id: "lavanderia", nome: "Lavanderia", icones: ["washing-machine"], valor: 5.23, parte: 0.05, maior: "a máquina de lavar", classe: "col-span-2" },
];

const corDaParte = (p: number) => (p >= 0.25 ? "bg-faixa-e text-white" : p >= 0.15 ? "bg-faixa-d text-white" : p >= 0.08 ? "bg-faixa-c text-tinta" : "bg-faixa-a text-white");
const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * A casa em corte, com os cômodos acendendo um a um e o quanto cada um pesa na conta.
 * Tocar num cômodo mostra o detalhe embaixo.
 */
export function CasaIlustrada() {
  const [escolhido, setEscolhido] = useState("banheiro");
  const atual = COMODOS.find((c) => c.id === escolhido)!;

  return (
    <figure className="m-0 w-full max-w-xl justify-self-center lg:justify-self-end">
      <div className="relative">
        {/* Telhado */}
        <svg viewBox="0 0 600 150" className="block w-full" aria-hidden>
          <rect x="430" y="18" width="46" height="90" fill="#2a3d62" />
          <path d="M300 6 L594 146 L6 146 Z" fill="#2a3d62" />
          <path d="M300 34 L540 146 L60 146 Z" fill="#203253" />
          <circle cx="300" cy="104" r="20" fill="var(--color-faisca)" opacity="0.9" />
        </svg>
        <div className="-mt-px grid grid-cols-6 gap-1.5 rounded-b-xl bg-[#2a3d62] p-1.5 sm:gap-2 sm:p-2">
          {COMODOS.map((c, i) => {
            const ativo = c.id === escolhido;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setEscolhido(c.id)}
                onMouseEnter={() => setEscolhido(c.id)}
                aria-pressed={ativo}
                aria-label={`${c.nome}: ${reais(c.valor)} por mês`}
                style={{ animationDelay: `${350 + i * 220}ms` }}
                className={`acende relative flex min-h-28 flex-col justify-between rounded-lg p-2.5 text-left text-tinta transition-shadow sm:min-h-36 sm:p-3 ${c.classe} ${
                  ativo ? "bg-[#ffe7a1] ring-4 ring-faisca" : "bg-[#fff1c9] hover:bg-[#ffe7a1]"
                }`}
              >
                <span className="flex flex-wrap items-start justify-between gap-1">
                  <span className="text-[0.9rem] font-bold sm:text-base">{c.nome}</span>
                  <span className={`numeros rounded-full px-2 py-0.5 text-[0.8rem] font-extrabold sm:text-[0.9rem] ${corDaParte(c.parte)}`}>{Math.round(c.parte * 100)}%</span>
                </span>
                <span className="flex items-end gap-2 text-tinta/80">
                  {c.icones.map((n) => (
                    <Icone key={n} nome={n} className="size-7 sm:size-9" strokeWidth={1.6} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mx-[-4%] h-2 rounded-full bg-[#2a3d62]" aria-hidden />
      </div>
      <figcaption className="mt-5 text-white/85" aria-live="polite">
        <span className="numeros text-2xl font-extrabold text-faisca">{reais(atual.valor)} por mês</span>
        <span className="block">
          no {atual.nome.toLowerCase()}, e quem mais pesa é {atual.maior}. Exemplo de uma casa com 3 pessoas.
        </span>
      </figcaption>
    </figure>
  );
}

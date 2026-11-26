"use client";

import { useEffect, useState } from "react";

export interface ItemDosAjustes {
  id: string;
  nome: string;
}

/**
 * O índice de Minha casa (redesenho de 26/11). No computador, fica fixo à esquerda e marca o grupo que está na tela;
 * no celular, vira uma linha de atalhos no alto (a tela é comprida). É o mesmo elemento nos dois, então a ordem do
 * teclado é a mesma (HIS-112, critério 8). Os links são âncoras comuns: funcionam sem JavaScript.
 */
export function NavegacaoDosAjustes({ itens }: { itens: ItemDosAjustes[] }) {
  const [atual, setAtual] = useState(itens[0]?.id);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    // O grupo "atual" é o que cruza a faixa do alto da tela (logo abaixo do cabeçalho).
    const observador = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visivel) setAtual(visivel.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const { id } of itens) {
      const alvo = document.getElementById(id);
      if (alvo) observador.observe(alvo);
    }
    return () => observador.disconnect();
  }, [itens]);

  return (
    <nav aria-label="Partes de Minha casa" className="lg:sticky lg:top-24 lg:self-start">
      <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
        {itens.map(({ id, nome }) => {
          const marcado = atual === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={marcado ? "location" : undefined}
                onClick={() => setAtual(id)}
                className={`inline-flex min-h-11 items-center rounded-full border px-4 font-bold transition-colors lg:flex lg:rounded-[var(--radius-controle)] lg:border-transparent lg:px-3 ${
                  marcado
                    ? "border-energia bg-energia-claro text-energia"
                    : "border-linha bg-papel text-tinta-suave hover:text-tinta lg:bg-transparent lg:hover:bg-papel"
                }`}
              >
                {nome}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

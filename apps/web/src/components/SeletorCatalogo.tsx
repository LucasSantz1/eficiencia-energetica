"use client";

import { CATALOGO_VISIVEL, CATEGORIAS } from "@ee/core";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Icone } from "./Icone";
import { Folha } from "./ui";

const semAcento = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Lista de aparelhos comuns, separados por tipo, para escolher com um toque. */
export function SeletorCatalogo({ aberto, aoFechar, aoEscolher }: { aberto: boolean; aoFechar: () => void; aoEscolher: (catalogoId: string) => void }) {
  const [busca, setBusca] = useState("");
  const termo = semAcento(busca.trim());
  const grupos = useMemo(
    () =>
      CATEGORIAS.map((c) => ({
        ...c,
        itens: CATALOGO_VISIVEL.filter((i) => i.categoria === c.id && (!termo || semAcento(i.nome).includes(termo) || i.id === "outro")),
      })).filter((g) => g.itens.length > 0),
    [termo],
  );

  return (
    <Folha aberta={aberto} aoFechar={aoFechar} titulo="Qual aparelho?">
      <div className="mb-5 flex items-center gap-2 rounded-[var(--radius-controle)] border-2 border-linha bg-papel px-4 focus-within:border-energia">
        <Search className="size-5 shrink-0 text-tinta-suave" aria-hidden />
        <label htmlFor="busca-aparelho" className="sr-only">
          Procurar aparelho
        </label>
        <input id="busca-aparelho" type="search" placeholder="Procurar (ex.: geladeira)" value={busca} onChange={(e) => setBusca(e.target.value)} className="min-h-12 w-full bg-transparent text-lg outline-none" />
      </div>
      <div className="space-y-6">
        {grupos.map((g) => (
          <section key={g.id} aria-labelledby={`cat-${g.id}`}>
            <h3 id={`cat-${g.id}`} className="mb-2 font-extrabold text-tinta-suave">
              {g.nome}
            </h3>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {g.itens.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setBusca("");
                      aoEscolher(i.id);
                    }}
                    className="flex h-full min-h-24 w-full flex-col items-start justify-between gap-2 rounded-[var(--radius-controle)] border-2 border-linha bg-papel p-3 text-left font-bold leading-snug hover:border-energia"
                  >
                    <Icone nome={i.icone} className="size-7 text-energia" />
                    {i.nome}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Folha>
  );
}

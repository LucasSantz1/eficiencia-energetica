"use client";

import type { Municipio } from "@ee/core";
import { MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Opcao } from "./ui";

const semAcento = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/** Campo de busca de cidade que ignora acentos e mostra primeiro as que começam com o que foi digitado. */
export function BuscaCidade({ municipios, selecionado, aoEscolher, autoFocus = true }: { municipios: Municipio[]; selecionado?: Municipio; aoEscolher: (m: Municipio) => void; autoFocus?: boolean }) {
  const [busca, setBusca] = useState("");
  const termo = semAcento(busca);
  const filtrados = useMemo(() => {
    if (!termo) return municipios;
    const comeca = municipios.filter((m) => semAcento(m.nome).startsWith(termo));
    const contem = municipios.filter((m) => !semAcento(m.nome).startsWith(termo) && semAcento(m.nome).includes(termo));
    return [...comeca, ...contem];
  }, [municipios, termo]);
  const LIMITE = 60;

  return (
    <div className="mt-6">
      <label htmlFor="busca-cidade" className="sr-only">
        Digite o nome da cidade
      </label>
      <div className="sticky top-0 z-10 -mx-4 bg-fundo px-4 py-2">
        <div className="flex items-center gap-2 rounded-[var(--radius-controle)] border-2 border-linha bg-papel px-4 focus-within:border-energia">
          <Search className="size-5 shrink-0 text-tinta-suave" aria-hidden />
          <input
            id="busca-cidade"
            type="search"
            autoComplete="off"
            autoFocus={autoFocus}
            placeholder="Digite o nome da cidade"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="min-h-13 w-full bg-transparent text-lg outline-none placeholder:text-tinta-suave/70"
          />
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {filtrados.length} cidades encontradas
      </p>
      {filtrados.length === 0 ? (
        <p className="mt-6 text-lg text-tinta-suave">Nenhuma cidade com esse nome neste estado. Confira se escreveu certo.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {filtrados.slice(0, LIMITE).map((m) => (
            <li key={m.ibge}>
              <Opcao selecionada={selecionado?.ibge === m.ibge} onClick={() => aoEscolher(m)} icone={<MapPin className="size-5" />}>
                {m.nome}
              </Opcao>
            </li>
          ))}
        </ul>
      )}
      {filtrados.length > LIMITE && <p className="mt-4 text-center text-tinta-suave">Digite mais letras para ver outras {filtrados.length - LIMITE} cidades.</p>}
    </div>
  );
}

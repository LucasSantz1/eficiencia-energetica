"use client";

import { Plus } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { formatarPorcentagem, formatarReais, type Aparelho, type Comodo } from "@ee/core";
import { Botao } from "@/ui/Botao";
import { COR_FAIXA, faixaDoPeso } from "@/ui/Etiqueta";
import { ConteudoDoComodo } from "./ConteudoDoComodo";

interface ValorDoComodo {
  comodoId: string;
  valorMes: number;
  participacao: number;
}

// O #comodo-<id> do link da /casa também vale aqui. É lido como fonte externa (e não num efeito) porque o roteador
// do Next só grava o endereço novo depois do render: o React confere de novo ao assinar e pega o hash certo.
function assinarHash(avisar: () => void): () => void {
  window.addEventListener("hashchange", avisar);
  return () => window.removeEventListener("hashchange", avisar);
}
const lerHash = () => window.location.hash;
const hashNoServidor = () => "";

/**
 * Cômodos no computador (HIS-112, L4): a lista à esquerda e o cômodo aberto à direita. Na ordem do código, a lista
 * vem antes do painel, para o Tab não pular de um lado para o outro. Trocar de cômodo não rola a página nem move o
 * foco: quem usa leitor ouve o painel mudar pelo h2 dele (sem aria-live, decisão em vigor).
 */
export function ComodosNoComputador({
  comodos,
  aparelhos,
  valores,
  totalMes,
  aoAdicionarAparelho,
  aoDetalhes,
  aoEditar,
  aoNovoComodo,
}: {
  comodos: Comodo[];
  aparelhos: Aparelho[];
  valores: ValorDoComodo[];
  totalMes: number;
  aoAdicionarAparelho: (comodoId: string) => void;
  aoDetalhes: (a: Aparelho) => void;
  aoEditar: (c: Comodo) => void;
  aoNovoComodo: () => void;
}) {
  const hash = useSyncExternalStore(assinarHash, lerHash, hashNoServidor);
  const [escolhido, setEscolhido] = useState<string>();
  // Derivado, sem efeito: se o cômodo escolhido for apagado, o painel passa ao do link ou ao primeiro.
  const aberto = comodos.find((c) => c.id === escolhido) ?? comodos.find((c) => `#comodo-${c.id}` === hash) ?? comodos[0];
  const doAberto = aberto ? aparelhos.filter((a) => a.comodoId === aberto.id) : [];
  const unidadesDoAberto = doAberto.reduce((s, a) => s + a.quantidade, 0);
  const valorDoAberto = valores.find((v) => v.comodoId === aberto?.id)?.valorMes ?? 0;

  return (
    <div className="mt-6 grid grid-cols-[22rem_minmax(0,1fr)] items-start gap-8">
      {/* A margem negativa com o mesmo recuo deixa o contorno de foco (5 px) aparecer dentro da rolagem da coluna. */}
      <div className="lateral-fixa -m-1.5 p-1.5">
        <nav aria-label="Cômodos">
          <ul className="space-y-2">
            {comodos.map((c) => {
              const valor = valores.find((v) => v.comodoId === c.id);
              const participacao = valor?.participacao ?? 0;
              const unidades = aparelhos.filter((a) => a.comodoId === c.id).reduce((s, a) => s + a.quantidade, 0);
              const ehAberto = c.id === aberto?.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setEscolhido(c.id)}
                    aria-current={ehAberto || undefined}
                    className={`block min-h-[4.25rem] w-full rounded-[var(--radius-cartao)] border-2 px-4 py-3 text-left ${ehAberto ? "border-energia bg-energia-claro" : "border-transparent bg-papel hover:border-linha"}`}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 text-lg font-extrabold">{c.nome}</span>
                      <span className="numeros shrink-0 text-lg font-extrabold">{formatarReais(valor?.valorMes ?? 0)}</span>
                    </span>
                    <span className="block text-[0.95rem] text-tinta-suave">
                      {unidades} {unidades === 1 ? "item" : "itens"}
                    </span>
                    <span className="mt-2 flex items-center gap-2">
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-fundo">
                        <span className={`block h-full rounded-full transition-[width] duration-500 ${COR_FAIXA[faixaDoPeso(participacao)]}`} style={{ width: `${Math.max(2, participacao * 100)}%` }} />
                      </span>
                      <span className="numeros w-12 text-right text-[0.9rem] text-tinta-suave">{formatarPorcentagem(participacao)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        {totalMes > 0 && (
          <p className="mt-3 flex items-baseline justify-between gap-3 border-t border-linha px-4 pt-3 text-lg font-extrabold">
            <span>Total por mês</span>
            <span className="numeros">{formatarReais(totalMes)}</span>
          </p>
        )}
        <Botao variante="secundario" className="mt-4" onClick={aoNovoComodo}>
          <Plus className="size-5" aria-hidden /> Adicionar cômodo
        </Botao>
      </div>

      <section aria-labelledby="titulo-painel-comodo" className="overflow-hidden rounded-[var(--radius-cartao)] bg-papel">
        <div className="flex items-center justify-between gap-4 px-6 py-5">
          <div className="min-w-0">
            <h2 id="titulo-painel-comodo" className="text-2xl font-extrabold tracking-tight">
              {aberto?.nome ?? "Nenhum cômodo ainda."}
            </h2>
            {aberto && (
              <p className="numeros text-tinta-suave">
                {unidadesDoAberto} {unidadesDoAberto === 1 ? "item" : "itens"}, {formatarReais(valorDoAberto)} por mês
              </p>
            )}
          </div>
          {aberto ? (
            <Botao variante="secundario" className="shrink-0" onClick={() => aoEditar(aberto)}>
              Editar cômodo
            </Botao>
          ) : (
            <Botao className="shrink-0" onClick={aoNovoComodo}>
              <Plus className="size-5" aria-hidden /> Adicionar cômodo
            </Botao>
          )}
        </div>
        {aberto && (
          <div className="border-t border-linha bg-fundo/60 p-4">
            <ConteudoDoComodo comodo={aberto} aparelhos={doAberto} aoAdicionar={() => aoAdicionarAparelho(aberto.id)} aoDetalhes={aoDetalhes} />
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { House, Lightbulb, ListChecks, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useResumo } from "@/lib/resumo";
import { useCasa, useCasaCarregada } from "@/lib/store";
import { Marca } from "./Marca";
import { Aviso, BotaoLink } from "./ui";

const ITENS = [
  { href: "/casa", rotulo: "Resumo", Icone: House },
  { href: "/casa/aparelhos", rotulo: "Aparelhos", Icone: ListChecks },
  { href: "/casa/dicas", rotulo: "Dicas", Icone: Lightbulb },
  { href: "/casa/ajustes", rotulo: "Minha casa", Icone: Settings2 },
];

/** Estrutura das telas da casa: topo, navegação (embaixo no celular, no topo no computador) e conteúdo. */
export function Casca({ children }: { children: ReactNode }) {
  const caminho = usePathname();
  const carregada = useCasaCarregada();
  const residencia = useCasa((s) => s.residencia);
  const { arquivo } = useResumo();

  return (
    <div className="min-h-dvh pb-28 sm:pb-12">
      <header className="border-b border-linha bg-papel">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Marca href="/" />
          {residencia && (
            <Link href="/casa/ajustes" className="max-w-[58%] truncate rounded-full px-3 py-2 text-right text-[0.95rem] font-bold text-tinta-suave hover:bg-fundo">
              {residencia.municipioNome}
            </Link>
          )}
        </div>
        <nav aria-label="Seções" className="mx-auto hidden max-w-4xl gap-1 px-4 sm:flex sm:px-6">
          {ITENS.map(({ href, rotulo, Icone }) => {
            const ativo = caminho === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={`-mb-px inline-flex min-h-12 items-center gap-2 border-b-[3px] px-4 font-bold ${ativo ? "border-energia text-energia" : "border-transparent text-tinta-suave hover:text-tinta"}`}
              >
                <Icone className="size-5" aria-hidden />
                {rotulo}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-6 sm:px-6 sm:pt-8">
        {arquivo?.origem === "exemplo" && (
          <div className="mb-6">
            <Aviso tom="faisca">Estes são dados de exemplo para testes. As tarifas reais da ANEEL entram na próxima atualização automática.</Aviso>
          </div>
        )}
        {!carregada ? (
          <div className="space-y-4" aria-busy aria-label="Carregando">
            <div className="h-40 animate-pulse rounded-[var(--radius-cartao)] bg-papel" />
            <div className="h-64 animate-pulse rounded-[var(--radius-cartao)] bg-papel" />
          </div>
        ) : !residencia ? (
          <div className="py-10">
            <h1 className="text-[2rem] leading-tight font-extrabold">Vamos cadastrar a sua casa</h1>
            <p className="mt-3 max-w-[48ch] text-lg text-tinta-suave">Leva uns dois minutos. Precisamos saber a sua cidade e quais aparelhos você tem.</p>
            <BotaoLink href="/comecar" className="mt-8">
              Começar
            </BotaoLink>
          </div>
        ) : (
          children
        )}
      </main>

      <nav aria-label="Seções" className="fixed inset-x-0 bottom-0 z-20 border-t border-linha bg-papel pb-[env(safe-area-inset-bottom)] sm:hidden">
        <ul className="grid grid-cols-4">
          {ITENS.map(({ href, rotulo, Icone }) => {
            const ativo = caminho === href;
            return (
              <li key={href}>
                <Link href={href} aria-current={ativo ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[0.82rem] font-bold ${ativo ? "text-energia" : "text-tinta-suave"}`}>
                  <span className={`grid h-8 w-14 place-items-center rounded-full ${ativo ? "bg-energia-claro" : ""}`}>
                    <Icone className="size-6" aria-hidden strokeWidth={ativo ? 2.4 : 1.9} />
                  </span>
                  {rotulo}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

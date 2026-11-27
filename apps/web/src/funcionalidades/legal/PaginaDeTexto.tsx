import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Marca } from "@/ui/Marca";
import { TransicaoTela } from "@/ui/Movimento";
import { VOLTAR } from "@/ui/tiposDeTransicao";

/** Moldura das páginas de texto (Termos de uso e Privacidade): coluna estreita, para ler sem cansar. */
export function PaginaDeTexto({ titulo, versao, children }: { titulo: string; versao: string; children: ReactNode }) {
  return (
    <TransicaoTela>
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-16 sm:px-6">
        <header className="flex items-center justify-between gap-3">
          <Marca />
          <Link href="/" transitionTypes={VOLTAR} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 font-bold text-tinta-suave hover:bg-papel">
            <ChevronLeft aria-hidden className="size-5" /> Início
          </Link>
        </header>
        <main className="mt-10">
          <h1 className="text-[2.2rem] leading-tight font-extrabold tracking-tight">{titulo}</h1>
          <p className="mt-2 text-tinta-suave">Versão de {versao}</p>
          <div className="mt-8 space-y-8 text-lg leading-relaxed [&_h2]:text-2xl [&_h2]:font-extrabold [&_li]:ml-5 [&_li]:list-disc [&_section]:space-y-3 [&_ul]:space-y-2">
            {children}
          </div>
        </main>
      </div>
    </TransicaoTela>
  );
}

/** Data da versão em português ("27 de novembro de 2026"), a partir de "2026-11-27". */
export function dataDaVersao(versao: string): string {
  const [ano, mes, dia] = versao.split("-").map(Number);
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${dia} de ${meses[(mes ?? 1) - 1]} de ${ano}`;
}

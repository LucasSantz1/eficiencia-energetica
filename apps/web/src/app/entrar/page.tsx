import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { IlustracaoDaConta } from "@/funcionalidades/conta/IlustracaoDaConta";
import { TelaEntrar } from "@/funcionalidades/conta/TelaEntrar";
import { Marca } from "@/ui/Marca";
import { TransicaoTela } from "@/ui/Movimento";

export const metadata: Metadata = { title: "Entrar ou criar conta", robots: { index: false, follow: false } };

/** Página estática: tudo o que é da pessoa vai pelo /api do próprio site, nunca no HTML (ADR-007). */
export const dynamic = "force-static";

/**
 * Em duas colunas no computador: o formulário num cartão claro à esquerda e, à direita, o que a conta dá. No celular,
 * só o cartão: o desenho não ajuda quem tem tela pequena e internet fraca.
 */
export default function Pagina() {
  return (
    <TransicaoTela>
      <div className="min-h-dvh bg-noite text-white">
        <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pt-4 pb-10 sm:px-8">
          <header className="flex items-center justify-between gap-3">
            <Marca />
            <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 font-bold text-white/85 hover:bg-white/10 hover:text-white">
              <ChevronLeft aria-hidden className="size-5" />
              <span className="sm:hidden">Início</span>
              <span className="hidden sm:inline">Voltar para o início</span>
            </Link>
          </header>
          <div className="mt-6 flex flex-1 flex-col lg:mt-8">
            <TelaEntrar lado={<IlustracaoDaConta />} />
          </div>
        </div>
      </div>
    </TransicaoTela>
  );
}

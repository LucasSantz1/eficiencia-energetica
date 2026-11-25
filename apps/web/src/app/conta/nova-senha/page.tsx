import type { Metadata } from "next";
import { TelaNovaSenha } from "@/funcionalidades/conta/TelaNovaSenha";
import { Marca } from "@/ui/Marca";
import { TransicaoTela } from "@/ui/Movimento";

export const metadata: Metadata = { title: "Senha nova", robots: { index: false, follow: false } };

/** Página estática: tudo o que é da pessoa vai pelo /api do próprio site, nunca no HTML (ADR-007). */
export const dynamic = "force-static";

export default function Pagina() {
  return (
    <TransicaoTela>
      <div className="mx-auto min-h-dvh max-w-2xl px-4 pt-4 pb-16 sm:px-6">
        <header>
          <Marca />
        </header>
        <main className="mt-8">
          <TelaNovaSenha />
        </main>
      </div>
    </TransicaoTela>
  );
}

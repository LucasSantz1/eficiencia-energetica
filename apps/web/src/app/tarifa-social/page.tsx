import type { Metadata } from "next";
import { GuiaTarifaSocial } from "@/funcionalidades/tarifa-social/GuiaTarifaSocial";
import { TOPO } from "@/funcionalidades/tarifa-social/textos";
import { Marca } from "@/ui/Marca";
import { TransicaoTela } from "@/ui/Movimento";

export const metadata: Metadata = {
  title: "Tarifa Social: será que a sua família pode ter?",
  description: "Seis perguntas rápidas para ver se a família pode ter Tarifa Social ou Desconto Social, com os documentos e onde ir. Nada é guardado.",
};

/** Página estática (sem dado de pessoa no servidor): o guia roda inteiro no aparelho (HIS-103). */
export const dynamic = "force-static";

export default function Pagina() {
  return (
    <TransicaoTela>
      <div className="mx-auto min-h-dvh max-w-2xl px-4 pt-4 pb-16 sm:px-6 lg:max-w-[64rem] lg:px-8">
        <header>
          <Marca />
        </header>
        <main className="mt-8">
          <h1 className="text-[clamp(2rem,7vw,2.6rem)] leading-tight font-extrabold tracking-tight">{TOPO.titulo}</h1>
          <p className="mt-3 max-w-[56ch] text-lg text-tinta-suave">{TOPO.texto}</p>
          <GuiaTarifaSocial />
        </main>
      </div>
    </TransicaoTela>
  );
}

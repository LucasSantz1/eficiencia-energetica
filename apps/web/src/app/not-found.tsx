import type { Metadata } from "next";
import Link from "next/link";
import { classesDeBotao } from "@/ui/estilosDeBotao";
import { Marca } from "@/ui/Marca";

export const metadata: Metadata = { title: "Página não encontrada" };

// Endereço que não existe (T4). O código 404 o Next já manda; o h1 é o primeiro texto da leitura e não puxa o foco.
export default function NaoEncontrada() {
  return (
    <div className="mx-auto max-w-[34rem] px-4 pt-4 pb-16 sm:px-6">
      <header>
        <Marca />
      </header>
      <main className="mt-10">
        <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">Não achamos esta página.</h1>
        <p className="mt-3 text-lg text-tinta-suave">O endereço pode estar errado ou a página mudou de lugar.</p>
        {/* Link com as classes do botão, sem o componente BotaoLink: esta tela vai na árvore de toda rota, e o módulo
            do Botao viraria um pedaço de JS a mais em todas elas. */}
        <Link href="/" className={`${classesDeBotao("principal", true)} mt-8 sm:w-auto`}>
          Voltar ao início
        </Link>
      </main>
    </div>
  );
}

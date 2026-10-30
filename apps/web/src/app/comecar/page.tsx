import type { Metadata } from "next";
import { TransicaoTela } from "@/ui/Movimento";
import { Cadastro } from "@/funcionalidades/cadastro/Cadastro";

export const metadata: Metadata = { title: "Cadastrar a minha casa" };

export default function Pagina() {
  return (
    <TransicaoTela>
      <div>
        <Cadastro />
      </div>
    </TransicaoTela>
  );
}

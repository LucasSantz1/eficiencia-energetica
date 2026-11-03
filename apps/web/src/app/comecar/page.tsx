import type { Metadata } from "next";
import { Cadastro } from "@/funcionalidades/cadastro/Cadastro";
import { TransicaoTela } from "@/ui/Movimento";

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

import type { Metadata } from "next";
import { TransicaoTela } from "@/components/Movimento";
import { Cadastro } from "./Cadastro";

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

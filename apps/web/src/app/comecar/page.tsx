import type { Metadata } from "next";
import { Cadastro } from "./Cadastro";

export const metadata: Metadata = { title: "Cadastrar a minha casa" };

export default function Pagina() {
  return <Cadastro />;
}

import type { Metadata } from "next";
import { TelaAntesDeComprar } from "@/funcionalidades/antes-de-comprar/TelaAntesDeComprar";

export const metadata: Metadata = { title: "Antes de comprar" };

export default function Pagina() {
  return <TelaAntesDeComprar />;
}

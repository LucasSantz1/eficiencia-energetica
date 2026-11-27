import type { Metadata } from "next";
import { Suspense } from "react";
import { TelaContaAlta } from "@/funcionalidades/conta-alta/TelaContaAlta";

export const metadata: Metadata = { title: "Por que a conta veio alta?" };

export default function Pagina() {
  // useSearchParams (?conta=) precisa de Suspense numa página estática (Next 16).
  return (
    <Suspense>
      <TelaContaAlta />
    </Suspense>
  );
}

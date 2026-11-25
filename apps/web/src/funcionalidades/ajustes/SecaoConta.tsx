"use client";

import { lazy, Suspense } from "react";
import { useConta } from "@/aplicacao/conta-estado";
import { IgnorarFalha } from "@/ui/IgnorarFalha";

// O painel da conta só baixa quando a conta está ligada neste site: sem as variáveis no servidor, ninguém paga o peso.
const PainelDaConta = lazy(() => import("./PainelDaConta").then((m) => ({ default: m.PainelDaConta })));

/** "Sua conta" (E4). Sem as variáveis da conta no servidor, a seção nem aparece: o site funciona como antes. */
export function SecaoConta() {
  const conta = useConta();
  if (conta.tipo === "desligada" || conta.tipo === "carregando") return null;
  return (
    <IgnorarFalha>
      <Suspense fallback={null}>
        <PainelDaConta />
      </Suspense>
    </IgnorarFalha>
  );
}

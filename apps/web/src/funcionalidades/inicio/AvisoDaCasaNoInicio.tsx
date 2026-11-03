"use client";

import { useAvisoDaCasaSalva } from "@/aplicacao/casa";
import { AvisoDaCasaSalva } from "@/ui/AvisoDaCasaSalva";

/**
 * T1 na página inicial: o BotaoComecar lê a casa aqui. Se a pessoa entra por esta página e o aviso não aparece,
 * ela nunca o vê, porque a versão limpa já foi regravada (D5).
 */
export function AvisoDaCasaNoInicio() {
  const { aviso, dispensar } = useAvisoDaCasaSalva();
  return <AvisoDaCasaSalva aviso={aviso} aoEntender={dispensar} className="mx-auto max-w-7xl px-4 pt-6 sm:px-8" />;
}

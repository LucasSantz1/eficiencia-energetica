"use client";

import Link from "next/link";
import { useCasa, useCasaCarregada } from "@/lib/store";
import { ENTRAR_NO_PAINEL, IR_ADIANTE } from "@/ui/Movimento";

const ESTILOS = {
  /** Botão amarelo, para fundos escuros. */
  faisca: "bg-faisca text-tinta hover:bg-[#ffd451] shadow-[0_3px_0_0_#c89400]",
  /** Botão verde, para fundos claros. */
  principal: "bg-energia text-white hover:bg-energia-forte shadow-[0_3px_0_0_var(--color-energia-forte)]",
  /** Contorno claro, para o topo escuro. */
  contorno: "border-2 border-white/40 text-white hover:border-white hover:bg-white/10",
  /** Contorno escuro, para o topo claro. */
  contornoEscuro: "border-2 border-linha text-tinta hover:border-tinta-suave bg-papel",
} as const;

/** Leva para o cadastro, ou direto para o acompanhamento de quem já começou. */
export function BotaoComecar({ estilo = "principal", compacto = false, texto }: { estilo?: keyof typeof ESTILOS; compacto?: boolean; texto?: string }) {
  const carregada = useCasaCarregada();
  const temCasa = useCasa((s) => Boolean(s.residencia));
  const jaComecou = carregada && temCasa;
  return (
    <Link
      href={jaComecou ? "/casa" : "/comecar"}
      transitionTypes={jaComecou ? ENTRAR_NO_PAINEL : IR_ADIANTE}
      className={`inline-flex items-center justify-center rounded-[var(--radius-controle)] font-bold transition-colors ${compacto ? "min-h-11 px-4 py-2" : "min-h-14 px-7 text-lg"} ${ESTILOS[estilo]}`}
    >
      {jaComecou ? "Ver a minha casa" : compacto ? "Começar" : (texto ?? "Calcular a minha conta")}
    </Link>
  );
}

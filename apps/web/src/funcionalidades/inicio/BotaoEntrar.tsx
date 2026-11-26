"use client";

import { LogIn, UserRound } from "lucide-react";
import Link from "next/link";
import { useConta } from "@/aplicacao/conta-estado";

/**
 * "Entrar" no topo, como nos outros sites: é o caminho de quem já tem conta e abriu o site num celular novo. Só aparece
 * quando o site tem a conta ligada (a página decide no servidor, sem pedido a mais). Para quem já entrou, vira
 * "Minha conta" e leva para Minha casa, onde ficam a conta e os links da família.
 */
export function BotaoEntrar() {
  const conta = useConta();
  if (conta.tipo === "desligada") return null;
  const conectada = conta.tipo === "conectada";
  return (
    <Link
      href={conectada ? "/casa/ajustes" : "/entrar"}
      className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-controle)] px-3 font-bold whitespace-nowrap text-white/90 transition-colors hover:bg-white/10 hover:text-white"
    >
      {conectada ? <UserRound aria-hidden className="hidden size-5 sm:block" /> : <LogIn aria-hidden className="hidden size-5 sm:block" />}
      {conectada ? "Minha conta" : "Entrar"}
    </Link>
  );
}

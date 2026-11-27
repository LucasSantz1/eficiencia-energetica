"use client";

import { LogIn, UserRound } from "lucide-react";
import Link from "next/link";
import { useConta } from "@/aplicacao/conta-estado";

/**
 * "Entrar" no topo, como nos outros sites: é o caminho de quem já tem conta e abriu o site num celular novo. Só aparece
 * quando o site tem a conta ligada (a página decide no servidor, sem pedido a mais). Para quem já entrou, vira
 * "Minha conta" e leva para Minha casa, onde ficam a conta e os links da família. No celular é só o desenho (o nome fica
 * para o leitor de tela): com o texto, o topo não cabia numa linha e o botão caía para baixo da marca (dono, 27/11).
 */
export function BotaoEntrar() {
  const conta = useConta();
  if (conta.tipo === "desligada") return null;
  const conectada = conta.tipo === "conectada";
  return (
    <Link
      href={conectada ? "/casa/ajustes" : "/entrar"}
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap text-white/90 transition-colors hover:bg-white/10 hover:text-white sm:rounded-[var(--radius-controle)] sm:px-3"
    >
      {conectada ? <UserRound aria-hidden className="size-6 sm:size-5" /> : <LogIn aria-hidden className="size-6 sm:size-5" />}
      <span className="sr-only sm:not-sr-only">{conectada ? "Minha conta" : "Entrar"}</span>
    </Link>
  );
}

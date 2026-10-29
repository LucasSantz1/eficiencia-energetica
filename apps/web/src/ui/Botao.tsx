"use client";

import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps } from "react";

type Variante = "principal" | "secundario" | "fantasma" | "perigo";

const estilosBotao: Record<Variante, string> = {
  principal: "bg-energia text-white hover:bg-energia-forte active:bg-energia-forte shadow-[0_2px_0_0_var(--color-energia-forte)]",
  secundario: "bg-papel text-tinta border-2 border-linha hover:border-tinta-suave",
  fantasma: "text-energia hover:bg-energia-claro",
  perigo: "bg-papel text-alerta border-2 border-alerta/30 hover:bg-alerta-claro",
};

const baseBotao =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-controle)] px-5 py-3 text-[1.0625rem] font-bold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45";

export const Botao = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; largo?: boolean }>(
  function Botao({ variante = "principal", largo, className = "", type = "button", ...props }, ref) {
    return <button ref={ref} type={type} className={`${baseBotao} ${estilosBotao[variante]} ${largo ? "w-full" : ""} ${className}`} {...props} />;
  },
);

export function BotaoLink({ variante = "principal", largo, className = "", ...props }: ComponentProps<typeof Link> & { variante?: Variante; largo?: boolean }) {
  return <Link className={`${baseBotao} ${estilosBotao[variante]} ${largo ? "w-full" : ""} ${className}`} {...props} />;
}

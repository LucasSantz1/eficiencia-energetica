"use client";

import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps } from "react";
import { baseBotao, estilosBotao, type Variante } from "@/ui/estilosDeBotao";

export const Botao = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; largo?: boolean }>(
  function Botao({ variante = "principal", largo, className = "", type = "button", ...props }, ref) {
    return <button ref={ref} type={type} className={`${baseBotao} ${estilosBotao[variante]} ${largo ? "w-full" : ""} ${className}`} {...props} />;
  },
);

export function BotaoLink({ variante = "principal", largo, className = "", ...props }: ComponentProps<typeof Link> & { variante?: Variante; largo?: boolean }) {
  return <Link className={`${baseBotao} ${estilosBotao[variante]} ${largo ? "w-full" : ""} ${className}`} {...props} />;
}

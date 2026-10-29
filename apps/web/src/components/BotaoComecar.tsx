"use client";

import { useCasa, useCasaCarregada } from "@/lib/store";
import { BotaoLink } from "./ui";

/** Leva para o cadastro, ou direto para a casa de quem já começou. */
export function BotaoComecar({ compacto = false }: { compacto?: boolean }) {
  const carregada = useCasaCarregada();
  const temCasa = useCasa((s) => Boolean(s.residencia));
  const jaComecou = carregada && temCasa;
  return (
    <BotaoLink href={jaComecou ? "/casa" : "/comecar"} variante={compacto ? "secundario" : "principal"} className={compacto ? "min-h-11 px-4 py-2" : "px-7 text-lg"}>
      {jaComecou ? "Ver a minha casa" : compacto ? "Começar" : "Calcular a minha conta"}
    </BotaoLink>
  );
}

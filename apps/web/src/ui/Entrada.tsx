"use client";

import { forwardRef, useContext, type ComponentProps } from "react";
import { CampoContexto } from "@/ui/Campo";

/**
 * Caixa de texto. Dentro de um `Campo`, recebe dele `aria-invalid`, `aria-describedby` e a cor da borda (erro: vermelho;
 * "Confere?": amarelo). O `aria-describedby` que vier por prop entra depois (ex.: o alerta do preço, que fica no
 * campo do valor, também descreve o campo do consumo). Fora de um `Campo`, fica igual a antes.
 */
export const Entrada = forwardRef<HTMLInputElement, ComponentProps<"input"> & { sufixo?: string; prefixo?: string }>(function Entrada(
  { sufixo, prefixo, className = "", "aria-describedby": descricaoExtra, ...props },
  ref,
) {
  const campo = useContext(CampoContexto);
  const borda = campo?.invalido ? "border-alerta" : campo?.emAlerta ? "border-faisca" : "border-linha";
  const descricao = [campo?.idsDescricao, descricaoExtra].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`flex items-center rounded-[var(--radius-controle)] border-2 ${borda} bg-papel focus-within:border-energia`}>
      {prefixo && <span className="pl-4 font-bold text-tinta-suave">{prefixo}</span>}
      <input
        ref={ref}
        className={`numeros min-h-12 w-full min-w-0 bg-transparent px-4 text-lg font-bold outline-none placeholder:font-normal placeholder:text-tinta-suave/70 ${className}`}
        aria-invalid={campo?.invalido || undefined}
        aria-describedby={descricao}
        {...props}
      />
      {sufixo && <span className="pr-4 font-bold text-tinta-suave">{sufixo}</span>}
    </div>
  );
});

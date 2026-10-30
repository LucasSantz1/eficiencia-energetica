"use client";

import { forwardRef, type ComponentProps } from "react";

export const Entrada = forwardRef<HTMLInputElement, ComponentProps<"input"> & { sufixo?: string; prefixo?: string }>(function Entrada(
  { sufixo, prefixo, className = "", ...props },
  ref,
) {
  return (
    <div className="flex items-center rounded-[var(--radius-controle)] border-2 border-linha bg-papel focus-within:border-energia">
      {prefixo && <span className="pl-4 font-bold text-tinta-suave">{prefixo}</span>}
      <input ref={ref} className={`numeros min-h-12 w-full min-w-0 bg-transparent px-4 text-lg font-bold outline-none placeholder:font-normal placeholder:text-tinta-suave/70 ${className}`} {...props} />
      {sufixo && <span className="pr-4 font-bold text-tinta-suave">{sufixo}</span>}
    </div>
  );
});

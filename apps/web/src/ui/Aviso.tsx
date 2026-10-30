"use client";

import type { ReactNode } from "react";

/**
 * `anunciar={false}` tira o `role` do próprio aviso, para ele entrar numa região `role="status"` que já está na página
 * (o leitor de tela só anuncia o que entra numa região que já existia; e não pode haver um `status` dentro de outro).
 */
export function Aviso({
  tom = "info",
  children,
  icone,
  anunciar = true,
  className = "",
}: {
  tom?: "info" | "alerta" | "faisca";
  children: ReactNode;
  icone?: ReactNode;
  anunciar?: boolean;
  className?: string;
}) {
  const cores = {
    info: "bg-energia-claro text-energia-forte",
    alerta: "bg-alerta-claro text-alerta",
    faisca: "bg-faisca-claro text-tinta",
  }[tom];
  return (
    <div role={anunciar ? (tom === "alerta" ? "alert" : "status") : undefined} className={`flex gap-3 rounded-[var(--radius-controle)] px-4 py-3 text-[0.98rem] leading-snug ${cores} ${className}`}>
      {icone && <span className="mt-0.5 shrink-0">{icone}</span>}
      <div>{children}</div>
    </div>
  );
}

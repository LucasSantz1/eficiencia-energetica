"use client";

import type { ReactNode } from "react";

export function Aviso({ tom = "info", children, icone }: { tom?: "info" | "alerta" | "faisca"; children: ReactNode; icone?: ReactNode }) {
  const cores = {
    info: "bg-energia-claro text-energia-forte",
    alerta: "bg-alerta-claro text-alerta",
    faisca: "bg-faisca-claro text-tinta",
  }[tom];
  return (
    <div role={tom === "alerta" ? "alert" : "status"} className={`flex gap-3 rounded-[var(--radius-controle)] px-4 py-3 text-[0.98rem] leading-snug ${cores}`}>
      {icone && <span className="mt-0.5 shrink-0">{icone}</span>}
      <div>{children}</div>
    </div>
  );
}

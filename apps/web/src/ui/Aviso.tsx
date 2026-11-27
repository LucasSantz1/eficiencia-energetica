"use client";

import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

/** O desenho de cada tom, para o aviso ser reconhecido de relance, antes de ler (dono, 27/11: "muito texto"). */
const ICONE_DO_TOM = {
  info: Info,
  alerta: TriangleAlert,
  faisca: CircleAlert,
} as const;

/**
 * Aviso curto, com um desenho na frente. `icone` troca o desenho do tom; `icone={null}` tira o desenho.
 * `anunciar={false}` tira o `role` do próprio aviso, para ele entrar numa região `role="status"` que já está na página
 * (o leitor de tela só anuncia o que entra numa região que já existia; e não pode haver um `status` dentro de outro).
 */
export function Aviso({
  tom = "info",
  children,
  icone,
  anunciar = true,
}: {
  tom?: "info" | "alerta" | "faisca";
  children: ReactNode;
  icone?: ReactNode;
  anunciar?: boolean;
}) {
  const cores = {
    info: "bg-energia-claro text-energia-forte",
    alerta: "bg-alerta-claro text-alerta",
    faisca: "bg-faisca-claro text-tinta",
  }[tom];
  const Desenho = ICONE_DO_TOM[tom];
  const desenho = icone === undefined ? <Desenho className="size-5" aria-hidden /> : icone;
  return (
    <div role={anunciar ? (tom === "alerta" ? "alert" : "status") : undefined} className={`flex gap-3 rounded-[var(--radius-controle)] px-4 py-3 text-[0.98rem] leading-snug ${cores}`}>
      {desenho && <span className="mt-0.5 shrink-0">{desenho}</span>}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

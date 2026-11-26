"use client";

import { useEffect } from "react";
import { contarUso } from "@/aplicacao/uso";

/** Sem nada na tela: conta uma visita por aba, anônima (ADR-009). */
export function ContarVisita() {
  useEffect(() => contarUso("visita"), []);
  return null;
}

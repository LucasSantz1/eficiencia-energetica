"use client";

import { useState } from "react";
import { idadeDosPrecos, type IdadeDosPrecos } from "@ee/core";

/**
 * A data dos preços da ANEEL quando eles têm uma semana ou mais (HIS-303). `agora` é lido uma vez, ao abrir a tela: a
 * idade não precisa andar enquanto a pessoa olha.
 */
export function useIdadeDosPrecos(geradoEm: string | undefined): IdadeDosPrecos | undefined {
  const [agora] = useState(() => new Date());
  return geradoEm === undefined ? undefined : idadeDosPrecos(geradoEm, agora);
}

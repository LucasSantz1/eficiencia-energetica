"use client";

import { useLigarOffline } from "@/aplicacao/offline";

/** Sem nada na tela: liga o modo sem internet e guarda o aviso de instalação, em toda página (HIS-301, HIS-302). */
export function LigarOffline() {
  useLigarOffline();
  return null;
}

"use client";

import type { ReactNode } from "react";

export function Campo({ rotulo, ajuda, children, id }: { rotulo: string; ajuda?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-bold">
        {rotulo}
      </label>
      {children}
      {ajuda && <p className="text-[0.95rem] leading-snug text-tinta-suave">{ajuda}</p>}
    </div>
  );
}

// Sem "use client" e sem import: as telas de erro (que vão em toda rota) usam estas classes sem levar o next/link.
export type Variante = "principal" | "secundario" | "fantasma" | "perigo";

export const estilosBotao: Record<Variante, string> = {
  principal: "bg-energia text-white hover:bg-energia-forte active:bg-energia-forte shadow-[0_2px_0_0_var(--color-energia-forte)]",
  secundario: "bg-papel text-tinta border-2 border-linha hover:border-tinta-suave",
  fantasma: "text-energia hover:bg-energia-claro",
  perigo: "bg-papel text-alerta border-2 border-alerta/30 hover:bg-alerta-claro",
};

export const baseBotao =
  "inline-flex min-h-12 items-center justify-center gap-2 text-center rounded-[var(--radius-controle)] px-5 py-3 text-[1.0625rem] font-bold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45";

/** Classes de um botão (ou link com cara de botão) que não pode usar os componentes de Botao.tsx. */
export function classesDeBotao(variante: Variante, largo = false): string {
  return `${baseBotao} ${estilosBotao[variante]} ${largo ? "w-full" : ""}`;
}

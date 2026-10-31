/*
 * Atalhos para as partes do site que vários testes usam. Seletores por papel e nome, como a pessoa (e o leitor de
 * tela) encontra as coisas.
 */
import type { Locator, Page } from "@playwright/test";

/** Nome de cada aba; no celular a primeira se chama "Acompanhar" (Casca.tsx, `curto`). */
export type Aba = "Acompanhamento" | "Cômodos" | "Dicas" | "Minha casa";

/** A navegação existe duas vezes (topo no computador, embaixo no celular): usa a que está na tela. */
export function aba(pagina: Page, nome: Aba): Locator {
  const texto = nome === "Acompanhamento" ? /^Acompanha(r|mento)$/ : nome;
  return pagina.locator('nav[aria-label="Seções"]').filter({ visible: true }).getByRole("link", { name: texto });
}

export function dialogoAberto(pagina: Page): Locator {
  return pagina.locator("dialog[open]");
}

/** `AAAA-MM-DD` em Brasília, `dias` a partir de hoje (relógio real: o teste não envelhece). */
export function dataEmBrasilia(dias = 0): string {
  const data = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(data);
}

/** `AAAA-MM` de `meses` atrás, contado a partir do mês atual em Brasília. */
export function mesAtras(meses: number): string {
  const [ano, mes] = dataEmBrasilia().split("-").map(Number);
  if (ano === undefined || mes === undefined) throw new Error("data de hoje sem ano ou mês");
  const indice = ano * 12 + (mes - 1) - meses;
  return `${Math.floor(indice / 12)}-${String((indice % 12) + 1).padStart(2, "0")}`;
}

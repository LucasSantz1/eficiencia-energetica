/*
 * Atalhos para as partes do site que vários testes usam. Seletores por papel e nome, como a pessoa (e o leitor de
 * tela) encontra as coisas.
 */
import { expect, type Locator, type Page } from "@playwright/test";

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

/** Largura a partir da qual a `/casa/comodos` troca a sanfona pela lista + painel (HIS-112, L4: `lg`, 64rem). */
export const LARGURA_DO_COMPUTADOR = 1024;

/** A janela está no desenho do computador (lista + painel) nos cômodos? */
export function noDesenhoLargo(pagina: Page): boolean {
  return (pagina.viewportSize()?.width ?? 0) >= LARGURA_DO_COMPUTADOR;
}

/** O botão de um cômodo na lista do computador (o nome dele é o primeiro texto do botão). */
export function botaoDaLista(pagina: Page, nome: string): Locator {
  return pagina
    .getByRole("navigation", { name: "Cômodos" })
    .getByRole("button")
    .filter({ has: pagina.locator("span").getByText(nome, { exact: true }) });
}

/**
 * Abre um cômodo em `/casa/comodos` nas duas larguras (HIS-112, q1) e devolve a região dele: no celular, o cartão da
 * sanfona expandido; no computador, o painel à direita depois de tocar o cômodo na lista. As duas têm o nome do
 * cômodo como nome acessível (`aria-labelledby`).
 */
export async function abrirComodo(pagina: Page, nome: string): Promise<Locator> {
  const regiao = pagina.getByRole("region", { name: nome, exact: true });
  if (noDesenhoLargo(pagina)) {
    await botaoDaLista(pagina, nome).click();
    await expect(botaoDaLista(pagina, nome)).toHaveAttribute("aria-current", "true");
  } else {
    const cabecalho = regiao.locator("button[aria-expanded]").first();
    if ((await cabecalho.getAttribute("aria-expanded")) !== "true") await cabecalho.click();
    await expect(cabecalho).toHaveAttribute("aria-expanded", "true");
  }
  await expect(regiao).toBeVisible();
  return regiao;
}

/** Confere que o cômodo está aberto e na tela, sem tocar em nada (entradas pelo `#comodo-<id>`). */
export async function esperarComodoAberto(pagina: Page, nome: string): Promise<void> {
  const regiao = pagina.getByRole("region", { name: nome, exact: true });
  await expect(regiao).toBeVisible();
  if (noDesenhoLargo(pagina)) await expect(botaoDaLista(pagina, nome)).toHaveAttribute("aria-current", "true");
  else await expect(regiao.locator("button[aria-expanded]").first()).toHaveAttribute("aria-expanded", "true");
  await expect(regiao).toBeInViewport();
}

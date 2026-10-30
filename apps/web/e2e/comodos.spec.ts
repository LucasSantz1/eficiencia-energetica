/*
 * Entradas diretas na tela de cômodos (P-qa-3; cobertura 20, 21 e 23 do plano do qa), em 390 e 1280 px:
 * o link de cada cômodo no acompanhamento (`#comodo-<id>`) abre aquele cômodo expandido e na tela, pelo link e
 * direto pelo endereço; `?visao=geral` abre no "Painel geral".
 */
import type { Page } from "@playwright/test";
import { lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

const casa = lerFixture("casa-v2.json");
// Quarto 2: fora da primeira tela no celular, então a rolagem até ele precisa acontecer de verdade.
const alvo = casa.state.comodos.find((c) => c.nome === "Quarto 2");
if (!alvo) throw new Error("a fixture casa-v2.json precisa ter o cômodo Quarto 2");
const ancora = `comodo-${alvo.id}`;

async function esperarComodoAbertoNaTela(pagina: Page): Promise<void> {
  const secao = pagina.locator(`section[id="${ancora}"]`);
  await expect(secao).toBeVisible();
  await expect(secao.locator("button[aria-expanded]").first()).toHaveAttribute("aria-expanded", "true");
  await expect(secao).toBeInViewport();
}

/** Distância do topo da seção ao topo da janela, em px. */
const topoDaSecao = (pagina: Page) =>
  pagina.locator(`section[id="${ancora}"]`).evaluate((s) => Math.round(s.getBoundingClientRect().top));

test.beforeEach(async ({ context }) => {
  await semearCasa(context, casa);
});

test("pelo link do acompanhamento, o cômodo abre expandido e na tela", async ({ page }) => {
  await page.goto("/casa");
  await expect(page.locator('a[href^="/casa/comodos#comodo-"]')).toHaveCount(casa.state.comodos.length);
  await page.locator(`a[href="/casa/comodos#${ancora}"]`).click();
  await expect(page).toHaveURL((url) => url.pathname === "/casa/comodos" && url.hash === `#${ancora}`);
  await esperarComodoAbertoNaTela(page);
});

test("direto pelo endereço, o cômodo abre expandido e na tela", async ({ page }) => {
  await page.goto(`/casa/comodos#${ancora}`);
  await esperarComodoAbertoNaTela(page);
});

test("?visao=geral abre no \"Painel geral\"", async ({ page }) => {
  await page.goto("/casa/comodos?visao=geral");
  await expect(page.getByRole("radio", { name: "Painel geral" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Por cômodo" })).not.toBeChecked();
});

// Alinhado ao topo = no máximo 200 px abaixo do topo da janela (o cabeçalho tem ~112 px; a rolagem nativa da
// âncora deixa a seção a 112 px nas duas larguras).
const TOPO_ALINHADO_PX = 200;

test.fixme("HIS-108 · P3 — pelo link e direto pelo endereço, o cômodo fica alinhado ao topo", async ({ page }) => {
  // Medido na HIS-002a (A3): pelo link E direto numa página nova, a seção para a 371 px (celular) / 491 px
  // (computador) do topo. Só uma navegação de âncora na mesma página (o navegador rola sozinho) dá 112 px — era
  // essa a "entrada direta" da HIS-001. Quando a HIS-108 corrigir, trocar fixme por test.
  await page.goto(`/casa/comodos#${ancora}`);
  await esperarComodoAbertoNaTela(page);
  await expect.poll(() => topoDaSecao(page), { message: "direto pelo endereço" }).toBeLessThanOrEqual(TOPO_ALINHADO_PX);

  await page.goto("/casa");
  await page.locator(`a[href="/casa/comodos#${ancora}"]`).click();
  await esperarComodoAbertoNaTela(page);
  await expect.poll(() => topoDaSecao(page), { message: "pelo link do acompanhamento" }).toBeLessThanOrEqual(TOPO_ALINHADO_PX);
});

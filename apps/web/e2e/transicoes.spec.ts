/*
 * Transições de tela e movimento reduzido (cobertura 11 e 12 do plano do qa), em 390 e 1280 px.
 * - O topo e a navegação têm `view-transition-name` próprio: ficam parados enquanto o conteúdo troca.
 * - Com `prefers-reduced-motion: reduce`, a troca de aba continua acontecendo (+1 transição por aba), mas as
 *   animações dela duram 0 (lidas no `transition.ready`) e `.surgir` dura no máximo 0,01 ms (globals.css).
 * O controle invertido (sem `reduce` as animações duram mais de 1 ms) é o N7, no sanidade.spec.ts.
 */
import { lerFixture, semearCasa } from "./apoio/casa";
import { aba, type Aba } from "./apoio/telas";
import { expect, test } from "./apoio/teste";
import { contarTransicoes, duracoesDasTransicoes, transicoesAteAgora } from "./apoio/transicoes";

const ABAS: readonly [Aba, RegExp][] = [
  ["Cômodos", /\/casa\/comodos$/],
  ["Dicas", /\/casa\/dicas$/],
  ["Minha casa", /\/casa\/ajustes$/],
  ["Acompanhamento", /\/casa$/],
];

test.beforeEach(async ({ context }) => {
  await semearCasa(context, lerFixture("casa-v2.json"));
  await contarTransicoes(context);
});

test("topo e navegação têm nome de view transition próprio", async ({ page }) => {
  await page.goto("/casa");
  await expect(page.locator("header").first()).toHaveCSS("view-transition-name", "topo");
  // Duas navegações (topo no computador, embaixo no celular); só a de baixo tem nome — igual ao main.
  const nomes = await page
    .locator('nav[aria-label="Seções"]')
    .evaluateAll((navs) => navs.map((nav) => getComputedStyle(nav).viewTransitionName));
  expect(nomes).toEqual(["none", "navegacao"]);
});

test.describe("com movimento reduzido", () => {
  test.use({ reducedMotion: "reduce" });

  test("cada troca de aba dispara 1 transição, sem animação", async ({ page }) => {
    await page.goto("/casa");
    await expect(page.getByText("Sua conta estimada por mês")).toBeVisible();
    const duracaoSurgir = await page.locator(".surgir").first().evaluate((e) => getComputedStyle(e).animationDuration);
    expect(parseFloat(duracaoSurgir) * 1000, `.surgir dura ${duracaoSurgir}`).toBeLessThanOrEqual(0.01);

    const antes = await transicoesAteAgora(page);
    for (const [nome, endereco] of ABAS) {
      await aba(page, nome).click();
      await expect(page).toHaveURL(endereco);
    }
    await expect.poll(() => transicoesAteAgora(page), { message: "uma transição por aba" }).toBe(antes + ABAS.length);
    await expect.poll(async () => (await duracoesDasTransicoes(page)).length).toBe(ABAS.length);
    const duracoes = await duracoesDasTransicoes(page);
    expect(duracoes.flat().length, "cada troca cria as animações (com duração 0)").toBeGreaterThan(0);
    expect(Math.max(...duracoes.flat()), `durações das animações: ${JSON.stringify(duracoes)}`).toBe(0);
  });
});

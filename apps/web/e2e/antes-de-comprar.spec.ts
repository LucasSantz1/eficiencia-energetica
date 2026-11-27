/*
 * "Antes de comprar" (pedido do dono, 27/11): a entrada no painel, a simulação com o editor de aparelho, o resultado
 * (os números têm teste de unidade em packages/core/test/antes-de-comprar.test.ts) e o "Adicionar na minha casa".
 */
import { casaSalva, lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

test("do painel: escolhe a air fryer, vê quanto a conta sobe e, se comprou, põe na casa", async ({ page, context }) => {
  const casa = lerFixture("casa-v2.json");
  await semearCasa(context, casa);
  await page.goto("/casa");
  await page.getByRole("link", { name: /Vai comprar um aparelho\?/ }).click();
  await expect(page).toHaveURL(/\/casa\/antes-de-comprar$/);
  await expect(page.getByRole("heading", { name: "Antes de comprar", level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Escolher o aparelho" }).click();
  const catalogo = page.getByRole("dialog", { name: "Qual aparelho?" });
  await catalogo.getByLabel("Procurar aparelho").fill("air fryer");
  await catalogo.getByRole("button", { name: "Air fryer" }).click();

  const editor = page.getByRole("dialog", { name: "Quanto vai usar?" });
  await expect(editor).toBeVisible();
  await editor.getByRole("button", { name: "Ver quanto a conta sobe" }).click();
  await expect(editor).toBeHidden();

  const resultado = page.getByRole("region", { name: "Air fryer" });
  await expect(resultado.getByRole("heading", { name: "Air fryer" })).toBeFocused();
  await expect(resultado.getByText(/^\+R\$\s[\d.,]+$/)).toBeVisible();
  await expect(resultado.getByText(/por mês, ou R\$\s[\d.,]+ em um ano\./)).toBeVisible();
  // Simular não guarda nada.
  const antes = (await casaSalva(page))?.state.aparelhos.length ?? 0;
  expect(antes).toBe(casa.state.aparelhos.length);

  await resultado.getByRole("button", { name: "Adicionar na minha casa" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Pronto: o aparelho está na sua casa." })).toBeVisible();
  await expect.poll(async () => (await casaSalva(page))?.state.aparelhos.length).toBe(antes + 1);
  expect((await casaSalva(page))?.state.aparelhos.at(-1)?.nome).toBe("Air fryer");
});

test("sem casa cadastrada: a tela pede o cadastro antes (como as outras de Minha casa)", async ({ page }) => {
  await page.goto("/casa/antes-de-comprar");
  await expect(page.getByRole("heading", { name: "Vamos cadastrar a sua casa" })).toBeVisible();
});

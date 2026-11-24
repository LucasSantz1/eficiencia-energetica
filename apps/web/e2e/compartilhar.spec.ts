/*
 * HIS-105: levar o resumo da conta para fora do site sem passar por servidor. O texto vai para o Web Share (quando
 * existe) ou para a área de transferência; a impressão é só CSS. A fixture de pedidos fora da origem (apoio/teste)
 * já reprova qualquer envio a outro endereço.
 */
import { lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

test.beforeEach(async ({ context }) => {
  await semearCasa(context, lerFixture("casa-v2.json"));
});

test("com Web Share, o resumo vai como texto puro, sem cidade e sem dado da casa além dos números", async ({ page }) => {
  await page.addInitScript(() => {
    if (!location.href.startsWith("http")) return;
    const janela = window as unknown as { textoCompartilhado?: string };
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (dados: { text?: string }) => {
        janela.textoCompartilhado = dados.text ?? "";
      },
    });
  });
  await page.goto("/casa");
  await page.getByRole("button", { name: "Compartilhar resumo" }).click();
  const texto = await page.waitForFunction(() => (window as unknown as { textoCompartilhado?: string }).textoCompartilhado).then((h) => h.jsonValue());
  expect(texto).toContain("R$");
  expect(texto).not.toMatch(/Presidente Prudente|CPF|@/);
});

test("sem Web Share, o botão copia o resumo e avisa", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    if (!location.href.startsWith("http")) return;
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
  });
  await page.goto("/casa");
  await page.getByRole("button", { name: "Copiar resumo" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Resumo copiado" })).toBeVisible();
  const copiado = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiado).toContain("R$");
});

test("na impressão somem navegação e botões, e o texto fica preto", async ({ page }) => {
  await page.goto("/casa");
  await expect(page.getByText("Sua conta estimada por mês")).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("button", { name: "Imprimir" })).toBeHidden();
  await expect(page.locator("nav").first()).toBeHidden();
  const cor = await page.getByText("Sua conta estimada por mês").evaluate((el) => getComputedStyle(el).color);
  expect(cor).toBe("rgb(0, 0, 0)");
  await page.screenshot({ path: test.info().outputPath("impressao.png"), fullPage: true });
});

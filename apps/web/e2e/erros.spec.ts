/*
 * Telas de erro (HIS-003a, critério 4, T3 e T4; R8; D8 e D10 1a), em 390 e 1280 px.
 *
 * T3: o site só tem o `app/global-error.tsx` (o `app/error.tsx` saiu no D10 para poupar 1,3 kB por rota). Este teste
 * é a condição do D10: provar que o `global-error` pega o erro de uma tela, mostra o T3 sem detalhe técnico, põe o
 * foco no `h1`, troca a frase na 2ª falha e volta à tela com "Tentar de novo". Para quebrar uma tela sem mexer no
 * site, o `Intl.NumberFormat.prototype.format` (um getter) lança enquanto a chave `e2e:quebrar-formato` do
 * sessionStorage for "1": toda tela que mostra R$ ou kWh quebra no render, como um bug de verdade.
 */
import type { Page } from "@playwright/test";
import { lerFixture, semearCasa } from "./apoio/casa";
import { MENSAGEM_DO_ERRO, quebrar, quebrarFormatoDeNumero } from "./apoio/erros";
import { expect, test } from "./apoio/teste";

const tituloT3 = (pagina: Page) => pagina.getByRole("heading", { level: 1, name: "Algo deu errado nesta tela." });

async function conferirT3(pagina: Page): Promise<void> {
  await expect(tituloT3(pagina)).toBeVisible();
  await expect(tituloT3(pagina)).toBeFocused();
  await expect(pagina).toHaveTitle("Algo deu errado");
  await expect(pagina.getByText("Não foi culpa sua. O que você cadastrou continua salvo.")).toBeVisible();
  await expect(pagina.getByRole("button", { name: "Tentar de novo" })).toBeVisible();
  await expect(pagina.getByRole("link", { name: "Voltar ao início" })).toHaveAttribute("href", "/");
  // Nada técnico na tela (A8): nem a mensagem do erro, nem "Error", nem digest.
  const texto = await pagina.locator("body").innerText();
  expect(texto).not.toContain(MENSAGEM_DO_ERRO);
  expect(texto).not.toMatch(/Error|digest|stack|\.tsx?|\.js\b/i);
}

test.describe("T3 · erro numa tela (global-error)", () => {
  test.beforeEach(async ({ context, errosEsperados }) => {
    await semearCasa(context, lerFixture("casa-v2.json"));
    await quebrarFormatoDeNumero(context);
    // O React registra no console o erro que o limite de erro pegou: é o erro que o teste provocou.
    errosEsperados.push(new RegExp(MENSAGEM_DO_ERRO));
  });

  test("abre o T3 com foco no título; 2ª falha muda a frase; Tentar de novo volta à tela", async ({ page }, info) => {
    await page.goto("/casa");
    await conferirT3(page);
    const frase = page.locator("p[aria-live='polite']");
    await expect(frase).toHaveText('Toque em "Tentar de novo". Se não funcionar, volte ao início.');
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Tentar de novo" }), "o Tab depois do título cai em Tentar de novo").toBeFocused();
    await info.attach("t3", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });

    // 2ª falha: o retry() roda, a tela quebra de novo, a última frase muda.
    await page.getByRole("button", { name: "Tentar de novo" }).click();
    await expect(frase).toHaveText("Ainda não deu certo. Tente mais tarde ou volte ao início.");
    await expect(tituloT3(page)).toBeFocused();
    await info.attach("t3-segunda-falha", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });

    // O problema passou: "Tentar de novo" traz a tela de volta, sem recarregar a página.
    await quebrar(page, false);
    await page.getByRole("button", { name: "Tentar de novo" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sua conta estimada por mês");
    await expect(tituloT3(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/casa$/);
  });

  test("com zoom de 200% (195 px de largura), o texto dos dois botões fica centralizado (D-3a-3)", async ({ page }) => {
    await page.setViewportSize({ width: 195, height: 422 });
    await page.goto("/casa");
    await conferirT3(page);
    for (const botao of [page.getByRole("button", { name: "Tentar de novo" }), page.getByRole("link", { name: "Voltar ao início" })]) {
      await expect(botao).toHaveCSS("text-align", "center");
    }
  });

  test("Voltar ao início leva à / (página carregada do zero)", async ({ page }) => {
    await page.goto("/casa");
    await conferirT3(page);
    await quebrar(page, false);
    await page.getByRole("link", { name: "Voltar ao início" }).click();
    await expect(page).toHaveURL((url) => url.pathname === "/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("A conta de luz, cômodo por cômodo.");
  });
});

test("T4 · endereço que não existe: 404 e a tela do projeto", async ({ page, errosEsperados }) => {
  // O Chrome registra o 404 do documento no console.
  errosEsperados.push(/status of 404/);
  const resposta = await page.goto("/nao-existe");
  expect(resposta?.status()).toBe(404);
  await expect(page).toHaveTitle(/^Página não encontrada( · Eficiência Energética)?$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Não achamos esta página.");
  await expect(page.getByText("O endereço pode estar errado ou a página mudou de lugar.")).toBeVisible();
  await page.getByRole("link", { name: "Voltar ao início" }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/");
});

/*
 * "Ouvir" (HIS-101): o celular lê a tela em voz alta pela Web Speech API. O navegador do teste não tem voz, então uma
 * síntese de mentira (antes da página) guarda o que seria falado: conferimos as frases, o "Parar" e o fim da fala.
 */
import type { Page } from "@playwright/test";
import { lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

declare global {
  interface Window {
    falasDoTeste: string[];
    paradasDoTeste: number;
    terminarFalaDoTeste: () => void;
  }
}

async function sinteseDeMentira(page: Page) {
  await page.addInitScript(() => {
    window.falasDoTeste = [];
    window.paradasDoTeste = 0;
    let fila: { text: string; onend: (() => void) | null }[] = [];
    class FalaDeMentira {
      text: string;
      lang = "";
      rate = 1;
      voice: { name: string } | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(texto: string) {
        this.text = texto;
      }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { value: FalaDeMentira, configurable: true });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [
          { lang: "pt-BR", name: "Voz da internet", localService: false },
          { lang: "pt-BR", name: "Voz do aparelho", localService: true },
        ],
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        speak: (fala: FalaDeMentira) => {
          // Só a voz do aparelho: a "da internet" mandaria o texto para fora.
          if (fala.voice?.name !== "Voz do aparelho") throw new Error("usou voz que não é do aparelho");
          window.falasDoTeste.push(fala.text);
          fila.push(fala);
        },
        cancel: () => {
          if (fila.length > 0) window.paradasDoTeste += 1;
          fila = [];
        },
        resume: () => undefined,
      },
    });
    window.terminarFalaDoTeste = () => {
      const ultima = fila.at(-1);
      fila = [];
      ultima?.onend?.();
    };
  });
}

test.beforeEach(async ({ context, page }) => {
  await semearCasa(context, lerFixture("casa-v2.json"));
  await sinteseDeMentira(page);
});

test("acompanhamento: 'Ouvir' lê a conta em reais por extenso, sem 'R$' nem 'kWh', e vira 'Parar de ouvir'", async ({ page }) => {
  await page.goto("/casa");
  const ouvir = page.getByRole("button", { name: "Ouvir o resumo da conta" });
  await ouvir.click();
  await expect(page.getByRole("button", { name: "Parar de ouvir" })).toBeVisible();

  const falas = await page.evaluate(() => window.falasDoTeste);
  expect(falas[0]).toMatch(/^A sua conta de luz estimada é de \d+ reais( e \d+ centavos?)? por mês, para [\d,]+ quilowatts?-hora\.$/);
  expect(falas[1]).toContain("É uma estimativa");
  expect(falas.join(" ")).not.toMatch(/R\$|kWh/);

  // Tocar de novo para; e a fala que acaba sozinha também volta o botão para "Ouvir".
  await page.getByRole("button", { name: "Parar de ouvir" }).click();
  await expect(ouvir).toBeVisible();
  await ouvir.click();
  await page.evaluate(() => window.terminarFalaDoTeste());
  await expect(ouvir).toBeVisible();
});

test("dicas: 'Ouvir as dicas' lê as dicas da tela, numeradas", async ({ page }) => {
  await page.goto("/casa/dicas");
  await page.getByRole("button", { name: "Ouvir as dicas" }).click();
  const falas = await page.evaluate(() => window.falasDoTeste);
  expect(falas[0]).toMatch(/^\d+ dicas? para a sua casa\.$|^Uma dica para a sua casa\.$/);
  expect(falas[1]).toMatch(/^Dica 1: /);
  expect(falas.join(" ")).not.toMatch(/R\$|kWh/);
});

test("sair da tela para a voz", async ({ page }) => {
  await page.goto("/casa");
  await page.getByRole("button", { name: "Ouvir o resumo da conta" }).click();
  await page.getByRole("link", { name: "Dicas", exact: true }).first().click();
  await expect(page).toHaveURL(/\/casa\/dicas/);
  // A navegação é do lado do navegador (a página não recarrega): a fala em andamento foi cancelada.
  expect(await page.evaluate(() => window.paradasDoTeste)).toBe(1);
  await expect(page.getByRole("button", { name: "Ouvir as dicas" })).toBeVisible();
});

test("só voz da internet em português: o botão não aparece (o texto sairia do aparelho)", async ({ page }) => {
  await page.addInitScript(() => {
    const sintese = Reflect.get(window, "speechSynthesis");
    Reflect.set(sintese, "getVoices", () => [{ lang: "pt-BR", name: "Voz da internet", localService: false }]);
  });
  await page.goto("/casa");
  await expect(page.getByRole("heading", { name: "Sua conta estimada por mês" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ouvir o resumo da conta" })).toHaveCount(0);
});

test("navegador sem voz: o botão nem aparece", async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, "speechSynthesis");
  });
  await page.goto("/casa");
  await expect(page.getByRole("heading", { name: "Sua conta estimada por mês" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ouvir o resumo da conta" })).toHaveCount(0);
});

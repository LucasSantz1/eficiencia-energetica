/*
 * Sem internet (HIS-301, HIS-302, HIS-303). Só aqui o service worker fica ligado (o playwright.config o bloqueia nos
 * outros testes, para não responder por fora do page.route). Casa da fixture, preço da ANEEL.
 */
import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

test.use({ serviceWorkers: "allow" });

/** Espera o service worker terminar de guardar o site (instalação) e passar a responder por esta página. */
async function esperarServicoOffline(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

test("sem internet: as telas da casa abrem, até as que a pessoa não tinha aberto, e o aviso aparece", async ({ page, context, errosEsperados }) => {
  // Sem rede, o navegador reclama no console de cada pedido que não sai (prefetch das outras abas), e a página que não
  // estava guardada volta com 503 (o aviso do service worker).
  errosEsperados.push(/ERR_INTERNET_DISCONNECTED|Failed to fetch/, /status of 503/);
  await semearCasa(context, { ...lerFixture("casa-v2.json"), version: 3 });
  await page.goto("/casa");
  await esperarServicoOffline(page);

  await context.setOffline(true);
  await page.goto("/casa/dicas");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Você está sem internet.", { exact: true })).toBeVisible();

  // A mesma página com outro endereço (a tela lê o ?visao no navegador).
  await page.goto("/casa/comodos?visao=geral");
  await expect(page.getByRole("heading", { name: "Cômodos e aparelhos" })).toBeVisible();

  // Página que o site não tem guardada: o aviso curto do service worker, não a tela de erro do navegador.
  await page.goto("/pagina-que-nao-existe");
  await expect(page.getByRole("heading", { name: "Você está sem internet." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Abrir minha casa" })).toBeVisible();
});

test("'Apagar todos os meus dados' apaga também as cópias de /dados (dizem o estado da cidade)", async ({ page, context }) => {
  await semearCasa(context, { ...lerFixture("casa-v2.json"), version: 3 });
  await page.goto("/casa/ajustes");
  await esperarServicoOffline(page);
  await expect.poll(() => page.evaluate(async () => (await caches.keys()).some((n) => n.startsWith("dados-")))).toBe(true);

  await page.getByRole("button", { name: "Apagar todos os meus dados" }).click();
  await page.getByRole("button", { name: "Sim, apagar" }).click();
  await page.waitForURL("/");
  await expect.poll(() => page.evaluate(async () => (await caches.keys()).some((n) => n.startsWith("dados-")))).toBe(false);
});

test("Minha casa explica como usar sem internet e como pôr na tela inicial", async ({ page, context }) => {
  await semearCasa(context, { ...lerFixture("casa-v2.json"), version: 3 });
  await page.goto("/casa/ajustes");
  const secao = page.getByRole("region", { name: "Usar sem internet" });
  await expect(secao.getByText(/No Android \(Chrome\):/)).toBeVisible();
  await expect(secao.getByText(/No iPhone \(Safari\):/)).toBeVisible();
});

test("preços da ANEEL com uma semana ou mais: o painel mostra a data", async ({ page, context }) => {
  // O relógio da página vai para 10 dias depois da data dos preços publicados (qualquer que seja ela).
  const tarifas: unknown = JSON.parse(readFileSync("public/dados/tarifas.json", "utf8"));
  const geradoEm = typeof tarifas === "object" && tarifas !== null && "geradoEm" in tarifas ? String(tarifas.geradoEm) : "";
  await page.clock.setFixedTime(new Date(Date.parse(geradoEm) + 10 * 86_400_000));
  await semearCasa(context, { ...lerFixture("casa-v2.json"), version: 3 });
  await page.goto("/casa");
  await expect(page.getByText(/^Os preços da luz são de \d{2}\/\d{2}\/\d{4}, há 10 dias\./)).toBeVisible();
});

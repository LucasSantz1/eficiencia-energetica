/*
 * Arquivos de /dados quebrados ou sem internet (HIS-003a, critério 3; T2; R6; D8), em 390 e 1280 px. O `page.route`
 * troca a resposta do arquivo (500, HTML, estrutura errada, tarifa -1) sem mexer no site; o `unroute` devolve o
 * arquivo de verdade para o "Tentar de novo".
 */
import type { Page, Route } from "@playwright/test";
import { lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

const TARIFAS = "**/dados/tarifas.json";
const T2A = "Não conseguimos carregar os preços da luz.";
const FRASE_2A_FALHA = "Se não der certo, tente mais tarde.";
const STATUS_500 = /status of 500/;

const alerta = (pagina: Page) => pagina.getByRole("alert").filter({ hasText: /./ });
const titulo = (pagina: Page) => pagina.getByRole("heading", { level: 1 });
const tentarDeNovo = (pagina: Page) => alerta(pagina).getByRole("button", { name: /^(Tentar de novo|Carregando…)$/ });

const RESPOSTAS_RUINS: { nome: string; responder: (rota: Route) => Promise<void>; esperado?: RegExp }[] = [
  { nome: "500", responder: (rota) => rota.fulfill({ status: 500, body: "erro" }), esperado: STATUS_500 },
  { nome: "HTML no lugar do JSON", responder: (rota) => rota.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><p>manutenção</p>" }) },
  { nome: "{} (estrutura errada)", responder: (rota) => rota.fulfill({ status: 200, json: {} }) },
];

for (const { nome, responder, esperado } of RESPOSTAS_RUINS) {
  test(`tarifas.json com ${nome}: T2a no cadastro; Tentar de novo depois de consertar tira o aviso e foca o título`, async ({ page, errosEsperados }) => {
    if (esperado) errosEsperados.push(esperado);
    await page.route(TARIFAS, responder);
    await page.goto("/comecar");
    await expect(alerta(page)).toContainText(T2A);
    await expect(alerta(page)).toContainText("Pode ser a internet ou um problema do nosso lado. Suas respostas não se perdem.");
    await expect(alerta(page)).not.toContainText(FRASE_2A_FALHA);

    await page.unroute(TARIFAS);
    await tentarDeNovo(page).click();
    await expect(alerta(page)).toHaveCount(0);
    await expect(titulo(page)).toHaveText("Em qual estado você mora?");
    await expect(titulo(page), "o botão sumiu: o foco vai para o título").toBeFocused();
  });
}

test("tarifas.json com 500 no painel: T2a com \"Sua casa continua salva.\"; 2ª falha: frase nova, foco no botão, Carregando…", async ({ page, context, errosEsperados }, info) => {
  errosEsperados.push(STATUS_500);
  await semearCasa(context, lerFixture("casa-v2.json"));
  let liberar: () => void = () => undefined;
  let segurar = false;
  await page.route(TARIFAS, async (rota) => {
    if (segurar) await new Promise<void>((r) => (liberar = r));
    await rota.fulfill({ status: 500, body: "erro" });
  });
  await page.goto("/casa");
  await expect(alerta(page)).toContainText(T2A);
  await expect(alerta(page)).toContainText("Pode ser a internet ou um problema do nosso lado. Sua casa continua salva.");
  await info.attach("t2a-painel", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });

  segurar = true;
  await tentarDeNovo(page).click();
  await expect(tentarDeNovo(page)).toHaveText("Carregando…");
  await expect(tentarDeNovo(page)).toHaveAttribute("aria-disabled", "true");
  await expect(tentarDeNovo(page), "aria-disabled, não disabled: o foco fica").toBeFocused();
  liberar();
  await expect(alerta(page)).toContainText(FRASE_2A_FALHA);
  await expect(tentarDeNovo(page)).toHaveText("Tentar de novo");
  await expect(tentarDeNovo(page), "deu errado de novo: o foco fica no botão").toBeFocused();

  segurar = false;
  await page.unroute(TARIFAS);
  await tentarDeNovo(page).click();
  await expect(alerta(page)).toHaveCount(0);
  await expect(titulo(page)).toHaveText("Sua conta estimada por mês");
});

test("sem internet: T2c; com a internet de volta, Tentar de novo funciona", async ({ page, context, errosEsperados }) => {
  errosEsperados.push(/ERR_INTERNET_DISCONNECTED/);
  await semearCasa(context, lerFixture("casa-v2.json"));
  await page.route(TARIFAS, async (rota) => {
    await context.setOffline(true);
    await rota.abort("internetdisconnected");
  });
  await page.goto("/casa");
  await expect(alerta(page)).toContainText("Você está sem internet.");
  await expect(alerta(page)).toContainText('Ligue os dados móveis ou o Wi-Fi e toque em "Tentar de novo". Sua casa continua salva.');

  await page.unroute(TARIFAS);
  await context.setOffline(false);
  await tentarDeNovo(page).click();
  await expect(alerta(page)).toHaveCount(0);
  await expect(titulo(page)).toHaveText("Sua conta estimada por mês");
});

test("municipios/SP.json com 500: T2b com o nome do estado por extenso", async ({ page, errosEsperados }) => {
  errosEsperados.push(STATUS_500);
  await page.route("**/dados/municipios/SP.json", (rota) => rota.fulfill({ status: 500, body: "erro" }));
  await page.goto("/comecar");
  await page.locator("select#estado").selectOption("SP");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(alerta(page)).toContainText("Não conseguimos carregar as cidades de São Paulo.");
  await expect(alerta(page)).toContainText("Suas respostas não se perdem.");

  await page.unroute("**/dados/municipios/SP.json");
  await tentarDeNovo(page).click();
  await expect(alerta(page)).toHaveCount(0);
  await page.locator("#busca-cidade").fill("Presidente Prudente");
  await expect(page.getByRole("radio", { name: "Presidente Prudente", exact: true })).toBeVisible();
});

/** Troca a `tarifaKwh` de uma distribuidora no arquivo de verdade. */
async function tarifaTrocada(page: Page, distribuidoraId: string, tarifaKwh: unknown): Promise<void> {
  await page.route(TARIFAS, async (rota) => {
    const resposta = await rota.fetch();
    const arquivo: unknown = await resposta.json();
    if (typeof arquivo !== "object" || arquivo === null || !("distribuidoras" in arquivo) || !Array.isArray(arquivo.distribuidoras)) {
      throw new Error("tarifas.json de verdade sem a lista de distribuidoras");
    }
    const lista: unknown[] = arquivo.distribuidoras;
    const ehDaCasa = (d: unknown) => typeof d === "object" && d !== null && "id" in d && d.id === distribuidoraId;
    expect(lista.some(ehDaCasa), `${distribuidoraId} existe no arquivo`).toBe(true);
    const distribuidoras = lista.map((d) => (ehDaCasa(d) && typeof d === "object" ? { ...d, tarifaKwh } : d));
    await rota.fulfill({ response: resposta, json: { ...arquivo, distribuidoras } });
  });
}

for (const tarifa of [-1, "0,87"]) {
  test(`tarifa ${JSON.stringify(tarifa)} numa distribuidora: só ela sai, as outras ficam e não há aviso de falha`, async ({ page, context }) => {
    await semearCasa(context, lerFixture("casa-v2.json"));
    await tarifaTrocada(page, "ambar-amazonas", tarifa);
    await page.goto("/casa/ajustes");
    await expect(titulo(page)).toHaveText("Minha casa");
    await expect(page.getByText(/^Distribuidora: .+, tarifa de R\$\s[\d,]+ por kWh sem impostos$/)).toBeVisible();
    await expect(alerta(page)).toHaveCount(0);
  });
}

test("tarifa -1 na distribuidora da casa: o número não aparece nem corrigido (fica sem preço, sem aviso de falha)", async ({ page, context }, info) => {
  await semearCasa(context, lerFixture("casa-v2.json"));
  await tarifaTrocada(page, "ess", -1);
  await page.goto("/casa/ajustes");
  await expect(titulo(page)).toHaveText("Minha casa");
  await expect(page.getByText("Presidente Prudente – SP")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/por kWh sem impostos/)).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("-1");
  await expect(alerta(page)).toHaveCount(0);
  await page.goto("/casa");
  await page.waitForLoadState("networkidle");
  await info.attach("tarifa-negativa-painel", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  await expect(page.locator("main")).not.toContainText(/-\s?R\$|R\$\s?-/);
});

/*
 * Guia da Tarifa Social (HIS-103b): o caminho principal, os 4 resultados (A–D), o atalho do BPC, os erros dos campos,
 * o "Confere?" da renda, o salário mínimo vencido (critério 4), a privacidade (nada guardado nem na URL; critério 3) e o
 * axe. A 390 px no projeto "celular" e a 1440 px no "computador". A data é fixa (relógio do navegador), porque o
 * salário mínimo e o prazo da convocação têm vigência.
 */
import type { Page, TestInfo } from "@playwright/test";
import { analisarAcessibilidade, descreverViolacoes, violacoesQueReprovam } from "./apoio/axe";
import { expect, test } from "./apoio/teste";

const EM_2026 = new Date("2026-11-17T12:00:00-03:00");
const EM_2027 = new Date("2027-01-02T12:00:00-03:00");

async function abrir(page: Page, info: TestInfo, quando = EM_2026) {
  if (info.project.name === "computador") await page.setViewportSize({ width: 1440, height: 900 });
  await page.clock.setFixedTime(quando);
  await page.goto("/tarifa-social");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tarifa Social: será que a sua família pode ter?");
}

const titulo = (page: Page) => page.locator("main h2[tabindex='-1']");

async function escolher(page: Page, pergunta: string, opcao: string) {
  await expect(titulo(page)).toHaveText(pergunta);
  await page.getByRole("radiogroup", { name: pergunta }).getByRole("radio", { name: opcao, exact: true }).click();
}

async function digitar(page: Page, pergunta: string, texto: string) {
  await expect(titulo(page)).toHaveText(pergunta);
  await page.getByRole("textbox", { name: pergunta }).fill(texto);
  await page.getByRole("button", { name: "Continuar" }).click();
}

/** Responde às 6 perguntas (sem BPC). */
async function responder(page: Page, pessoas: string, renda: string, saude: "Sim" | "Não", extra: { cadUnico?: string; conta?: string } = {}) {
  await escolher(page, "Alguém da sua casa recebe o BPC?", "Não");
  await escolher(page, "Sua família está no CadÚnico?", extra.cadUnico ?? "Sim, está");
  await digitar(page, "Quantas pessoas moram na sua casa?", pessoas);
  await digitar(page, "Somando o que todos ganham por mês, quanto dá?", renda);
  await escolher(page, "Alguém da casa precisa de aparelho elétrico ligado para cuidar da saúde?", saude);
  await escolher(page, "A conta de luz está no nome de alguém que mora na casa?", extra.conta ?? "Sim");
}

async function fotografar(page: Page, info: TestInfo, nome: string) {
  const caminho = info.outputPath(`${nome}.png`);
  await page.screenshot({ path: caminho, fullPage: true, animations: "disabled" });
  await info.attach(nome, { path: caminho, contentType: "image/png" });
}

async function semViolacaoGrave(page: Page) {
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running"));
  const graves = violacoesQueReprovam((await analisarAcessibilidade(page)).violations);
  expect(descreverViolacoes(graves)).toEqual([]);
}

test.use({ reducedMotion: "reduce" });

test("caminho principal: 6 perguntas, foco no título, resultado A com a conta em R$ e nada guardado", async ({ page }, info) => {
  await abrir(page, info);
  await fotografar(page, info, "inicio");
  await semViolacaoGrave(page);

  await escolher(page, "Alguém da sua casa recebe o BPC?", "Não");
  await expect(titulo(page)).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: /^Pergunta/ })).toHaveText("Pergunta 2 de 6");
  await escolher(page, "Sua família está no CadÚnico?", "Sim, está");

  // Pessoas: "Continuar" nunca fica desligado; vazio mostra o erro e leva o foco ao campo.
  const campoPessoas = page.getByRole("textbox", { name: "Quantas pessoas moram na sua casa?" });
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(campoPessoas).toBeFocused();
  await expect(campoPessoas).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#campo-pessoas-erro")).toHaveText("Digite um número de 1 a 20.");
  await fotografar(page, info, "pessoas-erro");
  await semViolacaoGrave(page);
  await campoPessoas.fill("4");
  await expect(page.locator("#campo-pessoas-erro")).toHaveCount(0);
  await page.getByRole("button", { name: "Continuar" }).click();

  // Voltar mantém a resposta.
  await page.getByRole("button", { name: "Voltar" }).click();
  await expect(campoPessoas).toHaveValue("4");
  await page.getByRole("button", { name: "Continuar" }).click();

  await digitar(page, "Somando o que todos ganham por mês, quanto dá?", "3.000,00");
  await escolher(page, "Alguém da casa precisa de aparelho elétrico ligado para cuidar da saúde?", "Não");
  await escolher(page, "A conta de luz está no nome de alguém que mora na casa?", "Sim");

  await expect(titulo(page)).toHaveText("Sua família pode ter direito à Tarifa Social");
  await expect(titulo(page)).toBeFocused();
  await expect(page.getByText("Numa conta de R$ 0,80 por kWh, são cerca de R$ 64,00 por mês (estimativa).", { exact: false })).toBeVisible();
  await expect(page.getByText("Renda por pessoa: R$ 750,00. O limite é R$ 810,50 (meio salário mínimo).")).toBeVisible();
  await expect(page.getByText("Até 31/12/2026, atenda se a distribuidora chamar")).toBeVisible();
  await expect(page.getByText("Primeiro, faça o CadÚnico")).toHaveCount(0);
  await fotografar(page, info, "resultado-a");
  await semViolacaoGrave(page);

  // Links oficiais abrem em outra página e não levam dados.
  for (const link of await page.locator("a[target=_blank]").all()) await expect(link).toHaveAttribute("rel", "noopener noreferrer");

  // Privacidade: nada no armazenamento nem na URL.
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  expect(page.url()).toMatch(/\/tarifa-social$/);

  await page.getByRole("button", { name: "Responder de novo" }).click();
  await expect(titulo(page)).toHaveText("Alguém da sua casa recebe o BPC?");
  await expect(page.getByRole("radio", { name: "Não", exact: true })).toHaveAttribute("aria-checked", "false");
});

test("BPC = sim pula para a conta (Pergunta 2 de 2) e dá A, com os avisos de nome da conta", async ({ page }, info) => {
  await abrir(page, info);
  await escolher(page, "Alguém da sua casa recebe o BPC?", "Sim, recebe");
  await expect(page.getByRole("status").filter({ hasText: /^Pergunta/ })).toHaveText("Pergunta 2 de 2");
  await escolher(page, "A conta de luz está no nome de alguém que mora na casa?", "Não sei");
  await expect(titulo(page)).toHaveText("Sua família pode ter direito à Tarifa Social");
  await expect(page.getByText("Primeiro, faça o CadÚnico no CRAS.")).toBeVisible();
  await expect(page.getByText("O desconto só vem se a conta estiver no nome de alguém da família.")).toBeVisible();
  await expect(page.getByText(/^Renda por pessoa/)).toHaveCount(0);
  await fotografar(page, info, "resultado-a-bpc");
});

test("B: 4 pessoas e R$ 3.242,04 (C3) — Desconto Social", async ({ page }, info) => {
  await abrir(page, info);
  await responder(page, "4", "3242,04", "Não");
  await expect(titulo(page)).toHaveText("Sua família pode ter direito ao Desconto Social");
  await expect(page.getByText("Renda por pessoa: R$ 810,51. O limite é R$ 1.621,00 (um salário mínimo).")).toBeVisible();
  await fotografar(page, info, "resultado-b");
});

test("C: 2 pessoas, R$ 4.000,00 e aparelho de saúde (C7)", async ({ page }, info) => {
  await abrir(page, info);
  await responder(page, "2", "4000", "Sim", { cadUnico: "Não", conta: "Não" });
  await expect(titulo(page)).toHaveText("Sua família pode ter direito à Tarifa Social, por causa do aparelho de saúde");
  await expect(page.getByText("Renda da família: R$ 4.000,00. O limite é R$ 4.863,00 (3 salários mínimos).")).toBeVisible();
  await expect(page.getByText("Primeiro, faça o CadÚnico no CRAS.")).toBeVisible();
  await fotografar(page, info, "resultado-c");
  await semViolacaoGrave(page);
});

test("D: 3 pessoas e R$ 4.863,03 (C5) — não parece, sem avisos de convocação", async ({ page }, info) => {
  await abrir(page, info);
  await responder(page, "3", "4863,03", "Não", { cadUnico: "Não" });
  await expect(titulo(page)).toHaveText("Pelo que você respondeu, não parece");
  await expect(page.getByText("Não parece", { exact: true })).toBeVisible();
  await expect(page.getByText("Primeiro, faça o CadÚnico")).toHaveCount(0);
  await expect(page.getByText(/^Até 31\/12\/2026/)).toHaveCount(0);
  await fotografar(page, info, "resultado-d");
});

test("renda: erro sem número, \"Confere?\" acima de R$ 30.000 e Sim deixa seguir", async ({ page }, info) => {
  await abrir(page, info);
  await escolher(page, "Alguém da sua casa recebe o BPC?", "Não");
  await escolher(page, "Sua família está no CadÚnico?", "Sim, está");
  await digitar(page, "Quantas pessoas moram na sua casa?", "3");
  const renda = page.getByRole("textbox", { name: "Somando o que todos ganham por mês, quanto dá?" });
  await renda.fill("-5");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.locator("#campo-renda-erro")).toHaveText("Digite quanto a família ganha por mês. Se for nada, digite 0.");
  await renda.fill("45000");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.locator("#campo-renda-alerta")).toHaveText("Confere? A família ganha R$ 45.000,00 por mês?");
  await expect(renda).toBeFocused();
  await expect(renda).not.toHaveAttribute("aria-invalid");
  await fotografar(page, info, "renda-confere");
  await semViolacaoGrave(page);
  await page.getByRole("button", { name: "Sim, está certo" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(titulo(page)).toHaveText("Alguém da casa precisa de aparelho elétrico ligado para cuidar da saúde?");
});

test("salário mínimo vencido (2027): o resultado não mostra R$ do salário mínimo e avisa que o valor mudou", async ({ page }, info) => {
  await abrir(page, info, EM_2027);
  await responder(page, "4", "3000", "Não");
  await expect(titulo(page)).toHaveText("Sua família pode ter direito à Tarifa Social");
  await expect(page.getByText("O valor do salário mínimo mudou. Confira o valor de hoje no CRAS.")).toBeVisible();
  await expect(page.getByText(/R\$ 810,50|R\$ 750,00/)).toHaveCount(0);
  await expect(page.getByText(/^Até 31\/12\/2026/)).toHaveCount(0);
});

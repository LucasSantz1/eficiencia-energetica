/*
 * "Por que a conta veio alta?" (pedido do dono, 27/11): a entrada no "Mês a mês", os motivos calculados pelo core
 * (os números de cada motivo têm teste de unidade em packages/core/test/conta-alta.test.ts), o campo dos dias e a tela
 * sem contas.
 */
import { lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

function casaComContas(contas: { id: string; competencia: string; kwh: number; valor: number }[]) {
  const casa = lerFixture("casa-v2.json");
  casa.state.contas = contas;
  return casa;
}

const SUBIU = [
  { id: "set", competencia: "2026-09", kwh: 180, valor: 160 },
  { id: "out", competencia: "2026-10", kwh: 190, valor: 170 },
  { id: "nov", competencia: "2026-11", kwh: 260, valor: 245 },
];

test("conta bem acima da anterior: o 'Mês a mês' chama para o guia, que abre nesta conta", async ({ page, context }) => {
  await semearCasa(context, casaComContas(SUBIU));
  await page.goto("/casa");
  await page.getByRole("link", { name: /A conta de novembro de 2026 veio mais alta/ }).click();
  await expect(page).toHaveURL(/\/casa\/conta-alta\?conta=nov$/);
  await expect(page.getByRole("heading", { name: "Por que a conta veio alta?", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Mês da conta")).toHaveValue("nov");
  await expect(page.getByText("Esta conta veio R$ 75,00 a mais que a de outubro de 2026.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "A casa gastou mais energia", level: 3 })).toBeVisible();
  await expect(page.getByText(/70 kWh a mais que na conta anterior/)).toBeVisible();
});

test("os dias da conta: 33 dias viram um motivo; número fora da faixa avisa e não conta", async ({ page, context }) => {
  await semearCasa(context, casaComContas(SUBIU));
  await page.goto("/casa/conta-alta");
  const dias = page.getByLabel(/Quantos dias a conta cobre/);
  await expect(page.getByRole("heading", { name: "Esta conta cobriu mais dias" })).toHaveCount(0);
  await dias.fill("33");
  await expect(page.getByRole("heading", { name: "Esta conta cobriu mais dias" })).toBeVisible();
  await expect(page.getByText(/Ela cobre 33 dias, 3 a mais que um mês de 30/)).toBeVisible();
  await dias.fill("99");
  await expect(page.getByText("Digite um número de 1 a 60.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Esta conta cobriu mais dias" })).toHaveCount(0);
  // Só números entram no campo.
  await dias.fill("3a");
  await expect(dias).toHaveValue("3");
});

test("trocar a conta escolhida compara com a anterior dela", async ({ page, context }) => {
  await semearCasa(context, casaComContas(SUBIU));
  await page.goto("/casa/conta-alta?conta=nov");
  await page.getByLabel("Mês da conta").selectOption("out");
  await expect(page.getByText("Esta conta veio R$ 10,00 a mais que a de setembro de 2026.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "A casa gastou mais energia" })).toHaveCount(0);
});

test("conta parecida com a anterior: o 'Mês a mês' só mostra o link discreto", async ({ page, context }) => {
  await semearCasa(
    context,
    casaComContas([
      { id: "out", competencia: "2026-10", kwh: 200, valor: 180 },
      { id: "nov", competencia: "2026-11", kwh: 205, valor: 185 },
    ]),
  );
  await page.goto("/casa");
  await expect(page.getByRole("link", { name: /veio mais alta/ })).toHaveCount(0);
  await page.getByRole("link", { name: "Achou a conta alta? Veja por quê" }).click();
  await expect(page).toHaveURL(/\/casa\/conta-alta\?conta=nov$/);
});

test("sem contas anotadas: pede para anotar, e o teste do relógio já aparece", async ({ page, context }) => {
  await semearCasa(context, casaComContas([]));
  await page.goto("/casa/conta-alta");
  await expect(page.getByRole("link", { name: "Anotar conta" })).toHaveAttribute("href", "/casa#titulo-acompanhamento");
  await expect(page.getByRole("heading", { name: "Faça o teste do relógio" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ainda acha que a conta está errada?" })).toBeVisible();
});

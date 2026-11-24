/*
 * HIS-104: meta de gasto no painel. A casa é a do caso C4 do domínio (conta de R$ 160,00 a R$ 0,80/kWh, chuveiro de
 * 4.400 W com 2 banhos de 10 min e mais 156 kWh de outros aparelhos), então os números batem com a conta feita à mão.
 * Roda em 390 px e 1280 px (projetos celular e computador).
 */
import type { Page } from "@playwright/test";
import { analisarAcessibilidade, descreverViolacoes, violacoesQueReprovam } from "./apoio/axe";
import { casaSalva, lerFixture, semearCasa, type CasaGuardada } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

test.use({ reducedMotion: "reduce" });

function casaDoC4({ metaMensal, comConta = true }: { metaMensal?: number; comConta?: boolean } = {}): CasaGuardada {
  const base = lerFixture("casa-v2.json");
  const comodoId = base.state.comodos[0]?.id ?? "c1";
  const residencia = { ...(base.state.residencia as object), beneficio: "nenhum", ligacao: "monofasica", ...(comConta ? { contaReferencia: { kwh: 200, valor: 160 } } : {}) };
  const aparelhos = [
    { id: "00000000-0000-4000-8000-0000000000c1", catalogoId: "chuveiro", nome: "Chuveiro", comodoId, quantidade: 1, potenciaW: 4400, minutosPorDia: 20, diasPorSemana: 7, banho: { banhosPorDia: 2, minutosPorBanho: 10 } },
    { id: "00000000-0000-4000-8000-0000000000c2", nome: "Outros", comodoId, quantidade: 1, potenciaW: 100, minutosPorDia: 60, diasPorSemana: 7, kwhMesInformado: 156 },
  ];
  return { version: 3, state: { ...base.state, residencia, aparelhos, plano: [], ...(metaMensal === undefined ? {} : { metaMensal }) } };
}

const cartao = (pagina: Page) => pagina.locator("section#meta");

test("C4: as dicas ajudam, mas não chegam; a economia é R$ 12,67, nunca R$ 14,08", async ({ page }) => {
  await semearCasa(page.context(), casaDoC4({ metaMensal: 147 }));
  await page.goto("/casa");
  const meta = cartao(page);
  await expect(meta.getByRole("heading", { name: "Estas dicas ajudam, mas ainda não chegam lá." })).toBeVisible();
  await expect(meta).toContainText("Elas economizam R$ 12,67. Ainda faltam R$ 0,33. Com elas, sua conta pode ficar em R$ 147,33.");
  await expect(meta).not.toContainText("R$ 14,08");
  await expect(meta.getByRole("img", { name: "Conta de R$ 160,00, meta de R$ 147,00" })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("meta-c4.png"), fullPage: true });

  const resultado = await analisarAcessibilidade(page);
  expect(descreverViolacoes(violacoesQueReprovam(resultado.violations))).toEqual([]);
});

test("definir, ver o piso, usar o piso e tirar a meta; tudo fica só no aparelho", async ({ page }) => {
  await semearCasa(page.context(), casaDoC4());
  await page.goto("/casa");
  const meta = cartao(page);
  const campo = meta.getByLabel("Quanto você quer pagar de luz por mês?");

  await campo.fill("300");
  await meta.getByRole("button", { name: "Salvar meta" }).click();
  await expect(meta.getByRole("status")).toContainText("Meta salva neste aparelho.");
  await expect(meta.getByRole("heading", { name: "Boa notícia: sua conta já cabe na meta." })).toBeVisible();
  await expect(meta.getByRole("button", { name: "Mudar meta" })).toBeFocused();
  expect((await casaSalva(page))?.state.metaMensal).toBe(300);

  await meta.getByRole("button", { name: "Mudar meta" }).click();
  await campo.fill("10");
  await meta.getByRole("button", { name: "Salvar meta" }).click();
  await expect(meta.getByRole("heading", { name: "Essa meta está abaixo do que dá para pagar." })).toBeVisible();
  await expect(meta).not.toContainText("Falta economizar");

  await meta.getByRole("button", { name: "Usar R$ 24,00" }).click();
  await expect(campo).toHaveValue("24,00");
  await meta.getByRole("button", { name: "Salvar meta" }).click();
  await expect(meta.getByRole("heading", { name: "Estas dicas ajudam, mas ainda não chegam lá." })).toBeVisible();

  await meta.getByRole("button", { name: "Tirar a meta" }).click();
  await meta.getByRole("button", { name: "Sim, tirar" }).click();
  await expect(campo).toBeVisible();
  expect((await casaSalva(page))?.state.metaMensal).toBeUndefined();
});

test("valor fora da faixa mostra o erro e não salva", async ({ page }) => {
  await semearCasa(page.context(), casaDoC4());
  await page.goto("/casa");
  const meta = cartao(page);
  await meta.getByLabel("Quanto você quer pagar de luz por mês?").fill("9000");
  await meta.getByRole("button", { name: "Salvar meta" }).click();
  await expect(meta).toContainText("Escreva um valor entre R$ 1,00 e R$ 5.000,00.");
  await expect(meta.getByLabel("Quanto você quer pagar de luz por mês?")).toBeFocused();
  expect((await casaSalva(page))?.state.metaMensal).toBeUndefined();
});

test("sem conta de luz: 'pelo menos' e nunca 'chegam lá'", async ({ page }) => {
  await semearCasa(page.context(), casaDoC4({ metaMensal: 60, comConta: false }));
  await page.goto("/casa");
  const meta = cartao(page);
  await expect(meta.getByRole("heading", { name: /^Falta economizar pelo menos R\$/ })).toBeVisible();
  await expect(meta).not.toContainText("chega");
  await expect(meta.getByRole("link", { name: "Colocar minha conta de luz" })).toBeVisible();
});

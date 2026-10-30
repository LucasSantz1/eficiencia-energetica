/*
 * Quem já usa o site não pode perder a casa (CLAUDE.md, "nada que quebre quem já usa"). As fixtures são o que as
 * versões 1 e 2 do `persist` gravaram de verdade (copiadas byte a byte do e2e-base; nunca regerar — versão nova do
 * persist = fixture nova). Cobertura 4 e 5 do plano do qa. Não depende da largura: só celular.
 */
import { casaSalva, lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

test("casa da versão 2 abre, mostra os 6 cômodos e volta idêntica depois de recarregar", async ({ page, context }) => {
  const casa = lerFixture("casa-v2.json");
  await semearCasa(context, casa);
  await page.goto("/casa");
  await expect(page.getByText("Sua conta estimada por mês")).toBeVisible();
  for (const comodo of casa.state.comodos) await expect(page.locator("main").getByText(comodo.nome, { exact: true }).first()).toBeVisible();

  await page.reload();
  await expect(page.getByText("Sua conta estimada por mês")).toBeVisible();
  expect(await casaSalva(page)).toEqual(casa);
});

test("casa da versão 1 vira versão 2 com contas, leituras e plano vazios e o resto igual", async ({ page, context }) => {
  const antiga = lerFixture("casa-v1.json");
  await semearCasa(context, antiga);
  await page.goto("/casa");
  await expect(page.getByText("Sua conta estimada por mês")).toBeVisible();
  // O zustand regrava ao hidratar quando a versão muda.
  await expect.poll(async () => (await casaSalva(page))?.version).toBe(2);
  expect(await casaSalva(page)).toEqual({ version: 2, state: { ...antiga.state, contas: [], leituras: [], plano: [] } });

  await page.reload();
  await expect(page.getByText("Sua conta estimada por mês")).toBeVisible();
  expect((await casaSalva(page))?.version).toBe(2);
});

test("/comecar com casa mostra \"Você já cadastrou a sua casa\" e não muda a casa guardada", async ({ page, context }) => {
  // Portão de hidratação (ameaça A3 da HIS-001): quem já tem casa não pode cair no assistente, que substitui tudo.
  const casa = lerFixture("casa-v2.json");
  await semearCasa(context, casa);
  await page.goto("/comecar");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Você já cadastrou a sua casa");
  expect(await casaSalva(page)).toEqual(casa);
});

/*
 * Editor de aparelho (ameaça A4 da HIS-001): salvar sem mudar nada mantém ids e quantidades, pelas duas portas
 * (o "Quem mais gasta" do acompanhamento e a lista dos cômodos); remover um aparelho que está no plano tira as dicas
 * dele do plano. Cobertura 2 e 3 do plano do qa. Não depende da largura: só celular.
 */
import type { Page } from "@playwright/test";
import { casaSalva, lerFixture, semearCasa } from "./apoio/casa";
import { dialogoAberto } from "./apoio/telas";
import { expect, test } from "./apoio/teste";

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function aparelhosGuardados(pagina: Page): Promise<string[]> {
  return ((await casaSalva(pagina))?.state.aparelhos ?? []).map((a) => `${a.id}×${a.quantidade}`);
}

test.beforeEach(async ({ context }) => {
  await semearCasa(context, lerFixture("casa-v2.json"));
});

test("salvar o editor sem mudar nada mantém ids e quantidades (acompanhamento e cômodos)", async ({ page }) => {
  await page.goto("/casa");
  const antes = await aparelhosGuardados(page);
  expect(antes).toHaveLength(lerFixture("casa-v2.json").state.aparelhos.length);

  await page.getByRole("button", { name: /Toque para ajustar\.$/ }).first().click();
  await dialogoAberto(page).getByRole("button", { name: "Salvar mudanças" }).click();
  await expect(dialogoAberto(page)).toHaveCount(0);
  expect(await aparelhosGuardados(page), "pelo \"Quem mais gasta\"").toEqual(antes);

  await page.goto("/casa/comodos");
  await page.getByRole("button", { name: "Geladeira de 1 porta", exact: true }).click();
  await dialogoAberto(page).getByRole("button", { name: "Salvar mudanças" }).click();
  await expect(dialogoAberto(page)).toHaveCount(0);
  expect(await aparelhosGuardados(page), "pela lista dos cômodos").toEqual(antes);
});

test("remover o aparelho que está no plano tira o aparelho e as dicas dele", async ({ page }) => {
  const casa = lerFixture("casa-v2.json");
  const [idNoPlano] = casa.state.plano[0]?.split(":") ?? [];
  const aparelho = casa.state.aparelhos.find((a) => a.id === idNoPlano);
  if (!aparelho) throw new Error("a fixture casa-v2.json precisa ter uma dica de aparelho no plano");
  const comodo = casa.state.comodos.find((c) => c.id === aparelho.comodoId);
  if (!comodo) throw new Error(`a fixture casa-v2.json precisa ter o cômodo de ${aparelho.nome}`);

  await page.goto("/casa");
  // Nome do D-A5-1 (texto da ux): "[N × ]<aparelho> em <cômodo>, …, R$ … por mês. É NN% da conta. Toque para ajustar."
  const nome = new RegExp(`^(\\d+ × )?${escaparRegex(aparelho.nome)} em ${escaparRegex(comodo.nome)}, .*Toque para ajustar\\.$`);
  await page.getByRole("button", { name: nome }).click();
  await dialogoAberto(page).getByRole("button", { name: "Remover este aparelho" }).click();
  await dialogoAberto(page).getByRole("button", { name: "Sim, remover" }).click();
  await expect(dialogoAberto(page)).toHaveCount(0);

  const depois = (await casaSalva(page))?.state;
  expect(depois?.aparelhos, "um aparelho a menos").toHaveLength(casa.state.aparelhos.length - 1);
  expect(depois?.aparelhos.map((a) => a.id)).not.toContain(aparelho.id);
  expect(depois?.plano.filter((dica) => dica.startsWith(`${aparelho.id}:`)), `dicas de ${aparelho.nome} no plano`).toEqual([]);
});

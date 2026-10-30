/*
 * "Apagar todos os meus dados" (LGPD: a pessoa pode apagar tudo): a casa some do aparelho, o site volta para o
 * início, continua vazio depois de recarregar e o cadastro começa do zero. Cobertura 6 do plano do qa. Só celular.
 */
import { casaSalva, lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

test("apagar todos os meus dados esvazia a casa e volta para o início", async ({ page, context }) => {
  await semearCasa(context, lerFixture("casa-v2.json"));
  await page.goto("/casa/ajustes");
  await page.getByRole("button", { name: "Apagar todos os meus dados" }).click();
  await page.getByRole("button", { name: "Sim, apagar" }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/");

  const casaVazia = async () => {
    const estado = (await casaSalva(page))?.state;
    // Com o nome de cada lista, a falha diz qual sobrou (ex.: "leituras": 2), não só a posição.
    return {
      residencia: estado?.residencia ?? null,
      comodos: estado?.comodos.length ?? 0,
      aparelhos: estado?.aparelhos.length ?? 0,
      contas: estado?.contas.length ?? 0,
      leituras: estado?.leituras.length ?? 0,
      plano: estado?.plano.length ?? 0,
    };
  };
  const VAZIA = { residencia: null, comodos: 0, aparelhos: 0, contas: 0, leituras: 0, plano: 0 };
  await expect.poll(casaVazia, { message: "casa depois de apagar" }).toEqual(VAZIA);

  await page.reload();
  expect(await casaVazia(), "depois de recarregar").toEqual(VAZIA);

  await page.goto("/comecar");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Em qual estado você mora?");
});

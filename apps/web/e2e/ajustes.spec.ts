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
    return {
      residencia: estado?.residencia ?? null,
      listas: [estado?.comodos, estado?.aparelhos, estado?.contas, estado?.leituras, estado?.plano].map((l) => l?.length ?? 0),
    };
  };
  await expect.poll(casaVazia).toEqual({ residencia: null, listas: [0, 0, 0, 0, 0] });

  await page.reload();
  expect(await casaVazia(), "depois de recarregar").toEqual({ residencia: null, listas: [0, 0, 0, 0, 0] });

  await page.goto("/comecar");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Em qual estado você mora?");
});

/*
 * "Apagar todos os meus dados" (LGPD: a pessoa pode apagar tudo): a casa some do aparelho, o site volta para o
 * início, continua vazio depois de recarregar e o cadastro começa do zero. Cobertura 6 do plano do qa. Só celular.
 */
import { casaSalva, lerFixture, semearCasa } from "./apoio/casa";
import { abrirAjuste } from "./apoio/telas";
import { expect, test } from "./apoio/teste";

test("apagar todos os meus dados esvazia a casa e volta para o início", async ({ page, context }) => {
  await semearCasa(context, lerFixture("casa-v2.json"));
  await page.goto("/casa/ajustes");
  await abrirAjuste(page, "Seus dados");
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

test.describe("Minha casa no celular: lista de configurações (dono, 27/11)", () => {
  test.beforeEach(({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, "no computador, os ajustes são cartões abertos");
  });

  test("cada linha mostra o que está escolhido e abre o ajuste numa folha, que fecha com Esc", async ({ page, context }) => {
    await semearCasa(context, lerFixture("casa-v2.json"));
    await page.goto("/casa/ajustes");
    const beneficio = page.getByRole("button").filter({ has: page.getByText("Benefício na conta de luz", { exact: true }) });
    await expect(beneficio).toContainText("Tarifa Social");
    await expect(beneficio).toHaveAttribute("aria-haspopup", "dialog");

    await beneficio.click();
    const folha = page.getByRole("dialog", { name: "Benefício na conta de luz" });
    await expect(folha.getByRole("radio", { name: /^Tarifa Social/ })).toBeVisible();
    await folha.getByRole("radio", { name: /^Não tenho benefício/ }).click();
    await page.keyboard.press("Escape");
    await expect(folha).toBeHidden();
    // A linha já mostra a escolha nova, e o foco volta para ela (o <dialog> devolve o foco a quem abriu).
    await expect(beneficio).toContainText("Não tenho benefício");
    await expect(beneficio).toBeFocused();
  });

  test("o link de outra tela para um ajuste (#conta) abre a folha dele", async ({ page, context }) => {
    await semearCasa(context, lerFixture("casa-v2.json"));
    await page.goto("/casa/ajustes#conta");
    await expect(page.getByRole("dialog", { name: "Sua conta de luz" })).toBeVisible();
    await expect(page.getByLabel("Consumo do mês (kWh)")).toBeVisible();
  });
});

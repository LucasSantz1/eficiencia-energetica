/*
 * HIS-102: "Letra maior" e "Mais contraste" em Minha casa. A escolha fica guardada no aparelho (chave própria), vale
 * no site todo já na primeira pintura, passa no axe, cabe em 390 px sem rolar para o lado e some com "Apagar todos os
 * meus dados". Roda nos dois projetos; o teste de largura passa por 390 e 1440 px.
 */
import type { Page } from "@playwright/test";
import { analisarAcessibilidade, descreverViolacoes, violacoesQueReprovam } from "./apoio/axe";
import { lerFixture, semearCasa, semearTextos, textoGuardado } from "./apoio/casa";
import { abrirAjuste, fecharAjuste } from "./apoio/telas";
import { expect, test } from "./apoio/teste";

const CHAVE_LEITURA = "eficiencia-energetica:leitura";
const AMBOS_LIGADOS = JSON.stringify({ letraMaior: true, maisContraste: true });
const TELAS = ["/", "/comecar", "/tarifa-social", "/casa", "/casa/comodos", "/casa/dicas", "/casa/ajustes", "/sobre"] as const;

const interruptor = (pagina: Page, nome: "Letra maior" | "Mais contraste") => pagina.getByRole("switch", { name: nome, exact: true });
const marcasDoHtml = (pagina: Page) => pagina.evaluate(() => ({ ...document.documentElement.dataset }));

test("ligar os dois, recarregar e abrir outra tela: continua ligado", async ({ page, context }) => {
  await semearCasa(context, lerFixture("casa-v2.json"));
  await page.goto("/casa/ajustes");
  await abrirAjuste(page, "Leitura");
  await expect(interruptor(page, "Letra maior")).toHaveAttribute("aria-checked", "false");

  await interruptor(page, "Letra maior").click();
  await interruptor(page, "Mais contraste").click();
  await expect(interruptor(page, "Letra maior")).toHaveAttribute("aria-checked", "true");
  await expect(interruptor(page, "Mais contraste")).toHaveAttribute("aria-checked", "true");
  expect(await marcasDoHtml(page)).toMatchObject({ letra: "maior", contraste: "mais" });
  expect(JSON.parse((await textoGuardado(page, CHAVE_LEITURA)) ?? "null")).toEqual({ letraMaior: true, maisContraste: true });

  await page.reload();
  await abrirAjuste(page, "Leitura");
  await expect(interruptor(page, "Letra maior")).toHaveAttribute("aria-checked", "true");
  await expect(interruptor(page, "Mais contraste")).toHaveAttribute("aria-checked", "true");

  await page.goto("/");
  expect(await marcasDoHtml(page)).toMatchObject({ letra: "maior", contraste: "mais" });
  // A letra cresceu de verdade: a raiz a 125% de 16 px.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe("20px");

  // Desligar volta ao normal na hora.
  await page.goto("/casa/ajustes");
  await abrirAjuste(page, "Leitura");
  await interruptor(page, "Letra maior").click();
  await expect(interruptor(page, "Letra maior")).toHaveAttribute("aria-checked", "false");
  expect(await marcasDoHtml(page)).not.toHaveProperty("letra");
});

test("já na primeira pintura: o <html> está marcado quando o <body> nasce", async ({ page, context }) => {
  await semearTextos(context, { [CHAVE_LEITURA]: AMBOS_LIGADOS });
  await context.addInitScript(() => {
    new MutationObserver((_registros, observador) => {
      if (!document.body) return;
      (window as unknown as { e2eMarcasNoBody: Record<string, string | undefined> }).e2eMarcasNoBody = { ...document.documentElement.dataset };
      observador.disconnect();
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto("/sobre");
  expect(await page.evaluate(() => (window as unknown as { e2eMarcasNoBody?: Record<string, string | undefined> }).e2eMarcasNoBody)).toMatchObject({ letra: "maior", contraste: "mais" });
});

test("valor estranho guardado vale como desligado, sem erro", async ({ page, context }) => {
  await semearTextos(context, { [CHAVE_LEITURA]: '{"letraMaior":"sim"' });
  await page.goto("/");
  expect(await marcasDoHtml(page)).not.toHaveProperty("letra");
  expect(await marcasDoHtml(page)).not.toHaveProperty("contraste");
});

test("com os dois ligados, 390 e 1440 px: cabe sem rolar para o lado e o axe não acusa nada", async ({ page, context }) => {
  test.setTimeout(120_000);
  await semearCasa(context, lerFixture("casa-v2.json"));
  // Em toda página (não só na primeira): a escolha vale para o teste inteiro. A página em branco não tem armazenamento.
  await context.addInitScript((valor) => {
    if (location.protocol.startsWith("http")) localStorage.setItem("eficiencia-energetica:leitura", valor);
  }, AMBOS_LIGADOS);
  for (const largura of [390, 1440]) {
    await page.setViewportSize({ width: largura, height: 900 });
    for (const tela of TELAS) {
      await page.goto(tela);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      expect(await marcasDoHtml(page), `${tela} a ${largura} px`).toMatchObject({ letra: "maior", contraste: "mais" });
      // O axe confere a cor final: espera acabarem as animações de entrada (a casa ilustrada acende aos poucos).
      await page.waitForFunction(() => document.getAnimations().every((animacao) => animacao.playState !== "running"));
      const rolaParaOLado = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(rolaParaOLado, `${tela} a ${largura} px rola para o lado`).toBe(false);
      const graves = violacoesQueReprovam((await analisarAcessibilidade(page)).violations);
      expect(descreverViolacoes(graves), `axe em ${tela} a ${largura} px`).toEqual([]);
    }
  }
});

test("Apagar todos os meus dados também apaga a escolha de leitura", async ({ page, context }) => {
  await semearCasa(context, lerFixture("casa-v2.json"));
  await page.goto("/casa/ajustes");
  await abrirAjuste(page, "Leitura");
  await interruptor(page, "Mais contraste").click();
  expect(await textoGuardado(page, CHAVE_LEITURA)).not.toBeNull();

  await fecharAjuste(page);
  await abrirAjuste(page, "Seus dados");
  await page.getByRole("button", { name: "Apagar todos os meus dados" }).click();
  await page.getByRole("button", { name: "Sim, apagar" }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/");
  expect(await textoGuardado(page, CHAVE_LEITURA)).toBeNull();
  expect(await marcasDoHtml(page)).not.toHaveProperty("contraste");
});

test("sem casa cadastrada: a letra maior fica só em Minha casa, que abre mesmo sem casa (dono, 27/11)", async ({ page }) => {
  // O cadastro e a Casca sem casa não mostram mais o controle no topo.
  await page.goto("/comecar");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Em qual estado você mora?");
  await expect(interruptor(page, "Letra maior")).toHaveCount(0);
  await page.goto("/casa");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Vamos cadastrar a sua casa");
  await expect(interruptor(page, "Letra maior")).toHaveCount(0);

  // Minha casa abre na primeira visita, com a leitura e o convite para cadastrar.
  await page.goto("/casa/ajustes");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Minha casa");
  await expect(page.getByRole("link", { name: "Começar" })).toHaveAttribute("href", "/comecar");
  await abrirAjuste(page, "Leitura");
  await interruptor(page, "Letra maior").click();
  expect(await marcasDoHtml(page)).toMatchObject({ letra: "maior" });
  // Sem nada guardado, não há "Seus dados" para apagar.
  await fecharAjuste(page);
  await expect(page.getByText("Seus dados", { exact: true })).toHaveCount(0);
});

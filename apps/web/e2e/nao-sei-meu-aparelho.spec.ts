/*
 * Modo "não sei qual é o meu aparelho": perguntas pelo que se vê, com "Não sei", e uma faixa de valor quando a
 * resposta não fecha. Geladeira da Cozinha da fixture (1 porta, 5 a 10 anos). Roda em 390 px e 1280 px.
 */
import { analisarAcessibilidade, descreverViolacoes, violacoesQueReprovam } from "./apoio/axe";
import { casaSalva, lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

test.use({ reducedMotion: "reduce" });

test("duas portas com congelador em cima, gelo 'não sei', mais de 10 anos: faixa e grava a duplex antiga", async ({ page }) => {
  await semearCasa(page.context(), { ...lerFixture("casa-v2.json"), version: 3 });
  await page.goto("/casa/comodos");
  const linha = page.locator("li").filter({ has: page.getByText("Geladeira de 1 porta", { exact: true }) }).first();
  await linha.getByRole("button", { name: /Escolher o tipo/ }).click();
  await linha.getByRole("button", { name: "Não sei qual é o meu" }).click();

  await page.getByRole("radiogroup", { name: "Como são as portas?" }).getByRole("radio", { name: /^Duas, congelador em cima/ }).click();
  await page.getByRole("radiogroup", { name: /junta gelo/ }).getByRole("radio", { name: "Não sei" }).click();
  await page.getByRole("radiogroup", { name: "Há quanto tempo vocês têm?" }).getByRole("radio", { name: "Mais de 10 anos" }).click();

  await expect(page.getByText(/^Fica entre R\$ [\d,]+ e R\$ [\d,]+ por mês\./)).toBeVisible();
  await expect(page.getByText(/Para deixar o valor certo: Na etiqueta amarela do INMETRO/)).toBeVisible();
  // Sem fullPage: no Chromium a captura da página inteira muda o tamanho da janela por um instante, e a tela dos cômodos
  // troca de desenho (celular ↔ computador), o que fecharia as perguntas no meio do teste.
  await page.screenshot({ path: test.info().outputPath("guia-visual.png") });
  const resultado = await analisarAcessibilidade(page);
  expect(descreverViolacoes(violacoesQueReprovam(resultado.violations))).toEqual([]);

  // Ao usar, o nome do aparelho muda para o do modelo: a linha deixa de se chamar "Geladeira de 1 porta".
  await page.getByRole("button", { name: "Usar este" }).click();
  await expect(page.getByRole("button", { name: "Geladeira duplex", exact: true })).toBeVisible();
  const geladeira = (await casaSalva(page))?.state.aparelhos.find((a) => "catalogoId" in a && a.catalogoId === "geladeira");
  expect(geladeira).toMatchObject({ nome: "Geladeira duplex", variantes: { modelo: "duplex", idade: "antiga" }, kwhMesInformado: 75 });
});

test("chuveiro: sem pergunta que diga a potência, mostra a faixa toda e onde olhar", async ({ page }) => {
  await semearCasa(page.context(), { ...lerFixture("casa-v2.json"), version: 3 });
  await page.goto("/casa/comodos#comodo-00000000-0000-4000-8000-000000000050");
  const linha = page.locator("li").filter({ has: page.getByText("Chuveiro elétrico", { exact: true }) }).first();
  await linha.getByRole("button", { name: /Escolher o tipo/ }).click();
  await linha.getByRole("button", { name: "Não sei qual é o meu" }).click();
  await expect(page.getByText(/^Fica entre R\$ [\d,]+ e R\$ [\d,]+ por mês\./)).toBeVisible();
  await expect(page.getByText(/gravado no próprio chuveiro/)).toBeVisible();
});

test("sem internet na hora de abrir as perguntas: aviso no lugar delas, e 'Tentar de novo' abre quando a internet volta", async ({ page, errosEsperados }) => {
  // O navegador reclama no console de cada arquivo que não chegou (o Turbopack tenta 2 vezes), e o React registra o erro
  // que a barreira segurou.
  errosEsperados.push(/Failed to load resource: net::ERR_INTERNET_DISCONNECTED/, /ChunkLoadError: Failed to load chunk/);
  await semearCasa(page.context(), { ...lerFixture("casa-v2.json"), version: 3 });
  await page.goto("/casa/comodos");
  const linha = page.locator("li").filter({ has: page.getByText("Geladeira de 1 porta", { exact: true }) }).first();
  await linha.getByRole("button", { name: /Escolher o tipo/ }).click();

  // A tela já carregou; daqui em diante nenhum arquivo .js novo chega (o pedaço das perguntas é baixado só agora).
  await page.route("**/*.js", (rota) => rota.abort("internetdisconnected"));
  await linha.getByRole("button", { name: "Não sei qual é o meu" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Não deu para abrir as perguntas." })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); // a tela dos cômodos continua de pé

  await page.unroute("**/*.js");
  await page.getByRole("button", { name: "Tentar de novo" }).click();
  await expect(page.getByRole("radiogroup", { name: "Como são as portas?" })).toBeVisible();
});

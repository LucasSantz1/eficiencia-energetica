/*
 * Campos com limite (T5) e "Confere?" (T6) da HIS-003b, em 390 e 1280 px (critérios 5 e 8). Caixa-preta: os números
 * esperados estão escritos aqui (75.000 W, R$ 135,90), e não importados do `limites.ts`; se a faixa mudar, o teste
 * avisa. Com o axe no campo com erro e no campo com "Confere?".
 */
import type { Locator, Page } from "@playwright/test";
import { analisarAcessibilidade, descreverViolacoes, violacoesQueReprovam } from "./apoio/axe";
import { irAteAConta } from "./apoio/cadastro";
import { casaSalva, lerFixture, semearCasa } from "./apoio/casa";
import { abrirAjuste, abrirComodo, dataEmBrasilia, dialogoAberto, fecharAjuste } from "./apoio/telas";
import { expect, test } from "./apoio/teste";

const casa = lerFixture("casa-v2.json");

// Sem movimento reduzido, o axe mede o contraste no meio do `surgir` do "Confere?" (D10 da HIS-002a).
test.use({ reducedMotion: "reduce" });

const entrada = (pagina: Page, id: string) => pagina.locator(`input#${id}`);

/**
 * Digita e sai do campo sem ir para um botão (como tocar fora): a mensagem entra ao sair, nunca a cada tecla. Indo para
 * um botão a mensagem espera o toque (o botão não pode pular entre apertar e soltar); ver o teste do Tab até o botão.
 */
async function digitarESair(pagina: Page, id: string, texto: string): Promise<void> {
  await entrada(pagina, id).fill(texto);
  await entrada(pagina, id).blur();
}

async function conferirErro(pagina: Page, id: string, mensagem: string | RegExp): Promise<void> {
  await expect(pagina.locator(`#${id}-erro`)).toHaveText(mensagem);
  await expect(entrada(pagina, id)).toHaveAttribute("aria-invalid", "true");
  await expect(entrada(pagina, id)).toHaveAttribute("aria-describedby", new RegExp(`(^| )${id}-erro( |$)`));
}

/** "Confere?" à vista: sem aria-invalid, descrito pelo alerta, e nenhum dos dois botões com o foco. */
async function conferirAlerta(pagina: Page, id: string, texto: string | RegExp): Promise<Locator> {
  const alerta = pagina.locator(`#${id}-alerta`);
  await expect(alerta).toContainText(texto);
  await expect(entrada(pagina, id)).not.toHaveAttribute("aria-invalid", "true");
  await expect(entrada(pagina, id)).toHaveAttribute("aria-describedby", new RegExp(`(^| )${id}-alerta( |$)`));
  for (const nome of ["Sim, está certo", "Corrigir"]) await expect(pagina.getByRole("button", { name: nome, exact: true })).not.toBeFocused();
  return alerta;
}

async function semViolacoesGraves(pagina: Page, onde: string): Promise<void> {
  const resultado = await analisarAcessibilidade(pagina);
  expect(resultado.passes.length).toBeGreaterThan(0);
  expect(descreverViolacoes(violacoesQueReprovam(resultado.violations)), `axe: ${onde}`).toEqual([]);
}

/** Potência guardada do ventilador do Quarto 1 (a `CasaGuardada` do e2e não tipa a potência: é lida aqui, à parte). */
async function potenciaDoVentilador(pagina: Page): Promise<unknown> {
  const quarto = casa.state.comodos[2]?.id;
  const aparelho: unknown = (await casaSalva(pagina))?.state.aparelhos.find((a) => a.nome === "Ventilador" && a.comodoId === quarto);
  return typeof aparelho === "object" && aparelho !== null && "potenciaW" in aparelho ? aparelho.potenciaW : undefined;
}

test.describe("potência no editor do aparelho (T5 e T6)", () => {
  test.beforeEach(async ({ page, context }) => {
    await semearCasa(context, casa);
    await page.goto("/casa/comodos");
    const quarto = await abrirComodo(page, "Quarto 1");
    await quarto.getByRole("button", { name: "Ventilador", exact: true }).click();
    await expect(dialogoAberto(page)).toBeVisible();
    await expect(entrada(page, "ap-potencia")).toHaveValue("130");
  });

  test("vazio, 0 e 75.001 W: mensagem ao sair, número fica no campo, Salvar não salva e foca o campo", async ({ page }) => {
    await digitarESair(page, "ap-potencia", "");
    await conferirErro(page, "ap-potencia", "Digite a potência do aparelho, em watts (W).");
    await digitarESair(page, "ap-potencia", "0");
    await expect(page.locator("#ap-potencia-erro")).not.toBeEmpty();
    await expect(entrada(page, "ap-potencia")).toHaveAttribute("aria-invalid", "true");

    await digitarESair(page, "ap-potencia", "75001");
    await conferirErro(page, "ap-potencia", /^A potência vai de 1 W a 75\.000 W\. Confira a etiqueta ou a plaquinha atrás do aparelho\.$/);
    await expect(entrada(page, "ap-potencia"), "sem Math.min: o número digitado continua").toHaveValue("75001");
    await semViolacoesGraves(page, "potência com erro");

    await entrada(page, "ap-nome").focus();
    await dialogoAberto(page).getByRole("button", { name: "Salvar mudanças" }).click();
    await expect(entrada(page, "ap-potencia"), "o foco vai para o 1º campo errado").toBeFocused();
    await expect(dialogoAberto(page)).toBeVisible();
    expect(await potenciaDoVentilador(page), "nada foi salvo").toBe(130);

    // A mensagem some assim que o valor fica certo, a cada tecla (sem sair do campo).
    await entrada(page, "ap-potencia").fill("150");
    await expect(page.locator("#ap-potencia-erro")).toHaveCount(0);
    await expect(entrada(page, "ap-potencia")).not.toHaveAttribute("aria-invalid", "true");
  });

  test("10.001 W: Confere?; Corrigir seleciona o número e tem 44 px; Sim salva", async ({ page }) => {
    await digitarESair(page, "ap-potencia", "10001");
    await conferirAlerta(page, "ap-potencia", /^Confere\? 10\.001 W é muito para um aparelho de casa\./);
    await semViolacoesGraves(page, "potência com Confere?");

    const corrigir = page.getByRole("button", { name: "Corrigir", exact: true });
    expect((await corrigir.boundingBox())?.height ?? 0, "alvo de toque do Corrigir (pendência da ux)").toBeGreaterThanOrEqual(44);
    expect((await page.getByRole("button", { name: "Sim, está certo" }).boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await corrigir.click();
    await expect(page.locator("#ap-potencia-alerta")).toHaveCount(0);
    await expect(entrada(page, "ap-potencia")).toBeFocused();
    expect(
      await entrada(page, "ap-potencia").evaluate((e) => e instanceof HTMLInputElement && e.selectionStart === 0 && e.selectionEnd === e.value.length && e.value.length > 0),
      "Corrigir deixa o número todo selecionado",
    ).toBe(true);

    // Salvar sem responder não salva: o foco vai para o campo com a pergunta.
    await digitarESair(page, "ap-potencia", "10001");
    await conferirAlerta(page, "ap-potencia", "Confere?");
    await dialogoAberto(page).getByRole("button", { name: "Salvar mudanças" }).click();
    await expect(entrada(page, "ap-potencia")).toBeFocused();
    expect(await potenciaDoVentilador(page)).toBe(130);

    await page.getByRole("button", { name: "Sim, está certo" }).click();
    await expect(page.locator("#ap-potencia-alerta")).toHaveCount(0);
    await expect(entrada(page, "ap-potencia"), "Sim não joga o foco no começo da página").toBeFocused();
    await dialogoAberto(page).getByRole("button", { name: "Salvar mudanças" }).click();
    await expect(dialogoAberto(page)).toHaveCount(0);
    expect(await potenciaDoVentilador(page)).toBe(10001);
  });
});

test.describe("conta no cadastro (calibração)", () => {
  test("conta zerada: Ver o resultado mostra o T5 do cadastro e foca o consumo; nada é salvo", async ({ page }) => {
    await irAteAConta(page, /^Não sei/);
    await entrada(page, "conta-kwh").fill("0");
    await entrada(page, "conta-valor").fill("0");
    await page.getByRole("button", { name: "Ver o resultado" }).click();
    await conferirErro(page, "conta-kwh", 'Com a conta zerada não dá para ajustar o cálculo. Se ela veio zerada, toque em "Pular, não tenho a conta agora".');
    await expect(entrada(page, "conta-kwh")).toBeFocused();
    await expect(page).toHaveURL(/\/comecar$/);
    expect(await casaSalva(page)).toBeNull();
  });

  test("150 kWh e R$ 1.359,00 sem benefício: Confere os dois números?, com a estimativa do preço", async ({ page }) => {
    await irAteAConta(page, /^Não sei/);
    await entrada(page, "conta-kwh").fill("150");
    await digitarESair(page, "conta-valor", "1.359,00");
    await conferirAlerta(page, "conta-valor", /^Confere os dois números\? Com 150 kWh e R\$\s1\.359,00, cada kWh sairia por R\$\s9,06\./);
    await expect(entrada(page, "conta-kwh"), "o consumo também aponta para a pergunta").toHaveAttribute("aria-describedby", /conta-valor-alerta/);
    await semViolacoesGraves(page, "conta com Confere os dois números?");
  });

  test("150 kWh e R$ 1.359,00 com Tarifa Social: sem Confere do preço", async ({ page }) => {
    await irAteAConta(page, /Sim, tenho Tarifa Social/);
    await entrada(page, "conta-kwh").fill("150");
    await digitarESair(page, "conta-valor", "1.359,00");
    await expect(page.locator("#conta-valor-alerta")).toHaveCount(0);
    await expect(page.locator("#conta-valor-erro")).toHaveCount(0);
  });

  test("Tab do valor até Ver o resultado: a mensagem espera o botão; Enter nele mostra e volta ao campo", async ({ page }) => {
    await irAteAConta(page, /^Não sei/);
    await entrada(page, "conta-kwh").fill("150");
    await entrada(page, "conta-valor").fill("1,2,5");
    await entrada(page, "conta-valor").press("Tab");
    await expect(page.getByRole("button", { name: "Ver o resultado" })).toBeFocused();
    await expect(page.locator("#conta-valor-erro"), "indo para um botão, a mensagem ainda não entra").toHaveCount(0);
    await page.keyboard.press("Enter");
    await conferirErro(page, "conta-valor", "Digite só o número. Para centavos, use vírgula: 135,90.");
    await expect(entrada(page, "conta-valor")).toBeFocused();
    await expect(entrada(page, "conta-valor"), "o texto digitado continua").toHaveValue("1,2,5");
  });

  test("\"135.90\" vira R$ 135,90, e não R$ 13.590", async ({ page }) => {
    await irAteAConta(page, /^Não sei/);
    await entrada(page, "conta-kwh").fill("150");
    await entrada(page, "conta-valor").fill("135.90");
    await page.getByRole("button", { name: "Ver o resultado" }).click();
    await expect(page).toHaveURL(/\/casa$/);
    const residencia = (await casaSalva(page))?.state.residencia;
    expect(residencia).toMatchObject({ contaReferencia: { kwh: 150, valor: 135.9 } });
  });
});

test.describe("conta e leitura no acompanhamento", () => {
  test.beforeEach(async ({ context }) => {
    await semearCasa(context, casa);
  });

  test("conta de 0 kWh e R$ 0,00 é aceita no acompanhamento", async ({ page }) => {
    await page.goto("/casa");
    await page.getByRole("button", { name: /^Anotar (outra )?conta$/ }).click();
    await expect(dialogoAberto(page)).toBeVisible();
    await page.locator("#conta-mes").fill(dataEmBrasilia().slice(0, 7));
    await entrada(page, "conta-kwh-m").fill("0");
    await entrada(page, "conta-valor-m").fill("0");
    await dialogoAberto(page).getByRole("button", { name: "Salvar conta" }).click();
    await expect(dialogoAberto(page)).toHaveCount(0);
    const contas = (await casaSalva(page))?.state.contas ?? [];
    expect(contas).toContainEqual(expect.objectContaining({ competencia: dataEmBrasilia().slice(0, 7), kwh: 0, valor: 0 }));
  });

  test("leitura de mais de 100 kWh por dia: Confere? ao salvar, e só salva depois do Sim", async ({ page }) => {
    await page.goto("/casa");
    await page.getByRole("radio", { name: "Relógio de luz" }).click();
    await page.getByRole("button", { name: /^Anotar leitura/ }).click();
    await expect(dialogoAberto(page)).toBeVisible();
    await page.locator("#leitura-data").fill(dataEmBrasilia());
    await entrada(page, "leitura-valor").fill("99999");
    await dialogoAberto(page).getByRole("button", { name: "Salvar leitura" }).click();
    await conferirAlerta(page, "leitura-valor", /^Confere\? Entre .+ e .+, isso dá .+ kWh por dia\. Uma casa costuma gastar perto de 6 kWh por dia\./);
    await expect(entrada(page, "leitura-valor")).toBeFocused();
    expect((await casaSalva(page))?.state.leituras).toHaveLength(casa.state.leituras.length);
    await page.getByRole("button", { name: "Sim, está certo" }).click();
    await dialogoAberto(page).getByRole("button", { name: "Salvar leitura" }).click();
    await expect(dialogoAberto(page)).toHaveCount(0);
    expect((await casaSalva(page))?.state.leituras).toHaveLength(casa.state.leituras.length + 1);
  });
});

test.describe("conta na Minha casa (Ajustes)", () => {
  test.beforeEach(async ({ page, context }) => {
    await semearCasa(context, casa);
    await page.goto("/casa/ajustes#conta");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Minha casa");
  });

  test("conta zerada: T5 dos Ajustes, sem o falso Pronto e sem gravar", async ({ page }) => {
    await entrada(page, "aj-kwh").fill("0");
    await entrada(page, "aj-valor").fill("0");
    await page.getByRole("button", { name: "Usar estes valores" }).click();
    await conferirErro(page, "aj-kwh", "Com a conta zerada não dá para ajustar o cálculo. Para seguir sem conta, é só não tocar em “Usar estes valores”.");
    await expect(entrada(page, "aj-kwh")).toBeFocused();
    await expect(page.getByText(/^Pronto\./)).toHaveCount(0);
    expect((await casaSalva(page))?.state.residencia).not.toHaveProperty("contaReferencia");
    await semViolacoesGraves(page, "Ajustes com conta zerada");
  });

  test("valor que o store recusaria (acima do máximo) não mostra Pronto; valor certo mostra e grava", async ({ page }) => {
    // Sem benefício: com a Tarifa Social da fixture, a conta não mostra o preço do kWh (outro aviso).
    await fecharAjuste(page);
    await abrirAjuste(page, "Benefício na conta de luz");
    await page.getByRole("radio", { name: /^Não tenho benefício/ }).click();
    await expect.poll(async () => JSON.stringify((await casaSalva(page))?.state.residencia)).toContain('"beneficio":"nenhum"');
    await fecharAjuste(page);
    await abrirAjuste(page, "Sua conta de luz");
    await entrada(page, "aj-kwh").fill("150");
    await entrada(page, "aj-valor").fill("99999999");
    await page.getByRole("button", { name: "Usar estes valores" }).click();
    await expect(page.locator("#aj-valor-erro")).toContainText("Digite um valor entre");
    await expect(page.getByText(/^Pronto\./)).toHaveCount(0);
    expect((await casaSalva(page))?.state.residencia).not.toHaveProperty("contaReferencia");

    await entrada(page, "aj-valor").fill("135.90");
    await page.getByRole("button", { name: "Usar estes valores" }).click();
    await expect(page.getByText(/^Pronto\. O kWh na sua conta sai por R\$\s0,91/)).toBeVisible();
    expect((await casaSalva(page))?.state.residencia).toMatchObject({ contaReferencia: { kwh: 150, valor: 135.9 } });
  });
});

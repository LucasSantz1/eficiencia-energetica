/*
 * Critério 2: o fluxo principal inteiro, como a família faz, em 390 e 1280 px — cadastro → acompanhamento →
 * cômodos → dicas → acompanhamento → minha casa → sobre → início. A fixture de `apoio/teste.ts` reprova qualquer
 * erro de console ou pedido para fora do site em todo o caminho.
 *
 * Transições (P-qa-1): o contador é conferido depois de cada ação, sempre pelo total esperado até ali — uma
 * transição a mais em qualquer ponto aparece na próxima conferência. +1 por passo do cadastro, por aba e por link
 * (inclusive /sobre → /); 0 em "Tudo junto" e ao abrir e fechar folhas.
 *
 * Nenhum valor em R$ é afirmado (as tarifas mudam todo dia) e as datas são relativas a hoje (obs. do qa).
 */
import type { Page } from "@playwright/test";
import { casaSalva } from "./apoio/casa";
import { aba, dataEmBrasilia, dialogoAberto, mesAtras } from "./apoio/telas";
import { expect, test } from "./apoio/teste";
import { contarTransicoes, transicoesAteAgora } from "./apoio/transicoes";

/** "id×quantidade" de cada aparelho: o editor não pode trocar ids nem quantidades ao salvar sem mudar nada. */
async function aparelhosGuardados(pagina: Page): Promise<string[]> {
  return ((await casaSalva(pagina))?.state.aparelhos ?? []).map((a) => `${a.id}×${a.quantidade}`);
}

test("fluxo principal: cadastro → acompanhamento → cômodos → dicas → minha casa → sobre → início", async ({ page, context }, info) => {
  test.setTimeout(120_000);
  await contarTransicoes(context);
  let esperadas = 0;
  /** Confere o total de transições depois de uma ação que dispara `mais` delas. */
  const transicoes = async (mais: number, depoisDe: string) => {
    esperadas += mais;
    await expect.poll(() => transicoesAteAgora(page), { message: `transições depois de: ${depoisDe}` }).toBe(esperadas);
  };
  const fotografar = async (nome: string) =>
    info.attach(nome, { body: await page.screenshot({ fullPage: true, animations: "disabled" }), contentType: "image/png" });

  await test.step("início → começar", async () => {
    await page.goto("/");
    await page.getByRole("link", { name: "Começar", exact: true }).first().click();
    await expect(page).toHaveURL(/\/comecar$/);
    await transicoes(1, "abrir o cadastro");
  });

  await test.step("cadastro", async () => {
    const titulo = page.getByRole("heading", { level: 1 });

    await page.locator("select#estado").selectOption("SP");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(titulo).toHaveText("Qual é a sua cidade?");
    await transicoes(1, "estado");

    await page.locator("#busca-cidade").fill("Presidente Prudente");
    // Presidente Prudente tem uma distribuidora só: o cadastro pula a escolha da empresa.
    await page.getByRole("radio", { name: "Presidente Prudente", exact: true }).click();
    await expect(titulo).toHaveText("Sua família está no CadÚnico?");
    await transicoes(1, "cidade");

    await page.getByRole("radio", { name: /Sim, tenho Tarifa Social/ }).click();
    await expect(titulo).toHaveText("Quantas pessoas moram na casa?");
    await transicoes(1, "benefício");

    await page.getByRole("button", { name: "Aumentar pessoas na casa" }).click();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(titulo).toHaveText("Quais cômodos a sua casa tem?");
    await transicoes(1, "pessoas");

    await page.getByRole("button", { name: /^Continuar com \d+ cômodos$/ }).click();
    const marcador = page.getByText(/^Cômodo \d+ de \d+$/);
    await expect(marcador).toHaveText(/^Cômodo 1 de \d+$/);
    await transicoes(1, "escolher os cômodos");
    const total = Number((await marcador.innerText()).match(/de (\d+)$/)?.[1]);
    expect(total, "quantos cômodos o cadastro sugere").toBeGreaterThan(1);

    await page.locator('main button[aria-label^="Aumentar quantidade de"]').first().click();
    for (let atual = 1; atual <= total; atual++) {
      await expect(marcador).toHaveText(`Cômodo ${atual} de ${total}`);
      const proximo =
        atual < total
          ? page.getByRole("button", { name: /^Próximo: / })
          : page.getByRole("button", { name: "Ver o resumo dos cômodos" });
      await proximo.click();
      await transicoes(1, `cômodo ${atual} de ${total}`);
    }

    await expect(titulo).toHaveText("O que tem na sua casa");
    await page.getByRole("radio", { name: "Tudo junto" }).click();
    await expect(page.getByRole("radio", { name: "Tudo junto" })).toBeChecked();
    await transicoes(0, '"Tudo junto" na revisão');
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(titulo).toHaveText("Tem uma conta de luz em mãos?");
    await transicoes(1, "revisão");

    await page.getByRole("button", { name: "Pular, não tenho a conta agora" }).click();
    await expect(page).toHaveURL(/\/casa$/);
    await expect(page.getByText("Sua conta estimada por mês")).toBeVisible();
    await transicoes(1, "terminar o cadastro");
    const casa = await casaSalva(page);
    expect(casa?.state.residencia, "o cadastro guardou a casa").toBeTruthy();
    expect(casa?.state.comodos).toHaveLength(total);
  });

  await test.step("acompanhamento: editor pelo \"Quem mais gasta\", 2 contas e 2 leituras", async () => {
    const antes = await aparelhosGuardados(page);
    await page.getByRole("button", { name: /Toque para ajustar\.$/ }).first().click();
    await expect(dialogoAberto(page)).toBeVisible();
    await dialogoAberto(page).getByRole("button", { name: "Salvar mudanças" }).click();
    await expect(dialogoAberto(page)).toHaveCount(0);
    expect(await aparelhosGuardados(page), "salvar pelo \"Quem mais gasta\" sem mudar nada").toEqual(antes);

    // Duas contas, a mais antiga primeiro: o acompanhamento mostra os últimos meses a partir de hoje.
    for (const [botao, mes, kwh, valor] of [
      ["Anotar conta", mesAtras(2), "182", "151,37"],
      ["Anotar outra conta", mesAtras(1), "168", "140,25"],
    ] as const) {
      await page.getByRole("button", { name: botao, exact: true }).click();
      await expect(dialogoAberto(page)).toBeVisible();
      await page.locator("#conta-mes").fill(mes);
      await page.locator("#conta-kwh-m").fill(kwh);
      await page.locator("#conta-valor-m").fill(valor);
      await dialogoAberto(page).getByRole("button", { name: "Salvar conta" }).click();
      await expect(dialogoAberto(page)).toHaveCount(0);
    }
    expect((await casaSalva(page))?.state.contas).toHaveLength(2);

    await page.getByRole("radio", { name: "Relógio de luz" }).click();
    for (const [data, leitura] of [
      [dataEmBrasilia(-9), "12000"],
      [dataEmBrasilia(), "12052"],
    ] as const) {
      await page.getByRole("button", { name: "Anotar leitura", exact: true }).click();
      await expect(dialogoAberto(page)).toBeVisible();
      await page.locator("#leitura-data").fill(data);
      await page.locator("#leitura-valor").fill(leitura);
      await dialogoAberto(page).getByRole("button", { name: "Salvar leitura" }).click();
      await expect(dialogoAberto(page)).toHaveCount(0);
    }
    expect((await casaSalva(page))?.state.leituras).toHaveLength(2);
    await transicoes(0, "abrir e fechar as folhas do acompanhamento");
    await fotografar("acompanhamento");
  });

  await test.step("cômodos: editor salva sem mudar ids e remove a TV", async () => {
    await aba(page, "Cômodos").click();
    await expect(page).toHaveURL(/\/casa\/comodos$/);
    await expect(page.getByText("Cômodos e aparelhos").first()).toBeVisible();
    await transicoes(1, "aba Cômodos");

    const comodos = page.locator('section[id^="comodo-"]');
    const antes = await aparelhosGuardados(page);
    await comodos.first().getByRole("button", { name: "Geladeira de 1 porta", exact: true }).click();
    await expect(dialogoAberto(page)).toBeVisible();
    await dialogoAberto(page).getByRole("button", { name: "Salvar mudanças" }).click();
    await expect(dialogoAberto(page)).toHaveCount(0);
    expect(await aparelhosGuardados(page), "salvar pelos cômodos sem mudar nada").toEqual(antes);

    const sala = comodos.nth(1);
    await sala.locator("button[aria-expanded]").first().click();
    await sala.getByRole("button", { name: "TV LED até 32 polegadas", exact: true }).click();
    await expect(dialogoAberto(page)).toBeVisible();
    await dialogoAberto(page).getByRole("button", { name: "Remover este aparelho" }).click();
    await dialogoAberto(page).getByRole("button", { name: "Sim, remover" }).click();
    await expect(dialogoAberto(page)).toHaveCount(0);
    const depois = (await casaSalva(page))?.state.aparelhos ?? [];
    expect(depois, "remover tira exatamente um aparelho").toHaveLength(antes.length - 1);
    expect(depois.map((a) => a.nome)).not.toContain("TV LED até 32 polegadas");

    await page.getByRole("radio", { name: "Painel geral" }).click();
    await expect(page.getByRole("radio", { name: "Painel geral" })).toBeChecked();
    await transicoes(0, "folhas dos cômodos e \"Painel geral\"");
    await fotografar("comodos-painel-geral");
  });

  await test.step("dicas: marca a primeira dica no plano", async () => {
    await aba(page, "Dicas").click();
    await expect(page).toHaveURL(/\/casa\/dicas$/);
    await expect(page.getByText("Dicas e plano de economia")).toBeVisible();
    await transicoes(1, "aba Dicas");
    await page.locator('main button[role="checkbox"]').first().click();
    await expect(page.locator('main button[role="checkbox"]').first()).toHaveAttribute("aria-checked", "true");
    expect((await casaSalva(page))?.state.plano).toHaveLength(1);
    await fotografar("dicas-com-plano");
  });

  await test.step("acompanhamento → minha casa → sobre → início", async () => {
    await aba(page, "Acompanhamento").click();
    await expect(page).toHaveURL(/\/casa$/);
    await expect(page.getByText("Sua conta estimada por mês")).toBeVisible();
    await transicoes(1, "aba Acompanhamento (para trás)");

    await aba(page, "Minha casa").click();
    await expect(page).toHaveURL(/\/casa\/ajustes$/);
    await transicoes(1, "aba Minha casa");

    await page.getByRole("link", { name: "De onde vêm as tarifas e como o cálculo é feito" }).click();
    await expect(page).toHaveURL(/\/sobre$/);
    await transicoes(1, "link para /sobre");
    await fotografar("sobre");

    // /sobre → / prova o B6 da HIS-002b (a transição da página "sobre" continua depois da correção S2).
    await page.locator('header a[href="/"]').first().click();
    await expect(page).toHaveURL((url) => url.pathname === "/");
    await transicoes(1, "/sobre → /");
  });
});

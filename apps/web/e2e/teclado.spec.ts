/*
 * Só com o teclado (P-qa-2; cobertura 16–18 e 23 do plano do qa), em 390 e 1280 px: quem não usa toque nem mouse
 * precisa conseguir cadastrar a casa, abrir e fechar as folhas e trocar de aba, vendo onde está o foco.
 * Era o roteiro manual da etapa 5 da HIS-001 (manual-qa.cjs), que só existia no scratchpad do qa.
 */
import type { Locator, Page } from "@playwright/test";
import { lerFixture, semearCasa } from "./apoio/casa";
import { aba, dialogoAberto, type Aba } from "./apoio/telas";
import { expect, test } from "./apoio/teste";

/** Aperta Tab até o foco chegar em `alvo` (um elemento só). */
async function tabAte(pagina: Page, alvo: Locator, maximo = 200): Promise<void> {
  for (let toques = 0; toques < maximo; toques++) {
    await pagina.keyboard.press("Tab");
    if (await alvo.evaluate((e) => e === document.activeElement)) return;
  }
  throw new Error(`Tab não chegou em ${alvo.toString()} em ${maximo} toques`);
}

/** Contorno de foco desenhado (outline ou sombra): quem usa teclado vê onde está. */
async function esperarContornoVisivel(alvo: Locator): Promise<void> {
  const contorno = await alvo.evaluate((e) => {
    const estilo = getComputedStyle(e);
    if (estilo.outlineStyle !== "none" && parseFloat(estilo.outlineWidth) > 0) return `${estilo.outlineStyle} ${estilo.outlineWidth}`;
    return estilo.boxShadow === "none" ? "nenhum" : "sombra";
  });
  expect(contorno, `contorno de foco em ${alvo.toString()}`).not.toBe("nenhum");
}

/** Tab até o controle, confere o contorno e aperta a tecla. */
async function acionar(pagina: Page, alvo: Locator, tecla = "Enter"): Promise<void> {
  await tabAte(pagina, alvo);
  await esperarContornoVisivel(alvo);
  await pagina.keyboard.press(tecla);
}

const focoDentroDoDialogo = (pagina: Page) =>
  pagina.evaluate(() => Boolean(document.activeElement?.closest("dialog[open]")));

test("cadastro só com teclado: o foco vai para o título de cada passo e o contorno aparece", async ({ page }) => {
  test.setTimeout(120_000);
  const titulo = page.getByRole("heading", { level: 1 });
  const passo = async (texto: string | RegExp) => {
    await expect(titulo).toHaveText(texto);
    await expect(titulo, "ao entrar no passo, o foco vai para o título").toBeFocused();
  };
  const botao = (nome: string | RegExp) => page.getByRole("button", { name: nome, exact: typeof nome === "string" });

  await page.goto("/comecar");
  await passo("Em qual estado você mora?");
  const estado = page.locator("select#estado");
  await tabAte(page, estado);
  await esperarContornoVisivel(estado);
  // <select> fechado: as setas trocam a opção (teclado nativo). Digitar "São Paulo" depende do intervalo entre as
  // teclas e às vezes para em "SC"; seta por seta é determinístico.
  await page.keyboard.press("Home");
  for (let opcoes = 0; opcoes < 30 && (await estado.inputValue()) !== "SP"; opcoes++) await page.keyboard.press("ArrowDown");
  await expect(estado).toHaveValue("SP");
  await acionar(page, botao("Continuar"));

  // O foco começa na busca e passa para o título (P1, HIS-108, no fixme abaixo): espera chegar ao título.
  await passo("Qual é a sua cidade?");
  const busca = page.locator("#busca-cidade");
  await tabAte(page, busca);
  await page.keyboard.type("Presidente Prudente");
  await acionar(page, page.getByRole("radio", { name: "Presidente Prudente", exact: true }));

  await passo("Sua família está no CadÚnico?");
  await acionar(page, page.getByRole("radio", { name: /Sim, tenho Tarifa Social/ }), "Space");

  await passo("Quantas pessoas moram na casa?");
  await acionar(page, botao("Aumentar pessoas na casa"));
  await acionar(page, botao("Continuar"));

  await passo("Quais cômodos a sua casa tem?");
  await acionar(page, botao(/^Continuar com \d+ cômodos$/));
  const marcador = page.getByText(/^Cômodo \d+ de \d+$/);
  await expect(marcador).toHaveText(/^Cômodo 1 de \d+$/);
  const total = Number((await marcador.innerText()).match(/de (\d+)$/)?.[1]);
  for (let atual = 1; atual <= total; atual++) {
    await expect(marcador).toHaveText(`Cômodo ${atual} de ${total}`);
    await expect(titulo).toBeFocused();
    await acionar(page, atual < total ? botao(/^Próximo: /) : botao("Ver o resumo dos cômodos"));
  }

  await passo("O que tem na sua casa");
  await acionar(page, botao("Continuar"));
  await passo("Tem uma conta de luz em mãos?");
  await acionar(page, botao("Pular, não tenho a conta agora"));
  await expect(page).toHaveURL(/\/casa$/);
  await expect(page.getByText("Sua conta estimada por mês")).toBeVisible();
});

test.fixme("HIS-108 · P1 — no passo \"cidade\" o foco não passa pela busca antes de ir para o título", async ({ page }) => {
  // Hoje o foco começa na busca (autoFocus) e pula para o título entre 300 e 600 ms: quem começa a digitar logo
  // perde o foco no meio, e o leitor de tela anuncia duas coisas. Quando a HIS-108 corrigir, trocar fixme por test.
  await page.goto("/comecar");
  await page.locator("select#estado").selectOption("SP");
  // A troca de passo não recarrega a página: o ouvinte continua valendo no passo "cidade".
  await page.evaluate(() => {
    document.addEventListener("focusin", (e) => {
      if (e.target instanceof HTMLElement && e.target.id === "busca-cidade") document.body.dataset.e2eBuscaFocada = "sim";
    });
  });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.locator("body")).not.toHaveAttribute("data-e2e-busca-focada", "sim");
});

test.describe("com a casa salva", () => {
  test.beforeEach(async ({ context }) => {
    await semearCasa(context, lerFixture("casa-v2.json"));
  });

  /** Enter abre a folha, o foco fica dentro dela, Esc fecha e o foco volta para quem abriu. */
  async function folhaComTeclado(pagina: Page, gatilho: Locator): Promise<void> {
    await acionar(pagina, gatilho);
    await expect(dialogoAberto(pagina)).toBeVisible();
    await expect.poll(() => focoDentroDoDialogo(pagina), { message: "foco dentro da folha" }).toBe(true);
    await pagina.keyboard.press("Escape");
    await expect(dialogoAberto(pagina)).toHaveCount(0);
    await expect(gatilho, "o foco volta para quem abriu a folha").toBeFocused();
  }

  test("folhas com teclado: editor (acompanhamento e cômodos) e \"Anotar conta\"", async ({ page }) => {
    await page.goto("/casa");
    await expect(page.getByText("Sua conta estimada por mês")).toBeVisible();
    await folhaComTeclado(page, page.getByRole("button", { name: /Toque para ajustar\.$/ }).first());
    await folhaComTeclado(page, page.getByRole("button", { name: /^Anotar (outra )?conta$/ }));

    await page.goto("/casa/comodos");
    await folhaComTeclado(page, page.getByRole("button", { name: "Geladeira de 1 porta", exact: true }));
  });

  test("abas com teclado: Enter troca de aba e o contorno aparece", async ({ page }) => {
    await page.goto("/casa");
    await expect(page.getByText("Sua conta estimada por mês")).toBeVisible();
    const abas: [Aba, RegExp][] = [
      ["Cômodos", /\/casa\/comodos$/],
      ["Dicas", /\/casa\/dicas$/],
      ["Minha casa", /\/casa\/ajustes$/],
      ["Acompanhamento", /\/casa$/],
    ];
    for (const [nome, endereco] of abas) {
      await acionar(page, aba(page, nome));
      await expect(page).toHaveURL(endereco);
    }
  });
});

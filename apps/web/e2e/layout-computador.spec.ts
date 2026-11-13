/*
 * Layout para computador (HIS-112, L12; q2 e q4), só no projeto `computador`, com a largura escolhida em cada teste:
 * 390 px (celular), 1024 px (o corte `lg`), 1200 px (o container cheio), 1280 e 1440 px. O celular não pode mudar (o
 * q3, pixel a pixel, foi feito à parte numa cópia); aqui fica o que vale para sempre: container, áreas, cômodos em lista
 * + painel, ordem de foco, zoom, 68 caracteres, movimento reduzido e axe.
 */
import type { Locator, Page } from "@playwright/test";
import { analisarAcessibilidade, descreverViolacoes, violacoesQueReprovam } from "./apoio/axe";
import { lerFixture, semearCasa } from "./apoio/casa";
import { botaoDaLista } from "./apoio/telas";
import { expect, test } from "./apoio/teste";

const casa = lerFixture("casa-v2.json");
const ALTURA = 900;
const TELAS_COM_CASA = ["/casa", "/casa/comodos", "/casa/dicas", "/casa/ajustes"] as const;
const TITULOS: Record<(typeof TELAS_COM_CASA)[number] | "/comecar", string> = {
  "/casa": "Sua conta estimada por mês",
  "/casa/comodos": "Cômodos e aparelhos",
  "/casa/dicas": "Dicas e plano de economia",
  "/casa/ajustes": "Minha casa",
  "/comecar": "Em qual estado você mora?",
};
type Tela = keyof typeof TITULOS;

// Medidas e axe com movimento reduzido: sem ele, o axe mede o contraste no meio do `surgir` (D10 da HIS-002a).
test.use({ reducedMotion: "reduce" });
// Cada teste passa por várias larguras e telas.
test.describe.configure({ timeout: 120_000 });

/** Abre a tela já na largura pedida, confere o título e espera as animações finitas acabarem. */
async function abrir(pagina: Page, tela: Tela, largura: number): Promise<void> {
  await pagina.setViewportSize({ width: largura, height: ALTURA });
  await pagina.goto(tela);
  await expect(pagina.getByRole("heading", { level: 1 }).first()).toHaveText(TITULOS[tela]);
  await pagina.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getComputedTiming().iterations === Infinity),
  );
}

/** O container de 1200 px em volta do <main> (o próprio main na Casca; a Moldura no cadastro), ou `null`. */
async function medirContainer(pagina: Page) {
  return pagina.evaluate(() => {
    let atual: Element | null = document.querySelector("main");
    while (atual && getComputedStyle(atual).maxWidth !== "1200px") atual = atual.parentElement;
    if (!atual) return null;
    const r = atual.getBoundingClientRect();
    const largura = document.documentElement.clientWidth;
    return { largura: r.width, esquerda: r.left, direita: largura - r.right, recuo: parseFloat(getComputedStyle(atual).paddingLeft) };
  });
}

const caixa = async (local: Locator) => {
  const medida = await local.boundingBox();
  if (!medida) throw new Error("elemento sem caixa (oculto?)");
  return medida;
};

test.describe("com a casa salva", () => {
  test.beforeEach(async ({ context }) => {
    await semearCasa(context, casa);
  });

  for (const tela of TELAS_COM_CASA) {
    test(`container de até 75rem em ${tela} (critério 1)`, async ({ page }) => {
      for (const largura of [1024, 1100, 1200, 1440]) {
        await abrir(page, tela, largura);
        const medida = await medirContainer(page);
        expect(medida, `${tela} a ${largura} px: há um container de 1200 px em volta do main`).not.toBeNull();
        if (!medida) continue;
        expect(medida.largura, `${tela} a ${largura} px: largura do container`).toBeLessThanOrEqual(1200);
        if (largura <= 1200) {
          // Faixa vazia até o conteúdo = sobra fora do container + recuo dele; até 2rem (32 px) de cada lado.
          expect(medida.esquerda + medida.recuo, `${tela} a ${largura} px: faixa à esquerda`).toBeLessThanOrEqual(32);
          expect(medida.direita + medida.recuo, `${tela} a ${largura} px: faixa à direita`).toBeLessThanOrEqual(32);
        }
      }
    });
  }

  test("/casa: a conta em cima; Quem mais gasta à direita de Seus cômodos (critério 3)", async ({ page }) => {
    for (const largura of [1024, 1440]) {
      await abrir(page, "/casa", largura);
      const conta = await caixa(page.locator("section[aria-labelledby='titulo-conta']"));
      const comodos = await caixa(page.locator("section[aria-labelledby='titulo-comodos']"));
      const ranking = await caixa(page.locator("section[aria-labelledby='titulo-ranking']"));
      expect(conta.y + conta.height, `a ${largura} px: a conta termina acima dos cômodos`).toBeLessThanOrEqual(comodos.y);
      expect(ranking.x, `a ${largura} px: Quem mais gasta à direita`).toBeGreaterThan(comodos.x + comodos.width);
      expect(Math.round(ranking.width), `a ${largura} px: coluna lateral de 23,5rem`).toBe(376);
    }
  });

  test("/casa/comodos: tocar no 3º cômodo não rola, o foco fica no botão e o aria-current vai para ele (critério 4)", async ({ page }) => {
    await abrir(page, "/casa/comodos", 1440);
    await page.mouse.wheel(0, 300);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const antes = await page.evaluate(() => window.scrollY);
    const terceiro = casa.state.comodos[2]?.nome ?? "";
    await botaoDaLista(page, terceiro).click();
    await expect(botaoDaLista(page, terceiro)).toHaveAttribute("aria-current", "true");
    await expect(page.getByRole("navigation", { name: "Cômodos" }).locator("[aria-current]")).toHaveCount(1);
    await expect(page.getByRole("region", { name: terceiro, exact: true })).toBeVisible();
    await expect(botaoDaLista(page, terceiro)).toBeFocused();
    expect(await page.evaluate(() => window.scrollY), "trocar de cômodo não mexe na rolagem").toBe(antes);
  });

  test("/casa/comodos: Tab vai do Por cômodo à lista, a Adicionar cômodo e ao painel (L12)", async ({ page }) => {
    await abrir(page, "/casa/comodos", 1440);
    // As duas opções (Por cômodo e Painel geral) recebem Tab; a lista vem logo depois delas.
    await page.getByRole("radio", { name: "Painel geral" }).focus();
    const nomes: string[] = [];
    for (let i = 0; i < casa.state.comodos.length + 2; i++) {
      await page.keyboard.press("Tab");
      nomes.push(await page.evaluate(() => (document.activeElement?.textContent ?? "").trim().replace(/\s+/g, " ")));
    }
    const lista = nomes.slice(0, casa.state.comodos.length);
    casa.state.comodos.forEach((c, i) => expect(lista[i], `Tab ${i + 1}`).toMatch(new RegExp(`^${c.nome}`)));
    expect(nomes.at(-2)).toBe("Adicionar cômodo");
    expect(nomes.at(-1), "depois da lista, o painel").toBe("Editar cômodo");
  });

  test("/casa/comodos: #comodo-<id> abre aquele cômodo e nenhum id se repete", async ({ page }) => {
    const alvo = casa.state.comodos[3];
    if (!alvo) throw new Error("fixture sem 4º cômodo");
    await page.setViewportSize({ width: 1440, height: ALTURA });
    await page.goto(`/casa/comodos#comodo-${alvo.id}`);
    await expect(botaoDaLista(page, alvo.nome)).toHaveAttribute("aria-current", "true");
    await expect(page.getByRole("heading", { level: 2, name: alvo.nome, exact: true })).toBeVisible();
    const repetidos = await page.evaluate(() => {
      const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    });
    expect(repetidos).toEqual([]);
  });

  test("/casa/dicas: 2 colunas a 1024 px, 3 a 1280 px, plano à direita (critério 5)", async ({ page }) => {
    for (const [largura, colunas] of [
      [1024, 2],
      [1280, 3],
      [1440, 3],
    ] as const) {
      await abrir(page, "/casa/dicas", largura);
      const cartoes = page.locator("main ul").filter({ has: page.locator("li h2") }).first().locator(":scope > li");
      await expect(cartoes.first()).toBeVisible();
      const xs = await cartoes.evaluateAll((itens) => itens.map((li) => Math.round(li.getBoundingClientRect().left)));
      expect(new Set(xs).size, `a ${largura} px: colunas de dicas`).toBe(colunas);
      const plano = await caixa(page.getByRole("region", { name: "Seu plano de economia" }));
      expect(plano.x, `a ${largura} px: o plano fica à direita das dicas`).toBeGreaterThan(Math.max(...xs));
    }
  });

  test("/casa/ajustes: 2 colunas, Seus dados na coluna da direita", async ({ page }) => {
    await abrir(page, "/casa/ajustes", 1440);
    const ondeMora = await caixa(page.getByRole("heading", { name: "Onde você mora" }));
    const seusDados = await caixa(page.getByRole("heading", { name: "Seus dados" }));
    expect(seusDados.x).toBeGreaterThan(ondeMora.x + 200);
  });

  test("ordem de foco a 1440 px igual à do celular nas telas com uma coluna só no celular (critério 8)", async ({ page }) => {
    // Só dentro do <main>: a navegação das abas fica embaixo no celular desde antes (fora da HIS-112). Os cômodos
    // trocam de desenho de propósito (L4) e têm o teste próprio acima.
    for (const tela of ["/casa", "/casa/dicas", "/casa/ajustes"] as const) {
      const ordens: string[][] = [];
      for (const largura of [390, 1440]) {
        await abrir(page, tela, largura);
        ordens.push(await ordemDeFocoNoMain(page));
      }
      expect(ordens[0]?.length, `${tela}: há o que focar`).toBeGreaterThan(3);
      expect(ordens[1], `${tela}: ordem de foco a 1440 px × 390 px`).toEqual(ordens[0]);
    }
  });

  for (const tela of TELAS_COM_CASA) {
    test(`axe em ${tela} a 1024 e 1440 px (q4)`, async ({ page }) => {
      for (const largura of [1024, 1440]) {
        await abrir(page, tela, largura);
        const resultado = await analisarAcessibilidade(page);
        expect(resultado.passes.length).toBeGreaterThan(0);
        expect(descreverViolacoes(violacoesQueReprovam(resultado.violations)), `${tela} a ${largura} px`).toEqual([]);
      }
    });
  }

  test("nenhuma linha de texto corrido passa de 68 caracteres a 1440 px (critério 7)", async ({ page }) => {
    for (const tela of TELAS_COM_CASA) {
      await abrir(page, tela, 1440);
      expect(await linhasLargas(page), `${tela}: linhas mais largas que 68ch`).toEqual([]);
    }
  });

  test.describe("movimento reduzido (critério 9)", () => {
    test.use({ reducedMotion: "reduce" });

    test("trocar de cômodo não anima o painel", async ({ page }) => {
      await abrir(page, "/casa/comodos", 1440);
      await botaoDaLista(page, casa.state.comodos[2]?.nome ?? "").click();
      const painel = page.locator("section[aria-labelledby='titulo-painel-comodo']");
      await expect(painel.getByRole("heading", { level: 2 })).toHaveText(casa.state.comodos[2]?.nome ?? "");
      const animacoes = await painel.evaluate((p) => p.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length);
      expect(animacoes).toBe(0);
    });
  });

  for (const [largura, escala] of [
    [720, 2],
    [360, 4],
  ] as const) {
    test(`zoom de ${escala * 100}% a 1440 px (${largura} px): desenho do celular e sem rolagem para o lado (critério 10)`, async ({ page }) => {
      for (const tela of TELAS_COM_CASA) {
        await abrir(page, tela, largura);
        const larguras = await page.evaluate(() => ({ conteudo: document.documentElement.scrollWidth, janela: document.documentElement.clientWidth }));
        expect(larguras.conteudo, `${tela}: rola para o lado`).toBeLessThanOrEqual(larguras.janela);
        if (tela === "/casa/comodos") await expect(page.getByRole("navigation", { name: "Cômodos" })).toHaveCount(0);
        if (tela === "/casa") {
          const ranking = await caixa(page.locator("section[aria-labelledby='titulo-ranking']"));
          const comodos = await caixa(page.locator("section[aria-labelledby='titulo-comodos']"));
          expect(ranking.y, `${tela}: uma coluna só`).toBeGreaterThan(comodos.y);
        }
      }
    });
  }
});

test("/comecar: o painel Por que perguntamos aparece a 1024 px, muda com o passo e não existe na tela a 390 px (critério 6)", async ({ page }) => {
  const painel = page.getByRole("complementary");
  await abrir(page, "/comecar", 390);
  await expect(painel).toBeHidden();
  await abrir(page, "/comecar", 1024);
  await expect(painel).toBeVisible();
  const primeiro = await painel.innerText();
  const passo = await caixa(page.getByRole("heading", { level: 1 }));
  const lado = await caixa(painel);
  expect(lado.x, "o painel fica à direita do passo").toBeGreaterThan(passo.x + passo.width);
  expect(passo.width, "o passo tem até 34rem").toBeLessThanOrEqual(544);
  await page.locator("select#estado").selectOption("SP");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Qual é a sua cidade?");
  await expect(painel).not.toHaveText(primeiro);
  await expect(painel.getByRole("button")).toHaveCount(0); // só explica: nada para tocar lá dentro
});

test("/comecar: container, 68 caracteres, zoom e axe (critérios 1, 7, 10; q4)", async ({ page }) => {
  for (const largura of [1024, 1100, 1200, 1440]) {
    await abrir(page, "/comecar", largura);
    const medida = await medirContainer(page);
    expect(medida, `a ${largura} px: há um container de 1200 px em volta do main`).not.toBeNull();
    expect(medida?.largura ?? Infinity, `a ${largura} px`).toBeLessThanOrEqual(1200);
    if (largura <= 1200) {
      expect((medida?.esquerda ?? 0) + (medida?.recuo ?? 0), `a ${largura} px: faixa à esquerda`).toBeLessThanOrEqual(32);
      expect((medida?.direita ?? 0) + (medida?.recuo ?? 0), `a ${largura} px: faixa à direita`).toBeLessThanOrEqual(32);
    }
    if (largura >= 1024 && largura !== 1100) {
      const resultado = await analisarAcessibilidade(page);
      expect(resultado.passes.length).toBeGreaterThan(0);
      expect(descreverViolacoes(violacoesQueReprovam(resultado.violations)), `axe a ${largura} px`).toEqual([]);
    }
  }
  await abrir(page, "/comecar", 1440);
  expect(await linhasLargas(page)).toEqual([]);
  for (const largura of [720, 360]) {
    await abrir(page, "/comecar", largura);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `zoom a ${largura} px`).toBe(true);
    await expect(page.getByRole("complementary")).toBeHidden();
  }
});

test("/comecar: a ordem de foco a 1440 px é a do celular (critério 8)", async ({ page }) => {
  const ordens: string[][] = [];
  for (const largura of [390, 1440]) {
    await abrir(page, "/comecar", largura);
    ordens.push(await ordemDeFocoNoMain(page));
  }
  expect(ordens[1]).toEqual(ordens[0]);
});

/**
 * Linhas de texto (não caixas) mais largas que 68ch, em todo `p` visível do <main>: mede cada linha pelo `Range` e
 * compara com 68 vezes a largura do "0" na letra daquele parágrafo.
 */
async function linhasLargas(pagina: Page): Promise<string[]> {
  return pagina.evaluate(() =>
    [...document.querySelectorAll("main p")].flatMap((p) => {
      if (!(p instanceof HTMLElement) || p.offsetParent === null) return [];
      const regua = document.createElement("span");
      regua.style.cssText = "display:inline-block;width:68ch;visibility:hidden;position:absolute";
      p.append(regua);
      const limite = regua.getBoundingClientRect().width;
      regua.remove();
      const faixa = document.createRange();
      faixa.selectNodeContents(p);
      // Junta os pedaços de cada linha (mesmo topo) e mede da primeira à última letra.
      const linhas = new Map<number, { esquerda: number; direita: number }>();
      for (const r of faixa.getClientRects()) {
        if (r.width === 0) continue;
        const topo = Math.round(r.top);
        const linha = linhas.get(topo);
        linhas.set(topo, linha ? { esquerda: Math.min(linha.esquerda, r.left), direita: Math.max(linha.direita, r.right) } : { esquerda: r.left, direita: r.right });
      }
      const maior = Math.max(0, ...[...linhas.values()].map((l) => l.direita - l.esquerda));
      return maior > limite + 1 ? [`${Math.round(maior)} px > ${Math.round(limite)} px: ${(p.textContent ?? "").slice(0, 50)}`] : [];
    }),
  );
}

/** Nomes do que recebe foco dentro do <main>, apertando Tab a partir do começo da página. */
async function ordemDeFocoNoMain(pagina: Page): Promise<string[]> {
  await pagina.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await pagina.locator("body").focus();
  const nomes: string[] = [];
  let saiuDoMain = false;
  for (let i = 0; i < 150; i++) {
    await pagina.keyboard.press("Tab");
    const atual = await pagina.evaluate(() => {
      const ativo = document.activeElement;
      if (!ativo || ativo === document.body) return null;
      const nome = ativo.getAttribute("aria-label") ?? (ativo.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
      return { dentro: Boolean(ativo.closest("main")), nome: `${ativo.tagName.toLowerCase()}:${nome}` };
    });
    if (atual === null) break;
    if (atual.dentro) nomes.push(atual.nome);
    else if (nomes.length > 0) saiuDoMain = true;
    if (saiuDoMain) break;
  }
  return nomes;
}

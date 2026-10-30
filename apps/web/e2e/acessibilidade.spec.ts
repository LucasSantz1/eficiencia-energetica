/*
 * Acessibilidade (critério 3; D10; P-qa-4), em 390 e 1280 px: o axe nas 24 telas — as 7 páginas sem casa, 6 com
 * casa, os 7 passos do cadastro depois do estado, o painel geral dos cômodos e as 3 folhas. Reprova violação séria
 * ou crítica fora de `excecoes-axe.ts`; `moderate`/`minor` e `incomplete` (o axe pede revisão humana) vão como anexo.
 *
 * Antes da análise: movimento reduzido (sem ele o axe mede o contraste no meio da animação e acusa 1,08:1 que não
 * existe — medido no D10), a tela certa conferida (título ou texto, com ou sem casa) e `passes > 0`: "0 violações"
 * numa página em branco ou antes da hidratação seria pior que nenhum teste.
 */
import type { BrowserContext, Page } from "@playwright/test";
import {
  aplicarExcecoes,
  analisarAcessibilidade,
  chaveDaTela,
  descreverViolacoes,
  resolverExcecoes,
  TELAS_AXE,
  violacoesQueReprovam,
} from "./apoio/axe";
import { lerFixture, semearCasa } from "./apoio/casa";
import { escreverNoResumoDoCi } from "./apoio/resumo-do-ci";
import { dialogoAberto } from "./apoio/telas";
import { expect, test } from "./apoio/teste";
import { EXCECOES_AXE } from "./excecoes-axe";

type Abrir = (pagina: Page, contexto: BrowserContext) => Promise<void>;

const titulo = (pagina: Page) => pagina.getByRole("heading", { level: 1 });

/** Abre uma página e confere o título (`h1`) que prova que é a tela certa. */
const comTitulo =
  (rota: string, texto: string, comCasa: boolean): Abrir =>
  async (pagina, contexto) => {
    if (comCasa) await semearCasa(contexto, lerFixture("casa-v2.json"));
    await pagina.goto(rota);
    await expect(titulo(pagina)).toHaveText(texto);
  };

type Passo = "cidade" | "benefício" | "pessoas" | "cômodos" | "um cômodo" | "revisão" | "conta";

/** Anda pelo cadastro até `alvo` (sem casa), conferindo o título de cada passo. */
const passoDoCadastro =
  (alvo: Passo): Abrir =>
  async (pagina) => {
    const botao = (nome: string | RegExp) => pagina.getByRole("button", { name: nome, exact: typeof nome === "string" });
    await pagina.goto("/comecar");
    await pagina.locator("select#estado").selectOption("SP");
    await botao("Continuar").click();
    await expect(titulo(pagina)).toHaveText("Qual é a sua cidade?");
    await pagina.locator("#busca-cidade").fill("Presidente Prudente");
    const cidade = pagina.getByRole("radio", { name: "Presidente Prudente", exact: true });
    if (alvo === "cidade") return expect(cidade).toBeVisible();
    await cidade.click();
    await expect(titulo(pagina)).toHaveText("Sua família está no CadÚnico?");
    if (alvo === "benefício") return;
    await pagina.getByRole("radio", { name: /Sim, tenho Tarifa Social/ }).click();
    await expect(titulo(pagina)).toHaveText("Quantas pessoas moram na casa?");
    if (alvo === "pessoas") return;
    await botao("Continuar").click();
    await expect(titulo(pagina)).toHaveText("Quais cômodos a sua casa tem?");
    if (alvo === "cômodos") return;
    await botao(/^Continuar com \d+ cômodos$/).click();
    await expect(pagina.getByText(/^Cômodo 1 de \d+$/)).toBeVisible();
    if (alvo === "um cômodo") return;
    while (!(await botao("Ver o resumo dos cômodos").isVisible())) {
      const marcador = await pagina.getByText(/^Cômodo \d+ de \d+$/).innerText();
      await botao(/^Próximo: /).click();
      await expect(pagina.getByText(marcador, { exact: true })).toHaveCount(0);
    }
    await botao("Ver o resumo dos cômodos").click();
    await expect(titulo(pagina)).toHaveText("O que tem na sua casa");
    if (alvo === "revisão") return;
    await botao("Continuar").click();
    await expect(titulo(pagina)).toHaveText("Tem uma conta de luz em mãos?");
  };

/** Abre uma folha do acompanhamento (com casa) e confere que o diálogo está aberto. */
const folha =
  (abrirFolha: (pagina: Page) => Promise<void>): Abrir =>
  async (pagina, contexto) => {
    await semearCasa(contexto, lerFixture("casa-v2.json"));
    await pagina.goto("/casa");
    await expect(titulo(pagina)).toHaveText("Sua conta estimada por mês");
    await abrirFolha(pagina);
    await expect(dialogoAberto(pagina)).toBeVisible();
  };

const ABRIR: Record<string, Abrir> = {
  "/ · sem casa": async (pagina) => {
    await pagina.goto("/");
    await expect(titulo(pagina)).toHaveText("A conta de luz, cômodo por cômodo.");
    await expect(pagina.getByRole("link", { name: "Calcular a minha conta" }).first()).toBeVisible();
  },
  "/comecar · sem casa": comTitulo("/comecar", "Em qual estado você mora?", false),
  "/casa · sem casa": comTitulo("/casa", "Vamos cadastrar a sua casa", false),
  "/casa/comodos · sem casa": comTitulo("/casa/comodos", "Vamos cadastrar a sua casa", false),
  "/casa/dicas · sem casa": comTitulo("/casa/dicas", "Vamos cadastrar a sua casa", false),
  "/casa/ajustes · sem casa": comTitulo("/casa/ajustes", "Vamos cadastrar a sua casa", false),
  "/sobre · sem casa": comTitulo("/sobre", "Sobre o projeto", false),
  "/ · com casa": async (pagina, contexto) => {
    await semearCasa(contexto, lerFixture("casa-v2.json"));
    await pagina.goto("/");
    await expect(titulo(pagina)).toHaveText("A conta de luz, cômodo por cômodo.");
    await expect(pagina.getByRole("link", { name: "Ver a minha casa" }).first()).toBeVisible();
  },
  "/comecar · com casa": comTitulo("/comecar", "Você já cadastrou a sua casa", true),
  "/casa · com casa": comTitulo("/casa", "Sua conta estimada por mês", true),
  "/casa/comodos · com casa": comTitulo("/casa/comodos", "Cômodos e aparelhos", true),
  "/casa/dicas · com casa": comTitulo("/casa/dicas", "Dicas e plano de economia", true),
  "/casa/ajustes · com casa": comTitulo("/casa/ajustes", "Minha casa", true),
  "/comecar · passo cidade": passoDoCadastro("cidade"),
  "/comecar · passo benefício": passoDoCadastro("benefício"),
  "/comecar · passo pessoas": passoDoCadastro("pessoas"),
  "/comecar · passo cômodos": passoDoCadastro("cômodos"),
  "/comecar · passo um cômodo": passoDoCadastro("um cômodo"),
  "/comecar · passo revisão": passoDoCadastro("revisão"),
  "/comecar · passo conta": passoDoCadastro("conta"),
  "/casa/comodos?visao=geral · com casa": async (pagina, contexto) => {
    await comTitulo("/casa/comodos?visao=geral", "Cômodos e aparelhos", true)(pagina, contexto);
    await expect(pagina.getByRole("radio", { name: "Painel geral" })).toBeChecked();
  },
  "/casa · folha editor de aparelho": folha((p) => p.getByRole("button", { name: /Toque para ajustar\.$/ }).first().click()),
  "/casa · folha anotar conta": folha((p) => p.getByRole("button", { name: /^Anotar (outra )?conta$/ }).click()),
  "/casa · folha anotar leitura": folha(async (p) => {
    await p.getByRole("radio", { name: "Relógio de luz" }).click();
    await p.getByRole("button", { name: /^Anotar leitura/ }).click(); // "Anotar leitura de hoje" quando já há leitura
  }),
};

// Cada tela da lista tem como ser aberta, e nada sobra: falha ao carregar o arquivo, antes de rodar.
const chaves = TELAS_AXE.map(chaveDaTela);
const semAbrir = chaves.filter((c) => !(c in ABRIR));
const sobrando = Object.keys(ABRIR).filter((c) => !chaves.includes(c));
if (semAbrir.length || sobrando.length) throw new Error(`TELAS_AXE × ABRIR: sem abrir ${semAbrir.join(", ")}; sobrando ${sobrando.join(", ")}`);

/** Rede quieta e nenhuma animação finita rodando (com movimento reduzido, terminam na hora). */
async function esperarTelaParada(pagina: Page): Promise<void> {
  await pagina.waitForLoadState("networkidle");
  await pagina.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getComputedTiming().iterations === Infinity),
  );
}

test.describe("axe", () => {
  test.use({ reducedMotion: "reduce" });

  for (const tela of TELAS_AXE) {
    const chave = chaveDaTela(tela);
    test(`axe · ${chave}`, async ({ page, context }) => {
      const info = test.info();
      const abrir = ABRIR[chave];
      if (!abrir) throw new Error(`sem como abrir ${chave}`);
      await abrir(page, context);
      await esperarTelaParada(page);

      const resultado = await analisarAcessibilidade(page);
      expect(resultado.passes.length, "o axe precisa ter conferido alguma coisa").toBeGreaterThan(0);

      const graves = violacoesQueReprovam(resultado.violations);
      const excecoes = EXCECOES_AXE.filter((e) => e.pagina === tela.pagina && e.estado === tela.estado);
      const { violacoes, problemas, aplicadas } = aplicarExcecoes(graves, await resolverExcecoes(page, graves, excecoes));

      const informativas = resultado.violations.filter((v) => !graves.includes(v));
      if (informativas.length) await info.attach("axe-moderadas-e-menores.txt", { body: descreverViolacoes(informativas).join("\n"), contentType: "text/plain" });
      if (resultado.incomplete.length) await info.attach("axe-incomplete.txt", { body: descreverViolacoes(resultado.incomplete).join("\n"), contentType: "text/plain" });
      if (aplicadas.length) await info.attach("axe-excecoes-aplicadas.json", { body: JSON.stringify(aplicadas, null, 2), contentType: "application/json" });
      escreverNoResumoDoCi(
        `- axe · ${chave} (${info.project.name}): ${aplicadas.length} exceção(ões) aplicada(s)` +
          `${aplicadas.map((e) => ` \`${e.regra}\` em \`${e.alvo}\` → ${e.historia}`).join(";")}; ` +
          `${resultado.incomplete.length} para revisão humana (incomplete)`,
      );

      expect([...problemas, ...descreverViolacoes(violacoes)], "violações sérias ou críticas fora de excecoes-axe.ts").toEqual([]);
    });
  }
});

test.describe("zoom de 200% em 390 px (195 × 422 px de CSS)", () => {
  test.use({ viewport: { width: 195, height: 422 }, deviceScaleFactor: 2 });

  test.fixme("HIS-107 · nenhuma página rola para o lado com zoom de 200% (WCAG 1.4.10)", async ({ page, context }) => {
    // Hoje / (254 px de conteúdo em 195), /casa e /casa/dicas (211 px) rolam na horizontal (P2 da HIS-001).
    // Quando a HIS-107 corrigir, trocar fixme por test.
    await semearCasa(context, lerFixture("casa-v2.json"));
    for (const rota of ["/", "/comecar", "/casa", "/casa/comodos", "/casa/comodos?visao=geral", "/casa/dicas", "/casa/ajustes", "/sobre"]) {
      await page.goto(rota);
      await page.waitForLoadState("networkidle");
      const larguras = await page.evaluate(() => ({ conteudo: document.documentElement.scrollWidth, janela: document.documentElement.clientWidth }));
      expect.soft(larguras.conteudo, `${rota}: largura do conteúdo × janela de ${larguras.janela} px`).toBeLessThanOrEqual(larguras.janela);
    }
  });
});

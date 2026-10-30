/*
 * Negativos permanentes: cada barreira do e2e precisa reprovar o que deve (plano de testes do qa, N1–N8; D16 P-qa-6).
 * Cada negativo usa `test.fail()`: se a barreira deixar de reprovar, o teste vira "Expected to fail, but passed" e a
 * execução fica vermelha. Cada um tem um controle, que prova que a falha vem da barreira e não da página de ensaio.
 * Usam `page.setContent` com uma página mínima, menos o N7, que precisa das transições do site (só no projeto celular).
 */
import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import {
  analisarAcessibilidade,
  aplicarExcecoes,
  chaveDaTela,
  descreverViolacoes,
  resolverExcecoes,
  TELAS_AXE,
  violacoesQueReprovam,
} from "./apoio/axe";
import { EXCECOES_AXE, type ExcecaoAxe } from "./excecoes-axe";
import { lerFixture, semearCasa } from "./apoio/casa";
import { compararPeso, LIMITE_JS_DO_HTML, LIMITE_TOTAL_COM_PREFETCH } from "./apoio/peso";
import { aba } from "./apoio/telas";
import { expect, pedidoPermitido, test } from "./apoio/teste";
import { contarTransicoes, duracoesDasTransicoes } from "./apoio/transicoes";

const PAGINA_LIMPA = `<!doctype html><html lang="pt-BR"><head><title>Ensaio</title></head>
<body><main><h1>Ensaio das barreiras</h1><button type="button">Salvar conta</button></main></body></html>`;

test.describe("console e página (N1, N2)", () => {
  test("controle: página limpa passa", async ({ page }) => {
    await page.setContent(PAGINA_LIMPA);
    await page.evaluate(() => console.log("mensagem comum não reprova"));
  });

  test("N1 · negativo: console.error reprova o teste", async ({ page }) => {
    test.fail(true, "a fixture de console precisa reprovar console.error");
    await page.setContent(PAGINA_LIMPA);
    await page.evaluate(() => console.error("plantado pelo teste de sanidade"));
  });

  test("N2 · negativo: erro de página reprova o teste", async ({ page }) => {
    test.fail(true, "a fixture precisa reprovar pageerror");
    await page.setContent(PAGINA_LIMPA);
    const erro = page.waitForEvent("pageerror");
    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error("plantado pelo teste de sanidade");
      });
    });
    await erro;
  });
});

test.describe("axe (N3)", () => {
  test("controle: botão com nome passa no axe", async ({ page }) => {
    await page.setContent(PAGINA_LIMPA);
    const resultado = await analisarAcessibilidade(page);
    expect(resultado.passes.length, "o axe precisa ter conferido alguma coisa").toBeGreaterThan(0);
    expect(descreverViolacoes(violacoesQueReprovam(resultado.violations))).toEqual([]);
  });

  test("N3 · negativo: botão sem nome é violação crítica (button-name)", async ({ page }) => {
    test.fail(true, "o axe precisa acusar button-name");
    await page.setContent(PAGINA_LIMPA.replace(">Salvar conta</button>", "></button>"));
    const resultado = await analisarAcessibilidade(page);
    expect(descreverViolacoes(violacoesQueReprovam(resultado.violations))).toEqual([]);
  });
});

test.describe("axe: contraste e exceções (N4, N5)", () => {
  // O caso real da `/`: texto branco sobre a faixa D (2,85:1).
  const CONTRASTE_RUIM = '<p class="pilula" style="color:#fff;background:#ec7a1a">19%</p>';
  const excecao = (alvo: string): ExcecaoAxe => ({
    regra: "color-contrast",
    pagina: "/",
    estado: "sem casa",
    alvo,
    historia: "HIS-110",
    motivo: "ensaio do sanidade",
  });
  /** Analisa a página de ensaio e aplica as exceções, como o acessibilidade.spec.ts faz. */
  async function restoDoAxe(page: Page, html: string, excecoes: readonly ExcecaoAxe[]) {
    await page.setContent(PAGINA_LIMPA.replace("<h1>Ensaio das barreiras</h1>", `<h1>Ensaio das barreiras</h1>${html}`));
    const graves = violacoesQueReprovam((await analisarAcessibilidade(page)).violations);
    const { violacoes, problemas } = aplicarExcecoes(graves, await resolverExcecoes(page, graves, excecoes));
    return [...problemas, ...descreverViolacoes(violacoes)];
  }

  test("N4 · negativo: texto branco no laranja da faixa D é violação séria (color-contrast)", async ({ page }) => {
    test.fail(true, "o axe precisa acusar color-contrast");
    expect(await restoDoAxe(page, CONTRASTE_RUIM, [])).toEqual([]);
  });

  test("controle: a violação coberta por uma exceção de 1 elemento sai da lista", async ({ page }) => {
    expect(await restoDoAxe(page, CONTRASTE_RUIM, [excecao("p.pilula")])).toEqual([]);
  });

  test("N5 · negativo: exceção sem violação é \"exceção velha\"", async ({ page }) => {
    test.fail(true, "exceção que não cobre nada precisa reprovar");
    expect(await restoDoAxe(page, "", [excecao("button")])).toEqual([]);
  });

  test("N5 · negativo: a mesma regra em outro elemento continua reprovando", async ({ page }) => {
    test.fail(true, "a exceção cobre um elemento só");
    const dois = `${CONTRASTE_RUIM}<p class="outra" style="color:#fff;background:#ec7a1a">47%</p>`;
    expect(await restoDoAxe(page, dois, [excecao("p.pilula")])).toEqual([]);
  });

  test("N5 · negativo: exceção cujo alvo acha 2 elementos reprova (Ra12)", async ({ page }) => {
    test.fail(true, "exceção que cobre mais de um elemento precisa reprovar");
    const dois = `${CONTRASTE_RUIM}<p class="pilula" style="color:#fff;background:#ec7a1a">47%</p>`;
    expect(await restoDoAxe(page, dois, [excecao("p.pilula")])).toEqual([]);
  });

  test("controle: toda exceção da lista é de uma tela do axe e cita uma história do planejamento", () => {
    const planejamento = readFileSync(new URL("../../../docs/planejamento.md", import.meta.url), "utf8");
    const telas = TELAS_AXE.map(chaveDaTela);
    for (const e of EXCECOES_AXE) {
      expect.soft(telas, `tela da exceção ${e.alvo}`).toContain(chaveDaTela(e));
      expect.soft(planejamento, `${e.historia} em docs/planejamento.md`).toContain(`| ${e.historia} |`);
      expect.soft(e.motivo.length, `motivo da exceção ${e.alvo}`).toBeGreaterThan(0);
    }
  });
});

test.describe("peso de JS (N6, função pura compararPeso)", () => {
  const REFERENCIA = { "/sobre": { jsDoHtml: 100_000, totalComPrefetch: 200_000 } };
  const medir = (jsDoHtml: number, totalComPrefetch: number) => ({ "/sobre": { jsDoHtml, totalComPrefetch } });

  test("controle: exatamente no limite passa; muito abaixo vira anotação, não erro", () => {
    const noLimite = compararPeso(REFERENCIA, medir(100_000 + LIMITE_JS_DO_HTML, 200_000 + LIMITE_TOTAL_COM_PREFETCH));
    expect(noLimite.erros).toEqual([]);
    const maisLeve = compararPeso(REFERENCIA, medir(100_000 - 1025, 200_000));
    expect(maisLeve.erros).toEqual([]);
    expect(maisLeve.anotacoes).toHaveLength(1);
  });

  test("N6 · negativo: JS do HTML 1 B acima do limite (+1 025) reprova", () => {
    test.fail(true, "compararPeso precisa reprovar o 11a acima do limite");
    expect(compararPeso(REFERENCIA, medir(100_000 + 1025, 200_000)).erros).toEqual([]);
  });

  test("N6 · negativo: total com prefetch 1 B acima do limite (+2 049) reprova", () => {
    test.fail(true, "compararPeso precisa reprovar o 11b acima do limite");
    expect(compararPeso(REFERENCIA, medir(100_000, 200_000 + 2049)).erros).toEqual([]);
  });

  test("N6 · negativo: rota medida sem referência reprova", () => {
    test.fail(true, "compararPeso precisa reprovar rota sem referência");
    expect(compararPeso({}, medir(100_000, 200_000)).erros).toEqual([]);
  });

  test("N6 · negativo: referência sem medida reprova", () => {
    test.fail(true, "compararPeso precisa reprovar número no JSON que ninguém confere");
    expect(compararPeso({ ...REFERENCIA, "/velha": { jsDoHtml: 1 } }, medir(100_000, 200_000)).erros).toEqual([]);
  });
});

test.describe("movimento reduzido (N7, controle invertido)", () => {
  // O transicoes.spec.ts afirma "duração 0 com reduce". Isso só prova algo se, sem reduce, a mesma medida achar
  // animação de verdade — senão um invólucro quebrado (que nunca lê nada, ou lê sempre 0) passaria.
  test.use({ reducedMotion: "no-preference" });

  test("N7 · sem movimento reduzido, a troca de aba anima por mais de 1 ms", async ({ page, context }) => {
    await semearCasa(context, lerFixture("casa-v2.json"));
    await contarTransicoes(context);
    await page.goto("/casa");
    await aba(page, "Cômodos").click();
    await expect(page).toHaveURL(/\/casa\/comodos$/);
    await expect.poll(async () => (await duracoesDasTransicoes(page)).length).toBe(1);
    expect(Math.max(...(await duracoesDasTransicoes(page)).flat())).toBeGreaterThan(1);
  });
});

test.describe("nada sai do aparelho (N8)", () => {
  test("controle: dados embutidos (data:) podem ser lidos", async ({ page }) => {
    await page.setContent(PAGINA_LIMPA);
    expect(await page.evaluate(async () => (await fetch("data:text/plain,ok")).text())).toBe("ok");
  });

  test("controle: só a origem do site é liberada", ({ baseURL }) => {
    const origem = new URL(baseURL ?? "http://127.0.0.1:1").origin;
    expect(pedidoPermitido(`${origem}/dados/tarifas.json`, origem)).toBe(true);
    expect(pedidoPermitido("blob:http://127.0.0.1/abc", origem)).toBe(true);
    // Mesmo computador, outra porta, é outro servidor: não é o site.
    expect(pedidoPermitido("http://127.0.0.1:1/x", origem)).toBe(false);
    expect(pedidoPermitido("https://exemplo.com/x", origem)).toBe(false);
  });

  test("N8 · negativo: pedido para outro endereço reprova o teste", async ({ page }) => {
    test.fail(true, "a fixture de rede precisa reprovar pedido para fora do site");
    // A resposta é inventada aqui (nada sai de verdade) e libera CORS, para não haver erro de console:
    // a única coisa que pode reprovar este teste é o pedido em si.
    await page.route("https://exemplo.com/**", (rota) =>
      rota.fulfill({ status: 200, body: "ok", headers: { "access-control-allow-origin": "*" } }),
    );
    await page.setContent(PAGINA_LIMPA);
    expect(await page.evaluate(async () => (await fetch("https://exemplo.com/x")).text())).toBe("ok");
  });
});

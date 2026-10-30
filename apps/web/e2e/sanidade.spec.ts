/*
 * Negativos permanentes: cada barreira do e2e precisa reprovar o que deve (plano de testes do qa, N1–N8; D16 P-qa-6).
 * Cada negativo usa `test.fail()`: se a barreira deixar de reprovar, o teste vira "Expected to fail, but passed" e a
 * execução fica vermelha. Cada um tem um controle, que prova que a falha vem da barreira e não da página de ensaio.
 * Não usam o site: `page.setContent` com uma página mínima (só no projeto celular).
 */
import { analisarAcessibilidade, descreverViolacoes, violacoesQueReprovam } from "./apoio/axe";
import { expect, pedidoPermitido, test } from "./apoio/teste";

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

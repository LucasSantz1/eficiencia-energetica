/*
 * CSP de verdade (HIS-117). O cabecalhos.spec confere o texto exato; este confere o que o texto faz no navegador:
 *   1. o `script-src` não tem hash nem nonce junto com `'unsafe-inline'` (o navegador ignoraria o `'unsafe-inline'` e
 *      as páginas parariam de funcionar: provado na HIS-117), e o `script-src-attr 'none'` continua lá;
 *   2. nenhuma página tem violação de CSP no console, em 390 e 1440 px, e todas hidratam;
 *   3. atributo de evento injetado na página (`<img onerror>`) não executa.
 * Quando o `'unsafe-inline'` sair do `script-src` (nonce no E4), troque o teste 1 por "script-src sem 'unsafe-inline'".
 * Escolhe a largura em cada teste: roda só no projeto celular (playwright.config.ts).
 */
import { lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

const ROTAS = ["/", "/comecar", "/casa", "/casa/comodos", "/casa/dicas", "/casa/ajustes", "/sobre", "/tarifa-social"];
const LARGURAS = [390, 1440];

/** Uma diretiva da CSP, já separada em fontes (`script-src 'self' x` → `['self', x]`). */
function diretiva(csp: string, nome: string): string[] | undefined {
  const achada = csp.split(";").map((parte) => parte.trim().split(/\s+/)).find(([chave]) => chave === nome);
  return achada?.slice(1);
}

test("script-src: 'unsafe-inline' sem hash nem nonce, e atributo de evento proibido", async ({ request }) => {
  for (const caminho of ["/", "/casa", "/nao-existe"]) {
    const csp = (await request.get(caminho)).headers()["content-security-policy"] ?? "";
    const scriptSrc = diretiva(csp, "script-src") ?? [];
    expect.soft(scriptSrc, `script-src em ${caminho}`).toContain("'self'");
    if (scriptSrc.includes("'unsafe-inline'")) {
      const hashOuNonce = scriptSrc.filter((fonte) => /^'(sha(256|384|512)|nonce)-/.test(fonte));
      expect.soft(hashOuNonce, `hash/nonce com 'unsafe-inline' em ${caminho}`).toEqual([]);
    }
    expect.soft(scriptSrc, `script-src sem 'strict-dynamic' em ${caminho}`).not.toContain("'strict-dynamic'");
    expect.soft(diretiva(csp, "script-src-attr"), `script-src-attr em ${caminho}`).toEqual(["'none'"]);
    expect.soft(diretiva(csp, "script-src-elem"), `script-src-elem em ${caminho}`).toBeUndefined();
  }
});

for (const largura of LARGURAS) {
  test(`nenhuma violação de CSP e todas as páginas hidratam em ${largura} px`, async ({ page, context }) => {
    await semearCasa(context, lerFixture("casa-v2.json"));
    await page.setViewportSize({ width: largura, height: 900 });
    const violacoes: string[] = [];
    page.on("console", (mensagem) => {
      if (/Content Security Policy/i.test(mensagem.text())) violacoes.push(`${page.url()}: ${mensagem.text()}`);
    });
    for (const rota of ROTAS) {
      await page.goto(rota);
      await page.waitForLoadState("networkidle");
      // Sem o script inline do Next (bloqueado pela CSP), `__next_f` não existe e a página não responde ao toque.
      expect.soft(await page.evaluate(() => "__next_f" in window), `${rota} hidratou`).toBe(true);
    }
    expect(violacoes).toEqual([]);
  });
}

test("atributo de evento injetado na página não executa (script-src-attr 'none')", async ({ page, errosEsperados }) => {
  errosEsperados.push(/script-src-attr/, /404/);
  await page.goto("/sobre");
  const executou = await page.evaluate(async () => {
    const marca = "csp-his117";
    const imagem = document.createElement("img");
    imagem.setAttribute("onerror", `document.documentElement.dataset.sonda = "${marca}"`);
    imagem.src = "/nao-existe.png";
    document.body.append(imagem);
    await new Promise((resolver) => setTimeout(resolver, 500));
    return document.documentElement.dataset.sonda === marca;
  });
  expect(executou).toBe(false);
});

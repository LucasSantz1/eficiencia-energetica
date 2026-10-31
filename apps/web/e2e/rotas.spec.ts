/*
 * Rotas do site de produção (cobertura 7–9 do plano do qa): todas respondem, continuam pré-renderizadas, a `/`
 * revalida uma vez por dia e o endereço antigo `/casa/aparelhos` leva aos cômodos. Não depende da largura: só celular.
 */
import { readFileSync } from "node:fs";
import { lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

const ROTAS = ["/", "/comecar", "/casa", "/casa/comodos", "/casa/dicas", "/casa/ajustes", "/casa/aparelhos", "/sobre"];

/** `.next/prerender-manifest.json` do build que o `next start` está servindo (pnpm build antes). */
function rotasPreRenderizadas(): Record<string, { initialRevalidateSeconds?: number | false }> {
  const manifesto: unknown = JSON.parse(readFileSync(new URL("../.next/prerender-manifest.json", import.meta.url), "utf8"));
  if (typeof manifesto !== "object" || manifesto === null || !("routes" in manifesto)) {
    throw new Error("prerender-manifest.json sem `routes`: rode pnpm build antes");
  }
  const { routes } = manifesto;
  if (typeof routes !== "object" || routes === null) throw new Error("prerender-manifest.json com `routes` inválido");
  return Object.fromEntries(Object.entries(routes));
}

test("as 8 rotas respondem 200", async ({ request }) => {
  for (const rota of ROTAS) {
    const resposta = await request.get(rota, { maxRedirects: 0 });
    expect.soft(resposta.status(), `status de ${rota}`).toBe(200);
  }
});

test("as 8 rotas continuam pré-renderizadas e a / revalida a cada 86400 s (1 dia)", () => {
  const rotas = rotasPreRenderizadas();
  for (const rota of ROTAS) expect.soft(Object.keys(rotas), `${rota} no prerender-manifest.json`).toContain(rota);
  // app/page.tsx: os números da página inicial vêm dos dados da ANEEL, atualizados uma vez por dia.
  expect(rotas["/"]?.initialRevalidateSeconds).toBe(86400);
});

test("/casa/aparelhos é página estática que redireciona para /casa/comodos (como no main)", async ({ request }) => {
  const resposta = await request.get("/casa/aparelhos", { maxRedirects: 0 });
  expect(resposta.status()).toBe(200);
  expect((await resposta.text()).match(/NEXT_REDIRECT;\w+;([^;]+);/)?.[1]).toBe("/casa/comodos");
});

// Com casa, como no main: sem casa a Casca mostra "Vamos cadastrar a sua casa" no lugar da página e o
// redirecionamento (que está dentro da página) não roda — conferido na HIS-002a, A1.
test("com casa, o navegador termina em /casa/comodos ao abrir /casa/aparelhos", async ({ page, context }) => {
  await semearCasa(context, lerFixture("casa-v2.json"));
  await page.goto("/casa/aparelhos");
  await expect(page).toHaveURL((url) => url.pathname === "/casa/comodos");
  await expect(page.locator('section[id^="comodo-"]')).toHaveCount(6);
});

/*
 * Conta opcional e link de convidado (E4, ADR-007), sem Supabase ligado (como no CI e em qualquer site sem as
 * variáveis): a conta fica desligada, o site funciona igual, e as rotas /api barram o que devem barrar. O fluxo com o
 * Supabase de verdade é conferido à mão (docs/sistema/conta-supabase.md, passo 6).
 */
import { lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

test("sem as variáveis da conta: /api/conta diz 'desligada', sem cookie e sem cache", async ({ request }) => {
  const resposta = await request.get("/api/conta");
  expect(resposta.status()).toBe(200);
  expect(await resposta.json()).toEqual({ conta: "desligada" });
  expect(resposta.headers()["cache-control"]).toBe("no-store");
  expect(resposta.headers()["set-cookie"]).toBeUndefined();
});

test("rotas que mudam algo: só deste site, só JSON, com teto de tamanho", async ({ request, baseURL }) => {
  const deFora = await request.post("/api/conta/entrar", { headers: { Origin: "https://outro-site.exemplo", "Content-Type": "application/json" }, data: { email: "a@b.co", senha: "12345678" } });
  expect(deFora.status()).toBe(403);
  const semOrigem = await request.post("/api/conta/entrar", { headers: { "Content-Type": "application/json" }, data: { email: "a@b.co", senha: "12345678" } });
  expect(semOrigem.status()).toBe(403);
  const formulario = await request.post("/api/conta/entrar", { headers: { Origin: baseURL ?? "", "Content-Type": "application/x-www-form-urlencoded" }, data: "email=a" });
  expect(formulario.status()).toBe(415);
  const grande = await request.put("/api/casa", { headers: { Origin: baseURL ?? "", "Content-Type": "application/json" }, data: JSON.stringify({ x: "a".repeat(700_000) }) });
  expect(grande.status()).toBe(413);
  const lista = await request.post("/api/conta/entrar", { headers: { Origin: baseURL ?? "", "Content-Type": "application/json" }, data: "[1,2]" });
  expect(lista.status()).toBe(400);
});

test("/entrar avisa que a conta não está ligada e deixa seguir sem conta", async ({ page }) => {
  await page.goto("/entrar");
  await expect(page.getByText("A conta ainda não está ligada neste site.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Voltar para a minha casa" })).toBeVisible();
});

test("Minha casa sem a conta ligada: a seção 'Sua conta' não aparece", async ({ page, context }) => {
  await semearCasa(context, { ...lerFixture("casa-v2.json"), version: 3 });
  await page.goto("/casa/ajustes");
  // No celular, cada ajuste é uma linha da lista; no computador, um cartão com título.
  await expect(page.getByText("Usar sem internet", { exact: true }).filter({ visible: true })).toHaveCount(1);
  await expect(page.getByText("Sua conta", { exact: true })).toHaveCount(0);
});

test("convidado sem código no endereço: pede o link, sem chamar o servidor", async ({ page }) => {
  const pedidos: string[] = [];
  page.on("request", (pedido) => pedidos.push(new URL(pedido.url()).pathname));
  await page.goto("/convidado");
  await expect(page.getByText("Abra esta página pelo link que você recebeu.")).toBeVisible();
  expect(pedidos).not.toContain("/api/convidado");
});

test("convidado com código: o código vai no corpo do POST, nunca no endereço do pedido", async ({ page, errosEsperados }) => {
  errosEsperados.push(/status of 503/);
  const codigo = "a".repeat(43);
  const pedido = page.waitForRequest((p) => p.url().endsWith("/api/convidado"));
  await page.goto(`/convidado#${codigo}`);
  const feito = await pedido;
  expect(feito.method()).toBe("POST");
  expect(feito.url()).not.toContain(codigo);
  expect(feito.postDataJSON()).toEqual({ codigo });
  // Sem a conta ligada, o servidor responde 503 e a tela diz em palavras simples.
  await expect(page.getByText("A conta ainda não está ligada neste site.")).toBeVisible();
});

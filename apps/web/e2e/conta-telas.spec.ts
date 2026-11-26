/*
 * As telas da conta com o servidor simulado no navegador (page.route): conta conectada, links de convidado, a casa do
 * convidado e a escolha entre duas casas (E4, ADR-007). O servidor de verdade é testado em test/conta-servidor.test.ts
 * (casos de uso) e em supabase/testes/rls.sql (banco).
 */
import type { Page } from "@playwright/test";
import { analisarAcessibilidade, descreverViolacoes, violacoesQueReprovam } from "./apoio/axe";
import { irAteAConta } from "./apoio/cadastro";
import { casaSalva, lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

test.use({ reducedMotion: "reduce" });

const CASA = { ...lerFixture("casa-v2.json"), version: 3 };
const CODIGO = "c".repeat(43);

async function simularConta(page: Page, casaNaConta: unknown) {
  const gravadas: unknown[] = [];
  await page.route("**/api/conta", (rota) => rota.fulfill({ json: { conta: "conectada", email: "ana@exemplo.org" } }));
  await page.route("**/api/casa", async (rota) => {
    if (rota.request().method() === "PUT") {
      gravadas.push(rota.request().postDataJSON());
      return rota.fulfill({ json: { atualizadaEm: "2026-11-25T12:00:01.000Z" } });
    }
    return rota.fulfill({ json: casaNaConta ? { casa: casaNaConta, versaoDoFormato: 3, atualizadaEm: "2026-11-25T12:00:00.000Z" } : { casa: null } });
  });
  const convites: { id: string; nome?: string; criadoEm: string }[] = [];
  await page.route("**/api/convites", async (rota) => {
    const metodo = rota.request().method();
    if (metodo === "POST") {
      const convite = { id: "11111111-1111-4111-8111-111111111111", nome: rota.request().postDataJSON().nome || undefined, criadoEm: "2026-11-25T12:00:00.000Z" };
      convites.push(convite);
      return rota.fulfill({ json: { convite, codigo: CODIGO } });
    }
    if (metodo === "DELETE") {
      convites.splice(0, convites.length);
      return rota.fulfill({ json: { ok: true } });
    }
    return rota.fulfill({ json: { convites } });
  });
  return { gravadas };
}

test("conectada: a casa só vai para a conta depois do 'Guardar na conta' (A1), e o link de convidado aparece uma vez", async ({ page, context }) => {
  await semearCasa(context, CASA);
  const { gravadas } = await simularConta(page, null);
  await page.goto("/casa/ajustes");
  const secao = page.getByRole("region", { name: "Sua conta" });
  await expect(secao.getByText("ana@exemplo.org")).toBeVisible();
  // A conta está vazia e o aparelho tem casa: pergunta, com o e-mail à vista, e nada vai antes do toque.
  await expect(page.getByText("Guardar a casa deste aparelho na conta ana@exemplo.org?")).toBeVisible();
  await page.waitForTimeout(2500);
  expect(gravadas).toHaveLength(0);
  await page.getByRole("button", { name: "Guardar na conta" }).click();
  await expect(secao.getByText("A sua casa está guardada na conta.")).toBeVisible();
  expect(gravadas).toHaveLength(1);

  await secao.getByLabel("Para quem é? (opcional)").fill("Mãe");
  await secao.getByRole("button", { name: "Criar link" }).click();
  await expect(secao.getByText(`/convidado#${CODIGO}`)).toBeVisible();
  await expect(secao.getByText("Mãe", { exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("sua-conta.png"), fullPage: true });
  const resultado = await analisarAcessibilidade(page);
  expect(descreverViolacoes(violacoesQueReprovam(resultado.violations))).toEqual([]);

  await secao.getByRole("button", { name: "Apagar o link Mãe" }).click();
  await expect(secao.getByText("Mãe", { exact: true })).toHaveCount(0);
});

test("casas diferentes no aparelho e na conta: a pessoa escolhe, e 'Usar a da conta' troca a do aparelho", async ({ page, context }) => {
  await semearCasa(context, CASA);
  const daConta = { ...CASA.state, aparelhos: CASA.state.aparelhos.slice(0, 1) };
  await simularConta(page, daConta);
  await page.goto("/casa");
  // O e-mail da conta e o "Sair" à vista (R1 da seguranca): a conta pode ser de outra pessoa.
  await expect(page.getByText("A casa deste aparelho é diferente da que está na conta ana@exemplo.org.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sair da conta" })).toBeVisible();
  await page.getByRole("button", { name: "Usar a da conta" }).click();
  await expect(page.getByText("A casa deste aparelho é diferente")).toHaveCount(0);
  await expect.poll(async () => (await casaSalva(page))?.state.aparelhos.length).toBe(1);
});

test("convidado: vê a conta, quem gasta mais e os cômodos, sem nada para mudar", async ({ page }) => {
  await page.route("**/api/convidado", (rota) => rota.fulfill({ json: { casa: CASA.state, atualizadaEm: "2026-11-25T12:00:00.000Z" } }));
  await page.goto(`/convidado#${CODIGO}`);
  await expect(page.getByText("Só para ver")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Conta estimada por mês" })).toBeVisible();
  await expect(page.getByText(/^R\$ [\d.,]+$/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quem gasta mais" })).toBeVisible();
  // Nenhum botão, campo ou caixa de marcar: só leitura.
  await expect(page.locator("main button, main input, main select, main textarea")).toHaveCount(0);
  // Nada da casa do convidado fica guardado no aparelho dele.
  expect(await casaSalva(page)).toBeNull();
  await page.screenshot({ path: test.info().outputPath("convidado.png"), fullPage: true });
  const resultado = await analisarAcessibilidade(page);
  expect(descreverViolacoes(violacoesQueReprovam(resultado.violations))).toEqual([]);
});

test("convidado com link apagado: aviso simples", async ({ page, errosEsperados }) => {
  errosEsperados.push(/status of 404/);
  await page.route("**/api/convidado", (rota) => rota.fulfill({ status: 404, json: { erro: "convite" } }));
  await page.goto(`/convidado#${CODIGO}`);
  await expect(page.getByText("Este link não vale mais. Peça um novo a quem mandou.")).toBeVisible();
});

test("'Agora não': a casa do aparelho não vai para a conta", async ({ page, context }) => {
  await semearCasa(context, CASA);
  const { gravadas } = await simularConta(page, null);
  await page.goto("/casa");
  await page.getByRole("button", { name: "Agora não" }).click();
  await page.waitForTimeout(2500);
  expect(gravadas).toHaveLength(0);
});

test("depois do cadastro, sem conta: o convite aparece uma vez, 'Agora não' fecha, e nada foi enviado", async ({ page }) => {
  const pedidos: string[] = [];
  page.on("request", (pedido) => pedido.url().includes("/api/") && pedidos.push(`${pedido.method()} ${new URL(pedido.url()).pathname}`));
  await page.route("**/api/conta", (rota) => rota.fulfill({ json: { conta: "sem-conta" } }));
  await irAteAConta(page, /^Não sei/);
  await page.getByRole("button", { name: "Pular, não tenho a conta agora" }).click();
  const convite = page.getByRole("dialog", { name: "Ver a sua casa em outro celular" });
  await expect(convite).toBeVisible();
  await expect(convite.getByRole("link", { name: "Criar conta grátis" })).toHaveAttribute("href", "/entrar?modo=criar");
  await convite.getByRole("button", { name: "Agora não" }).click();
  await expect(convite).toBeHidden();
  // O foco não cai no começo da página: vai para o título da casa (QA, D3).
  await expect(page.locator("main h1")).toBeFocused();
  // A casa continua só no aparelho: o único pedido ao /api foi perguntar se há conta.
  expect(pedidos.every((pedido) => pedido === "GET /api/conta")).toBe(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(convite).toBeHidden();
});

test("depois do cadastro, com a conta desligada no site: nenhum convite", async ({ page }) => {
  await irAteAConta(page, /^Não sei/);
  await page.getByRole("button", { name: "Pular, não tenho a conta agora" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("/entrar?modo=criar abre em 'Criar uma conta' e passa no axe", async ({ page }) => {
  await page.route("**/api/conta", (rota) => rota.fulfill({ json: { conta: "sem-conta" } }));
  await page.goto("/entrar?modo=criar");
  await expect(page.getByRole("heading", { level: 1, name: "Criar uma conta" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Criar conta", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Entrar na sua conta" })).toBeVisible();
  const resultado = await analisarAcessibilidade(page);
  expect(descreverViolacoes(violacoesQueReprovam(resultado.violations))).toEqual([]);

test("link do e-mail: lê o código de #codigo= e também do formato antigo #token_hash=, e o tira do endereço", async ({ context }) => {
  const enviados: unknown[] = [];
  await context.route("**/api/conta", (rota) => rota.fulfill({ json: { conta: "sem-conta" } }));
  await context.route("**/api/conta/confirmar", (rota) => {
    enviados.push(rota.request().postDataJSON());
    return rota.fulfill({ json: { ok: true } });
  });
  const links = [
    { endereco: "/conta/confirmar#codigo=novo123", codigo: "novo123" },
    { endereco: "/conta/confirmar#token_hash=antigo456&type=email", codigo: "antigo456" },
  ];
  // Uma aba para cada link: na mesma aba, trocar só o que vem depois do # não abre a página de novo.
  for (const { endereco, codigo } of links) {
    const page = await context.newPage();
    await page.goto(endereco);
    await page.getByRole("button", { name: "Confirmar meu e-mail" }).click();
    await expect(page.getByRole("heading", { name: "Conta confirmada" })).toBeVisible();
    expect(enviados.at(-1)).toEqual({ tokenHash: codigo });
    expect(new URL(page.url()).hash).toBe("");
    await page.close();
  }
});

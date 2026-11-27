/*
 * HIS-201: a conta estimada em linhas, como numa fatura. As linhas somam o valor grande do cartão.
 */
import { analisarAcessibilidade, descreverViolacoes, violacoesQueReprovam } from "./apoio/axe";
import { lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

test.use({ reducedMotion: "reduce" });

/** Primeiro valor "R$ 1.234,56" do texto (o número animado repete o valor para o leitor de tela). */
function reais(texto: string): number {
  const achado = /(−\s*)?R\$\s*([\d.]+,\d{2})/.exec(texto);
  if (!achado?.[2]) return Number.NaN;
  const valor = Number(achado[2].replace(/\./g, "").replace(",", "."));
  return achado[1] ? -valor : valor;
}

test("as linhas da conta detalhada somam o valor do cartão", async ({ page }) => {
  await semearCasa(page.context(), { ...lerFixture("casa-v2.json"), version: 3 });
  await page.goto("/casa");
  await page.getByText("Conta detalhada").click();
  const lista = page.locator("details dl");
  await expect(lista.getByText("Total estimado")).toBeVisible();
  await expect(lista.getByText("Energia", { exact: true })).toBeVisible();

  const valores = await lista.locator("dd").allTextContents();
  const total = reais(valores.at(-1) ?? "");
  const soma = valores.slice(0, -1).reduce((s, v) => s + reais(v), 0);
  expect(Math.round(soma * 100)).toBe(Math.round(total * 100));
  const grande = reais((await page.locator("div:has(> #titulo-conta) + p").textContent()) ?? "");
  expect(total).toBe(grande);

  const resultado = await analisarAcessibilidade(page);
  expect(descreverViolacoes(violacoesQueReprovam(resultado.violations))).toEqual([]);
});

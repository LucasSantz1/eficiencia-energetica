/*
 * Cadastro do zero até o passo "conta" (HIS-003b): o campos.spec.ts e o layout-computador.spec.ts conferem os campos
 * da conta nesse passo. Mesmos passos do fluxo-principal, sem contar transições.
 */
import type { Page } from "@playwright/test";
import { expect } from "./teste";

/** Cadastro do zero até o passo da conta, com o benefício escolhido. */
export async function irAteAConta(pagina: Page, beneficio: RegExp): Promise<void> {
  const botao = (nome: string | RegExp) => pagina.getByRole("button", { name: nome, exact: typeof nome === "string" });
  const titulo = pagina.getByRole("heading", { level: 1 });
  await pagina.goto("/comecar");
  await pagina.locator("select#estado").selectOption("SP");
  await botao("Continuar").click();
  await pagina.locator("#busca-cidade").fill("Presidente Prudente");
  await pagina.getByRole("radio", { name: "Presidente Prudente", exact: true }).click();
  await pagina.getByRole("radio", { name: beneficio }).click();
  await expect(titulo).toHaveText("Quantas pessoas moram na casa?");
  await botao("Continuar").click();
  await botao(/^Continuar com \d+ cômodos$/).click();
  while (!(await botao("Ver o resumo dos cômodos").isVisible())) {
    const marcador = await pagina.getByText(/^Cômodo \d+ de \d+$/).innerText();
    await botao(/^Próximo: /).click();
    await expect(pagina.getByText(marcador, { exact: true })).toHaveCount(0);
  }
  await botao("Ver o resumo dos cômodos").click();
  await botao("Continuar").click();
  await expect(titulo).toHaveText("Tem uma conta de luz em mãos?");
}

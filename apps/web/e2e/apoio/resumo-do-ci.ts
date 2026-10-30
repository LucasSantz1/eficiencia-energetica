/*
 * Resumo do job no GitHub Actions: o que for escrito aqui aparece na página da execução, sem baixar o artefato
 * (tabela do peso de JS, exceções do axe). Fora do GitHub a variável não existe e nada é escrito.
 */
import { appendFileSync } from "node:fs";

export function escreverNoResumoDoCi(markdown: string): void {
  const arquivo = process.env.GITHUB_STEP_SUMMARY;
  if (!arquivo) return;
  appendFileSync(arquivo, `${markdown.trimEnd()}\n\n`);
}

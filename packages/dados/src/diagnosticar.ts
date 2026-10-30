/**
 * Diagnóstico dos dados, só de leitura (HIS-111, passo 0):
 *
 *   pnpm dados:diagnosticar               baixa os CSVs da ANEEL para .cache/ e mostra o que a montagem mudaria
 *   pnpm dados:diagnosticar --sem-baixar  usa os CSVs que já estão em .cache/
 *
 * Roda na Action .github/workflows/diagnosticar-dados.yml. Nunca grava em apps/web/public/dados nem em base/:
 * só escreve no .cache/ (fora do git) e, na Action, no $GITHUB_STEP_SUMMARY.
 * Sai com 1 só quando não consegue baixar ou ler os dados.
 */
import { appendFile } from "node:fs/promises";
import { limitarResumo, umaLinha } from "./anotacoes";
import { diagnosticar } from "./diagnostico";
import { PASTA_SAIDA } from "./escrever";
import { arquivosNaPasta, PASTA_CACHE } from "./fontes";
import { hojeISO } from "./util";

async function main() {
  const hoje = hojeISO();
  console.log(`Diagnóstico dos dados para ${hoje} (nada é gravado)\n`);
  const { markdown } = await diagnosticar({
    arquivos: arquivosNaPasta(PASTA_CACHE),
    hoje,
    baixar: !process.argv.includes("--sem-baixar"),
    pastaPublicada: PASTA_SAIDA,
  });
  console.log("");
  for (const linha of markdown.split("\n")) console.log(umaLinha(linha));
  const resumo = process.env.GITHUB_STEP_SUMMARY;
  if (resumo) await appendFile(resumo, limitarResumo(markdown) + "\n", "utf8");
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});

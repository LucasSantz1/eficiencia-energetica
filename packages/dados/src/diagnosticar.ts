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
import { anotacao, anotacoesDoResumo, limitarResumo, linhasDoErro, umaLinha } from "./anotacoes";
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
  // Na Action, o resumo também vira anotações, que a equipe consegue ler pela API (o log dá 403 fora do GitHub).
  if (process.env.GITHUB_ACTIONS === "true") for (const linha of anotacoesDoResumo(markdown)) console.log(linha);
}

main().catch((erro) => {
  // S1: a mensagem pode trazer texto da ANEEL; uma linha por chamada, sem quebra.
  for (const linha of linhasDoErro(erro)) console.error(linha);
  // Na Action, o erro também vira anotação: o log dá 403 fora do GitHub, e sem isso a falha fica muda para a equipe.
  if (process.env.GITHUB_ACTIONS === "true") console.log(anotacao("error", "Diagnóstico falhou", linhasDoErro(erro).slice(0, 12).join("\n")));
  process.exit(1);
});

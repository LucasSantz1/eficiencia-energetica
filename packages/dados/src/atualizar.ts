/**
 * Atualiza os dados de tarifas, bandeiras e municípios a partir da ANEEL e do IBGE.
 *
 *   pnpm dados:atualizar              baixa, confere e grava em apps/web/public/dados
 *   pnpm dados:atualizar --forcar     grava mesmo se a validação de cobertura reclamar (V5, V6...);
 *                                     a conferência de coerência (V1–V4, V7–V10) nunca é pulada
 *   pnpm dados:atualizar --sem-baixar reaproveita os CSVs já baixados (útil para depurar)
 *
 * Roda todo dia pela GitHub Action .github/workflows/atualizar-dados.yml. Só grava em apps/web/public/dados:
 * nunca em packages/dados/base (R4 da HIS-111).
 */
import { PASTA_SAIDA } from "./escrever";
import { arquivosNaPasta, PASTA_CACHE } from "./fontes";
import { executarAtualizacao } from "./rotina";
import { hojeISO } from "./util";

async function main() {
  const hoje = hojeISO();
  console.log(`Atualizando dados para ${hoje}\n`);
  const { codigo } = await executarAtualizacao({
    arquivos: arquivosNaPasta(PASTA_CACHE),
    hoje,
    geradoEm: new Date().toISOString(),
    baixar: !process.argv.includes("--sem-baixar"),
    usarApiIbge: true,
    forcar: process.argv.includes("--forcar"),
    pastaSaida: PASTA_SAIDA,
  });
  process.exit(codigo);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});

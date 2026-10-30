/**
 * Atualiza os dados de tarifas, bandeiras e municípios a partir da ANEEL e do IBGE.
 *
 *   pnpm dados:atualizar            baixa, valida e grava em apps/web/public/dados
 *   pnpm dados:atualizar --forcar   grava mesmo se a validação reclamar
 *
 * Roda todo dia pela GitHub Action .github/workflows/atualizar-dados.yml.
 */
import { umaLinha } from "./anotacoes";
import { escreverArquivos } from "./escrever";
import { arquivosNaPasta, descreverFontes, lerFontes, PASTA_CACHE } from "./fontes";
import { montarArquivos, validar } from "./montar";
import { hojeISO } from "./util";

const forcar = process.argv.includes("--forcar");
const semBaixar = process.argv.includes("--sem-baixar"); // reaproveita os CSVs já baixados (útil para depurar)

async function main() {
  const hoje = hojeISO();
  console.log(`Atualizando dados para ${hoje}\n`);

  const fontes = await lerFontes({ arquivos: arquivosNaPasta(PASTA_CACHE), hoje, baixar: !semBaixar, usarApiIbge: true });

  const montagem = montarArquivos({
    tarifas: fontes.tarifas.selecao.tarifas,
    bandeiras: fontes.bandeiras,
    vinculos: fontes.vinculos,
    localidades: fontes.localidades,
    geradoEm: new Date().toISOString(),
    origem: "aneel",
    fontes: descreverFontes(fontes.fonteIbge),
  });

  console.log("\nResumo:");
  // JSON.stringify já escapa quebras de linha dentro dos textos, então o resumo não abre linha nova de comando (R2).
  console.log(JSON.stringify({ ...montagem.relatorio, agentesSemTarifa: montagem.relatorio.agentesSemTarifa.slice(0, 30) }, null, 2));

  const erros = validar(montagem, hoje);
  if (erros.length > 0) {
    console.error("\nA validação encontrou problemas:");
    for (const e of erros) console.error(umaLinha(`  ✗ ${e}`));
    if (!forcar) {
      console.error("\nNada foi gravado. Use --forcar para gravar mesmo assim.");
      process.exit(1);
    }
  }

  const { escritos, mudou } = await escreverArquivos(montagem);
  console.log(mudou ? `\n✓ ${escritos.length} arquivos gravados em apps/web/public/dados` : "\n✓ Os dados não mudaram desde a última atualização.");
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});

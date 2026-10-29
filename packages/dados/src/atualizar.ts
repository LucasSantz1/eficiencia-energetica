/**
 * Atualiza os dados de tarifas, bandeiras e municípios a partir da ANEEL e do IBGE.
 *
 *   pnpm dados:atualizar            baixa, valida e grava em apps/web/public/dados
 *   pnpm dados:atualizar --forcar   grava mesmo se a validação reclamar
 *
 * Roda todo dia pela GitHub Action .github/workflows/atualizar-dados.yml.
 */
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { lerBandeiras, URL_BANDEIRAS } from "./aneel/bandeiras";
import { lerVinculos, mapearColunasMunicipios, URL_MUNICIPIOS_DISTRIBUIDORAS } from "./aneel/municipios";
import { ehTarifaResidencialB1, mapearColunasTarifas, selecionarTarifasVigentes, URL_TARIFAS, type ColunasTarifas } from "./aneel/tarifas";
import { baixar, lerCSV } from "./csv";
import { escreverArquivos } from "./escrever";
import { carregarLocalidades } from "./ibge";
import { montarArquivos, validar } from "./montar";
import { hojeISO } from "./util";

const CACHE = fileURLToPath(new URL("../.cache/", import.meta.url));
const forcar = process.argv.includes("--forcar");
const semBaixar = process.argv.includes("--sem-baixar"); // reaproveita os CSVs já baixados (útil para depurar)

async function etapa<T>(nome: string, fn: () => Promise<T>): Promise<T> {
  const inicio = Date.now();
  console.log(`▶ ${nome}`);
  const r = await fn();
  console.log(`  ok em ${((Date.now() - inicio) / 1000).toFixed(1)} s`);
  return r;
}

async function main() {
  const hoje = hojeISO();
  console.log(`Atualizando dados para ${hoje}\n`);

  const arquivos = { tarifas: join(CACHE, "tarifas.csv"), bandeiras: join(CACHE, "bandeiras.csv"), municipios: join(CACHE, "municipios.csv") };
  if (!semBaixar) {
    await etapa("Baixando tarifas das distribuidoras (ANEEL)", () => baixar(URL_TARIFAS, arquivos.tarifas));
    await etapa("Baixando bandeiras tarifárias (ANEEL)", () => baixar(URL_BANDEIRAS, arquivos.bandeiras));
    await etapa("Baixando municípios atendidos (ANEEL)", () => baixar(URL_MUNICIPIOS_DISTRIBUIDORAS, arquivos.municipios));
  }

  const tarifas = await etapa("Lendo tarifas residenciais B1", async () => {
    let colunas: ColunasTarifas | undefined;
    const lido = await lerCSV(arquivos.tarifas, {
      aoLerCabecalho: (cab) => {
        console.log(`  colunas: ${cab.join(" | ")}`);
        colunas = mapearColunasTarifas(cab);
      },
      filtro: (linha) => ehTarifaResidencialB1(linha, colunas!),
    });
    console.log(`  ${lido.total} linhas no arquivo, ${lido.linhas.length} residenciais B1 convencionais`);
    const r = selecionarTarifasVigentes(lido.linhas, colunas!, hoje);
    console.log(`  ${r.tarifas.length} distribuidoras com tarifa vigente`);
    for (const d of r.descartadas) console.log(`  descartada — ${d}`);
    const amostra = r.tarifas.slice(0, 5).map((t) => `${t.sigla}: R$ ${(t.teKwh + t.tusdKwh).toFixed(4)}/kWh desde ${t.inicioVigencia}`);
    console.log(`  amostra: ${amostra.join("; ")}`);
    return r.tarifas;
  });

  const bandeiras = await etapa("Lendo bandeiras", async () => {
    const lido = await lerCSV(arquivos.bandeiras);
    console.log(`  colunas: ${lido.cabecalho.join(" | ")}`);
    const r = lerBandeiras(lido.cabecalho, lido.linhas);
    for (const a of r.avisos.slice(0, 5)) console.log(`  ${a}`);
    console.log(`  últimas: ${r.bandeiras.slice(-4).map((b) => `${b.competencia} ${b.nome} (+R$ ${b.adicionalKwh}/kWh)`).join("; ")}`);
    return r.bandeiras;
  });

  const vinculos = await etapa("Lendo municípios atendidos", async () => {
    const lido = await lerCSV(arquivos.municipios);
    console.log(`  colunas: ${lido.cabecalho.join(" | ")}`);
    console.log(`  primeira linha: ${JSON.stringify(lido.linhas[0])}`);
    const colunas = mapearColunasMunicipios(lido.cabecalho);
    console.log(`  usando: ${JSON.stringify(colunas)}`);
    const v = lerVinculos(lido.linhas, colunas);
    console.log(`  ${v.size} municípios com distribuidora`);
    return v;
  });

  const { localidades, fonte: fonteIbge } = await etapa("Carregando municípios do IBGE", () => carregarLocalidades(true));

  const montagem = montarArquivos({
    tarifas,
    bandeiras,
    vinculos,
    localidades,
    geradoEm: new Date().toISOString(),
    origem: "aneel",
    fontes: [
      "ANEEL — Tarifas de aplicação das distribuidoras de energia elétrica",
      "ANEEL — Bandeiras Tarifárias (acionamento)",
      "ANEEL — IndQual Município",
      fonteIbge,
    ],
  });

  console.log("\nResumo:");
  console.log(JSON.stringify({ ...montagem.relatorio, agentesSemTarifa: montagem.relatorio.agentesSemTarifa.slice(0, 30) }, null, 2));

  const erros = validar(montagem, hoje);
  if (erros.length > 0) {
    console.error("\nA validação encontrou problemas:");
    for (const e of erros) console.error(`  ✗ ${e}`);
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

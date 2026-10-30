/*
 * Peso de JavaScript (critério 9; D8; P-qa-5), só no celular, comparado com `e2e/peso-js.json` — sem compilar o
 * main no CI. Para o celular simples com 3G, cada KB conta.
 *   11a · `jsDoHtml`: soma (gzip) dos `<script src>` sem `noModule` e dos `<link rel="preload" as="script">` do HTML
 *         da rota — o que a página precisa para abrir. Baixado pelo Node, como o jsDoHtml do e2e-base.
 *   11b · `totalComPrefetch`: soma de `encodedBodySize` de todo `.js` que o navegador baixou até `networkidle` + 1 s
 *         (o prefetch dos <Link> visíveis entra). Sem relógio falso: ele troca o `performance`.
 * Atualizar de propósito (num PR que explica o porquê na história):
 *   ATUALIZAR_PESO_JS=1 pnpm test:e2e --project=celular peso-js
 * O CI nunca atualiza: com GITHUB_ACTIONS=true essa variável reprova (Aa13).
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { get } from "node:http";
import { lerFixture, semearCasa } from "./apoio/casa";
import { compararPeso, lerReferenciaDePeso, tabelaDoPeso, type CampoDePeso, type PesosPorMedida } from "./apoio/peso";
import { escreverNoResumoDoCi } from "./apoio/resumo-do-ci";
import { expect, test } from "./apoio/teste";

const ARQUIVO_REFERENCIA = new URL("./peso-js.json", import.meta.url);

interface Medida {
  nome: string;
  rota: string;
  comCasa: boolean;
  campos: readonly CampoDePeso[];
}

/** Lista fixa: o peso-js.json tem que ter exatamente estas chaves e campos (D16, P-qa-5). */
const MEDIDAS: readonly Medida[] = [
  ...["/", "/comecar", "/casa", "/casa/comodos", "/casa/dicas", "/casa/ajustes", "/sobre"].map(
    (rota): Medida => ({ nome: rota, rota, comCasa: false, campos: ["jsDoHtml", "totalComPrefetch"] }),
  ),
  // Com casa o HTML é o mesmo (página estática); muda o que a tela mostra e, com isso, o que o Next pré-carrega.
  { nome: "/casa (com casa)", rota: "/casa", comCasa: true, campos: ["totalComPrefetch"] },
];

/** Baixa um caminho do site; com gzip, o tamanho é o mesmo do `encodedBodySize` no navegador. */
function baixar(endereco: URL, gzip: boolean): Promise<Buffer> {
  return new Promise((resolver, rejeitar) => {
    get(endereco, { headers: gzip ? { "accept-encoding": "gzip" } : {} }, (resposta) => {
      const partes: Buffer[] = [];
      resposta.on("data", (parte: Buffer) => partes.push(parte));
      resposta.on("end", () => resolver(Buffer.concat(partes)));
      resposta.on("error", rejeitar);
    }).on("error", rejeitar);
  });
}

/** 11a: scripts que o HTML da rota referencia (regra da HIS-001: `noModule` fica de fora). */
async function jsDoHtml(base: string, rota: string): Promise<number> {
  const html = (await baixar(new URL(rota, base), false)).toString("utf8");
  const scripts = new Set<string>();
  for (const tag of html.matchAll(/<script[^>]*\ssrc="([^"]+\.js)"[^>]*>/g)) {
    if (!/noModule/i.test(tag[0]) && tag[1]) scripts.add(tag[1]);
  }
  for (const tag of html.matchAll(/<link[^>]*>/g)) {
    if (!/rel="preload"/.test(tag[0]) || !/as="script"/.test(tag[0])) continue;
    const href = tag[0].match(/href="([^"]+)"/)?.[1];
    if (href) scripts.add(href);
  }
  expect(scripts.size, `${rota}: o HTML precisa referenciar algum JS`).toBeGreaterThan(0);
  let total = 0;
  for (const script of scripts) total += (await baixar(new URL(script, base), true)).length;
  return total;
}

const medido: PesosPorMedida = {};

test.describe.configure({ mode: "serial" });

for (const medida of MEDIDAS) {
  test(`medir ${medida.nome}`, async ({ page, context, baseURL }) => {
    if (!baseURL) throw new Error("baseURL não configurada");
    if (medida.comCasa) await semearCasa(context, lerFixture("casa-v2.json"));
    const pesos: Partial<Record<CampoDePeso, number>> = {};
    if (medida.campos.includes("jsDoHtml")) pesos.jsDoHtml = await jsDoHtml(baseURL, medida.rota);
    if (medida.campos.includes("totalComPrefetch")) {
      // Contexto novo por teste: nada vem do cache.
      await page.goto(medida.rota, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000); // a única espera fixa do e2e (D8): dá tempo ao prefetch que começa depois do networkidle
      pesos.totalComPrefetch = await page.evaluate(() => {
        const porArquivo = new Map<string, number>();
        for (const e of performance.getEntriesByType("resource")) {
          if (e instanceof PerformanceResourceTiming && new URL(e.name).pathname.endsWith(".js")) porArquivo.set(e.name, e.encodedBodySize);
        }
        return [...porArquivo.values()].reduce((soma, bytes) => soma + bytes, 0);
      });
    }
    medido[medida.nome] = pesos;
  });
}

test("peso de JS dentro do limite da referência", async () => {
  const info = test.info();
  expect(Object.keys(medido), "todas as medidas rodaram").toEqual(MEDIDAS.map((m) => m.nome));

  if (process.env.ATUALIZAR_PESO_JS === "1") {
    if (process.env.GITHUB_ACTIONS === "true") {
      throw new Error("ATUALIZAR_PESO_JS no CI: a referência só muda num PR, medida no computador de quem muda o peso (Aa13)");
    }
    const commit = execSync("git rev-parse --short HEAD").toString().trim();
    writeFileSync(ARQUIVO_REFERENCIA, `${JSON.stringify({ medidoNoCommit: commit, rotas: medido }, null, 2)}\n`);
    info.annotations.push({ type: "peso-js.json", description: `referência regravada a partir do commit ${commit}` });
  }

  const referencia = lerReferenciaDePeso(JSON.parse(readFileSync(ARQUIVO_REFERENCIA, "utf8")));
  const { erros, anotacoes, linhas } = compararPeso(referencia.rotas, medido);
  const tabela = `### Peso de JS (referência do commit ${referencia.medidoNoCommit})\n\n${tabelaDoPeso(linhas)}`;
  await info.attach("peso-js.md", { body: tabela, contentType: "text/markdown" });
  console.log(tabela); // aparece no terminal de quem roda local e no log do job
  escreverNoResumoDoCi([tabela, ...erros.map((e) => `- **erro:** ${e}`), ...anotacoes.map((a) => `- aviso: ${a}`)].join("\n"));
  for (const anotacao of anotacoes) info.annotations.push({ type: "peso abaixo da referência", description: anotacao });

  expect(erros, `peso de JS acima do limite ou referência incompleta\n\n${tabela}`).toEqual([]);
});

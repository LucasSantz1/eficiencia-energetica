import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import type { Montagem } from "./montar";

/** Os arquivos ficam em apps/web/public/dados — o site serve como estáticos e o app baixa da mesma URL. */
export const PASTA_SAIDA = fileURLToPath(new URL("../../../apps/web/public/dados/", import.meta.url));

/** Assinatura do conteúdo sem as datas de geração — muda só quando os dados mudam de verdade. */
function assinatura(m: Montagem): string {
  const { geradoEm: _a, ...tarifas } = m.tarifas;
  const municipios = m.municipiosPorUF.map(({ geradoEm: _b, ...resto }) => resto);
  return createHash("sha256").update(JSON.stringify({ tarifas, municipios })).digest("hex").slice(0, 16);
}

/**
 * Grava os arquivos. Se nada mudou desde a última vez, não grava nada (assim a rotina diária
 * só cria um commit quando a ANEEL publica algo novo).
 */
export async function escreverArquivos(m: Montagem, pasta = PASTA_SAIDA): Promise<{ escritos: string[]; mudou: boolean }> {
  const nova = assinatura(m);
  const anterior = await readFile(join(pasta, "relatorio.json"), "utf8")
    .then((t) => (JSON.parse(t) as { assinatura?: string }).assinatura)
    .catch(() => undefined);
  if (anterior === nova) return { escritos: [], mudou: false };

  await mkdir(pasta, { recursive: true });
  await rm(join(pasta, "municipios"), { recursive: true, force: true });
  await mkdir(join(pasta, "municipios"), { recursive: true });

  const escritos: string[] = [];
  const salvar = async (nome: string, dados: unknown) => {
    const caminho = join(pasta, nome);
    await writeFile(caminho, JSON.stringify(dados) + "\n", "utf8");
    escritos.push(caminho);
  };

  await salvar("tarifas.json", m.tarifas);
  for (const arquivo of m.municipiosPorUF) await salvar(`municipios/${arquivo.uf}.json`, arquivo);
  await salvar("relatorio.json", { geradoEm: m.tarifas.geradoEm, origem: m.tarifas.origem, assinatura: nova, ...m.relatorio });
  return { escritos, mudou: true };
}

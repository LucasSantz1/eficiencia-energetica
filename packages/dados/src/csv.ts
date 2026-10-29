import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, open, stat } from "node:fs/promises";
import { dirname } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { parse } from "csv-parse";
import type { Linha } from "./util";

/** Baixa um arquivo para o disco (em streaming — o CSV de tarifas da ANEEL é grande). */
export async function baixar(url: string, destino: string, tentativas = 3): Promise<void> {
  await mkdir(dirname(destino), { recursive: true });
  let ultimoErro: unknown;
  for (let i = 1; i <= tentativas; i++) {
    try {
      const resposta = await fetch(url, { headers: { "user-agent": "eficiencia-energetica (+https://github.com/LucasSantz1/eficiencia-energetica)" } });
      if (!resposta.ok || !resposta.body) throw new Error(`HTTP ${resposta.status} ao baixar ${url}`);
      await pipeline(Readable.fromWeb(resposta.body as import("node:stream/web").ReadableStream), createWriteStream(destino));
      const { size } = await stat(destino);
      if (size < 100) throw new Error(`Arquivo baixado muito pequeno (${size} bytes): ${url}`);
      return;
    } catch (erro) {
      ultimoErro = erro;
      console.warn(`  tentativa ${i}/${tentativas} falhou: ${(erro as Error).message}`);
      if (i < tentativas) await new Promise((r) => setTimeout(r, 3000 * i));
    }
  }
  throw ultimoErro;
}

/** Lê só os primeiros bytes de um arquivo, sem carregar o arquivo inteiro na memória. */
async function lerInicio(caminho: string, bytes: number): Promise<Buffer> {
  const arquivo = await open(caminho, "r");
  try {
    const buffer = Buffer.alloc(bytes);
    const { bytesRead } = await arquivo.read(buffer, 0, bytes, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await arquivo.close();
  }
}

/**
 * Descobre se o arquivo está em UTF-8 ou em Latin-1 (alguns CSVs antigos da ANEEL vêm assim),
 * olhando o começo do arquivo.
 */
export async function detectarCodificacao(caminho: string): Promise<"utf8" | "latin1"> {
  const buffer = await lerInicio(caminho, 1024 * 1024);
  try {
    // Corta no último \n para não partir um caractere multibyte no meio.
    const fim = buffer.lastIndexOf(0x0a);
    new TextDecoder("utf-8", { fatal: true }).decode(fim > 0 ? buffer.subarray(0, fim) : buffer);
    return "utf8";
  } catch {
    return "latin1";
  }
}

export interface OpcoesLeitura {
  /** Chamado para cada linha; devolva false para descartar rapidamente (economiza memória). */
  filtro?: (linha: Linha) => boolean;
  /** Recebe o cabeçalho assim que ele é lido. */
  aoLerCabecalho?: (cabecalho: string[]) => void;
}

/** Lê um CSV separado por ";" (padrão da ANEEL) ou "," e devolve as linhas como objetos. */
export async function lerCSV(caminho: string, opcoes: OpcoesLeitura = {}): Promise<{ cabecalho: string[]; linhas: Linha[]; total: number }> {
  const codificacao = await detectarCodificacao(caminho);
  const primeiraLinha = (await lerInicio(caminho, 8192)).toString(codificacao).split(/\r?\n/)[0] ?? "";
  const delimitador = (primeiraLinha.match(/;/g)?.length ?? 0) >= (primeiraLinha.match(/,/g)?.length ?? 0) ? ";" : ",";

  let cabecalho: string[] = [];
  const linhas: Linha[] = [];
  let total = 0;

  const parser = parse({
    delimiter: delimitador,
    bom: true,
    relax_quotes: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
    columns: (h: string[]) => {
      cabecalho = h.map((c) => c.trim());
      opcoes.aoLerCabecalho?.(cabecalho);
      return cabecalho;
    },
  });

  const coletor = new Transform({
    objectMode: true,
    transform(linha: Linha, _enc, feito) {
      total++;
      if (!opcoes.filtro || opcoes.filtro(linha)) linhas.push(linha);
      feito();
    },
  });

  await pipeline(createReadStream(caminho, { encoding: codificacao }), parser, coletor);
  return { cabecalho, linhas, total };
}

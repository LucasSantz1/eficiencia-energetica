import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, open, rm, stat } from "node:fs/promises";
import { dirname } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { parse } from "csv-parse";
import { Agent, fetch } from "undici";
import { umaLinha } from "./anotacoes";
import type { Linha } from "./util";

/**
 * O portal da ANEEL às vezes demora para aceitar a conexão vinda do GitHub: o `fetch` do Node desiste em 10 s
 * (`UND_ERR_CONNECT_TIMEOUT`). Damos 45 s para conectar e esperamos mais entre as tentativas. Cabeçalhos e corpo têm
 * o próprio limite (o CSV de tarifas é grande e chega devagar).
 */
export const TEMPO_PARA_CONECTAR_MS = 45_000;
const TEMPO_PARA_CABECALHOS_MS = 120_000;
const TEMPO_SEM_DADOS_NO_CORPO_MS = 120_000;
/** 4 tentativas, com espera de 15 s, 30 s e 60 s entre elas: até ~5 min contando os 45 s de cada conexão. */
export const TENTATIVAS_DO_DOWNLOAD = 4;
export const ESPERA_INICIAL_MS = 15_000;

const agente = new Agent({ connect: { timeout: TEMPO_PARA_CONECTAR_MS }, headersTimeout: TEMPO_PARA_CABECALHOS_MS, bodyTimeout: TEMPO_SEM_DADOS_NO_CORPO_MS });
const CABECALHOS = { "user-agent": "eficiencia-energetica (+https://github.com/LucasSantz1/eficiencia-energetica)" };

/** O pedaço da resposta que o download usa: dá para trocar por um `fetch` falso nos testes. */
export interface RespostaDoDownload {
  ok: boolean;
  status: number;
  body: ReadableStream<Uint8Array> | null;
}
export type Buscar = (url: string) => Promise<RespostaDoDownload>;

const buscarNaRede: Buscar = (url) => fetch(url, { headers: CABECALHOS, dispatcher: agente });

export interface OpcoesDoDownload {
  tentativas?: number;
  /** Espera antes da 2ª tentativa; dobra a cada nova (15 s, 30 s, 60 s). */
  esperaInicialMs?: number;
  buscar?: Buscar;
  esperar?: (ms: number) => Promise<void>;
  registrar?: (linha: string) => void;
}

/** Resposta 4xx ou arquivo vazio: tentar de novo não muda nada. */
export class ErroSemNovaTentativa extends Error {
  override name = "ErroSemNovaTentativa";
}

/** Todas as tentativas falharam. O `cause` é o motivo da última (ex.: `ConnectTimeoutError`, com o `code`). */
export class ErroNoDownload extends Error {
  override name = "ErroNoDownload";
}

/** Erro de rede do `fetch` ("fetch failed") traz o motivo de verdade no `cause`. */
const motivo = (erro: unknown): unknown => (erro instanceof TypeError && erro.cause instanceof Error ? erro.cause : erro);
const mensagem = (erro: unknown): string => {
  if (!(erro instanceof Error)) return String(erro);
  const codigo = "code" in erro && typeof erro.code === "string" ? ` [${erro.code}]` : "";
  return `${erro.name}: ${erro.message}${codigo}`;
};

/**
 * Baixa um arquivo para o disco (em streaming: o CSV de tarifas da ANEEL é grande). Tenta de novo só em erro de rede
 * e em 5xx, com espera crescente; 4xx e arquivo vazio param na hora. Cada tentativa vai para o log. Se tudo falhar, a
 * rotina para sem gravar nada e os dados de ontem ficam no ar.
 */
export async function baixar(url: string, destino: string, opcoes: OpcoesDoDownload = {}): Promise<void> {
  const tentativas = opcoes.tentativas ?? TENTATIVAS_DO_DOWNLOAD;
  const esperaInicial = opcoes.esperaInicialMs ?? ESPERA_INICIAL_MS;
  const buscar = opcoes.buscar ?? buscarNaRede;
  const esperar = opcoes.esperar ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const registrar = opcoes.registrar ?? ((linha: string) => console.warn(linha));
  await mkdir(dirname(destino), { recursive: true });

  let ultimoErro: unknown;
  for (let i = 1; i <= tentativas; i++) {
    const inicio = Date.now();
    try {
      const resposta = await buscar(url);
      if (resposta.status >= 400 && resposta.status < 500) throw new ErroSemNovaTentativa(`HTTP ${resposta.status} ao baixar ${url}`);
      if (!resposta.ok || !resposta.body) throw new Error(`HTTP ${resposta.status} ao baixar ${url}`);
      await pipeline(Readable.fromWeb(resposta.body), createWriteStream(destino));
      const { size } = await stat(destino);
      if (size < 100) throw new ErroSemNovaTentativa(`Arquivo baixado muito pequeno (${size} bytes): ${url}`);
      if (i > 1) registrar(umaLinha(`  tentativa ${i}/${tentativas}: ok`));
      return;
    } catch (erro) {
      ultimoErro = erro;
      // Um pedaço do arquivo não pode ficar no .cache: o --sem-baixar leria um CSV cortado.
      await rm(destino, { force: true });
      const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
      const definitivo = erro instanceof ErroSemNovaTentativa;
      const proxima = definitivo || i === tentativas ? "sem nova tentativa" : `nova tentativa em ${Math.round((esperaInicial * 2 ** (i - 1)) / 1000)} s`;
      registrar(umaLinha(`  tentativa ${i}/${tentativas} falhou em ${segundos} s: ${mensagem(motivo(erro))}; ${proxima}`));
      if (definitivo) break;
      if (i < tentativas) await esperar(esperaInicial * 2 ** (i - 1));
    }
  }
  throw new ErroNoDownload(`Não foi possível baixar ${url}: ${mensagem(ultimoErro)}`, { cause: motivo(ultimoErro) });
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

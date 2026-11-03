/**
 * Tabela de sucessões de distribuidoras (`base/sucessoes.json`, HIS-111, D2 e ADR-005).
 *
 * Quando uma distribuidora é incorporada por outra (CNPJ diferente), a ANEEL continua publicando a tarifa antiga e
 * os conjuntos elétricos antigos. A rotina só troca a empresa de uma cidade com uma linha desta tabela, que tem o ato
 * oficial e a fonte. Coincidência de datas entre vigências nunca troca sozinha: muitas distribuidoras fazem o
 * reajuste no mesmo dia, e o erro passaria sem ninguém ver.
 *
 * O arquivo é dado versionado: só muda por PR revisado pelo dominio-energia (R4). A rotina diária só lê.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { umaLinha } from "./anotacoes";
import type { AgenteDaTarifa } from "./aneel/tarifas";
import { dataExiste, diasEntre, normalizar } from "./util";

export const CAMINHO_SUCESSOES = fileURLToPath(new URL("../base/sucessoes.json", import.meta.url));

/** Cadeia mais longa aceita (A → B → … ). Mais que isso é quase certo erro de digitação (T2). */
export const MAXIMO_DE_SALTOS = 5;
/** Linhas demais no arquivo indicam arquivo errado; hoje são 10. */
const MAXIMO_DE_LINHAS = 200;
/** Diferença entre `desde` e o fim da última tarifa da antiga que vira aviso no relatório (R3). */
const DIAS_DE_FOLGA_DO_DESDE = 366;

export interface Sucessao {
  /** Posição no arquivo, para as mensagens de erro. */
  indice: number;
  cnpjAntigo: string;
  siglaAntiga: string;
  cnpjSucessor: string;
  siglaSucessora: string;
  /** Dia em que a sucessão vale (AAAA-MM-DD). Linha com `desde` no futuro não é aplicada. */
  desde: string;
  /** Ato oficial (ex.: "REA ANEEL nº 6.723, de 21/11/2017"). Só registro: não vai para /dados. */
  ato: string;
  /** Link (https) do ato ou de uma cópia dele. Só registro: a rotina não abre o link. */
  fonte: string;
  consultadoEm: string;
  observacao?: string;
}

export class ErroNasSucessoes extends Error {
  override name = "ErroNasSucessoes";
}

const CAMPOS = new Set(["cnpjAntigo", "siglaAntiga", "cnpjSucessor", "siglaSucessora", "desde", "ato", "fonte", "consultadoEm", "observacao"]);

function ehObjetoSimples(valor: unknown): valor is Record<string, unknown> {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) return false;
  const prototipo: unknown = Object.getPrototypeOf(valor);
  return prototipo === Object.prototype || prototipo === null;
}

const compacto = (t: string) => normalizar(t).replace(/[^a-z0-9]/g, "");

/**
 * Lê e confere o conteúdo de `sucessoes.json`. Lança `ErroNasSucessoes` dizendo a linha (índice e sigla) na
 * primeira regra quebrada: sem `ato`, sem `fonte` https, CNPJ que não tem 14 dígitos, data que não existe,
 * `cnpjAntigo` repetido, ciclo ou mais de 5 saltos.
 */
export function lerSucessoes(bruto: unknown): Sucessao[] {
  if (!ehObjetoSimples(bruto) || !Array.isArray(bruto.sucessoes)) throw new ErroNasSucessoes('sucessoes.json: falta a lista "sucessoes".');
  const linhas: unknown[] = bruto.sucessoes;
  if (linhas.length > MAXIMO_DE_LINHAS) throw new ErroNasSucessoes(`sucessoes.json: ${linhas.length} linhas (o máximo é ${MAXIMO_DE_LINHAS}).`);

  const sucessoes = linhas.map((linha, indice) => lerLinha(linha, indice));

  const porCnpj = new Map<string, Sucessao>();
  for (const s of sucessoes) {
    const repetida = porCnpj.get(s.cnpjAntigo);
    if (repetida) throw erroNaLinha(s.indice, s.siglaAntiga, `o cnpjAntigo ${s.cnpjAntigo} já aparece em sucessoes[${repetida.indice}].`);
    porCnpj.set(s.cnpjAntigo, s);
  }
  for (const s of sucessoes) {
    const vistos = new Set([s.cnpjAntigo]);
    let atual = porCnpj.get(s.cnpjSucessor);
    let saltos = 1;
    while (atual) {
      if (vistos.has(atual.cnpjAntigo)) throw erroNaLinha(s.indice, s.siglaAntiga, "a cadeia de sucessão volta para uma empresa já vista (ciclo).");
      vistos.add(atual.cnpjAntigo);
      saltos++;
      if (saltos > MAXIMO_DE_SALTOS) throw erroNaLinha(s.indice, s.siglaAntiga, `a cadeia de sucessão passa de ${MAXIMO_DE_SALTOS} saltos.`);
      atual = porCnpj.get(atual.cnpjSucessor);
    }
  }
  return sucessoes;
}

function erroNaLinha(indice: number, sigla: string, motivo: string): ErroNasSucessoes {
  return new ErroNasSucessoes(`sucessoes.json, sucessoes[${indice}] (${umaLinha(sigla).slice(0, 40) || "?"}): ${motivo}`);
}

function lerLinha(linha: unknown, indice: number): Sucessao {
  const siglaParaErro = ehObjetoSimples(linha) && typeof linha.siglaAntiga === "string" ? linha.siglaAntiga : "?";
  const falha = (motivo: string) => erroNaLinha(indice, siglaParaErro, motivo);
  if (!ehObjetoSimples(linha)) throw falha("a linha não é um objeto.");
  for (const campo of Object.keys(linha)) if (!CAMPOS.has(campo)) throw falha(`campo desconhecido "${umaLinha(campo).slice(0, 40)}".`);

  const texto = (campo: string, maximo: number): string => {
    const valor = linha[campo];
    if (typeof valor !== "string" || valor.trim() === "") throw falha(`falta "${campo}".`);
    const limpo = valor.trim();
    if (limpo.length > maximo) throw falha(`"${campo}" passa de ${maximo} caracteres.`);
    return limpo;
  };
  const cnpj = (campo: string): string => {
    const valor = texto(campo, 14);
    if (!/^\d{14}$/.test(valor)) throw falha(`"${campo}" precisa ter 14 dígitos, sem pontos.`);
    return valor;
  };
  const data = (campo: string): string => {
    const valor = texto(campo, 10);
    if (!dataExiste(valor)) throw falha(`"${campo}" não é uma data AAAA-MM-DD que existe.`);
    return valor;
  };

  const cnpjAntigo = cnpj("cnpjAntigo");
  const cnpjSucessor = cnpj("cnpjSucessor");
  if (cnpjAntigo === cnpjSucessor) throw falha("cnpjAntigo e cnpjSucessor são iguais (mesmo CNPJ a rotina já resolve sozinha).");
  const fonte = texto("fonte", 500);
  // Não exige número de ato: a CERR entra com "Despacho MME, DOU 12/08/2016", como o dominio-energia aprovou (T2).
  if (!fonte.startsWith("https://") || !URL.canParse(fonte)) throw falha('"fonte" precisa ser um link que começa com https://.');
  const observacao = linha.observacao === undefined ? undefined : texto("observacao", 600);

  return {
    indice,
    cnpjAntigo,
    siglaAntiga: texto("siglaAntiga", 40),
    cnpjSucessor,
    siglaSucessora: texto("siglaSucessora", 40),
    desde: data("desde"),
    ato: texto("ato", 300),
    fonte,
    consultadoEm: data("consultadoEm"),
    ...(observacao === undefined ? {} : { observacao }),
  };
}

/** Lê `base/sucessoes.json` (ou outro arquivo, nos testes). */
export async function carregarSucessoes(caminho: string = CAMINHO_SUCESSOES): Promise<Sucessao[]> {
  const conteudo = await readFile(caminho, "utf8");
  let bruto: unknown;
  try {
    bruto = JSON.parse(conteudo);
  } catch {
    throw new ErroNasSucessoes(`sucessoes.json não é um JSON válido (${caminho}).`);
  }
  return lerSucessoes(bruto);
}

/** Só as linhas que já valem hoje (`desde` ≤ hoje). */
export function sucessoesEmVigor(sucessoes: readonly Sucessao[], hoje: string): Sucessao[] {
  return sucessoes.filter((s) => s.desde <= hoje);
}

/** Linhas por `cnpjAntigo`. */
export function indexarSucessoes(sucessoes: readonly Sucessao[]): ReadonlyMap<string, Sucessao> {
  return new Map(sucessoes.map((s) => [s.cnpjAntigo, s]));
}

/** Segue a cadeia a partir de um CNPJ até a última sucessora (no máximo 5 saltos; o leitor já recusa ciclo). */
export function seguirCadeia(indice: ReadonlyMap<string, Sucessao>, cnpj: string): { cnpj: string; sigla?: string; saltos: Sucessao[] } {
  const saltos: Sucessao[] = [];
  let atual = cnpj;
  let sigla: string | undefined;
  for (let linha = indice.get(atual); linha && saltos.length < MAXIMO_DE_SALTOS; linha = indice.get(atual)) {
    saltos.push(linha);
    atual = linha.cnpjSucessor;
    sigla = linha.siglaSucessora;
  }
  return { cnpj: atual, sigla, saltos };
}

/** O que a ANEEL diz de cada CNPJ, para conferir as linhas (V9 e V10). */
export interface DadosDaAneelParaSucessoes {
  agentesDaTarifa: readonly AgenteDaTarifa[];
  /** CNPJ → siglas com que ele aparece nos conjuntos elétricos (todas as linhas, todos os anos). */
  siglasDosConjuntos: ReadonlyMap<string, ReadonlySet<string>>;
}

/**
 * Regras da seguranca (R3) para que uma linha errada não troque a empresa de cidades sem a rotina parar:
 * - V9: a empresa antiga não pode ter tarifa vigente hoje (sucessão para empresa que funciona = linha errada);
 * - V10: as siglas da linha batem (forma compacta) com as que a ANEEL usa para aqueles CNPJs, nas tarifas ou nos
 *   conjuntos. Isso pega dígito trocado no CNPJ.
 * Aviso, sem parar: `desde` a mais de 12 meses do fim da última tarifa da antiga.
 */
export function conferirSucessoesNaAneel(sucessoes: readonly Sucessao[], aneel: DadosDaAneelParaSucessoes): { erros: string[]; avisos: string[] } {
  const erros: string[] = [];
  const avisos: string[] = [];
  const siglasDoCnpj = (cnpj: string): Set<string> => {
    const siglas = new Set<string>();
    for (const a of aneel.agentesDaTarifa) if (a.cnpj === cnpj) siglas.add(a.sigla);
    for (const s of aneel.siglasDosConjuntos.get(cnpj) ?? []) siglas.add(s);
    return siglas;
  };
  const conferirSigla = (s: Sucessao, papel: "antiga" | "sucessora", cnpj: string, sigla: string) => {
    const conhecidas = siglasDoCnpj(cnpj);
    if (conhecidas.size === 0) {
      erros.push(`V10: sucessoes[${s.indice}] (${s.siglaAntiga}): o CNPJ da ${papel} (${cnpj}) não aparece na ANEEL. Dígito trocado?`);
    } else if (![...conhecidas].some((c) => compacto(c) === compacto(sigla))) {
      erros.push(`V10: sucessoes[${s.indice}] (${s.siglaAntiga}): a sigla da ${papel} "${sigla}" não é a que a ANEEL usa para ${cnpj} (${[...conhecidas].sort().join(", ")}).`);
    }
  };

  for (const s of sucessoes) {
    const daAntiga = aneel.agentesDaTarifa.filter((a) => a.cnpj === s.cnpjAntigo);
    const vigente = daAntiga.find((a) => a.vigente);
    if (vigente) {
      erros.push(
        `V9: sucessoes[${s.indice}] (${s.siglaAntiga}): a empresa antiga ainda tem tarifa vigente na ANEEL (${vigente.sigla}, desde ${vigente.ultimoInicio}). ` +
          "Uma sucessão não pode tirar cidades de uma empresa que está funcionando.",
      );
    }
    conferirSigla(s, "antiga", s.cnpjAntigo, s.siglaAntiga);
    conferirSigla(s, "sucessora", s.cnpjSucessor, s.siglaSucessora);

    const fins = daAntiga.map((a) => a.ultimoFim).filter((f): f is string => f !== undefined);
    const ultimoFim = fins.sort().at(-1);
    if (ultimoFim && Math.abs(diasEntre(ultimoFim, s.desde)) > DIAS_DE_FOLGA_DO_DESDE) {
      avisos.push(`sucessoes[${s.indice}] (${s.siglaAntiga}): "desde" (${s.desde}) está a mais de 12 meses do fim da última tarifa da antiga (${ultimoFim}).`);
    }
  }
  return { erros, avisos };
}

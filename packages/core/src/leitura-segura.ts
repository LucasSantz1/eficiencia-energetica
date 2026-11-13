import { validarFaixa, type Faixa } from "./limites";

/**
 * Peças dos leitores de dados de fora (casa salva e arquivos de /dados). Não ficam no `index.ts`: só os leitores as usam.
 * Regras do ADR-004: ler só propriedade própria (`Object.hasOwn`), montar objeto novo campo a campo, nunca lançar com
 * valor vindo de `JSON.parse`, e conferir o tamanho do texto antes de qualquer expressão regular.
 */

/** Objeto simples (`{}` ou `JSON.parse`), sem lista, `null` nem instância de classe. */
export function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) return false;
  const prototipo: unknown = Object.getPrototypeOf(valor);
  return prototipo === Object.prototype || prototipo === null;
}

/** Valor de uma propriedade própria. Herdada (como `toString` ou `__proto__`) não conta. */
export function propriedade(objeto: Record<string, unknown>, chave: string): unknown {
  return Object.hasOwn(objeto, chave) ? objeto[chave] : undefined;
}

/** Diz se a propriedade existe e não é `undefined` (JSON nunca tem `undefined`; o objeto em memória pode ter). */
export function temPropriedade(objeto: Record<string, unknown>, chave: string): boolean {
  return propriedade(objeto, chave) !== undefined;
}

/** Número finito dentro da faixa (rígido; o alerta passa). */
export function numeroNaFaixa(valor: unknown, faixa: Faixa): number | undefined {
  return typeof valor === "number" && validarFaixa(faixa, valor) !== "fora" ? valor : undefined;
}

/**
 * Texto com algo além de espaço e até `maximo` caracteres. Devolve o texto **original**, sem `trim` (R4c): cortar
 * espaço seria mudar o que a pessoa salvou.
 */
export function textoLimitado(valor: unknown, maximo: number): string | undefined {
  if (typeof valor !== "string" || valor.length > maximo) return undefined;
  return valor.trim().length > 0 ? valor : undefined;
}

/** Um dos valores da lista. */
export function umaDas<T extends string>(valor: unknown, opcoes: readonly T[]): T | undefined {
  return opcoes.find((opcao) => opcao === valor);
}

/** Mês AAAA-MM que existe no calendário (01 a 12). Não confere se está no futuro: relógio do celular pode estar errado. */
export function ehCompetencia(valor: unknown): valor is string {
  if (typeof valor !== "string" || valor.length !== 7) return false;
  const partes = /^(\d{4})-(\d{2})$/.exec(valor);
  if (!partes) return false;
  const mes = Number(partes[2]);
  return mes >= 1 && mes <= 12;
}

/**
 * Data AAAA-MM-DD que existe no calendário, conferida por componentes UTC (R4d). `Date.parse("2026-02-30")` aceitaria e
 * viraria 2 de março. Também não confere se está no futuro.
 */
export function ehData(valor: unknown): valor is string {
  if (typeof valor !== "string" || valor.length !== 10) return false;
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!partes) return false;
  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

/**
 * Lista conferida pelo `typecheck`: tem que ter **todas** as opções de `T`. Usada nas listas de campos de cada leitor
 * (R4c: campo novo no tipo sem leitor quebra o build) e nas listas de valores aceitos (benefício, ligação...).
 * Uso: `listaCompleta<keyof Aparelho>()(["id", ...])`. Se faltar algo, o erro mostra `faltam: "campoNovo"`.
 */
export function listaCompleta<T>() {
  return <const L extends readonly T[]>(lista: L & ([Exclude<T, L[number]>] extends [never] ? unknown : { faltam: Exclude<T, L[number]> })): L => lista;
}

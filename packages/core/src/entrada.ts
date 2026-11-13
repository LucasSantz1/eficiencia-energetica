/**
 * Leitura do número que a pessoa digita, no jeito brasileiro ("1.359,90"). Troca os `Number(t.replace(...))` das telas,
 * que liam "135.90" como 13.590 e aceitavam "1e309" e "0x10" (HIS-003a, D2).
 * Só confere se o texto é um número bem escrito. Se ele está na faixa é com `validarFaixa` (`limites.ts`).
 */
export type NumeroDigitado = { tipo: "vazio" } | { tipo: "mal-escrito" } | { tipo: "numero"; valor: number };

/** Mais do que isso não é número digitado por gente (e evita texto colado gigante). */
const MAXIMO_DE_CARACTERES = 15;

const SO_DIGITOS = /^\d+$/;
const MILHAR_EM_GRUPOS_DE_3 = /^\d{1,3}(\.\d{3})+$/;
const PONTO_DECIMAL_NO_FIM = /^(\d+)\.(\d{1,2})$/;

/**
 * - Com vírgula: a vírgula separa os centavos e os pontos são de milhar, em grupos de 3.
 * - Sem vírgula: ponto seguido de 1 ou 2 dígitos no fim é decimal ("135.90" = 135,9); de 3 dígitos é milhar ("1.500").
 * - Recusa sinal, letra, expoente, mais de uma vírgula e mais casas decimais do que `casas`.
 */
export function lerNumeroDigitado(texto: string, casas: 0 | 2): NumeroDigitado {
  const limpo = texto.trim();
  if (limpo.length === 0) return { tipo: "vazio" };
  if (limpo.length > MAXIMO_DE_CARACTERES) return { tipo: "mal-escrito" };

  const partes = limpo.split(",");
  if (partes.length > 2) return { tipo: "mal-escrito" };
  const [inteira = "", decimal] = partes;

  if (decimal !== undefined) {
    if (!SO_DIGITOS.test(decimal) || decimal.length > casas) return { tipo: "mal-escrito" };
    const digitosInteiros = parteInteira(inteira);
    return digitosInteiros === undefined ? { tipo: "mal-escrito" } : numero(`${digitosInteiros}.${decimal}`);
  }

  const comPontoDecimal = PONTO_DECIMAL_NO_FIM.exec(inteira);
  if (comPontoDecimal) {
    const [, antes = "", depois = ""] = comPontoDecimal;
    return depois.length > casas ? { tipo: "mal-escrito" } : numero(`${antes}.${depois}`);
  }

  const digitosInteiros = parteInteira(inteira);
  return digitosInteiros === undefined ? { tipo: "mal-escrito" } : numero(digitosInteiros);
}

/** Dígitos da parte inteira, sem os pontos de milhar; `undefined` se estiver mal escrita. */
function parteInteira(texto: string): string | undefined {
  if (SO_DIGITOS.test(texto)) return texto;
  if (MILHAR_EM_GRUPOS_DE_3.test(texto)) return texto.replaceAll(".", "");
  return undefined;
}

function numero(normalizado: string): NumeroDigitado {
  const valor = Number(normalizado);
  return Number.isFinite(valor) ? { tipo: "numero", valor } : { tipo: "mal-escrito" };
}

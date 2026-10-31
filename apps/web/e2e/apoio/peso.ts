/*
 * Peso de JavaScript (critério 9): compara o medido com a referência versionada em `e2e/peso-js.json`.
 * Funções puras (recebem números, devolvem problemas): o peso-js.spec.ts e o N6 do sanidade.spec.ts usam as mesmas.
 *
 * Os limites são constantes de código, nunca do JSON nem de variável de ambiente (Aa13): afrouxar exige mudar este
 * arquivo num PR, à vista. Decisão do tech-lead na HIS-001 (2026-10-29, commit da2a3c4), item 11:
 *   11a · JS que o HTML de cada rota referencia (o que a página precisa para abrir): até +1 024 B (gzip);
 *   11b · JS total baixado depois do prefetch dos <Link>: até +2 048 B.
 */

export const LIMITE_JS_DO_HTML = 1024;
export const LIMITE_TOTAL_COM_PREFETCH = 2048;

export type CampoDePeso = "jsDoHtml" | "totalComPrefetch";
export type PesoDaMedida = Partial<Record<CampoDePeso, number>>;
export type PesosPorMedida = Record<string, PesoDaMedida>;

export interface ReferenciaDePeso {
  medidoNoCommit: string;
  rotas: PesosPorMedida;
}

const LIMITES: Record<CampoDePeso, number> = { jsDoHtml: LIMITE_JS_DO_HTML, totalComPrefetch: LIMITE_TOTAL_COM_PREFETCH };
const CAMPOS: readonly CampoDePeso[] = ["jsDoHtml", "totalComPrefetch"];

export interface LinhaDoPeso {
  medida: string;
  campo: CampoDePeso;
  referencia: number | null;
  medido: number;
  diferenca: number | null;
  limite: number;
}

export interface ComparacaoDePeso {
  /** Reprovam o teste. */
  erros: string[];
  /** Não reprovam: a página ficou bem mais leve e a referência deveria descer para o ganho não se perder. */
  anotacoes: string[];
  linhas: LinhaDoPeso[];
}

/**
 * Contrato: a referência tem exatamente as medidas e os campos medidos. Falta = "sem referência" (erro); sobra =
 * "referência sem medida" (erro, para o JSON não guardar número que ninguém confere).
 */
export function compararPeso(referencia: PesosPorMedida, medido: PesosPorMedida): ComparacaoDePeso {
  const resultado: ComparacaoDePeso = { erros: [], anotacoes: [], linhas: [] };

  for (const [medida, pesos] of Object.entries(medido)) {
    const ref = referencia[medida];
    for (const campo of CAMPOS) {
      const valor = pesos[campo];
      if (valor === undefined) {
        if (ref?.[campo] !== undefined) resultado.erros.push(`${medida} · ${campo}: referência sem medida — tire do peso-js.json`);
        continue;
      }
      const valorDeReferencia = ref?.[campo];
      const limite = LIMITES[campo];
      if (valorDeReferencia === undefined) {
        resultado.erros.push(`${medida} · ${campo}: rota sem referência no peso-js.json (medido ${valor} B)`);
        resultado.linhas.push({ medida, campo, referencia: null, medido: valor, diferenca: null, limite });
        continue;
      }
      const diferenca = valor - valorDeReferencia;
      resultado.linhas.push({ medida, campo, referencia: valorDeReferencia, medido: valor, diferenca, limite });
      if (diferenca > limite) {
        resultado.erros.push(`${medida} · ${campo}: ${valor} B, ${diferenca} B acima da referência (limite +${limite} B)`);
      } else if (diferenca < -limite) {
        resultado.anotacoes.push(`${medida} · ${campo}: ${-diferenca} B abaixo da referência — atualize a referência para o ganho não se perder`);
      }
    }
  }
  for (const medida of Object.keys(referencia)) {
    if (!(medida in medido)) resultado.erros.push(`${medida}: referência sem medida — tire do peso-js.json`);
  }
  return resultado;
}

const sinal = (n: number) => (n > 0 ? `+${n}` : String(n));

/** Tabela em Markdown para o relatório e o resumo do job. */
export function tabelaDoPeso(linhas: readonly LinhaDoPeso[]): string {
  const cabecalho = "| Rota | Medida | Referência (B) | Medido (B) | Diferença (B) | Limite (B) |\n| --- | --- | ---: | ---: | ---: | ---: |";
  const corpo = linhas.map(
    (l) =>
      `| \`${l.medida}\` | ${l.campo === "jsDoHtml" ? "11a · JS do HTML" : "11b · total com prefetch"} | ${l.referencia ?? "—"} | ${l.medido} | ${l.diferenca === null ? "—" : sinal(l.diferenca)} | +${l.limite} |`,
  );
  return [cabecalho, ...corpo].join("\n");
}

/** Valida o JSON lido do disco (dado de fora entra validado). */
export function lerReferenciaDePeso(bruto: unknown): ReferenciaDePeso {
  if (typeof bruto !== "object" || bruto === null) throw new Error("peso-js.json não é um objeto");
  if (!("medidoNoCommit" in bruto) || typeof bruto.medidoNoCommit !== "string") throw new Error("peso-js.json sem medidoNoCommit");
  if (!("rotas" in bruto) || typeof bruto.rotas !== "object" || bruto.rotas === null) throw new Error("peso-js.json sem rotas");
  const rotas: PesosPorMedida = {};
  for (const [medida, pesos] of Object.entries(bruto.rotas)) {
    if (typeof pesos !== "object" || pesos === null) throw new Error(`peso-js.json: ${medida} não é um objeto`);
    const lido: PesoDaMedida = {};
    for (const [campo, valor] of Object.entries(pesos)) {
      const campoConhecido = CAMPOS.find((c) => c === campo);
      if (!campoConhecido) throw new Error(`peso-js.json: ${medida} tem o campo desconhecido "${campo}"`);
      if (typeof valor !== "number" || !Number.isInteger(valor) || valor < 0) throw new Error(`peso-js.json: ${medida} · ${campo} não é um número de bytes`);
      lido[campoConhecido] = valor;
    }
    rotas[medida] = lido;
  }
  return { medidoNoCommit: bruto.medidoNoCommit, rotas };
}

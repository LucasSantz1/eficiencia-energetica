import { acharColuna, normalizar, type Linha } from "../util";
import { soDigitos } from "./tarifas";

/**
 * A ANEEL não publica uma lista direta "município → distribuidora". Ela sai do cruzamento de dois conjuntos
 * de Indicadores de Qualidade, ligados pelo "conjunto elétrico" (grupo de unidades consumidoras):
 *
 * 1. IndQual Município — quais municípios cada conjunto elétrico atende.
 *    https://dadosabertos.aneel.gov.br/dataset/indqual-municipio
 * 2. Indicadores Coletivos de Continuidade (atributos) — a qual distribuidora cada conjunto pertence.
 *    https://dadosabertos.aneel.gov.br/dataset/indicadores-coletivos-de-continuidade-dec-e-fec
 */
export const URL_CONJUNTOS_MUNICIPIOS =
  "https://dadosabertos.aneel.gov.br/dataset/db9c9f60-b3b5-4504-9dfe-2637922d53ce/resource/3f841488-80a8-42f2-a6ca-e0c593b228de/download/indqual-municipio.csv";
export const URL_CONJUNTOS_DISTRIBUIDORAS =
  "https://dadosabertos.aneel.gov.br/dataset/d5f0712e-62f6-4736-8dff-9991f10758a7/resource/3c780aca-38cf-406d-9d45-f07a9216eef2/download/indicadores-continuidade-coletivos-atributos.csv";

export interface VinculoMunicipio {
  ibge: number;
  /** Sigla do agente como aparece no conjunto. */
  agente?: string;
  cnpj?: string;
  /** Último `AnoIndice` do conjunto em que esse dono apareceu (HIS-111, D3: conjunto que parou de reportar). */
  ano?: number;
}

export interface DonoConjunto {
  agente: string;
  cnpj?: string;
  ano: number;
}

/** Colunas do conjunto "atributos": IdeConjUndConsumidoras, SigAgente, NumCNPJ, AnoIndice. */
export function mapearColunasConjuntos(cabecalho: string[]) {
  const conjunto = acharColuna(cabecalho, "IdeConjUndConsumidoras", "IdeConjUnidConsumidoras", /^ideconj/);
  const agente = acharColuna(cabecalho, "SigAgente", /^sigagente/);
  const cnpj = acharColuna(cabecalho, "NumCNPJ", /cnpj/);
  const ano = acharColuna(cabecalho, "AnoIndice", /^ano/);
  if (!conjunto || !agente) throw new Error(`Colunas de conjunto/distribuidora não encontradas. Cabeçalho: ${cabecalho.join(" | ")}`);
  return { conjunto, agente, cnpj, ano };
}

/**
 * Acumulador para ler o arquivo de atributos em streaming (ele é grande): para cada conjunto,
 * guarda a distribuidora do ano mais recente — concessões mudam de dono com o tempo.
 */
export function criarLeitorConjuntos(c: ReturnType<typeof mapearColunasConjuntos>) {
  const donos = new Map<string, DonoConjunto>();
  /** CNPJ → todas as siglas com que ele aparece, em qualquer ano (V10 da HIS-111). */
  const siglasPorCnpj = new Map<string, Set<string>>();
  /** Linhas por `AnoIndice`: mostra no diagnóstico até que ano o arquivo vai de verdade (passo 0: parou em 2014). */
  const linhasPorAno = new Map<number, number>();
  let anoMaisRecente = 0;
  return {
    donos,
    siglasPorCnpj,
    linhasPorAno,
    /** Nome da coluna usada como ano (o diagnóstico mostra, para conferir que é mesmo o `AnoIndice`). */
    colunaDoAno: c.ano,
    /** Maior `AnoIndice` do arquivo (0 sem a coluna). Um conjunto que parou antes disso deixou de reportar (HIS-111, D3). */
    get anoMaisRecente() {
      return anoMaisRecente;
    },
    ler(linha: Linha) {
      const conjunto = soDigitos(linha[c.conjunto]);
      const agente = linha[c.agente]?.trim();
      if (!conjunto || !agente) return;
      const ano = c.ano ? Number(soDigitos(linha[c.ano]).slice(0, 4)) || 0 : 0;
      if (ano > anoMaisRecente) anoMaisRecente = ano;
      linhasPorAno.set(ano, (linhasPorAno.get(ano) ?? 0) + 1);
      const cnpj = c.cnpj ? soDigitos(linha[c.cnpj]) || undefined : undefined;
      if (cnpj) siglasPorCnpj.set(cnpj, (siglasPorCnpj.get(cnpj) ?? new Set<string>()).add(agente));
      const atual = donos.get(conjunto);
      if (!atual || ano > atual.ano) donos.set(conjunto, { agente, cnpj, ano });
    },
  };
}

/** Colunas do conjunto "IndQual Município": IdeConjUnidConsumidoras, CodMunicipio. */
export function mapearColunasMunicipios(cabecalho: string[]) {
  const conjunto = acharColuna(cabecalho, "IdeConjUnidConsumidoras", "IdeConjUndConsumidoras", /^ideconj/);
  const ibge = acharColuna(cabecalho, "CodMunicipio", "CodMunicipioIbge", /ibge/, /codmunic/);
  if (!conjunto || !ibge) throw new Error(`Colunas de conjunto/município não encontradas. Cabeçalho: ${cabecalho.join(" | ")}`);
  return { conjunto, ibge };
}

/** Cruza conjunto → município com conjunto → distribuidora. */
export function lerVinculos(linhas: Linha[], c: ReturnType<typeof mapearColunasMunicipios>, donos: Map<string, DonoConjunto>): { vinculos: Map<number, VinculoMunicipio[]>; conjuntosSemDono: number } {
  const vinculos = new Map<number, VinculoMunicipio[]>();
  const semDono = new Set<string>();
  for (const linha of linhas) {
    const conjunto = soDigitos(linha[c.conjunto]);
    const digitos = soDigitos(linha[c.ibge]);
    if (!conjunto || digitos.length < 6) continue;
    const dono = donos.get(conjunto);
    if (!dono) {
      semDono.add(conjunto);
      continue;
    }
    const ibge = Number(digitos);
    const lista = vinculos.get(ibge) ?? [];
    const mesmo = lista.find((v) => normalizar(v.agente) === normalizar(dono.agente));
    // O mesmo dono em dois conjuntos da cidade: vale o conjunto mais recente (um deles pode ter parado de reportar).
    if (!mesmo) lista.push({ ibge, agente: dono.agente, cnpj: dono.cnpj, ano: dono.ano });
    else if (dono.ano > (mesmo.ano ?? 0)) mesmo.ano = dono.ano;
    vinculos.set(ibge, lista);
  }
  return { vinculos, conjuntosSemDono: semDono.size };
}

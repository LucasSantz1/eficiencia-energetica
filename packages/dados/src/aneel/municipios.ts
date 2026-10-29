import { acharColuna, normalizar, type Linha } from "../util";
import { soDigitos } from "./tarifas";

/**
 * Conjunto "IndQual Município" da ANEEL: liga cada município às distribuidoras que o atendem.
 * https://dadosabertos.aneel.gov.br/dataset/indqual-municipio
 */
export const URL_MUNICIPIOS_DISTRIBUIDORAS =
  "https://dadosabertos.aneel.gov.br/dataset/db9c9f60-b3b5-4504-9dfe-2637922d53ce/resource/3f841488-80a8-42f2-a6ca-e0c593b228de/download/indqual-municipio.csv";

export interface VinculoMunicipio {
  ibge: number;
  /** Sigla ou nome do agente como aparece no conjunto. */
  agente?: string;
  cnpj?: string;
  ano?: number;
}

export function mapearColunasMunicipios(cabecalho: string[]) {
  const ibge = acharColuna(cabecalho, "CodMunicipioIbge", "CodMunicipio", "CodIBGE", /ibge/, /codmunic/);
  const agente = acharColuna(cabecalho, "SigAgente", "SigAgenteDistribuidora", "NomAgente", /^sigagente/, /agente/, /distribuidora/);
  const cnpj = acharColuna(cabecalho, "NumCNPJ", "NumCNPJDistribuidora", /cnpj/);
  const ano = acharColuna(cabecalho, "AnoIndice", "AnoReferencia", "NumAno", /^ano/, /ano$/);
  if (!ibge || (!agente && !cnpj)) {
    throw new Error(`Colunas de município/distribuidora não encontradas. Cabeçalho: ${cabecalho.join(" | ")}`);
  }
  return { ibge, agente, cnpj, ano };
}

/**
 * Para cada município, guarda os agentes do ano mais recente em que ele aparece
 * (o conjunto tem histórico desde 2001, e concessões mudam de dono).
 */
export function lerVinculos(linhas: Linha[], c: ReturnType<typeof mapearColunasMunicipios>): Map<number, VinculoMunicipio[]> {
  const porMunicipio = new Map<number, VinculoMunicipio[]>();
  for (const linha of linhas) {
    const digitos = soDigitos(linha[c.ibge]);
    if (digitos.length < 6) continue;
    // Alguns conjuntos usam o código de 6 dígitos (sem o verificador); guardamos como veio e casamos depois.
    const ibge = Number(digitos);
    const agente = c.agente ? linha[c.agente]?.trim() : undefined;
    const cnpj = c.cnpj ? soDigitos(linha[c.cnpj]) || undefined : undefined;
    const ano = c.ano ? Number(soDigitos(linha[c.ano]).slice(0, 4)) || undefined : undefined;
    if (!agente && !cnpj) continue;
    const lista = porMunicipio.get(ibge) ?? [];
    lista.push({ ibge, agente, cnpj, ano });
    porMunicipio.set(ibge, lista);
  }
  for (const [ibge, lista] of porMunicipio) {
    const maisRecente = Math.max(...lista.map((v) => v.ano ?? 0));
    const recentes = lista.filter((v) => (v.ano ?? 0) === maisRecente);
    const unicos = new Map(recentes.map((v) => [`${normalizar(v.agente)}|${v.cnpj ?? ""}`, v]));
    porMunicipio.set(ibge, [...unicos.values()]);
  }
  return porMunicipio;
}

import type { Distribuidora } from "./tipos";

/**
 * A ANEEL identifica as distribuidoras por siglas (ESS, EMT, ELETROPAULO...), que não são o nome
 * que aparece na conta de luz. Esta lista traduz as principais para o nome comercial.
 * Distribuidoras que não estão aqui (principalmente cooperativas) aparecem pela sigla.
 */
const NOMES: Record<string, string> = {
  "Âmbar Amazonas": "Amazonas Energia",
  "Âmbar Roraima": "Roraima Energia",
  CEA: "CEA Equatorial",
  "CEEE-D": "CEEE Equatorial",
  CELESC: "Celesc",
  "CEMIG-D": "Cemig",
  COELBA: "Neoenergia Coelba",
  "COPEL-DIS": "Copel",
  COSERN: "Neoenergia Cosern",
  "CPFL-PAULISTA": "CPFL Paulista",
  "CPFL-PIRATINING": "CPFL Piratininga",
  "CPFL SANTA CRUZ": "CPFL Santa Cruz",
  "CPFL Santa Cruz": "CPFL Santa Cruz",
  "CPFL MOCOCA": "CPFL Mococa",
  "CPFL JAGUARI": "CPFL Jaguari",
  "CPFL LESTE PAULI": "CPFL Leste Paulista",
  "CPFL SUL PAULIST": "CPFL Sul Paulista",
  EAC: "Energisa Acre",
  EBO: "Energisa Borborema",
  EMR: "Energisa Minas Rio",
  EMS: "Energisa Mato Grosso do Sul",
  EMT: "Energisa Mato Grosso",
  ENF: "Energisa Nova Friburgo",
  EPB: "Energisa Paraíba",
  ERO: "Energisa Rondônia",
  ESE: "Energisa Sergipe",
  ESS: "Energisa Sul-Sudeste",
  ETO: "Energisa Tocantins",
  "EDP ES": "EDP Espírito Santo",
  "EDP SP": "EDP São Paulo",
  ELEKTRO: "Neoenergia Elektro",
  ELETROPAULO: "Enel São Paulo",
  "ENEL CE": "Enel Ceará",
  "ENEL RJ": "Enel Rio",
  "EQUATORIAL AL": "Equatorial Alagoas",
  "EQUATORIAL GO": "Equatorial Goiás",
  "EQUATORIAL MA": "Equatorial Maranhão",
  "EQUATORIAL PA": "Equatorial Pará",
  "EQUATORIAL PI": "Equatorial Piauí",
  "LIGHT SESA": "Light",
  "Neoenergia PE": "Neoenergia Pernambuco",
  "Neoenergia Brasília": "Neoenergia Brasília",
  RGE: "RGE",
  "RGE SUL": "RGE Sul",
  SULGIPE: "Sulgipe",
  CHESP: "Chesp",
  COCEL: "Cocel",
  DMED: "DME Poços de Caldas",
};

/** Nome que aparece na conta de luz (ou a sigla da ANEEL, se não soubermos o nome comercial). */
export function nomeDaDistribuidora(sigla: string): string {
  return NOMES[sigla] ?? sigla.replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

/** true quando conhecemos o nome comercial (senão vale mostrar também a sigla). */
export function temNomeComercial(sigla: string): boolean {
  return sigla in NOMES;
}

/**
 * O mínimo do `tarifas.json` para achar uma distribuidora pelo id guardado na casa (HIS-111, D7; ADR-005, item 4).
 *
 * `substituidas` é `unknown` de propósito: até o leitor da HIS-003a, o site lê o arquivo sem validar e pode receber
 * um arquivo antigo do cache ou malformado. As funções abaixo não confiam no formato e nunca lançam (R5 da
 * seguranca): `substituidas` que não é objeto simples é ignorado, e só vale valor que é texto e id publicado.
 */
export interface ArquivoParaBusca {
  distribuidoras: readonly Distribuidora[];
  substituidas?: unknown;
}

/** Mesmo formato do id que a rotina gera (`slug`), até 64 caracteres. Barra "__proto__" e afins antes de olhar o mapa. */
const FORMATO_DO_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TAMANHO_MAXIMO_DO_ID = 64;

function listaDe(arquivo: ArquivoParaBusca): readonly Distribuidora[] {
  return Array.isArray(arquivo.distribuidoras) ? arquivo.distribuidoras : [];
}

/** Id que ficou no lugar de `id`, se `substituidas` disser e for um texto. Um salto só: a rotina grava o id final. */
function substitutoDe(substituidas: unknown, id: string): string | undefined {
  if (id.length > TAMANHO_MAXIMO_DO_ID || !FORMATO_DO_ID.test(id)) return undefined;
  if (typeof substituidas !== "object" || substituidas === null || Array.isArray(substituidas)) return undefined;
  const prototipo: unknown = Object.getPrototypeOf(substituidas);
  if (prototipo !== Object.prototype && prototipo !== null) return undefined;
  // Object.hasOwn: o id vem do localStorage, e "constructor" acharia a função do protótipo.
  if (!Object.hasOwn(substituidas, id)) return undefined;
  const valor: unknown = Object.getOwnPropertyDescriptor(substituidas, id)?.value;
  return typeof valor === "string" ? valor : undefined;
}

/**
 * Acha a distribuidora pelo id guardado. Se o id saiu do arquivo (empresa renomeada ou incorporada), usa a que ficou
 * no lugar. Assim o preço fica certo desde a primeira tela, mesmo antes de a casa ser regravada com o id novo.
 */
export function acharDistribuidora(arquivo: ArquivoParaBusca, id: string): Distribuidora | undefined {
  const lista = listaDe(arquivo);
  const direta = lista.find((d) => d.id === id);
  if (direta) return direta;
  const para = substitutoDe(arquivo.substituidas, id);
  return para === undefined ? undefined : lista.find((d) => d.id === para);
}

/**
 * As distribuidoras de uma cidade, na ordem da rotina (a principal primeiro), trocando os ids antigos pelos de hoje,
 * sem repetir (Campina Grande: EPB e EBO viram a EPB uma vez) e sem o que não existe no arquivo. Serve também para um
 * `municipios/{UF}.json` antigo no cache, que ainda traga o id antigo.
 */
export function distribuidorasDaCidade(arquivo: ArquivoParaBusca, ids: readonly string[]): Distribuidora[] {
  const vistas = new Set<string>();
  const resultado: Distribuidora[] = [];
  for (const id of ids) {
    const d = acharDistribuidora(arquivo, id);
    if (!d || vistas.has(d.id)) continue;
    vistas.add(d.id);
    resultado.push(d);
  }
  return resultado;
}

/**
 * A troca que a casa salva precisa fazer, uma vez, para guardar o id de hoje: só quando `de` não está publicado e
 * `para` está. Por isso `a → a` e `a → b` + `b → a` nunca pedem regravação, e a regravação não entra em laço (R6).
 */
export function trocaDeDistribuidora(arquivo: ArquivoParaBusca, id: string): { de: string; para: string } | undefined {
  const lista = listaDe(arquivo);
  if (lista.some((d) => d.id === id)) return undefined;
  const nova = acharDistribuidora(arquivo, id);
  return nova && nova.id !== id ? { de: id, para: nova.id } : undefined;
}

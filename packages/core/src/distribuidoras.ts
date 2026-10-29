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

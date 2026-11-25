/**
 * Ligações de cidade × distribuidora fora das UFs principais da distribuidora que conferimos e aceitamos (HIS-206).
 * Qualquer ligação nova desse tipo que não esteja aqui (nem no CODIGOS_TROCADOS do core) para a rotina no V11: pode ser
 * um código de município trocado no IndQual da ANEEL (Nova Santa Rita PI × CERTAJA) e a conta sairia com o preço de
 * outra empresa.
 *
 * - "fronteira": cidade na divisa com a área principal da distribuidora; a ANEEL publica a ligação e ela faz sentido.
 * - "area-propria": área da distribuidora em outro estado, conferida (ex.: a antiga CFLO de Guarapuava, PR, na ESS).
 * - "a-conferir": sem evidência de erro nem de acerto; fica publicada até o dominio-energia confirmar com a ANEEL.
 *
 * Fonte: IndQual Município e atributos dos conjuntos (dadosabertos.aneel.gov.br), publicados até 10/11/2026.
 */
export interface LigacaoDeOutraUf {
  distribuidora: string;
  ibge: number;
  situacao: "fronteira" | "area-propria" | "a-conferir";
  nota: string;
}

/** Uma UF com pelo menos este número de cidades da distribuidora é área principal dela (não precisa estar na lista). */
export const CIDADES_PARA_UF_PRINCIPAL = 5;
/**
 * ...ou quando tem pelo menos esta parte das cidades dela e 2 cidades ou mais. Uma cidade sozinha em outro estado precisa
 * estar nesta lista, mesmo numa cooperativa pequena: é o formato do erro do IndQual (1 cidade trocada).
 */
export const PARTE_PARA_UF_PRINCIPAL = 0.2;
/** Exceção: distribuidora com até este número de cidades (CERES: 2 no RJ e 1 em MG), onde 1 cidade já é a divisa. */
export const CIDADES_DA_DISTRIBUIDORA_MINUSCULA = 3;

export const LIGACOES_DE_OUTRA_UF: readonly LigacaoDeOutraUf[] = [
  { distribuidora: "sulgipe", ibge: 2917904, situacao: "fronteira", nota: "Jandaíra (BA), divisa com SE" },
  { distribuidora: "sulgipe", ibge: 2927002, situacao: "fronteira", nota: "Rio Real (BA), divisa com SE" },
  { distribuidora: "cemig-d", ibge: 2932606, situacao: "a-conferir", nota: "Urandi (BA), divisa com MG" },
  { distribuidora: "cemig-d", ibge: 5220405, situacao: "a-conferir", nota: "São Simão (GO), divisa com MG (usina de São Simão)" },
  { distribuidora: "emr", ibge: 3301207, situacao: "fronteira", nota: "Carmo (RJ), divisa com MG" },
  { distribuidora: "emr", ibge: 3303401, situacao: "fronteira", nota: "Nova Friburgo (RJ)" },
  { distribuidora: "emr", ibge: 3305703, situacao: "fronteira", nota: "Sumidouro (RJ)" },
  { distribuidora: "cpfl-santa-cruz", ibge: 3104106, situacao: "fronteira", nota: "Arceburgo (MG), divisa com SP" },
  { distribuidora: "cpfl-santa-cruz", ibge: 3132909, situacao: "fronteira", nota: "Itamogi (MG), divisa com SP" },
  { distribuidora: "cpfl-santa-cruz", ibge: 3143203, situacao: "fronteira", nota: "Monte Santo de Minas (MG), divisa com SP" },
  { distribuidora: "cpfl-santa-cruz", ibge: 4102703, situacao: "fronteira", nota: "Barra do Jacaré (PR), divisa com SP" },
  { distribuidora: "cpfl-santa-cruz", ibge: 4111803, situacao: "fronteira", nota: "Jacarezinho (PR), divisa com SP" },
  { distribuidora: "cpfl-santa-cruz", ibge: 4121802, situacao: "fronteira", nota: "Ribeirão Claro (PR), divisa com SP" },
  { distribuidora: "enel-rj", ibge: 3107208, situacao: "fronteira", nota: "Bocaina de Minas (MG), divisa com RJ" },
  { distribuidora: "enel-rj", ibge: 3151107, situacao: "fronteira", nota: "Pirapetinga (MG), divisa com RJ" },
  { distribuidora: "ceres", ibge: 3107208, situacao: "fronteira", nota: "Bocaina de Minas (MG), divisa com RJ" },
  { distribuidora: "ess", ibge: 4109401, situacao: "area-propria", nota: "Guarapuava (PR): área da antiga CFLO (Companhia Força e Luz do Oeste), hoje na ESS" },
  { distribuidora: "neoenergia-pe", ibge: 2506707, situacao: "fronteira", nota: "Imaculada (PB), divisa com PE" },
  { distribuidora: "neoenergia-pe", ibge: 2511202, situacao: "fronteira", nota: "Pedras de Fogo (PB), divisa com PE" },
  { distribuidora: "neoenergia-pe", ibge: 2515500, situacao: "fronteira", nota: "Serra Branca (PB)" },
  { distribuidora: "neoenergia-pe", ibge: 2201739, situacao: "fronteira", nota: "Betânia do Piauí (PI), divisa com PE" },
  { distribuidora: "copel-dis", ibge: 4213609, situacao: "fronteira", nota: "Porto União (SC), cidade gêmea de União da Vitória (PR)" },
  { distribuidora: "celesc", ibge: 4122305, situacao: "fronteira", nota: "Rio Negro (PR), cidade gêmea de Mafra (SC)" },
];

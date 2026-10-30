/**
 * Tipos compartilhados entre o site, o futuro app e a rotina de dados.
 * Valores de energia em kWh e valores monetários em reais (R$).
 */

/** Bandeiras tarifárias definidas pela ANEEL. */
export type Bandeira = "verde" | "amarela" | "vermelha-1" | "vermelha-2" | "escassez-hidrica";

export interface BandeiraMes {
  /** Mês de competência no formato AAAA-MM. */
  competencia: string;
  bandeira: Bandeira;
  /** Nome como a ANEEL publica (ex.: "Vermelha P1"). */
  nome: string;
  /** Adicional cobrado por kWh, em R$/kWh (sem impostos). */
  adicionalKwh: number;
}

/** Tarifa residencial (subgrupo B1, convencional) vigente de uma distribuidora. */
export interface Distribuidora {
  /** Identificador estável derivado da sigla da ANEEL (ex.: "cemig-d"). */
  id: string;
  /** Sigla exatamente como a ANEEL publica (ex.: "CEMIG-D"). */
  sigla: string;
  cnpj?: string;
  /** Estados onde atende (UF). */
  ufs: string[];
  /** Tarifa de Energia, em R$/kWh (sem impostos). */
  teKwh: number;
  /** Tarifa de Uso do Sistema de Distribuição, em R$/kWh (sem impostos). */
  tusdKwh: number;
  /** TE + TUSD, em R$/kWh (sem impostos e sem bandeira). */
  tarifaKwh: number;
  /** Início da vigência (AAAA-MM-DD). */
  inicioVigencia: string;
  /** Fim da vigência (AAAA-MM-DD), quando informado. */
  fimVigencia?: string;
  /** Resolução homologatória que definiu a tarifa. */
  resolucao?: string;
}

export interface Municipio {
  /** Código IBGE com 7 dígitos. */
  ibge: number;
  nome: string;
  uf: string;
  /** Ids das distribuidoras que atendem o município (pode haver mais de uma). */
  distribuidoras: string[];
}

export interface Estado {
  uf: string;
  nome: string;
  /** Distribuidoras que atendem alguma cidade do estado. */
  distribuidoras: string[];
}

/** Arquivo /dados/tarifas.json gerado pela rotina de dados. */
export interface ArquivoTarifas {
  geradoEm: string;
  origem: "aneel" | "exemplo";
  fontes: string[];
  distribuidoras: Distribuidora[];
  bandeiras: BandeiraMes[];
  estados: Estado[];
  /**
   * Id que saiu do arquivo → id que ficou no lugar (empresa renomeada ou incorporada; HIS-111, ADR-005). Sempre o
   * id final. Ausente = nenhuma troca (arquivo antigo no cache, `dados:exemplo` de antes da HIS-111).
   * A rotina grava sempre, com as chaves em ordem. Antes do leitor da HIS-003a o site lê sem validar: use
   * `acharDistribuidora` e `distribuidorasDaCidade`, que não confiam no formato.
   */
  substituidas?: Readonly<Record<string, string>>;
}

/** Arquivo /dados/municipios/{UF}.json gerado pela rotina de dados. */
export interface ArquivoMunicipios {
  uf: string;
  geradoEm: string;
  origem: "aneel" | "exemplo";
  municipios: Municipio[];
}

/**
 * Benefícios da conta de luz para famílias de baixa renda (Lei 15.235/2025):
 * - tarifa-social: CadÚnico com renda por pessoa de até meio salário mínimo, BPC, indígenas e quilombolas.
 *   Isenção total até 80 kWh/mês.
 * - desconto-social: CadÚnico com renda por pessoa entre meio e um salário mínimo.
 *   Desconto (isenção da CDE) até 120 kWh/mês.
 */
export type Beneficio = "nenhum" | "tarifa-social" | "desconto-social" | "nao-sei";

/** Tipo de ligação do padrão de entrada; define o consumo mínimo cobrado. */
export type Ligacao = "monofasica" | "bifasica" | "trifasica" | "nao-sei";

export interface ContaReferencia {
  /** Consumo da conta, em kWh. */
  kwh: number;
  /** Valor total pago, em R$. */
  valor: number;
}

export interface Residencia {
  uf: string;
  municipioIbge: number;
  municipioNome: string;
  distribuidoraId: string;
  beneficio: Beneficio;
  ligacao: Ligacao;
  /** Última conta de luz, usada para calibrar o preço real do kWh (com impostos). */
  contaReferencia?: ContaReferencia;
  /** Quantas pessoas moram na casa (usado para sugerir banhos e carregadores). */
  pessoas?: number;
}

export type TipoComodo =
  | "cozinha"
  | "sala"
  | "quarto"
  | "banheiro"
  | "lavanderia"
  | "escritorio"
  | "area-externa"
  | "outro";

export interface Comodo {
  id: string;
  nome: string;
  tipo: TipoComodo;
}

export interface Aparelho {
  id: string;
  comodoId: string;
  /** Id do item do catálogo usado como ponto de partida, se houver. */
  catalogoId?: string;
  nome: string;
  quantidade: number;
  /** Potência em watts (W), como aparece na etiqueta. */
  potenciaW: number;
  /** Tempo ligado por dia, em minutos. */
  minutosPorDia: number;
  /** Quantos dias por semana o aparelho é usado (1 a 7). */
  diasPorSemana: number;
  /** Para chuveiros: banhos por dia × minutos por banho (minutosPorDia é o produto dos dois). */
  banho?: { banhosPorDia: number; minutosPorBanho: number };
  /**
   * Parte do tempo ligado em que o aparelho puxa a potência cheia (0 a 1). Ex.: o compressor do
   * ar-condicionado desliga sozinho quando o cômodo esfria. Sem valor, conta como 1.
   */
  fatorCiclo?: number;
  /** Respostas sobre o modelo (ex.: { tipo: "split-inverter", btus: "12000" }). */
  variantes?: Record<string, string>;
  /**
   * Consumo mensal informado diretamente (kWh/mês), como na etiqueta do INMETRO.
   * Quando presente, substitui o cálculo potência × tempo — usado para geladeiras e freezers,
   * que ligam e desligam o motor sozinhos.
   */
  kwhMesInformado?: number;
}

/** Conta de luz de um mês, registrada no acompanhamento. */
export interface ContaMensal {
  id: string;
  /** Mês de referência (AAAA-MM). */
  competencia: string;
  /** Consumo faturado, em kWh. */
  kwh: number;
  /** Valor total pago, em R$. */
  valor: number;
}

/** Leitura do relógio de luz (medidor), anotada pela pessoa num dia qualquer. */
export interface LeituraRelogio {
  id: string;
  /** Data da leitura (AAAA-MM-DD). */
  data: string;
  /** Número que aparece no relógio, em kWh. */
  valorKwh: number;
}

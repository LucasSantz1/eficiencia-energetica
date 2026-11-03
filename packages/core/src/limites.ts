import { DIAS_NO_MES } from "./calculos";
import { aplicarVariantes, CATALOGO, itemDoCatalogo, type ItemCatalogo } from "./catalogo";
import type { Beneficio, ContaReferencia, LeituraRelogio } from "./tipos";

/**
 * Limites de tudo o que a pessoa digita e de tudo o que o site lê de fora (casa salva no aparelho e arquivos de /dados).
 * É o único lugar com esses números (HIS-003a, ADR-004). As faixas e as fontes são do dominio-energia
 * ("Regras de negócio e fontes" da HIS-003, consultadas em 2026-10-30).
 *
 * Dois níveis:
 * - rígido (`min`/`max`): valor impossível ou corrompido. A tela não deixa salvar e a leitura da casa salva tira o item.
 * - alerta (`alerta`): possível, mas raro, quase sempre erro de digitação. A tela pergunta "Confere?" e nunca descarta.
 * Os limites são inclusivos (mín ≤ x ≤ máx), salvo `minExclusivo`.
 */
export interface Faixa {
  min: number;
  max: number;
  /** Só número inteiro. */
  inteiro?: boolean;
  /** Máximo de casas decimais (dinheiro: 2). */
  casas?: number;
  /** O mínimo não vale: o número precisa ser maior que ele. */
  minExclusivo?: boolean;
  /** Folga nas duas pontas, para números fracionários como 7/30. */
  tolerancia?: number;
  /** Acima disto (sem incluir) a tela pergunta "Confere?". Nunca descarta. */
  alerta?: number;
}

export type ResultadoDaFaixa = "ok" | "alerta" | "fora";

/** Potência máxima de uma casa do grupo B (tensão abaixo de 2,3 kV): 75 kW (REN ANEEL 1.000/2021, art. 23, I, "a"). */
const CARGA_MAXIMA_DO_GRUPO_B_W = 75_000;
/** 75 kW × 24 h × 30 dias: o máximo físico que uma casa do grupo B consegue gastar num mês (REN ANEEL 1.000/2021, art. 23). */
const CONSUMO_MAXIMO_DO_GRUPO_B_KWH_MES = (CARGA_MAXIMA_DO_GRUPO_B_W / 1000) * 24 * DIAS_NO_MES;

export const LIMITES = {
  /** Mín.: menor potência do catálogo é 2 W. Máx.: um aparelho não passa da casa inteira (75 kW, REN 1.000/2021). Alerta: maior faixa do catálogo (`outro` até 10.000 W). */
  potenciaW: { min: 1, max: CARGA_MAXIMA_DO_GRUPO_B_W, inteiro: true, alerta: 10_000 },
  /** 24 h × 60 min (física). */
  minutosPorDia: { min: 1, max: 1_440, inteiro: true },
  /** Menor opção é "1 vez por mês" = 7/30 dia por semana (`FREQUENCIAS`); a tolerância cobre a fração. */
  diasPorSemana: { min: 7 / 30, max: 7, tolerancia: 0.001 },
  /** Iguais à tela de banho. */
  banhosPorDia: { min: 1, max: 20, inteiro: true },
  minutosPorBanho: { min: 1, max: 60, inteiro: true },
  /** Igual ao `EditorAparelho`. Zero só existe no rascunho do cadastro (desmarcado, não é salvo). */
  quantidade: { min: 1, max: 60, inteiro: true },
  /** Parte do tempo com o motor ligado; o catálogo usa de 0,3 a 1. */
  fatorCiclo: { min: 0, max: 1, minExclusivo: true },
  /**
   * Etiqueta do INMETRO, kWh/mês. O catálogo vai de 15 (purificador) a 115 (side by side antiga). O maior compressor da
   * faixa de geladeira e freezer (250 W) ligado o mês todo dá 180 kWh: acima de 300 é erro. Alerta acima de 150.
   */
  kwhMesInformado: { min: 0.1, max: 300, alerta: 150 },
  /** Conta usada para calibrar o preço: precisa ter consumo. Máx.: 54.000 kWh (grupo B). Alerta: cerca de 11 vezes a média do país. */
  contaKwhCalibracao: { min: 1, max: CONSUMO_MAXIMO_DO_GRUPO_B_KWH_MES, alerta: 2_000 },
  /** Conta do acompanhamento: 0 kWh é possível (casa fechada). */
  contaKwhAcompanhamento: { min: 0, max: CONSUMO_MAXIMO_DO_GRUPO_B_KWH_MES, alerta: 2_000 },
  /** Máx.: 54.000 kWh × R$ 3,00 = R$ 162.000, arredondado para cima. Alerta: 2.000 kWh × R$ 1,50. Calibrar precisa de valor. */
  contaValorCalibracao: { min: 0.01, max: 200_000, casas: 2, alerta: 3_000 },
  /** R$ 0 é possível com a Tarifa Social. */
  contaValorAcompanhamento: { min: 0, max: 200_000, casas: 2, alerta: 3_000 },
  /** O mostrador do relógio tem de 4 a 6 dígitos (justificativa do dominio-energia, sem norma consultada). */
  leituraKwh: { min: 0, max: 999_999, inteiro: true },
  /** Média de 2,79 moradores por domicílio (IBGE, Censo 2022); 20 combina com o máximo de banhos por dia. */
  pessoas: { min: 1, max: 20, inteiro: true },
  /** Código IBGE do município: 7 dígitos (limite técnico do formato). */
  municipioIbge: { min: 1_000_000, max: 9_999_999, inteiro: true },
  /**
   * Tarifa B1 sem impostos (TE + TUSD), R$/kWh. No `tarifas.json` de 29/10/2026 vai de 0,35264 a 1,56923 (ANEEL, dados
   * abertos). Teto 1,9 vez a maior. O piso acima de 0,05 pega a divisão por 1.000 feita duas vezes (P-tl-2).
   */
  tarifaKwh: { min: 0.05, max: 3, minExclusivo: true },
  /** TE ou TUSD sozinha, R$/kWh. O zero entra porque a tarifa total já tem piso (P-tl-2). */
  componenteDaTarifaKwh: { min: 0, max: 3 },
  /**
   * Acréscimo da bandeira, R$/kWh. A maior já cobrada foi 0,142 (escassez hídrica, set/2021 a abr/2022, ANEEL).
   * O teto de 1,00 pega R$/MWh sem dividir (142) e R$/100 kWh (14,2) (P-tl-2).
   */
  adicionalDaBandeiraKwh: { min: 0, max: 1 },
} as const satisfies Record<string, Faixa>;

/**
 * Tamanho máximo de cada texto. `nomeComodo` e `nomeAparelho` são o `maxLength` das telas; `id`, `idDoPlano`,
 * `nomeMunicipio` e `variante` são limites técnicos (não são regra do setor): só impedem texto gigante.
 */
export const LIMITES_DE_TEXTO = { nomeComodo: 40, nomeAparelho: 60, nomeMunicipio: 80, id: 64, idDoPlano: 120, variante: 40 } as const;

/** Máximo de itens por lista na casa salva. Limite técnico (não é regra do setor): impede lista gigante travar o celular. Cômodos: 8 tipos × 10 do cadastro. */
export const LIMITES_DE_LISTA = { comodos: 80, aparelhos: 500, contas: 240, leituras: 1_000, plano: 500, variantes: 10 } as const;

/** Consumo entre duas leituras do relógio. Máximo: 75 kW × 24 h = 1.800 kWh por dia (REN 1.000/2021, art. 23). Alerta: cerca de 17 vezes a média (178,2 ÷ 30). */
export const KWH_POR_DIA_ENTRE_LEITURAS = { alerta: 100, maximo: (CARGA_MAXIMA_DO_GRUPO_B_W / 1000) * 24 } as const;

/**
 * Preço implícito da conta (valor ÷ kWh), em R$/kWh. É estimativa: só serve para pegar vírgula no lugar errado.
 * Tarifas B1 sem impostos vão de R$ 0,353 a R$ 1,569 (`tarifas.json`, ANEEL); a maior bandeira foi R$ 0,142; com ICMS,
 * PIS/COFINS e iluminação pública fica abaixo de R$ 3,00. Abaixo de 30 kWh o consumo mínimo distorce o preço.
 */
export const PRECO_DA_CONTA_POR_KWH = { min: 0.3, max: 3, kwhMinimo: 30 } as const;

/** Consumo estimado da casa acima do qual a tela pergunta "Confere?" (mesmo alerta da conta). */
export const CONSUMO_DA_CASA_ALERTA_KWH_MES = 2_000;

/** Média do consumo residencial do país em jun/2025, kWh/mês (EPE, Boletim Trimestral de Consumo de Eletricidade nº 22). O texto diz "perto de 180". */
export const MEDIA_BRASIL_KWH_MES = 178.2;

/** Diz se o número cabe na faixa. Número que não é finito (`NaN`, `Infinity`) está sempre fora. */
export function validarFaixa(faixa: Faixa, valor: number): ResultadoDaFaixa {
  if (!Number.isFinite(valor)) return "fora";
  const folga = faixa.tolerancia ?? 0;
  if (faixa.minExclusivo ? valor <= faixa.min : valor < faixa.min - folga) return "fora";
  if (valor > faixa.max + folga) return "fora";
  if (faixa.inteiro && !Number.isInteger(valor)) return "fora";
  if (faixa.casas !== undefined && !temNoMaximoCasas(valor, faixa.casas)) return "fora";
  if (faixa.alerta !== undefined && valor > faixa.alerta) return "alerta";
  return "ok";
}

function temNoMaximoCasas(valor: number, casas: number): boolean {
  const escalado = valor * 10 ** casas;
  // A folga cobre o erro do ponto flutuante (135,9 × 100 = 13590,000000000002).
  return Math.abs(escalado - Math.round(escalado)) < 1e-6;
}

/**
 * Preço por kWh da conta quando ele pede "Confere?"; `undefined` quando está no comum ou quando a regra não se aplica.
 * Não vale na Tarifa Social (a isenção dos primeiros kWh baixa o preço) nem abaixo de 30 kWh (o mínimo distorce).
 */
export function precoDaContaForaDoComum(conta: ContaReferencia, beneficio: Beneficio): number | undefined {
  if (beneficio === "tarifa-social") return undefined;
  if (!Number.isFinite(conta.kwh) || !Number.isFinite(conta.valor) || conta.kwh < PRECO_DA_CONTA_POR_KWH.kwhMinimo) return undefined;
  const preco = conta.valor / conta.kwh;
  return preco < PRECO_DA_CONTA_POR_KWH.min || preco > PRECO_DA_CONTA_POR_KWH.max ? preco : undefined;
}

/** Consumo por dia entre a leitura anterior e a nova quando ele pede "Confere?" (acima de 100 kWh por dia). */
export function alertaDaLeitura(anterior: LeituraRelogio, nova: LeituraRelogio): { kwhPorDia: number } | undefined {
  const [de, ate] = anterior.data <= nova.data ? [anterior, nova] : [nova, anterior];
  const dias = diasEntreDatas(de.data, ate.data);
  const kwh = ate.valorKwh - de.valorKwh;
  if (dias === undefined || dias <= 0 || kwh < 0) return undefined;
  const kwhPorDia = kwh / dias;
  return kwhPorDia > KWH_POR_DIA_ENTRE_LEITURAS.alerta ? { kwhPorDia } : undefined;
}

/** Consumo estimado da casa que pede "Confere?" (pega potência digitada com um zero a mais). */
export function consumoDaCasaForaDoComum(kwhMes: number): boolean {
  return kwhMes > CONSUMO_DA_CASA_ALERTA_KWH_MES;
}

/** Potência do chuveiro mais forte do catálogo, em W. Referência do "Confere?" da potência ("um chuveiro forte tem até 7.800 W"). */
export function potenciaDoChuveiroMaisForteW(): number {
  return itemDoCatalogo("chuveiro")?.faixaW[1] ?? 0;
}

/** Maior consumo de etiqueta do catálogo, em kWh/mês, entre todas as respostas possíveis. Referência do "Confere?" da etiqueta. */
export function maiorConsumoDeEtiquetaDoCatalogoKwh(): number {
  let maior = 0;
  for (const item of CATALOGO) {
    if (item.modo !== "etiqueta") continue;
    for (const escolhas of todasAsRespostas(item)) {
      const kwh = aplicarVariantes(item, escolhas).kwhMesInformado ?? item.kwhMes ?? 0;
      maior = Math.max(maior, kwh);
    }
  }
  return maior;
}

function todasAsRespostas(item: ItemCatalogo): Record<string, string>[] {
  let combinacoes: Record<string, string>[] = [{}];
  for (const variante of item.variantes ?? []) {
    combinacoes = combinacoes.flatMap((parcial) => variante.opcoes.map((opcao) => ({ ...parcial, [variante.id]: opcao.id })));
  }
  return combinacoes;
}

/** Dias entre duas datas AAAA-MM-DD, pelo calendário UTC; `undefined` se alguma não for data. */
function diasEntreDatas(de: string, ate: string): number | undefined {
  const inicio = milissegundosDaData(de);
  const fim = milissegundosDaData(ate);
  return inicio === undefined || fim === undefined ? undefined : Math.round((fim - inicio) / 86_400_000);
}

function milissegundosDaData(data: string): number | undefined {
  // Tamanho antes da expressão regular (R4d).
  if (data.length !== 10) return undefined;
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!partes) return undefined;
  return Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
}

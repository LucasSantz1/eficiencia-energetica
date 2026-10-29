import type { Aparelho, BandeiraMes, Distribuidora, Ligacao, Residencia } from "./tipos";

/** O projeto (e a ANEEL, para estimativas) considera o mês com 30 dias. */
export const DIAS_NO_MES = 30;

/** Consumo mínimo cobrado (custo de disponibilidade), em kWh, conforme a REN ANEEL 1.000/2021. */
export const CONSUMO_MINIMO_KWH: Record<Exclude<Ligacao, "nao-sei">, number> = {
  monofasica: 30,
  bifasica: 50,
  trifasica: 100,
};

/** Tarifa Social (Lei 15.235/2025): consumo isento por mês, em kWh. */
export const TARIFA_SOCIAL_ISENCAO_KWH = 80;
/** Desconto Social (Lei 15.235/2025): faixa com desconto por mês, em kWh. */
export const DESCONTO_SOCIAL_LIMITE_KWH = 120;

/** E = P × t — consumo diário de um aparelho, em kWh (já multiplicado pela quantidade). */
export function consumoDiarioKwh(a: Pick<Aparelho, "potenciaW" | "minutosPorDia" | "quantidade" | "diasPorSemana" | "kwhMesInformado" | "fatorCiclo">): number {
  return consumoMensalKwh(a) / DIAS_NO_MES;
}

/** Consumo mensal de um aparelho, em kWh (já multiplicado pela quantidade). */
export function consumoMensalKwh(a: Pick<Aparelho, "potenciaW" | "minutosPorDia" | "quantidade" | "diasPorSemana" | "kwhMesInformado" | "fatorCiclo">): number {
  const quantidade = Math.max(0, a.quantidade);
  if (a.kwhMesInformado !== undefined && a.kwhMesInformado > 0) {
    return a.kwhMesInformado * quantidade;
  }
  const horasPorDia = Math.max(0, a.minutosPorDia) / 60;
  const diasNoMes = (clamp(a.diasPorSemana, 0, 7) / 7) * DIAS_NO_MES;
  const ciclo = a.fatorCiclo === undefined ? 1 : clamp(a.fatorCiclo, 0, 1);
  return (Math.max(0, a.potenciaW) / 1000) * horasPorDia * diasNoMes * ciclo * quantidade;
}

export type OrigemPreco = "conta" | "aneel" | "indisponivel";

export interface PrecoKwh {
  /** Preço usado nos cálculos, em R$/kWh. */
  valor: number;
  origem: OrigemPreco;
  /** Parte da bandeira incluída no preço (zero quando o preço vem da conta). */
  adicionalBandeira: number;
  /** true quando o valor já inclui impostos (ICMS, PIS/COFINS). */
  incluiImpostos: boolean;
}

/**
 * Preço do kWh para a residência.
 * Se a pessoa informou uma conta de luz, usamos o preço real dela (valor ÷ kWh), que já inclui
 * impostos e taxas. Senão, usamos a tarifa da ANEEL (TE + TUSD) mais o adicional da bandeira do mês.
 */
export function precoKwh(
  residencia: Partial<Pick<Residencia, "contaReferencia" | "beneficio">>,
  distribuidora: Pick<Distribuidora, "tarifaKwh"> | undefined,
  bandeira: Pick<BandeiraMes, "adicionalKwh"> | undefined,
): PrecoKwh {
  const conta = residencia.contaReferencia;
  // Na Tarifa Social a conta já vem sem os primeiros 80 kWh: o preço real é o valor dividido só pelo que foi cobrado.
  // Se quase tudo foi isento, a conta não diz o preço do kWh, e usamos a tarifa da ANEEL.
  const kwhCobradosNaConta = conta ? (residencia.beneficio === "tarifa-social" ? conta.kwh - TARIFA_SOCIAL_ISENCAO_KWH : conta.kwh) : 0;
  if (conta && conta.valor > 0 && kwhCobradosNaConta >= 10) {
    return { valor: conta.valor / kwhCobradosNaConta, origem: "conta", adicionalBandeira: 0, incluiImpostos: true };
  }
  if (distribuidora) {
    const adicional = bandeira?.adicionalKwh ?? 0;
    return { valor: distribuidora.tarifaKwh + adicional, origem: "aneel", adicionalBandeira: adicional, incluiImpostos: false };
  }
  return { valor: 0, origem: "indisponivel", adicionalBandeira: 0, incluiImpostos: false };
}

export interface EstimativaConta {
  /** Soma do consumo dos aparelhos, em kWh/mês. */
  consumoKwh: number;
  /** kWh efetivamente cobrados (após mínimo e isenções). */
  kwhCobrados: number;
  preco: PrecoKwh;
  /** Valor estimado da conta, em R$/mês. */
  valor: number;
  /** Quanto da conta é da bandeira, em R$/mês. */
  valorBandeira: number;
  /** Quanto a Tarifa Social deixou de cobrar, em R$/mês. */
  economiaBeneficio: number;
  /** true quando o consumo ficou abaixo do mínimo e a conta foi pelo mínimo. */
  cobradoPeloMinimo: boolean;
  consumoMinimoKwh: number;
}

/**
 * Estima o valor mensal da conta para um consumo em kWh.
 *
 * Regras aplicadas:
 * - Consumo mínimo (custo de disponibilidade): 30, 50 ou 100 kWh conforme a ligação.
 *   Quando a ligação é desconhecida, assume monofásica (30 kWh), a mais comum em residências.
 * - Tarifa Social: os primeiros 80 kWh são isentos; o excedente é cobrado normalmente.
 * - Desconto Social: o percentual depende da distribuidora e não é publicado de forma simples,
 *   então não é descontado aqui — a interface avisa a pessoa para conferir na conta.
 */
export function estimarConta(consumoKwh: number, residencia: Pick<Residencia, "beneficio" | "ligacao" | "contaReferencia">, preco: PrecoKwh): EstimativaConta {
  const consumo = Math.max(0, consumoKwh);
  const ligacao = residencia.ligacao === "nao-sei" ? "monofasica" : residencia.ligacao;
  const minimo = CONSUMO_MINIMO_KWH[ligacao];

  let kwhCobrados: number;
  let economiaBeneficio = 0;
  let cobradoPeloMinimo = false;

  if (residencia.beneficio === "tarifa-social") {
    kwhCobrados = Math.max(0, consumo - TARIFA_SOCIAL_ISENCAO_KWH);
    economiaBeneficio = Math.min(consumo, TARIFA_SOCIAL_ISENCAO_KWH) * preco.valor;
  } else {
    cobradoPeloMinimo = consumo < minimo;
    kwhCobrados = Math.max(consumo, minimo);
  }

  return {
    consumoKwh: consumo,
    kwhCobrados,
    preco,
    valor: kwhCobrados * preco.valor,
    valorBandeira: kwhCobrados * preco.adicionalBandeira,
    economiaBeneficio,
    cobradoPeloMinimo,
    consumoMinimoKwh: minimo,
  };
}

export interface ConsumoAparelho {
  aparelho: Aparelho;
  kwhMes: number;
  kwhDia: number;
  /** Fração do consumo total (0 a 1). */
  participacao: number;
  /** Quanto do valor da conta corresponde a este aparelho, em R$/mês. */
  valorMes: number;
}

export interface ResumoCasa {
  conta: EstimativaConta;
  /** Aparelhos ordenados do que mais gasta para o que menos gasta. */
  aparelhos: ConsumoAparelho[];
  /** Consumo e valor por cômodo. */
  comodos: { comodoId: string; kwhMes: number; valorMes: number; participacao: number }[];
}

/**
 * Calcula cada aparelho isoladamente, soma tudo e divide o valor da conta entre os aparelhos
 * na proporção do consumo — assim a soma dos aparelhos fecha com o total da conta.
 */
export function resumirCasa(aparelhos: Aparelho[], residencia: Pick<Residencia, "beneficio" | "ligacao" | "contaReferencia">, preco: PrecoKwh): ResumoCasa {
  const itens = aparelhos.map((aparelho) => ({ aparelho, kwhMes: consumoMensalKwh(aparelho) }));
  const total = itens.reduce((s, i) => s + i.kwhMes, 0);
  const conta = estimarConta(total, residencia, preco);
  // Valor dos aparelhos = consumo × preço, menos a parte isenta pelo benefício, rateada.
  const valorDosAparelhos = residencia.beneficio === "tarifa-social" ? conta.valor : total * preco.valor;

  const lista: ConsumoAparelho[] = itens
    .map((i) => {
      const participacao = total > 0 ? i.kwhMes / total : 0;
      return { aparelho: i.aparelho, kwhMes: i.kwhMes, kwhDia: i.kwhMes / DIAS_NO_MES, participacao, valorMes: valorDosAparelhos * participacao };
    })
    .sort((a, b) => b.kwhMes - a.kwhMes);

  const porComodo = new Map<string, { kwhMes: number; valorMes: number }>();
  for (const item of lista) {
    const atual = porComodo.get(item.aparelho.comodoId) ?? { kwhMes: 0, valorMes: 0 };
    atual.kwhMes += item.kwhMes;
    atual.valorMes += item.valorMes;
    porComodo.set(item.aparelho.comodoId, atual);
  }
  const comodos = [...porComodo.entries()]
    .map(([comodoId, v]) => ({ comodoId, ...v, participacao: total > 0 ? v.kwhMes / total : 0 }))
    .sort((a, b) => b.kwhMes - a.kwhMes);

  return { conta, aparelhos: lista, comodos };
}

/** Valor mensal de um aparelho isolado, pelo preço do kWh (sem rateio de mínimo ou benefício). */
export function valorMensalAparelho(a: Pick<Aparelho, "potenciaW" | "minutosPorDia" | "quantidade" | "diasPorSemana" | "kwhMesInformado" | "fatorCiclo">, preco: PrecoKwh): number {
  return consumoMensalKwh(a) * preco.valor;
}

/** Bandeira vigente num mês (AAAA-MM). Se o mês ainda não foi publicado, usa o mais recente. */
export function bandeiraDoMes(bandeiras: BandeiraMes[], competencia: string): { bandeira: BandeiraMes; exata: boolean } | undefined {
  if (bandeiras.length === 0) return undefined;
  const exata = bandeiras.find((b) => b.competencia === competencia);
  if (exata) return { bandeira: exata, exata: true };
  const anteriores = bandeiras.filter((b) => b.competencia <= competencia).sort((a, b) => b.competencia.localeCompare(a.competencia));
  const maisRecente = anteriores[0] ?? [...bandeiras].sort((a, b) => b.competencia.localeCompare(a.competencia))[0];
  return maisRecente ? { bandeira: maisRecente, exata: false } : undefined;
}

/** Mês atual no formato AAAA-MM, no fuso de Brasília. */
export function competenciaAtual(agora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(agora);
  const ano = partes.find((p) => p.type === "year")?.value;
  const mes = partes.find((p) => p.type === "month")?.value;
  return `${ano}-${mes}`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

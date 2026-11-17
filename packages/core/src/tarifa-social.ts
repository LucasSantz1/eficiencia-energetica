import { TARIFA_SOCIAL_ISENCAO_KWH } from "./calculos";
import { LIMITES, validarFaixa, type Faixa } from "./limites";

/**
 * Entrada própria do pacote (`@ee/core/tarifa-social`), fora do `index.ts`: só a rota /tarifa-social usa esta regra, e
 * o que sai do `index.ts` vai num pedaço comum que toda rota baixa (ADR-001 revisto, HIS-103b).
 *
 * Guia "pode ter direito?" da Tarifa Social e do Desconto Social (HIS-103). Regras e fontes do dominio-energia,
 * consultadas em 13/11/2026 ("Regras de negócio e fontes" da HIS-103). O guia nunca diz "tem direito": quem confirma
 * é o CRAS ou a distribuidora. Toda conta de dinheiro é em centavos, sem arredondar a renda por pessoa (critério 2).
 */

/**
 * Salário mínimo nacional e o período em que ele vale (datas AAAA-MM-DD, inclusivas). R$ 1.621,00 desde 01/01/2026:
 * Decreto 12.797/2025 (F8). Muda todo ano: fora do período, a tela não mostra R$ (critério 4) e o número precisa ser
 * atualizado aqui, com a fonte nova.
 */
export const SALARIO_MINIMO = { centavos: 162_100, inicio: "2026-01-01", fim: "2026-12-31" } as const;

/**
 * Até quando as distribuidoras chamam as famílias para acertar o cadastro; quem não atende pode perder o desconto.
 * REN ANEEL 1.147/2025, pela notícia da ANEEL de 09/12/2025 (F3; R11).
 */
export const PRAZO_DA_CONVOCACAO = "2026-12-31";

/**
 * Renda da família por mês, em R$, que a pessoa digita. Limite técnico da ux (não é regra do setor): de 0 a 100.000;
 * acima de 30.000 a tela pergunta "Confere?" (HIS-103, "Fluxo e textos", pergunta 4).
 */
export const FAIXA_DA_RENDA_FAMILIAR = { min: 0, max: 100_000, casas: 2, alerta: 30_000 } as const satisfies Faixa;

/**
 * Tarifa de exemplo do texto do resultado A ("Numa conta de R$ 0,80 por kWh..."), em R$/kWh. É só um exemplo redondo
 * do dominio-energia (HIS-103, caso da conta de 150 kWh): fica perto das tarifas B1 com impostos.
 */
export const TARIFA_DE_EXEMPLO_KWH = 0.8;

/** Quanto vale, no exemplo, a energia de graça da Tarifa Social: 80 kWh × R$ 0,80 = R$ 64,00 (estimativa). */
export function valorDaEnergiaDeGracaNoExemplo(): number {
  return TARIFA_SOCIAL_ISENCAO_KWH * TARIFA_DE_EXEMPLO_KWH;
}

export type RespostaSimNao = "sim" | "nao";
export type RespostaComNaoSei = "sim" | "nao" | "nao-sei";

/** O que a pessoa respondeu. Com BPC = sim, a tela pula a renda, as pessoas e a saúde (a renda não importa). */
export interface RespostasDaTarifaSocial {
  bpc: RespostaComNaoSei;
  cadUnico?: RespostaComNaoSei;
  pessoas?: number;
  /** Soma do que todos ganham por mês, em centavos. Sem Bolsa Família; com BPC (Decreto 11.016/2022, art. 5º, VI, "b"; R7). */
  rendaCentavos?: number;
  saude?: RespostaSimNao;
  contaNoNome: RespostaComNaoSei;
}

/**
 * A: pode ter Tarifa Social (BPC ou renda por pessoa de até ½ salário mínimo; R1 a, b).
 * B: pode ter Desconto Social (renda por pessoa acima de ½ e até 1 salário mínimo; R4).
 * C: pode ter Tarifa Social pelo aparelho de saúde (renda total de até 3 salários mínimos; R1 c).
 * D: pelas respostas, não se encaixa.
 * conferir: fora da vigência do salário mínimo, o que daria B ou D. O salário mínimo novo é maior, então B ou D com o
 * valor antigo podem negar quem tem direito; o CRAS confirma (dominio-energia, revisão de 17/11/2026).
 */
export type CasoDaTarifaSocial = "A" | "B" | "C" | "D" | "conferir";

/** Renda comparada com o limite, para a tela explicar em R$ (só quando o salário mínimo está em vigor). */
export interface ComparacaoDaRenda {
  /** "por-pessoa": renda ÷ pessoas; "total": a renda da família. */
  base: "por-pessoa" | "total";
  rendaCentavos: number;
  limiteCentavos: number;
  /** Quantos salários mínimos é o limite: ½, 1 ou 3. */
  salariosMinimos: 0.5 | 1 | 3;
}

export type ResultadoDaTarifaSocial =
  | { tipo: "invalido" }
  | {
      tipo: "resultado";
      caso: CasoDaTarifaSocial;
      /** `undefined` quando o caso veio do BPC (a renda não foi perguntada). */
      comparacao: ComparacaoDaRenda | undefined;
      /**
       * Aviso do CadÚnico (R5, R9), quando a família pode ter o desconto: "fazer" se ele não está feito ou a pessoa não
       * sabe; "conferir-em-dia" no caminho do BPC, em que a pergunta do CadÚnico é pulada (dominio-energia, 17/11/2026).
       */
      avisoDoCadUnico: "fazer" | "conferir-em-dia" | undefined;
      /** Quando pode ter: a conta não está no nome de alguém da família, ou a pessoa não sabe (R5). */
      trocarNomeDaConta: boolean;
    };

/** O salário mínimo de `SALARIO_MINIMO` vale na data (AAAA-MM-DD)? Fora do período, a tela esconde os R$. */
export function salarioMinimoEmVigor(hoje: string): boolean {
  return hoje >= SALARIO_MINIMO.inicio && hoje <= SALARIO_MINIMO.fim;
}

/** As distribuidoras ainda estão chamando as famílias (R11)? Depois do prazo, o aviso sai da tela. */
export function convocacaoAberta(hoje: string): boolean {
  return hoje <= PRAZO_DA_CONVOCACAO;
}

/** Pessoas e renda que a tela pode usar (C13: zero pessoas ou renda negativa não calculam). */
function rendaValida(pessoas: number | undefined, rendaCentavos: number | undefined): pessoas is number {
  if (pessoas === undefined || rendaCentavos === undefined) return false;
  if (validarFaixa(LIMITES.pessoas, pessoas) === "fora") return false;
  return Number.isInteger(rendaCentavos) && validarFaixa(FAIXA_DA_RENDA_FAMILIAR, rendaCentavos / 100) !== "fora";
}

/**
 * Diz o caso A–D, na data `hoje` (AAAA-MM-DD). A ordem é A, C, B, D: quem cabe na Tarifa Social pelo aparelho de saúde
 * (C) também pode caber no Desconto Social (B), e a Tarifa Social é o desconto maior (80 kWh de graça contra desconto
 * até 120 kWh). Fora da vigência, o último salário mínimo conhecido ainda vale para A e C (o limite novo só é maior),
 * mas B e D viram "conferir": com o valor antigo, negariam quem tem direito.
 */
export function avaliarTarifaSocial(respostas: RespostasDaTarifaSocial, hoje: string): ResultadoDaTarifaSocial {
  const comAvisos = (caso: CasoDaTarifaSocial, comparacao: ComparacaoDaRenda | undefined): ResultadoDaTarifaSocial => {
    const podeTer = caso !== "D";
    const avisoDoCadUnico = !podeTer || respostas.cadUnico === "sim" ? undefined : respostas.bpc === "sim" ? "conferir-em-dia" : "fazer";
    return { tipo: "resultado", caso, comparacao, avisoDoCadUnico, trocarNomeDaConta: podeTer && respostas.contaNoNome !== "sim" };
  };

  // R1 b: o BPC basta, a renda não importa (Lei 12.212/2010, art. 2º, II).
  if (respostas.bpc === "sim") return comAvisos("A", undefined);

  const { pessoas, rendaCentavos } = respostas;
  if (!rendaValida(pessoas, rendaCentavos) || rendaCentavos === undefined || respostas.saude === undefined) return { tipo: "invalido" };

  const sm = SALARIO_MINIMO.centavos;
  const porPessoa = (salariosMinimos: 0.5 | 1, limiteCentavos: number): ComparacaoDaRenda => ({ base: "por-pessoa", rendaCentavos: rendaCentavos / pessoas, limiteCentavos, salariosMinimos });

  // R1 a: renda por pessoa ≤ ½ SM ⇔ renda × 2 ≤ pessoas × SM (inteiros, sem arredondar; Lei 12.212/2010, art. 2º, I).
  if (rendaCentavos * 2 <= pessoas * sm) return comAvisos("A", porPessoa(0.5, sm / 2));
  // R1 c: renda total ≤ 3 SM com aparelho de saúde (Lei 12.212/2010, art. 2º, § 1º).
  if (respostas.saude === "sim" && rendaCentavos <= 3 * sm) return comAvisos("C", { base: "total", rendaCentavos, limiteCentavos: 3 * sm, salariosMinimos: 3 });
  // Fora da vigência, B e D dependem de um salário mínimo que já mudou (para mais): só o CRAS confirma.
  if (!salarioMinimoEmVigor(hoje)) return comAvisos("conferir", undefined);
  // R4: renda por pessoa acima de ½ e até 1 SM (Lei 10.438/2002, art. 13, § 3º-I, pela Lei 15.235/2025).
  if (rendaCentavos <= pessoas * sm) return comAvisos("B", porPessoa(1, sm));
  return comAvisos("D", porPessoa(1, sm));
}

/**
 * Meta de gasto (HIS-104): "quero pagar até R$ X". Diz quanto falta e quais dicas chegam lá, sem prometer o que a
 * estimativa não garante. Regras do dominio-energia (R1–R7) e desenho do tech-lead (M2) na história.
 *
 * Mora numa entrada própria (`@ee/core/meta`): só a /casa usa, e assim as outras páginas não baixam este código.
 * Tudo em centavos inteiros, para "dentro da meta" nunca depender de arredondamento.
 */
import { consumoMensalDaCasaKwh, estimarConta, type PrecoKwh } from "./calculos";
import { simularPlano, type Dica } from "./dicas";
import type { Aparelho, Residencia } from "./tipos";

/** Diferença máxima entre a soma dos aparelhos e a conta de luz para a estimativa contar como completa. Suposição de produto, não é regra do setor. */
export const DIVERGENCIA_MAXIMA = 0.2;
/** Quantas dicas cabem na lista da meta. Suposição de UX (limite de tela), não é regra do setor. */
export const DICAS_NA_META = 3;

export type Confianca = { tipo: "completa" } | { tipo: "parcial"; motivo: "sem-conta" } | { tipo: "parcial"; motivo: "divergencia"; contaInformadaCentavos: number };

/** Uma dica escolhida e o quanto ela economiza **depois** das anteriores (ganho marginal). */
export interface PassoDaMeta {
  dicaId: string;
  ganhoCentavos: number;
}

export type SituacaoDaMeta =
  | { tipo: "sem-dados" }
  | { tipo: "abaixo-do-piso"; pisoCentavos: number; confianca: Confianca }
  | { tipo: "dentro"; contaCentavos: number; folgaCentavos: number; confianca: Confianca }
  | {
      tipo: "falta";
      contaCentavos: number;
      faltaCentavos: number;
      pisoCentavos: number;
      passos: PassoDaMeta[];
      totalCentavos: number;
      contaDepoisCentavos: number;
      /** Só é verdade com a estimativa completa (R3): sem conta de luz, a tela diz "ajudam", nunca "chegam lá". */
      chegaLa: boolean;
      confianca: Confianca;
    };

export interface EntradaDaMeta {
  metaReais: number;
  aparelhos: Aparelho[];
  residencia: Pick<Residencia, "beneficio" | "ligacao" | "contaReferencia">;
  preco: PrecoKwh;
  /** As dicas da casa (de `gerarDicas`), com o mesmo contexto da tela. */
  dicas: readonly Dica[];
}

export function centavos(reais: number): number {
  return Math.round(reais * 100);
}

export function avaliarMeta(entrada: EntradaDaMeta): SituacaoDaMeta {
  const { aparelhos, residencia, preco, dicas } = entrada;
  if (preco.origem === "indisponivel" || aparelhos.length === 0) return { tipo: "sem-dados" };

  const contaDoPlano = (ids: string[]) => estimarConta(consumoMensalDaCasaKwh(simularPlano(aparelhos, ids)), residencia, preco);
  const contaAgora = contaDoPlano([]).valor;
  const contaCentavos = centavos(contaAgora);
  const pisoCentavos = centavos(estimarConta(0, residencia, preco).valor);
  const metaCentavos = centavos(entrada.metaReais);
  const confianca = confiancaDa(contaCentavos, residencia, preco);

  if (metaCentavos < pisoCentavos) return { tipo: "abaixo-do-piso", pisoCentavos, confianca };
  if (contaCentavos <= metaCentavos) return { tipo: "dentro", contaCentavos, folgaCentavos: metaCentavos - contaCentavos, confianca };

  const plano = escolherDicas(dicas, contaAgora, metaCentavos, contaDoPlano);
  const contaDepoisCentavos = centavos(plano.contaDepois);
  return {
    tipo: "falta",
    contaCentavos,
    faltaCentavos: contaCentavos - metaCentavos,
    pisoCentavos,
    passos: plano.passos,
    totalCentavos: contaCentavos - contaDepoisCentavos,
    contaDepoisCentavos,
    chegaLa: confianca.tipo === "completa" && contaDepoisCentavos <= metaCentavos,
    confianca,
  };
}

/** Completa só com conta de luz e aparelhos que explicam essa conta (R3). */
function confiancaDa(contaCentavos: number, residencia: EntradaDaMeta["residencia"], preco: PrecoKwh): Confianca {
  const conta = residencia.contaReferencia;
  if (!conta || preco.origem !== "conta") return { tipo: "parcial", motivo: "sem-conta" };
  const contaInformadaCentavos = centavos(conta.valor);
  const divergencia = Math.abs(contaCentavos - contaInformadaCentavos) / contaInformadaCentavos;
  return divergencia < DIVERGENCIA_MAXIMA ? { tipo: "completa" } : { tipo: "parcial", motivo: "divergencia", contaInformadaCentavos };
}

interface PlanoDaMeta {
  passos: PassoDaMeta[];
  contaDepois: number;
}

/**
 * Escolha gulosa (R4.4): a cada passo, a dica que mais baixa a conta **em cima do plano já escolhido** (nunca a soma de
 * `economiaMes`, que conta duas vezes o mesmo aparelho). Hábitos primeiro, porque não custam nada; a troca (comprar algo)
 * só entra se os hábitos não chegarem lá. Empate: mais kWh economizado, depois id em ordem alfabética.
 */
function escolherDicas(dicas: readonly Dica[], contaAgora: number, metaCentavos: number, contaDoPlano: (ids: string[]) => { valor: number; consumoKwh: number }): PlanoDaMeta {
  const candidatas = dicas.filter((d) => d.simulavel && (d.tipo === "habito" || d.tipo === "troca") && centavos(d.economiaMes ?? 0) > 0);
  const habitos = candidatas.filter((d) => d.tipo === "habito");
  const soHabitos = guloso(habitos, contaAgora, metaCentavos, contaDoPlano);
  if (centavos(soHabitos.contaDepois) <= metaCentavos || habitos.length === candidatas.length) return soHabitos;
  const comTrocas = guloso(candidatas, contaAgora, metaCentavos, contaDoPlano);
  const chegaComTrocas = centavos(comTrocas.contaDepois) <= metaCentavos;
  return chegaComTrocas || comTrocas.contaDepois < soHabitos.contaDepois ? comTrocas : soHabitos;
}

function guloso(candidatas: readonly Dica[], contaAgora: number, metaCentavos: number, contaDoPlano: (ids: string[]) => { valor: number; consumoKwh: number }): PlanoDaMeta {
  const ids: string[] = [];
  const passos: PassoDaMeta[] = [];
  let atual = contaDoPlano([]);
  let contaDepois = contaAgora;
  while (ids.length < DICAS_NA_META && centavos(contaDepois) > metaCentavos) {
    let melhor: { id: string; valor: number; consumoKwh: number } | undefined;
    for (const dica of candidatas) {
      if (ids.includes(dica.id)) continue;
      const nova = contaDoPlano([...ids, dica.id]);
      if (!melhor || ehMelhor(nova, dica.id, melhor)) melhor = { id: dica.id, valor: nova.valor, consumoKwh: nova.consumoKwh };
    }
    // Ganho zero (a dica deixou de valer, ou o mínimo da ligação segura a conta) não entra na lista.
    if (!melhor || centavos(atual.valor - melhor.valor) <= 0) break;
    // Diferença dos valores já arredondados: assim os ganhos somam, centavo a centavo, o total que a tela mostra (qa,
    // 25/11: 12,75 + 7,65 aparecia como "juntas, R$ 20,41").
    passos.push({ dicaId: melhor.id, ganhoCentavos: centavos(contaDepois) - centavos(melhor.valor) });
    ids.push(melhor.id);
    atual = melhor;
    contaDepois = melhor.valor;
  }
  return { passos, contaDepois };
}

/** Compara em centavos e em Wh: 8,8 kWh de duas contas diferentes não podem desempatar por um erro de ponto flutuante. */
function ehMelhor(nova: { valor: number; consumoKwh: number }, id: string, atual: { id: string; valor: number; consumoKwh: number }): boolean {
  if (centavos(nova.valor) !== centavos(atual.valor)) return nova.valor < atual.valor;
  const wh = (kwh: number) => Math.round(kwh * 1000);
  if (wh(nova.consumoKwh) !== wh(atual.consumoKwh)) return nova.consumoKwh < atual.consumoKwh;
  return id < atual.id;
}

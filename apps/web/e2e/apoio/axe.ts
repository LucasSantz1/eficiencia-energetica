/*
 * Acessibilidade com o axe (critério 3). O axe roda sempre com o conjunto padrão de regras, sem filtro
 * (`new AxeBuilder({ page }).analyze()`, sem desligar regra nem excluir parte da página — Aa14): quem decide o que
 * reprova são as funções puras daqui, depois da análise.
 */
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

export type ResultadoAxe = Awaited<ReturnType<AxeBuilder["analyze"]>>;
export type ViolacaoAxe = ResultadoAxe["violations"][number];

/** Gravidades que reprovam (critério 3); `moderate` e `minor` vão como anexo informativo. */
const IMPACTOS_QUE_REPROVAM: readonly string[] = ["serious", "critical"];

export async function analisarAcessibilidade(pagina: Page): Promise<ResultadoAxe> {
  return new AxeBuilder({ page: pagina }).analyze();
}

export function violacoesQueReprovam(violacoes: readonly ViolacaoAxe[]): ViolacaoAxe[] {
  return violacoes.filter((v) => IMPACTOS_QUE_REPROVAM.includes(v.impact ?? ""));
}

/** Uma linha por violação, com os elementos: é o que aparece na mensagem de falha. */
export function descreverViolacoes(violacoes: readonly ViolacaoAxe[]): string[] {
  return violacoes.map((v) => `${v.id} (${v.impact ?? "sem impacto"}): ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
}

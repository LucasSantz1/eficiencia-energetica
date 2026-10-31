/*
 * Acessibilidade com o axe (critério 3). O axe roda sempre com o conjunto padrão de regras, sem filtro
 * (`new AxeBuilder({ page }).analyze()`, sem desligar regra nem excluir parte da página — Aa14): quem decide o que
 * reprova são as funções puras daqui, depois da análise.
 */
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import type { ExcecaoAxe } from "../excecoes-axe";

export type ResultadoAxe = Awaited<ReturnType<AxeBuilder["analyze"]>>;
export type ViolacaoAxe = ResultadoAxe["violations"][number];
type NoDaViolacao = ViolacaoAxe["nodes"][number];

/** As 24 telas que o axe confere (D10 + P-qa-4): o nome do teste é "axe · <página> · <estado>". */
export const TELAS_AXE = [
  { pagina: "/", estado: "sem casa" },
  { pagina: "/comecar", estado: "sem casa" },
  { pagina: "/casa", estado: "sem casa" },
  { pagina: "/casa/comodos", estado: "sem casa" },
  { pagina: "/casa/dicas", estado: "sem casa" },
  { pagina: "/casa/ajustes", estado: "sem casa" },
  { pagina: "/sobre", estado: "sem casa" },
  { pagina: "/", estado: "com casa" },
  { pagina: "/comecar", estado: "com casa" },
  { pagina: "/casa", estado: "com casa" },
  { pagina: "/casa/comodos", estado: "com casa" },
  { pagina: "/casa/dicas", estado: "com casa" },
  { pagina: "/casa/ajustes", estado: "com casa" },
  { pagina: "/comecar", estado: "passo cidade" },
  { pagina: "/comecar", estado: "passo benefício" },
  { pagina: "/comecar", estado: "passo pessoas" },
  { pagina: "/comecar", estado: "passo cômodos" },
  { pagina: "/comecar", estado: "passo um cômodo" },
  { pagina: "/comecar", estado: "passo revisão" },
  { pagina: "/comecar", estado: "passo conta" },
  { pagina: "/casa/comodos?visao=geral", estado: "com casa" },
  { pagina: "/casa", estado: "folha editor de aparelho" },
  { pagina: "/casa", estado: "folha anotar conta" },
  { pagina: "/casa", estado: "folha anotar leitura" },
] as const;

export type TelaAxe = (typeof TELAS_AXE)[number];
export type EstadoAxe = TelaAxe["estado"];
export const chaveDaTela = (tela: { pagina: string; estado: string }): string => `${tela.pagina} · ${tela.estado}`;

/** Gravidades que reprovam (critério 3); `moderate` e `minor` vão como anexo informativo. */
const IMPACTOS_QUE_REPROVAM: readonly string[] = ["serious", "critical"];

export async function analisarAcessibilidade(pagina: Page): Promise<ResultadoAxe> {
  return new AxeBuilder({ page: pagina }).analyze();
}

export function violacoesQueReprovam(violacoes: readonly ViolacaoAxe[]): ViolacaoAxe[] {
  return violacoes.filter((v) => IMPACTOS_QUE_REPROVAM.includes(v.impact ?? ""));
}

/** Seletor que o axe deu ao nó (documento principal: um seletor só; sem iframe nem shadow DOM no site). */
export function seletorDoNo(no: NoDaViolacao): string {
  return no.target.map(String).join(" ");
}

/** Uma linha por violação, com os elementos: é o que aparece na mensagem de falha. */
export function descreverViolacoes(violacoes: readonly ViolacaoAxe[]): string[] {
  return violacoes.map((v) => `${v.id} (${v.impact ?? "sem impacto"}): ${v.nodes.map(seletorDoNo).join(" | ")}`);
}

/** O que o navegador disse sobre o `alvo` de uma exceção (feito por `resolverExcecoes`). */
export interface ExcecaoResolvida {
  excecao: ExcecaoAxe;
  /** Quantos elementos `document.querySelectorAll(alvo)` achou. */
  elementos: number;
  /** Seletores (do axe) dos nós da violação da mesma regra que SÃO o elemento do alvo (comparação por identidade). */
  nosCobertos: string[];
}

export interface ResultadoDasExcecoes {
  /** Violações que continuam reprovando, sem os nós cobertos por exceção. */
  violacoes: ViolacaoAxe[];
  /** Exceções com defeito: reprovam o teste. */
  problemas: string[];
  aplicadas: ExcecaoAxe[];
}

/**
 * Função pura (D16, P-qa-6/P-qa-7): tira de cada violação o nó coberto por uma exceção válida. Exceção com alvo de
 * 2+ elementos ou que não cobre nenhum nó vira problema — nunca some em silêncio.
 */
export function aplicarExcecoes(violacoes: readonly ViolacaoAxe[], resolvidas: readonly ExcecaoResolvida[]): ResultadoDasExcecoes {
  const problemas: string[] = [];
  const aplicadas: ExcecaoAxe[] = [];
  const cobertosPorRegra = new Map<string, Set<string>>();
  for (const { excecao, elementos, nosCobertos } of resolvidas) {
    const descricao = `${excecao.regra} em "${excecao.alvo}" (${excecao.historia})`;
    if (elementos > 1) {
      problemas.push(`exceção cobre mais de um elemento (${elementos}): ${descricao}`);
      continue;
    }
    const no = nosCobertos[0];
    if (elementos === 0 || no === undefined) {
      problemas.push(`exceção velha, tire da lista: ${descricao} não casa com nenhuma violação`);
      continue;
    }
    const cobertos = cobertosPorRegra.get(excecao.regra) ?? new Set<string>();
    cobertos.add(no);
    cobertosPorRegra.set(excecao.regra, cobertos);
    aplicadas.push(excecao);
  }
  const restantes = violacoes
    .map((v) => ({ ...v, nodes: v.nodes.filter((n) => !cobertosPorRegra.get(v.id)?.has(seletorDoNo(n))) }))
    .filter((v) => v.nodes.length > 0);
  return { violacoes: restantes, problemas, aplicadas };
}

/** Pergunta ao navegador quantos elementos cada `alvo` acha e se o elemento é um dos nós da violação. */
export async function resolverExcecoes(
  pagina: Page,
  violacoes: readonly ViolacaoAxe[],
  excecoes: readonly ExcecaoAxe[],
): Promise<ExcecaoResolvida[]> {
  const resolvidas: ExcecaoResolvida[] = [];
  for (const excecao of excecoes) {
    const seletores = violacoes.filter((v) => v.id === excecao.regra).flatMap((v) => v.nodes.map(seletorDoNo));
    const { elementos, nosCobertos } = await pagina.evaluate(
      ({ alvo, seletores }) => {
        const achados = document.querySelectorAll(alvo);
        const unico = achados.length === 1 ? achados[0] : undefined;
        return {
          elementos: achados.length,
          nosCobertos: unico ? seletores.filter((s) => document.querySelector(s) === unico) : [],
        };
      },
      { alvo: excecao.alvo, seletores },
    );
    resolvidas.push({ excecao, elementos, nosCobertos });
  }
  return resolvidas;
}

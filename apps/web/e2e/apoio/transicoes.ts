/*
 * Conta as transições de tela (View Transitions) que o React dispara: troca `document.startViewTransition` por um
 * invólucro antes de qualquer script do site. O número fica no sessionStorage para sobreviver a recarregar a aba.
 * Plano do qa, P-qa-1: os testes leem o contador antes e depois de cada ação e afirmam a diferença.
 *
 * O invólucro também anota, no `transition.ready` (quando as animações da troca acabaram de ser criadas), a
 * duração de cada animação dos pseudo-elementos `::view-transition-*` — sem espera fixa. Com movimento reduzido,
 * o globals.css zera essas durações; sem ele, elas duram 250 ms (medido na revisão do D9).
 */
import type { BrowserContext, Page } from "@playwright/test";

const CHAVE_CONTADOR = "e2e:transicoes";

declare global {
  interface Window {
    /** Durações (ms) das animações de cada transição desta página, na ordem em que aconteceram. */
    e2eDuracoesDasTransicoes?: number[][];
  }
}

export async function contarTransicoes(contexto: BrowserContext): Promise<void> {
  await contexto.addInitScript((chave) => {
    const original = Document.prototype.startViewTransition;
    if (!original) return;
    window.e2eDuracoesDasTransicoes = [];
    Document.prototype.startViewTransition = function (...argumentos: Parameters<Document["startViewTransition"]>) {
      sessionStorage.setItem(chave, String(Number(sessionStorage.getItem(chave) ?? 0) + 1));
      const transicao = original.apply(this, argumentos);
      transicao.ready
        .then(() => {
          const duracoes = document
            .getAnimations()
            .map((animacao) => animacao.effect)
            .filter((efeito): efeito is KeyframeEffect => efeito instanceof KeyframeEffect)
            .filter((efeito) => (efeito.pseudoElement ?? "").startsWith("::view-transition"))
            .map((efeito) => Number(efeito.getComputedTiming().duration));
          window.e2eDuracoesDasTransicoes?.push(duracoes);
        })
        // Transição pulada (ex.: outra começou antes) rejeita o `ready`: não é erro do site.
        .catch(() => undefined);
      return transicao;
    };
  }, CHAVE_CONTADOR);
}

export async function transicoesAteAgora(pagina: Page): Promise<number> {
  return pagina.evaluate((chave) => Number(sessionStorage.getItem(chave) ?? 0), CHAVE_CONTADOR);
}

/** Durações anotadas nesta página (some ao recarregar; a troca de aba não recarrega). */
export async function duracoesDasTransicoes(pagina: Page): Promise<number[][]> {
  return pagina.evaluate(() => window.e2eDuracoesDasTransicoes ?? []);
}

/*
 * Conta as transições de tela (View Transitions) que o React dispara: troca `document.startViewTransition` por um
 * invólucro antes de qualquer script do site. O número fica no sessionStorage para sobreviver a recarregar a aba.
 * Plano do qa, P-qa-1: os testes leem o contador antes e depois de cada ação e afirmam a diferença.
 */
import type { BrowserContext, Page } from "@playwright/test";

const CHAVE_CONTADOR = "e2e:transicoes";

export async function contarTransicoes(contexto: BrowserContext): Promise<void> {
  await contexto.addInitScript((chave) => {
    const original = Document.prototype.startViewTransition;
    if (!original) return;
    Document.prototype.startViewTransition = function (...argumentos: Parameters<Document["startViewTransition"]>) {
      sessionStorage.setItem(chave, String(Number(sessionStorage.getItem(chave) ?? 0) + 1));
      return original.apply(this, argumentos);
    };
  }, CHAVE_CONTADOR);
}

export async function transicoesAteAgora(pagina: Page): Promise<number> {
  return pagina.evaluate((chave) => Number(sessionStorage.getItem(chave) ?? 0), CHAVE_CONTADOR);
}

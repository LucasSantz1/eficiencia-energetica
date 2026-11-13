/*
 * Quebra de propósito uma tela do site, sem mexer no código dele (HIS-003a, T3): o
 * `Intl.NumberFormat.prototype.format` (um getter) lança enquanto a chave `e2e:quebrar-formato` do sessionStorage for
 * "1". Toda tela que mostra R$ ou kWh quebra no render, como um bug de verdade. Usado pelo erros.spec.ts e pelo axe.
 */
import type { BrowserContext, Page } from "@playwright/test";

const CHAVE_QUEBRA = "e2e:quebrar-formato";
export const MENSAGEM_DO_ERRO = "e2e-formato-quebrado-de-proposito";

/** Liga a quebra antes de qualquer script do site, uma vez por aba; depois o teste liga e desliga com `quebrar`. */
export async function quebrarFormatoDeNumero(contexto: BrowserContext): Promise<void> {
  await contexto.addInitScript(
    ({ chave, mensagem }) => {
      if (!location.protocol.startsWith("http")) return; // about:blank não tem sessionStorage
      if (sessionStorage.getItem(chave) === null) sessionStorage.setItem(chave, "1");
      const descritor = Object.getOwnPropertyDescriptor(Intl.NumberFormat.prototype, "format");
      const ler = descritor?.get;
      if (!descritor || !ler) throw new Error("Intl.NumberFormat.prototype.format sem getter");
      Object.defineProperty(Intl.NumberFormat.prototype, "format", {
        ...descritor,
        get(this: Intl.NumberFormat) {
          if (sessionStorage.getItem(chave) === "1") throw new Error(mensagem);
          return ler.call(this);
        },
      });
    },
    { chave: CHAVE_QUEBRA, mensagem: MENSAGEM_DO_ERRO },
  );
}

/** Liga ou desliga a quebra na aba (vale também para as próximas páginas dela). */
export const quebrar = (pagina: Page, ligado: boolean) => pagina.evaluate(([c, v]) => sessionStorage.setItem(c, v), [CHAVE_QUEBRA, ligado ? "1" : "0"] as const);

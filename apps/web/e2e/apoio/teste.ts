/*
 * `test` e `expect` de todos os testes do site. A fixture automática vigia o contexto inteiro (toda página, janela
 * nova e worker) e reprova o teste no fim se houve:
 *   - erro de página (`pageerror`) ou `console.error` — tela branca ou componente quebrado não passa (Aa16);
 *   - pedido para fora do site — nada sai do aparelho sem a pessoa saber (princípio 5, LGPD; Aa11 e P-qa-8).
 * `console.warn` não reprova: vai como anexo do teste, para alguém olhar.
 * Só registra (`context.on("request")`), sem `route`: não muda a rede, então não mexe no peso medido (11b).
 */
import { test as base, expect, type Page } from "@playwright/test";

/** Pedido que pode sair da página: a própria origem do site e dados embutidos (`data:`/`blob:`). */
export function pedidoPermitido(url: string, origemDoSite: string): boolean {
  if (url.startsWith("data:") || url.startsWith("blob:")) return true;
  try {
    return new URL(url).origin === origemDoSite;
  } catch {
    return false;
  }
}

interface Vigilancia {
  /** Fixture automática: não é usada pelo nome nos testes. */
  vigiarConsoleErrosERede: void;
}

export const test = base.extend<Vigilancia>({
  vigiarConsoleErrosERede: [
    async ({ context, baseURL }, usar, info) => {
      if (!baseURL) throw new Error("baseURL não configurada no playwright.config.ts");
      const origemDoSite = new URL(baseURL).origin;
      const problemas: string[] = [];
      const avisos: string[] = [];

      const vigiarPagina = (pagina: Page) => {
        pagina.on("pageerror", (erro) => problemas.push(`erro de página em ${pagina.url()}: ${erro.message}`));
        pagina.on("console", (mensagem) => {
          if (mensagem.type() === "error") problemas.push(`console.error em ${pagina.url()}: ${mensagem.text()}`);
          else if (mensagem.type() === "warning") avisos.push(`console.warn em ${pagina.url()}: ${mensagem.text()}`);
        });
      };
      context.pages().forEach(vigiarPagina);
      context.on("page", vigiarPagina);
      context.on("request", (pedido) => {
        if (!pedidoPermitido(pedido.url(), origemDoSite)) problemas.push(`pedido para fora do site: ${pedido.url()}`);
      });

      await usar();

      if (avisos.length) await info.attach("console.warn", { body: avisos.join("\n"), contentType: "text/plain" });
      expect(problemas, "erros de console, de página ou pedidos para fora do site").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

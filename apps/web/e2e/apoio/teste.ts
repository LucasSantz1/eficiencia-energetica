/*
 * `test` e `expect` de todos os testes do site. A fixture automática vigia o contexto inteiro (toda página, janela
 * nova e worker) e reprova o teste no fim se houve:
 *   - erro de página (`pageerror`) ou `console.error` — tela branca ou componente quebrado não passa (Aa16);
 *   - pedido para fora do site — nada sai do aparelho sem a pessoa saber (princípio 5, LGPD; Aa11 e P-qa-8).
 * `console.warn` não reprova: vai como anexo do teste, para alguém olhar.
 * Erro provocado de propósito (HIS-003a: arquivo com 500, tela que quebra, 404) entra em `errosEsperados`: o teste
 * põe o padrão na lista (`errosEsperados.push(/…/)`). Cada padrão só vale se aparecer pelo menos uma vez — senão o
 * teste reprova, para a lista não esconder um erro que deixou de acontecer — e o que não casa com nenhum continua
 * reprovando (D8; negativos no sanidade.spec.ts).
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

export interface ProblemasFiltrados {
  /** Reprovam o teste: os que nenhum padrão esperado explica. */
  inesperados: string[];
  /** Padrões esperados que não apareceram: também reprovam. */
  naoApareceram: string[];
}

const PEDIDO_DE_FORA = "pedido para fora do site";

/**
 * Função pura: separa os problemas que algum padrão esperado explica. Pedido para fora do site nunca é esperado:
 * nada sai do aparelho, nem em teste de erro.
 */
export function filtrarErrosEsperados(problemas: readonly string[], esperados: readonly RegExp[]): ProblemasFiltrados {
  const explicado = (p: string) => !p.startsWith(PEDIDO_DE_FORA) && esperados.some((padrao) => padrao.test(p));
  return {
    inesperados: problemas.filter((p) => !explicado(p)),
    naoApareceram: esperados.filter((padrao) => !problemas.some((p) => !p.startsWith(PEDIDO_DE_FORA) && padrao.test(p))).map(String),
  };
}

interface Vigilancia {
  /** Fixture automática: não é usada pelo nome nos testes. */
  vigiarConsoleErrosERede: void;
  /** Padrões de erro provocados de propósito pelo teste (lista nova a cada teste). */
  errosEsperados: RegExp[];
}

export const test = base.extend<Vigilancia>({
  // `{}`: a fixture não depende de nenhuma outra (forma pedida pelo Playwright; a configuração não liga no-empty-pattern).
  errosEsperados: async ({}, usar) => usar([]),
  vigiarConsoleErrosERede: [
    async ({ context, baseURL, errosEsperados }, usar, info) => {
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
        if (!pedidoPermitido(pedido.url(), origemDoSite)) problemas.push(`${PEDIDO_DE_FORA}: ${pedido.url()}`);
      });

      await usar();

      if (avisos.length) await info.attach("console.warn", { body: avisos.join("\n"), contentType: "text/plain" });
      const { inesperados, naoApareceram } = filtrarErrosEsperados(problemas, errosEsperados);
      if (problemas.length > inesperados.length) {
        await info.attach("erros-esperados", { body: problemas.filter((p) => !inesperados.includes(p)).join("\n"), contentType: "text/plain" });
      }
      expect(inesperados, "erros de console, de página ou pedidos para fora do site").toEqual([]);
      expect(naoApareceram, "erros esperados que não aconteceram (tire da lista ou confira o teste)").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

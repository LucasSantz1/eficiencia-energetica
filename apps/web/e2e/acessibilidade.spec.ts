/*
 * Acessibilidade (critério 3). O axe nos 24 estados entra no passo A5; aqui, por enquanto, só o pendente do zoom.
 */
import { lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

test.describe("zoom de 200% em 390 px (195 × 422 px de CSS)", () => {
  test.use({ viewport: { width: 195, height: 422 }, deviceScaleFactor: 2 });

  test.fixme("HIS-107 · nenhuma página rola para o lado com zoom de 200% (WCAG 1.4.10)", async ({ page, context }) => {
    // Hoje / (254 px de conteúdo em 195), /casa e /casa/dicas (211 px) rolam na horizontal (P2 da HIS-001).
    // Quando a HIS-107 corrigir, trocar fixme por test.
    await semearCasa(context, lerFixture("casa-v2.json"));
    for (const rota of ["/", "/comecar", "/casa", "/casa/comodos", "/casa/comodos?visao=geral", "/casa/dicas", "/casa/ajustes", "/sobre"]) {
      await page.goto(rota);
      await page.waitForLoadState("networkidle");
      const larguras = await page.evaluate(() => ({ conteudo: document.documentElement.scrollWidth, janela: document.documentElement.clientWidth }));
      expect.soft(larguras.conteudo, `${rota}: largura do conteúdo × janela de ${larguras.janela} px`).toBeLessThanOrEqual(larguras.janela);
    }
  });
});

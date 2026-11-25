/*
 * HIS-107: zoom de 200% sem rolagem para o lado. Um celular de 390 px com o zoom do navegador em 200% mostra 195 px
 * de CSS; a WCAG 1.4.10 pede 320 px, e aqui vamos além porque o público usa letra grande no celular. Só roda no
 * projeto do celular: a largura é a mesma nos dois.
 */
import { lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

const ROTAS = ["/", "/comecar", "/tarifa-social", "/sobre", "/casa", "/casa/comodos", "/casa/dicas", "/casa/ajustes"];

test.beforeEach(({ browserName: _ }, info) => {
  test.skip(info.project.name !== "celular", "a largura de 195 px é igual nos dois projetos");
});

for (const largura of [320, 195]) {
  test(`nenhuma tela rola para o lado a ${largura} px`, async ({ page }) => {
    await semearCasa(page.context(), { ...lerFixture("casa-v2.json"), version: 3 });
    await page.setViewportSize({ width: largura, height: 700 });
    for (const rota of ROTAS) {
      await page.goto(rota);
      await page.waitForLoadState("networkidle");
      const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(sobra, `${rota} a ${largura} px`).toBeLessThanOrEqual(0);
    }
  });
}

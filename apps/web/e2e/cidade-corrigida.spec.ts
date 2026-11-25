/*
 * HIS-206, critério 5: casa salva em Nova Santa Rita (PI) com a CERTAJA, cooperativa do RS (código de município trocado
 * no IndQual da ANEEL). Ao abrir, a casa passa para a Equatorial Piauí, uma vez, e o aviso explica a correção.
 */
import { casaSalva, lerFixture, semearCasa } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

test.use({ reducedMotion: "reduce" });

test("Nova Santa Rita (PI) com a CERTAJA passa para a Equatorial Piauí e avisa", async ({ page }) => {
  const base = lerFixture("casa-v2.json");
  const residencia = { ...(base.state.residencia as object), uf: "PI", municipioIbge: 2207959, municipioNome: "Nova Santa Rita", distribuidoraId: "certaja" };
  await semearCasa(page.context(), { version: 3, state: { ...base.state, residencia } });
  await page.goto("/casa");

  const aviso = page.getByText("Corrigimos a empresa de luz da sua cidade");
  await expect(aviso).toBeVisible();
  await expect(page.getByText(/Nova Santa Rita é atendida pela Equatorial Piauí, e não pela/)).toBeVisible();
  await expect.poll(async () => (await casaSalva(page))?.state.residencia).toMatchObject({ distribuidoraId: "equatorial-pi" });

  // Na próxima visita não troca de novo nem repete o aviso.
  await page.reload();
  await expect(page.getByText("Sua conta estimada por mês")).toBeVisible();
  await expect(aviso).toBeHidden();
});

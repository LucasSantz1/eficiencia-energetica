import { expect, test } from "./apoio/teste";

// Commit descartável da HIS-002a (A6, critério 4): prova que um teste falhando deixa capturas e trace no artefato.
// Este arquivo é revertido no commit seguinte.
test("descartável: falha de propósito na página inicial", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Este título não existe" })).toBeVisible({ timeout: 2000 });
});

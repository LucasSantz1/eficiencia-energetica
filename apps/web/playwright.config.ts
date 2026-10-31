import { defineConfig, devices } from "@playwright/test";

// Cada pessoa ou papel sobe o servidor numa porta própria (retro da HIS-001): PORTA_E2E=3105 pnpm test:e2e
const PORTA = Number(process.env.PORTA_E2E ?? 3100);
const NO_GITHUB = process.env.GITHUB_ACTIONS === "true";
// Testes que não dependem da largura da tela rodam uma vez só, no celular.
const SO_NO_CELULAR = /(migracao|aparelhos|ajustes|rotas|peso-js|sanidade)\.spec\.ts$/;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: NO_GITHUB,
  retries: 0, // mesmo resultado no CI e no computador (critério 6): teste instável se corrige, não se repete
  workers: NO_GITHUB ? 2 : undefined,
  reporter: NO_GITHUB
    ? [["list"], ["github"], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${PORTA}`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "celular", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } },
    { name: "computador", testIgnore: SO_NO_CELULAR, use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
  ],
  // Precisa do build de produção (pnpm build). Nunca reaproveita um servidor que já está na porta: poderia ser o
  // build de outra pessoa (retro da HIS-001).
  webServer: {
    command: `pnpm exec next start -p ${PORTA} -H 127.0.0.1`,
    url: `http://127.0.0.1:${PORTA}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});

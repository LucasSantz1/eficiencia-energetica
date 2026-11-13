import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Testes de unidade do site (HIS-003a): o armazenamento e a hidratação da casa salva, sem navegador.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["test/**/*.test.ts"], environment: "node" },
});

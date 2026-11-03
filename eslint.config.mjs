// Regras de código do monorepo (HIS-002, ADR-001 e ADR-003). Divisão com scripts/verificar-camadas.mjs: aqui ficam
// as regras que se decidem olhando só o próprio arquivo; o script cuida do que depende de outro arquivo ou da
// estrutura das pastas. Os casos negativos de cada regra estão em scripts/testes/casos-de-camadas.mjs.
import { readdirSync, readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { join } from "node:path";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importX from "eslint-plugin-import-x";

const SITE = "apps/web/src";
const EXTENSOES = "{js,jsx,cjs,mjs,ts,tsx,cts,mts}";
const SERVIDOR = `**/*.servidor.${EXTENSOES}`;

// O bloco "next" traz os plugins react, react-hooks, import, jsx-a11y e @next/next, mas só para js/jsx/mjs/ts/tsx/mts/cts.
const blocoNext = nextVitals.find((bloco) => bloco.name === "next");
// O parser do typescript-eslint já vem com o eslint-config-next/typescript (sem dependência nova).
const parserTs = nextTs.find((bloco) => bloco.languageOptions?.parser)?.languageOptions.parser;
// Caminhos a partir deste arquivo, não da pasta atual: o ESLint pode ser chamado de outra pasta (Ab11).
const RAIZ = import.meta.dirname;
// A detecção automática procura o react a partir da raiz, onde ele não está instalado: lê a versão do site.
const versaoDoReact = JSON.parse(readFileSync(join(RAIZ, "apps/web/package.json"), "utf8")).dependencies.react;

const FUNCIONALIDADES = readdirSync(join(RAIZ, SITE, "funcionalidades"), { withFileTypes: true })
  .filter((entrada) => entrada.isDirectory())
  .map((entrada) => entrada.name);

const nomesDoNode = [...new Set(builtinModules.map((nome) => nome.replace(/^node:/, "").split("/")[0]))].join("|");

/** Valem para todo arquivo do site, em qualquer camada. */
const RESTRICOES_COMUNS = [
  { regex: "(^|/)\\.\\.(/|$)", message: "Sem '..' no caminho: use @/ entre pastas e ./ só na mesma pasta (HIS-001, decisão 8)." },
  { regex: "^/", message: "Sem caminho absoluto no import: use @/ (HIS-002, S1-e)." },
  { regex: "[?#]", message: "Sem sufixo ? ou # no import (HIS-002, S1-e)." },
  { regex: "^@ee/(?!core$)", message: "Do monorepo, só o pacote @ee/core inteiro, sem caminho interno (ADR-001)." },
];

/**
 * Restrições de import de uma camada. `permitidos` é uma lista de quem pode ser importado com @/ (o resto de @/ é erro):
 * assim, uma pasta nova ou antiga (@/components, @/lib) já nasce proibida.
 */
function restricoesDaCamada({ camada, regra, permitidos, podeCore, podeZustand, podeNode, podeServerOnly }) {
  const padroes = [
    ...RESTRICOES_COMUNS,
    {
      regex: `^@/(?!(${permitidos.join("|")})/)`,
      message: `${camada} só importa ${permitidos.map((pasta) => `@/${pasta}`).join(", ")}${podeCore ? " e @ee/core" : ""} (ADR-001, ${regra}).`,
    },
  ];
  if (!podeCore) padroes.push({ regex: "^@ee/core$", message: `${camada} não importa @ee/core (ADR-001, ${regra}).` });
  if (!podeZustand) padroes.push({ regex: "^zustand(/|$)", message: "zustand só em infraestrutura (ADR-001)." });
  if (!podeNode) padroes.push({ regex: `^(node:|(${nomesDoNode})(/|$))`, message: "Módulo do Node só em infraestrutura/**/*.servidor.ts (ADR-001)." });
  if (!podeServerOnly) padroes.push({ regex: "^server-only$", message: 'import "server-only" só em arquivos *.servidor.ts (ADR-001).' });
  return { "no-restricted-imports": ["error", { patterns: padroes }] };
}

/** Dois blocos por camada: arquivos comuns e *.servidor.* (que podem usar server-only e, em infraestrutura, o Node). */
function camada(pasta, opcoes) {
  const comuns = `${SITE}/${pasta}/**/*.${EXTENSOES}`;
  const servidor = `${SITE}/${pasta}/**/*.servidor.${EXTENSOES}`;
  return [
    { name: `camadas/${pasta}`, files: [comuns], ignores: [SERVIDOR], rules: restricoesDaCamada({ ...opcoes, podeNode: false, podeServerOnly: false }) },
    { name: `camadas/${pasta}/servidor`, files: [servidor], rules: restricoesDaCamada({ ...opcoes, podeNode: opcoes.podeNodeNoServidor === true, podeServerOnly: true }) },
  ];
}

/** Sintaxe proibida no site e no domínio (CLAUDE.md, Segurança; HIS-002, S1). */
const SINTAXE_PROIBIDA = [
  { selector: "CallExpression[callee.name='require']", message: "O projeto é ESM: use import (HIS-002)." },
  { selector: "ImportExpression", message: "import() dinâmico ainda não é permitido: a regra de camadas não o confere. Quando precisar (ex.: OCR), o tech-lead amplia a regra (HIS-002)." },
  { selector: "TSImportEqualsDeclaration", message: "Use import ... from (HIS-002)." },
  { selector: "TSImportType", message: "Use import type ... from, que a regra de camadas confere (HIS-002)." },
  { selector: "Identifier[name='getBuiltinModule'], Literal[value='getBuiltinModule']", message: "process.getBuiltinModule fura a regra dos módulos do Node (HIS-002, S1-f)." },
  { selector: "ExpressionStatement[directive='use server']", message: '"use server" cria um endpoint POST público: proibido até existir regra própria de Server Actions (E4, com a seguranca).' },
  { selector: "AssignmentExpression > MemberExpression.left[property.name=/^(inner|outer)HTML$/]", message: "Proibido innerHTML/outerHTML (CLAUDE.md, Segurança)." },
  { selector: "CallExpression[callee.property.name=/^(insertAdjacentHTML|write|writeln)$/]", message: "Proibido inserir HTML a partir de texto (CLAUDE.md, Segurança)." },
  // Ab6 da seguranca (2026-10-29): outros caminhos de HTML a partir de texto.
  { selector: "CallExpression[callee.property.name=/^(setHTMLUnsafe|parseHTMLUnsafe|createContextualFragment)$/]", message: "Proibido inserir HTML a partir de texto (CLAUDE.md, Segurança)." },
  { selector: "AssignmentExpression > MemberExpression.left[property.name='srcdoc']", message: "Proibido srcdoc: é HTML a partir de texto (CLAUDE.md, Segurança)." },
  { selector: "JSXAttribute[name.name='srcDoc']", message: "Proibido srcDoc: é HTML a partir de texto (CLAUDE.md, Segurança)." },
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Só o que é gerado, com caminho ancorado: um padrão solto (**/out/**) tiraria do lint uma pasta do site com o
  // mesmo nome, ex.: apps/web/src/ui/out/ (Ab4 da seguranca). O controle de contagem do D6 confere.
  globalIgnores([
    "apps/web/.next/**", "apps/web/out/**", "apps/web/playwright-report/**", "apps/web/test-results/**",
    "packages/*/dist/**", "packages/dados/.cache/**", "**/node_modules/**", "**/next-env.d.ts",
  ]),
  { name: "projeto/diretivas", linterOptions: { reportUnusedDisableDirectives: "error" } },
  {
    // Um parser só, o do TypeScript, para toda extensão: o Babel do eslint-config-next não cobre .cjs e procura
    // "next/babel" a partir da raiz, onde o Next não está instalado (S1-c: nenhuma extensão fica sem regra).
    name: "projeto/parser",
    files: [`**/*.${EXTENSOES}`],
    plugins: { ...blocoNext.plugins, "import-x": importX },
    languageOptions: { parser: parserTs, parserOptions: { ecmaFeatures: { jsx: true } } },
    settings: { react: { version: versaoDoReact }, next: { rootDir: join(RAIZ, "apps/web/") } },
  },
  {
    name: "projeto/qualidade",
    files: [`**/*.${EXTENSOES}`],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" }],
      "react/no-danger": "error",
      // Ab6: link "javascript:" e target="_blank" sem rel="noopener noreferrer" (CLAUDE.md, Segurança).
      "react/jsx-no-script-url": "error",
      "react/jsx-no-target-blank": ["error", { allowReferrer: false }],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    },
  },
  { name: "projeto/site", files: [`${SITE}/**/*.${EXTENSOES}`], rules: { "no-restricted-syntax": ["error", ...SINTAXE_PROIBIDA] } },
  ...camada("app", { camada: "app", regra: "regra 1", permitidos: ["app", "funcionalidades/[^/]+", "ui", "aplicacao", "config"], podeCore: false }),
  ...FUNCIONALIDADES.flatMap((nome) =>
    camada(`funcionalidades/${nome}`, { camada: `funcionalidades/${nome}`, regra: "regra 2", permitidos: [`funcionalidades/${nome}`, "ui", "aplicacao", "config"], podeCore: true }),
  ),
  ...camada("ui", { camada: "ui", regra: "regra 4", permitidos: ["ui", "config"], podeCore: true }),
  ...camada("aplicacao", { camada: "aplicacao", regra: "regra 3", permitidos: ["aplicacao", "infraestrutura", "config"], podeCore: true }),
  ...camada("infraestrutura", { camada: "infraestrutura", regra: "regra 5", permitidos: ["infraestrutura", "config"], podeCore: true, podeZustand: true, podeNodeNoServidor: true }),
  ...camada("config", { camada: "config", regra: "ADR-001", permitidos: ["config"], podeCore: false }),
  {
    name: "camadas/dominio",
    files: [`packages/core/src/**/*.${EXTENSOES}`],
    rules: {
      "no-restricted-imports": ["error", { patterns: [
        { regex: "^(?!\\./)", message: "O domínio (@ee/core) só importa arquivos dele mesmo, com ./ (ADR-001, regra 6)." },
        { regex: "(^|/)\\.\\.(/|$)", message: "O domínio (@ee/core) só importa arquivos dele mesmo, com ./ (ADR-001, regra 6)." },
      ] }],
      "no-restricted-syntax": ["error", ...SINTAXE_PROIBIDA],
    },
  },
  {
    // Provisório (HIS-002b, etapa 4): o 8º efeito da HIS-109 (useCasaCarregada, linha 132) mora num arquivo que a
    // HIS-003a e a HIS-111 estão mudando; o comentário na linha entra quando elas forem integradas, e este bloco sai.
    // Só esta regra, só este arquivo: nada de camadas nem de sintaxe proibida fica de fora.
    name: "provisorio/his-109-casa",
    files: [`${SITE}/infraestrutura/armazenamento/casa.ts`],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
]);

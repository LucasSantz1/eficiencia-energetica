# HIS-002 · Qualidade automática no CI

| Campo | Valor |
| --- | --- |
| Épico | E0 · Fundação |
| Sprint | 0 |
| Tamanho | M |
| Papéis principais | qa, tech-lead |
| Status | Preparada |
| Branch | `his-002-qualidade` |

## Problema e valor

Como **equipe**, queremos **que o CI teste sozinho o fluxo principal, a acessibilidade e o padrão de código** para
**nenhuma mudança quebrar o site ou piorar a acessibilidade sem que a gente perceba antes de ir para o ar**.

Hoje o CI faz typecheck, testes de unidade e build. Os testes no navegador são feitos à mão, com scripts soltos.

## Critérios de aceite

1. **Dado** um push ou pull request, **quando** o CI roda, **então** ele executa ESLint (configuração do Next 16) sem erros.
2. **Dado** o site de produção construído no CI, **quando** os testes Playwright rodam, **então** eles percorrem o fluxo
   cadastro → acompanhamento → cômodos → dicas → minha casa em 390 px e 1280 px, falhando em qualquer erro de console.
3. **Dado** as páginas `/`, `/comecar`, `/casa`, `/casa/comodos`, `/casa/dicas`, `/casa/ajustes` e `/sobre`, **quando** o axe roda,
   **então** não há violação de gravidade séria ou crítica.
   _(scrum-master, 2026-10-29 — escopo: violação encontrada que se corrige **sem mudança visível** (ex.: `aria-*`,
   rótulo, papel) é corrigida nesta história. Violação que exige mudança visível (cor, tamanho, layout) **não** é
   corrigida aqui (a E0 não muda nada para quem usa): vira história na E1 e entra numa lista de exceções no próprio
   teste, cada uma com a regra do axe, a página e o ID da história — nunca desligando a regra inteira. A lista é
   revisada pela `ux-acessibilidade` e aparece no relatório do CI.)_
4. **Dado** um teste que falha, **quando** o CI termina, **então** as capturas e o relatório ficam disponíveis como artefato do job.
5. Regras de lint incluem: sem `any` explícito, sem `dangerouslySetInnerHTML`, e as restrições de import entre camadas (ADR-001).
6. `pnpm test:e2e` roda localmente com o mesmo resultado.
7. **Dado** cada caso negativo de camadas da HIS-001 (item 7 da seção 10, R13 e os 21 extras da seguranca) **e** cada
   lacuna da S1 (lista abaixo), **quando** ele é escrito num arquivo de exemplo, **então** `pnpm lint` ou `pnpm camadas`
   falha com a mensagem da regra — conferido por um teste automático no CI (fixtures numa pasta de teste, fora de
   `apps/web/src`), não só à mão. _(tech-lead, vindo da HIS-001)_
8. **Dado** um arquivo sem `"use client"` (componente de servidor ou módulo comum), **quando** ele importa um **valor que
   não é componente** de um módulo `"use client"`, **então** a verificação falha (S2 da HIS-001). As constantes de
   transição (`IR_ADIANTE`, `VOLTAR`, `ENTRAR_NO_PAINEL`) saem de `ui/Movimento.tsx` para `ui/tiposDeTransicao.ts` (sem
   diretiva) e o `novoId` usado por `funcionalidades/cadastro/rascunho.ts` passa a vir de um arquivo sem diretiva
   (ex.: `aplicacao/identificador.ts` reexportando `infraestrutura/identificador.ts`). _(tech-lead, vindo da HIS-001)_
9. **Dado** a medida de peso de JS da HIS-001 (11a: JS que o HTML de cada rota referencia, sem `noModule`, com gzip,
   no máximo +1 024 B; 11b: total com prefetch, no máximo +2 048 B), **quando** o e2e roda num PR, **então** ele compara
   com a referência guardada no repositório (ex.: `apps/web/e2e/peso-js.json`, atualizada de propósito no PR que muda o
   peso, sem precisar compilar o `main` no CI) e falha acima do limite. O `apps/web/e2e-base/` provisório do qa sai do repositório quando `apps/web/e2e/`
   cobrir o que ele cobre. _(tech-lead, vindo da HIS-001)_
   _(scrum-master, 2026-10-29 — "o que ele cobre", para esta história, são as verificações **de comportamento** do
   `linha-de-base.cjs`: casa v2 e v1 abrindo igual (migração), `/comecar` com casa mostra "Você já cadastrou", editar
   aparelho mantém `id` e quantidade, remover aparelho tira a dica do `plano`, "Apagar todos os meus dados" esvazia a
   casa, `/casa/aparelhos` termina em `/casa/comodos`, transições ao trocar de aba, console sem erro e o peso de JS.
   A comparação de pixels e de DOM byte a byte **não** entra no CI (fora do escopo); se a ferramenta de comparação
   antes × depois continua no repositório para futuras reorganizações é decisão do tech-lead com o qa, no desenho.)_

## Fora do escopo

- Testes visuais por comparação de pixels.
- Testes no app de celular.
- Corrigir o zoom de 200% com rolagem para o lado (HIS-107) e os achados de foco e rolagem (HIS-108): o axe não acusa
  esses problemas e eles mudam a tela. Esta história pode, no máximo, deixar um teste marcado como pendente citando a história.
- Qualquer mudança visível para quem usa (critério geral da E0); ver a regra de exceções do critério 3.

## Desenho técnico (proposta inicial)

_(tech-lead, 2026-10-29 — substituída pelo "Desenho técnico definitivo" logo abaixo das notas; mantida para histórico.
Mudou: `@playwright/test` 1.63.0 em vez de 1.64 e `import-x/order` em vez de `import/order` — ver D1.)_

- Dependências (versão exata): `eslint` 10, `eslint-config-next` 16.4.3, `@playwright/test` 1.64, `@axe-core/playwright` 4.14.
- Testes em `apps/web/e2e/` com `playwright.config.ts` (projetos `celular` 390×844 e `computador` 1280×900, `webServer` com `next start`).
- No CI: usar o navegador do `@playwright/test` (`playwright install --with-deps chromium` **só no runner do GitHub**;
  no ambiente de nuvem da equipe o Chromium já existe).
- Dados de tarifa vêm de `public/dados` (sem rede externa no teste).

### Notas do tech-lead vindas da HIS-001 (2026-10-29 — valem para o desenho técnico definitivo)

**Decisão: ESLint e `scripts/verificar-camadas.mjs` convivem, cada regra num lugar só.** O ESLint lê a árvore de
sintaxe (não regex), então fecha de graça a maior parte das lacunas da S1; mas ele olha um arquivo por vez e não sabe a
diretiva do arquivo **importado** nem a estrutura das pastas. Divisão:

| Fica no ESLint (regra do próprio arquivo) | Fica no script (outro arquivo ou estrutura) |
| --- | --- |
| Matriz de camadas do ADR-001 por pasta (`no-restricted-imports` com `files` por camada no `eslint.config.mjs`); proibir `../` em `apps/web/src` (decisão 8 da HIS-001: `./` só na mesma pasta, o resto com `@/`; hoje nenhum arquivo usa `../`) | "use client" não importa `.servidor` (precisa resolver o destino) |
| `zustand` só em `infraestrutura`; módulos do Node só em `infraestrutura/**/*.servidor.ts`; `server-only` só em `*.servidor.ts` | Todo `*.servidor.ts` com `import "server-only";` como primeiro import |
| `require(`, `import()` com argumento não literal, `process.getBuiltinModule` (`no-restricted-syntax` / `no-restricted-properties`) | Critério 8 (S2): arquivo sem diretiva só importa componentes de módulo `"use client"` (precisa ler a diretiva do destino) |
| Diretiva `"use server"` proibida até existir regra própria para Server Actions (cada uma é um endpoint POST público; entra no E4 com a seguranca) | Pastas antigas (`components/`, `lib/`), arquivo fora das camadas, 0 arquivos lidos, **link simbólico = erro** (não pular) |
| Domínio (`packages/core/src`) só com import relativo | Ler **toda** extensão de código nas duas pastas (`.js .jsx .cjs .mjs .ts .tsx .cts .mts`) |

Quando a matriz estiver no ESLint e passar nos mesmos casos negativos (critério 7), ela **sai** do script (sem regra
repetida em dois lugares). O script continua Node puro, sem dependência, dentro do `pnpm typecheck`.

**Lacunas da S1 (seguranca, HIS-001) e onde cada uma fecha:** (a) `from"x"` e `import"x"` sem espaço — ESLint (sintaxe)
e, no script, `\bfrom\s*["']` e `^\s*import\s*["']`; (b) `import /* c */ ("…")` — ESLint (sintaxe); (c) `.js/.jsx/.cjs/.cts`
em `apps/web/src` e `.tsx` em `packages/core/src` não lidos — script lê toda extensão, ESLint com `files` cobrindo todas;
(d) link simbólico pulado em silêncio — script: erro; (e) especificador absoluto (`/…`) ou com `?sufixo` — ESLint
(`no-restricted-imports` por padrão); (f) `process.getBuiltinModule("node:fs")` — ESLint; (g) `"use server"` — ESLint.
Nenhum desses casos existe hoje no código.

**Outras da revisão da HIS-001:** T1 — ligar `import/order` (do `eslint-plugin-import`, que o `eslint-config-next` traz — conferir ao instalar) com correção automática, num
commit só de formatação, separado dos outros; T3 — `rascunho.ts` → `novoId` entra no critério 8.

## Desenho técnico definitivo (tech-lead, 2026-10-29)

_Vale no lugar da "proposta inicial". O que está marcado **medido** foi conferido numa cópia própria
(`scratchpad/tl-his002/copia`: `git archive HEAD` + `pnpm install --offline`, porta 3111, liberada com `fuser -k`),
sem tocar a branch. Seções D1–D15; o qa revisa D6, D9 e D10 (estrutura dos testes)._

### D1. Decisões principais

| # | Decisão | Porquê |
| --- | --- | --- |
| 1 | **ESLint 10.13.0** + `eslint-config-next` 16.4.3, configuração plana na raiz (`eslint.config.mjs`); `pnpm lint` = `eslint . --max-warnings 0` | O Next 16 tirou o `next lint` e o `next build` não roda mais lint (`docs/01-app/03-api-reference/05-config/03-eslint.md`, `upgrading/version-16.md`); `eslint-config-next` ≥ 16.4.0 suporta ESLint 10. A 9 só tem a tag `maintenance` (9.39.5) desde a 10 (2026-02-06). **Medido:** react 7.37.5, jsx-a11y 6.10.2 e import 2.32.0 (que o `eslint-config-next` traz) avisam de par sem a 10, mas todas as regras ligadas rodam nos 82 arquivos e nos 42 casos de ensaio — menos o `import/order` (linha 2) |
| 2 | **T1 com `import-x/order`** (`eslint-plugin-import-x` 4.17.1) | **Medido:** `import/order` do `eslint-plugin-import` 2.32.0 quebra no ESLint 10 (`sourceCode.getTokenOrCommentBefore is not a function`); o pacote não sai desde 2025-06. O `import-x` é o fork mantido (2026-06), com par `eslint ^10`, +7 pacotes; `--fix` muda 20 arquivos, só linhas de import. Recusado o `eslint-plugin-simple-import-sort` 14.0.0: reordena os nomes dentro das chaves e cola a vírgula (`type ComodoRascunho,itemDoCatalogoParaComodo`) em 24 linhas — ele conta com Prettier, que o projeto não tem |
| 3 | **`@playwright/test` 1.63.0** (não 1.64) e `@axe-core/playwright` 4.14.0, em `apps/web` | Critério 6. **Medido:** o ambiente de nuvem tem o Chromium revisão 1243 em `/opt/pw-browsers` (`PLAYWRIGHT_BROWSERS_PATH`), que é o da 1.63.0; a 1.64.1 pede a 1248 e baixar navegador aqui é bloqueado. No runner do GitHub, `playwright install` baixa a mesma 1243 → mesmo navegador nos dois lugares. Sobe de versão junto com o ambiente |
| 4 | **ESLint × script: a divisão de 2026-10-29 fica**, e o script passa a ler os imports com o parser do `typescript` (5.9.3, já no lockfile; entra como devDependency da raiz) | A regra S2 precisa dos **nomes** importados (`import { TransicaoTela, VOLTAR }`, em várias linhas, com `type` no meio) — com regex seria gambiarra. O parser também fecha S1-a/b no script. Revoga o "Node puro, sem dependência" da HIS-001 |
| 5 | **`import()` dinâmico proibido** no site e no domínio (ESLint) | O `no-restricted-imports` não olha `import()`, e a matriz sai do script. Hoje há 0 usos. Quando precisar (OCR, E3), o tech-lead amplia a regra antes |
| 6 | **e2e em todo pull request e todo push no `main`** (e `workflow_dispatch`) | Resposta da pergunta aberta (D11) |
| 7 | Peso de JS comparado com `apps/web/e2e/peso-js.json`, versionado | Critério 9, sem compilar o `main` no CI (D8) |
| 8 | `apps/web/e2e-base/` sai inteiro do repositório (inclusive o comparador antes × depois) no último passo da parte do navegador | O e2e cobre o comportamento; o comparador é CommonJS com `require`, sem dono e fora do lint. Fica no histórico do git (`git show <commit>:apps/web/e2e-base/linha-de-base.cjs`); a próxima reorganização "sem mudar nada" (ex.: dividir `Cadastro.tsx`) recupera e adapta. **qa:** pode contestar |
| 9 | Proposta de quebra em HIS-002a (navegador) e HIS-002b (lint e camadas) | D12; quem decide é o scrum-master |

### D2. Dependências novas (versão exata; só desenvolvimento — nada vai para o navegador)

| Pacote | Versão | Onde | Para quê | Conferido em 2026-10-29 |
| --- | --- | --- | --- | --- |
| `eslint` | 10.13.0 | raiz | lint | `npm view` = latest; motor `^22.13` (temos Node 22.23) |
| `eslint-config-next` | 16.4.3 | raiz | regras do Next, React, hooks, jsx-a11y, typescript-eslint | igual ao `next` 16.4.3 |
| `eslint-plugin-import-x` | 4.17.1 | raiz | `import-x/order` (T1) | latest; par `eslint ^10` |
| `typescript` | 5.9.3 | raiz | parser do script; par do typescript-eslint (`>=4.8.4 <6.1.0`) | mesma de `apps/web` e `packages/*` |
| `@playwright/test` | 1.63.0 | `apps/web` | e2e | D1-3; publicada em 2026-09-04, sem patch |
| `@axe-core/playwright` | 4.14.0 | `apps/web` | axe (traz `axe-core` ~4.14.0) | latest; par `playwright-core >=1.0.0` |

**Medido na cópia:** `pnpm audit` → "No known vulnerabilities found"; `node_modules/.pnpm` de 91 para ~400 pacotes
(+107 MB, quase tudo a árvore do `eslint-config-next` e o `playwright-core`). `pnpm install` mostra avisos de par
(react, jsx-a11y, import × ESLint 10) — esperados; `strict-peer-dependencies` segue desligado (padrão do pnpm 10).
O `unrs-resolver` pede script de instalação: **não** entra em `onlyBuiltDependencies` (o lint funciona sem ele).
**Saída se uma regra quebrar no ESLint 10 depois:** ESLint 9.39.5 e `import/order`, sem mudar o resto.

### D3. Scripts e `.gitignore`

Raiz (`package.json`):

```json
"lint": "eslint . --max-warnings 0 --cache --cache-location node_modules/.cache/eslint/",
"camadas": "node scripts/verificar-camadas.mjs",
"typecheck": "pnpm camadas && pnpm -r --if-present typecheck",
"test": "pnpm -r --if-present test && pnpm test:camadas",
"test:camadas": "node --test \"scripts/testes/**/*.test.mjs\"",
"test:e2e": "pnpm --filter @ee/web test:e2e"
```

`apps/web/package.json`: `"test:e2e": "playwright test"` e `"typecheck": "tsc --noEmit && tsc --noEmit -p e2e"` (o
`tsconfig` do site só inclui `src/`; o e2e tem o seu, estrito, e não entra no `next build`). O `--max-warnings 0` faz
as regras do `jsx-a11y` (aviso no Next) barrarem também. O e2e **não** entra no `pnpm test` (precisa do build).

`.gitignore`: trocar `/test-results/` e `/playwright-report/` (presos à raiz; o Playwright grava em `apps/web/`) por
`test-results/` e `playwright-report/`.

### D4. `eslint.config.mjs` (raiz)

**Medido:** lê 82 arquivos em ~9 s (2 núcleos). 42 casos de ensaio com `ESLint.lintText(codigo, { filePath })`
acusam a regra certa — matriz por camada, `../` e `@/../`, S1-a (`import{x}from"…"`, `import"zustand"`), S1-b
(`import /* c */ ("…")`), S1-c (`.cjs`/`.jsx` no site, `.tsx`/`.cts` no domínio), S1-e (`/abs`, `?raw`), S1-f
(`process.getBuiltinModule` e `process["getBuiltinModule"]`), S1-g (`"use server"` no arquivo e dentro de função),
`export … from`, `import type`, `typeof import()`, `import x = require()`, `@ee/core/src/…`, `any`, `@ts-ignore`,
`dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` — e o controle limpo passa.

Pontos do arquivo que valem explicar:

- Matriz como **lista do que pode** (`^@/(?!(ui|config)/)` para `ui`): pasta nova ou antiga (`@/components`) já nasce
  proibida. Cobre `import`, `import type`, `export … from` e `export *`.
- Um bloco por funcionalidade, gerado da lista de pastas de `funcionalidades/`: cada uma só importa a si mesma.
- `app` não importa `@ee/core` (ADR-001, regra 1, ao pé da letra; hoje 0 casos). `config` só importa `config`.
- Um parser só (typescript-eslint) para as 8 extensões, e a versão do React lida de `apps/web/package.json`.
  **Medido:** o Babel do `eslint-config-next` dá erro de parse em `.cjs` a partir da raiz (`Cannot find module
  'next/babel'`) e a detecção do React não acha o pacote na raiz.
- `reportUnusedDisableDirectives: "error"`: um `eslint-disable` que deixou de ser preciso vira erro.

<details><summary>Arquivo completo (contrato da implementação; validado na cópia)</summary>

```js
// Regras de código do monorepo (HIS-002, ADR-001 e ADR-003). Divisão com scripts/verificar-camadas.mjs: aqui ficam
// as regras que se decidem olhando só o próprio arquivo; o script cuida do que depende de outro arquivo ou da
// estrutura das pastas. Os casos negativos de cada regra estão em scripts/testes/casos-de-camadas.mjs.
import { readdirSync, readFileSync } from "node:fs";
import { builtinModules } from "node:module";
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
// A detecção automática procura o react a partir da raiz, onde ele não está instalado: lê a versão do site.
const versaoDoReact = JSON.parse(readFileSync("apps/web/package.json", "utf8")).dependencies.react;

const FUNCIONALIDADES = readdirSync(`${SITE}/funcionalidades`, { withFileTypes: true })
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
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    "**/.next/**", "**/out/**", "**/build/**", "**/next-env.d.ts", "**/node_modules/**",
    "**/playwright-report/**", "**/test-results/**",
  ]),
  { name: "projeto/diretivas", linterOptions: { reportUnusedDisableDirectives: "error" } },
  {
    // Um parser só, o do TypeScript, para toda extensão: o Babel do eslint-config-next não cobre .cjs e procura
    // "next/babel" a partir da raiz, onde o Next não está instalado (S1-c: nenhuma extensão fica sem regra).
    name: "projeto/parser",
    files: [`**/*.${EXTENSOES}`],
    plugins: { ...blocoNext.plugins, "import-x": importX },
    languageOptions: { parser: parserTs, parserOptions: { ecmaFeatures: { jsx: true } } },
    settings: { react: { version: versaoDoReact }, next: { rootDir: "apps/web/" } },
  },
  {
    name: "projeto/qualidade",
    files: [`**/*.${EXTENSOES}`],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" }],
      "react/no-danger": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      // T1 da HIS-001. O import/order do eslint-plugin-import 2.32 quebra no ESLint 10; o import-x é o fork mantido.
      "import-x/order": ["error", {
        groups: ["builtin", "external", "internal", ["parent", "sibling", "index"]],
        pathGroups: [{ pattern: "@ee/**", group: "internal", position: "before" }, { pattern: "@/**", group: "internal" }],
        pathGroupsExcludedImportTypes: ["builtin"],
        "newlines-between": "never",
        alphabetize: { order: "asc", caseInsensitive: true },
      }],
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
]);
```

</details>

**O que o lint acusa hoje (medido) e o que fazer — tudo sem mudança visível:**

| Achado | Onde | O que fazer |
| --- | --- | --- |
| `import-x/order` | 20 arquivos | `pnpm lint --fix` **duas vezes** (o ESLint limita as passadas; na segunda sobra 0), num commit **só de formatação** (T1) |
| `react-hooks/set-state-in-effect` (regra do React Compiler, nova no `react-hooks` 7) | `funcionalidades/comodos/TelaComodos.tsx` 47, 143, 360; `infraestrutura/armazenamento/casa.ts` 132; `infraestrutura/dados-publicos/navegador.ts` 32; `ui/Movimento.tsx` 39, 77; `ui/aparelho/EditorAparelho.tsx` 45 | **Não** reescrever agora (muda o momento dos renders; a E0 não muda nada para quem usa). Em cada linha: `// eslint-disable-next-line react-hooks/set-state-in-effect -- <porquê> (HIS-109)`, com o motivo real (ex.: "lê ?visao da URL só depois da hidratação"). Nunca desligar a regra inteira nem por arquivo. HIS-109 = dívida "efeitos que copiam estado" (pergunta ao scrum-master) |
| `react/no-children-prop` | `ui/aparelho/EditorAparelho.tsx` 50 (`children={null}`) | `<Folha …>{null}</Folha>` (mesmas props) |
| `import/no-anonymous-default-export` (aviso) | `apps/web/postcss.config.mjs` | `const configuracao = {…}; export default configuracao;` |
| `@typescript-eslint/no-unused-vars` (aviso) | `packages/dados` (`_ignorar`, `_a`, `_b`) | resolvido pela opção `^_` da configuração |

### D5. `scripts/verificar-camadas.mjs` depois da HIS-002

**Sai** (fica só no ESLint, e só depois que os casos do D6 provarem a cobertura): matriz `PERMITIDOS`/`podeImportar`,
zustand, módulos do Node, `server-only` fora de `.servidor`, `require(`/`import(` por regex, domínio só com `./`.

**Fica ou entra** (depende de outro arquivo ou da estrutura):

| Regra | Mensagem (começo) |
| --- | --- |
| C1 · pastas antigas `components/`, `lib/` | "pasta antiga ainda existe" (já existe) |
| C2 · arquivo fora das camadas (inclui arquivo solto em `funcionalidades/`) | "arquivo fora das camadas" (já existe) |
| C3 · 0 arquivos lidos em `apps/web/src` ou `packages/core/src` | "nenhum arquivo lido" (já existe) |
| C4 · **link simbólico = erro** (hoje é pulado em silêncio — S1-d) | "link simbólico não é permitido" |
| C5 · lê as 8 extensões nas duas pastas (`.js .jsx .cjs .mjs .ts .tsx .cts .mts` — S1-c) | — |
| C6 · todo `*.servidor.*` tem `import "server-only";` como primeiro import | (já existe) |
| C7 · `"use client"` não importa `*.servidor` (nem com `import type`) | (já existe) |
| C8 · **S2:** arquivo **sem** `"use client"` que importa ou reexporta de um módulo `"use client"` do site só leva **componente** (nome em PascalCase com ao menos uma minúscula: `TransicaoTela` sim; `VOLTAR`, `novoId`, `useCasa` não) ou **tipo** (`import type`, `{ type X }`). `import * as` e `export *` de módulo `"use client"` = erro. Em `import X from`, vale o nome local | `arquivo sem "use client" só importa componentes de um módulo "use client" (S2): VOLTAR de @/ui/Movimento` |
| C9 · destino interno (`@/` ou `./`) que não existe = erro (sem isso a C8 passaria em silêncio) | "destino não encontrado" |

Contrato: `node scripts/verificar-camadas.mjs [--raiz=<pasta>]` (padrão: a raiz do repositório por
`import.meta.dirname`; `--raiz` só para os testes). Continua só lendo: não executa nem importa os arquivos lidos, sem
rede, sem escrita, sem try/catch, código 1 em qualquer problema. Usa `ts.createSourceFile` (só análise de sintaxe, sem
checar tipos); a diretiva sai dos primeiros `ExpressionStatement` de texto do AST, não mais do texto cru. Resolução:
`@/x` → `apps/web/src/x`, `./x` → pasta do arquivo, tentando sem extensão e com as 8.

**Prototipado** (`scratchpad/tl-his002/prototipo-s2.mjs`, parser do TypeScript) no código atual: 13 imports de módulo
`"use client"` por arquivo sem diretiva; **exatamente 2** violam a C8 — `app/sobre/page.tsx` (`VOLTAR` de
`@/ui/Movimento`) e `funcionalidades/cadastro/rascunho.ts` (`novoId` de `@/aplicacao/casa`), os do critério 8.

### D6. Testes negativos automáticos (critério 7) — para o qa revisar

```
scripts/testes/
  casos-de-camadas.mjs     a tabela de casos (só dados)
  camadas.test.mjs         node:test: roda cada caso no ESLint ou no script
```

Fora de `apps/web/src`, sem pacote novo, dentro do `pnpm test` (`test:camadas`) → roda no job `verificar` do CI.

Formato de um caso:

```js
{
  id: "S1-a-from-sem-espaco",
  origem: "S1 (seguranca, HIS-001)",  // ou "HIS-001 §10 item 7", "R13", "seguranca-07", "C8", "controle"
  verificador: "eslint",               // ou "script"
  arquivos: { "apps/web/src/ui/Exemplo.tsx": 'import{useCasa}from"@/aplicacao/casa";\nexport const usar = useCasa;\n' },
  links: [],                           // só no "script": [["destino", "caminho do link"]]
  espera: { regra: "no-restricted-imports", mensagem: "ui só importa" },  // null num controle
}
```

- **ESLint:** `new ESLint({ cwd: raiz })` com a configuração real e `lintText(conteudo, { filePath })`: o arquivo não
  precisa existir, o caminho escolhe a camada. Passa se houver erro da `regra` com a `mensagem`. O código do caso
  **usa** o que importa (senão `no-unused-vars` sujaria os controles — visto no ensaio).
- **Script:** cria uma árvore mínima num `mkdtemp` (`apps/web/src/app/page.tsx`,
  `apps/web/src/funcionalidades/exemplo/Tela.tsx`, `packages/core/src/index.ts`), grava `arquivos` e `links`, roda
  `node scripts/verificar-camadas.mjs --raiz=<tmp>` com `execFileSync` e exige código 1 e a mensagem no `stderr`.
  Apaga só o próprio `mkdtemp`.
- **Controles** (retro: "tudo certo" lendo 0 arquivos é pior que nada): (1) o repositório de verdade → código 0 e o
  mesmo número de arquivos que `git ls-files` dá para as 8 extensões nas duas pastas; (2) a árvore mínima limpa →
  código 0; (3) um arquivo limpo por camada no ESLint → 0 erros; (4) o script chamado de outra pasta (`cwd` =
  `os.tmpdir()`) → mesmo resultado.
- **Casos obrigatórios:** os do item 7 da §10 da HIS-001; os do R13; S1-a a S1-g (pelo menos um cada); os 21 da
  seguranca (pergunta aberta; entram com `origem: "seguranca-NN"`); C1–C9. O teste imprime "N casos: X no ESLint, Y no
  script" e falha se faltar alguma origem obrigatória (assim ninguém apaga um caso sem perceber).

### D7. Correção S2/T3 (critério 8) — sem mudança visível

| Arquivo | Mudança |
| --- | --- |
| `apps/web/src/ui/tiposDeTransicao.ts` (novo, **sem diretiva**) | `IR_ADIANTE`, `VOLTAR`, `ENTRAR_NO_PAINEL`, mesmos valores, com o comentário que hoje está no `Movimento` |
| `ui/Movimento.tsx` | tira as 3 constantes (sem reexportar: sem barril); o `MAPA` fica igual |
| `app/sobre/page.tsx`, `funcionalidades/inicio/BotaoComecar.tsx`, `funcionalidades/cadastro/Cadastro.tsx`, `funcionalidades/casca/Casca.tsx` | importam as constantes de `@/ui/tiposDeTransicao` |
| `apps/web/src/aplicacao/identificador.ts` (novo, sem diretiva) | `export { novoId } from "@/infraestrutura/identificador";` |
| `aplicacao/casa.ts` | tira o `export { novoId }` (o único uso era o `rascunho`) |
| `funcionalidades/cadastro/rascunho.ts` | `import { novoId } from "@/aplicacao/identificador";` |

Efeito: em `/sobre`, `VOLTAR` deixa de ir como referência a módulo cliente e vai como `["nav-back"]` no conteúdo da
página. Confere-se com o e2e (transição de `/sobre` para `/`) e com o peso de JS do D8, que já precisa existir.

### D8. Peso de JS (critério 9)

- `apps/web/e2e/peso-js.spec.ts`, só no projeto `celular`; as 7 rotas do critério 3, sem casa.
- **11a:** baixa o HTML (Node `http`, como o `jsDoHtml` do `e2e-base`), junta `<script src>` sem `noModule` e
  `<link rel="preload" as="script">`, soma o tamanho de cada arquivo pedido com `accept-encoding: gzip`.
  **11b:** abre a rota no navegador, `networkidle` + 1 s, soma `encodedBodySize` de todo `.js` em
  `performance.getEntriesByType("resource")` (sem relógio falso: ele troca o `performance`).
- `apps/web/e2e/peso-js.json`:
  ```json
  { "medidoNoCommit": "abc1234", "rotas": { "/": { "jsDoHtml": 164212, "totalComPrefetch": 0 } } }
  ```
  Limites no teste, com comentário apontando para a decisão da HIS-001: `jsDoHtml` ≤ referência + 1 024 B e
  `totalComPrefetch` ≤ referência + 2 048 B. Rota sem referência = erro. Abaixo da referência mais que o limite =
  **anotação** ("atualize a referência para o ganho não se perder"), não erro.
- **Atualizar de propósito:** `ATUALIZAR_PESO_JS=1 pnpm test:e2e --project=celular peso-js` regrava o JSON. Com
  `GITHUB_ACTIONS=true` essa variável faz o teste **falhar** (o CI nunca atualiza). O PR que muda o peso mostra o diff
  do JSON e explica na história.
- Tabela "rota · referência · medido · diferença" anexada ao relatório e escrita no resumo do job
  (`$GITHUB_STEP_SUMMARY`).
- Sanidade: no primeiro registro, os números devem bater com os da HIS-001 (`/` 164 212, `/comecar` 172 561, `/casa`
  175 053, `/casa/comodos` 172 950, `/casa/dicas` 166 026, `/casa/ajustes` 163 965, `/sobre` 139 573 B).

### D9. `apps/web/e2e/` — estrutura (para o qa revisar)

```
apps/web/
  playwright.config.ts
  e2e/
    tsconfig.json              estende ../../../tsconfig.base.json; lib dom + ES2022; types node
    apoio/
      teste.ts                 test/expect com a fixture automática "console e página sem erro"
      casa.ts                  CHAVE_CASA, semearCasa(contexto, fixture), casaSalva(página)
      resumo-do-ci.ts          acrescenta Markdown em $GITHUB_STEP_SUMMARY quando ele existe
    fixtures/
      casa-v1.json             copiadas do e2e-base (dados inventados, Presidente Prudente)
      casa-v2.json
    fluxo-principal.spec.ts    critério 2
    migracao.spec.ts
    aparelhos.spec.ts
    ajustes.spec.ts
    rotas.spec.ts
    transicoes.spec.ts
    acessibilidade.spec.ts     critério 3
    excecoes-axe.ts
    peso-js.spec.ts            critério 9
    peso-js.json
```

`apps/web/playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

// Cada pessoa ou papel sobe o servidor numa porta própria (retro da HIS-001): PORTA_E2E=3105 pnpm test:e2e
const PORTA = Number(process.env.PORTA_E2E ?? 3100);
const NO_GITHUB = process.env.GITHUB_ACTIONS === "true";
// Testes que não dependem da largura da tela rodam uma vez só, no celular.
const SO_NO_CELULAR = /(migracao|aparelhos|ajustes|rotas|peso-js)\.spec\.ts$/;

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
```

**Medido:** com esta configuração (só o axe nas 7 páginas, 14 testes), `playwright test` sobe o `next start`, roda no
Chromium 1243 do ambiente e termina em 32 s.

O que do `e2e-base` vira teste (lista do scrum-master no critério 9):

| Verificação | Arquivo | Projetos |
| --- | --- | --- |
| Fluxo cadastro → acompanhamento (editor pelo "Quem mais gasta" salva sem mudar ids e quantidade; 2 contas; 2 leituras) → cômodos (editor salva sem mudar ids; remove a TV) → dicas (marca o plano) → acompanhamento → minha casa → sobre → início | `fluxo-principal` | celular, computador |
| Casa v2 abre e recarrega igual; v1 migra para v2 com `contas`, `leituras` e `plano` vazios | `migracao` | celular |
| `/comecar` com casa mostra "Você já cadastrou a sua casa" e não muda a casa guardada | `migracao` | celular |
| Editar aparelho mantém `id` e quantidade; remover aparelho tira a dica dele do `plano` | `aparelhos` | celular |
| "Apagar todos os meus dados" esvazia a casa e volta para `/` | `ajustes` | celular |
| `/casa/aparelhos` termina em `/casa/comodos` (200 com `NEXT_REDIRECT`, como no `main`); as 8 rotas respondem 200; `/` com `initialRevalidateSeconds` 86400 no `.next/prerender-manifest.json` | `rotas` | celular |
| Trocar de aba dispara transição (`startViewTransition` contado por `addInitScript`); topo e navegação com `view-transition-name`; com `reducedMotion: "reduce"`, `.surgir` não dura 0,52 s | `transicoes` | celular, computador |
| Console e página sem erro | `apoio/teste.ts` (automática, em todo teste) | todos |
| Peso de JS 11a/11b | `peso-js` | celular |

**Não entra** (fora do escopo): capturas comparadas, texto e DOM byte a byte, relógio fixo, `crypto.randomUUID` trocado
por contador, o `bytesDeJs` antigo.

Escolhas para o qa confirmar ou mudar:

- **Relógio real** (sem `clock.setFixedTime`): os testes conferem comportamento, não valor; o relógio fixo servia à
  comparação byte a byte e ficaria para trás quando os dados da ANEEL andarem.
- **Nunca afirmar valor de tarifa em R$** (os dados mudam todo dia): afirmar que o valor aparece, que o cômodo aparece,
  que o total muda ao remover.
- Seletores por papel e nome (`getByRole`), como no `e2e-base`; nenhuma espera fixa fora do "+1 s" do 11b.
- O parâmetro da fixture se chama `usar`, não `use`: o `react-hooks/rules-of-hooks` acusa `use(...)` como hook.
- `celular` = só a janela 390×844 (como na HIS-001); `hasTouch`/`isMobile` fica a critério do qa.
- `CHAVE_CASA` repetida no teste (o e2e não importa código do site — caixa-preta): se a chave mudar, a migração
  falha alto, que é o que se quer (mudar a chave apaga a casa de quem usa).

### D10. axe (critério 3) — para o qa e a ux revisarem

- `acessibilidade.spec.ts`, nos dois projetos, com `reducedMotion: "reduce"`, depois de `networkidle` e das animações
  paradas. **Medido:** sem isso o axe mede o contraste no meio da animação `acende` e acusa 1,08:1 que não existe.
- Páginas e estados: as 7 **sem casa**, e `/`, `/comecar`, `/casa`, `/casa/comodos`, `/casa/dicas`, `/casa/ajustes`
  **com a casa v2** (é com casa que essas telas mostram conteúdo): 13 × 2 projetos.
- Regras: o conjunto padrão do axe, sem filtro de tag (o critério fala de toda violação séria ou crítica). Falha em
  `impact` `serious` ou `critical` que não esteja na lista de exceções; `moderate`/`minor` vão como anexo informativo.
- `excecoes-axe.ts`:
  ```ts
  export interface ExcecaoAxe {
    regra: string;                      // id da regra do axe, ex.: "color-contrast"
    pagina: string;                     // ex.: "/"
    estado: "sem casa" | "com casa";
    alvo: string;                       // trecho do seletor do nó: a exceção é por elemento, nunca pela regra inteira
    historia: `HIS-${number}`;          // história da E1 que corrige
    motivo: string;
  }
  export const EXCECOES_AXE: readonly ExcecaoAxe[] = [];
  ```
  Exceção que não casa com nenhuma violação = erro ("exceção velha: tire da lista"). A lista aplicada vai para o
  relatório e para o resumo do job. Quem revisa: `ux-acessibilidade`.
- **Levantamento prévio (medido; sem casa, ainda sem movimento reduzido):** só a `/` tem violação séria; as outras 6
  páginas, 0.
  - `color-contrast`: pílula de porcentagem branca em `bg-faixa-d` (#ec7a1a), 2,85:1 — real e **muda cor** → exceção +
    história na E1 (candidata: HIS-102 "Letra maior e alto contraste"; scrum-master e ux decidem). Os outros nós eram
    efeito da animação.
  - `definition-list`: `<dl class="grid gap-6 self-center">` com `<p>` filho direto → mudar a estrutura sem mudar a
    tela → **corrige aqui** (frontend).
  - `label-content-name-mismatch`: 5 botões da casa ilustrada com `aria-label="Quarto: R$ 21,74 por mês"` sem o
    "19%" que aparece → só o nome acessível muda → **corrige aqui**, com o texto da `ux-acessibilidade`.

### D11. CI e resposta da pergunta aberta

`.github/workflows/ci.yml` final:

```yaml
name: Verificação

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

# Um PR que recebe outro push cancela a execução velha; no main, nada é cancelado.
concurrency:
  group: verificacao-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

permissions:
  contents: read

jobs:
  verificar:
    name: Lint, tipos e testes
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

  e2e:
    name: Navegador (e2e, axe e peso)
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      # Só no runner do GitHub; no ambiente de nuvem da equipe o Chromium já existe (D1-3).
      - name: Instalar o Chromium do Playwright
        run: pnpm --filter @ee/web exec playwright install --with-deps --only-shell chromium
      - run: pnpm build
      - run: pnpm test:e2e
      - name: Guardar relatório, capturas e traces
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: relatorio-e2e
          path: |
            apps/web/playwright-report/
            apps/web/test-results/
          retention-days: 14
          if-no-files-found: ignore
```

- Dois jobs em paralelo. O `pnpm build` sai do `verificar` e fica só no `e2e`, onde é preciso (um build só por execução).
- `permissions: contents: read` (menor privilégio).
- **Cache do navegador no runner: não.** A própria documentação do Playwright desaconselha (restaurar ~100 MB leva o
  mesmo que baixar, e as dependências do sistema não cabem no cache). `--only-shell` baixa só o Chromium sem janela,
  que é o que o modo headless usa. Gatilho para rever: o passo passar de 60 s em 3 execuções seguidas → cache de
  `~/.cache/ms-playwright` com chave na versão do `@playwright/test` e, no acerto, só `playwright install-deps chromium`.
- Artefato `relatorio-e2e` (relatório HTML, capturas e traces das falhas, peso e exceções do axe) em **toda** execução
  não cancelada — o critério 4 pede na falha; quando passa, o relatório do axe e do peso também interessa —, por 14
  dias. Conteúdo: só os dados inventados das fixtures e do fluxo (a seguranca confere).
- Proteção do `main` (dono do projeto, nas configurações do GitHub): exigir os checks "Lint, tipos e testes" e
  "Navegador (e2e, axe e peso)" para integrar.
- `actions/upload-artifact@v4`: conferir a major atual na implementação (a API do GitHub não estava acessível daqui);
  fixar actions por SHA é assunto da seguranca (HIS-003).

**Resposta da pergunta `[para: tech-lead]`** — está nas "Perguntas abertas", junto da pergunta.

### D12. Tamanho e proposta de quebra

| Bloco | Critérios | Estimativa |
| --- | --- | --- |
| Playwright: configuração, apoio, fluxo principal nos 2 projetos | 2, 6 | 0,75 dia |
| Specs de comportamento do `e2e-base` (migração, portão, aparelhos, apagar, rotas, transições) e saída do `e2e-base` | 2, 9 | 0,5 dia |
| axe com estados, lista de exceções, correções sem mudança visível (com ux) | 3 | 0,5 dia |
| Peso de JS com referência | 9 | 0,25 dia |
| `ci.yml`, artefatos, resumo do job, conferência do peso no runner | 4 | 0,25 dia |
| ESLint, configuração, achados do D4, commit de formatação (T1) | 1, 5 | 0,5 dia |
| Testes negativos (tabela com HIS-001 §10 item 7, R13, S1, 21 da seguranca, controles) | 7 | 0,5 dia |
| Script com parser TS, C4/C5/C8/C9, matriz fora; correção S2/T3 | 7, 8 | 0,75 dia |
| **Total** | | **≈ 4 dias** |

Passa de 3 dias → **proposta de quebra** (o scrum-master decide):

- **HIS-002a · Testes no navegador no CI** — critérios **2, 3, 4, 6, 9** (≈ 2–2,5 dias). Sem bloqueio: começa já.
- **HIS-002b · Lint e camadas automáticos** — critérios **1, 5, 7, 8** + T1 (≈ 1,5–2 dias). Depende da lista dos 21
  casos da seguranca (critério 7) e da HIS-002a: o e2e e o peso conferem que a correção S2 não mudou nada.

A ordem (a antes da b) inverte a sugestão do scrum-master só no rótulo: a sugestão "7–8 numa HIS-002b" fica; o 1 e o 5
vão junto com eles porque o ESLint, a matriz e os casos negativos são uma coisa só.

### D13. Ordem dos passos (cada um verde: `pnpm typecheck`, `pnpm test`, `pnpm build` e o que o passo acrescenta)

**HIS-002a**

| Passo | O que | Verde quando |
| --- | --- | --- |
| A1 | Dependências do Playwright e do axe; `playwright.config.ts`; `e2e/tsconfig.json`; `e2e/apoio/*`; scripts; `.gitignore`; `rotas.spec.ts` | `pnpm build && PORTA_E2E=<sua> pnpm test:e2e` passa; o `typecheck` cobre o `e2e/` |
| A2 | `fluxo-principal.spec.ts` | passa nos 2 projetos, sem erro de console |
| A3 | fixtures copiadas; `migracao`, `aparelhos`, `ajustes`, `transicoes` | todas as verificações de comportamento da tabela do D9 |
| A4 | `peso-js.spec.ts` + `peso-js.json` medido neste commit (código igual ao `main`) | números batem com os da HIS-001 (D8) |
| A5 | `acessibilidade.spec.ts` + `excecoes-axe.ts`; correções sem mudança visível num commit próprio (texto da ux) | 0 sério/crítico fora das exceções; peso dentro do limite; ux revisou a lista |
| A6 | `ci.yml` (job `e2e`, artefato, resumo; build sai do `verificar`) | CI verde no PR; peso do runner igual ao local (se não, referência = medida do CI); um commit descartável com teste falhando mostra capturas e trace no artefato (critério 4) e é revertido |
| A7 | `git rm -r apps/web/e2e-base` | `grep -rn "e2e-base" apps scripts .github` vazio |

**HIS-002b**

| Passo | O que | Verde quando |
| --- | --- | --- |
| B1 | Dependências do ESLint; `eslint.config.mjs` **sem** `import-x/order`; `pnpm lint`; achados do D4 (8 `eslint-disable` com motivo, `children`, `postcss`) | `pnpm lint` com 0 erros e 0 avisos |
| B2 | Liga `import-x/order` e aplica `pnpm lint --fix` duas vezes — commit **só** de formatação (T1) | `git diff -U0 HEAD~1` tem só linhas de `import`/`export … from` (e a linha da configuração); `pnpm lint` 0 |
| B3 | `pnpm lint` no job `verificar` | CI verde |
| B4 | `scripts/testes/` com os casos do ESLint e os do script que já existem (C1–C3, C6, C7) | todos os casos e controles passam |
| B5 | Script com parser TS: tira a matriz e o resto do "Sai" (D5); C4, C5, C9; `--raiz`; casos novos | os casos da matriz continuam passando — agora só pelo ESLint |
| B6 | Correção S2/T3 (D7) | e2e e peso verdes |
| B7 | C8 no script + casos (`VOLTAR`, `novoId`, `import * as`, `export *`, default em minúscula; controles: `import type` e componente) | `pnpm camadas` verde no repositório; casos da C8 acusam |
| B8 | ADR-001 (frase da HIS-002) e ADR-003 para "aceito" (tech-lead); docs (documentacao) | — |

### D14. Riscos

| Risco | Como evitar |
| --- | --- |
| Regra do `eslint-config-next` quebrar no ESLint 10 (plugins sem a 10 no par) | Medido: as regras ligadas rodam; os casos negativos exercitam `react/no-danger` e a matriz. Saída: ESLint 9.39.5 + `import/order` (D2) |
| Playwright do repositório diferente do navegador do ambiente | 1.63.0 casada com a revisão 1243; se o ambiente mudar, o Playwright avisa "Executable doesn't exist" e sobe-se junto. O CI baixa a revisão certa sozinho |
| Peso medido no runner diferente do medido aqui | Comparar no passo A6; a referência vem de onde o CI mede |
| Dados da ANEEL mudando todo dia | Nenhum valor em R$ afirmado; relógio real. **Observação para o backend:** o commit diário dos dados é feito com o `GITHUB_TOKEN`, que não dispara outros workflows — os dados novos não passam pelo e2e. Fora desta história; sugestão futura: rodar o e2e no `atualizar-dados.yml` antes do `git push` |
| Teste instável bloquear PR (com `retries: 0`) | `reducedMotion` onde não se testa movimento, asserções que esperam sozinhas, nada de espera fixa; instável se corrige no dia |
| Lista de exceções do axe crescer | Exceção por elemento, com história; exceção velha = erro; ux revisa |
| Cadeia de suprimentos: +~309 pacotes de desenvolvimento | `pnpm audit` limpo (medido); nada vai para o navegador (portão de peso e hosts em `.next/static`, como o R14 da HIS-001); análise da seguranca |
| Builds e servidores em paralelo se derrubando (retro) | `PORTA_E2E` própria, `reuseExistingServer: false`, cópia própria no scratchpad para revisar |
| Falso positivo do `react-hooks` em fixture do Playwright | Parâmetro `usar` |
| Script passa a depender do `typescript` instalado | Sem `pnpm install` ele falha alto — nunca "tudo certo" por engano |
| Heurística da C8 (PascalCase = componente): uma constante em PascalCase passaria | Convenção do projeto: constante em CAIXA_ALTA, componente em PascalCase. Aceito |
| Os 8 `eslint-disable` virarem permanentes | HIS-109 no backlog; `reportUnusedDisableDirectives` acusa quando sobrarem |
| CI mais lento: ~35 s → ~4 min | Jobs em paralelo; execução velha do PR cancelada |

### D15. Como verificar (qa e seguranca)

```bash
pnpm lint && pnpm typecheck && pnpm test            # inclui os casos negativos (node --test)
pnpm build && PORTA_E2E=31xx pnpm test:e2e           # numa cópia própria; depois fuser -k 31xx/tcp
pnpm audit --audit-level high
```

- Critério 7: rodar `pnpm test:camadas` e ler o resumo "N casos"; conferir na tabela que cada origem obrigatória está lá.
- Critério 4: o artefato do commit descartável do A6 tem `playwright-report/index.html`, captura e `trace.zip`.
- Critério 6: o mesmo `pnpm test:e2e` no ambiente de nuvem e no CI → mesma lista de testes, mesmo resultado.
- Critério 9: plantar 2 KB num componente de `/sobre` numa cópia → o teste de peso falha com a tabela; tirar → passa.

## Perguntas abertas

- [x] `[para: tech-lead]` O e2e roda em todo push ou só em pull request e no `main`? (custo de tempo do CI)
  — _(scrum-master: responder no desenho técnico definitivo, etapa 3; bloqueia a implementação, não o desenho.
  Restrição de produto: continuar dentro dos minutos gratuitos do GitHub Actions — repositório público, sem limite —
  e o PR não pode ser integrado sem o e2e verde.)_
  — **Resposta (tech-lead, 2026-10-29):** em **todo `pull_request`** (abrir, cada push na branch do PR, reabrir) e em
  **todo push no `main`** (depois de integrar), mais `workflow_dispatch` para rodar à mão. Push em branch sem PR não
  roda CI (como hoje): o trabalho da equipe chega ao `main` só por PR. **Custo de tempo:** hoje uma execução leva
  ~35 s (as 6 últimas no Actions: 26–39 s). Depois: job `verificar` ~1 min (lint ~15 s, casos de camadas ~5–10 s) e,
  **em paralelo**, job `e2e` ~3–4 min (instalar ~20 s, Chromium com dependências 30–60 s, build 20–30 s, ~45 testes em 2
  workers 1,5–2,5 min). Tempo de parede de um PR: **~4 min**. Repositório público: minutos sem limite (mesmo se fosse
  privado, ~5 min por execução caberia nos 2 000 min/mês gratuitos com folga). Sem filtro por caminho (`paths`): com o
  check obrigatório, um PR só de documentos ficaria preso em "esperando". Para o PR não ser integrado sem e2e verde, o
  dono do projeto marca os dois checks como obrigatórios na proteção do `main` (D11).
- [ ] `[para: scrum-master]` (tech-lead, 2026-10-29 — **bloqueia o início**) (1) Quebrar em HIS-002a (critérios 2, 3, 4,
  6, 9) e HIS-002b (1, 5, 7, 8 + T1), como no D12? (2) Número da dívida nova "efeitos que copiam estado" (8
  `eslint-disable` do D4 citam o ID; propus HIS-109). (3) Para onde vai a exceção de contraste da `/` (D10): HIS-102 ou
  história nova da E1, com a ux.
- [ ] `[para: ux-acessibilidade]` (tech-lead, 2026-10-29 — bloqueia o passo A5, não o início) Texto do nome acessível
  dos 5 botões da casa ilustrada da `/`, para incluir a porcentagem que aparece (hoje `aria-label="Quarto: R$ 21,74 por
  mês"` e a tela mostra também "19%"; axe `label-content-name-mismatch`). E revisar a lista de exceções do axe quando o
  qa a montar.
- [ ] `[para: seguranca]` (scrum-master, 2026-10-29 — **bloqueia a implementação (etapa 4)**, não o desenho) O critério 7
  cita "os 21 extras da seguranca" da HIS-001, mas eles só estão descritos em parte (linha R13 da revisão) e o roteiro
  `testar-seg.mjs` está no scratchpad, que não é guardado. Liste aqui, na sua análise de ameaças da etapa 3, cada um
  dos 21 casos (texto do import de exemplo + regra esperada), para o critério 7 ser verificável pelo qa sem depender de
  arquivo fora do repositório.

## Conversa da equipe

### [scrum-master] 2026-10-29 — história refinada
- O que fiz: critérios de aceite e páginas cobertas.
- Para o próximo (qa + tech-lead): escolher a estrutura dos testes e responder a pergunta aberta. Depende da HIS-001 só nas regras de import.

### [scrum-master] 2026-10-29 — preparação revista depois da HIS-001: continua "Preparada", com os critérios 7–9
- O que fiz: conferi a Definição de Preparado com os critérios 7–9 que o tech-lead trouxe da HIS-001.
  - Problema e valor: ok. Fora do escopo: ok, ampliado (HIS-107/HIS-108 e mudança visível).
  - Critérios verificáveis: 1–9 ok, com dois esclarecimentos meus — **critério 3** (o que fazer com violação do axe que
    exige mudança visível: exceção nomeada com ID de história, nunca desligar a regra) e **critério 9** (quais
    verificações do `e2e-base` o e2e precisa cobrir para ele sair; pixels/DOM ficam fora). O critério 7 depende de os 21
    casos extras da seguranca estarem escritos na história (pergunta aberta `[para: seguranca]`).
  - Regras de energia: não há números; `dominio-energia` não participa. UX: não há tela nova; a `ux-acessibilidade`
    só revisa a lista de exceções do axe, se existir.
  - Dependências: HIS-001 em "Pronto"; a `his-002-qualidade` deve partir do `main` **depois** da integração da
    `his-001-camadas`. Dependências novas (`eslint`, `eslint-config-next`, `@playwright/test`, `@axe-core/playwright`)
    passam pela seguranca (versão exata, `pnpm audit`).
- Decisões e porquê: **continua "Preparada"**. As duas perguntas abertas são respondidas na etapa 3, pelos papéis que já
  atuam nela, e bloqueiam só a implementação. Tamanho: continua **M**, mas é o limite — os critérios 7–9 somam trabalho;
  se o desenho passar de 3 dias, o tech-lead propõe quebrar (sugestão: 7–8, camadas e S2, numa HIS-002b).
- Para o próximo: **tech-lead** — desenho técnico definitivo (estrutura de `apps/web/e2e/`, `eslint.config.mjs` com a
  divisão ESLint × script, referência de peso, quando o e2e roda, destino do `e2e-base`), com o **qa** na estrutura dos
  testes. **seguranca**, em paralelo — análise de ameaças (CI, dependências novas, artefatos do job sem dado de pessoa) e
  a lista dos 21 casos.

### [tech-lead] 2026-10-29 — desenho técnico definitivo (etapa 3); pergunta respondida; proposta de quebra em 002a/002b
- O que fiz: li a história inteira, o ADR-001, a retro, o `verificar-camadas.mjs`, o `linha-de-base.cjs`, o `ci.yml`, o
  `apps/web/src` e a doc do Next 16 sobre ESLint. Numa **cópia própria** (`scratchpad/tl-his002/copia`, porta 3111)
  instalei as dependências e testei de verdade: ESLint 10 com a configuração completa (82 arquivos, 42 casos negativos
  de ensaio por `lintText`), três opções para a ordem dos imports, Playwright + axe nas 7 páginas, build e um protótipo
  da regra S2 com o parser do TypeScript. Escrevi o "Desenho técnico definitivo" (D1–D15), respondi a pergunta aberta,
  abri duas perguntas novas, criei o ADR-003 e anotei a decisão no ADR-001.
- Decisões e porquê:
  - **ESLint 10.13.0 + `eslint-config-next` 16.4.3** na raiz; os avisos de par dos plugins não impedem (medido).
  - **T1 com `eslint-plugin-import-x` 4.17.1**: o `import/order` 2.32.0 quebra no ESLint 10 e o `simple-import-sort` cola
    vírgulas sem Prettier (medido).
  - **`@playwright/test` 1.63.0** (não 1.64): é o que casa com o Chromium do ambiente; aqui não dá para baixar navegador.
  - Script de camadas lê imports com o parser do `typescript` (já instalado): a S2 precisa dos nomes importados.
    `import()` dinâmico proibido até haver regra (o ESLint não o confere).
  - e2e em todo PR e push no `main`; ~4 min de parede; sem cache do navegador (recomendação do Playwright, gatilho para
    rever no D11). Artefato em toda execução não cancelada.
  - `e2e-base` sai inteiro no fim da 002a (o histórico do git guarda o comparador).
  - ≈ 4 dias → proposta de quebra: **HIS-002a** (2, 3, 4, 6, 9) primeiro, sem bloqueio; **HIS-002b** (1, 5, 7, 8 + T1)
    depois, porque depende dos 21 casos da seguranca e usa o e2e e o peso para provar a correção S2.
- Arquivos alterados: esta história (desenho definitivo, perguntas, esta nota; a proposta inicial ganhou uma linha
  dizendo que foi substituída), `docs/equipe/decisoes/ADR-003-qualidade-automatica.md` (novo, "proposto"),
  `docs/equipe/decisoes/ADR-001-camadas.md` (uma frase), `docs/equipe/decisoes/README.md`, `docs/equipe/quadro.md`,
  `docs/equipe/agentes/tech-lead/contexto.md` e `diario.md`. Nenhum código mudou na branch.
- Como verifiquei: `npm view` de cada pacote (versão, pares, motor, data); na cópia: `pnpm exec eslint .` (lista do
  D4), `--fix` duas vezes e `tsc --noEmit` verde depois, `pnpm audit` limpo, `pnpm build` em 17 s, `playwright test`
  com axe em 32 s, protótipo S2 → exatamente as 2 violações do critério 8. Tentativa de baixar o Chromium 1248 → bloqueada.
- Para o próximo: **scrum-master** — decidir a quebra, o número HIS-109 e o destino da exceção de contraste (pergunta
  aberta; bloqueia o início). **seguranca** — análise de ameaças (dependências do D2, ~300 pacotes novos de
  desenvolvimento, `ci.yml` com `permissions: contents: read`, artefatos, avisos de par, `unrs-resolver` sem script) e
  a lista dos 21 casos no formato do D6. **qa** — revisar D6, D9 e D10 (estrutura dos testes, relógio real, o que sai do
  `e2e-base`, lista de exceções) e dizer se concorda com a saída do comparador. **ux-acessibilidade** — texto dos 5
  nomes acessíveis da `/` (antes do passo A5).

# HIS-002b · Lint e camadas automáticos no CI

| Campo | Valor |
| --- | --- |
| Épico | E0 · Fundação |
| Sprint | 0 |
| Tamanho | M (≈ 1,5–2 dias, D12) |
| Papéis principais | tech-lead, frontend, seguranca |
| Status | Preparada (implementação bloqueada: ver "Dependências") |
| Branch | `his-002b-lint-camadas` (sai do `main` **depois** da integração da HIS-002a) |

> **Origem:** dividida da HIS-002 pelo scrum-master em 2026-10-29, a partir da proposta D12 do tech-lead. A outra
> parte é a [HIS-002a · Testes no navegador no CI](HIS-002-qualidade-automatica.md) (o arquivo manteve o nome antigo
> para não quebrar links). Os critérios mantêm a **numeração original da HIS-002** (1, 5, 7, 8) para as referências
> já escritas ("critério 7", "critério 8") continuarem valendo. As seções D4, D5, D6, D7 e a parte "HIS-002b" do D13
> foram **movidas** para cá sem mudança; D1, D2, D3, D11, D12, D14 e D15 valem para as duas e ficam na HIS-002a.

## Problema e valor

Como **equipe**, queremos **que o CI confira sozinho o padrão do código e a regra de camadas, com casos negativos
automáticos** para **nenhuma mudança abrir brecha de segurança (HTML a partir de texto, `any`, import proibido) ou
bagunçar as camadas sem que a gente perceba antes de ir para o ar**.

Hoje as camadas são conferidas por um script com regex, com lacunas conhecidas (S1 da HIS-001), e a regra S2 (valor
importado de módulo `"use client"` por arquivo de servidor) não é conferida por nada. Os 34 + 21 casos negativos da
HIS-001 foram rodados à mão, com roteiros que ficaram no scratchpad.

## Critérios de aceite

_(numeração da HIS-002 mantida)_

1. **Dado** um push ou pull request, **quando** o CI roda, **então** ele executa ESLint (configuração do Next 16) sem erros.
5. Regras de lint incluem: sem `any` explícito, sem `dangerouslySetInnerHTML`, e as restrições de import entre camadas (ADR-001).
7. **Dado** cada caso negativo de camadas da HIS-001 (item 7 da seção 10, R13 e os 21 extras da seguranca) **e** cada
   lacuna da S1 (lista abaixo), **quando** ele é escrito num arquivo de exemplo, **então** `pnpm lint` ou `pnpm camadas`
   falha com a mensagem da regra — conferido por um teste automático no CI (fixtures numa pasta de teste, fora de
   `apps/web/src`), não só à mão. _(tech-lead, vindo da HIS-001)_
8. **Dado** um arquivo sem `"use client"` (componente de servidor ou módulo comum), **quando** ele importa um **valor que
   não é componente** de um módulo `"use client"`, **então** a verificação falha (S2 da HIS-001). As constantes de
   transição (`IR_ADIANTE`, `VOLTAR`, `ENTRAR_NO_PAINEL`) saem de `ui/Movimento.tsx` para `ui/tiposDeTransicao.ts` (sem
   diretiva) e o `novoId` usado por `funcionalidades/cadastro/rascunho.ts` passa a vir de um arquivo sem diretiva
   (ex.: `aplicacao/identificador.ts` reexportando `infraestrutura/identificador.ts`). _(tech-lead, vindo da HIS-001)_
10. **(T1)** **Dado** a regra `import-x/order` ligada, **quando** `pnpm lint --fix` é aplicado, **então** a mudança fica
    num commit **só de formatação**: `git diff -U0 HEAD~1` desse commit tem só linhas de `import` / `export … from` (e a
    linha da configuração), e `pnpm lint` termina com 0 erros e 0 avisos. _(scrum-master, 2026-10-29, a partir do T1 e do
    passo B2)_
11. **Dado** a regra `react-hooks/set-state-in-effect`, **quando** `pnpm lint` roda, **então** ela está ligada para todo o
    site, e as únicas exceções são os 8 `// eslint-disable-next-line react-hooks/set-state-in-effect -- <motivo> (HIS-109)`
    das linhas listadas no D4 — `grep -rn "HIS-109" apps/web/src` mostra exatamente 8 linhas, cada uma com motivo real, e
    nenhum `eslint-disable` de arquivo inteiro ou sem nome de regra. _(scrum-master, 2026-10-29, a partir do D4)_

## Fora do escopo

- Reescrever os 8 efeitos que copiam estado (`react-hooks/set-state-in-effect`): é a **HIS-109** (E1, Sprint 3); aqui
  eles só ganham o `eslint-disable-next-line` com motivo.
- Regra própria para `import()` dinâmico (vem quando precisar, ex.: OCR no E3/E5) e para `"use server"` (E4, com a
  seguranca): aqui os dois ficam **proibidos**.
- Fixar as actions do GitHub por SHA, Dependabot e `pnpm audit` no CI: HIS-003.
- Testes no navegador, axe, peso de JS e artefatos do job: HIS-002a.
- Qualquer mudança visível para quem usa (critério geral da E0).

## Dependências

- **HIS-002a integrada ao `main`** antes da implementação: o passo B6 (correção S2/T3) se confere com o e2e e o peso de
  JS da HIS-002a; e as duas mexem no `package.json` da raiz, no `pnpm-lock.yaml` e no `.github/workflows/ci.yml` (a 002a
  cria o job `e2e` e tira o build do `verificar`; a 002b põe o `pnpm lint` no `verificar`, D11 e B3). Em sequência, sem
  conflito de merge.
- **Lista dos 21 casos da seguranca** escrita nesta história (seção "Ameaças"; pergunta aberta abaixo): bloqueia a
  implementação (critério 7).
- Revisão do D6 pelo **qa** (seção "Plano de testes").
- Desenho comum (D1 decisões, D2 dependências, D3 scripts, D11 CI, D14 riscos, D15 como verificar):
  [HIS-002a](HIS-002-qualidade-automatica.md). Desta história são, no D2, `eslint`, `eslint-config-next`,
  `eslint-plugin-import-x` e `typescript` (raiz); no D3, `lint`, `camadas`, `typecheck` da raiz e `test:camadas`.

## Fluxo e textos

_(ux-acessibilidade)_ Não se aplica: nada muda na tela.

## Desenho técnico

_(tech-lead, 2026-10-29 — seções movidas da HIS-002 sem mudança; a numeração D4–D7 e B1–B8 é a mesma do desenho
original)_

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

_(Nota de remissão do scrum-master: o desenho definitivo revoga duas frases acima — o T1 usa `import-x/order`, não
`import/order` (D1, linha 2), e o script passa a usar o parser do `typescript`, não "Node puro, sem dependência" (D1,
linha 4). Ver D1 na [HIS-002a](HIS-002-qualidade-automatica.md).)_

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

_(scrum-master, 2026-10-29: HIS-109 confirmada — E1, Sprint 3, antes da HIS-301; ver `docs/planejamento.md`.)_

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

### D13 (parte HIS-002b). Ordem dos passos (cada um verde: `pnpm typecheck`, `pnpm test`, `pnpm build` e o que o passo acrescenta)

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

## Ameaças

_(seguranca)_ Análise desta parte: dependências do ESLint (`eslint`, `eslint-config-next`, `eslint-plugin-import-x`,
`typescript` na raiz — D2), avisos de par, `unrs-resolver` sem script de instalação, o script de camadas lendo
arquivos com o parser do `typescript` (sem executar o que lê). **E a lista dos 21 casos** (pergunta aberta abaixo), no
formato do D6.

| Ameaça | Gravidade | Mitigação |
| --- | --- | --- |
| … | … | … |

## Plano de testes

_(qa)_ Revisão do D6 (formato dos casos, controles, origens obrigatórias, resumo "N casos").

## Perguntas abertas

- [ ] `[para: seguranca]` (scrum-master, 2026-10-29 — **bloqueia a implementação (etapa 4)**, não o desenho; movida da
  HIS-002) O critério 7 cita "os 21 extras da seguranca" da HIS-001, mas eles só estão descritos em parte (linha R13 da
  revisão) e o roteiro `testar-seg.mjs` está no scratchpad, que não é guardado. Liste aqui, na sua análise de ameaças
  da etapa 3, cada um dos 21 casos (texto do import de exemplo + regra esperada), para o critério 7 ser verificável
  pelo qa sem depender de arquivo fora do repositório.

## Conversa da equipe

_(As notas da HIS-002 anteriores à divisão — refinamento, preparação revista e o desenho definitivo do tech-lead —
ficam na [HIS-002a](HIS-002-qualidade-automatica.md), "Conversa da equipe", e valem para esta história também.)_

### [scrum-master] 2026-10-29 — história criada pela divisão da HIS-002; Preparada, implementação depois da HIS-002a
- O que fiz: aceitei a quebra proposta no D12; criei este arquivo a partir do modelo, movendo da HIS-002 os critérios 1,
  5, 7 e 8, as "Notas do tech-lead vindas da HIS-001", D4, D5, D6, D7 e a parte HIS-002b do D13, e a pergunta à
  seguranca (21 casos). Acrescentei os critérios 10 (T1) e 11 (os 8 `eslint-disable` da HIS-109), que já estavam no
  desenho mas não eram verificáveis como critério.
- Decisões e porquê: a 002b vem **depois** da 002a — a correção S2 (B6) só se prova com o e2e e o peso da 002a, e as
  duas mexem em `package.json`, lockfile e `ci.yml`; em sequência não há conflito. Numeração dos critérios mantida para
  não quebrar referências. Dívida dos efeitos = **HIS-109** (E1, Sprint 3, antes da HIS-301, que mexe em
  `armazenamento/casa.ts` e `dados-publicos/navegador.ts`).
- Arquivos alterados: este arquivo (novo); `HIS-002-qualidade-automatica.md` (agora HIS-002a, com remissões);
  `docs/planejamento.md`; `docs/equipe/quadro.md`; `docs/equipe/decisoes/ADR-003-qualidade-automatica.md` (uma linha).
- Como verifiquei: conferi que cada trecho movido saiu da HIS-002 e está aqui igual (mesma numeração D/B/C).
- Para o próximo: **seguranca** — "Ameaças" desta história e a lista dos 21 casos no formato do D6 (bloqueia a etapa 4).
  **qa** — revisar o D6 em "Plano de testes". Os dois podem rodar já, em paralelo com o trabalho na HIS-002a (ver
  quadro). **Implementação (etapa 4, frontend com o tech-lead)** só depois da HIS-002a no `main` e da lista dos 21.

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

**Ativos:** as barreiras de camadas e de segurança (são elas que impedem código de servidor no navegador, HTML a partir
de texto e endpoint público por engano), o computador da equipe e o runner (o ESLint **executa** o código dos plugins
e da configuração). **Quem ataca:** pacote da árvore do ESLint comprometido; o próprio time, por atalho ou descuido, ao
contornar uma regra.

**Medido em 2026-10-29 (seguranca)**, na cópia do tech-lead (`scratchpad/tl-his002/copia`, só leitura, sem mudar
nada; roteiros em `scratchpad/seg-his002/`): `pnpm audit --audit-level high` → "No known vulnerabilities found" (400
pacotes); `pnpm-lock.yaml` sem `tarball:`/`git+`/`codeload` (0 linhas); scripts de instalação na árvore inteira: só
`esbuild` (já liberado) e `unrs-resolver` (fica bloqueado; o lint funciona sem ele). Os 21 casos contra o
`eslint.config.mjs` do D4: **20 acusados pelo ESLint**; o `seguranca-15` passa no ESLint e é do script (C7, acusado pelo
script atual). Sondas extras: os 4 comentários de desligar regra **passam** (Ab3), 3 pastas do site com nome comum ficam
**fora do lint** (Ab4), 4 formas de HTML a partir de texto **passam** (Ab6); com as propostas abaixo aplicadas por
`overrideConfig`, todas acusam e o código atual continua com 0 achados novos; o ESLint lê 64 arquivos nas duas pastas,
igual ao `git ls-files` das 8 extensões.

| # | Ameaça | Gravidade | Mitigação |
| --- | --- | --- | --- |
| Ab1 | Pacote malicioso ou sequestrado na árvore do ESLint (~300 pacotes): o `eslint .` carrega e executa os plugins no computador da equipe e no runner | médio (impacto alto, chance baixa) | Versão exata dos 4 pacotes; lockfile com `integrity`; `--frozen-lockfile`; `pnpm audit` limpo (medido); sem origem fora do registro (medido); job `verificar` com token só de leitura e `persist-credentials: false` (Aa6 da HIS-002a). `eslint-plugin-import` 2.32.0 (sem versão desde 2025-06) continua na árvore porque vem do `eslint-config-next` oficial — aceito; a regra de ordem usa o `import-x`, mantido |
| Ab2 | Script de instalação do `unrs-resolver` liberado depois "para tirar o aviso" | baixo | `onlyBuiltDependencies` continua só `esbuild`, `sharp` (medido: o lint roda sem o script). Liberar exige nota da seguranca |
| Ab3 | **Barreira desligada por comentário:** `// eslint-disable-next-line no-restricted-imports`, `/* eslint-disable */` e `/* eslint no-restricted-imports: "off" */` derrubam a matriz de camadas; `// eslint-disable-next-line no-restricted-syntax` libera `innerHTML` e `"use server"`. Uma linha num diff de 20 arquivos, fácil de passar na revisão. Com a matriz saindo do script (D5), não sobra segunda barreira | **médio** | Regra nova no script, **C10**: em `apps/web/src` e `packages/core/src`, qualquer comentário com `eslint-disable`, `eslint-enable`, `eslint ` de configuração (`/* eslint regra: … */`), `global` ou `exported` é erro, **exceto** exatamente `// eslint-disable-next-line react-hooks/set-state-in-effect -- <motivo> (HIS-109)` (o critério 11). Lido nos comentários do AST (o parser do TS já está lá). Mensagem: "comentário que muda regra do ESLint não é permitido (só o da HIS-109)". Casos `seguranca-22` a `seguranca-26`. Saída para uma exceção de verdade no futuro: entra na configuração, por arquivo e com motivo, revisada |
| Ab4 | **Pasta do site fora do lint:** o `globalIgnores` do D4 usa `**/build/**`, `**/out/**`, `**/test-results/**`, `**/playwright-report/**` — medido: `apps/web/src/app/build/page.tsx`, `apps/web/src/ui/out/T.ts` e `apps/web/src/funcionalidades/dicas/test-results/T.ts` são **ignorados**: nenhuma regra (camadas, `innerHTML`, `"use server"`) e, depois do D5, nem o script confere a matriz | **médio** | Ancorar os ignores no que é gerado: `apps/web/.next/**`, `apps/web/out/**`, `apps/web/playwright-report/**`, `apps/web/test-results/**`, `**/node_modules/**`, `**/next-env.d.ts` (e o `dist` de pacote, se existir, com caminho). **Controle novo do D6:** o número de arquivos que o ESLint de fato lint-a nas duas pastas (`lintFiles`, resultados sem o aviso "File ignored") é igual ao `git ls-files` das 8 extensões (hoje 64 = 64, medido). Caso `seguranca-27` |
| Ab5 | Arquivo fora de qualquer bloco de camada (na raiz de `src`, solto em `funcionalidades/`, pasta nova como `lib/`): o ESLint não tem matriz para ele (medido: passa) | baixo | Coberto pelo script, C1/C2 (medido: o script atual acusa os 3). C1 e C2 **não podem sair** do script; caso `seguranca-30` |
| Ab6 | HTML a partir de texto por caminhos fora da lista do D4: `setHTMLUnsafe`, `Document.parseHTMLUnsafe`, `createContextualFragment`, `iframe.srcdoc = …` e `<iframe srcDoc={…}>` (medido: os 4 passam). Também `href="javascript:…"` e `target="_blank"` sem `rel` | baixo (precisa ser escrito de propósito; o React escapa o resto) | Recomendado nesta história, custa 3 seletores e 2 regras (bloco abaixo; medido: acusam, 0 achados no código atual). Casos `seguranca-28` e `seguranca-29` |
| Ab7 | `process.getBuiltinModule` por nome calculado (`process[n]` com `n` montado em pedaços) — medido: passa | baixo, aceito | Exige ofuscação deliberada, que a revisão pega; no navegador a função não existe. Sem regra nova |
| Ab8 | O script de camadas executar ou seguir o que lê (ele roda em todo `pnpm typecheck` e no CI) | médio se acontecer | Só `ts.createSourceFile` (nunca `createProgram`, `require`/`import()` do arquivo lido, `tsconfig` nem plugins do TS); `lstat`/`Dirent.isSymbolicLink()` **antes** de ler → C4 erro; sem rede, sem escrita, sem `child_process`; `--raiz` só para os testes; continua falhando com código 1 sem ter lido arquivos (C3) |
| Ab9 | O teste dos casos (`camadas.test.mjs`) usa `execFileSync` e apaga pastas: apagar fora do `mkdtemp` ou rodar comando de shell | baixo | `execFileSync(process.execPath, [script, "--raiz=" + tmp])`, sem `shell`; `mkdtemp(join(os.tmpdir(), "camadas-"))`; antes do `rm`, conferir que o caminho começa com esse prefixo; links da C4 apontam para dentro do `tmp`. A exceção à decisão "sem `child_process`" vale **só** para o arquivo de teste, nunca para o verificador |
| Ab10 | Caso negativo apagado ou afrouxado sem ninguém ver | baixo | O teste confere uma **lista fixa de IDs obrigatórios** (não só a origem): `seguranca-01` a `seguranca-30` (com `14b`), S1-a a S1-g, C1 a C10, R13 e os do item 7; falta de um = erro com o ID. Mudança em `eslint.config.mjs`, `scripts/verificar-camadas.mjs` ou `scripts/testes/**` passa pela seguranca até a HIS-003 pôr `CODEOWNERS` |
| Ab11 | Configuração dependente da pasta atual: `readFileSync("apps/web/package.json")` e `readdirSync("apps/web/src/funcionalidades")` — medido: `ENOENT` quando o ESLint roda com `cwd` ≠ raiz | baixo (falha alta, não silenciosa) | Montar os caminhos com `import.meta.dirname` (o D6 já pede o mesmo do script, controle 4) |
| Ab12 | Arquivo que não faz parse: `createSourceFile` não lança erro e o script pode não ver um import | baixo | O `pnpm lint` reprova erro de parse (ESLint e script rodam no mesmo job); caso no D6: arquivo com sintaxe quebrada → `pnpm lint` falha |
| Ab13 | `"use server"` escapando da regra | baixo | Medido: acusa no topo do arquivo, com aspas simples, dentro de função comum e de arrow function e em `.servidor.ts`. `"use server"` depois de um `import` não é diretiva (o Next ignora) — não é brecha. Regra própria no E4 |
| Ab14 | C8 (PascalCase = componente) deixar passar uma constante em PascalCase | baixo, aceito | É erro de funcionamento (valor vira referência de cliente), não vazamento; convenção do projeto (D14) |

Nenhuma ameaça crítica ou alta. **Ab3 e Ab4 (médio)** entram nesta história: são elas que fazem a barreira valer
depois que a matriz sai do script. Se o tech-lead preferir outra forma (ex.: `@eslint-community/eslint-plugin-eslint-comments`
com `no-restricted-disable`), serve, desde que os casos `seguranca-22` a `seguranca-27` acusem.

**Proposta para o `SINTAXE_PROIBIDA` e o bloco `projeto/qualidade` (Ab6, medido):**

```js
// Em SINTAXE_PROIBIDA (as duas linhas atuais de innerHTML e insertAdjacentHTML continuam):
{ selector: "CallExpression[callee.property.name=/^(setHTMLUnsafe|parseHTMLUnsafe|createContextualFragment)$/]", message: "Proibido inserir HTML a partir de texto (CLAUDE.md, Segurança)." },
{ selector: "AssignmentExpression > MemberExpression.left[property.name='srcdoc']", message: "Proibido srcdoc: é HTML a partir de texto (CLAUDE.md, Segurança)." },
{ selector: "JSXAttribute[name.name='srcDoc']", message: "Proibido srcDoc: é HTML a partir de texto (CLAUDE.md, Segurança)." },
// Em projeto/qualidade:
"react/jsx-no-script-url": "error",
"react/jsx-no-target-blank": ["error", { allowReferrer: false }],
```

### Os 21 casos da seguranca (resposta da pergunta aberta; critério 7)

Origem: `testar-seg.mjs` da HIS-001 (etapa 6, R12/R13). Todos com `origem: "seguranca-NN"` no formato do D6. "Na
HIS-001" é o resultado com o script de regex de então (10 "BRECHA" = S1). "Esperado" é o que a tabela do D6 confere:
regra + trecho da mensagem (do `eslint.config.mjs` do D4 e do D5). **Medido:** com o D4, os 20 casos de ESLint acusam
com exatamente essa regra e esse trecho; o `seguranca-15` é acusado pelo script atual com a mensagem da C7. Nos casos
de ESLint o arquivo não precisa existir (`lintText` com `filePath`).

| ID | Arquivo do caso | Código de exemplo | Barreira | Esperado (regra · trecho da mensagem) | Na HIS-001 |
| --- | --- | --- | --- | --- | --- |
| seguranca-01 | `apps/web/src/ui/T.ts` | `export const m = () => import( "@/ui/Botao" );` | ESLint | `no-restricted-syntax` · "import() dinâmico ainda não é permitido" | ok (controle: não acusava) — **expectativa muda**, ver abaixo |
| seguranca-02 | `apps/web/src/ui/T.ts` | `export const m = () => import(\n  "@/infraestrutura/armazenamento/casa"\n);` | ESLint | `no-restricted-syntax` · "import() dinâmico ainda não é permitido" | ok |
| seguranca-03 | `apps/web/src/ui/T.ts` | `const x = "b";\nexport const m = () => import("@/ui/" + x);` | ESLint | `no-restricted-syntax` · "import() dinâmico ainda não é permitido" | ok |
| seguranca-04 | `apps/web/src/ui/T.ts` | ``export const m = () => import(`@/infraestrutura/armazenamento/casa`);`` | ESLint | `no-restricted-syntax` · "import() dinâmico ainda não é permitido" | ok |
| seguranca-05 | `apps/web/src/ui/T.ts` | `export const m = () => import('@/ui/' + "x");` | ESLint | `no-restricted-syntax` · "import() dinâmico ainda não é permitido" | ok |
| seguranca-06 | `apps/web/src/ui/T.ts` | `const x = 'a';\nexport const m = () => import  (x);` | ESLint | `no-restricted-syntax` · "import() dinâmico ainda não é permitido" | ok |
| seguranca-07 | `apps/web/src/ui/T.ts` | `const x = 'a';\nexport const m = () => import(/* c */ x);` | ESLint | `no-restricted-syntax` · "import() dinâmico ainda não é permitido" | ok |
| seguranca-08 | `apps/web/src/ui/T.ts` | `export const m = () => import /* c */ ("@/infraestrutura/armazenamento/casa");` | ESLint | `no-restricted-syntax` · "import() dinâmico ainda não é permitido" | BRECHA (S1-b) |
| seguranca-09 | `apps/web/src/ui/T.ts` | `export * from "@/aplicacao/casa";` | ESLint | `no-restricted-imports` · "ui só importa @/ui, @/config e @ee/core" | ok |
| seguranca-10 | `apps/web/src/ui/T.ts` | `import {useCasa} from"@/aplicacao/casa";\nexport const a = useCasa;` | ESLint | `no-restricted-imports` · "ui só importa" | BRECHA (S1-a) |
| seguranca-11 | `apps/web/src/ui/T.ts` | `import"@/aplicacao/casa";` | ESLint | `no-restricted-imports` · "ui só importa" | BRECHA (S1-a) |
| seguranca-12 | `apps/web/src/ui/T.ts` | `import x = require("@/aplicacao/casa");\nexport const a = x;` | ESLint | `no-restricted-syntax` · "Use import ... from" (também acusam `no-restricted-imports` e `@typescript-eslint/no-require-imports`) | ok |
| seguranca-13 | `apps/web/src/funcionalidades/dicas/T.ts` | `import { useCasa } from "@/aplicacao/../infraestrutura/armazenamento/casa";\nexport const a = useCasa;` | ESLint | `no-restricted-imports` · "Sem '..' no caminho" | ok |
| seguranca-14 | `apps/web/src/funcionalidades/dicas/T.tsx` | `"use client";\nimport { carregarNumerosDoInicio } from "@/aplicacao/numeros-do-inicio.servidor?x";\nexport const a = carregarNumerosDoInicio;` | ESLint | `no-restricted-imports` · "Sem sufixo ? ou #" | BRECHA (S1-e) |
| seguranca-14b | igual ao 14 | igual ao 14 | script | código 1 · "destino não encontrado" (C9) ou a mensagem da C7 | — (novo: é o caso grave, servidor no cliente, e não fica com uma barreira só) |
| seguranca-15 | `apps/web/src/aplicacao/T.ts` | `"use client";\nexport { carregarNumerosDoInicio } from "./numeros-do-inicio.servidor";` | script | código 1 · `arquivo com "use client" não pode importar código só de servidor` (C7) | ok |
| seguranca-16 | `apps/web/src/ui/T.ts` | `export const ler = () => process.getBuiltinModule("node:fs").readFileSync("/etc/passwd", "utf8");` | ESLint | `no-restricted-syntax` · "process.getBuiltinModule fura a regra dos módulos do Node" | BRECHA (S1-f) |
| seguranca-17 | `apps/web/src/ui/T.js` | `import { useCasa } from "@/aplicacao/casa";\nexport const a = useCasa;` | ESLint (e o script conta o arquivo: C5) | `no-restricted-imports` · "ui só importa" | BRECHA (S1-c) |
| seguranca-18 | `apps/web/src/funcionalidades/dicas/T.jsx` | `import fs from "node:fs";\nexport const a = fs;` | ESLint (e C5) | `no-restricted-imports` · "Módulo do Node só em infraestrutura/**/*.servidor.ts" | BRECHA (S1-c) |
| seguranca-19 | `packages/core/src/ruim.tsx` | `import { useState } from "react";\nexport const a = useState;` | ESLint (e C5) | `no-restricted-imports` · "O domínio (@ee/core) só importa arquivos dele mesmo" | BRECHA (S1-c) |
| seguranca-20 | `apps/web/src/ui/T.ts` | `import { useCasa } from "/home/exemplo/apps/web/src/infraestrutura/armazenamento/casa";\nexport const a = useCasa;` | ESLint | `no-restricted-imports` · "Sem caminho absoluto no import" | BRECHA (S1-e) |
| seguranca-21 | `apps/web/src/funcionalidades/dicas/acoes.ts` | `"use server";\nexport async function salvar() {}` | ESLint | `no-restricted-syntax` · `"use server" cria um endpoint POST público` | BRECHA (S1-g) |

(`\n` = quebra de linha no arquivo do caso. No `seguranca-20` o caminho absoluto é fixo, não o do repositório: o caso
não pode depender de onde a cópia está.)

**Expectativa que muda:** na HIS-001 o `seguranca-01` era um **controle** (o `import(` com espaço e texto fixo não
podia acusar). Com o `import()` dinâmico proibido (ADR-003, decisão 2) ele passa a acusar. O papel de controle fica com
o **`controle-seguranca-01`**: `apps/web/src/ui/T.ts` com `import { Botao } from "@/ui/Botao";\nexport const a = Botao;`
→ ESLint com 0 erros (medido). Quando o `import()` for liberado (OCR), os 8 casos de `import()` voltam a esperar a
regra de camada, não a proibição.

**Casos novos desta análise** (mesmo formato; obrigatórios junto com a mitigação de Ab3, Ab4, Ab5 e Ab6):

| ID | Arquivo do caso | Código de exemplo | Barreira | Esperado |
| --- | --- | --- | --- | --- |
| seguranca-22 | `apps/web/src/ui/T.ts` | `// eslint-disable-next-line no-restricted-imports\nimport { useCasa } from "@/infraestrutura/armazenamento/casa";\nexport const a = useCasa;` | script (C10) | código 1 · "comentário que muda regra do ESLint" |
| seguranca-23 | `apps/web/src/ui/T.ts` | `/* eslint-disable */\nexport const a = 1;` | script (C10) | código 1 · idem |
| seguranca-24 | `apps/web/src/ui/T.ts` | `/* eslint no-restricted-imports: "off" */\nexport const a = 1;` | script (C10) | código 1 · idem |
| seguranca-25 | `apps/web/src/ui/T.ts` | `export function f(e: HTMLElement, t: string) {\n  // eslint-disable-next-line no-restricted-syntax\n  e.innerHTML = t;\n}` | script (C10) | código 1 · idem |
| seguranca-26 | `apps/web/src/ui/T.ts` | `// eslint-disable-next-line react-hooks/set-state-in-effect\nexport const a = 1;` (sem motivo nem HIS-109) | script (C10) | código 1 · idem. **Controle:** a mesma linha com `-- lê ?visao da URL só depois da hidratação (HIS-109)` → 0 |
| seguranca-27 | `apps/web/src/ui/out/T.ts` | `import { useCasa } from "@/infraestrutura/armazenamento/casa";\nexport const a = useCasa;` | ESLint | `no-restricted-imports` · "ui só importa" (hoje: arquivo ignorado) |
| seguranca-28 | `apps/web/src/ui/T.ts` | `export function f(e: Element, t: string) { e.setHTMLUnsafe(t); }` (e uma variação com `document.createRange().createContextualFragment(t)`) | ESLint | `no-restricted-syntax` · "Proibido inserir HTML a partir de texto" |
| seguranca-29 | `apps/web/src/ui/T.tsx` | `export function F({ t }: { t: string }) { return <iframe title="x" srcDoc={t} />; }` (e `e.srcdoc = t` num `.ts`) | ESLint | `no-restricted-syntax` · "Proibido srcDoc" / "Proibido srcdoc" |
| seguranca-30 | `apps/web/src/T.ts`, `apps/web/src/funcionalidades/T.ts`, `apps/web/src/lib/T.ts` (3 casos) | `export const a = 1;` | script (C2; C1 no `lib/`) | código 1 · "arquivo fora das camadas" / "pasta antiga ainda existe" |

### Conferência da etapa 6 (Rb1–Rb9, seguranca)

| # | Conferência | Esperado |
| --- | --- | --- |
| Rb1 | `pnpm audit --audit-level high`; `grep -nE 'tarball:\|git\+\|codeload' pnpm-lock.yaml`; `onlyBuiltDependencies` | limpo; vazio; `esbuild`, `sharp` |
| Rb2 | Versões no `package.json` da raiz | `eslint` 10.13.0, `eslint-config-next` 16.4.3, `eslint-plugin-import-x` 4.17.1, `typescript` 5.9.3, sem `^`/`~` |
| Rb3 | `pnpm test:camadas` | resumo "N casos" com `seguranca-01` a `seguranca-30`, `14b` e `controle-seguranca-01` presentes e verdes; apagar um ID da tabela → o teste falha citando o ID |
| Rb4 | `grep -rnE "eslint-(disable\|enable)\|/\* *eslint \|/\* *global" apps/web/src packages/core/src` | exatamente as 8 linhas da HIS-109 (critério 11); C10 no script |
| Rb5 | `globalIgnores` do `eslint.config.mjs` | nenhum `**/build/**`, `**/out/**`, `**/test-results/**`, `**/playwright-report/**` solto; controle "arquivos lidos pelo ESLint = `git ls-files`" no D6 |
| Rb6 | `grep -nE "child_process\|createProgram\|import\(\|require\(\|writeFile\|fetch\|node:http" scripts/verificar-camadas.mjs` | vazio (o `import` estático do `typescript` não conta); link simbólico numa cópia → código 1 (C4) |
| Rb7 | `scripts/testes/camadas.test.mjs`: `execFileSync` sem `shell`, `mkdtemp` em `os.tmpdir()`, conferência do prefixo antes do `rm` | presentes |
| Rb8 | Os 21 + novos rodados de novo por mim numa cópia própria, com o roteiro do `scratchpad/seg-his002/` adaptado | 0 diferente do esperado |
| Rb9 | `pnpm lint` com `cwd` = raiz e o mesmo resultado chamando de outra pasta (`node_modules/.bin/eslint -c <raiz>/eslint.config.mjs`) | igual (Ab11) |

## Plano de testes

_(qa)_ Revisão do D6 (formato dos casos, controles, origens obrigatórias, resumo "N casos").

### Revisão do D6 (qa, 2026-10-29): revisado pelo qa, com observações e 3 pontos para o tech-lead

**De acordo:** tabela só de dados + `node:test`, fora de `apps/web/src`, sem pacote novo, dentro do `pnpm test`;
ESLint por `lintText` com a configuração real; script num `mkdtemp` com `--raiz`, código 1 e mensagem no `stderr`; os 4
controles; o resumo "N casos: X no ESLint, Y no script".

**Observações (seguir na implementação; não mudam o contrato):**

- **Gêmeo permitido para cada permissão da matriz.** Como a matriz é "lista do que pode", um regex que proíba tudo
  passaria em todos os negativos. Para cada camada, um controle por item de `permitidos` e por `podeCore`,
  `podeZustand`, `podeNodeNoServidor` e `server-only` em `*.servidor.*` (ex.: `ui` → `@/config/x` passa;
  `infraestrutura/x.servidor.ts` → `node:fs` passa; `ui/x.servidor.ts` → `node:fs` falha). O "um arquivo limpo por
  camada" do D6 não prova as permissões.
- **Funcionalidades com nomes reais.** O `eslint.config.mjs` gera um bloco por pasta que **existe** em
  `funcionalidades/`; um caso `funcionalidades/a` → `funcionalidades/b` não casaria com bloco nenhum. Usar
  `cadastro` → `@/funcionalidades/comodos/…` e `../comodos/…` (o caso falharia, não passaria em silêncio — mas
  pela razão errada).
- **Erro, não aviso:** nos casos do ESLint, exigir `severity: 2` da regra esperada.
- **Controle 1 local:** contar com `git ls-files --cached --others --exclude-standard` (arquivo novo ainda não
  adicionado também é lido pelo script; só `git ls-files` daria diferença falsa no computador de quem desenvolve).
- **Origem "critério 5" e "T1" também obrigatórias:** `any`, `@ts-ignore`, `dangerouslySetInnerHTML`, `innerHTML`,
  `eval`, `new Function` (critério 5, que o D4 já ensaiou mas o D6 não lista como obrigatório) e dois imports fora de
  ordem (`import-x/order`, critério 10). E `reportUnusedDisableDirectives`: um `eslint-disable-next-line` sem nada para
  desligar = erro (critério 11).

### Casos obrigatórios (ids fixos; a lista mora em `casos-de-camadas.mjs`)

| Origem | ids | Verificador |
| --- | --- | --- |
| HIS-001 §10 item 7 + R13 | `I7-01` ui → `@/aplicacao/casa` · `I7-02` funcionalidade → outra por `@/` · `I7-03` … por `../` · `I7-04` funcionalidade → `@/infraestrutura/…` · `I7-05` `require("x")` · `I7-06` ``import(`@/${x}`)`` · `I7-07` `'use client'` depois de comentário importando `.servidor` · `I7-08` `fs` · `I7-09` `node:fs` · `I7-10` `child_process` fora de `.servidor` · `I7-11` `.servidor.ts` sem `server-only` · `I7-12` `zustand` fora de `infraestrutura` · `I7-13` `../../public/dados/tarifas.json` · `I7-14` `src/lib/` recriada · `I7-15` `react` em `packages/core/src` · `R13-01` `import type` em várias linhas · `R13-02` `export { x } from` · `R13-03` `import("@/infraestrutura/…")` literal | ESLint, menos I7-07, I7-11, I7-14 (script) |
| S1 | `S1-a` … `S1-g`, pelo menos um cada (D4 tem a lista ensaiada) | ESLint; `S1-c` e `S1-d` também no script |
| seguranca | `seguranca-01` … `seguranca-21` (quando a lista estiver escrita) | conforme a lista |
| critério 5 | `C5-any`, `C5-ts-ignore`, `C5-dangerously`, `C5-innerHTML`, `C5-eval`, `C5-new-function` | ESLint |
| critério 8 / D5 | `C1` … `C9`; C8 com `VOLTAR`, `novoId`, `import * as`, `export *`, default em minúscula (B7) | script |
| critérios 10 e 11 | `T1-ordem`, `D-sem-uso` (diretiva sem uso) | ESLint |
| controles | `controle-repositorio`, `controle-arvore-minima`, `controle-camada-<nome>`, `controle-outra-pasta`, gêmeos `permite-<camada>-<item>`, C8 `import type` e componente | ambos |

### Testes negativos do próprio verificador (etapa 5, uma vez, numa cópia própria; resultado escrito aqui)

| # | Mutação | Tem que acontecer |
| --- | --- | --- |
| V1 | tirar o bloco `camadas/ui` do `eslint.config.mjs` | `pnpm test:camadas` falha nos casos da `ui`, com o id |
| V2 | trocar o regex de `permitidos` da `ui` por "proíbe tudo" | os gêmeos `permite-ui-*` falham |
| V3 | apagar o caso `I7-13` da tabela | falha "faltando caso obrigatório: I7-13" (P-qa-b1) |
| V4 | tirar a C4 do script (link simbólico volta a ser pulado) | caso C4 falha |
| V5 | o script lê 0 arquivos (pasta errada) | `controle-repositorio` falha |
| V6 | tirar `--max-warnings 0` do `lint` | caso pela linha de comando falha (P-qa-b2) |
| V7 | `typescript` ausente (renomear a pasta na cópia) | `pnpm camadas` sai com erro alto, nunca "tudo certo" |
| V8 | um 9º `eslint-disable-next-line react-hooks/set-state-in-effect` sem motivo | falha (P-qa-b3) |

### Critérios de aprovação (etapa 5)

1. `pnpm lint`, `pnpm typecheck`, `pnpm test` (com `test:camadas`), `pnpm build` verdes; `pnpm audit --audit-level high` limpo.
2. Resumo "N casos: X no ESLint, Y no script" com todos os ids obrigatórios presentes; os 21 da seguranca conferidos
   um a um contra a lista dela.
3. V1–V8 cada uma vermelha com a mensagem certa.
4. Critério 8: `pnpm camadas` verde no repositório depois do B6/B7 e os casos `VOLTAR`/`novoId` acusam no `mkdtemp`.
5. Critério 10: `git diff -U0 HEAD~1` do commit do B2 só com linhas de `import`/`export … from` (e a da configuração).
6. Critério 11: `grep -rn "HIS-109" apps/web/src` com exatamente 8 linhas, cada uma com motivo.
7. B6 sem mudança para quem usa: e2e da HIS-002a verde (inclusive a transição `/sobre` → `/`, P-qa-1 da HIS-002a) e
   peso de JS dentro do limite.

## Perguntas abertas

- [x] `[para: seguranca]` (scrum-master, 2026-10-29 — **bloqueia a implementação (etapa 4)**, não o desenho; movida da
  HIS-002) O critério 7 cita "os 21 extras da seguranca" da HIS-001, mas eles só estão descritos em parte (linha R13 da
  revisão) e o roteiro `testar-seg.mjs` está no scratchpad, que não é guardado. Liste aqui, na sua análise de ameaças
  da etapa 3, cada um dos 21 casos (texto do import de exemplo + regra esperada), para o critério 7 ser verificável
  pelo qa sem depender de arquivo fora do repositório.
  — **Resposta (seguranca, 2026-10-29):** em "Ameaças", subseção "Os 21 casos da seguranca": cada caso com arquivo,
  código, barreira (ESLint ou script) e regra + trecho da mensagem, medidos contra o D4 (20 no ESLint, `seguranca-15`
  no script). Uma expectativa muda (`seguranca-01` deixa de ser controle; entra `controle-seguranca-01`), entra o
  `seguranca-14b` (script) e 9 casos novos (`seguranca-22` a `30`) ligados às ameaças Ab3–Ab6. Sobre a **P-qa-b3** do
  qa: serve como a C10 da Ab3 **só se for mais estrita** — aceitar `eslint-disable-next-line <qualquer regra> --
  <motivo>` ainda deixa desligar `no-restricted-imports` e `no-restricted-syntax`; a única forma permitida é a da
  HIS-109 (`react-hooks/set-state-in-effect`). A P-qa-b1 (ids obrigatórios) é a mitigação da Ab10: de acordo.
- [ ] `[para: tech-lead]` (qa, 2026-10-29 — entra no B4; não bloqueia o desenho) Três ajustes no contrato do D6:
  1. **P-qa-b1 · Ids obrigatórios, não só origens.** O D6 falha "se faltar alguma origem obrigatória"; apagar um dos
     três casos S1-a passaria. Proposta: `casos-de-camadas.mjs` exporta `OBRIGATORIOS` (lista de ids do "Plano de
     testes") e o teste falha com "faltando caso obrigatório: <id>".
  2. **P-qa-b2 · Um caso pela linha de comando.** O `lintText` não passa pelo `--max-warnings 0`, e as regras do
     `jsx-a11y` são **aviso** no `eslint-config-next`. **Medido** na cópia do tech-lead: `<img src>` sem `alt` por
     `eslint --max-warnings 0 --stdin --stdin-filename apps/web/src/ui/Exemplo.tsx` → 2 avisos e código 1; sem o
     `<img>`, código 0. Proposta: o teste lê os argumentos do script `lint` do `package.json` e roda o ESLint com eles +
     `--stdin` (sem `--cache`) — se alguém tirar o `--max-warnings 0`, o caso falha (V6).
  3. **P-qa-b3 · Critério 11 automático.** Hoje é um `grep` uma vez. Proposta: um teste em `scripts/testes/` lê
     `apps/web/src` e `packages/*/src` e exige que todo `eslint-disable` seja `eslint-disable-next-line <regra> --
     <motivo>` (nada de arquivo inteiro, sem regra ou sem motivo), com caso negativo. Se preferir deixar o `grep`,
     registrar aqui que a forma dos `eslint-disable` só é conferida na revisão.

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

### [qa] 2026-10-29 — D6 revisado pelo qa, com observações; 3 pontos para o tech-lead; plano de testes escrito
- O que fiz: li a história inteira, a HIS-002a (D1–D15), o ADR-003 e o §10/R13 da HIS-001; transformei o item 7 e o
  R13 em ids fixos (`I7-01`…`I7-15`, `R13-01`…`R13-03`) para o critério 7 não depender do scratchpad (retro). Na cópia
  do tech-lead (só leitura, sem `--cache`) conferi que `jsx-a11y/alt-text` é **aviso** e só o `--max-warnings 0` barra.
- Decisões e porquê: **revisado pelo qa, com observações** — formato, `lintText`, `mkdtemp` e controles de acordo.
  Acrescentei: gêmeo permitido para cada permissão da matriz (senão "proíbe tudo" passaria), nomes reais de
  funcionalidade, `severity: 2`, contagem local com arquivos ainda não adicionados, critério 5/T1/diretiva sem uso como
  obrigatórios, e 8 mutações do próprio verificador (V1–V8). Três ajustes de contrato na pergunta `[para: tech-lead]`
  (ids obrigatórios, caso pela linha de comando, critério 11 automático).
- Arquivos alterados: esta história ("Plano de testes", uma pergunta, esta nota). Nenhum código.
- Para o próximo: **tech-lead** — P-qa-b1 a b3. **seguranca** — a lista dos 21 entra como `seguranca-01`…`21`.

### [seguranca] 2026-10-29 — análise de ameaças da HIS-002b e os 21 casos (etapa 3): aprovado para implementar, com Ab3 e Ab4
- O que fiz: li a história, o D4–D7, o plano do qa e o meu roteiro `testar-seg.mjs` da HIS-001 (ainda no scratchpad).
  Rodei os 21 casos e 18 sondas extras contra o `eslint.config.mjs` do D4 na cópia do tech-lead (só leitura,
  `lintText`), o script atual nos casos de estrutura, `pnpm audit` e a varredura de scripts de instalação. Escrevi
  "Ameaças" (Ab1–Ab14), os **21 casos na própria história** (arquivo, código, barreira, regra + mensagem, medidos), 9
  casos novos, a conferência da etapa 6 (Rb1–Rb9) e respondi a pergunta aberta.
- Decisões e porquê: **aprovado para implementar** — nenhuma crítica/alta; árvore do ESLint com audit limpo, sem origem
  fora do registro e com só um script de instalação bloqueado (`unrs-resolver`). Duas médias **entram nesta história**,
  porque sem elas a barreira deixa de valer quando a matriz sai do script: **Ab3** — um comentário `eslint-disable`
  derruba a matriz, o `innerHTML` e o `"use server"` (medido: passam) → C10 no script, só a forma da HIS-109 é aceita;
  **Ab4** — `**/build/**`, `**/out/**`, `**/test-results/**` tiram pastas do site do lint (medido) → ignores ancorados e
  controle "arquivos lidos pelo ESLint = `git ls-files`". Recomendado (baixo): 3 seletores de HTML a partir de texto e
  `jsx-no-script-url`/`jsx-no-target-blank` (Ab6, medido: 0 achados no código atual); caminhos com `import.meta.dirname`
  (Ab11). O `seguranca-01` muda de controle para "acusa" (o `import()` agora é proibido).
- Arquivos alterados: esta história ("Ameaças", resposta da pergunta, esta nota); a HIS-002a; minha pasta. Nenhum código.
- Para o próximo: **tech-lead** — incluir C10 (Ab3), ignores ancorados + controle de contagem (Ab4) e, se aceitar, o
  bloco da Ab6 no contrato do D4/D5/D6; responder a P-qa-b3 junto (a C10 é a forma estrita dela). **qa** — a tabela de
  ids obrigatórios (P-qa-b1) inclui `seguranca-01` a `30`, `14b` e `controle-seguranca-01`. **Etapa 4** liberada pela
  seguranca assim que a HIS-002a estiver no `main`.

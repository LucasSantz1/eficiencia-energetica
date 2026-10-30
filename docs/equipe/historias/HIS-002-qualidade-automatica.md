# HIS-002a · Testes no navegador no CI (e2e, axe, artefatos e peso de JS)

| Campo | Valor |
| --- | --- |
| Épico | E0 · Fundação |
| Sprint | 0 |
| Tamanho | M (≈ 2–2,5 dias, D12) |
| Papéis principais | qa, tech-lead (frontend nas correções do A5) |
| Status | Preparada |
| Branch | `his-002-qualidade` (a branch já existe; continua com o nome antigo) |

> **Dividida em 2026-10-29 (scrum-master, a partir do D12).** Esta é a **HIS-002a**; o arquivo manteve o nome
> `HIS-002-qualidade-automatica.md` para não quebrar links. Os critérios **1, 5, 7 e 8**, o T1, as "Notas do tech-lead
> vindas da HIS-001", as seções **D4, D5, D6, D7**, a parte "HIS-002b" do D13 e a pergunta à seguranca sobre os 21
> casos foram **movidos** para a [HIS-002b · Lint e camadas automáticos no CI](HIS-002b-lint-e-camadas.md). D1, D2, D3,
> D11, D12, D14 e D15 valem para as duas e ficam aqui. **A HIS-002b depende desta** (ver "Dependências").

## Problema e valor

Como **equipe**, queremos **que o CI teste sozinho o fluxo principal, a acessibilidade e o peso das páginas** para
**nenhuma mudança quebrar o site, piorar a acessibilidade ou deixar a página mais pesada para o celular simples sem que
a gente perceba antes de ir para o ar**.

Hoje o CI faz typecheck, testes de unidade e build. Os testes no navegador são feitos à mão, com scripts soltos.

## Critérios de aceite

_(numeração da HIS-002 mantida; 1, 5, 7 e 8 estão na [HIS-002b](HIS-002b-lint-e-camadas.md))_

2. **Dado** o site de produção construído no CI, **quando** os testes Playwright rodam, **então** eles percorrem o fluxo
   cadastro → acompanhamento → cômodos → dicas → minha casa em 390 px e 1280 px, falhando em qualquer erro de console.
3. **Dado** as páginas `/`, `/comecar`, `/casa`, `/casa/comodos`, `/casa/dicas`, `/casa/ajustes` e `/sobre`, **quando** o axe roda,
   **então** não há violação de gravidade séria ou crítica.
   _(scrum-master, 2026-10-29 — escopo: violação encontrada que se corrige **sem mudança visível** (ex.: `aria-*`,
   rótulo, papel) é corrigida nesta história. Violação que exige mudança visível (cor, tamanho, layout) **não** é
   corrigida aqui (a E0 não muda nada para quem usa): vira história na E1 e entra numa lista de exceções no próprio
   teste, cada uma com a regra do axe, a página e o ID da história — nunca desligando a regra inteira. A lista é
   revisada pela `ux-acessibilidade` e aparece no relatório do CI.)_
   _(scrum-master, 2026-10-29 — destino decidido: a violação `color-contrast` da `/` (D10) e qualquer outra
   `color-contrast` que o qa achar no passo A5 vão para a **HIS-110** (E1, primeira da Sprint 1), com `historia:
   "HIS-110"` na lista de exceções. **Não** vão para a HIS-102: ela é um modo que a pessoa liga em Ajustes, e o defeito
   está nas cores padrão, que todo mundo vê.)_
4. **Dado** um teste que falha, **quando** o CI termina, **então** as capturas e o relatório ficam disponíveis como artefato do job.
6. `pnpm test:e2e` roda localmente com o mesmo resultado.
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
- Qualquer mudança visível para quem usa (critério geral da E0); ver a regra de exceções do critério 3. Corrigir o
  contraste da `/`: HIS-110.
- ESLint, matriz de camadas no lint, casos negativos automáticos, correção S2/T3 e ordem dos imports (T1): HIS-002b.

## Dependências

- HIS-001 em "Pronto" e integrada ao `main` (a `his-002-qualidade` parte das pastas novas).
- Etapa 4 (implementação) começa quando a **seguranca** registrar as ameaças desta parte (seção "Ameaças") e o **qa**
  revisar D9 e D10 (seção "Plano de testes"). O texto dos 5 nomes acessíveis da `/` (**ux-acessibilidade**) bloqueia só
  o passo A5.
- Desta história são, no D2, `@playwright/test` e `@axe-core/playwright` (em `apps/web`); no D3, `test:e2e` (raiz e
  `apps/web`), o `typecheck` do `apps/web` com o `e2e/` e o `.gitignore`; no D11, o job `e2e` e a saída do `pnpm build`
  do `verificar` (o `pnpm lint` do `verificar` entra na HIS-002b, passo B3).
- **Ao fechar** (fora do código, para quem orquestra levar ao **dono do projeto**): marcar como obrigatórios na
  proteção do `main`, nas configurações do GitHub, os checks "Lint, tipos e testes" e "Navegador (e2e, axe e peso)"
  (D11). Os dois nomes já existem depois do passo A6; a HIS-002b não muda os nomes, e no fechamento dela o
  scrum-master confere que continuam obrigatórios. Sem isso, o critério "o PR não é integrado sem e2e verde" não vale.

## Fluxo e textos

_(ux-acessibilidade)_ Não há tela nova. Dois pedidos (ver "Perguntas abertas"): o texto dos 5 nomes acessíveis da casa
ilustrada da `/` (antes do passo A5) e a revisão da lista de exceções do axe (`excecoes-axe.ts`) quando o qa a montar.

### Nomes acessíveis dos 5 cômodos da casa ilustrada (passo A5) — ux-acessibilidade, 2026-10-29

**Problema (WCAG 2.5.3, "rótulo no nome"; axe `label-content-name-mismatch`):** cada botão mostra o nome do cômodo e a
porcentagem ("Quarto" e "19%"), mas o `aria-label` só diz "Quarto: R$ 21,74 por mês". Quem usa comando de voz diz o
que vê ("tocar em Quarto 19%") e o celular não acha o botão; quem enxerga pouco e usa leitor de tela ouve uma coisa
diferente da que está escrita.

**Atributo:** continua `aria-label` no `<button>` (`funcionalidades/inicio/CasaIlustrada.tsx`, linha 46). Por quê:
uma troca de atributo só, nada muda na tela, e o texto sai dos mesmos campos (`nome`, `parte`, `valor`) que desenham o
botão — se um número mudar, o nome muda junto. O axe compara o texto visível ("quarto 19", sem pontuação nem símbolo)
com o nome: o nome precisa **começar** com o nome do cômodo seguido da porcentagem, nessa ordem, sem palavra entre os
dois. O valor em R$ fica no nome porque, navegando com Tab, é a única forma de ouvir quanto o cômodo custa sem
apertar; ao apertar, a legenda (`aria-live="polite"`) repete o valor com o aparelho que mais pesa — repetição aceita.

**Modelo para o frontend:**

```tsx
aria-label={`${c.nome}, ${Math.round(c.parte * 100)}% da conta, ${reais(c.valor)} por mês`}
```

**Textos finais (o que o leitor de tela lê; servem de conferência no e2e):**

| Cômodo | Nome acessível |
| --- | --- |
| Quarto | Quarto, 19% da conta, R$ 21,74 por mês |
| Banheiro | Banheiro, 47% da conta, R$ 53,74 por mês |
| Sala | Sala, 11% da conta, R$ 12,82 por mês |
| Cozinha | Cozinha, 18% da conta, R$ 20,36 por mês |
| Lavanderia | Lavanderia, 5% da conta, R$ 5,23 por mês |

(`reais()` põe espaço sem quebra entre "R$" e o número; o seletor do e2e deve usar o nome com expressão regular ou
`exact: false`, não a cadeia literal com espaço comum.)

**O que fica igual:** `aria-pressed` (o leitor diz "pressionado" no cômodo escolhido), a legenda com `aria-live`, os
ícones (o lucide já sai com `aria-hidden`), o foco amarelo-faísca. Nada muda na tela.

**Conferir no A5:** axe sem `label-content-name-mismatch` na `/` nos dois projetos, sem e com casa; no leitor de tela
(NVDA ou TalkBack em português) o primeiro botão soa "Quarto, dezenove por cento da conta, vinte e um reais e
setenta e quatro centavos por mês, botão, não pressionado".

**Fora deste texto (frontend, sem ux):** o `definition-list` da faixa "Tarifa Social" (D10) é estrutura; nenhum texto
muda — o `<p>` do CRAS sai de dentro do `<dl>`, e a tela fica igual (ex.: um `<div>` com as classes de grade do
`<dl>` em volta dos dois); a ordem de leitura continua a mesma.

## Desenho técnico (proposta inicial)

_(tech-lead, 2026-10-29 — substituída pelo "Desenho técnico definitivo" logo abaixo das notas; mantida para histórico.
Mudou: `@playwright/test` 1.63.0 em vez de 1.64 e `import-x/order` em vez de `import/order` — ver D1.)_

- Dependências (versão exata): `eslint` 10, `eslint-config-next` 16.4.3, `@playwright/test` 1.64, `@axe-core/playwright` 4.14.
- Testes em `apps/web/e2e/` com `playwright.config.ts` (projetos `celular` 390×844 e `computador` 1280×900, `webServer` com `next start`).
- No CI: usar o navegador do `@playwright/test` (`playwright install --with-deps chromium` **só no runner do GitHub**;
  no ambiente de nuvem da equipe o Chromium já existe).
- Dados de tarifa vêm de `public/dados` (sem rede externa no teste).

### Notas do tech-lead vindas da HIS-001

_(movidas para a [HIS-002b](HIS-002b-lint-e-camadas.md), "Desenho técnico", em 2026-10-29: divisão ESLint × script,
lacunas S1-a a S1-g, T1 e T3.)_

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

### D4 a D7 — movidas para a HIS-002b

_(scrum-master, 2026-10-29: **D4** `eslint.config.mjs` e achados do lint, **D5** script de camadas depois da HIS-002,
**D6** testes negativos automáticos e **D7** correção S2/T3 estão na [HIS-002b](HIS-002b-lint-e-camadas.md), seção
"Desenho técnico", com a mesma numeração e sem mudança.)_

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
    efeito da animação. _(scrum-master, 2026-10-29: decidido — **HIS-110**, não HIS-102; ver o critério 3.)_
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

**Decisão (scrum-master, 2026-10-29): quebra aceita como proposta.** Esta história é a HIS-002a; a
[HIS-002b](HIS-002b-lint-e-camadas.md) foi criada. Ordem: 002a → 002b, em sequência (a 002b sai do `main` depois da
002a integrada). A preparação da 002b (21 casos, ameaças, revisão do D6) roda **em paralelo** com a 002a.

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

**HIS-002b** — passos B1–B8 movidos para a [HIS-002b](HIS-002b-lint-e-camadas.md) ("D13 (parte HIS-002b)").

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

## Ameaças

_(seguranca)_ Análise desta parte: `@playwright/test` 1.63.0 e `@axe-core/playwright` 4.14.0 (D2), `ci.yml` com dois
jobs e `permissions: contents: read` (D11), `playwright install --with-deps` só no runner, artefato `relatorio-e2e`
(14 dias, só dados inventados), servidor do teste em `127.0.0.1` sem reaproveitar servidor alheio. As ameaças das
dependências do ESLint e os 21 casos ficam na [HIS-002b](HIS-002b-lint-e-camadas.md).

| Ameaça | Gravidade | Mitigação |
| --- | --- | --- |
| … | … | … |

## Plano de testes

_(qa)_ Revisão do D9 (estrutura de `apps/web/e2e/`, relógio real, o que sai do `e2e-base`, comparador) e do D10 (axe,
estados, lista de exceções). O D6 (casos negativos) é revisado na HIS-002b.

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
- [x] `[para: scrum-master]` (tech-lead, 2026-10-29 — **bloqueia o início**) (1) Quebrar em HIS-002a (critérios 2, 3, 4,
  6, 9) e HIS-002b (1, 5, 7, 8 + T1), como no D12? (2) Número da dívida nova "efeitos que copiam estado" (8
  `eslint-disable` do D4 citam o ID; propus HIS-109). (3) Para onde vai a exceção de contraste da `/` (D10): HIS-102 ou
  história nova da E1, com a ux.
  — **Resposta (scrum-master, 2026-10-29):** (1) **Sim**, como no D12: esta é a HIS-002a; a
  [HIS-002b](HIS-002b-lint-e-camadas.md) foi criada, depende desta e entra depois dela. (2) **HIS-109** confirmada:
  "Efeitos que copiam estado", E1, Sprint 3, **antes da HIS-301** (o PWA mexe em `armazenamento/casa.ts` e
  `dados-publicos/navegador.ts`, dois dos 8 lugares), com critério verificável em `docs/planejamento.md`. (3) **História
  nova, HIS-110** "Contraste das cores padrão" (E1, tamanho P, **primeira da Sprint 1**, antes da HIS-107). Não vai
  para a HIS-102 porque ela é um modo opcional em Ajustes e o defeito está no padrão, que todo mundo vê; nem para a
  HIS-107, que é outro problema (rolagem para o lado) e já é M. Porquê da prioridade: texto branco em laranja a 2,85:1
  na página inicial, onde a família vê pela primeira vez quanto cada cômodo pesa na conta — quem enxerga pouco ou usa o
  celular no sol não lê. A HIS-110 pode entrar assim que a HIS-002a estiver no `main`, mesmo com a Sprint 0 aberta, se
  houver frontend e ux livres: é correção de defeito, não função nova.
- [ ] `[para: ux-acessibilidade]` (tech-lead, 2026-10-29 — bloqueia o passo A5, não o início) Texto do nome acessível
  dos 5 botões da casa ilustrada da `/`, para incluir a porcentagem que aparece (hoje `aria-label="Quarto: R$ 21,74 por
  mês"` e a tela mostra também "19%"; axe `label-content-name-mismatch`). E revisar a lista de exceções do axe quando o
  qa a montar.
- `[para: seguranca]` lista dos 21 casos (critério 7) — **movida para a [HIS-002b](HIS-002b-lint-e-camadas.md)**
  (scrum-master, 2026-10-29); bloqueia a implementação da 002b, não a desta.

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

### [scrum-master] 2026-10-29 — quebra aceita (002a/002b), HIS-109 e HIS-110 criadas; continua "Preparada"
- O que fiz: respondi a pergunta `[para: scrum-master]`; retitulei este arquivo como **HIS-002a** (nome do arquivo e
  branch mantidos, para não quebrar links) e criei a [HIS-002b](HIS-002b-lint-e-camadas.md), movendo para lá os
  critérios 1, 5, 7 e 8, as notas do tech-lead vindas da HIS-001, D4–D7, os passos B1–B8 e a pergunta dos 21 casos,
  com remissão em cada lugar. Acrescentei aqui "Dependências", "Fluxo e textos", "Ameaças" e "Plano de testes" (seções
  vazias para cada papel escrever sem pisar no outro). Criei HIS-109 e HIS-110 no planejamento.
- Decisões e porquê:
  - **Quebra:** 4 dias não cabem numa história M; as duas partes entregam valor sozinhas e a 002a não depende da 002b.
    Ordem 002a → 002b porque a correção S2 (B6) se prova com o e2e e o peso, e as duas mexem em `package.json`,
    lockfile e `ci.yml`.
  - **HIS-109** (efeitos que copiam estado): E1, Sprint 3, antes da HIS-301. **HIS-110** (contraste das cores padrão):
    E1, P, primeira da Sprint 1 — defeito de acessibilidade pré-existente na tela mais vista; não é HIS-102 (modo
    opcional) nem HIS-107 (outro problema).
  - **Check obrigatório no `main`:** depende do dono do projeto; registrado em "Dependências" (ao fechar) e no quadro.
- Arquivos alterados: este arquivo; `HIS-002b-lint-e-camadas.md` (novo); `docs/planejamento.md`;
  `docs/equipe/quadro.md`; `docs/equipe/decisoes/ADR-003-qualidade-automatica.md` (linha "Detalhes"); minha pasta.
- Como verifiquei: Definição de Preparado das duas — critérios verificáveis (Dado/Quando/Então ou comando com
  resultado), fora do escopo, dependências registradas, sem números de energia. Conferi com `grep` que D4–D7 e B1–B8 só
  aparecem na HIS-002b e que os links para `HIS-002-qualidade-automatica.md` continuam válidos.
- Para o próximo (podem rodar **em paralelo**, cada um só na sua seção, sempre com edição pontual — nunca reescrevendo
  o arquivo inteiro — e relendo o arquivo antes de pôr a nota na "Conversa da equipe"):
  - **seguranca** — "Ameaças" desta história (Playwright, axe, `ci.yml`, artefato) **e**, na HIS-002b, "Ameaças" +
    lista dos 21 casos no formato do D6.
  - **qa** — "Plano de testes" desta (D9, D10, saída do `e2e-base`) **e** o D6 na HIS-002b.
  - **ux-acessibilidade** — texto dos 5 nomes acessíveis da `/` (resposta na pergunta aberta) e, depois, a lista de
    exceções.
  - Quando seguranca e qa terminarem nesta: **etapa 4 da HIS-002a** (qa nos testes; frontend nas correções do A5).

### [ux-acessibilidade] 2026-10-29 — nomes acessíveis dos 5 cômodos da `/` e correção de cor da HIS-110
- O que fiz: li a história inteira, `CasaIlustrada.tsx`, `PaginaInicial.tsx`, `app/page.tsx`, `ui/Etiqueta.tsx` e os
  tokens do `globals.css`. Escrevi em "Fluxo e textos" o nome acessível final de cada um dos 5 botões, o atributo e o
  modelo para copiar. Calculei o contraste de todas as faixas com branco, tinta e noite (fórmula de luminância da WCAG
  2.2) e deixei a correção da HIS-110 na linha dela em `docs/planejamento.md`.
- Decisões e porquê:
  - **Nome = "Cômodo, NN% da conta, R$ X por mês"**, no `aria-label` montado dos mesmos campos do botão. Começa com o
    que está escrito (exigência da WCAG 2.5.3 e do axe: "quarto 19" seguido, sem palavra no meio); "da conta" diz o
    que a porcentagem quer dizer; o valor em R$ fica para quem navega com Tab. Nada visível muda.
  - **HIS-110: faixa D com texto `text-tinta`** (5,50:1) em vez de branco (2,85:1). Mantém o laranja da etiqueta do
    INMETRO e não cria token. Regra geral: A e E com branco; B, C e D com tinta (contas no planejamento).
- Arquivos alterados: esta história ("Fluxo e textos" e esta nota), `docs/planejamento.md` (linha da HIS-110), minha
  pasta (`contexto.md`, `diario.md`). Nenhum código.
- Para o próximo: **frontend** (passo A5) — trocar o `aria-label` pelo modelo e conferir a tabela; o `definition-list`
  é estrutura, sem texto meu. **qa** — usar os nomes da tabela nos seletores (atenção ao espaço sem quebra depois do
  "R$") e me chamar para revisar `excecoes-axe.ts`. **quem orquestra** — a pergunta `[para: ux-acessibilidade]` está
  respondida em "Fluxo e textos" (não marquei a caixa para não editar fora da minha seção). **scrum-master** — a
  HIS-110 já tem a cor; decidir se a pílula passa a usar `faixaDoPeso` (muda a Lavanderia de A para B).

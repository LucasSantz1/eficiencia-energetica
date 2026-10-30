# HIS-002a · Testes no navegador no CI (e2e, axe, artefatos e peso de JS)

| Campo | Valor |
| --- | --- |
| Épico | E0 · Fundação |
| Sprint | 0 |
| Tamanho | M (≈ 2,75 dias: 2,25 do D12 + 0,5 das revisões do qa; revisto em 2026-10-30, D16) |
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
  o passo A5. _(tech-lead, 2026-10-30: as três estão feitas — seguranca, qa e ux escreveram; as decisões sobre o que eles
  pediram estão no **D16**. Nada mais bloqueia a etapa 4.)_
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

### D-A5-1: nome dos 6 botões do "Quem mais gasta" em `/casa` (ux-acessibilidade, 2026-10-30)

**Problema:** o mesmo da casa ilustrada (WCAG 2.5.3). O axe 4.14 separa o texto visível em palavras (tira pontuação,
"R$", "%" e "×") e exige que essas palavras apareçam **seguidas e na mesma ordem** dentro do nome. Ordem visível no
botão (ordem do código): quantidade, nome, "em" e cômodo, porcentagem, uso, valor da barra. Uma palavra a mais no
meio (ex.: "da conta" logo depois da porcentagem) reprova de novo.

**Atributo:** continua `aria-label` no `<button>` (`PainelAcompanhamento.tsx`, linha 161), montado com **as mesmas
expressões** que desenham o botão. O frontend guarda o nome do cômodo e a porcentagem numa variável só e usa nos dois
lugares, para o nome e a tela nunca mostrarem números diferentes.

**Modelo para o frontend:**

```tsx
const pct = formatarPorcentagem(participacao);
const nomeComodo = comodos.find((c) => c.id === aparelho.comodoId)?.nome;
const quantidade = aparelho.quantidade > 1 ? `${aparelho.quantidade} × ` : "";
// visível primeiro, na mesma ordem; o que só o leitor ouve vem depois
aria-label={`${quantidade}${aparelho.nome} em ${nomeComodo}, ${pct}, ${descreverUso(aparelho)}, ${formatarReais(valorMes)} por mês. É ${pct} da conta. Toque para ajustar.`}
```

**Textos finais (exemplos de conferência):**

| Caso | Nome acessível |
| --- | --- |
| Chuveiro (o do relatório do qa) | Chuveiro elétrico em Banheiro, 41%, 4 banhos de 8 min por dia, R$ 45,12 por mês. É 41% da conta. Toque para ajustar. |
| Quantidade maior que 1 | 3 × Lâmpada LED em Sala, 2%, Ligado 5 horas por dia, R$ 2,10 por mês. É 2% da conta. Toque para ajustar. |
| Geladeira | Geladeira em Cozinha, 18%, Fica ligada o dia todo, R$ 19,80 por mês. É 18% da conta. Toque para ajustar. |

(Os valores das duas últimas linhas são ilustrativos; o e2e confere com o texto visível do próprio botão, não com estes
números. A porcentagem aparece duas vezes de propósito: a primeira é a da tela, a segunda diz o que ela significa.)

**O que fica igual:** nada muda na tela; ícone com `aria-hidden`; a folha de ajuste abre do mesmo jeito.

### D-A5-2: tabela do "Painel geral" que rola para o lado (ux-acessibilidade, 2026-10-30)

**Problema (WCAG 2.1.1, teclado; axe `scrollable-region-focusable`):** em 390 px a tabela (`min-w-[34rem]`) passa da
tela; quem usa teclado não consegue rolar até "kWh/mês" e "R$/mês".

**Correção no `div.overflow-x-auto` (`TelaComodos.tsx`, linha 264), sem mudança visível:**

| Atributo | Valor | Por quê |
| --- | --- | --- |
| `role` | `"region"` | o leitor anuncia uma área com nome ao chegar nela |
| `aria-label` | `"Tabela com todos os aparelhos da casa"` | curto; o `<caption>` continua e completa ("juntando os iguais de todos os cômodos") |
| `tabIndex` | `{0}` | entra na ordem do Tab logo depois dos 3 números e antes do que vem depois da tabela; com o foco nela, as setas ← e → rolam |

- **Sempre** `tabIndex={0}`, também em 1280 px (sem rolagem lá): uma parada de Tab a mais é melhor que código para medir
  a largura. Não usar `aria-describedby` com instrução de setas: o nome fica curto.
- **Foco:** o contorno padrão do `:focus-visible` do `globals.css`, que só aparece com teclado (tocar ou clicar não
  mostra nada). Não pôr `outline-none` nem estilo próprio.
- **Ordem de leitura:** igual à de hoje (números, região, legenda da tabela, cabeçalhos, linhas).

**Conferir no A5:** axe sem `label-content-name-mismatch` em `/casa` com casa e sem `scrollable-region-focusable` em
`/casa/comodos?visao=geral`, nos 2 projetos; no celular, Tab até a tabela e → mostra a coluna "R$/mês"; o NVDA lê
"Tabela com todos os aparelhos da casa, região" e depois a tabela.

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
      teste.ts                 test/expect com a fixture automática "console, página e rede sem erro" (D16, Aa11)
      casa.ts                  CHAVE_CASA, semearCasa(contexto, fixture), casaSalva(página)
      axe.ts                   aplicarExcecoes(violacoes, excecoes, ...) — função pura (D16, P-qa-6/P-qa-7)
      peso.ts                  compararPeso(referencia, medido) e os limites como constantes — função pura (D16)
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
    teclado.spec.ts            P-qa-2 (2 projetos)
    comodos.spec.ts            P-qa-3 (2 projetos)
    sanidade.spec.ts           N1–N8: cada barreira reprova o que deve (P-qa-6; só celular)
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
    alvo: string;                       // seletor CSS que casa com EXATAMENTE 1 elemento da página (D16, P-qa-7 + Aa14)
    historia: `HIS-${number}`;          // história da E1 que corrige; tem que existir em docs/planejamento.md
    motivo: string;
  }
  export const EXCECOES_AXE: readonly ExcecaoAxe[] = [];
  ```
  Exceção que não casa com nenhuma violação = erro ("exceção velha: tire da lista"). A lista aplicada vai para o
  relatório e para o resumo do job. Quem revisa: `ux-acessibilidade`.
  _(tech-lead, 2026-10-30: `alvo` deixou de ser "trecho do seletor" — ver D16, P-qa-7. O `AxeBuilder` roda sem
  `disableRules`, `withTags`, `withRules`, `exclude`, `include` nem `options`: `new AxeBuilder({ page }).analyze()`.)_
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

`.github/workflows/ci.yml` final _(revisto em 2026-10-30 com a seguranca — D16: actions por SHA, `persist-credentials:
false`, telemetria do Next desligada, último passo "nada mudou no repositório")_:

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

env:
  # O next build manda telemetria anônima para a Vercel; o CI não precisa disso (Aa11).
  NEXT_TELEMETRY_DISABLED: "1"

# Actions fixadas pelo SHA do commit, com a versão em comentário (Aa9): uma etiqueta como v7 pode ser movida por
# quem controla a action. Para subir: git ls-remote --tags https://github.com/<action> (usar a linha ^{} quando houver).
jobs:
  verificar:
    name: Lint, tipos e testes
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false # ninguém faz push daqui: o token não fica no .git/config (Aa6)
      - uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      # pnpm lint entra aqui na HIS-002b (passo B3)
      - run: pnpm typecheck
      - run: pnpm test

  e2e:
    name: Navegador (e2e, axe e peso)
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
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
        uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2
        with:
          name: relatorio-e2e
          path: |
            apps/web/playwright-report/
            apps/web/test-results/
          retention-days: 14
          if-no-files-found: ignore
      # Nenhum teste nem o build muda arquivo do repositório (Aa13): a referência de peso só muda num PR, de propósito.
      - name: Conferir que nada mudou no repositório
        run: git diff --exit-code && test -z "$(git status --porcelain)"
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
- ~~`actions/upload-artifact@v4`: conferir a major atual na implementação; fixar actions por SHA é assunto da
  seguranca (HIS-003).~~ _(2026-10-30: majors conferidas por `git ls-remote` — checkout v7, action-setup v6, setup-node
  v7, upload-artifact v7 — e actions fixadas por SHA já aqui; ver D16, Aa9.)_

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

**Estimativa revista (tech-lead, 2026-10-30, depois das revisões — D16):** **HIS-002a ≈ 2,75 dias** (2,25 dos blocos
acima + 0,5 do qa: `teclado`, `comodos`, 24 estados do axe, `sanidade`; as conferências da seguranca e o SHA das actions
cabem nos passos sem prazo a mais). **HIS-002b ≈ 2–2,5 dias** (+0,5: C10, ignores ancorados e contagem, casos
`seguranca-22` a `30`, gêmeos da matriz, caso pela linha de comando). As duas continuam M (até 3 dias).

### D13. Ordem dos passos (cada um verde: `pnpm typecheck`, `pnpm test`, `pnpm build` e o que o passo acrescenta)

**HIS-002a**

| Passo | O que | Verde quando |
| --- | --- | --- |
| A1 | Dependências do Playwright e do axe; `playwright.config.ts`; `e2e/tsconfig.json`; `e2e/apoio/teste.ts` (console, página **e rede**: Aa11/P-qa-8), `casa.ts`, `resumo-do-ci.ts`; scripts; `.gitignore`; `rotas.spec.ts` (com as 8 rotas em `routes` do manifesto, P-qa-5); `sanidade.spec.ts` com N1, N2, N3 e N8 | `pnpm build && PORTA_E2E=<sua> pnpm test:e2e` passa; o `typecheck` cobre o `e2e/`; **Ra1–Ra4** (versão exata só em `devDependencies` de `apps/web`; lockfile só do registro; scripts de instalação só `esbuild`/`unrs-resolver`; `pnpm audit --audit-level high` limpo), **Ra5** parte 1 (`grep` em `apps/web/src` vazio) e **Ra13** (`-H 127.0.0.1`, `reuseExistingServer: false`) conferidos e escritos na nota |
| A2 | `fluxo-principal.spec.ts` com o contador de transições por ação (P-qa-1, inclusive `/sobre` → `/`) e datas relativas (obs. do qa) | passa nos 2 projetos, sem erro de console nem pedido para fora |
| A3 | fixtures copiadas (`sha256sum` igual); `migracao`, `aparelhos`, `ajustes`, `transicoes` (com `reduce`: +1 por aba e durações 0 no `transition.ready`, P-qa-1; N7), `teclado` (P-qa-2), `comodos` (P-qa-3), com os `test.fixme("HIS-107 …")`/`("HIS-108 …")` | linhas 1–13 e 16–23 da tabela "Cobertura" do qa |
| A4 | `apoio/peso.ts` (`compararPeso` e os limites como constantes), `peso-js.spec.ts` + `peso-js.json` medido neste commit (código igual ao `main`), com `/casa (com casa)` (P-qa-5); N6 no `sanidade` | números batem com os da HIS-001 (D8 e critério 6 do qa); **Ra5** parte 2 (`.next/static` sem `axe-core`/`playwright`); **Ra11** (JSON sem limite; M15 vermelho com o JSON intacto) |
| A5 | `apoio/axe.ts` (`aplicarExcecoes`), `acessibilidade.spec.ts` (24 estados × 2, P-qa-4) + `excecoes-axe.ts` (1 elemento por exceção, D16); N4 e N5 no `sanidade`; correções sem mudança visível num commit próprio: `aria-label` da casa ilustrada com o texto da ux (D16, "UX") e o `<dl>` da faixa "Tarifa Social" | 0 sério/crítico fora das exceções; peso dentro do limite; ux revisou a lista; **Ra12** (`grep` vazio; exceção que casa 2 elementos reprova) |
| A6 | `ci.yml` do D11 (job `e2e`, artefato, resumo; actions por SHA reconferidas; `persist-credentials: false`; `NEXT_TELEMETRY_DISABLED`; último passo "nada mudou"); build sai do `verificar` | CI verde no PR; peso do runner igual ao local (se não, referência = medida do CI, D14); **Ra6–Ra8** e **Ra11** (passo final presente); um commit descartável com teste falhando mostra capturas e trace no artefato (critério 4), o artefato vai para a seguranca (**Ra9**) e o commit é revertido |
| A7 | `git rm -r apps/web/e2e-base` | tabela "Cobertura" do qa, linhas 1–21, cada uma com o nome do teste e verde; `grep -rn "e2e-base" apps scripts .github` vazio; o commit do A7 fica no ADR-003 e no `contexto.md` do qa |

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
| Action fixada por SHA ficar sem correção de segurança (D16, Aa9) | Dependabot para `github-actions` na HIS-003 (critério 6 dela) abre o PR com o SHA novo; até lá, reconferir as majors a cada história que mexer no `ci.yml` |
| Fixture de rede reprovar pedido legítimo do próprio Next (D16, P-qa-8) | Tudo do site sai da mesma origem (fontes locais, `/dados` estático, medido pela seguranca); se um dia precisar de terceiro, entra com a seguranca e consentimento (LGPD), nunca afrouxando a fixture |

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

### D16. Decisões sobre as revisões de qa, seguranca e ux (tech-lead, 2026-10-30)

_Tudo aceito; um ajuste (P-qa-7 com Aa14). Os passos A1–A7 (D13), o D9, o D10 e o D11 já estão atualizados com o que
segue. Nada aqui muda a essência do ADR-003, que passa a "aceito"._

**QA (perguntas P-qa-1 a P-qa-8)**

| Ponto | Decisão | Passo |
| --- | --- | --- |
| P-qa-1 · transição por passo | **Aceito.** `fluxo-principal`: contador lido antes e depois de cada ação (+1 por passo do cadastro, 0 em "Por cômodo/Tudo junto", 0 ao abrir e fechar folhas, +1 por aba e por link, **inclusive `/sobre` → `/`**, que prova o B6 da 002b). `transicoes` com `reduce`: +1 por troca de aba e durações 0 lidas no `transition.ready`, sem espera fixa | A2, A3 |
| P-qa-2 · `teclado.spec.ts` | **Aceito**, 2 projetos, como proposto; `test.fixme("HIS-108 · P1 …")` para o foco da cidade | A3 |
| P-qa-3 · `comodos.spec.ts` | **Aceito**, 2 projetos; `test.fixme("HIS-108 · P3 …")` para o alinhamento ao topo | A3 |
| P-qa-4 · mais estados no axe | **Aceito**: os 13 do D10 + 7 passos do cadastro + `/casa/comodos?visao=geral` + 3 folhas = 24 × 2. Um teste por estado, com nome "axe · <página> · <estado>"; antes da análise, conferir que a tela certa abriu e exigir `passes.length > 0` (obs. do qa) | A5 |
| P-qa-5 · peso e rotas | **Aceito.** `"/casa (com casa)"` só com `totalComPrefetch`. Contrato: a lista de medidas é **fixa no spec** (`MEDIDAS`: rota, estado e quais campos); o JSON tem que ter exatamente essas chaves e campos — falta = "rota sem referência", sobra = "referência sem medida: tire do JSON". `rotas`: as 8 rotas em `routes` do `prerender-manifest.json` | A1, A4 |
| P-qa-6 · `sanidade.spec.ts` | **Aceito.** Cada negativo entra no passo da sua barreira: N1, N2, N3, N8 no A1; N7 no A3; N6 no A4; N4, N5 no A5. `aplicarExcecoes` em `e2e/apoio/axe.ts` e `compararPeso` em `e2e/apoio/peso.ts`: funções puras exportadas (recebem dados, devolvem a lista de problemas; sem `page` dentro), usadas pelos specs e pelo `sanidade`. `SO_NO_CELULAR` ganha `sanidade` | A1–A5 |
| P-qa-7 · exceção mais estreita | **Aceito com ajuste, unindo com a Aa14:** uma exceção = **um** elemento. `alvo` é seletor CSS; no navegador, `document.querySelectorAll(alvo)` tem que dar **exatamente 1** elemento, e ele tem que ser um dos nós da violação (comparado por identidade com o elemento do `target` do axe). Sem campo `nos`: dois elementos com o mesmo defeito = duas entradas. Mensagens: 0 nós da violação → "exceção velha: tire da lista"; seletor com 2+ elementos → "exceção cobre mais de um elemento". Por quê: um elemento novo com o defeito falha sozinho, um a menos vira exceção velha, e não há número para manter. Na `/` devem ser 2 entradas `color-contrast` (pílulas de Quarto e Cozinha, faixa D — o qa confirma no A5), ex.: `alvo: 'button[aria-label^="Quarto,"] .numeros'` | A5 |
| P-qa-8 · nada sai do aparelho | **Confirmado no A1, obrigatório** (= Aa11 da seguranca): fixture automática em `apoio/teste.ts` com `context.on("request")` (pega janela nova e worker), **sem** `route` (não mexe no 11b); libera só a origem do `baseURL` (tirada da fixture `baseURL` do Playwright, não de constante repetida), `data:` e `blob:`; reprova com a URL na mensagem. N8 permanente: `fetch("https://exemplo.com/x")` por `page.setContent` | A1 |

A pergunta `[para: tech-lead]` do qa fica respondida por esta tabela. O custo (+0,5 dia, +~40 s no job) está no D12.

**Seguranca (Aa9, pontos do desenho e Ra1–Ra13)**

| Ponto | Decisão | Passo |
| --- | --- | --- |
| Aa9 · actions por SHA | **Aceito já no A6** (não fica para a HIS-003): o `ci.yml` é reescrito de qualquer forma, custa minutos, e o check do e2e passa a ser o que libera a integração no `main`. **Conferido hoje** por `git ls-remote` (a API do GitHub continua fechada daqui; o git passa) e lendo o `action.yml` e as notas de cada uma: `actions/checkout` v7.0.1 `3d3c42e5aac5ba805825da76410c181273ba90b1`; `pnpm/action-setup` v6.1.0 `ea17c68df8912ef543352723c149a84f56e3d413` (etiqueta anotada: é o commit da linha `^{}`); `actions/setup-node` v7.1.0 `949feb2413d6458794dcd2491c4babbbce0c15c1`; `actions/upload-artifact` v7.0.2 `cf430e030ddbb5b0abf93d22962f4752f3646cd9`. As majors subiram desde o D11 (era v5/v4); as quebras não nos atingem (setup-node v7 tirou o `NODE_AUTH_TOKEN` falso — não usamos `registry-url`; checkout v7 bloqueia fork em `pull_request_target` — não usamos), e as entradas que usamos existem (`persist-credentials`, `node-version`, `cache: pnpm`, `name`/`path`/`retention-days`/`if-no-files-found`); o `action-setup` lê o `packageManager` (`pnpm@10.28.0`). Quem implementa reconfere os SHA no dia e escreve na nota do A6. **Fica na HIS-003:** Dependabot para `github-actions` (já no critério 6 dela; é ele que mantém os SHA em dia) e fixar o `atualizar-dados.yml` | A6 |
| `persist-credentials: false` (Aa6) | **Aceito**, nos dois jobs | A6 |
| `NEXT_TELEMETRY_DISABLED` (Aa11) | **Aceito**, `"1"` no `env:` do topo do workflow (vale para os dois jobs e para o `next start` do e2e) | A6 |
| Limites de peso fixos + `git diff` (Aa13) | **Aceito.** `LIMITE_JS_DO_HTML = 1024` e `LIMITE_TOTAL_COM_PREFETCH = 2048` são constantes de código em `e2e/apoio/peso.ts` (onde mora o `compararPeso`, que o N6 testa), com comentário apontando a HIS-001 — nunca no JSON nem em variável de ambiente. Último passo do job `e2e`: `git diff --exit-code && test -z "$(git status --porcelain)"` (o `status` pega também arquivo novo não ignorado). Conferido: `next-env.d.ts` e `.next/` são ignorados; se o `next build` reescrever um arquivo versionado, o passo acusa — é o que se quer | A4, A6 |
| axe sem filtro (Aa14) | **Aceito.** Só `new AxeBuilder({ page }).analyze()`; a exceção se aplica depois, em `aplicarExcecoes`. `historia` tem que existir como linha `\| HIS-NNN \|` em `docs/planejamento.md` (o `sanidade` lê o arquivo); lista aplicada e contagem de `incomplete` no resumo do job. Conferido no `axe-core` 4.14.0: `label-content-name-mismatch` **não** é mais `experimental` (roda no conjunto padrão, impacto `serious`) | A5 |
| Ra1–Ra13 | **Todas aceitas**, cada uma no passo em que dá para conferir (D13): Ra1–Ra4, Ra5 parte 1 e Ra13 no A1; Ra5 parte 2 e Ra11 (JSON, M15) no A4; Ra12 no A5; Ra6–Ra9 e Ra11 (passo final) no A6. A Ra10 vira o **N8 permanente** (A1); a seguranca repete a mutação na `/sobre` na etapa 6 se quiser. Ra4 também de novo antes da etapa 6 | A1–A6 |

**UX**

- A pergunta `[para: ux-acessibilidade]` está respondida em "Fluxo e textos" (caixa marcada nas "Perguntas abertas").
- **O A5 usa exatamente o "Modelo para o frontend" e a tabela "Textos finais" da ux** (em "Fluxo e textos"), no
  `aria-label` do `<button>`. Fica o `reais()` local da `CasaIlustrada` (Intl, que põe **U+00A0**, espaço sem
  quebra, depois do "R$" — conferido: `R$ 21,74`). **Não** trocar por `formatarReais` nesse passo: ele troca o
  U+00A0 por espaço comum e a legenda visível continuaria com o `reais()` — o nome e o que se vê ficariam diferentes. O
  `reais()` local repetido vira dívida (registrada no meu `contexto.md`), não muda na E0.
- **Seletor do e2e:** os valores da casa ilustrada são constantes do exemplo (não vêm da tarifa do dia), então o teste
  confere o número da tabela, com `\s` no lugar do espaço: `getByRole("button", { name: /^Quarto, 19% da conta,
  R\$\s21,74 por mês$/ })` (em JS, `\s` casa o U+00A0). Se o exemplo mudar de propósito, o teste muda junto.
- A observação da ux sobre `corDaParte` × `faixaDoPeso` **não é desta história** (muda a cor da Lavanderia, mudança
  visível): registrada na linha da HIS-110 em `docs/planejamento.md` como ponto para o scrum-master decidir.

## Ameaças

_(seguranca)_ Análise desta parte: `@playwright/test` 1.63.0 e `@axe-core/playwright` 4.14.0 (D2), `ci.yml` com dois
jobs e `permissions: contents: read` (D11), `playwright install --with-deps` só no runner, artefato `relatorio-e2e`
(14 dias, só dados inventados), servidor do teste em `127.0.0.1` sem reaproveitar servidor alheio. As ameaças das
dependências do ESLint e os 21 casos ficam na [HIS-002b](HIS-002b-lint-e-camadas.md).

**Ativos:** o código e o histórico do repositório (público), o resultado do CI (é ele que libera a integração no
`main`), o computador da equipe e o runner (onde os pacotes rodam), a casa salva de quem usa (nada dela pode ir para
teste nem artefato) e a garantia de que o site não fala com terceiros. **Quem ataca:** pacote malicioso ou sequestrado
na árvore de dependências ou numa action; PR de fora (fork) tentando usar o CI; e o próprio time por descuido
(afrouxar uma barreira sem perceber).

**Medido em 2026-10-29 (seguranca):** `npm view` dos 5 pacotes do navegador — `@playwright/test`, `playwright`,
`playwright-core` 1.63.0 (mantenedores da Microsoft, `github.com/microsoft/playwright`) e `@axe-core/playwright` 4.14.0 /
`axe-core` 4.14.0 (Deque, `github.com/dequelabs`): **nenhum tem `preinstall`/`install`/`postinstall`** (o `prepare` do
`@axe-core/playwright` só roda em instalação por git, que não usamos). Fontes do site são locais (`@fontsource-variable/*`):
nem o build nem a página buscam fonte fora. O `ci.yml` de hoje **não tem `permissions`** (o token herda o padrão do
repositório, que pode ser escrita): o D11 melhora isso.

| # | Ameaça | Gravidade | Mitigação |
| --- | --- | --- | --- |
| Aa1 | Pacote malicioso, nome parecido (typosquat) ou versão sequestrada entre os pacotes novos do navegador roda código na máquina da equipe e no runner | médio (impacto alto, chance baixa) | Nomes e mantenedores conferidos (acima); versão exata no `package.json`; lockfile com `integrity` sha512; `pnpm install --frozen-lockfile` no CI; nenhum script de instalação novo |
| Aa2 | Script de instalação liberado sem revisão (`onlyBuiltDependencies` ganha um pacote, ex.: `unrs-resolver`) | baixo | `onlyBuiltDependencies` continua só `esbuild` e `sharp`; pacote novo que peça script entra só com nota da seguranca |
| Aa3 | Lockfile com origem fora do registro (tarball de URL ou git) escondida num diff de mil linhas | médio | Toda `resolution` do `pnpm-lock.yaml` vem do registro com `integrity`; conferência por `grep` (Ra2) |
| Aa4 | Vulnerabilidade conhecida alta/crítica na árvore nova | alto se aparecer | `pnpm audit --audit-level high` limpo no A1 e de novo antes da etapa 6; se aparecer, bloqueia até subir de versão ou ter justificativa escrita |
| Aa5 | Pacote de teste indo para o navegador (import de `@playwright/test`/`axe-core` em `apps/web/src`) | baixo | Só em `devDependencies` de `apps/web`; o e2e não importa código do site e o site não importa o e2e; peso do A4 igual ao da HIS-001 e hosts em `.next/static` iguais à linha de base |
| Aa6 | Token do CI com mais poder que precisa: um pacote ou action comprometida no job escreveria no repositório | médio | `permissions: contents: read` no topo e **nenhum** `permissions:` por job; nenhum `secrets.` no `ci.yml`; `persist-credentials: false` no `actions/checkout` dos dois jobs (ninguém faz push; assim o token não fica em `.git/config` ao alcance dos ~300 pacotes que rodam no job) |
| Aa7 | Gatilho que roda código do PR com poder do repositório (`pull_request_target`, `workflow_run`) | alto se usado | Só `push` no `main`, `pull_request` e `workflow_dispatch` (sem `inputs`). PR de fork roda com token só de leitura e sem segredos |
| Aa8 | Injeção de expressão no `run:` (`${{ github.event.pull_request.title }}`, `github.head_ref` viram comando de shell) | alto se usado | Nenhum `${{ github.event.* }}` nem `github.head_ref` dentro de `run:` no `ci.yml`; se um dia precisar, via `env:` e `"$VAR"` |
| Aa9 | Action por etiqueta móvel (`@v5`, `@v4`): quem controla a action (inclusive a de terceiro `pnpm/action-setup`) troca o código e passa a marcar verde ou ler o job | médio | **Recomendado no A6**, já que o `ci.yml` é reescrito: as 4 actions fixadas pelo SHA completo de 40 caracteres com a versão em comentário (`uses: actions/checkout@<sha> # v5.x.y`) e a major atual do `upload-artifact` conferida. Se o scrum-master mantiver isso na HIS-003, ela fecha **antes do E4** (antes de existir qualquer segredo no CI), com Dependabot para actions |
| Aa10 | Artefato com dado sensível: relatório, captura e trace de repositório público ficam 14 dias para qualquer conta do GitHub baixar; trace guarda DOM, rede, console e `localStorage` das telas | médio | Só fixtures inventadas (`casa-v1/v2.json`: ids `00000000-…`, cidade pública, sem nome, CPF, endereço, telefone, e-mail); job `e2e` sem `env:` de segredo; teste nunca lê `.env*`; `path` do artefato só `apps/web/playwright-report/` e `apps/web/test-results/` (nunca `.`, `.next/`, `.git/`, `~`); rede do teste só `127.0.0.1` |
| Aa11 | e2e dependendo de rede externa (instável) ou site chamando terceiro sem a pessoa saber (LGPD) sem ninguém ver | médio | Fixture automática em `apoio/teste.ts` que **registra** toda requisição (`context.on("request")`, sem `route`, para não mexer no 11b) e reprova se o destino não for `http://127.0.0.1:<PORTA>` (`data:`/`blob:` liberados), com a URL na mensagem. Os testes conferem o `href` dos links da ANEEL, não clicam. `NEXT_TELEMETRY_DISABLED: 1` no `env:` do workflow (o `next build` manda telemetria anônima para a Vercel; o CI não precisa disso) |
| Aa12 | Servidor do teste aberto na rede ou reaproveitado (build de outra pessoa) | baixo | `next start -H 127.0.0.1`, `baseURL` em `127.0.0.1`, `reuseExistingServer: false` (já no D9) |
| Aa13 | Referência de peso atualizada pelo CI ou afrouxada em silêncio (sobe o número, o celular simples paga) | médio | Limites +1 024 / +2 048 B são **constantes no `peso-js.spec.ts`**, nunca no JSON nem em variável de ambiente; `ATUALIZAR_PESO_JS=1` com `GITHUB_ACTIONS=true` reprova (M15 do qa); o token é só leitura; último passo do job `e2e`: `git diff --exit-code` (nenhum teste muda arquivo versionado); mudança no `peso-js.json` só com o porquê na história do PR |
| Aa14 | Exceção do axe virando regra desligada: `disableRules`, `withTags`, `withRules`, `exclude()`/`include()`, `options({ rules })`, ou exceção com `alvo` tão genérico que cobre a página | médio (acessibilidade é a segurança de quem enxerga pouco) | O `AxeBuilder` roda **sem** esses métodos; a exceção se aplica depois da análise, por regra + página + estado + nó; exceção que casa com 0 nós = erro (D10) **e com mais de 1 nó = erro**; `historia` tem que existir em `docs/planejamento.md`; lista e contagem de `incomplete` no resumo do job; ux revisa |
| Aa15 | Barreira que passa sem testar: `test.only`, `test.skip`/`fixme` sem história, 0 testes | baixo | `forbidOnly` no CI (M16 do qa); todo `skip`/`fixme` cita `HIS-NNN` no título; sem `passWithNoTests` (o Playwright reprova "No tests found") |
| Aa16 | Tela branca passa no CI (erro de página não pego) | baixo | Fixture automática com `pageerror` e `console.error` (N1, N2 do qa) |
| Aa17 | Chromium baixado do CDN do Playwright no runner sem conferência nossa de hash | baixo, aceito | HTTPS da Microsoft, mesmo caminho da documentação; usar o Chrome do runner quebraria o critério 6. Só no runner, nunca no ambiente da equipe |
| Aa18 | Cache do pnpm envenenado por PR | baixo, aceito | O GitHub isola o cache criado num PR (o `main` não o lê); `--frozen-lockfile` confere a integridade de cada pacote |

Nenhuma ameaça crítica. As altas (Aa4, Aa7, Aa8) só existem se o desenho mudar ou o audit acusar: viram as conferências
Ra4, Ra6 e Ra7. As médias têm mitigação no desenho ou aqui; a Aa9 tem destino se não entrar no A6.

### Conferência da etapa 6 (Ra1–Ra13, seguranca)

| # | Conferência | Esperado |
| --- | --- | --- |
| Ra1 | `grep -nE '"(@playwright/test\|@axe-core/playwright)"' apps/web/package.json` e `pnpm why axe-core playwright-core` | só em `devDependencies` de `apps/web`, versão sem `^`/`~` (1.63.0 e 4.14.0) |
| Ra2 | `grep -nE 'tarball:\|git\+\|codeload\|\.tgz' pnpm-lock.yaml`; `onlyBuiltDependencies` em `pnpm-workspace.yaml` | vazio; continua `esbuild`, `sharp` |
| Ra3 | scripts de instalação na árvore: para cada `node_modules/.pnpm/*/node_modules/**/package.json`, `preinstall`/`install`/`postinstall` | só `esbuild` (liberado) e `unrs-resolver` (bloqueado, da 002b) |
| Ra4 | `pnpm audit --audit-level high` no A1 e na etapa 6 | "No known vulnerabilities found" (ou nenhuma alta/crítica, com a lista na nota) |
| Ra5 | `grep -rnE "playwright\|axe-core" apps/web/src` e `grep -rl "axe-core\|playwright" apps/web/.next/static` | vazios; peso do A4 igual à HIS-001 |
| Ra6 | No `ci.yml`: `on:` só `push` (main), `pull_request`, `workflow_dispatch`; `permissions: contents: read` no topo; `grep -n "permissions:\|secrets\.\|pull_request_target\|workflow_run" .github/workflows/ci.yml` | uma linha `permissions:` (a do topo); nenhum `secrets.`, `pull_request_target`, `workflow_run` |
| Ra7 | `grep -n '\${{' .github/workflows/ci.yml` | só em `concurrency` e `if:` (nada de `github.event`/`head_ref` em `run:`) |
| Ra8 | `actions/checkout` dos dois jobs com `persist-credentials: false`; `uses:` fixados por SHA (se entrou no A6) ou registro na HIS-003 | um ou outro, escrito na nota do A6 |
| Ra9 | Baixar o artefato do commit descartável do A6, descompactar e procurar: `grep -rEl "ghp_\|github_pat_\|ghs_\|AKIA\|eyJhbGci\|service_role\|BEGIN [A-Z ]*PRIVATE" .`; listar os arquivos | vazio; só `playwright-report/**` e `test-results/**`; dentro do trace, só pedidos a `127.0.0.1` e a casa das fixtures |
| Ra10 | Numa cópia, plantar `fetch("https://exemplo.com/x")` num efeito da `/sobre` → `pnpm test:e2e` | reprova com a URL na mensagem; tirar → passa (pode virar N8 permanente do qa com `page.setContent`) |
| Ra11 | `grep -n "1024\|1 024\|2048" apps/web/e2e/peso-js.json`; M15 do qa; `git diff --exit-code` como último passo do job | JSON sem limite; M15 vermelho com o JSON intacto; passo presente |
| Ra12 | `grep -rnE "disableRules\|withTags\|withRules\|\.exclude\(\|\.include\(\|options\(" apps/web/e2e`; teste com exceção de `alvo` que casa 2 nós | vazio; reprova ("exceção cobre mais de um elemento") |
| Ra13 | `grep -n "NEXT_TELEMETRY_DISABLED" .github/workflows/ci.yml`; `next start` com `-H 127.0.0.1`; `reuseExistingServer: false` | presentes |

### Resultado da etapa 6 (seguranca, 2026-10-30)

Código conferido: `efab326` (os commits seguintes só mudam `docs/`, `CLAUDE.md` e `.claude/`). Cópia própria
(`scratchpad/seg-h2a/copia`: `git archive` + `pnpm install --frozen-lockfile --offline`, portas 3171–3173, liberadas):
`pnpm typecheck`, `pnpm test`, `pnpm build` verdes; e2e completo **107 passam, 6 pendentes, 0 falha**.

| # | Resultado |
| --- | --- |
| Ra1 | ok: 4.14.0 e 1.63.0 exatas, só em `devDependencies` de `apps/web`; `@playwright/test` também aparece como par opcional do `next` (não vai para o navegador, ver Ra5) |
| Ra2 | ok: 0 `tarball`/`git+`/`codeload`/`.tgz`; os 5 pacotes novos com `integrity` **igual** ao `npm view … dist.integrity`; `onlyBuiltDependencies` = `esbuild`, `sharp` |
| Ra3 | ok: 94 pacotes, só `esbuild` com `postinstall` (o `unrs-resolver` é da 002b, ainda não entrou) |
| Ra4 | ok: `pnpm audit --audit-level high` → "No known vulnerabilities found" |
| Ra5 | ok: `apps/web/src` sem `playwright`/`axe-core`; em `.next/static` só 1 arquivo, e só pelo caminho `/ROOT/node_modules/.pnpm/next@…_@playwright+test@…` (tirando o caminho, 0). Hosts em `.next/static`: os da linha de base + textos de teste de polyfill de URL (`https://a`, `http://n`), nenhum pedido |
| Ra6 | ok: 1 `permissions:` (topo, `contents: read`); 0 `secrets.`, `pull_request_target`, `workflow_run` |
| Ra7 | ok: `${{` só em `concurrency` (`github.ref`, `event_name`) e no `if:` do upload; nenhum em `run:` |
| Ra8 | ok: as 4 actions por SHA de 40 caracteres (iguais ao D16); `persist-credentials: false` nos 2 checkouts |
| Ra9 | **ressalva (baixo):** o artefato do `32f2cff` não baixa daqui (proxy). Conferido o equivalente local: 3 falhas plantadas (Ra10) com o mesmo Playwright e o mesmo `reporter`; 41 arquivos, só `playwright-report/**` e `test-results/**`; 6 `.zip` (traces e dados do relatório) extraídos; padrão estrito vazio; trace só com `127.0.0.1:<porta>` (e o `exemplo.com` plantado); nenhum token. O `AKIA` do `index.html` é base64, falso positivo. Conferência no GitHub: nota da seguranca na "Conversa da equipe" |
| Ra10 | ok: `fetch("https://exemplo.com/x")` num componente de cliente da `/sobre` → 3 testes vermelhos (`fluxo-principal`, `axe · /sobre`, `peso-js · medir /sobre`) com `pedido para fora do site: https://exemplo.com/x`; desfeito → os 3 verdes |
| Ra11 | ok: `peso-js.json` sem limite; limites em `apoio/peso.ts`; `ATUALIZAR_PESO_JS` + `GITHUB_ACTIONS=true` lança antes de gravar; passo "nada mudou" presente (M15 do qa) |
| Ra12 | ok: `grep` vazio; só `new AxeBuilder({ page }).analyze()`; "mais de um elemento" e "exceção velha" no `apoio/axe.ts`, com negativo no `sanidade` (N5) |
| Ra13 | ok: `NEXT_TELEMETRY_DISABLED: "1"` no topo; `-H 127.0.0.1`; `reuseExistingServer: false` |

Também conferido: `apps/web/src` muda só `aria-label`, `role`, `tabIndex` e estrutura (texto escapado pelo React, nenhum
`dangerouslySetInnerHTML`/`innerHTML`); fixtures sem dado de pessoa (ids `00000000-…`, cidade pública); `git log -p
main..HEAD` sem padrão de chave; `.env*` no `.gitignore`. Informativo, sem pedido: o `execSync` do `peso-js.spec.ts` é
um comando fixo (`git rev-parse`) e só roda fora do CI; o 11a baixa os `<script src>` pelo Node sem conferir a origem,
mas um script de fora seria pego pela fixture do navegador nos outros testes da mesma rota.

## Plano de testes

_(qa)_ Revisão do D9 (estrutura de `apps/web/e2e/`, relógio real, o que sai do `e2e-base`, comparador) e do D10 (axe,
estados, lista de exceções). O D6 (casos negativos) é revisado na HIS-002b.

### Revisão do D9 e do D10 (qa, 2026-10-29): revisado pelo qa, com observações e 8 pontos para o tech-lead decidir

**De acordo:** estrutura de `apps/web/e2e/`, projetos `celular`/`computador`, `retries: 0`, `forbidOnly` no CI,
`reuseExistingServer: false` com `PORTA_E2E`, relógio real, nenhum valor em R$ afirmado, seletores por papel e nome,
fixture com parâmetro `usar`, `CHAVE_CASA` repetida (caixa-preta), axe com `reducedMotion: "reduce"` e conjunto padrão de
regras sem filtro, exceção por elemento com história, exceção velha = erro, e a **saída do `e2e-base` inteiro com o
comparador** (D1-8). O comparador fica no histórico do git; o commit do A7 fica registrado no ADR-003 e no meu
`contexto.md`, para a próxima reorganização "sem mudar nada" o recuperar.

**Mas a tabela "o que do `e2e-base` vira teste" (D9) perde coisas** que o `linha-de-base.cjs` e o roteiro manual da
etapa 5 da HIS-001 (`manual-qa.cjs`, que só existe no scratchpad) cobriam: transição **por passo** (inclusive
`/sobre` → `/`, que a HIS-002b usa para provar o B6), teclado e foco das folhas, `#comodo-<id>`, `?visao=geral`, axe
nos passos do cadastro e nas folhas, 11b com casa. Proposta em "Perguntas abertas" `[para: tech-lead]`, P-qa-1 a
P-qa-8. Bloqueiam o **A7** (tirar o `e2e-base`), não o A1.

**Observações que não mudam o desenho (só precisam ser seguidas na implementação):**

- **Relógio real, mas datas relativas:** as contas do fluxo são "mês passado" e "mês retrasado", e as leituras são
  "hoje − 9 dias" e "hoje" (calculadas no teste, fuso `America/Sao_Paulo`). Com `2026-09`/`2026-10-29` fixos, daqui a
  um ano as contas ficariam fora da janela que o acompanhamento mostra e o teste quebraria sem defeito nenhum.
- **`celular` = só a janela 390×844**, sem `isMobile`/`hasTouch`: a referência do 11b foi medida assim, e `isMobile`
  muda a janela de layout e, com ela, os `<Link>` visíveis que o Next pré-carrega. Toque entra quando houver teste de toque.
- **Fixtures:** copiadas byte a byte (`sha256sum` igual ao das do `e2e-base`) e **nunca regeradas** — são o que a versão
  antiga gravou. Quando o `persist` for para a v3, entra `casa-v3.json` e as antigas ficam.
- **Nomes da casa ilustrada (texto da ux):** seletor por regex, ex.: `/^Quarto, \d+% da conta, R\$\s.+ por mês$/` — o
  valor depende da tarifa do dia e há espaço sem quebra depois de "R$".
- **Movimento reduzido:** afirmar `.surgir` com duração ≤ 0,01 ms (hoje `1e-05s`), não "≠ 0,52 s" (aceitaria 0,3 s).
- **Fixture de console:** `pageerror` e `console.error` falham; `console.warn` vai como anexo (hoje 0, como na HIS-001).
- **Axe:** antes de cada análise, conferir que a tela certa abriu (título ou texto esperado da página **e** do estado com
  ou sem casa) e exigir `passes.length > 0` — "0 violações" numa página em branco ou antes da hidratação é pior que
  nenhum teste. Resultados `incomplete` (o axe pede revisão humana, ex.: contraste sobre gradiente) vão como anexo, com
  a contagem no resumo do job; não falham.
- **Saem com decisão registrada (qa):** o aviso de `htmlSize` da `/` (> 2 %) — o peso de JS (critério 9) cobre o que
  importa para o celular; e o aviso de `sha256` de `public/dados` — servia ao byte a byte, que saiu.

### Cobertura: cada verificação do `e2e-base` e do manual da HIS-001 → onde fica

| # | Verificação (HIS-001) | Onde fica no `apps/web/e2e/` | Situação |
| --- | --- | --- | --- |
| 1 | Fluxo completo em 390 e 1280 (cadastro → acompanhamento → cômodos → dicas → acompanhamento → minha casa → sobre → `/`) | `fluxo-principal` (2 projetos) | D9 |
| 2 | Editor salva sem mudar ids nem quantidade (pelo "Quem mais gasta" e pelos cômodos) | `fluxo-principal` + `aparelhos` | D9 |
| 3 | Remover o aparelho que está no plano: −1 aparelho, aquele id some, nenhuma dica dele no `plano` | `aparelhos` (fixture v2: o chuveiro está no plano) | D9 |
| 4 | Migração: v2 volta idêntica depois de recarregar e mostra os 6 cômodos; v1 vira `version: 2` com `contas`, `leituras`, `plano` vazios e o resto igual | `migracao` | D9 |
| 5 | Portão de hidratação: `/comecar` com casa → "Você já cadastrou a sua casa", casa intacta | `migracao` | D9 |
| 6 | Apagar todos os meus dados → volta para `/`, sem `residencia` e 5 listas vazias | `ajustes` (+ recarregar continua vazio; `/comecar` volta a mostrar o assistente) | D9 + obs. |
| 7 | `/casa/aparelhos` → 200 com `NEXT_REDIRECT` e o navegador termina em `/casa/comodos` | `rotas` (só celular: não depende da largura) | D9 |
| 8 | 8 rotas 200; `/` com revalidação de 86400 s | `rotas` | D9 |
| 9 | As 8 rotas continuam pré-renderizadas (estão em `routes` do `prerender-manifest.json`) | `rotas` | **P-qa-5** |
| 10 | Transições: 1 por passo do cadastro, 0 na troca "Por cômodo/Tudo junto", 0 nos diálogos, 1 por aba e por link (21 por largura) | `fluxo-principal` (contagem antes × depois de cada ação) | **P-qa-1** |
| 11 | Nomes `topo` e `navegacao` de `view-transition-name` | `transicoes` (valores exatos) | D9 |
| 12 | Movimento reduzido: `.surgir` ≤ 0,01 ms; 4 transições em 4 trocas de aba; nenhuma animação de view transition de verdade | `transicoes` (durações lidas no `transition.ready`) | **P-qa-1** |
| 13 | Console e página sem erro, em toda sessão | `apoio/teste.ts` (automática) | D9 + negativo **P-qa-6** |
| 14 | 11a (JS do HTML, 7 rotas) e 11b (total com prefetch) | `peso-js` | D8 |
| 15 | 11b de `/casa` **com casa** (13 arquivos × 15 sem casa; 212 267 B na HIS-001) | `peso-js` | **P-qa-5** |
| 16 | Cadastro só com teclado; ao entrar em cada passo o foco vai para o `h1`; contorno de foco visível | `teclado` (2 projetos) | **P-qa-2** |
| 17 | Folhas com teclado (editor pelo "Quem mais gasta" e pelos cômodos, "Anotar conta"): Enter abre, foco dentro do diálogo, `Esc` fecha, foco volta para quem abriu | `teclado` | **P-qa-2** |
| 18 | Abas só com teclado: Enter navega, contorno visível | `teclado` | **P-qa-2** |
| 19 | Nenhum controle sem nome acessível (8 rotas + diálogo do editor) | `acessibilidade` (axe `button-name`, `link-name`, `label`… são sérias/críticas) + estados novos | D10 + **P-qa-4** |
| 20 | `#comodo-<id>` pelo link do acompanhamento e direto pelo endereço: cômodo existe, expandido e visível | `comodos` (2 projetos) | **P-qa-3** |
| 21 | `/casa/comodos?visao=geral` abre no "Painel geral" | `comodos` | **P-qa-3** |
| 22 | Zoom 200% em 390 px (P2) | `acessibilidade`, `test.fixme("HIS-107 …")` | fora do escopo, pendente marcado |
| 23 | P1 (foco da cidade pula da busca para o título) e P3 (âncora pelo link não alinha ao topo) | `teclado` e `comodos`, `test.fixme("HIS-108 …")` | fora do escopo, pendente marcado |
| 24 | P4 (1 de 25 Tabs sai do `<dialog>` nativo) | — | informativo, sem teste |
| 25 | Capturas, texto e DOM byte a byte; relógio fixo; ids por contador; `comparar` | — | fora do escopo (critério 9 e D9) |
| 26 | Avisos de `htmlSize` e de `sha256` de `public/dados` | — | saem (decisão acima) |

O A7 só acontece com as linhas 1–21 verdes e cada uma apontando para o nome do teste no relatório do e2e.

### Testes negativos de cada barreira

**Permanentes, no próprio e2e (`sanidade.spec.ts`, só celular, sem servidor: `page.setContent`).** Cada barreira tem um
teste com `test.fail()` — se a barreira deixar de reprovar, o `test.fail()` vira "Expected to fail, but passed" e a
execução fica vermelha. **Medido** com `@playwright/test` 1.63.0 e `@axe-core/playwright` 4.14.0 (pacotes da cópia do
tech-lead, protótipo em `scratchpad/qa-his002/prova/`): com a barreira inteira, código 0; com a fixture e o axe
desligados de propósito, os 4 negativos viraram "Expected to fail, but passed" e o código foi 1.

```ts
test("negativo: console.error reprova o teste", async ({ page }) => {
  test.fail(true, "a fixture de console precisa reprovar");
  await page.setContent(PAGINA_LIMPA);
  await page.evaluate(() => console.error("plantado"));
});
```

| # | Barreira | Caso que precisa reprovar | Controle que precisa passar |
| --- | --- | --- | --- |
| N1 | fixture de console | `console.error` plantado | página limpa |
| N2 | fixture de página | `throw` num `setTimeout` (`pageerror`) | página limpa |
| N3 | axe (crítica) | `<button></button>` sem nome (`button-name`) | mesma página com "Salvar conta" |
| N4 | axe (séria) | `<p style="color:#fff;background:#ec7a1a">19%</p>` (`color-contrast`, o caso real da `/`) | — |
| N5 | exceções do axe (função pura `aplicarExcecoes`) | exceção sem violação = "exceção velha"; violação da mesma regra em **outro** elemento continua falhando | violação coberta pela exceção sai da lista |
| N6 | peso (função pura `compararPeso`) | `jsDoHtml` +1 025; `totalComPrefetch` +2 049; rota sem referência | +1 024 e +2 048 passam; −1 025 vira anotação, não erro |
| N7 | movimento reduzido | — (controle invertido) | sem `reduce` as animações de view transition duram > 1 ms; com `reduce`, 0 (**medido**: 250 ms × 5 → 0 × 5) |

**Uma vez, na etapa 5 (mutação plantada numa cópia própria, um caso por vez; resultado escrito nesta história, não no
scratchpad).** Cada linha precisa deixar o teste indicado vermelho, com mensagem que diga o que quebrou; depois reverte.

| # | Mutação no site | Tem que falhar |
| --- | --- | --- |
| M1 | `migrate` deixa de criar `plano: []` | `migracao` (v1) |
| M2 | tirar o portão de hidratação do `/comecar` | `migracao` (portão) |
| M3 | salvar o editor com `novoId()` no lugar do id | `fluxo-principal` e `aparelhos` |
| M4 | remover aparelho sem limpar o `plano` | `aparelhos` |
| M5 | "Apagar tudo" deixa as `leituras` | `ajustes` |
| M6 | trocar de aba sem `startViewTransition` (tirar o `<ViewTransition>` da casca) | `fluxo-principal` (P-qa-1) e `transicoes` |
| M7 | tirar o bloco `prefers-reduced-motion` das view transitions no `globals.css` | `transicoes` |
| M8 | `console.error` num componente da `/casa/dicas` | `fluxo-principal` |
| M9 | `/casa/aparelhos` redireciona para `/casa` | `rotas` |
| M10 | `revalidate` da `/` para 3600 | `rotas` |
| M11 | `aria-label` da casa ilustrada volta ao texto antigo | `acessibilidade` (`label-content-name-mismatch`) |
| M12 | o editor não devolve o foco a quem abriu | `teclado` (P-qa-2) |
| M13 | `#comodo-<id>` não expande o cômodo | `comodos` (P-qa-3) |
| M14 | +2 KB num componente de `/sobre` (D15) | `peso-js`, com a tabela no relatório |
| M15 | `GITHUB_ACTIONS=true ATUALIZAR_PESO_JS=1` | `peso-js` falha e `git diff --exit-code apps/web/e2e/peso-js.json` fica limpo |
| M16 | `test.only` esquecido, com `GITHUB_ACTIONS=true` | a execução para com "focused item" (`forbidOnly`) |

### Critérios de aprovação (etapa 5)

1. Barreiras do projeto verdes: `pnpm typecheck` (cobre o `e2e/`), `pnpm test`, `pnpm build`, `pnpm audit --audit-level high`.
2. Numa cópia própria (porta própria): `pnpm test:e2e` verde nos 2 projetos, **0 erro de console**, e
   `pnpm test:e2e --repeat-each=3` também verde — com `retries: 0`, teste instável se descobre aqui, não no PR de alguém.
3. Tabela de cobertura acima: linhas 1–21 com o nome do teste e verdes; 22–23 aparecem como pendentes (`fixme`) no relatório.
4. N1–N7 no relatório como falha esperada; M1–M16 cada uma vermelha com a mensagem certa (resultado nesta história).
5. Axe: 0 sério/crítico fora de `excecoes-axe.ts`; a lista revisada pela ux; resumo do job com exceções e `incomplete`.
6. Peso: primeiro registro bate com a HIS-001 (11a do D8; 11b `/` 184 404, `/comecar` 184 404, `/casa` sem casa
   232 459, com casa 212 267 B, ±0 no mesmo código) e o do runner é comparado no A6.
7. Critério 4: o commit descartável do A6 deixa `playwright-report/index.html`, captura e `trace.zip` no artefato.
8. Critério 6: `pnpm test:e2e --list` dá a mesma lista no ambiente de nuvem e no CI.
9. Olhei as capturas de falha e o trace de pelo menos um teste de cada arquivo (o relatório precisa servir para quem
   investiga, não só para dizer "vermelho").

### Resultado da etapa 5 (qa, 2026-10-30)

Código: `020db92` (A7) com o `apps/web/src` do `92e9fd9`, numa cópia própria (`scratchpad/h2a/copia`, porta 3141) e as
mutações numa segunda cópia (`scratchpad/h2a/mut`, porta 3142), restaurada do repositório antes de cada caso. Nada
plantado no repositório.

**Rodadas sem mutação:** `pnpm test:e2e` → 107 passam (12 delas são os negativos com `test.fail()`), 6 pendentes
(3 `fixme` × 2 projetos), 0 falha, 6,2 min. `--repeat-each=3` → **321 passam, 18 pendentes, 0 falha** (12,9 min,
`retries: 0`). `pnpm test:e2e --list` igual com e sem `GITHUB_ACTIONS=true` (113 testes em 11 arquivos). Peso dentro do
limite: o máximo foi +36 B no 11a (`/casa`) e +80 B no 11b (as 4 rotas da casa e `/casa` com casa), contra +1 024/+2 048.

**Cobertura 1–21 → teste no relatório (todos verdes nas 3 rodadas):**

| # | Teste (`arquivo › nome`) |
| --- | --- |
| 1 | `fluxo-principal › fluxo principal: cadastro → acompanhamento → cômodos → dicas → minha casa → sobre → início` (2 projetos) |
| 2 | o mesmo + `aparelhos › salvar o editor sem mudar nada mantém ids e quantidades (acompanhamento e cômodos)` |
| 3 | `aparelhos › remover o aparelho que está no plano tira o aparelho e as dicas dele` |
| 4 | `migracao › casa da versão 2 abre, mostra os 6 cômodos e volta idêntica depois de recarregar` e `› casa da versão 1 vira versão 2 com contas, leituras e plano vazios e o resto igual` |
| 5 | `migracao › /comecar com casa mostra "Você já cadastrou a sua casa" e não muda a casa guardada` |
| 6 | `ajustes › apagar todos os meus dados esvazia a casa e volta para o início` |
| 7 | `rotas › /casa/aparelhos é página estática que redireciona para /casa/comodos (como no main)` e `› com casa, o navegador termina em /casa/comodos ao abrir /casa/aparelhos` |
| 8 | `rotas › as 8 rotas respondem 200` e `› as 8 rotas continuam pré-renderizadas e a / revalida a cada 86400 s (1 dia)` |
| 9 | `rotas › as 8 rotas continuam pré-renderizadas e a / revalida a cada 86400 s (1 dia)` |
| 10 | `fluxo-principal` (contador antes × depois de cada ação; mensagem "transições depois de: …") |
| 11 | `transicoes › topo e navegação têm nome de view transition próprio` (2 projetos) |
| 12 | `transicoes › com movimento reduzido › cada troca de aba dispara 1 transição, sem animação` (2 projetos) |
| 13 | fixture automática de `apoio/teste.ts` em todo teste + `sanidade › N1`, `N2`, `N8` (falha esperada) |
| 14 | `peso-js › medir <rota>` (7) e `› peso de JS dentro do limite da referência` |
| 15 | `peso-js › medir /casa (com casa)` |
| 16 | `teclado › cadastro só com teclado: o foco vai para o título de cada passo e o contorno aparece` (2 projetos) |
| 17 | `teclado › com a casa salva › folhas com teclado: editor (acompanhamento e cômodos) e "Anotar conta"` (2 projetos) |
| 18 | `teclado › com a casa salva › abas com teclado: Enter troca de aba e o contorno aparece` (2 projetos) |
| 19 | `acessibilidade › axe › axe · <página> · <estado>` (24 telas × 2 projetos = 48) |
| 20 | `comodos › pelo link do acompanhamento, o cômodo abre expandido e na tela` e `› direto pelo endereço, …` (2 projetos) |
| 21 | `comodos › ?visao=geral abre no "Painel geral"` (2 projetos) |

Linhas 22–23 aparecem como pendentes (`HIS-107 · …`, `HIS-108 · P1 …`, `HIS-108 · P3 …`), nos 2 projetos.

**Mutações (uma por vez; cada uma desfeita antes da próxima):**

| # | Mutação plantada | Resultado | Mensagem que a falha dá |
| --- | --- | --- | --- |
| M1 | `migrate` sem `plano: []` | **sobrevive — mutante equivalente** | — (ver abaixo) |
| M1b | `migrate` sem nenhum padrão (`salvo` como veio) | sobrevive — equivalente | — |
| M1c | ninguém cria o `plano` (nem o `migrate` nem o estado inicial) | morta pelo `pnpm build` | prerender de `/casa`: `Cannot read properties of undefined (reading 'filter')` |
| M1d | `migrate` perde os aparelhos da v1 | `migracao` (v1) vermelho | "Sua conta estimada por mês" não aparece |
| M2 | portão do `/comecar` desligado | `migracao` (portão) vermelho | Expected "Você já cadastrou a sua casa", Received "Em qual estado você mora?" |
| M3 | `atualizarAparelho` grava `novoId()` | `aparelhos` + `fluxo-principal` (2 projetos) vermelhos | `salvar pelo "Quem mais gasta" sem mudar nada` / `pelo "Quem mais gasta"` com o id diferente |
| M4 | `removerAparelho` sem limpar o `plano` | `aparelhos` vermelho | `dicas de Chuveiro elétrico no plano` |
| M5 | "Apagar tudo" deixa as `leituras` | `ajustes` vermelho | `casa depois de apagar`: `"leituras": 2` (ver ajuste abaixo) |
| M6 | casca sem `<ViewTransition>` (tela, traço e pílula) | `fluxo-principal` e `transicoes` (2 projetos) vermelhos | `transições depois de: aba Cômodos` 14 × 15; `uma transição por aba` 0 × 4 |
| M7 | sem o bloco `prefers-reduced-motion` das view transitions | `transicoes` (2 projetos) vermelho | `durações das animações: [[250,250,150,380,…]]` |
| M8 | `console.error` na `TelaDicas` | `fluxo-principal` (2 projetos) vermelho | `console.error em http://127.0.0.1:3142/casa/dicas: M8 plantado…` |
| M9 | `/casa/aparelhos` → `/casa` | `rotas` (2 testes) vermelho | Expected "/casa/comodos", Received "/casa" |
| M10 | `revalidate` da `/` = 3600 | `rotas` vermelho | Expected 86400, Received 3600 |
| M11 | `aria-label` da casa ilustrada volta ao antigo | `acessibilidade` (`/` sem e com casa) e o teste dos nomes, 2 projetos (6) | `label-content-name-mismatch (serious): button[aria-label="Quarto: R$ 21,74 por mês"] …` |
| M12 | a folha tira o foco ao fechar (Esc e Salvar) | `teclado` (folhas, 2 projetos) vermelho | `o foco volta para quem abriu a folha` |
| M13 | `#comodo-<id>` não expande | `comodos` (link e endereço, 2 projetos) vermelho | `aria-expanded` Expected "true", Received "false" |
| M14 | ~3 KB que não comprimem num componente de cliente só da `/sobre` | `peso-js` vermelho, com a tabela | `/sobre · jsDoHtml: 143074 B, 3500 B acima da referência (limite +1024 B)`; 11b +3 515 |
| M15 | `GITHUB_ACTIONS=true ATUALIZAR_PESO_JS=1` | `peso-js` vermelho; `peso-js.json` com o mesmo sha256 antes e depois | `ATUALIZAR_PESO_JS no CI: a referência só muda num PR…` |
| M16 | `test.only` no `rotas`, com `GITHUB_ACTIONS=true` | a execução para antes de rodar | `item focused with '.only' is not allowed due to the 'forbidOnly' option` |

- **M1 é equivalente, não lacuna do teste.** O `persist` do zustand junta o que estava salvo **por cima do estado
  inicial** (`merge` padrão: `{ ...inicial, ...salvo }`), e o estado inicial já tem `contas`, `leituras` e `plano`
  vazios. Para uma casa v1 (que nunca teve `plano`), tirar o `plano: []` do `migrate` — ou todos os padrões (M1b) — dá
  a mesma casa, byte a byte, e nenhum teste pode (nem deve) notar. O que quebraria quem já usa de verdade é ninguém
  criar o plano (M1c, que o build já pega) ou a migração perder dados (M1d, pego pelo `migracao`). Os padrões do
  `migrate` ficam como defesa se um dia o `merge` mudar; não peço mudança.
- **Ajuste no `ajustes.spec.ts`** (único teste mudado na etapa 5): a primeira rodada do M5 falhava com
  `listas: [0, 0, 0, 2, 0]`, sem dizer que lista sobrou. A conferência agora tem o nome de cada lista
  (`"leituras": 2`); verde 3 de 3 depois da troca.
- Saídas: `scratchpad/h2a/saida-a5c.txt` (rodada única), `saida-repeat3.txt`, `mutacoes/M*.txt` e `M*.diff` (o que foi
  plantado), `lista-local.txt`/`lista-ci.txt`. Roteiro: `scratchpad/h2a/mutacoes.sh`.

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
- [x] `[para: ux-acessibilidade]` (tech-lead, 2026-10-29 — bloqueia o passo A5, não o início) Texto do nome acessível
  dos 5 botões da casa ilustrada da `/`, para incluir a porcentagem que aparece (hoje `aria-label="Quarto: R$ 21,74 por
  mês"` e a tela mostra também "19%"; axe `label-content-name-mismatch`). E revisar a lista de exceções do axe quando o
  qa a montar.
  — **Respondida (ux-acessibilidade, 2026-10-29)** em "Fluxo e textos", "Nomes acessíveis dos 5 cômodos": modelo e os 5
  textos finais. Caixa marcada pelo tech-lead em 2026-10-30; o A5 usa esses textos (D16, "UX"). A revisão de
  `excecoes-axe.ts` continua para o A5.
- `[para: seguranca]` lista dos 21 casos (critério 7) — **movida para a [HIS-002b](HIS-002b-lint-e-camadas.md)**
  (scrum-master, 2026-10-29); bloqueia a implementação da 002b, não a desta.
- [x] `[para: tech-lead]` (qa, 2026-10-29 — **bloqueia o A7** (tirar o `e2e-base`), não o A1; cada item diz em que passo
  entra) Lacunas do D9/D10 em relação ao `linha-de-base.cjs` e ao manual da HIS-001 (tabela "Cobertura" no "Plano de
  testes"). Proposta:
  1. **P-qa-1 · Transição por passo (A2/A3).** No `fluxo-principal`, ler o contador de `startViewTransition` antes e
     depois de cada ação e afirmar a variação: +1 por passo do cadastro, 0 na troca "Por cômodo/Tudo junto", 0 ao abrir
     e fechar folhas, +1 por aba e por link — **inclusive `/sobre` → `/`**, que o D7 diz que prova o B6 da HIS-002b e
     que o D9 não cobre. No `transicoes`, com `reduce`: +1 por troca de aba **e** as animações de view transition com
     duração 0, lidas no `transition.ready` (**medido**: 250 ms × 5 sem `reduce`, 0 × 5 com; sem espera fixa).
  2. **P-qa-2 · `teclado.spec.ts` (A3, 2 projetos).** Cadastro só com teclado até `/casa` (foco no `h1` de cada passo,
     contorno visível em campo, botão e opção); folhas do editor (pelo "Quem mais gasta" e pelos cômodos) e "Anotar
     conta": Enter abre, foco dentro do `<dialog>`, `Esc` fecha, foco volta para quem abriu; abas por Enter.
     `test.fixme` para P1 (HIS-108). Sem isso, o que o `manual-qa.cjs` cobria some com o scratchpad.
  3. **P-qa-3 · `comodos.spec.ts` (A3, 2 projetos).** `#comodo-<id>` pelo link do acompanhamento e direto pelo
     endereço: a seção existe, `aria-expanded="true"`, está na tela; `?visao=geral` abre no "Painel geral".
     `test.fixme` para P3 (alinhar ao topo, HIS-108).
  4. **P-qa-4 · Mais estados no axe (A5).** Além dos 13 do D10: os 7 passos do cadastro depois do estado (cidade,
     benefício, pessoas, cômodos, um cômodo, revisão, conta), `/casa/comodos?visao=geral` e 3 folhas abertas (editor de
     aparelho, "Anotar conta", "Anotar leitura") — 24 × 2 projetos. Hoje, de 8 passos do cadastro só o primeiro passa
     pelo axe, e nenhum diálogo; o cadastro é a primeira coisa que a família faz.
  5. **P-qa-5 · Peso e rotas (A1/A4).** 11b também de `/casa` **com casa** (a HIS-001 media: 13 arquivos × 15 sem casa;
     entra como `"/casa (com casa)"` no `peso-js.json`, só `totalComPrefetch`, porque o HTML é o mesmo). No `rotas`,
     afirmar que as 8 rotas estão em `routes` do `prerender-manifest.json` (a HIS-001 comparava a lista).
  6. **P-qa-6 · `sanidade.spec.ts` (A1, só celular).** N1–N7 do "Plano de testes" com `test.fail()` (medido: funciona
     como negativo permanente). Pede que `aplicarExcecoes` (axe) e `compararPeso` (peso) sejam funções puras exportadas
     do `apoio/`. `SO_NO_CELULAR` ganha `sanidade`; `teclado` e `comodos` rodam nos dois projetos.
  7. **P-qa-7 · Exceção do axe mais estreita (A5).** `alvo` como seletor CSS, conferido com `elemento.matches(alvo)` no
     navegador, mais `nos: N` exato. Hoje "trecho do seletor" casa por texto o seletor que o axe gera (muda com o DOM
     e pode cobrir elementos novos com o mesmo defeito em silêncio); com `nos`, um 6º elemento com contraste ruim falha
     e um a menos vira "exceção velha".
  8. **P-qa-8 · (opcional; seguranca opina) Nada sai do aparelho (A1).** A fixture automática também reprova pedido para
     host diferente de `127.0.0.1` (`page.on("request")`): é o princípio 5 do produto virando barreira — um script de
     análise ou uma fonte de CDN que entrasse por engano seria pego no PR. Negativo N8: `fetch("https://exemplo.com")`.
     — **seguranca (2026-10-29): não é opcional — é a mitigação da Aa11** ("Ameaças"), entra no A1. Ouvir no
     **contexto** (`context.on("request")`, pega também janela nova e worker), sem `route` (não mexe no 11b); liberar só
     `http://127.0.0.1:<PORTA>`, `data:` e `blob:`; a URL vai na mensagem. N8 permanente de acordo.

  Custo estimado: +0,5 dia na HIS-002a (teclado, cômodos, estados do axe, sanidade); +~40 s no job `e2e`.
  — **Resposta (tech-lead, 2026-10-30):** os 8 **aceitos**; a P-qa-7 com um ajuste que a une à Aa14 (uma exceção = um
  elemento, seletor CSS com exatamente 1 elemento, sem campo `nos`); a P-qa-8 é obrigatória no A1. Detalhes e passo de
  cada um no **D16**; estimativa revista no D12 (+0,5 dia aceito).

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

### [qa] 2026-10-29 — D9 e D10 revisados pelo qa, com observações; 8 pontos para o tech-lead; plano de testes escrito
- O que fiz: li a história inteira (com a nota da ux), a HIS-002b, o ADR-003, a retro e a HIS-001 (§10, R13, plano e
  resultado da etapa 5). Comparei linha a linha o D9/D10 com o meu `linha-de-base.cjs` e com o roteiro manual da etapa 5
  (`manual-qa.cjs`, que só existe no scratchpad). Conferi no código: movimento reduzido zera as view transitions
  (`globals.css`) e o `useValorAnimado` pula para o valor final; as 8 rotas estão no `prerender-manifest.json`.
  Protótipo em `scratchpad/qa-his002/prova/` (pacotes 1.63.0/4.14.0 da cópia do tech-lead, sem tocar nela nem na branch).
- Decisões e porquê:
  - **Revisado pelo qa, com observações**: estrutura, relógio real, nada de R$ afirmado, saída do `e2e-base` com o
    comparador — de acordo. Observações no "Plano de testes" (datas relativas, fixtures nunca regeradas, `celular` sem
    `isMobile`, regex nos nomes da ux, axe só depois de conferir a tela certa e com `passes > 0`).
  - **Lacunas** (tabela "Cobertura", 26 linhas): transição por passo (com `/sobre` → `/`, que o B6 da 002b usa), teclado
    e foco das folhas, `#comodo-<id>`, `?visao=geral`, axe no cadastro e nas folhas, 11b com casa → pergunta
    `[para: tech-lead]` com P-qa-1 a P-qa-8. Bloqueiam o A7, não o A1.
  - **Negativo permanente com `test.fail()`** (N1–N7, `sanidade.spec.ts`): **medido** — barreira inteira → código 0;
    fixture e axe desligados → "Expected to fail, but passed" e código 1. Mais 16 mutações plantadas (M1–M16) uma vez,
    na etapa 5, com resultado escrito aqui.
  - **Saem com decisão:** avisos de `htmlSize` e `sha256` de `public/dados` (serviam ao byte a byte). Zoom 200% e P1/P3
    ficam como `test.fixme` com HIS-107/HIS-108; P4 sem teste.
- Arquivos alterados: esta história ("Plano de testes", uma pergunta em "Perguntas abertas", esta nota); a HIS-002b
  (D6); minha pasta. Nenhum código.
- Para o próximo: **tech-lead** — responder P-qa-1 a P-qa-8 (P-qa-8 com a **seguranca**). **ux-acessibilidade** — os
  nomes da tabela entram no `fluxo-principal`/`acessibilidade` por regex; chamo para revisar `excecoes-axe.ts` no A5.
  **Etapa 4:** eu escrevo os testes (A1–A5) seguindo o plano; o A7 só depois da tabela de cobertura toda verde.

### [seguranca] 2026-10-29 — análise de ameaças da HIS-002a (etapa 3): aprovado para implementar
- O que fiz: li a história inteira (com o plano do qa e o texto da ux), o ADR-003, a retro e o `ci.yml`/`atualizar-dados.yml`
  de hoje. Conferi no registro (`npm view`) os 5 pacotes do navegador: mantenedores da Microsoft e da Deque, **nenhum
  script de instalação**. Conferi que as fontes são locais (o site não busca nada fora) e que o `ci.yml` atual não tem
  `permissions`. Escrevi "Ameaças" (Aa1–Aa18) e a conferência da etapa 6 (Ra1–Ra13); respondi a P-qa-8.
- Decisões e porquê: **aprovado para implementar** — nenhuma ameaça crítica; as altas (Aa4 audit, Aa7 gatilho, Aa8
  injeção no `run:`) só existem se o desenho mudar e viram conferência. Entram no desenho, sem custo de prazo:
  `persist-credentials: false` no checkout (Aa6); fixture "nada sai do aparelho" no A1 (Aa11, era a P-qa-8 opcional —
  agora obrigatória, porque é o princípio 5 do produto virando barreira); `NEXT_TELEMETRY_DISABLED: 1`; limites de peso
  como constantes no spec e `git diff --exit-code` no fim do job `e2e` (Aa13); axe sem `disableRules`/`withTags`/
  `exclude()` e exceção que cobre mais de um nó = erro (Aa14). **Recomendado no A6:** fixar as 4 actions por SHA (Aa9,
  médio); se ficar na HIS-003, ela fecha antes do E4.
- Arquivos alterados: esta história ("Ameaças", uma resposta na P-qa-8, esta nota); a HIS-002b; minha pasta. Nenhum código.
- Para o próximo: **qa/frontend (etapa 4)** — seguir Aa6, Aa10, Aa11, Aa13 e Aa14; no A6, mandar para mim o artefato do
  commit descartável (Ra9). **tech-lead** — decidir Aa9 (SHA agora ou HIS-003). **scrum-master** — se Aa9 for para a
  HIS-003, anotar lá "antes do E4".

### [tech-lead] 2026-10-30 — revisões de qa, seguranca e ux decididas (D16); ADR-003 aceito; 002a liberada para a etapa 4
- O que fiz: reli as duas histórias inteiras (com "Ameaças", "Plano de testes" e "Fluxo e textos"), o ADR-003 e a minha
  pasta. Decidi cada ponto no novo **D16** e levei as decisões para os lugares do contrato, com edição pontual: D9
  (estrutura e `SO_NO_CELULAR`), D10 (`alvo` da exceção), D11 (`ci.yml`), D12 (estimativa), D13 (passos A1–A7 com as
  conferências Ra1–Ra13), D14 (2 riscos). Marquei as duas perguntas como respondidas. Registrei na linha da HIS-110 do
  `docs/planejamento.md` o ponto `corDaParte` × `faixaDoPeso` para o scrum-master. ADR-003 → "aceito".
- Decisões e porquê:
  - **P-qa-1 a P-qa-8: aceitos.** Ajuste na P-qa-7, unida à Aa14: uma exceção = um elemento (seletor CSS com exatamente 1
    elemento, sem campo `nos`), para não haver número a manter e um elemento novo com o defeito falhar sozinho. P-qa-8 =
    Aa11, obrigatória no A1, origem tirada do `baseURL`. Cada negativo do `sanidade` entra no passo da sua barreira.
  - **Aa9: SHA já no A6.** O `ci.yml` é reescrito de qualquer forma e passa a ser o portão do `main`. As majors subiram
    (checkout v7.0.1, action-setup v6.1.0, setup-node v7.1.0, upload-artifact v7.0.2); SHA conferidos por `git ls-remote`
    e `action.yml` lido; nenhuma quebra nos atinge. Dependabot de actions e o `atualizar-dados.yml` ficam na HIS-003.
  - **`persist-credentials: false`, `NEXT_TELEMETRY_DISABLED`, limites como constantes em `apoio/peso.ts`, último passo
    `git diff --exit-code && git status --porcelain` vazio, axe sem filtro, `historia` existente no planejamento:
    aceitos.** Ra1–Ra13 aceitas e distribuídas nos passos; a Ra10 vira o N8 permanente.
  - **UX:** o A5 usa o modelo e a tabela da ux, mantendo o `reais()` local (põe U+00A0 depois do "R$"; o `formatarReais`
    troca por espaço comum e o nome ficaria diferente do que se vê). Como os valores da casa ilustrada são constantes do
    exemplo, o e2e confere os números da tabela com `\s` no lugar do espaço.
  - **Estimativa:** 002a ≈ 2,75 dias (+0,5 do qa aceito); 002b ≈ 2–2,5 dias. As duas continuam M.
- Arquivos alterados: esta história; `HIS-002b-lint-e-camadas.md`; `docs/equipe/decisoes/ADR-003-qualidade-automatica.md`
  e `README.md`; `docs/planejamento.md` (linha da HIS-110); `docs/equipe/quadro.md`; minha pasta. Nenhum código.
- Como verifiquei: `git ls-remote --tags` das 4 actions e clone raso de cada etiqueta no scratchpad (entradas e notas
  de versão); no `axe-core` 4.14.0 da minha cópia, `label-content-name-mismatch` sem a tag `experimental` (roda no
  padrão); `.gitignore` ignora `next-env.d.ts` e `.next/` (o passo "nada mudou" não acusa à toa); `node -e` mostrou que o
  Intl dá `R$ 21,74` e que o `formatarReais` troca o U+00A0.
- Para o próximo: **HIS-002a liberada para a etapa 4.** **qa** — A1 a A5 seguindo o D16 (começa pelo A1 com a fixture
  de rede e o `sanidade`); **frontend** — no A5, o commit próprio com o `aria-label` e o `<dl>`; **ux-acessibilidade** —
  revisar `excecoes-axe.ts` no A5; **seguranca** — receber o artefato do A6 (Ra9). **scrum-master** — decidir o ponto
  da HIS-110 (`corDaParte` × `faixaDoPeso`) antes de ela começar e conferir que a HIS-003 cobre o Dependabot de
  `github-actions` e o `atualizar-dados.yml`.

### [frontend] 2026-10-30 — A5: correções sem mudança visível (`aria-label` da casa ilustrada e `<dl>` da Tarifa Social)
- O que fiz: commit próprio `b0bff1c` só com `apps/web/src`. (1) `CasaIlustrada.tsx`: `aria-label` exatamente o modelo
  da ux, com o `reais()` local (U+00A0 depois do "R$", D16). (2) `PaginaInicial.tsx`: o `<p>` do CRAS saiu do `<dl>`;
  um `<div class="grid gap-6 self-center">` envolve o `<dl class="grid gap-6">` (os 2 cartões) e o `<p>` — mesmo
  espaço entre os 3 blocos, mesma ordem de leitura.
- Decisões e porquê:
  - **Achado: o texto da ux sozinho não zera o `label-content-name-mismatch`.** O axe 4.14.0 monta o texto visível
    juntando os filhos **sem espaço** (`visibleVirtual` faz `join('')`): `<span>Quarto</span><span>19%</span>` vira
    "quarto19%", um token só, que não está em nenhum nome. Medido: com só o `aria-label` novo, os 5 nós continuavam.
    Correção sem mudança visível: `{" "}` entre os dois `<span>` (entre itens flex, texto só de espaço não é desenhado —
    confirmado pelas capturas). O texto da ux não mudou.
  - `display: contents` no `<dl>` recusado: já tirou a semântica de listas em navegadores; duas grades `gap-6` dão o
    mesmo resultado sem esse risco.
- Como verifiquei (cópias próprias em `scratchpad/fe-his002/antes` = `HEAD` anterior, porta 3121, e `…/depois`, porta
  3122; `git archive` + `pnpm install --offline` + `pnpm build`; liberadas com `fuser -k`):
  - `/` em 390 e 1280 px, sem e com a casa v2: **0 pixel diferente** nas 4 capturas de página inteira, caixas de
    `dt`/`dd`/`p` da faixa iguais, `ariaSnapshot` da faixa igual, console sem erro nem aviso. Antes, uma execução de
    **controle** (antes × antes) para validar o comparador: no começo dava diferença à toa (a `Contagem` e o `Revelar`
    pegos no meio; o `clock.setFixedTime` trava a `Contagem`), corrigido com rolagem lenta, animações paradas por CSS
    igual nas duas versões e espera até o texto visível da `Contagem` igualar o do leitor de tela → controle 0 px 3×.
  - Nome acessível pela árvore do Chromium (CDP `Accessibility.getFullAXTree`) e pelo `ariaSnapshot`: os 5 iguais à
    tabela da ux; o seletor do D16 (`/^Quarto, 19% da conta, R\$\s21,74 por mês$/` e os outros 4) acha 1 botão cada.
  - axe 4.14.0 (da cópia do tech-lead, só leitura; nada instalado no repositório) na `/` estável: **somem**
    `definition-list` e `label-content-name-mismatch` (5 nós passam); sobra só `color-contrast` (sério, HIS-110) e
    `landmark-one-main`/`region` (moderados, informativos).
  - `pnpm typecheck` e `pnpm test` verdes.
  - Capturas: `scratchpad/fe-his002/telas/{antes,depois}-{celular,computador}-{sem,com}-casa.png`; relatório em
    `scratchpad/fe-his002/relatorio.json`.
- Para o **qa** (A5): o `color-contrast` estável da `/` tem **4 nós, não 2**: as pílulas de Quarto e Cozinha
  (faixa D) **e** os dois `<dd class="mt-2 text-white/85">` dos cartões "Tarifa Social" e "Desconto Social" (branco 85%
  sobre `bg-white/10` em cima do `bg-energia`). Também mudança de cor → HIS-110 (decidir com ux/scrum-master se esses
  dois entram nela). Sem rolar e parar as animações, aparecem mais 2 falsos (nomes de Cozinha e Lavanderia na animação
  `acende`). Testar: nomes por regex da tabela, axe da `/` sem `definition-list` nem `label-content-name-mismatch`.
- Para o próximo: **qa** — seguir o A5 com estes nomes e os 4 nós de contraste; **ux-acessibilidade** — saber dos 2
  `dd` na HIS-110 ao revisar `excecoes-axe.ts`.

### [qa] 2026-10-30 — etapa 4: A1–A4 feitos e A5 com os testes prontos; A5 devolvido ao frontend com 2 defeitos novos
- O que fiz: implementei A1–A5 pelo D9–D16, numa **cópia própria** (`scratchpad/h2a/copia`: `git archive` + `pnpm
  install --offline`, porta 3141, `src` do `main` até o A4 e do `HEAD` com o `b0bff1c` no A5). Commits:
  `06be352` (A1), `9156363` (A2), `6ec68c7` (A3), `e84edad` (A4), `f527b5b` e `c6bbc17` (A5, só testes, mais a linha
  da HIS-110 no planejamento). Nenhum arquivo de `apps/web/src` mudou nos meus commits.
- Resultado (rodada final, `HEAD`): **113 testes em 11 arquivos**, 4,2 min com 1 worker; 104 passam (12 são os
  negativos N1–N8 com `test.fail()`, todos "falha esperada"), 6 pendentes (3 `fixme` × 2 projetos), **3 falham** com os
  2 defeitos abaixo. `pnpm typecheck` (cobre `e2e/` e `playwright.config.ts`; erro plantado → código 2) e `pnpm test`
  (48) verdes.
- Conferências: **Ra1** só em `devDependencies` de `apps/web`, 1.63.0 e 4.14.0 exatas (o `pnpm why` mostra o
  `@playwright/test` também como par **opcional** do `next`, que já o declara); **Ra2** lockfile sem `tarball`/`git+`
  (0), `onlyBuiltDependencies` igual; **Ra3** 95 pacotes, só `esbuild` com `postinstall`; **Ra4** `pnpm audit
  --audit-level high` → "No known vulnerabilities found"; **Ra5** `src` sem `playwright`/`axe-core` e `.next/static`
  sem `axe-core` (ver o achado do caminho do `next` abaixo); **Ra11** JSON sem limite, M15 (`GITHUB_ACTIONS=true
  ATUALIZAR_PESO_JS=1`) reprova e o JSON fica intacto; **Ra12** `grep` vazio e exceção com alvo de 2 elementos reprova
  (N5); **Ra13** `-H 127.0.0.1` e `reuseExistingServer: false`. Cada negativo foi conferido desligando a sua barreira
  numa cópia (console, `pageerror`, axe, vigia de rede → "Expected to fail, but passed", código 1).
- **Peso (A4).** Referência em `e2e/peso-js.json`, medida com o código do site igual ao `main` e o lockfile do A1:
  11a `/` 164 215, `/comecar` 172 560, `/casa` 175 055, `/casa/comodos` 172 949, `/casa/dicas` 166 021, `/casa/ajustes`
  163 963, `/sobre` 139 574; 11b 184 415 (`/`, `/comecar`), 232 482 (as 4 da casa sem casa), 168 342 (`/sobre`),
  212 282 (`/casa` com casa). O **mesmo spec no build do `main`** dá os números da HIS-001 byte a byte (164 212 …
  212 267); dois builds do mesmo código dão ±0. A diferença de −5 a +23 B vem **só do lockfile**: o `next` passa a
  ficar em `.pnpm/next@16.4.3_@playwright+test@1.63.0_…` e o build embute esse caminho num chunk
  (`u.ab="/ROOT/node_modules/.pnpm/next@…"`). É também a única ocorrência de "playwright" em `.next/static` — nome de
  pasta, nenhum código. **[para: seguranca]** a Ra5 parte 2 precisa ignorar esse caminho (o `grep -rl` cru acha 1
  arquivo). Correção do frontend (`b0bff1c`): +15 B no 11a da `/` e no 11b de todas (limites +1 024/+2 048).
- Achados e desvios:
  - **`/casa/aparelhos` só redireciona com casa** (sem casa a `Casca` mostra "Vamos cadastrar" e a página não roda):
    igual ao `main`; o `rotas` testa com a casa v2. Fixtures copiadas já no A1 (sha256 iguais) por isso.
  - **P3 é mais largo que o registrado:** direto pelo endereço numa página nova o cômodo **também** para a 371 px
    (celular) / 491 px (computador) do topo; os 112 px da HIS-001 eram uma navegação só de âncora na mesma página. O
    `fixme` "HIS-108 · P3" cobre as duas entradas (vale anotar na HIS-108).
  - Os 3 `fixme` falham hoje com os números da HIS-001 (zoom: 254 e 211 px em 195; P1: foco passa pela busca; P3: 371 px).
  - Estrutura: além do D9, `apoio/transicoes.ts` (contador e durações no `transition.ready`) e `apoio/telas.ts` (aba
    visível, diálogo, datas relativas). `apoio/axe.ts` nasceu no A1 (o N3 precisa dele). `ExcecaoAxe.estado` aceita os
    13 estados das 24 telas (`TELAS_AXE`), não só "sem/com casa": uma exceção de um passo do cadastro não pode virar
    "exceção velha" nos outros 7 estados de `/comecar`. O N7 está no `sanidade` usando o site (precisa das transições).
  - "São Paulo" digitado no `<select>` às vezes para em "SC": o `teclado` usa as setas (determinístico).
- **Defeitos (devolvido para frontend, com ux no texto), A5 continua vermelho por eles — os dois se corrigem sem
  mudança visível, então são desta história (critério 3):**
  1. **D-A5-1 · `label-content-name-mismatch` (sério)** nos 6 botões do "Quem mais gasta" em `/casa` com casa, 390 e
     1280 px. Passos: `PORTA_E2E=31xx pnpm test:e2e -g "axe · /casa · com casa"`. Esperado: 0 sério. Obtido: o
     `aria-label` (`PainelAcompanhamento.tsx:161`) começa com "Chuveiro elétrico: R$ 44,26 por mês, 42% da conta…",
     mas o texto visível é "Chuveiro elétrico em Banheiro · 4 banhos de 8 min por dia · 41% · R$ 45,12". Gravidade:
     média (comando de voz não acha o botão). Precisa de texto da **ux** (como o da casa ilustrada).
  2. **D-A5-2 · `scrollable-region-focusable` (sério)** na tabela do "Painel geral" (`TelaComodos.tsx:264`,
     `div.overflow-x-auto`), só em 390 px. Passos: `pnpm test:e2e --project=celular -g "visao=geral"`. Esperado: 0
     sério. Obtido: região com rolagem para o lado que o teclado não alcança. Gravidade: média (quem usa teclado não
     vê as colunas da direita). Correção típica: `tabIndex={0}` + nome acessível na região (contorno só no foco).
- Exceções (`excecoes-axe.ts`, para a **ux** revisar): 4 `color-contrast` na `/`, sem e com casa (8 entradas), todas
  HIS-110 — pílulas de Quarto e Cozinha e os 2 `<dd>` `text-white/85` dos cartões "Tarifa Social" e "Desconto Social"
  (acrescentados na linha da HIS-110 em `docs/planejamento.md`). Nenhuma velha nem com mais de 1 elemento, nos 2 projetos.
- Evidências: capturas do fluxo anexadas ao relatório (`fluxo-principal`: acompanhamento, cômodos, dicas, sobre);
  saída da rodada final em `scratchpad/h2a/saida-final.txt`; capturas e traces das 3 falhas em
  `scratchpad/h2a/copia/apps/web/test-results/`.
- Para o próximo: **frontend** + **ux-acessibilidade** — D-A5-1 e D-A5-2 (commit próprio em `apps/web/src`); depois,
  `pnpm test:e2e` verde fecha o A5. **ux** — revisar `excecoes-axe.ts`. **seguranca** — Ra5 parte 2 com o caminho do
  `next`. **tech-lead** — A6 (`ci.yml`) pode começar em paralelo; o artefato terá a tabela do peso e as exceções.

### [ux-acessibilidade] 2026-10-30 — textos do D-A5-1 e do D-A5-2 (sem mudança visível)
- O que fiz: escrevi em "Fluxo e textos" o nome acessível dos 6 botões do "Quem mais gasta" (D-A5-1) e o nome e o
  foco da região rolável da tabela do "Painel geral" (D-A5-2).
- D-A5-1: `aria-label` = todo o texto visível, na ordem do código (quantidade, nome, "em" cômodo, porcentagem, uso,
  valor), e depois "por mês. É NN% da conta. Toque para ajustar.". Conferi no axe 4.14: ele compara palavra por
  palavra, em sequência, então nada pode entrar no meio. Mesmas variáveis para a tela e o nome (o relatório do qa
  mostra 41% e R$ 45,12 na tela, mas 42% e R$ 44,26 no nome; **[para: frontend]** confira se vêm da mesma renderização).
- D-A5-2: `role="region"`, `aria-label="Tabela com todos os aparelhos da casa"`, `tabIndex={0}` sempre; foco com o
  contorno padrão (só aparece com teclado); setas rolam.
- Observação fora desta história **[para: scrum-master]**: o contorno de foco amarelo-faísca (#ffc629) dá cerca de
  1,6:1 sobre o branco e 1,4:1 sobre o fundo (WCAG 1.4.11 pede 3:1). Vale para o site todo e muda a tela, então
  proponho uma história própria (ex.: contorno duplo tinta + faísca).
- Para o próximo: **frontend** aplica os dois (commit em `apps/web/src`); **qa** roda o A5 de novo.

### [frontend] 2026-10-30 — D-A5-1 e D-A5-2 corrigidos sem mudança visível; A5 verde, 1 seletor do qa a ajustar
- O que fiz: commit `92e9fd9`, só em `apps/web/src`. **D-A5-1** (`PainelAcompanhamento.tsx`): `aria-label` igual ao
  modelo da ux, com as mesmas variáveis (`quantidade`, `nomeComodo`, `porcentagem`, `uso`, `valor`) para a tela e o nome,
  e `{" "}` entre os blocos do botão (o axe junta o texto dos filhos sem espaço; entre itens de bloco ou flex o espaço
  não aparece). **D-A5-2** (`TelaComodos.tsx`): `role="region"`, `aria-label="Tabela com todos os aparelhos da casa"` e
  `tabIndex={0}` no `div.overflow-x-auto`, com o contorno padrão do `:focus-visible`.
- **[para: ux-acessibilidade]** tela e nome sempre vieram da mesma renderização. A diferença no relatório (41% e
  R$ 45,12 na tela, 42% e R$ 44,26 no nome) deve ser de rodadas diferentes, com outro relógio e outra bandeira. Hoje, sem
  relógio fixo, os 6 nomes e o texto visível dão os mesmos números (ex.: "Chuveiro elétrico em Banheiro, 42%, 4 banhos
  de 8 min por dia, R$ 44,26 por mês. É 42% da conta. Toque para ajustar.").
- Como verifiquei (cópias próprias `scratchpad/fe-a5/{antes,depois}`, portas 3151/3152/3153, liberadas):
  - `/casa` e `/casa/comodos?visao=geral` com a casa v2, em 390 e 1280 px: **0 pixel diferente** nas 4 capturas de
    página inteira e o mesmo texto visível. Antes rodei o controle (antes × antes), que deu 0 px e mostrou os 2 defeitos.
  - axe 4.14.0: `label-content-name-mismatch` foi de 6 nós para 0 (6 passam) e `scrollable-region-focusable` foi de 1
    para 0 (1 passa). Console sem erro.
  - Teclado em 390 px: o Tab chega à região, o contorno aparece (3 px faísca) e a → rola 40 px por toque até o fim
    (186 px), mostrando "R$/mês". Captura em `scratchpad/fe-a5/telas/depois-celular-geral-setas.png`.
  - `pnpm typecheck` e `pnpm test` verdes. e2e completo (`PORTA_E2E=3153`): **106 passam, 6 pendentes (os 3 `fixme`
    × 2 projetos), 1 falha**. O axe de `/casa` com casa e o de `?visao=geral` passam **nos 2 projetos**.
- **[para: qa]** a falha é `aparelhos.spec.ts:43`, cujo seletor procura o nome antigo (`^${aparelho.nome}: `). O nome
  agora começa por "`<nome> em <cômodo>,`" (e por "`N × `" quando há mais de um aparelho igual). Com
  ``new RegExp(`^${aparelho.nome} em .*Toque para ajustar\\.$`)``, só na minha cópia, o arquivo passa (2 de 2). Não
  mudei `e2e/` porque o arquivo é seu.
- Para o próximo: **qa**: ajustar o seletor e rodar o A5 de novo para fechar.

### [tech-lead] 2026-10-30 — A6: `ci.yml` com os dois jobs do D11, actions por SHA reconferidas hoje
- O que fiz: reescrevi `.github/workflows/ci.yml` pelo D11/D16. Checks: **"Lint, tipos e testes"** (job `verificar`:
  `typecheck` e `test`; o `pnpm lint` entra no B3 da 002b com o mesmo nome) e **"Navegador (e2e, axe e peso)"** (job
  `e2e`: Chromium, `pnpm build`, `pnpm test:e2e`, artefato, "nada mudou"). O build saiu do `verificar`.
- Decisões e porquê: `--only-shell` mantido (D11): o headless usa o `chromium_headless_shell-1243`, o mesmo do
  ambiente. Artefato `relatorio-e2e` com `if: !cancelled()`, 14 dias, só `apps/web/playwright-report/` e
  `apps/web/test-results/`. Os testes já escrevem o peso e as exceções do axe no `$GITHUB_STEP_SUMMARY`; acrescentei
  um passo `if: failure()` que diz no resumo onde está o artefato.
- SHA reconferidos hoje (`git ls-remote --tags`), iguais ao D16 e ainda as últimas versões: checkout v7.0.1
  `3d3c42e5aac5ba805825da76410c181273ba90b1`; pnpm/action-setup v6.1.0 `ea17c68df8912ef543352723c149a84f56e3d413`
  (linha `^{}`; a etiqueta anotada é `d9184bf1…`); setup-node v7.1.0 `949feb2413d6458794dcd2491c4babbbce0c15c1`;
  upload-artifact v7.0.2 `cf430e030ddbb5b0abf93d22962f4752f3646cd9`.
- Como verifiquei: YAML lido com `yaml.safe_load` e conferido por script (gatilhos, chaves dos passos, SHA de 40
  caracteres, `persist-credentials: false` nos dois checkouts). Ra6: uma linha `permissions:`, nenhum `secrets.`,
  `pull_request_target` ou `workflow_run`. Ra7: `${{` só em `concurrency` e `if:`. Ra13: `NEXT_TELEMETRY_DISABLED`
  presente. O `actionlint` não foi usado (baixar o binário foi bloqueado aqui). Simulei o job numa cópia própria
  (`git init`, `--frozen-lockfile --offline`, build, `GITHUB_ACTIONS=true`, porta 3161): 106 passam, 6 pendentes,
  1 falha (o `aparelhos.spec.ts:43`, seletor que o qa já está trocando). O resumo saiu com o peso e as exceções, e o
  "nada mudou" deu limpo depois do build e do e2e. O e2e levou 4,3 min com 2 workers numa máquina de 2 CPUs, então o
  job fica em ~6–7 min (antes eu estimava ~4).
- **[para: seguranca]** (Ra9): o `grep` da Ra9 acha `AKIA` no `playwright-report/index.html`. É falso positivo: são
  dados em base64 embutidos (`…PAKIACoFCsGSE…`), sem a forma de chave da AWS. Para não confundir, usar
  `AKIA[0-9A-Z]{16}`.
- Para o próximo: **quem orquestra**: empurrar depois do seletor do qa, conferir os 2 checks verdes, o artefato e o
  peso do runner × local (D14). Depois, o commit descartável com teste falhando (critério 4, Ra9) e a reversão.
  **seguranca**: Ra9 com o artefato. **qa**: A7.

### [qa] 2026-10-30 — A5 fechado, A7 feito, etapa 5 aprovada (pendentes: revisão da ux e as conferências do A6 no CI)
- O que fiz: (1) **A5** — `d5a4940`: o `aparelhos.spec.ts` procura o chuveiro pelo nome do D-A5-1
  (`^(\d+ × )?<aparelho> em <cômodo>, .*Toque para ajustar\.$`, aparelho e cômodo da fixture, sem `.first()`).
  (2) **A7** — `020db92`: `git rm -r apps/web/e2e-base`; dois comentários do `e2e/` que citavam a pasta agora citam a
  linha de base da HIS-001; o commit ficou no ADR-003 (consequências) e no meu `contexto.md`. (3) **Etapa 5** — M1–M16
  e o `--repeat-each=3`, resultado em "Plano de testes" → "Resultado da etapa 5".
- Decisões e porquê:
  - **M1 sobrevive por ser equivalente** (o `merge` do `persist` já põe `plano: []` do estado inicial); acrescentei
    M1b–M1d para separar equivalência de lacuna: o defeito real (ninguém cria o plano; migração perde dados) é pego
    pelo build e pelo `migracao`. Nenhuma mudança pedida no site.
  - `ajustes.spec.ts` passa a nomear cada lista na conferência: a falha do M5 dizia `[0, 0, 0, 2, 0]`; agora diz
    `"leituras": 2`. Mesmo teste, mensagem melhor.
  - M14 plantou ~3,5 KB gzip (não 2 KB) para passar dos dois limites de uma vez; a fronteira exata (+1 024/+1 025) é o
    N6, com a função pura.
- Arquivos alterados: `apps/web/e2e/aparelhos.spec.ts`, `apps/web/e2e/ajustes.spec.ts`, `apps/web/e2e/migracao.spec.ts`,
  `apps/web/e2e/peso-js.spec.ts`, `apps/web/e2e-base/**` (removido), esta história, ADR-003 (1 linha nas
  consequências), `docs/equipe/agentes/qa/{contexto,diario}.md`.
- Como verifiquei: cópia própria com o `src` do `92e9fd9` (porta 3141) e outra para as mutações (porta 3142).
  `pnpm typecheck` (cobre o `e2e/`), `pnpm test` (48), `pnpm build` e `pnpm audit --audit-level high` ("No known
  vulnerabilities found") verdes. e2e: 107 passam, 6 pendentes, 0 falha; `--repeat-each=3`: 321 passam, 18 pendentes,
  0 falha; nenhum erro de console (a fixture reprova sozinha, e o M8 mostrou que ela pega). axe: 0 sério/crítico fora
  das 8 exceções `color-contrast` da `/` (HIS-110) nos 2 projetos. Peso: no máximo +36 B (11a) e +80 B (11b).
  `grep -rn "e2e-base" apps scripts .github` vazio (só `CHANGELOG.md` e `docs/` citam, como histórico).
  `--list` igual com e sem `GITHUB_ACTIONS=true` (113 testes). Linhas 1–21 da "Cobertura" com o nome do teste e verdes.
- Defeitos: **nenhum** novo.
- **Decisão: aprovado pelo qa** (A1–A5 e A7, critérios 2, 3, 6 e 9 conferidos aqui). Ficam, sem ser defeito:
  **[para: ux-acessibilidade]** revisar `apps/web/e2e/excecoes-axe.ts` (8 entradas `color-contrast`, todas HIS-110) —
  critério de verde do A5 e 5º critério de aprovação, ainda não feito; e, no CI (A6, depois do push): peso do runner ×
  local (D14), o artefato do commit descartável (critério 4, Ra9) e a mesma lista no runner (critério 6). Se o peso do
  runner diferir, a referência passa a ser a do CI (D14) e eu confiro de novo.
- Para o próximo: **ux-acessibilidade** — revisar `excecoes-axe.ts`. **quem orquestra** — empurrar e conferir os 2
  checks, o peso no resumo do job e o artefato. **seguranca** e **tech-lead** — etapas 6 e 7 em paralelo.

### [tech-lead] 2026-10-30 — etapa 7: code review aprovado; ADR-004 e ADR-005 aceitos
- O que fiz: revisei `git diff -M -C main...HEAD -- . ':!docs'` (34 arquivos) contra D9–D16: `e2e/` como no D9 (mais `apoio/telas.ts` e `apoio/transicoes.ts`, coesos), fixtures movidas sem mudança, axe sem filtro e exceção de 1 elemento, limites em `apoio/peso.ts`, `ci.yml` igual ao D11, 4 correções do frontend sem regra de negócio e com o porquê comentado. Nada de `any`, `as`, `only` ou `skip`; os `fixme` citam HIS-107/108; nenhum resto do `e2e-base`.
- Como verifiquei: numa cópia própria, `pnpm typecheck`, `pnpm test` (37 + 11) e `pnpm build` verdes. Pela API REST do GitHub: `4c860b5` e `efab326` verdes nos 2 checks (107 passam e 6 pendentes, igual ao local: critério 6). Job de ~2,8 min, Chromium em 24 s (sem cache). `32f2cff` vermelho com `relatorio-e2e` de 10,2 MB, contra 1,9 MB verde (critério 4). O conteúdo do artefato é a Ra9 da seguranca.
- Peso no runner: o verde só prova "até +1 024/+2 048 B", não que é igual. Basta para aprovar: o caminho embutido é `/ROOT/…`, que não depende da máquina. Mas o D14 pede o número. **Quem orquestra:** abra o resumo do job `efab326` no navegador e copie a tabela aqui (o log e o artefato dão 403 daqui). Se a diferença passar de ±100 B, a referência passa a ser a do CI (qa).
- Observações, sem devolver: `seletorDoNo` e `TelaAxe` exportados sem uso de fora (dívida T2). A importação de tipo entre `excecoes-axe.ts` e `apoio/axe.ts` é circular, mas inofensiva. Se faltar o cômodo, o `aria-label` do "Quem mais gasta" diria "em undefined": só com casa corrompida, e quem cobre é o leitor da HIS-003 (vou conferir no review dela).
- ADRs: **ADR-004 aceito**, com R4c e R4d nas consequências. **ADR-005 aceito**, com V9/V10 no item 2 e "sucessão para empresa vigente" no item 5 (pedidos da seguranca, já nesta branch). A branch `his-111-tarifas-vencidas` tem a cópia antiga do ADR-005, então vai ter um conflito pequeno no rebase: fica esta versão.
- **Decisão: aprovado pelo tech-lead.** Para fechar, ainda falta a revisão do `excecoes-axe.ts` pela ux (critério do A5). Próximo: seguranca (etapa 6, Ra9) e depois o fechamento (documentacao + scrum-master).

### [seguranca] 2026-10-30 — etapa 6: aprovado com ressalvas (baixo)
- O que fiz: Ra1–Ra13 sobre o `efab326` numa cópia própria (typecheck, test, build e e2e verdes: 107 passam, 6 pendentes). Resultado linha a linha em "Ameaças" → "Resultado da etapa 6". Ra10 plantada na `/sobre`: 3 testes vermelhos com a URL; desfeita, verdes. Integridade dos 5 pacotes novos igual à do registro.
- Achados: nenhum crítico, alto ou médio. **Ressalva (baixo), Ra9:** o artefato do `32f2cff` não baixa daqui (proxy). O equivalente local (mesmo Playwright, mesmo `reporter`, traces extraídos) está limpo. O `AKIA` do `index.html` é falso positivo (base64).
- **Para o dono do projeto, no GitHub** (Actions → execução vermelha do `32f2cff` → `relatorio-e2e`, ou `gh run download <id> -n relatorio-e2e`, numa pasta vazia e sem abrir nada de lá dentro): (1) só as pastas `playwright-report/` e `test-results/`; (2) extrair também os `.zip` (os `trace.zip` e os de `playwright-report/data/`) e procurar `gh[pousr]_[A-Za-z0-9]{36}`, `github_pat_`, `AKIA[0-9A-Z]{16}`, `eyJhbGciOi`, `service_role`, `BEGIN .*PRIVATE KEY`, `ACTIONS_RUNTIME_TOKEN`, `GITHUB_TOKEN` → tem que dar vazio; (3) no trace (trace.playwright.dev ou `pnpm exec playwright show-trace`), aba "Network" só com `127.0.0.1:3100`, e no localStorage só a casa das fixtures (Presidente Prudente, ids `00000000-…`). Se algo aparecer: apagar o artefato na mesma página e me chamar.
- **Decisão: aprovado com ressalvas (baixo).** A ressalva não bloqueia o fechamento. Próximo: ux (`excecoes-axe.ts`) e depois o fechamento; o dono do projeto marca os 2 checks como obrigatórios no `main`.

### [ux-acessibilidade] 2026-10-30 — `excecoes-axe.ts` revisado pela ux, com 1 ajuste no planejamento
- **Revisado pela ux.** As 8 entradas são `color-contrast` da `/` (4 sem casa, 4 com casa), cada uma com seletor de 1 elemento (pílulas de Quarto e Cozinha; o 2º `<dd>` de cada cartão) e todas com `historia: "HIS-110"`. Nada a mudar no `.ts`.
- Falta na linha da HIS-110 em `docs/planejamento.md` a correção dos dois `<dd>` (hoje só tem a das pílulas: `text-tinta`, 5,50:1). Medi: `text-white/85` sobre `bg-white/10` em `bg-energia` (#0a7356) dá 3,92:1 (não passa). **Correção:** trocar por `text-white` nos dois `<dd>`, que dá 4,77:1 (passa AA); os `<p>` com `text-white/85` direto no verde (4,69:1) ficam como estão.
- [para: scrum-master] acrescentar essa correção na linha da HIS-110. Próximo: fechamento (documentacao + scrum-master).

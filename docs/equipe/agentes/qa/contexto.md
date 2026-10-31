# Contexto · QA

## O que eu cuido

- Testes de unidade: `packages/core/test/` (37) e `packages/dados/test/` (11, com fixtures em `packages/dados/fixtures/`).
- Testes no navegador: `apps/web/e2e/` (Playwright 1.63.0 + axe 4.14.0; HIS-002a). `pnpm build && PORTA_E2E=31xx
  pnpm test:e2e` numa cópia própria. O `apps/web/e2e-base/` saiu no A7 (`020db92`); o comparador antes × depois volta
  do histórico: `git show 020db92^:apps/web/e2e-base/linha-de-base.cjs` (também no ADR-003).

## Estado atual

- **HIS-001, passo 0 feito (2026-10-29):** linha de base do código de `main` `57700ab` sem erros. Script
  `apps/web/e2e-base/linha-de-base.cjs` (`capturar <pasta>` / `comparar <antes> <depois>`) e fixtures
  `apps/web/e2e-base/fixtures/casa-v1.json` e `casa-v2.json`. Evidências fora do git, no meu scratchpad:
  `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/his001/antes/` (+ `controle/`).
- Números da linha de base: 84 capturas (34 por largura no fluxo), 21 transições por largura, 0 erros de console;
  JS `/` 185 227 B, `/comecar` 185 227 B, `/casa` 231 010 B sem casa e 211 700 B com casa; `/` revalida em 86400 s,
  `htmlSize` 66 350. Detalhes e critérios no "Plano de testes" da HIS-001.
- **HIS-001, etapa 5 feita (2026-10-29): aprovado.** `comparar antes depois-qa` → "nada mudou"; 11a (JS do HTML) caiu em
  todas as rotas, 11b +1 449 B em `/casa` sem casa (limite 2 048). Manual (teclado, folhas, abas, nomes acessíveis,
  reduzido, zoom 200%, `/casa/aparelhos`, `#comodo-<id>`) idêntico ao `main`. Achados pré-existentes P1–P4 na história.
  Evidências: `…/scratchpad/his001/depois-qa/`, `manual-qa-depois/`, `manual-qa-main/`; roteiro `…/his001/manual-qa.cjs`.
- **HIS-002a/002b, revisão do desenho feita (2026-10-29):** D9, D10 e D6 "revisados pelo qa, com observações". Plano de
  testes nas duas histórias: tabela "Cobertura" (26 linhas: cada verificação do `e2e-base` e do manual da HIS-001 →
  arquivo do `apps/web/e2e/`), negativos permanentes N1–N7 (`sanidade.spec.ts`, `test.fail()`), mutações M1–M16 (002a)
  e V1–V8 (002b), ids obrigatórios `I7-01…15`, `R13-01…03`. Perguntas `[para: tech-lead]` abertas: P-qa-1…8 (002a,
  bloqueiam o A7) e P-qa-b1…b3 (002b, entram no B4). Protótipo em `…/scratchpad/qa-his002/prova/`.
- **HIS-002a, etapa 4 (2026-10-30):** A1 `06be352`, A2 `9156363`, A3 `6ec68c7`, A4 `e84edad`, A5 `f527b5b` + `c6bbc17`.
  113 testes em 11 arquivos (4,2 min, 1 worker): 104 passam (12 negativos esperados), 6 `fixme`, 3 falham pelos
  defeitos D-A5-1 (`label-content-name-mismatch` no "Quem mais gasta", `/casa` com casa) e D-A5-2
  (`scrollable-region-focusable` no painel geral, 390 px) — devolvidos ao frontend/ux. Cópia em
  `…/scratchpad/h2a/copia` (porta 3141), `sincronizar.sh` copia só os meus caminhos.
- **HIS-002a, A5 fechado / A7 / etapa 5 (2026-10-30): aprovado.** `d5a4940` (seletor do D-A5-1), `020db92` (A7).
  e2e 107 passam / 6 pendentes / 0 falha; `--repeat-each=3` 321 / 18 / 0; M1–M16 na história (M1 equivalente, com
  M1b–M1d). Roteiro `…/scratchpad/h2a/mutacoes.sh` (cópia `h2a/mut`, porta 3142, restaura do repositório a cada caso).
- Peso: referência `peso-js.json` com o lockfile novo (11a `/` 164 215 … 11b `/casa` com casa 212 282). O spec no build
  do `main` dá a HIS-001 byte a byte; o lockfile muda −5…+23 B (caminho `next@…_@playwright+test@1.63.0` embutido).
- Como subir o site para testar: `pnpm build && pnpm --filter @ee/web start -p 3100` (em segundo plano);
  liberar a porta com `fuser -k 3100/tcp` (não usar `pkill -f "next start"`).
- O Chromium já está instalado no ambiente de nuvem: `require('playwright')` (1.63, via NODE_PATH global), sem `playwright install`.

- **HIS-111, h7 (2026-10-30): devolvido para frontend (D1, peso de JS 11a +1 135 a +1 179 B nas rotas `/casa*`,
  limite +1 024).** Crit. 1, 2, 9, 10 (diagnóstico 4) e 8 ok. Spec `apps/web/e2e/troca-distribuidora.spec.ts` + fixtures
  `casa-v2-rge-sul.json`/`substituidas-his111.json` na branch 111; só roda com a 002a junto (`e2e/apoio`).
- Testar história × 002a sem tocar worktree: `git merge-tree --write-tree A B` + `git archive <árvore> | tar -x` numa
  pasta do scratchpad + `pnpm install --offline --frozen-lockfile`; `PORTA_E2E=31xx pnpm exec playwright test`.

## Decisões em vigor

- e2e: fixture automática reprova `pageerror`, `console.error` e pedido fora da origem do `baseURL`; contexto novo por
  teste (não usar `browser.newContext`, que fica sem vigia — usar `test.use`). Scripts de `addInitScript` precisam
  ignorar a `about:blank` (lá o `sessionStorage` é proibido e vira erro de página).
- Exceção do axe = 1 elemento, por `pagina` + `estado` de `TELAS_AXE` (13 estados); ux revisa `excecoes-axe.ts`.
- Pendente com história = `test.fixme("HIS-NNN · …")` com a asserção de verdade dentro; conferir que falha hoje.

- Comparação antes × depois só vale com relógio fixo (`context.clock.setFixedTime`), fuso `America/Sao_Paulo`, `pt-BR`
  e `crypto.randomUUID` trocado por contador (`addInitScript`). Assim texto, DOM e casa salva batem byte a byte.
- Capturas: tolerância de 16/255 por canal (ruído medido de até 10/255 em diálogos); textos, DOM e JSON: exatos.
- Bytes de JS (decisão do tech-lead, 2026-10-29): **11a** (principal) JS referenciado pelo HTML de 7 rotas
  (`<script src>` sem `noModule` + `<link rel="preload" as="script">`, corpo gzip), até +1 024 B por rota — modo
  `medir-js-html`, grava `js-do-html.json`; **11b** soma de `encodedBodySize` de todo `.js` depois do prefetch, até
  +2 048 B. O relógio falso do Playwright troca o `performance`: medir bytes **sem** `clock`.
- Testar sempre num **build próprio numa cópia isolada** (tar do repositório sem `.next` no scratchpad; o `node_modules`
  vai junto, com links relativos): outros papéis rodam `pnpm build` no mesmo `apps/web/.next` e derrubam o `next start`.
- `comparar` ignora logs (`*.log`, `saida-*.txt`, `controle-comparacao.txt`); deixar resultados extras (ex.: manual) fora
  da pasta comparada.
- Fixtures geradas uma vez, a partir da casa salva pelo próprio fluxo; o "depois" usa as mesmas (sem `--gerar-fixtures`).
  No `apps/web/e2e/` (HIS-002a): copiadas byte a byte e **nunca regeradas**; versão nova do `persist` = fixture nova.
- e2e (HIS-002a): relógio real com datas **relativas** a hoje; nenhum valor em R$ afirmado; `celular` sem
  `isMobile`/`hasTouch` (referência do 11b); axe só depois de conferir a tela certa e com `passes > 0`.
- Toda barreira tem negativo permanente com `test.fail()` (medido no Playwright 1.63: barreira quebrada → "Expected to
  fail, but passed", código 1). Mutações plantadas da etapa 5 têm o resultado escrito na história, não no scratchpad.
- Mutação que sobrevive: antes de chamar de lacuna, provar se é equivalente (ex.: o `merge` do `persist` do zustand
  põe o estado inicial por baixo do salvo, então padrões do `migrate` são redundantes) e plantar a variante que muda o
  comportamento. Mensagem de falha tem que dizer o que quebrou (nomear campos, não posições de lista).
- Movimento reduzido nas view transitions: ler as durações no `transition.ready` (0 com `reduce`, 250 ms sem), sem espera fixa.
- `eslint-config-next`: `jsx-a11y` é **aviso**; só o `--max-warnings 0` barra (medido com `--stdin`).

## Seletores e comportamentos (cuidado nos scripts)

- O estado é um `<select id="estado">` + botão "Continuar". Presidente Prudente (SP) tem uma só distribuidora: pula a escolha.
- O nome da TV no catálogo é "TV LED até 32 polegadas".
- A navegação das abas existe duas vezes (`nav[aria-label="Seções"]`): topo no computador, embaixo no celular; usar a visível.
  No celular a aba "Acompanhamento" se chama "Acompanhar".
- A `/` não tem `<main>` (texto pelo `<body>`). `/casa/aparelhos` é estática: HTTP 200 com o redirecionamento no conteúdo.
- O zustand regrava a casa ao hidratar só quando a versão muda (v1 → v2).
- Em 390 px a captura de página inteira mostra a navegação fixa no meio da imagem (altura 844 px).
- Com a casa da fixture o botão é "Anotar outra conta" (já há contas). A Cozinha abre expandida em `/casa/comodos`:
  Enter no cabeçalho a fecha. O nome do aparelho (ex.: "Geladeira de 1 porta") é o botão que abre o editor.
- Zoom 200% em 390 px = viewport 195×422 com `deviceScaleFactor: 2`.

## Pendências

- HIS-111: reconferir o D1 (peso) depois do frontend; h8: 6 cidades + Guarapuava/Nova Friburgo/Campina Grande nos
  arquivos publicados.

- HIS-002: transformar o fluxo em testes Playwright no CI, com axe; aposentar `apps/web/e2e-base/`.
- HIS-002: levar o `manual-qa.cjs` (teclado, folhas, nomes acessíveis, zoom, âncora) para `apps/web/e2e/`, com axe.
- Backlog (pré-existentes, HIS-001 P1–P4): foco no passo "cidade" pula da busca para o título (ux/frontend); zoom 200%
  com rolagem horizontal em `/`, `/casa`, `/casa/dicas` (ux); âncora não alinha ao topo pelo link **nem** direto numa página nova (371/491 px; frontend, HIS-108).

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

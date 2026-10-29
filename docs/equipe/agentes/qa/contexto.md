# Contexto · QA

## O que eu cuido

- Testes de unidade: `packages/core/test/` (37) e `packages/dados/test/` (11, com fixtures em `packages/dados/fixtures/`).
- Testes no navegador: futuro `apps/web/e2e/` (HIS-002). Até lá, a linha de base da HIS-001 em `apps/web/e2e-base/`.

## Estado atual

- **HIS-001, passo 0 feito (2026-10-29):** linha de base do código de `main` `57700ab` sem erros. Script
  `apps/web/e2e-base/linha-de-base.cjs` (`capturar <pasta>` / `comparar <antes> <depois>`) e fixtures
  `apps/web/e2e-base/fixtures/casa-v1.json` e `casa-v2.json`. Evidências fora do git, no meu scratchpad:
  `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/his001/antes/` (+ `controle/`).
- Números da linha de base: 84 capturas (34 por largura no fluxo), 21 transições por largura, 0 erros de console;
  JS `/` 185 227 B, `/comecar` 185 227 B, `/casa` 231 010 B sem casa e 211 700 B com casa; `/` revalida em 86400 s,
  `htmlSize` 66 350. Detalhes e critérios no "Plano de testes" da HIS-001.
- Como subir o site para testar: `pnpm build && pnpm --filter @ee/web start -p 3100` (em segundo plano);
  liberar a porta com `fuser -k 3100/tcp` (não usar `pkill -f "next start"`).
- O Chromium já está instalado no ambiente de nuvem: `require('playwright')` (1.63, via NODE_PATH global), sem `playwright install`.

## Decisões em vigor

- Comparação antes × depois só vale com relógio fixo (`context.clock.setFixedTime`), fuso `America/Sao_Paulo`, `pt-BR`
  e `crypto.randomUUID` trocado por contador (`addInitScript`). Assim texto, DOM e casa salva batem byte a byte.
- Capturas: tolerância de 16/255 por canal (ruído medido de até 10/255 em diálogos); textos, DOM e JSON: exatos.
- Bytes de JS: soma de `encodedBodySize` de todo recurso `.js` (o Next pré-carrega chunks com `<link rel=preload>`).
  O relógio falso do Playwright troca o `performance`: medir bytes **sem** `clock`.
- Fixtures geradas uma vez, a partir da casa salva pelo próprio fluxo; o "depois" usa as mesmas (sem `--gerar-fixtures`).

## Seletores e comportamentos (cuidado nos scripts)

- O estado é um `<select id="estado">` + botão "Continuar". Presidente Prudente (SP) tem uma só distribuidora: pula a escolha.
- O nome da TV no catálogo é "TV LED até 32 polegadas".
- A navegação das abas existe duas vezes (`nav[aria-label="Seções"]`): topo no computador, embaixo no celular; usar a visível.
  No celular a aba "Acompanhamento" se chama "Acompanhar".
- A `/` não tem `<main>` (texto pelo `<body>`). `/casa/aparelhos` é estática: HTTP 200 com o redirecionamento no conteúdo.
- O zustand regrava a casa ao hidratar só quando a versão muda (v1 → v2).
- Em 390 px a captura de página inteira mostra a navegação fixa no meio da imagem (altura 844 px).

## Pendências

- HIS-001 etapa 5: rodar `capturar …/depois` + `comparar`, e o manual (teclado, zoom 200%, nomes acessíveis).
- HIS-002: transformar o fluxo em testes Playwright no CI, com axe; aposentar `apps/web/e2e-base/`.
- Não coberto pela linha de base: abrir `/casa/comodos#comodo-<id>` pelo link do acompanhamento.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

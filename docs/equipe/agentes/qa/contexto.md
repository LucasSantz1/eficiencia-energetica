# Contexto · QA

## O que eu cuido

- Testes de unidade: `packages/core/test/` (37) e `packages/dados/test/` (11, com fixtures em `packages/dados/fixtures/`).
- Testes no navegador: futuro `apps/web/e2e/` (HIS-002). Hoje os fluxos são testados com scripts Playwright avulsos.

## Estado atual

- Fluxo principal verificado à mão a cada entrega: cadastro → acompanhamento → cômodos → dicas → minha casa,
  em 390×844 e 1280×900, sem erro no console, com 19 transições de tela registradas e movimento reduzido conferido.
- Como subir o site para testar: `pnpm --filter @ee/web build && pnpm --filter @ee/web start -p 3100`;
  liberar a porta com `fuser -k 3100/tcp` (não usar `pkill -f "next start"`).
- O Chromium já está instalado no ambiente de nuvem: `require('playwright')`, sem `playwright install`.

## Seletores que mudaram (cuidado nos scripts)

- O estado agora é um `<select id="estado">` + botão "Continuar".
- O nome da TV no catálogo é "TV LED até 32 polegadas".

## Pendências

- HIS-002: transformar o fluxo em testes Playwright no CI, com axe.
- HIS-001: capturas antes e depois para provar que nada mudou.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

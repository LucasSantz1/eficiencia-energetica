# Registro de mudanças

## 2026-10-30 · Rolagem suave nos links da página inicial

**Para quem usa**
- Os links do topo da página inicial ("Como funciona", "Tarifa Social" e "Perguntas") agora deslizam até a seção em vez
  de pular de uma vez. Quem pede menos movimento no celular continua com o salto direto.

**Técnico**
- `scroll-behavior: smooth` no `html` dentro de `prefers-reduced-motion: no-preference` (`globals.css`) e
  `data-scroll-behavior="smooth"` no `<html>` (`app/layout.tsx`), para o Next 16 não aplicar a rolagem suave nas trocas
  de página, que já têm a transição própria.

## 2026-10-29 · Código do site organizado em camadas (HIS-001)

**Para quem usa**
- Nada muda. As telas, os textos, as animações e a casa guardada no celular continuam iguais. Quem já tinha a casa
  cadastrada abre o site e encontra tudo como deixou.

**Técnico**
- `apps/web/src` reorganizado nas camadas do ADR-001: `app/` (rotas finas, sem `"use client"`), `funcionalidades/`
  (`inicio`, `cadastro`, `casca`, `acompanhamento`, `comodos`, `dicas`, `ajustes`), `ui/` (um arquivo por componente;
  `ui.tsx` foi dividido), `ui/aparelho/` (componentes de aparelho usados por mais de uma tela), `aplicacao/` e
  `infraestrutura/`. As pastas `components/` e `lib/` não existem mais.
- `aplicacao/` passa a ser a única porta das telas para `infraestrutura/`; novo hook `useEdicaoDeAparelho()`. O
  `EditorAparelho` não lê mais o store: recebe `comodos`, `aoSalvar` e `aoRemover`.
- Store da casa em `infraestrutura/armazenamento/casa.ts` (um só `create`), sem mudar o formato salvo: chave
  `eficiencia-energetica:casa`, versão 2, mesma migração. `novoId` em `infraestrutura/identificador.ts`.
- Página inicial separada em rota fina (`app/page.tsx`, com `revalidate = 86400`), tela (`funcionalidades/inicio/PaginaInicial.tsx`)
  e leitura de disco em arquivos `*.servidor.ts` com `import "server-only"` (o build falha se chegarem ao navegador).
- Verificador de camadas `scripts/verificar-camadas.mjs` (Node puro, sem dependência): `pnpm camadas`, e roda dentro do
  `pnpm typecheck` e, por isso, no CI.
- ADR-001 revisado: `ui/` pode chamar funções puras do `@ee/core`; componentes de domínio compartilhados em `ui/<assunto>/`;
  arquivos só de servidor em `*.servidor.ts`; sem `index.ts` que junta exportações.
- Comparação "antes × depois" do qa em `apps/web/e2e-base/` (provisória): 84 capturas em 390 e 1280 px, textos, DOM e casa
  salva iguais ao código anterior. O JavaScript para abrir cada página ficou igual ou menor (até 1,7 kB a menos).
- Nenhuma dependência, configuração do Next ou do CI mudou.

## 2026-10-29 · Equipe, planejamento e documentação

**Para quem usa**
- O site agora se apresenta como um projeto independente e gratuito.

**Técnico**
- Equipe de 10 agentes em `.claude/agents/`, com pasta de contexto e diário de cada um em `docs/equipe/agentes/`.
- Planejamento (`docs/planejamento.md`), processo Scrum, quadro da Sprint 0 e histórias HIS-001 a HIS-003.
- ADR-001 (camadas) e ADR-002 (espaços reservados, desligados).
- Documentação do sistema em `docs/sistema/` e arquitetura em `docs/arquitetura.md`.
- Guia do projeto para a equipe em `CLAUDE.md`.

## Catálogo de aparelhos e tempos de uso

**Para quem usa**
- Ar-condicionado split inverter, split comum, de janela ou portátil, com BTUs; geladeira por modelo e idade; TV por
  tecnologia e tamanho; chuveiro por potência e aquecimento solar. Quase 60 aparelhos.
- Tempo de uso de 2 minutos ao dia todo, e frequência de todo dia até 1 vez por mês.
- Estado escolhido numa lista.

## Animações

**Para quem usa**
- Transições suaves entre telas, entre os passos do cadastro e ao entrar no painel. Desligadas para quem prefere menos movimento.

## Cômodos, acompanhamento e plano de economia

**Para quem usa**
- Cômodos com nome e quantidade, aparelhos sugeridos por cômodo e quantidade de cada aparelho.
- Painel geral que junta os aparelhos iguais da casa.
- Acompanhamento editável, histórico de contas e leituras do relógio de luz.
- Plano de economia: escolha as dicas e veja a nova conta.
- Nova página inicial.

## Tarifa Social na conta de referência

**Técnico**
- O preço do kWh calculado a partir da conta considera só os kWh cobrados (sem os 80 kWh gratuitos).

## Primeira versão

**Para quem usa**
- Cadastro da casa, conta estimada, aparelhos que mais gastam, dicas e ajustes.

**Técnico**
- Monorepo com `@ee/core` (cálculos), `@ee/dados` (rotina diária da ANEEL) e site Next.js.

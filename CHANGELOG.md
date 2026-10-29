# Registro de mudanças

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

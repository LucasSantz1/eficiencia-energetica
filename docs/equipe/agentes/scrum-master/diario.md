# Diário · Scrum Master / PO

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-29 · HIS-002 · quebra em 002a/002b aceita; HIS-109 e HIS-110 criadas; quadro com trabalho em paralelo
- O que fiz: respondi as 3 perguntas do tech-lead; retitulei a HIS-002 como HIS-002a (mesmo arquivo e branch) e criei a
  HIS-002b a partir do modelo, movendo critérios 1, 5, 7, 8, notas vindas da HIS-001, D4–D7, B1–B8 e a pergunta dos 21
  casos, com remissões; acrescentei os critérios 10 (T1) e 11 (8 `eslint-disable` HIS-109) na 002b e as seções
  Dependências/Fluxo/Ameaças/Plano de testes na 002a; criei HIS-109 e HIS-110 no planejamento; refiz o quadro.
- Decisões e porquê: quebra porque 4 dias não cabem em M; 002a antes (a S2 se prova com o e2e; mesmos arquivos de CI).
  HIS-109 no E1/Sprint 3 antes da HIS-301 (mesmos arquivos). Contraste da `/` → HIS-110, P, primeira da Sprint 1 (defeito
  nas cores padrão, tela mais vista; HIS-102 é modo opcional). Checks obrigatórios do `main` → dono, ao fechar a 002a.
- Arquivos: `docs/equipe/historias/HIS-002-qualidade-automatica.md`, `docs/equipe/historias/HIS-002b-lint-e-camadas.md`
  (novo), `docs/planejamento.md`, `docs/equipe/quadro.md`, `docs/equipe/decisoes/ADR-003-qualidade-automatica.md`
  (linha "Detalhes"), `contexto.md`, este diário.
- Próximos passos: seguranca ‖ qa ‖ ux na etapa 3; depois etapa 4 da 002a; refinar a HIS-110 com a ux.

## 2026-10-29 · HIS-001 · Definição de Pronto conferida; história em "Pronto"; HIS-002 revista
- O que fiz: conferi os 6 itens da Definição de Pronto contra as notas e as evidências do qa no scratchpad (84 capturas,
  `saida-comparar.txt` "nada mudou", logs das barreiras); movi a HIS-001 para "Pronto"; registrei o que ficou para
  HIS-002, HIS-003, dívida do tech-lead e backlog (HIS-107, HIS-108); consolidei os aprendizados na retro da Sprint 0;
  revisei a HIS-002 com os critérios 7–9.
- Decisões e porquê: HIS-107 na Sprint 1 antes da HIS-102 (letra maior agrava o reflow); HIS-108 na Sprint 4 antes da
  HIS-106; HIS-105 desce para a Sprint 4. HIS-002 continua "Preparada": esclareci os critérios 3 (exceções do axe) e 9
  (o que o e2e cobre do `e2e-base`) e pedi à seguranca a lista dos 21 casos (bloqueia a etapa 4).
- Arquivos: `docs/equipe/historias/HIS-001-camadas.md`, `docs/equipe/historias/HIS-002-qualidade-automatica.md`,
  `docs/equipe/quadro.md`, `docs/planejamento.md`, `docs/equipe/retros.md`, `contexto.md`, este diário.
- Próximos passos: tech-lead + seguranca na etapa 3 da HIS-002; integrar a HIS-001 ao `main`; texto do `CLAUDE.md` com o dono.

## 2026-10-29 · criação da equipe
- O que fiz: Equipe criada; Sprint 0 planejada (HIS-001, HIS-002, HIS-003) e quadro montado.
- Próximos passos: ver "Pendências" em `contexto.md`.

# Contexto · Scrum Master / Product Owner

## O que eu cuido

- `docs/planejamento.md` — visão, épicos, histórias, sprints, riscos, custos.
- `docs/equipe/quadro.md` — quadro da sprint e backlog priorizado.
- `docs/equipe/historias/` — refinamento das histórias (modelo em `docs/equipe/modelos/historia.md`).
- `docs/equipe/retros.md` — retrospectivas.

## Estado atual

- **Sprint 0 (Fundação)**: HIS-001 **Pronto** (2026-10-29) → HIS-002 qualidade automática (Preparada, próxima: etapa 3
  com tech-lead + seguranca) → HIS-003 base de segurança (Preparada).
- HIS-004 (sem menção a instituição de ensino; espaços reservados desligados) já entregue.
- Backlog priorizado para a Sprint 1: **HIS-107** (zoom 200%), HIS-102, HIS-103. Sprint 4: HIS-108, HIS-101, HIS-105, HIS-106.

## Decisões em vigor

- Sprints de uma semana; a Sprint 0 vem antes de qualquer função nova.
- Prioridade: impacto para a família → inclusão → dependências técnicas → custo zero.
- Espaços para parceiros ficam desligados até uma história própria do épico E11.
- Achado de acessibilidade **médio** (ex.: reflow WCAG 1.4.10) entra na sprint de inclusão seguinte e antes de história
  que agrave o mesmo problema; **baixo** entra antes do teste com famílias (HIS-106).
- Em história de refatoramento (E0), achado pré-existente vai para o backlog com destino, não para o escopo.
- HIS-002: violação do axe que exige mudança visível vira exceção nomeada (regra + página + ID de história), nunca regra
  desligada; o e2e cobre as verificações de comportamento do `e2e-base`, não pixels/DOM.

## Pendências

- HIS-001: quem orquestra integra a `his-001-camadas` ao `main` antes de abrir a `his-002-qualidade`.
- Dono do projeto: decidir o texto novo da nota "Estado atual" do `CLAUDE.md` (proposto pela documentacao).
- HIS-002: perguntas abertas ao tech-lead (quando o e2e roda) e à seguranca (lista dos 21 casos) — respondidas na
  etapa 3; tamanho M no limite, avaliar quebra (HIS-002b) se o desenho passar de 3 dias.
- Refinar HIS-107 (critério verificável: em 390 px com zoom 200%, `scrollWidth <= clientWidth` em todas as rotas) antes da Sprint 1.
- Acompanhar a pergunta aberta da HIS-003.
- Preparar o roteiro do teste com famílias (HIS-106) com a UX.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

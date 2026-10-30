# Quadro da sprint

## Sprint 0 · Fundação

**Objetivo:** deixar o código organizado em camadas, testado automaticamente e protegido, sem mudar nada para quem usa.

| História | Status | Etapa atual | Próximo papel |
| --- | --- | --- | --- |
| [HIS-001 · Camadas](historias/HIS-001-camadas.md) | Pronto | Definição de Pronto conferida (etapa 9) | — (quem orquestra integra ao `main`) |
| [HIS-002 · Qualidade automática](historias/HIS-002-qualidade-automatica.md) | Preparada | refinada, critérios 7–9 revistos | tech-lead (desenho) + seguranca (ameaças); qa na estrutura dos testes |
| [HIS-003 · Base de segurança](historias/HIS-003-base-de-seguranca.md) | Preparada | refinada | seguranca + dominio-energia + ux |
| HIS-004 · Sem menção a instituição; espaços reservados | Pronto | — | — |

Ordem: HIS-001 → HIS-002 → HIS-003 (a 002 e a 003 usam as pastas novas).

## Diário

- 2026-10-29 — sprint planejada; HIS-004 entregue junto com a criação da equipe.
- 2026-10-29 — HIS-001: desenho técnico pronto (tech-lead), pergunta aberta respondida, ADR-001 revisado; próximo: seguranca.
- 2026-10-29 — HIS-001: implementada (frontend), 8 commits; comparação do QA igual em tela, texto, DOM e casa salva; JS de `/casa` sem casa +1,4 KB em pergunta ao tech-lead; próximo: qa.
- 2026-10-29 — HIS-001: qa aprovou (etapa 5), seguranca aprovou com ressalvas baixas (etapa 6, S1/S2), tech-lead aprovou o code review (etapa 7); S1/S2 foram para a HIS-002 e P1–P4 do qa para o backlog (HIS-107, HIS-108); próximo: documentacao.
- 2026-10-29 — HIS-001: documentada (etapa 8): arquitetura, site, desenvolvimento, diagramas, roteiro, agente de UX e CHANGELOG com as camadas novas e o `pnpm camadas`; texto novo da nota "Estado atual" do `CLAUDE.md` proposto ao dono do projeto; próximo: scrum-master.
- 2026-10-29 — HIS-001: **Pronto** (etapa 9): todos os itens da Definição de Pronto com evidência; S1/S2/T1/T3 na HIS-002, HIS-107/HIS-108 no backlog (HIS-107 na Sprint 1, HIS-108 na Sprint 4); aprendizados na retro da Sprint 0. HIS-002 revista: continua Preparada, com esclarecimentos nos critérios 3 e 9 e pergunta à seguranca (lista dos 21 casos); próximo: tech-lead + seguranca (etapa 3 da HIS-002).

## Próximas (backlog priorizado)

1. HIS-107 Zoom de 200% sem rolagem para o lado (antes da HIS-102: letra maior agrava o mesmo problema)
2. HIS-102 Letra maior e alto contraste
3. HIS-103 Guia da Tarifa Social
4. HIS-201 Conta detalhada
5. HIS-205 Nomes de distribuidoras
6. HIS-104 Meta de gasto
7. HIS-108 Foco e rolagem (Sprint 4, antes do teste com famílias)
8. HIS-105 Compartilhar e imprimir (Sprint 4)

O backlog completo está em [`../planejamento.md`](../planejamento.md).

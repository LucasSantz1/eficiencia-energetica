# Quadro da sprint

## Sprint 0 · Fundação

**Objetivo:** deixar o código organizado em camadas, testado automaticamente e protegido, sem mudar nada para quem usa.

| História | Status | Etapa atual | Próximo papel |
| --- | --- | --- | --- |
| [HIS-001 · Camadas](historias/HIS-001-camadas.md) | Em revisão | code review aprovado (etapa 7) | documentacao |
| [HIS-002 · Qualidade automática](historias/HIS-002-qualidade-automatica.md) | Preparada | refinada | qa + tech-lead |
| [HIS-003 · Base de segurança](historias/HIS-003-base-de-seguranca.md) | Preparada | refinada | seguranca + dominio-energia + ux |
| HIS-004 · Sem menção a instituição; espaços reservados | Pronto | — | — |

Ordem: HIS-001 → HIS-002 → HIS-003 (a 002 e a 003 usam as pastas novas).

## Diário

- 2026-10-29 — sprint planejada; HIS-004 entregue junto com a criação da equipe.
- 2026-10-29 — HIS-001: desenho técnico pronto (tech-lead), pergunta aberta respondida, ADR-001 revisado; próximo: seguranca.
- 2026-10-29 — HIS-001: implementada (frontend), 8 commits; comparação do QA igual em tela, texto, DOM e casa salva; JS de `/casa` sem casa +1,4 KB em pergunta ao tech-lead; próximo: qa.
- 2026-10-29 — HIS-001: qa aprovou (etapa 5), seguranca aprovou com ressalvas baixas (etapa 6, S1/S2), tech-lead aprovou o code review (etapa 7); S1/S2 foram para a HIS-002 e P1–P4 do qa para o backlog (HIS-107, HIS-108); próximo: documentacao.

## Próximas (backlog priorizado)

1. HIS-102 Letra maior e alto contraste
2. HIS-103 Guia da Tarifa Social
3. HIS-105 Compartilhar e imprimir
4. HIS-201 Conta detalhada
5. HIS-205 Nomes de distribuidoras
6. HIS-104 Meta de gasto

O backlog completo está em [`../planejamento.md`](../planejamento.md).

# Quadro da sprint

## Sprint 0 · Fundação

**Objetivo:** deixar o código organizado em camadas, testado automaticamente e protegido, sem mudar nada para quem usa.

| História | Status | Etapa atual | Próximo papel |
| --- | --- | --- | --- |
| [HIS-001 · Camadas](historias/HIS-001-camadas.md) | Pronto | Definição de Pronto conferida (etapa 9) | — (quem orquestra integra ao `main`) |
| [HIS-002 · Qualidade automática](historias/HIS-002-qualidade-automatica.md) | Preparada | desenho técnico (etapa 3): definitivo escrito; proposta de quebra em 002a/002b | seguranca (ameaças + 21 casos) + qa (revisa D6, D9, D10); scrum-master decide a quebra |
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
- 2026-10-29 — HIS-002: desenho técnico definitivo (tech-lead), medido numa cópia própria: ESLint 10.13.0 + `eslint-config-next` 16.4.3 + `import-x` 4.17.1 (o `import/order` quebra no ESLint 10), `@playwright/test` 1.63.0 (casa com o Chromium do ambiente) + `@axe-core/playwright` 4.14.0; e2e em todo PR e push no `main` (~4 min de parede); ADR-003 proposto; ≈ 4 dias → proposta de quebra em HIS-002a (2, 3, 4, 6, 9) e HIS-002b (1, 5, 7, 8); próximo: seguranca + qa, e scrum-master decide a quebra.

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

# Quadro da sprint

## Sprint 0 · Fundação

**Objetivo:** deixar o código organizado em camadas, testado automaticamente e protegido, sem mudar nada para quem usa.

| História | Status | Etapa atual | Próximo papel |
| --- | --- | --- | --- |
| [HIS-001 · Camadas](historias/HIS-001-camadas.md) | Pronto | Definição de Pronto conferida (etapa 9) | — (quem orquestra integra ao `main`) |
| [HIS-002a · Testes no navegador no CI](historias/HIS-002-qualidade-automatica.md) | Preparada | etapa 3 concluída: seguranca, qa e ux revisaram; decisões do tech-lead no D16 (2026-10-30); **liberada para a etapa 4** | **qa** (A1–A5, testes) + **frontend** (commit das correções do A5) → A6 (`ci.yml`) → A7 |
| [HIS-002b · Lint e camadas no CI](historias/HIS-002b-lint-e-camadas.md) | Preparada | etapa 3 concluída: ameaças, 21 casos e D6 revisados; decisões do tech-lead no D16 (2026-10-30) | etapa 4 (frontend com o tech-lead) **só depois** da HIS-002a no `main` |
| [HIS-003 · Base de segurança](historias/HIS-003-base-de-seguranca.md) | Preparada | refinada | seguranca + dominio-energia + ux |
| HIS-004 · Sem menção a instituição; espaços reservados | Pronto | — | — |

Ordem: HIS-001 → **HIS-002a → HIS-002b** → HIS-003 (a 002b mexe nos mesmos `package.json`, lockfile e `ci.yml` que a
002a e usa o e2e dela para provar a correção S2; a 003 mexe de novo no `ci.yml`).

### O que pode rodar em paralelo agora (sem conflito)

| Papel | Onde escreve | Em paralelo com |
| --- | --- | --- |
| seguranca | "Ameaças" da HIS-002a; "Ameaças" + lista dos 21 casos e resposta da pergunta aberta da HIS-002b | qa, ux |
| qa | "Plano de testes" da HIS-002a (D9, D10) e da HIS-002b (D6) | seguranca, ux |
| ux-acessibilidade | "Fluxo e textos" e resposta da pergunta aberta da HIS-002a | seguranca, qa |

Regras para não pisar no colega: cada um só na sua seção; edição pontual, **nunca** reescrever o arquivo inteiro; reler
o arquivo antes de pôr a nota no fim da "Conversa da equipe"; quem compilar ou subir servidor usa cópia própria no
scratchpad e porta própria (retro da HIS-001). A implementação (etapa 4) **não** roda em paralelo entre 002a e 002b.

### Pendência do dono do projeto (quem orquestra leva)

- Ao fechar a HIS-002a: marcar como **obrigatórios** na proteção do `main` (configurações do GitHub) os checks
  "Lint, tipos e testes" e "Navegador (e2e, axe e peso)". No fechamento da HIS-002b o scrum-master confere que
  continuam obrigatórios. Sem isso, um PR pode ser integrado com o e2e vermelho.

## Diário

- 2026-10-29 — sprint planejada; HIS-004 entregue junto com a criação da equipe.
- 2026-10-29 — HIS-001: desenho técnico pronto (tech-lead), pergunta aberta respondida, ADR-001 revisado; próximo: seguranca.
- 2026-10-29 — HIS-001: implementada (frontend), 8 commits; comparação do QA igual em tela, texto, DOM e casa salva; JS de `/casa` sem casa +1,4 KB em pergunta ao tech-lead; próximo: qa.
- 2026-10-29 — HIS-001: qa aprovou (etapa 5), seguranca aprovou com ressalvas baixas (etapa 6, S1/S2), tech-lead aprovou o code review (etapa 7); S1/S2 foram para a HIS-002 e P1–P4 do qa para o backlog (HIS-107, HIS-108); próximo: documentacao.
- 2026-10-29 — HIS-001: documentada (etapa 8): arquitetura, site, desenvolvimento, diagramas, roteiro, agente de UX e CHANGELOG com as camadas novas e o `pnpm camadas`; texto novo da nota "Estado atual" do `CLAUDE.md` proposto ao dono do projeto; próximo: scrum-master.
- 2026-10-29 — HIS-001: **Pronto** (etapa 9): todos os itens da Definição de Pronto com evidência; S1/S2/T1/T3 na HIS-002, HIS-107/HIS-108 no backlog (HIS-107 na Sprint 1, HIS-108 na Sprint 4); aprendizados na retro da Sprint 0. HIS-002 revista: continua Preparada, com esclarecimentos nos critérios 3 e 9 e pergunta à seguranca (lista dos 21 casos); próximo: tech-lead + seguranca (etapa 3 da HIS-002).
- 2026-10-29 — HIS-002: desenho técnico definitivo (tech-lead), medido numa cópia própria: ESLint 10.13.0 + `eslint-config-next` 16.4.3 + `import-x` 4.17.1 (o `import/order` quebra no ESLint 10), `@playwright/test` 1.63.0 (casa com o Chromium do ambiente) + `@axe-core/playwright` 4.14.0; e2e em todo PR e push no `main` (~4 min de parede); ADR-003 proposto; ≈ 4 dias → proposta de quebra em HIS-002a (2, 3, 4, 6, 9) e HIS-002b (1, 5, 7, 8); próximo: seguranca + qa, e scrum-master decide a quebra.
- 2026-10-29 — HIS-002: **quebra aceita** (scrum-master): HIS-002a (arquivo antigo, retitulado) e HIS-002b (novo, com critérios 1, 5, 7, 8, T1 e os 8 `eslint-disable` como critérios 10 e 11; D4–D7 e B1–B8 movidos). HIS-109 (efeitos que copiam estado) na Sprint 3, antes da HIS-301; HIS-110 (contraste das cores padrão da `/`) primeira da Sprint 1. Próximo: seguranca ‖ qa ‖ ux em paralelo; depois etapa 4 da 002a.
- 2026-10-30 — HIS-002: tech-lead decidiu as revisões (D16 nas duas): P-qa-1 a 8 e b1–b3 aceitos (P-qa-7 unida à Aa14: uma exceção do axe = um elemento; b3 na forma estrita, regra C10); actions do `ci.yml` por SHA já no A6 (majors novas: checkout v7, setup-node v7, upload-artifact v7, action-setup v6); Ra1–Ra13 nos passos; Ab3/Ab4/Ab6 no contrato da 002b. Estimativa 002a ≈ 2,75 dias, 002b ≈ 2–2,5. ADR-003 **aceito**. **HIS-002a liberada para a etapa 4** (qa + frontend). Ponto `corDaParte` × `faixaDoPeso` registrado na HIS-110 para o scrum-master.

## Próximas (backlog priorizado)

1. HIS-110 Contraste das cores padrão (P; pode entrar assim que a HIS-002a estiver no `main`)
2. HIS-107 Zoom de 200% sem rolagem para o lado (antes da HIS-102: letra maior agrava o mesmo problema)
3. HIS-102 Letra maior e alto contraste (se a Sprint 1 não couber, é ela que passa, não a HIS-103)
4. HIS-103 Guia da Tarifa Social
5. HIS-201 Conta detalhada
6. HIS-205 Nomes de distribuidoras
7. HIS-104 Meta de gasto
8. HIS-109 Efeitos que copiam estado (Sprint 3, antes da HIS-301)
9. HIS-108 Foco e rolagem (Sprint 4, antes do teste com famílias)
10. HIS-105 Compartilhar e imprimir (Sprint 4)

O backlog completo está em [`../planejamento.md`](../planejamento.md).

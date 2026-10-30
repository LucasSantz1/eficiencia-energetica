# Contexto · Scrum Master / Product Owner

## O que eu cuido

- `docs/planejamento.md` — visão, épicos, histórias, sprints, riscos, custos.
- `docs/equipe/quadro.md` — quadro da sprint e backlog priorizado.
- `docs/equipe/historias/` — refinamento das histórias (modelo em `docs/equipe/modelos/historia.md`).
- `docs/equipe/retros.md` — retrospectivas.

## Estado atual

- **Sprint 0 (Fundação)**: HIS-001 **Pronto** (2026-10-29) → **HIS-002a** testes no navegador (Preparada; arquivo
  `HIS-002-qualidade-automatica.md`) → **HIS-002b** lint e camadas (Preparada; implementação depois da 002a no `main`)
  → HIS-003 base de segurança (Preparada). Agora: seguranca ‖ qa ‖ ux na etapa 3 das duas.
- HIS-004 (sem menção a instituição de ensino; espaços reservados desligados) já entregue.
- Backlog priorizado para a Sprint 1: **HIS-110** (contraste das cores padrão), HIS-107 (zoom 200%), HIS-102, HIS-103.
  Sprint 3: **HIS-109** antes da HIS-301. Sprint 4: HIS-108, HIS-101, HIS-105, HIS-106.

## Decisões em vigor

- Sprints de uma semana; a Sprint 0 vem antes de qualquer função nova.
- Prioridade: impacto para a família → inclusão → dependências técnicas → custo zero.
- Espaços para parceiros ficam desligados até uma história própria do épico E11.
- Achado de acessibilidade **médio** (ex.: reflow WCAG 1.4.10) entra na sprint de inclusão seguinte e antes de história
  que agrave o mesmo problema; **baixo** entra antes do teste com famílias (HIS-106).
- Em história de refatoramento (E0), achado pré-existente vai para o backlog com destino, não para o escopo.
- HIS-002: violação do axe que exige mudança visível vira exceção nomeada (regra + página + ID de história), nunca regra
  desligada; o e2e cobre as verificações de comportamento do `e2e-base`, não pixels/DOM.
- HIS-002 dividida (2026-10-29): 002a (critérios 2, 3, 4, 6, 9) → 002b (1, 5, 7, 8, 10 = T1, 11 = os 8 `eslint-disable`
  da HIS-109), em sequência na implementação, em paralelo na preparação. Numeração original dos critérios mantida.
  Arquivo da 002a manteve o nome antigo (links).
- Defeito de acessibilidade nas **cores padrão** não vai para a HIS-102 (modo opcional): vai para história própria
  (HIS-110), porque o padrão é o que todo mundo vê. Correção de defeito pode entrar antes do fim da Sprint 0 se houver
  gente livre; função nova não.
- Se a Sprint 1 não couber, passa a HIS-102, nunca a HIS-103 (Tarifa Social, maior impacto na conta).
- Dívida técnica que toca arquivos de uma história futura entra antes dela (HIS-109 antes da HIS-301).

## Pendências

- HIS-001: quem orquestra integra a `his-001-camadas` ao `main` antes de abrir a `his-002-qualidade`.
- Dono do projeto: decidir o texto novo da nota "Estado atual" do `CLAUDE.md` (proposto pela documentacao).
- Dono do projeto, ao fechar a HIS-002a: checks "Lint, tipos e testes" e "Navegador (e2e, axe e peso)" obrigatórios na
  proteção do `main`. No fechamento da HIS-002b, conferir que continuam obrigatórios.
- HIS-002a: esperar seguranca (Ameaças) + qa (D9, D10) para liberar a etapa 4; ux (5 nomes) antes do A5.
- HIS-002b: esperar seguranca (Ameaças + 21 casos) + qa (D6) e a 002a no `main` para liberar a etapa 4.
- Refinar HIS-110 (arquivo de história, com a ux) antes da Sprint 1 — ou antes, se for puxada assim que a 002a integrar.
- Refinar HIS-107 (critério verificável: em 390 px com zoom 200%, `scrollWidth <= clientWidth` em todas as rotas) antes da Sprint 1.
- Acompanhar a pergunta aberta da HIS-003.
- Preparar o roteiro do teste com famílias (HIS-106) com a UX.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

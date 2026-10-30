# Contexto · Scrum Master / Product Owner

## O que eu cuido

- `docs/planejamento.md` — visão, épicos, histórias, sprints, riscos, custos.
- `docs/equipe/quadro.md` — quadro da sprint e backlog priorizado.
- `docs/equipe/historias/` — refinamento das histórias (modelo em `docs/equipe/modelos/historia.md`).
- `docs/equipe/retros.md` — retrospectivas.

## Estado atual

- **Sprint 0 (Fundação)**: HIS-001 **Pronto** (2026-10-29) → **HIS-002a** testes no navegador (**Pronto** em
  2026-10-30, com a ressalva Ra9; arquivo `HIS-002-qualidade-automatica.md`; falta integrar ao `main`) → **HIS-003a** dados quebrados (Preparada; arquivo
  `HIS-003-base-de-seguranca.md`) ‖ **HIS-002b** lint e camadas (Preparada) → **HIS-003b** campos com limite
  (Preparada; `HIS-003b-campos-com-limite.md`).
- **HIS-111** tarifas vencidas (E2, defeito com número errado no ar em 227 cidades): **Sprint 0, prioridade 1**,
  Preparada, um corte só, branch própria saindo do `main`, em paralelo com o fim da 002a; antes do a3 da 003a (sem
  bloquear o a3 se travar). Critérios 12 (V7) e 13 (Pronto só depois do h8) criados por mim.
- HIS-004 (sem menção a instituição de ensino; espaços reservados desligados) já entregue.
- Backlog priorizado para a Sprint 1: **HIS-110** (contraste das cores padrão), HIS-107 (zoom 200%), HIS-102, HIS-103.
  Sprint 2: **HIS-206** primeiro (Nova Santa Rita, PI, × CERTAJA; Preparando), depois HIS-201, HIS-205, HIS-104.
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
- HIS-003 dividida (2026-10-30): 003a (critérios 1–4, 6, 7 e o 5 no domínio; a1–a7) e 003b (5 nas telas + critério 8
  novo do T6; b1–b3). Arquivo da 003a manteve o nome antigo. 003a ‖ 002b em branches separadas, integradas uma de cada
  vez (empate: 003a antes, por ter as ameaças altas); 003b depois da 003a no `main`. As cinco fecham a Sprint 0.
- Na quebra, critério que só existe nos textos (ex.: T6) ganha critério Dado/Quando/Então próprio na história nova.
- **Número errado no ar passa na frente de fundação** (HIS-111, 2026-10-30). Ele entra na sprint em andamento e é
  integrado primeiro se ficar pronto junto com outra história. Não bloqueia quem depende dele: se travar, o outro segue
  e quem chega depois faz o rebase.
- História que corrige dados publicados só fica Pronta depois de os arquivos **publicados** serem conferidos (h8).
- Barreira com veto do dominio-energia (ex.: V7) precisa de critério de aceite próprio.
- Ressalva **baixa** da seguranca que depende de acesso que a equipe não tem (ex.: Ra9, artefato no GitHub) não
  bloqueia o Pronto. Ela fica anotada no status da história e vira pendência do dono no quadro.
- Número errado em **poucas cidades**, quando a família costuma escolher a opção certa (ex.: HIS-206), vai para o
  backlog da sprint de precisão seguinte, e não para a sprint em andamento. A regra da HIS-111 vale para defeito em
  massa.

## Pendências

- HIS-001: quem orquestra integra a `his-001-camadas` ao `main` antes de abrir a `his-002-qualidade`.
- Dono do projeto: decidir o texto novo da nota "Estado atual" do `CLAUDE.md` (proposto pela documentacao).
- HIS-002a: quem orquestra integra ao `main` e cola a tabela de peso do runner (D14). O dono confere o artefato do
  `32f2cff` (Ra9).
- HIS-206: dominio-energia confirma os 3 casos e a lista completa (critérios 1 e 2); backend diz de onde vem a UF de
  cada distribuidora. Se passar de ~10 cidades, reavaliar o tamanho. Começa depois da HIS-111 no `main`.
- Dono do projeto, ao fechar a HIS-002a: checks "Lint, tipos e testes" e "Navegador (e2e, axe e peso)" obrigatórios na
  proteção do `main`. No fechamento da HIS-002b, conferir que continuam obrigatórios.
- HIS-002b: etapa 4 depois da 002a no `main`.
- HIS-003a: P-tl-1 (seguranca, bloqueia a2) e P-tl-2 (dominio-energia, bloqueia a3) abertas; etapa 4 depois da 002a.
- HIS-003b: qa escrever o "Plano de testes"; etapa 4 depois da 003a no `main`.
- HIS-111: seguranca (workflow do T3 e V8; bloqueia o h0) ‖ ux (aviso do D7; bloqueia o h6). Quem orquestra faz o
  push da branch (passo 0) e cola o resumo; no h8, roda o `atualizar-dados.yml`. Conferir na Pronto da 003a que o caso
  (h) do `casa-salva.spec.ts` entrou.
- Backlog: "avisar quando não der para salvar" (risco 6 da 003a) ainda sem ID; criar quando refinar a Sprint 1.
- Refinar HIS-110 (arquivo de história, com a ux) antes da Sprint 1, ou antes disso se ela entrar logo depois de a 002a
  integrar. A correção dos 2 `<dd>` já está na linha do planejamento. Falta decidir `corDaParte` × `faixaDoPeso`.
- Refinar HIS-107 (critério verificável: em 390 px com zoom 200%, `scrollWidth <= clientWidth` em todas as rotas) antes da Sprint 1.
- Preparar o roteiro do teste com famílias (HIS-106) com a UX.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

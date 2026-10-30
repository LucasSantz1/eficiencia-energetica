# Diário · Scrum Master / PO

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-30 · HIS-111 · Sprint 0, prioridade 1, um corte só; T5 aceito
- O que fiz: respondi a pergunta de prioridade e sprint; apliquei o T5 do tech-lead nos critérios 1, 3, 5, 6 e 8; criei
  os critérios 12 (V7 e `--forcar`) e 13 (Pronto depois do h8); pus o caso (h) no `casa-salva.spec.ts` da a7 da 003a;
  atualizei quadro e planejamento (HIS-111 no E2 e na Sprint 0).
- Decisões e porquê: o número errado no ar (11% a 55% a menos em 227 cidades) passa na frente; é defeito e o backend
  está livre. O a3 vem depois, mas não espera se a HIS-111 travar. Um corte só, porque as sucessões estão confirmadas
  e uma falha do V7 em ENF ou EBO não deixa nenhuma cidade sem distribuidora ("Só ela" = 0).
- Arquivos: `docs/equipe/historias/HIS-111-tarifas-vencidas.md`, `docs/equipe/historias/HIS-003-base-de-seguranca.md`,
  `docs/equipe/quadro.md`, `docs/planejamento.md`, `contexto.md`, este diário.
- Próximos passos: seguranca (T3, V8) ‖ ux (D7); backend h0 a h5; quem orquestra faz o push e cola o resumo do passo 0.

## 2026-10-30 · HIS-003 · quebra em 003a/003b aceita (P-tl-3)
- O que fiz: retitulei a HIS-003 como HIS-003a (mesmo arquivo e branch), com o critério 5 só no domínio; criei a
  HIS-003b a partir do modelo, movendo T5, T6, o bloco "T5 e T6" do D5, o `campos.spec.ts` e b1–b3, com remissões;
  escrevi o critério 8 (T6), que faltava; atualizei quadro e planejamento.
- Decisões e porquê: 3,75 dias não cabem em M. 003a primeiro (A1, A2, A7 altas); 003a ‖ 002b porque o lockfile não
  muda e o conflito é pequeno (empate: 003a antes); 003b depois da 003a (usa o a1 e as mesmas telas do T2). Tudo na
  Sprint 0.
- Arquivos: `docs/equipe/historias/HIS-003-base-de-seguranca.md`, `docs/equipe/historias/HIS-003b-campos-com-limite.md`
  (novo), `docs/planejamento.md`, `docs/equipe/quadro.md`, `contexto.md`, este diário.
- Próximos passos: seguranca (P-tl-1) ‖ dominio-energia (P-tl-2) ‖ qa (plano da 003b); etapa 4 da 003a depois da 002a.

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

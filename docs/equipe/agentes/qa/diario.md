# Diário · QA

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-30 · HIS-111 · h7: dados ok, critério 8 em e2e, devolvido pelo peso de JS
- O que fiz: conferi os critérios 1, 2, 9 e 10 no diagnóstico 4; junção 111 + 002a por `merge-tree` numa cópia;
  barreiras verdes; spec novo `troca-distribuidora.spec.ts` (7 testes × 2 larguras, estável em 3 repetições); e2e da
  002a inteiro; roteiro exploratório (teclado, zoom 200%, reduzido, nomes acessíveis) com capturas.
- Decisões e porquê: devolvido para frontend: o `peso-js.spec.ts` reprova só com o código da 111 (a 002a sozinha passa).
  O spec fica na branch 111 sem a infraestrutura da 002a (não entra no tsconfig do site), para rodar quando as duas se
  juntarem. Tarifas de teste derivadas do publicado em tempo de execução, para o teste valer antes e depois do h8.
- Arquivos: `apps/web/e2e/troca-distribuidora.spec.ts`, `apps/web/e2e/fixtures/casa-v2-rge-sul.json`,
  `apps/web/e2e/fixtures/substituidas-his111.json`, HIS-111, `contexto.md`, este diário. Evidências em
  `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/qa-his111-capturas/`.
- Próximos passos: reconferir o peso depois do frontend; h8.

## 2026-10-29 · HIS-001 · etapa 5: comparação, 11a/11b e testes manuais — aprovado
- O que fiz: build próprio de `182f355` numa cópia isolada (o `.next` do repositório foi reconstruído por outro agente no
  meio do teste) e de `57700ab` em outra; barreiras verdes; `capturar` + `comparar` → "nada mudou"; 11a/11b no
  `linha-de-base.cjs` (modo `medir-js-html`, logs ignorados no `comparar`) com teste negativo; roteiro manual
  `manual-qa.cjs` rodado nos dois builds (relatório e 18 árvores de acessibilidade idênticos); olhei 9 capturas;
  "Plano de testes" (11a/11b + "Resultado da etapa 5") e nota na HIS-001.
- Decisões e porquê: aprovado — nenhuma regressão; 11a caiu em todas as rotas, 11b +1 449 B (limite 2 048). Achados
  P1–P4 são pré-existentes (iguais no `main`), registrados para o backlog, não devolvidos. Manual comparado com o `main`
  para separar regressão de defeito antigo.
- Arquivos: `apps/web/e2e-base/linha-de-base.cjs`, `docs/equipe/historias/HIS-001-camadas.md`, `contexto.md`, este diário.
  Evidências em `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/his001/depois-qa/`,
  `manual-qa-depois/`, `manual-qa-main/`; `antes/js-do-html.json` acrescentado (11a do `main`).
- Próximos passos: HIS-002 (testes no CI com axe, a partir do `manual-qa.cjs`).

## 2026-10-29 · HIS-001 · linha de base antes da refatoração e plano de testes
- O que fiz: build e site de produção do código atual (= `main` `57700ab`); script `apps/web/e2e-base/linha-de-base.cjs`
  (fluxo completo em 390 e 1280, capturas, textos, DOM com movimento reduzido, casa salva, migração v1/v2, portão de
  hidratação, editor, plano ao remover, apagar tudo, transições, bytes de JS, rotas, manifesto de prerender) e modo
  `comparar`; fixtures v1/v2; linha de base + controle ("nada mudou") + teste negativo (4 de 4 acusadas);
  "Plano de testes" da HIS-001 com 13 itens, números e critérios; nota na conversa.
- Decisões e porquê: relógio/ids/fuso fixos para comparar byte a byte; tolerância 16/255 nas capturas (ruído medido);
  bytes por arquivo `.js`; evidências fora do git. Avisei a segurança que `/casa/aparelhos` responde 200 (não 307).
- Arquivos: `apps/web/e2e-base/linha-de-base.cjs`, `apps/web/e2e-base/fixtures/casa-v1.json`, `casa-v2.json`,
  `docs/equipe/historias/HIS-001-camadas.md`, este diário e `contexto.md`. Evidências em
  `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/his001/antes/`.
- Próximos passos: etapa 5 da HIS-001 (comparar o "depois" e testes manuais).

## 2026-10-29 · criação da equipe
- O que fiz: Forma de testar o site e seletores atuais registrados no contexto.
- Próximos passos: ver "Pendências" em `contexto.md`.

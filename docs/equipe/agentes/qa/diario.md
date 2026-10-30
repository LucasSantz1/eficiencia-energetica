# Diário · QA

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-30 · HIS-002a · A5 fechado, A7 (tira o e2e-base) e etapa 5 aprovada
- O que fiz: seletor do `aparelhos.spec.ts` pelo nome do D-A5-1 (`d5a4940`); `git rm -r apps/web/e2e-base` e 2
  comentários do `e2e/` (`020db92`); e2e completo e `--repeat-each=3` numa cópia própria; M1–M16 plantadas numa
  segunda cópia (mais M1b–M1d); `--list` local × `GITHUB_ACTIONS=true`; `pnpm audit`.
- Decisões e porquê: M1 é mutante equivalente (`merge` do `persist`), provado com M1b e separado do defeito real
  (M1c/M1d); `ajustes.spec.ts` nomeia as listas para a falha dizer qual sobrou; M14 com ~3,5 KB para passar dos 2 limites.
  Aprovado com pendências que não são defeito: revisão da ux em `excecoes-axe.ts` e as conferências do A6 no CI.
- Arquivos: `apps/web/e2e/{aparelhos,ajustes,migracao,peso-js}.spec.ts`, `apps/web/e2e-base/**` (removido), a história,
  ADR-003 (consequências), `contexto.md`, este diário.
- Próximos passos: depois do push, peso do runner × local e artefato (critério 4); HIS-002b, etapa 5 (V1–V8).

## 2026-10-30 · HIS-002a · etapa 4: A1–A5 implementados; A5 devolvido ao frontend com 2 defeitos
- O que fiz: Playwright/axe com versão exata, `playwright.config.ts`, fixture de console/página/rede, `rotas`,
  `sanidade` (N1–N8), `fluxo-principal` com transição por passo, `migracao`, `aparelhos`, `ajustes`, `transicoes`,
  `teclado`, `comodos`, `peso-js` + `peso-js.json`, `acessibilidade` (24 telas × 2) + `excecoes-axe.ts`; Ra1–Ra5,
  Ra11–Ra13; cada negativo conferido desligando a barreira; peso do `main` reproduzido byte a byte.
- Decisões e porquê: referência de peso com o lockfile novo (é o que o CI compila); `estado` da exceção = estados das 24
  telas; fixtures no A1 (o `rotas` precisa da casa); `apoio/transicoes.ts` e `apoio/telas.ts` além do D9 (coesão).
  Defeitos D-A5-1 e D-A5-2 não viraram exceção: corrigem-se sem mudança visível (critério 3).
- Arquivos: `apps/web/e2e/**`, `apps/web/playwright.config.ts`, `apps/web/package.json`, `package.json`,
  `pnpm-lock.yaml`, `.gitignore`, `docs/planejamento.md` (HIS-110), a história, `contexto.md`, este diário.
- Próximos passos: correção do frontend → A5 verde; etapa 5 (M1–M16, `--repeat-each=3`); A7.

## 2026-10-29 · HIS-002 · revisão do D9/D10 (002a) e do D6 (002b) e plano de testes das duas
- O que fiz: li as duas histórias, o ADR-003, a retro e o §10/R13 e a etapa 5 da HIS-001; comparei o D9/D10 com o
  `linha-de-base.cjs` e o `manual-qa.cjs`; conferi no código o movimento reduzido e o manifesto de prerender. Protótipo
  (pacotes da cópia do tech-lead, só leitura): `test.fail()` como negativo permanente da fixture de console e do axe
  (inteira → 0; quebrada → código 1), durações de view transition com `reduce` (250 → 0), ESLint `--stdin` com
  `--max-warnings 0` (aviso → código 1). Escrevi "Plano de testes", perguntas e nota nas duas histórias.
- Decisões e porquê: **revisado pelo qa, com observações** nas duas. 002a: a tabela do D9 perdia transição por passo
  (com `/sobre` → `/`), teclado/folhas, `#comodo-<id>`, `?visao=geral`, axe no cadastro e nas folhas, 11b com casa →
  P-qa-1…8 ao tech-lead, bloqueando só o A7. Saem com decisão: avisos de `htmlSize` e `sha256`. 002b: ids fixos em vez
  de origens, gêmeos permitidos, caso pela linha de comando, critério 11 automático → P-qa-b1…b3.
- Arquivos: `docs/equipe/historias/HIS-002-qualidade-automatica.md`, `docs/equipe/historias/HIS-002b-lint-e-camadas.md`,
  `contexto.md`, este diário. Protótipo em `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/qa-his002/prova/`.
- Próximos passos: respostas do tech-lead; etapa 4 da HIS-002a (A1–A5 pelo plano).

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

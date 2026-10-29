# Diário · QA

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

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

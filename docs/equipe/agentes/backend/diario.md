# Diário · Back-end

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-30 · HIS-111 · tarifas vencidas: 227 municípios, três causas, proposta D1–D7
- O que fiz:
  - Investiguei a P-de-1 da HIS-003 nos arquivos publicados de 29/10 e no código da rotina.
  - Reproduzi a C1 com o `montarArquivos` real: o CNPJ 02016440000162 dá sempre `rge-sul`.
  - Escrevi um diagnóstico de conjuntos extintos e o testei com as fixtures.
  - Criei a HIS-111 e pus uma nota na HIS-003.
- Decisões e porquê:
  - Mesmo CNPJ quer dizer renomeação automática. Sucessão entre CNPJs diferentes só com um ato oficial na tabela.
  - A barreira V1 a V6 faz a rotina parar antes de publicar.
  - O campo `substituidas` existe para a casa salva com `rge-sul` não ficar sem preço.
- Arquivos: `docs/equipe/historias/HIS-111-tarifas-vencidas.md` (novo), `HIS-003-base-de-seguranca.md` (nota),
  `contexto.md`.
- Scratchpad, temporário: `reproduzir-cnpj.ts` e `diagnosticar-sucessao.ts` em
  `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/backend-tarifas/`.
- Próximos passos:
  - respostas do dominio-energia (sucessões e limite) e do tech-lead (D7);
  - depois, o passo 0 com os CSVs e a implementação, após o a3 da HIS-003a.

## 2026-10-29 · criação da equipe
- O que fiz: Estado da rotina de dados da ANEEL registrado no contexto.
- Próximos passos: ver "Pendências" em `contexto.md`.

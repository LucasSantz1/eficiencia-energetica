# Diário · Back-end

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-30 · HIS-111 · h0–h5: diagnóstico, sucessões, D1–D4, barreiras V1–V10 e core
- O que fiz:
  - Seis commits na branch `his-111-tarifas-vencidas`, todos com `pnpm typecheck` e `pnpm test` verdes; `pnpm build`
    verde no h5.
  - h0: diagnóstico só de leitura e workflow do passo 0.
  - h1: `sucessoes.json` e o leitor.
  - h2: D4 e V7.
  - h3: D1, D2, D3 e `substituidas`.
  - h4: `conferirCoerencia`, V5 e V6, rotina testável e anotações.
  - h5: funções do core.
- Decisões e porquê:
  - O D1 também olha as tarifas descartadas pelo D4, senão `rge-sul` não entra em `substituidas`.
  - O D3 usa a regra segura do tech-lead.
  - O V4 vale com "publicada", e "vigente" vem do V1 (pergunta ao tech-lead).
  - A rotina lê o `sucessoes.json` antes de baixar.
  - Os links extras das sucessões foram para o campo `observacao`.
  - Erro achado e corrigido no caminho: `map(celulaMarkdown)` passava o índice do `map` como limite de tamanho.
    Lição: não passar a função direto para o `map` quando ela tem parâmetro opcional.
  - O `\u2028` escrito pela ferramenta virou o caractere de verdade e quebrou a expressão regular. Lição: em
    expressão regular, escrever caracteres de controle por script, com escape.
- Arquivos: ver a nota na HIS-111 ("[backend] 2026-10-30 — h0 a h5").
- Próximos passos: o resultado do passo 0; ajustar se o portão reprovar; h8 (gatilho do workflow e teste dos
  publicados).

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

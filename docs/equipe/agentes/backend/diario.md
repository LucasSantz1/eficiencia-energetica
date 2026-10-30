# Diário · Back-end

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-30 · HIS-111 · segunda execução: RGE antiga (outro CNPJ) entra no sucessoes.json
- O que fiz: corrigi a regressão do `2804a5c` (263 cidades da RGE antiga sem tarifa) com a linha 12. A fixture ganhou
  Caxias do Sul. `pnpm typecheck` e `pnpm test` (dados 83) verdes.
- Lição: antes de endurecer uma regra de ligação, contar no diagnóstico quantos vínculos ela recusa. Só a execução real
  mostrou a RGE antiga, porque ela não tem tarifa nem aparece como vencida.
- Próximos passos: nova execução; confirmação da linha 12 pelo dominio-energia.

## 2026-10-30 · HIS-111 · passo 0: D3 e sigla corrigidos, critério 2 do diagnóstico, linha da CPFL SANTA CRUZ
- O que fiz:
  - Colei o resumo da execução 41095055344 na história e analisei cada ponto.
  - Fiz cinco commits: `8e0d990` (D3), `2804a5c` (sigla × CNPJ), `cc51fcb` (diagnóstico), `3d916ce` (linha 11 e
    ato da CERR, com os arquivos do dominio-energia) e `0e8167b` (sigla sem CNPJ).
  - `pnpm typecheck`, `pnpm test` (dados 81, core 48) e `pnpm build` verdes.
- Decisões e porquê:
  - O arquivo de conjuntos para em 2014. Por isso o ano sozinho marcava empresa vigente como extinta. Agora o D3 só
    olha o vínculo sem tarifa publicada.
  - Nome igual não é mesma empresa: a sigla exige a mesma raiz de CNPJ (ADR-005, item 2).
  - O "45" era o id `cpfl-santa-cruz`, que é o mesmo da sigla vencida e da vigente (27 + 7 + 5 + 4 + 2).
- Lição: um `git add -A packages/dados` levou para o meu commit uma edição do dominio-energia feita ao mesmo tempo
  no `sucessoes.json`. Desfiz o commit local (nada tinha subido) e refiz sem ela. Com outro agente na mesma
  worktree, adicionar arquivo por arquivo.
- Arquivos: `packages/dados/src/montar.ts`, `rotina.ts`, `diagnostico.ts`, `aneel/municipios.ts`,
  `base/sucessoes.json`, as fixtures `fixtures/sucessao/conjuntos-*.csv`, os testes `montagem-sucessao`, `rotina`,
  `diagnostico` e `sucessoes`, e a história.
- Próximos passos: rodar o diagnóstico de novo, depois o h7 (qa) e o h8.

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

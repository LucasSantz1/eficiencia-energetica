# Contexto · Back-end

## O que eu cuido

- Rotina de dados `packages/dados/` e a Action `.github/workflows/atualizar-dados.yml`.
- Futuro: `supabase/` (migrações, RLS, funções), `apps/web/src/infraestrutura/` para a sincronização, Web Push.

## Estado atual

- Rotina: baixa CSVs da ANEEL com 6 tentativas e espera crescente (`csv.ts`), detecta Latin-1/UTF-8, lê tarifas B1
  vigentes, bandeiras e municípios (IndQual Município × atributos dos conjuntos), usa cópia local do IBGE, valida
  (`montar.ts`), remove duplicados por slug e só grava se a assinatura mudou (`escrever.ts`).
- Resultado atual: 114 distribuidoras e 5.561 de 5.571 municípios com distribuidora.
- O resumo da rotina sai como anotação `::notice` no job (lido pela API de check-runs).
- Ainda não há banco nem servidor próprio.

## Decisões em vigor

- Ler a ANEEL direto (a tarifas-energia-api usa só a TE e bandeiras fixas).
- A API do IBGE falha nos runners do GitHub: usar a cópia em `packages/dados/base`.
- Supabase planejado com RLS em todas as tabelas e só consultas parametrizadas.

## Pendências

- HIS-205 (mais nomes comerciais de distribuidoras) e HIS-202 (impostos) com o especialista em energia.
- Épico E4 (Supabase) a partir da Sprint 6.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

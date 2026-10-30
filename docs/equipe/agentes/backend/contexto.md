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
- **Problema conhecido (HIS-111, 2026-10-30):** 227 municípios estão ligados a 11 empresas incorporadas, com tarifa de
  2016 a 2023 (de 11% a 55% abaixo da real). As causas estão em `montar.ts` e `aneel/municipios.ts`:
  - (C1) o `porCnpj` fica com a última sigla em ordem alfabética, por isso RGE SUL ganha da RGE;
  - (C2) conjunto elétrico extinto ainda liga a cidade;
  - (C3) não há limite de idade da tarifa nem checagem de `fimVigencia` no `validar`.
  A correção proposta é D1 a D7 na história.
- A rede do ambiente de nuvem **não alcança** `dadosabertos.aneel.gov.br` (o proxy devolve 403). Para usar os CSVs
  brutos, só pela Action ou numa máquina com acesso.

## Decisões em vigor

- Ler a ANEEL direto (a tarifas-energia-api usa só a TE e bandeiras fixas).
- A API do IBGE falha nos runners do GitHub: usar a cópia em `packages/dados/base`.
- Supabase planejado com RLS em todas as tabelas e só consultas parametrizadas.
- (HIS-111, proposta) Siglas com o mesmo CNPJ são a mesma empresa: fica a vigência mais recente, e a outra vira
  renomeação. Empresa incorporada só troca de dono com ato oficial da ANEEL em `base/sucessoes.json`; nunca por
  coincidência de datas.

## Pendências

- **HIS-111 (prioridade alta):** a implementação espera duas coisas:
  - as sucessões confirmadas pelo dominio-energia e o D7 aprovado pelo tech-lead;
  - o fim do a3 da HIS-003a, porque mexe nos mesmos arquivos.
  O passo 0 é rodar o diagnóstico de conjuntos extintos com os CSVs. O script está descrito na história.
- HIS-003a: no a3, o corte da `tarifas.ts` passa a usar `LIMITES.tarifaKwh`. Entra também um alerta para bandeira
  acima de 0,15 (pedido do dominio-energia).

- HIS-205 (mais nomes comerciais de distribuidoras) e HIS-202 (impostos) com o especialista em energia.
- Épico E4 (Supabase) a partir da Sprint 6.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

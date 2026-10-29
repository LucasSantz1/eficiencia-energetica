# Dados

O site usa só dados públicos. Uma rotina automática baixa, confere e publica esses dados todo dia.

## Arquivos publicados

| Arquivo | Conteúdo |
| --- | --- |
| `apps/web/public/dados/tarifas.json` | distribuidoras (tarifa B1 vigente em R$/kWh, nome, estados atendidos), bandeiras por mês e adicional, data da atualização |
| `apps/web/public/dados/municipios/{UF}.json` | municípios do estado e as distribuidoras de cada um, da que atende mais para a que atende menos |

Não edite esses arquivos à mão: a rotina sobrescreve.

## A rotina diária

Arquivo: [`.github/workflows/atualizar-dados.yml`](../../.github/workflows/atualizar-dados.yml). Roda todo dia às 06:17
(horário de Brasília) e pode ser disparada à mão em **Actions → Atualizar tarifas e bandeiras → Run workflow**.

1. **Baixa** os CSVs da ANEEL (`packages/dados/src/csv.ts`), com até 6 tentativas e espera crescente, e detecta a
   codificação (Latin-1 ou UTF-8) e o separador.
2. **Tarifas** (`aneel/tarifas.ts`): residencial B1, convencional, "Tarifa de Aplicação", vigência atual; TE + TUSD em
   R$/MWh ÷ 1000.
3. **Bandeiras** (`aneel/bandeiras.ts`): adicional de cada mês; a unidade (R$/MWh ou R$/kWh) é detectada pela grandeza.
4. **Municípios** (`aneel/municipios.ts`): o IndQual Município liga município → conjunto elétrico; os atributos dos
   indicadores de continuidade ligam conjunto → distribuidora. Estados e nomes vêm da cópia local do IBGE
   (`packages/dados/base`), porque a API do IBGE falha nos servidores do GitHub.
5. **Monta e valida** (`montar.ts`): remove duplicados, ordena as distribuidoras pela cobertura e confere quantidades mínimas.
   Se algo parecer errado, **não grava** e mantém os dados anteriores.
6. **Grava** (`escrever.ts`) só se o conteúdo mudou e cria um commit. O commit gera um novo deploy do site.
7. **Publica um resumo** como anotação do job, visível na página da execução.

## Rodar à mão

```bash
pnpm dados:atualizar          # baixa e grava (precisa de internet)
pnpm dados:exemplo            # gera dados fictícios para desenvolver sem internet (o site mostra um aviso)
pnpm --filter @ee/dados test  # testes da leitura com arquivos de exemplo (packages/dados/fixtures)
```

## Situação atual

- 114 distribuidoras com tarifa vigente.
- 5.561 dos 5.571 municípios com distribuidora encontrada.

## Quando algo dá errado

| Sintoma | Causa provável | O que fazer |
| --- | --- | --- |
| Job falhou ao baixar | portal da ANEEL lento ou fora do ar | rodar de novo mais tarde; os dados anteriores continuam no site |
| Validação reclamou | ANEEL mudou o formato do arquivo | ver o resumo do job, ajustar o leitor e os testes com um novo arquivo de exemplo |
| Bandeira com valor estranho | mudança de unidade no arquivo | conferir `divisorDaUnidade` em `aneel/bandeiras.ts` |

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
6. **Confere o formato** (`formato.ts`, `conferirFormato`) antes de gravar, com os **mesmos leitores** que o site usa
   para abrir os arquivos (`lerArquivoTarifas`, `lerArquivoMunicipios` e `lerRelatorioDosDados`, do `@ee/core`; ADR-004).
   Na rotina a regra é estrita: estrutura errada ou qualquer entrada que o site descartaria é erro e nada é gravado.
   Isso vale mesmo com `--forcar`, que só relaxa a conferência de variação (item 5). Assim, um arquivo que o site
   recusaria nunca chega às famílias.
7. **Grava** (`escrever.ts`) só se o conteúdo mudou.
8. **Publica um resumo** como anotação do job, visível na página da execução.

### Os dois jobs da rotina

O workflow tem dois jobs, para que o código do projeto nunca rode com permissão de escrita:

| Job | Permissão | O que faz |
| --- | --- | --- |
| `gerar` | só leitura, sem nenhuma credencial | instala, baixa e confere os dados (passos 1 a 8), confere que nada mudou fora de `apps/web/public/dados` e entrega a pasta como artefato (1 dia). O log do resumo tem `%`, `\r` e quebras de linha escapados, para o texto da ANEEL nunca virar comando do runner |
| `publicar` | escrita no repositório | só roda no `main` e só se `gerar` achou mudança. Não instala nada nem roda código do projeto: troca a pasta pelo artefato, confere que só há JSON dentro de `apps/web/public/dados`, faz o commit e o `push`. Se o `main` já tiver os mesmos dados, sai sem commit |

Uma execução à mão em outra branch roda o `gerar`, mas não publica. O commit do `publicar` gera um novo deploy do site.

### O site também confere

Mesmo com a rotina estrita, o site não confia no arquivo: ao abrir, passa por `lerArquivoTarifas`/`lerArquivoMunicipios`.
Entrada fora do formato é descartada; estrutura errada vira a mensagem "Não conseguimos carregar..." com "Tentar de novo",
sem tela branca. A página inicial, no servidor, usa os mesmos leitores e, se falhar, mostra números aproximados.

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
| Conferência de formato reclamou (`tarifas.json: N entrada(s) fora do formato`) | a ANEEL trouxe valor fora da faixa ou campo novo | ver o resumo do job, o limite em `packages/core/src/limites.ts` e a fonte dele; não existe atalho para gravar mesmo assim |
| Validação reclamou | ANEEL mudou o formato do arquivo | ver o resumo do job, ajustar o leitor e os testes com um novo arquivo de exemplo |
| Bandeira com valor estranho | mudança de unidade no arquivo | conferir `divisorDaUnidade` em `aneel/bandeiras.ts` |

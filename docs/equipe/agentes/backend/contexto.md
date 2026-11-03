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
- **HIS-003a (2026-11-03, branch `his-003a-dados-quebrados`, sem push):** a1, a2, a3 e a6 feitos.
  - Core: `limites.ts` (único lugar dos limites), `entrada.ts`, `estados.ts`, `casa-salva.ts`, `arquivos-publicos.ts`
    e `leitura-segura.ts` (apoio, fora do `index.ts`). `DadosCasa` mora em `tipos.ts`.
  - Rotina: `formato.ts` (`conferirFormato`), chamado dentro do `escreverArquivos`; qualquer descarte impede a gravação,
    mesmo com `--forcar`. O `dados:exemplo` também passa por ele.
  - `atualizar-dados.yml` em dois jobs (`gerar` só leitura; `publicar` sem instalar nada, só no `main`).
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
- (HIS-003a) Na casa salva, medida confere só o limite físico (sem `inteiro` nem `casas`); contagem (quantidade, banho,
  pessoas) confere inteiro. Tela nova usa a faixa completa. Leitor sem `try/catch` próprio: o `merge` pega, sem regravar.
- (HIS-003a) Todo leitor tem a lista de campos com `listaCompleta<keyof T>()`: campo novo no tipo quebra o `typecheck`,
  e o teste de chaves reprova se o leitor não devolver o campo.
- (HIS-111, proposta) Siglas com o mesmo CNPJ são a mesma empresa: fica a vigência mais recente, e a outra vira
  renomeação. Empresa incorporada só troca de dono com ato oficial da ANEEL em `base/sucessoes.json`; nunca por
  coincidência de datas.

## Pendências

- HIS-111: PR #5 aberta (implementada em `/home/claude/ee-his111`); a 003a faz o rebase depois dela.
- HIS-003a: rebase sobre a HIS-111 quando ela entrar. Conflito só nos imports da `tarifas.ts`; depois, ler
  `substituidas` no `lerArquivoTarifas` pelo contrato P8 da 111 (o `typecheck` vai exigir) e rodar os testes da rotina
  da 111, que passam a gravar pelo `conferirFormato`.

- HIS-205 (mais nomes comerciais de distribuidoras) e HIS-202 (impostos) com o especialista em energia.
- Épico E4 (Supabase) a partir da Sprint 6.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

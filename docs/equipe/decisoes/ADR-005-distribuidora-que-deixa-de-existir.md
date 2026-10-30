# ADR-005 · Distribuidora que deixa de existir: tarifa vencida não sai, e quem guardou o id antigo continua com preço

- **Status:** aceito (2026-10-30, tech-lead). A `seguranca` revisou o workflow de diagnóstico e o V8 na análise de
  ameaças da HIS-111 (nota de 2026-10-30) e pediu dois acréscimos, já feitos: a condição da linha de sucessão no item 2
  (V9, V10) e "sucessão para empresa vigente" nas barreiras do item 5.
- **Data:** 2026-10-30
- **Responsável:** tech-lead, com backend e dominio-energia

## Contexto

As distribuidoras são compradas, juntadas ou renomeadas. A ANEEL mantém no arquivo as tarifas antigas e os conjuntos
elétricos antigos. A rotina não olhava a idade da tarifa e ligava 227 cidades a empresas que acabaram entre 2017 e 2023.
O resultado era uma conta de 11% a 55% menor que a real (HIS-111).

O id da distribuidora (`slug` da sigla) fica guardado no aparelho da família (`Residencia.distribuidoraId`). No futuro
ele também vai ficar no app e no Supabase (E4). Quando a empresa some do arquivo, esse id fica sem preço.

## Decisão

1. **A rotina não publica tarifa vencida há mais de 6 meses** (regra do dominio-energia). Avisa desde o 1º dia vencida.
2. **Uma empresa só vira outra por um destes dois caminhos:**
   - mesmo CNPJ (renomeação, automática, só quando a sigla antiga não está vigente);
   - uma linha de `packages/dados/base/sucessoes.json` com `ato` e `fonte` oficiais, revisada pelo dominio-energia.
     A linha só vale para empresa sem tarifa vigente, e as siglas batem com o CNPJ na ANEEL (V9 e V10 da HIS-111,
     pedido da seguranca no R3).

   A coincidência de datas entre as vigências só aparece no relatório, como candidata. Nunca troca sozinha.
3. **`tarifas.json` publica `substituidas`** (id antigo → id final). Todo valor é um id publicado, e nenhuma chave é.
4. **Quem guarda um id resolve pelo `@ee/core`** (`acharDistribuidora`, `distribuidorasDaCidade`), na leitura. A
   regravação do id novo é uma ação normal, feita uma vez pelo `aplicacao/`. O formato salvo não muda.
5. **Na dúvida, a rotina para em vez de publicar**, e nada é gravado. As barreiras de número errado ou de contrato
   (vencida, CNPJ repetido, sucessora ausente, mais de um valor na vigência da sucessora, `substituidas` inválido,
   sucessão para empresa vigente) não
   passam com `--forcar`. As de cobertura (agente sem tarifa, cidades sem distribuidora) passam, porque uma pessoa pode
   decidir publicar sabendo do efeito.

## Alternativas consideradas

- **Trocar o id no leitor da casa salva (`lerCasaSalva`):** ele roda na hidratação, antes de o `tarifas.json` chegar,
  e pelo ADR-004 ele não corrige valor.
- **`migrate` com versão nova da casa:** ele não tem o arquivo de tarifas e obrigaria uma versão nova a cada sucessão.
- **Adivinhar a sucessora pela data:** muitas distribuidoras fazem o reajuste no mesmo dia. Um erro trocaria a empresa
  de uma cidade sem ninguém ver.
- **Manter a tarifa vencida com aviso:** mostra um número errado. Tirar leva a "use o valor da sua conta de luz", que é
  honesto.

## Consequências

- Uma sucessão nova faz a rotina parar até alguém acrescentar a linha com o ato. Os dados do dia anterior ficam no ar.
- O app (Expo) e o Supabase (E4) usam as mesmas funções do core para resolver um id guardado.
- O diagnóstico (`pnpm dados:diagnosticar` e `diagnosticar-dados.yml`) fica no repositório para a próxima vez.

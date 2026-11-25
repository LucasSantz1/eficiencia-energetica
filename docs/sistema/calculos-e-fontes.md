# Cálculos e fontes

Como cada número do site é calculado e de onde vem. Todo o código destes cálculos está em `packages/core/src/`
e é coberto por testes automáticos (`packages/core/test/`).

## Consumo de um aparelho

```
kWh/mês = potência (W) ÷ 1000 × (minutos por dia ÷ 60) × (dias por semana ÷ 7) × 30 × quantidade × fator de ciclo
```

- **Mês de 30 dias.**
- **Frequência:** todo dia (7), dias úteis (5), alguns dias por semana (3, 2, 1) ou poucas vezes no mês
  (2 vezes = 14/30 dias por semana; 1 vez = 7/30).
- **Fator de ciclo:** aparelhos com motor que liga e desliga sozinho não gastam a potência cheia o tempo todo.

| Aparelho | Fator de ciclo |
| --- | --- |
| Ar-condicionado split inverter | 0,6 |
| Ar-condicionado split comum | 0,85 |
| Ar-condicionado de janela ou portátil | 0,9 |
| Demais aparelhos | 1 |

- **Geladeira e freezer:** o consumo vem em kWh/mês, como na etiqueta do INMETRO, por modelo e idade.
- **Ar-condicionado:** potência estimada por mil BTUs conforme o tipo (inverter, split comum, janela, portátil).
- **TV:** potência por tecnologia (LED, LCD, plasma, tubo) e tamanho.

Exemplo coberto por teste: geladeira de 75 W ligada 24 h → 1,8 kWh/dia → 54 kWh/mês; com R$ 0,65/kWh, R$ 35,10/mês.

## Preço do kWh

| Situação | Preço usado | Inclui impostos? |
| --- | --- | --- |
| A família informou uma conta | valor da conta ÷ kWh cobrados | sim |
| Sem conta | tarifa da distribuidora (TE + TUSD) + adicional da bandeira do mês | não |

Com **Tarifa Social**, a conta já vem sem os primeiros 80 kWh. Por isso o preço real é o valor dividido só pelos kWh
cobrados (kWh da conta − 80). Se sobrarem menos de 10 kWh cobrados, a conta não serve de referência e o site usa a tarifa.

## Conta do mês

| Regra | Como funciona | Fonte |
| --- | --- | --- |
| Consumo mínimo (custo de disponibilidade) | Se a casa consome menos que o mínimo, paga o mínimo: 30 kWh (monofásica), 50 kWh (bifásica), 100 kWh (trifásica) | REN ANEEL 1.000/2021 |
| Tarifa Social | Até 80 kWh no mês, nada é cobrado (nem o mínimo). Acima disso, cobra-se o maior entre o consumo e o mínimo, menos os 80 kWh: trifásica com 90 kWh paga 20 kWh; bifásica com 85 kWh paga 5 kWh | Lei 12.212/2010, art. 1º, na redação da Lei 15.235/2025; O Setor Elétrico (2025) e Cenário Energia (10/06/2025) para o mínimo |
| Desconto Social | Desconto em contas de até 120 kWh para renda de ½ a 1 salário mínimo por pessoa; o site só avisa, porque o percentual varia | Lei 15.235/2025 |
| Iluminação pública (CIP/COSIP) | Valor fixo que a pessoa informa; sai do preço do kWh (para as dicas não economizarem mais do que a conta cai) e volta somada na conta estimada | Lei municipal de cada cidade; o site não estima |

A **conta detalhada** (`detalharConta`, HIS-201) mostra essas regras em linhas, em centavos: energia, bandeira (só com a
tarifa da ANEEL; no preço da conta ela já vem dentro), o que falta até o mínimo, o desconto da Tarifa Social (negativo)
e a iluminação pública. O centavo de arredondamento vai para a linha de energia, e a soma sempre bate com o valor grande.

## Dicas e plano de economia

Cada dica muda os aparelhos da própria casa (por exemplo, menos minutos de chuveiro ou troca de lâmpada) e recalcula a
conta inteira com as mesmas regras acima. A economia é a diferença entre a conta atual e a conta com a mudança.
O plano soma as dicas escolhidas sem contar a mesma economia duas vezes.

**Meta de gasto** (`avaliarMeta`, HIS-104): o site compara a conta estimada com a meta. Abaixo do piso (a conta com 0 kWh,
ou seja, o mínimo e as taxas), a meta não é possível. Se falta, escolhe até 3 dicas, uma de cada vez, sempre a que mais
baixa a conta em cima das já escolhidas (hábitos primeiro, troca de aparelho só se os hábitos não chegarem lá). O valor de
cada dica na folha da meta é o que ela economiza **depois** das de cima, e os valores somam o total exato. Sem conta de
luz, ou com os aparelhos longe da conta (20% ou mais), a meta diz "ajudam", nunca "chegam lá".

**"Não sei qual é o meu"** (`reconhecer` e `faixaDeConsumo`, `@ee/core/reconhecer`): cada resposta só estreita as
opções que o catálogo já tem; nenhum número novo entra. A faixa vai da combinação que menos gasta à que mais gasta, e o
valor usado é o das escolhas mais comuns.

## Fontes oficiais

| Dado | Fonte |
| --- | --- |
| Tarifas residenciais B1 | [ANEEL · Tarifas de aplicação das distribuidoras](https://dadosabertos.aneel.gov.br/dataset/tarifas-distribuidoras-energia-eletrica) |
| Bandeiras tarifárias | [ANEEL · Bandeiras Tarifárias](https://dadosabertos.aneel.gov.br/dataset/bandeiras-tarifarias) |
| Distribuidoras por município | [ANEEL · IndQual Município](https://dadosabertos.aneel.gov.br/dataset/indqual-municipio) + [Indicadores de continuidade](https://dadosabertos.aneel.gov.br/dataset/indicadores-coletivos-de-continuidade-dec-e-fec) |
| Consumo mínimo | Resolução Normativa ANEEL 1.000/2021 |
| Tarifa Social e Desconto Social | Lei 12.212/2010, na redação da Lei 15.235/2025 |
| Consumo típico de aparelhos | Etiquetas do INMETRO (PBE) e tabelas do PROCEL |

## Limites conhecidos

- Sem conta de referência, a estimativa não inclui ICMS, PIS/COFINS nem iluminação pública (planejado no épico E2).
- O tempo de uso é o que a família informa; a conta real também varia com os dias de leitura.

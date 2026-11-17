# HIS-104 · Meta de gasto: "quero pagar até R$ X"

| Campo | Valor |
| --- | --- |
| Épico | a definir (scrum-master) |
| Sprint | a definir |
| Tamanho | M |
| Papéis principais | dominio-energia (regras, textos, casos), frontend, qa; ux e segurança na revisão |
| Status | Preparando (regras, casos e textos do domínio-energia prontos; faltam ux, tech-lead e segurança) |
| Branch | `his-104-meta` |

> **Processo:** esta história mexe no cálculo da conta e na Tarifa Social. Pelo modo rápido do `processo.md`, isso é
> **sensível**: vale o processo completo (domínio, ux, segurança e qa separados), não só a revisão do tech-lead.

## Problema e valor

Como **família**, eu quero **dizer quanto posso pagar de luz por mês** para **ver quanto falta e quais dicas me levam até lá**.
Hoje o painel mostra a conta e as dicas soltas. A família pensa em "quanto cabe no bolso", não em kWh.

## Critérios de aceite

1. **Dado** a casa com conta estimada de R$ 160,00 (caso C1) **quando** a pessoa digita a meta R$ 120,00 **então** o painel
   diz "Falta economizar R$ 40,00 por mês" e mostra o piso (R$ 24,00).
2. **Dado** uma meta menor que o piso (C2) **quando** a pessoa digita **então** o painel **não** mostra "falta" nem dicas;
   mostra o texto "abaixo do que dá para pagar" com a menor meta possível.
3. **Dado** a meta igual ou maior que a conta estimada (C3) **então** o painel diz que já está dentro e mostra a folga.
4. **Dado** duas dicas no mesmo aparelho (C4) **quando** o painel soma a economia **então** o total vem de `simularPlano`
   (R$ 12,67), nunca da soma das economias soltas (R$ 14,08).
5. **Dado** a Tarifa Social (C5) **quando** a economia passa dos 80 kWh isentos **então** o total respeita o limite
   (R$ 12,67 no caso; a soma simples daria R$ 14,08).
6. **Dado** que as dicas somadas não chegam à meta (C4, meta R$ 147,00) **então** o painel diz "ajudam, mas não chegam lá",
   mostra quanto ainda falta (R$ 0,33) e a conta que dá para alcançar (R$ 147,33).
7. **Dado** a casa sem conta de luz informada, ou com aparelhos que explicam menos de 80% da conta (C10, C11) **então** o
   painel diz "falta **pelo menos**", nunca diz "chegam lá", e pede a conta ou mais aparelhos.
8. **Dado** uma dica com economia de R$ 0,00 (consumo no mínimo, C9) **então** ela não aparece na lista que chega lá.
9. A meta fica **só no aparelho** (localStorage, versão + `migrate`), sem enviar a nenhum servidor. Todo número do painel
   é rotulado como estimativa.
10. Os textos usam os modelos da seção "Textos do painel", sem sigla solta, e passam no axe em 390 px e 1280 px.

## Fora do escopo

- ICMS, PIS/COFINS e alíquota por estado (HIS-202). Nesta história os impostos só entram quando vêm da **conta da família**.
- Preço de compra de lâmpada, geladeira etc. e tempo para se pagar (não há fonte oficial de preço).
- Meta por cômodo ou por aparelho, avisos de push, meta na nuvem.
- Percentual do Desconto Social (HIS-203): o painel continua só avisando.
- Valor da iluminação pública por município (é municipal; a pessoa digita, vendo a própria conta).

## Regras de negócio e fontes

_(dominio-energia, 17/11/2026. Li o código de `packages/core/src` (`calculos.ts`, `dicas.ts`, `tarifa-social.ts`, `tipos.ts`) e o
`contexto.md` do domínio. **Não reconsultei os sites oficiais hoje**: as fontes abaixo são as já registradas no código e no
contexto; o PR deve reconferir os links antes do merge.)_

### R1. O que entra no R$ da meta

A meta é sobre o **total da conta de luz** (o que a família paga no mês).

| Parte | Entra? | Como | Tipo do número |
| --- | --- | --- | --- |
| Energia (kWh cobrados × preço do kWh) | Sim | `estimarConta(...).valor` | Estimativa (consumo vem de potência × tempo) |
| Bandeira do mês | Sim | já está no preço do kWh (`adicionalBandeira`), sem somar de novo | Regulado (ANEEL), muda todo mês |
| Impostos (ICMS, PIS/COFINS) | **Só se vierem da conta da família**: o preço calibrado (`valor ÷ kWh`) já os inclui (`incluiImpostos`) | sem conta, **não** entram | Estimativa; sem fonte própria nesta história (HIS-202) |
| Iluminação pública (CIP) | Sim, **se a pessoa digitar** o valor da conta dela; senão fica de fora e o painel avisa | valor fixo em R$, não varia com kWh | Informado pela pessoa; a CIP é municipal (CF, art. 149-A) |
| Consumo mínimo (custo de disponibilidade) | Sim, como **piso** | 30 / 50 / 100 kWh (mono, bi, trifásico); ligação desconhecida = 30 kWh | Regulado (REN ANEEL 1.000/2021) |
| Tarifa Social | Sim | primeiros 80 kWh isentos; só a **energia** é isenta, impostos e CIP continuam | Regulado (Lei 12.212/2010 art. 1º, red. Lei 15.235/2025; REN 1.147/2025) |
| Desconto Social | Não | percentual não modelado: aviso para conferir na conta | Pendente (HIS-203) |

**Preço do kWh quando há CIP informada.** Hoje `precoKwh` divide a conta toda por kWh, e isso espalha a CIP (que é fixa) pelo
kWh. As dicas passam a economizar mais do que a conta realmente cai. Regra nova:

`preço = (valor da conta − CIP) ÷ kWh cobrados` (a CIP sai antes da divisão). Sem CIP informada, vale a regra de hoje e o
painel diz: "a economia pode ser um pouco menor, porque a iluminação pública não muda com o consumo".

**Conta estimada da meta** `C = estimarConta(consumo dos aparelhos).valor + CIP` (CIP = 0 se não informada).

### R2. Piso e meta mínima possível

- **Piso** `P = estimarConta(0, residência, preço).valor + CIP`. Usar `estimarConta(0)` mantém o piso sempre igual à regra
  do cálculo da conta (mínimo, ou isenção da Tarifa Social), sem copiar regra.
- Sem benefício: `P = mínimo em kWh × preço + CIP`. Mono 30 kWh, bi 50, tri 100 (REN ANEEL 1.000/2021).
- Com Tarifa Social: a energia isenta cobre 80 kWh, então o piso de energia é R$ 0,00 para mono (30) e bi (50), e fica
  `(100 − 80) × preço` para trifásica, **se** o mínimo da trifásica valer sobre a Tarifa Social. Hoje `calculos.ts:107-109`
  ignora o mínimo na Tarifa Social (pendência do domínio, HIS-103, ver "Perguntas abertas"). Até a conferência, o painel usa
  o resultado de `estimarConta(0)` e escreve "estimativa".
- **Por que a meta não consegue ficar abaixo do piso:** toda ligação paga o custo de disponibilidade, mesmo sem usar
  energia, e a CIP é cobrada de qualquer jeito. Nenhuma dica reduz isso. Por isso o piso é o menor valor possível.
- Sem CIP informada, o painel mostra o piso como "R$ X, **fora** a iluminação pública da sua cidade".
- Meta do campo: de R$ 1,00 a R$ 5.000,00 (limite técnico proposto, **suposição**, não é regra do setor); valor inválido
  não calcula. Meta entre R$ 1,00 e o piso cai no texto "abaixo do que dá para pagar".
- Comparações em **centavos inteiros** (`Math.round(valor × 100)`): "dentro da meta" quando `centavos(conta) ≤ centavos(meta)`.

### R3. Estados do painel (nesta ordem)

1. **Dados insuficientes** (preço `indisponivel`, ou sem aparelhos): pede distribuidora e aparelhos. Sem número.
2. **Abaixo do piso**: meta < P. Mostra o texto de piso e a menor meta (P). Sem "falta", sem dicas.
3. **Já dentro**: C ≤ meta. Mostra folga `meta − C`.
4. **Falta e as dicas chegam lá**: C > meta e o plano chega a `≤ meta`.
5. **Falta e as dicas não chegam**: o plano com as melhores dicas ainda fica acima da meta. Mostra o que dá para chegar.

**Confiança.** Os estados 3 e 4 só dizem "dentro" e "chegam lá" quando a estimativa é **completa**: há conta de luz
informada **e** a estimativa dos aparelhos fica a menos de 20% de diferença da conta (`|C − valor da conta| ÷ valor da conta
< 0,20`). O limite de 20% é **suposição de produto**, não regra do setor; fica numa constante nomeada no core. Fora disso
a estimativa é **parcial**: o painel escreve "falta **pelo menos**", troca "chegam lá" por "ajudam", e pede a conta ou mais
aparelhos. Isso evita prometer o que só uma conta completa confirma.

### R4. Como somar a economia das dicas sem contar duas vezes

1. **Nunca** somar `Dica.economiaMes` de várias dicas. Cada uma é calculada **sozinha** contra a mesma casa, então duas
   dicas no mesmo aparelho contam a mesma parte duas vezes (C4) e as regras com degrau (mínimo, isenção da Tarifa Social)
   deixam a soma maior que o possível (C5).
2. A economia de um conjunto de dicas é **sempre**:
   `economia = conta(casa atual) − conta(simularPlano(aparelhos, idsEscolhidos))`, com a mesma `estimarConta`/`precoKwh`.
   Nada de regra nova de cálculo na interface; a conta nova mora em `packages/core` e tem teste.
3. **Valor de cada dica na lista = ganho marginal**, na ordem mostrada: a 1ª mostra `conta(0 dicas) − conta(1)`, a 2ª
   `conta(1) − conta(2)` e assim por diante. Assim a soma dos valores mostrados **fecha** com o total (arredondando cada
   marginal em centavos; o total é `conta(0) − conta(n)` em centavos, e a diferença de 1 centavo por arredondamento é aceita).
4. **Escolha das dicas** (determinística, para ser testável):
   - candidatas: dicas `simulavel` com `economiaMes` > R$ 0,00 em centavos (tira dicas que o piso zera, C9);
     `aviso` e `geral` nunca entram na soma;
   - passos: a cada passo, recalcula o ganho de cada candidata **em cima do plano já escolhido** (`simularPlano` com o que já
     entrou) e escolhe a de maior ganho; empate: maior kWh, depois id em ordem alfabética;
   - **hábitos primeiro** (tipo `habito`, "sem gastar nada"). Só se até 3 hábitos não bastarem, entram `troca` (comprar);
   - para ao chegar a `conta ≤ meta`, ou em **3 dicas** (limite de tela, **suposição de UX**). Se não chegar, vale o estado 5;
   - dica cujo `vale` deixa de ser verdadeiro depois das anteriores (`aplicarDica` devolve a casa igual) ganha R$ 0,00 e sai.
5. Dica que **aumenta** consumo em outro lugar (ex.: `ar-ventilador` soma um ventilador) já vem no `simularPlano`: o ganho
   é o líquido.
6. Dicas excluídas dos cálculos: `bandeira`, `tarifa-social`, `fuga`, `tomada`, `selo-procel` (sem `economiaMes`).
7. A economia nunca passa de `C − P`. Com o plano chegando ao piso, o ganho para de crescer (C5 mostra isso na Tarifa Social).

### R5. Bandeira e mês

A conta usa a bandeira vigente (`bandeiraDoMes`). A meta guardada **não muda**; o "falta" e as dicas são recalculados a cada
mês. Se a bandeira do mês ainda não saiu (`exata: false`), o painel diz "com a bandeira mais recente". A bandeira sobe o
preço do kWh de todos os kWh cobrados, então um mês de bandeira cara aumenta a economia das dicas. O valor da bandeira vem
da ANEEL (dados abertos), nunca é digitado no código.

### R6. Fontes

| Número ou regra | Fonte oficial | Onde está no código |
| --- | --- | --- |
| Consumo mínimo 30 / 50 / 100 kWh | REN ANEEL 1.000/2021, custo de disponibilidade (portal ANEEL / cedoc) | `CONSUMO_MINIMO_KWH` |
| Tarifa Social: 80 kWh isentos | Lei 12.212/2010 art. 1º, red. da Lei 15.235/2025; REN ANEEL 1.147/2025 (Planalto e ANEEL) | `TARIFA_SOCIAL_ISENCAO_KWH` |
| Impostos e CIP continuam com a Tarifa Social | mesma fonte; D2 da HIS-103 | `dicas.ts` (texto "tarifa-social") |
| CIP é municipal | Constituição Federal, art. 149-A (Planalto) | sem constante: a pessoa digita |
| Tarifa TE + TUSD e bandeira | dados abertos da ANEEL (B1 convencional, "Tarifa de Aplicação"; "Bandeiras Tarifárias – Acionamento") | `tarifas.json`, `bandeiras` |
| Mês de 30 dias | convenção do projeto (ANEEL usa 30 dias para estimativas) | `DIAS_NO_MES` |
| Percentuais das dicas (verão 40%, geladeira 10%, LED 85%...) | já registrados em `dicas.ts`; **estimativas** | `MUDANCAS` |
| 20% de divergência, 3 dicas, meta de R$ 1 a R$ 5.000 | **suposições de produto** desta história (não são fonte do setor) | constantes novas no core |

### R7. Casos de teste (conta feita à mão)

Todos com `DIAS_NO_MES = 30`. Sem outra indicação, ligação monofásica (mínimo 30 kWh), sem benefício.
`R$` arredondado em centavos só no fim.

**C1. Falta e piso (sem CIP).** Conta de referência `{kwh: 200, valor: 160}` → preço `160 ÷ 200 = R$ 0,80/kWh` (com impostos).
Aparelhos somam 200 kWh. `C = 200 × 0,80 = R$ 160,00`. Piso `P = 30 × 0,80 = R$ 24,00`. Meta R$ 120,00 → falta
`160 − 120 = R$ 40,00` (= 50 kWh). Estado 4 ou 5 conforme as dicas; piso mostrado R$ 24,00 "fora a iluminação pública".

**C2. Meta abaixo do piso, com CIP.** Conta `{kwh: 200, valor: 172}`, CIP informada R$ 12,00. Preço `(172 − 12) ÷ 200 = R$ 0,80`.
`C = 160 + 12 = R$ 172,00`. `P = 30 × 0,80 + 12 = R$ 36,00`. Meta R$ 30,00 → estado 2, menor meta R$ 36,00.
Meta R$ 36,00 → não é "abaixo do piso" (36,00 ≤ 36,00 passa); só dá para chegar com consumo de 30 kWh, então o plano
das dicas não chega e vale o estado 5.

**C3. Já dentro.** C1 com meta R$ 170,00 → estado 3, folga `170 − 160 = R$ 10,00`. Meta R$ 160,00 → também "dentro", folga R$ 0,00.

**C4. Duas dicas no mesmo aparelho.** Preço R$ 0,80 (conta `{kwh: 200, valor: 160}`). Chuveiro (`catalogoId: "chuveiro"`) 4.400 W,
`minutosPorDia: 20`, `banho: {banhosPorDia: 2, minutosPorBanho: 10}`, 7 dias por semana, `quantidade: 1` = `4,4 × (20 ÷ 60) × 30 = 44 kWh`.
Outros aparelhos: 156 kWh (soma 200).

- `banho-curto` sozinha: 10 → 8 min por banho, `minutosPorDia = 16`: `4,4 × (16 ÷ 60) × 30 = 35,2 kWh`. Ganho 8,8 kWh = **R$ 7,04**.
- `chuveiro-verao` sozinha: `round(4400 × (1 − 0,4 × 0,5)) = 3.520 W`: `3,52 × (20 ÷ 60) × 30 = 35,2 kWh`. Ganho 8,8 kWh = **R$ 7,04**.
- Soma simples: 17,6 kWh = **R$ 14,08** (errado).
- `simularPlano` com as duas: 3.520 W × 16 min: `3,52 × (16 ÷ 60) × 30 = 28,16 kWh`. Casa = `28,16 + 156 = 184,16 kWh`.
  Conta `184,16 × 0,80 = 147,328 → R$ 147,33`. Ganho real `160,00 − 147,33 =` **R$ 12,67**.
  A ordem das duas não muda o resultado.
- Meta R$ 147,00: falta R$ 13,00. A soma simples (14,08) diria "chega lá"; o certo é estado 5: conta alcançável
  **R$ 147,33**, ainda falta **R$ 0,33**.
- Meta R$ 148,00: falta R$ 12,00; as duas dicas chegam lá (147,33 ≤ 148,00). Marginais mostrados: 1ª R$ 7,04, 2ª
  `147,328 → 160 − 7,04 = 152,96; 152,96 − 147,328 = 5,632 → R$ 5,63`. Soma `7,04 + 5,63 = R$ 12,67`, fecha com o total.

**C5. Tarifa Social e o limite de 80 kWh.** `beneficio: "tarifa-social"`, preço R$ 0,80 (ANEEL: tarifa 0,70 + bandeira 0,10,
**sem impostos**; é só exemplo de teste, não é tarifa real). Casa de 100 kWh: chuveiro 44 kWh (mesmo do C4), geladeira
(`catalogoId: "geladeira"`, sem variantes, `kwhMesInformado: 50`), outros 6 kWh. `kwhCobrados = 100 − 80 = 20`,
`C = 20 × 0,80 = R$ 16,00`. Piso: `estimarConta(0) = R$ 0,00`.

- `geladeira-nova` sozinha: 50 → 25 kWh, casa 75 kWh → 0 cobrados → conta R$ 0,00. Ganho **R$ 16,00**.
- `banho-curto` sozinha: casa `100 − 8,8 = 91,2 kWh` → `11,2 × 0,80 = R$ 8,96`. Ganho **R$ 7,04**.
- Soma simples: `16,00 + 7,04 = R$ 23,04` (errado: passa da conta inteira).
- `simularPlano` com as duas: `100 − 25 − 8,8 = 66,2 kWh` → 0 cobrados → conta R$ 0,00. Ganho real **R$ 16,00** (= `C − P`).
- Meta R$ 4,00: falta R$ 12,00. Hábitos primeiro: 1º `banho-curto` (empata com `chuveiro-verao` em 8,8 kWh; vence pelo id em
  ordem alfabética) ganho R$ 7,04, conta R$ 8,96. 2º `chuveiro-verao`, **em cima do plano**: chuveiro 3.520 W × 16 min = 28,16 kWh,
  casa `28,16 + 50 + 6 = 84,16 kWh` → `4,16 × 0,80 = 3,328 → R$ 3,33`. Ganho marginal `8,96 − 3,328 = 5,632 → R$ 5,63`.
  `3,33 ≤ 4,00`: **2 dicas chegam lá**, folga R$ 0,67. A troca da geladeira não entra (só se os hábitos não bastassem).
  Total mostrado `16,00 − 3,33 = R$ 12,67`; `7,04 + 5,63 = 12,67`. Sem impostos neste exemplo, então o painel estaria em
  estimativa **parcial** (sem conta de luz): o texto de C10 vale, com "ajudam" no lugar de "chegam lá". Para testar o texto
  "chegam lá", repetir C5 com conta de referência (`valor` e `kwh` tais que `(kwh − 80)` ≥ 10 e preço R$ 0,80).

**C6. Meta igual à conta do mínimo (bifásica).** `ligacao: "bifasica"` (mínimo 50 kWh), consumo dos aparelhos 40 kWh,
preço R$ 0,80. `kwhCobrados = max(40, 50) = 50`, `C = P = 50 × 0,80 = R$ 40,00`. Meta R$ 35,00 → estado 2, menor meta R$ 40,00.
Meta R$ 45,00 → estado 3, folga R$ 5,00.

**C7. Trifásica.** Consumo 60 kWh, preço R$ 0,80, mínimo 100 kWh: `C = P = R$ 80,00`. Meta R$ 70,00 → estado 2, menor meta R$ 80,00.
Mesma casa com Tarifa Social: ver a pendência do mínimo (resultado depende da resposta do domínio; o teste fica marcado como pendente).

**C8. Ligação "não sei".** Tratada como monofásica (30 kWh). Com preço R$ 0,80, `P = R$ 24,00`. O painel mostra
"se a sua ligação tiver 2 ou 3 fios, o mínimo é maior" (texto em "Textos do painel").

**C9. Dica com R$ 0,00.** Consumo 40 kWh, bifásica, preço R$ 0,80 (C6). Uma dica de 5 kWh → casa 35 kWh → ainda cobra 50 kWh →
`economiaMes = R$ 0,00`. Ela **não** entra na lista de dicas que chegam lá, mesmo com `economiaKwh = 5` (> 0,05, que passa no
filtro de `gerarDicas`).

**C10. Sem conta de luz (parcial).** Preço da ANEEL: `0,70 + 0,10 = R$ 0,80/kWh`, sem impostos. 200 kWh → `R$ 160,00` só de
energia. Meta R$ 120,00 → "Falta **pelo menos** R$ 40,00", com o aviso "esse valor é só da energia, sem impostos". Nunca "chegam
lá" nem "já está dentro" (meta R$ 170,00 vira "sem os impostos já está abaixo; coloque a conta para confirmar").

**C11. Aparelhos não explicam a conta.** Conta de referência `{kwh: 260, valor: 208}` → preço R$ 0,80. Aparelhos somam 200 kWh:
`C = R$ 160,00`. Divergência `|160 − 208| ÷ 208 = 23,1% ≥ 20%` → estimativa **parcial**: "falta pelo menos", aviso "os aparelhos
somam R$ 160,00, mas sua última conta foi R$ 208,00". Com aparelhos de 230 kWh (`C = R$ 184,00`, divergência 11,5%) → completa.

**C12. Nada a fazer.** Sem aparelhos ou preço `indisponivel` → estado 1, sem número, sem erro.

**C13. Entradas ruins.** Meta vazia, 0, negativa, texto ou maior que R$ 5.000,00 → não calcula, mostra a faixa aceita.
Vírgula ("120,50") e ponto são aceitos; arredondar para centavos.

**C14. Mudança de bandeira.** Mesma casa de C1 com preço R$ 0,90 (bandeira R$ 0,10 mais cara; conta real sempre vem da ANEEL):
`C = 200 × 0,90 = R$ 180,00`; a meta R$ 120,00 antes pedia R$ 40,00, agora pede **R$ 60,00**. A meta guardada não muda.

## Textos do painel

_(modelos para o ux-acessibilidade ajustar; valores entre `{}` vêm do core e passam por `formatarReais`. Frases curtas, dinheiro primeiro.)_

**Campo**
- Rótulo: "Quanto você quer pagar de luz por mês?"
- Ajuda: "Escreva o valor que cabe no seu bolso. A gente mostra quanto falta."
- Botão: "Salvar meta". Apagar: "Tirar a meta".
- Erro: "Escreva um valor entre R$ 1,00 e R$ 5.000,00."

**Falta, estimativa completa (estado 4)**
- Título: "Falta economizar {falta} por mês."
- Linha: "Sua conta estimada é {conta}. A meta é {meta}."
- Cabeçalho das dicas: "Estas {n} dicas chegam lá" (com n = 1: "Esta dica chega lá").
- Cada dica: "{título}: economiza {ganho marginal}".
- Fecho: "Juntas, economizam {total}. A sua conta fica em {contaDepois}. Já descontamos o que as dicas têm em comum, por isso
  não é a soma simples."
- Se só há hábitos: "Todas são sem gastar nada." Se há troca: "A troca pede comprar algo."

**Falta, estimativa parcial**
- Título: "Falta economizar pelo menos {falta} por mês."
- Linha (sem conta): "Esse valor é só da energia, sem impostos. Coloque sua última conta de luz para ver o valor completo."
- Linha (divergência): "Os aparelhos que você colocou somam {C}, mas sua última conta foi {valorConta}. Pode faltar algum aparelho."
- Cabeçalho das dicas: "Estas {n} dicas ajudam".

**Dicas não chegam (estado 5)**
- Título: "Estas dicas ajudam, mas ainda não chegam lá."
- Linha: "Elas economizam {total}. Ainda faltam {faltaRestante}. Com elas, sua conta pode ficar em {contaDepois}."
- Convite: "Quer tentar uma meta de {contaDepois}?"

**Meta abaixo do piso (estado 2)**
- Título: "Essa meta está abaixo do que dá para pagar."
- Linha: "Toda casa paga um mínimo de energia, mesmo sem ligar nada: 30 kWh se a ligação tem 1 fase, 50 kWh com 2 e 100 kWh com 3.
  Para a sua casa isso dá {piso} por mês."
- Linha (sem CIP): "Fora a taxa de iluminação pública da sua cidade, que está na sua conta de luz."
- Linha (com CIP): "Já somamos a iluminação pública de {cip}."
- Convite: "Tente uma meta a partir de {piso}."
- Tarifa Social: "Com a Tarifa Social, os primeiros 80 kWh não são cobrados, mas impostos e iluminação pública continuam."
- Ligação "não sei": "Se a sua ligação tiver 2 ou 3 fases, o mínimo é maior. Veja na sua conta."

**Já dentro (estado 3)**
- Título: "Boa notícia: sua conta já cabe na meta."
- Linha: "A conta estimada é {conta} e a meta é {meta}. Sobram {folga}." (folga zero: "A conta estimada é igual à meta.")
- Sem conta informada: "Sem os impostos, já está abaixo da meta. Coloque sua conta de luz para confirmar."

**Avisos fixos (rodapé do painel)**
- "É uma estimativa. A conta de verdade pode ser um pouco diferente."
- Sem CIP: "A economia pode ser um pouco menor, porque a iluminação pública não muda com o quanto você gasta."
- Bandeira: "Conta feita com a bandeira {nome} de {mês}." / "Com a bandeira mais recente que a ANEEL publicou."
- "Sua meta fica só neste aparelho. Não enviamos para ninguém."

## Fluxo e textos

_(ux-acessibilidade: pendente. Os textos acima são o ponto de partida do domínio. Pontos a decidir: onde fica o campo, como
anunciar a mudança de estado para leitor de tela, contraste do estado "falta".)_

## Desenho técnico

_(tech-lead: pendente. Pedido do domínio: função(ões) de meta em `packages/core` com testes, usando só `estimarConta`,
`precoKwh`, `simularPlano` e `gerarDicas`, sem regra na interface; campo de CIP em `Residencia` com `migrate`; constantes
nomeadas (20%, 3 dicas, R$ 1 a R$ 5.000, em centavos) com comentário de que são suposições; `precoKwh` aceitando a CIP.)_

## Ameaças

_(seguranca: pendente.)_

| Ameaça | Gravidade | Mitigação |
| --- | --- | --- |
| Meta e CIP são dado financeiro da pessoa guardado no aparelho | baixa | só localStorage, sem envio; entra no "apagar tudo" |
| Entrada numérica fora de faixa, NaN, texto | média | validar na fronteira (faixa de R$ 1 a R$ 5.000 e CIP de R$ 0 a um teto a definir) |
| Número que parece exato mas é estimativa | média | rótulo de estimativa, "pelo menos" no parcial |

## Plano de testes

_(qa: pendente. Os casos C1 a C14 acima são os testes de negócio; cada um vira um teste de unidade no core com os valores
dados. Mais: e2e do painel em 390 px e 1280 px, com axe, e teste de migração do localStorage.)_

## Perguntas abertas

- [ ] `[para: dominio-energia]` Na Tarifa Social, o custo de disponibilidade da trifásica (100 kWh) vale além dos 80 kWh
  isentos? Hoje o código não aplica. Mudaria o piso e o C7. Pendente da HIS-103 (cedoc da REN 1.147/2025 não abriu em 13/11/2026).
- [ ] `[para: tech-lead]` Aceita mudar `precoKwh` para tirar a CIP antes de dividir (R1)? Altera preços de quem já calibrou
  com a conta; precisa de `migrate` e teste de regressão.
- [ ] `[para: ux-acessibilidade]` Campo da CIP: opcional, com explicação "o valor está na sua conta, na linha de iluminação
  pública"? Lembrar que a CIP é cobrada por município e não existe valor médio com fonte.
- [ ] `[para: scrum-master]` Confirmar o limite de 3 dicas e o corte de 20% (suposições de produto).
- [ ] `[para: dominio-energia]` HIS-202: quando houver ICMS e PIS/COFINS por estado e distribuidora, a meta sem conta de luz
  poderia sair do modo "só energia". Hoje não há fonte, então não inventamos número.

## Conversa da equipe

### [dominio-energia] 2026-11-17 — regras, casos C1–C14 e textos da meta de gasto
- O que fiz: li `calculos.ts`, `dicas.ts`, `tarifa-social.ts`, `tipos.ts` e o contexto do domínio; escrevi R1–R7, 14 casos
  com a conta à mão e os textos do painel.
- Decisões e porquê: o piso sai de `estimarConta(0)` (uma só regra); a economia de várias dicas vem sempre de `simularPlano`
  (somar `economiaMes` conta em dobro: C4 dá R$ 14,08 contra R$ 12,67 real; C5 dá R$ 23,04 contra R$ 16,00); sem conta de luz
  ou com aparelhos que explicam menos de 80% dela, o painel diz "pelo menos" e "ajudam", nunca "chegam lá".
- Arquivos alterados: este arquivo (sem código).
- Como verifiquei: contas feitas à mão com `DIAS_NO_MES = 30` e as fórmulas do `dicas.ts`. **Não reconsultei os sites oficiais
  hoje**; as fontes são as já registradas no código e no contexto, a reconferir no PR. Impostos por estado ficam fora (HIS-202).
- Para o próximo (ux-acessibilidade e tech-lead): ajustar textos e desenho; resolver as perguntas abertas.

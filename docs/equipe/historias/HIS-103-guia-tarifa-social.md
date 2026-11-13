# HIS-103 · Guia da Tarifa Social

| Campo | Valor |
| --- | --- |
| Épico | E1 · Inclusão |
| Sprint | 1 (Inclusão I) |
| Tamanho | M |
| Papéis principais | dominio-energia, ux-acessibilidade, frontend (qa confere) |
| Status | Preparando (regras validadas pelo dominio-energia; falta o refino do scrum-master e os textos do ux) |
| Branch | `his-103-guia-tarifa-social` |

## Problema e valor

Como **família de baixa renda**, eu quero **saber, com perguntas simples, se posso ter Tarifa Social ou Desconto
Social, que documentos levar e onde ir** para **pagar menos na conta de luz**.

Muitas famílias com direito não recebem o desconto. Os motivos comuns: não estão no CadÚnico, o cadastro está
vencido, o endereço do CadÚnico é outro ou a conta está no nome de quem não é da família. A regra mudou em 2025
e 2026: hoje a energia dos primeiros 80 kWh é de graça (Tarifa Social), e existe um desconto novo até 120 kWh
(Desconto Social). Até **31/12/2026** as distribuidoras chamam as famílias que precisam acertar o cadastro: quem não
atender pode perder o benefício. Por isso este guia é urgente.

O site **não promete direito**: diz "pode ter direito, confira no CRAS ou na distribuidora".

## Critérios de aceite

1. **Dado** a página do guia, **quando** a pessoa responde às perguntas, **então** o resultado diz "pode ter
   direito a…" (nunca "tem direito") e indica onde confirmar (CRAS ou distribuidora), conforme a tabela de
   resultados A–D.
2. **Dado** número de pessoas e renda total, **quando** o site compara com o salário mínimo, **então** o resultado
   bate com todos os casos de teste C1–C13 (conta em centavos, sem arredondar a renda por pessoa).
3. **Dado** que a renda e o número de pessoas são dados sensíveis, **quando** a pessoa responde, **então** a conta
   é feita só no aparelho e as respostas **não são guardadas** nem enviadas (LGPD; confirmar com `seguranca`).
4. **Dado** o salário mínimo do ano, **quando** a data passa da vigência cadastrada (hoje: 2026), **então** o guia
   não mostra valor em R$ vencido: mostra só "meio salário mínimo" e avisa que o valor mudou (mesma ideia da tarifa
   vencida da HIS-111).
5. **Dado** a seção "Documentos" e "Onde ir", **quando** a pessoa lê, **então** vê a lista do gov.br (R8), onde ir (R9)
   e os passos de "não estou recebendo" (R10), com links oficiais com `rel="noopener noreferrer"`.
6. **Dado** os textos já no ar listados em "Defeitos no ar", **quando** a história fecha, **então** todos foram
   corrigidos (D1–D6) ou viraram história própria registrada.
7. **Dado** cada regra mostrada, **quando** se olha o código, **então** há comentário com a fonte (lei, artigo) e a
   data de vigência, como nesta seção.

## Fora do escopo

- Calcular o percentual do Desconto Social (HIS-203). O guia só diz "desconto até 120 kWh".
- ICMS e outros impostos sobre a parte gratuita (HIS-202).
- Lista de endereços de CRAS (o guia aponta o serviço oficial de busca do MDS/gov.br).
- Pedir CPF, NIS ou qualquer dado que identifique a pessoa.

## Regras de negócio e fontes

_(dominio-energia, 2026-11-13)_ Todas as fontes consultadas em **13/11/2026**.

### Fontes

| Id | Fonte | Link |
| --- | --- | --- |
| F1 | Lei 12.212/2010, texto atualizado (arts. 1º a 5º) | https://www2.camara.leg.br/legin/fed/lei/2010/lei-12212-20-janeiro-2010-600945-normaatualizada-pl.html |
| F2 | Lei 15.235/2025 (08/10/2025, converte a MP 1.300/2025) | https://www2.camara.leg.br/legin/fed/lei/2025/lei-15235-8-outubro-2025-798121-normaatualizada-pl.pdf |
| F3 | ANEEL, notícia da regulação da Lei 15.235 (REN 1.147/2025, de 09/12/2025) | https://www.gov.br/aneel/pt-br/assuntos/noticias/2025/agencia-regula-a-politica-publica-do-luz-do-povo-estabelecida-pela-lei-no-15-235-2025 |
| F4 | ANEEL, página "Tarifa Social" (modificada em 04/07/2025) | https://www.gov.br/aneel/pt-br/assuntos/tarifas/tarifa-social |
| F5 | MME, página "Luz do Povo" | https://www.gov.br/mme/pt-br/luzdopovo |
| F6 | gov.br, "Inscrever-se no Cadastro Único" (modificada em 15/12/2025) | https://www.gov.br/pt-br/servicos/inscrever-se-no-cadastro-unico-para-programas-sociais-do-governo-federal |
| F7 | Decreto 11.016/2022 (Cadastro Único), art. 5º, VI e VII; art. 12 | https://legis.senado.leg.br/norma/35622985/publicacao/35624611 |
| F8 | Decreto 12.797/2025: salário mínimo de R$ 1.621 desde 01/01/2026 | https://www.gov.br/planalto/pt-br/acompanhe-o-planalto/noticias/2025/12/publicado-decreto-que-reajusta-salario-minimo-para-r-1-621-a-partir-de-1o-de-janeiro |
| F9 | gov.br, "Registrar reclamação junto à distribuidora (ANEEL)" (modificada em 15/12/2025) | https://www.gov.br/pt-br/servicos/registrar-reclamacao-sobre-demanda-junto-a-distribuidora-de-energia-eletrica-ANEEL |

Limites da pesquisa: o texto da REN 1.147/2025 no cedoc da ANEEL e o Planalto não abriram daqui. As regras abaixo
vêm da lei (Câmara/Senado) e das páginas oficiais da ANEEL, MME e gov.br. A Lei 15.269/2025 só acrescentou o § 9º
do art. 4º da Lei 12.212 (recursos da CDE); não muda quem tem direito (F1).

### Regras

| # | Regra | Valor | Vigência | Fonte |
| --- | --- | --- | --- | --- |
| R1 | **Tarifa Social: quem pode ter.** Basta uma das condições: (a) família no CadÚnico com renda **por pessoa** de até ½ salário mínimo; (b) alguém da casa recebe o **BPC**; (c) família no CadÚnico com renda **total** de até 3 salários mínimos e alguém com doença ou deficiência que precisa de aparelho elétrico ligado para o tratamento | ½ SM = **R$ 810,50**; 3 SM = **R$ 4.863,00** (2026) | (a)(b)(c) desde 2010 | F1 art. 2º, I, II e § 1º; F4; F5; F8 |
| R2 | **Indígenas e quilombolas** no CadÚnico têm os mesmos 80 kWh, **se** cumprirem (a) ou (b). Não é um caminho separado: a renda conta | 80 kWh (antes eram 50) | Lei 15.235, de 08/10/2025 (veio da MP 1.300/2025) | F1 art. 2º, § 4º; F2 |
| R3 | **Tarifa Social: desconto.** 100% na parte do consumo até 80 kWh/mês; 0% acima disso (paga o que passar de 80) | 80 kWh | contas emitidas desde **05/07/2025** | F1 art. 1º, I e II; F3; F4 |
| R4 | **Desconto Social.** Família no CadÚnico com renda por pessoa **acima de ½ e até 1** salário mínimo: não paga as quotas da CDE no consumo até 120 kWh/mês; acima de 120 kWh, sem redução. O **percentual não é fixo** (depende da distribuidora) | ½ a 1 SM = R$ 810,51 a R$ 1.621,00; 120 kWh | desde **01/01/2026** | F2 (Lei 10.438, art. 13, § 3º-I); F3; F5 |
| R5 | **Condições para receber (os dois):** uma só casa por família; casa residencial; **conta no nome de alguém da família**; CadÚnico **atualizado nos últimos 2 anos**; endereço do CadÚnico igual ao da casa na distribuidora. Na conta ainda podem vir impostos (ICMS), iluminação pública, parcelas e o que passar do limite | — | — | F1 art. 2º, § 2º; F3; F4; F5; F7 art. 12 |
| R6 | **Inscrição automática.** Quem está no CadÚnico (ou no BPC) e cumpre R5 recebe sem pedir: a distribuidora cruza os dados. **Exceção:** o caso da doença (R1-c) precisa de pedido na distribuidora com **relatório e atestado médico** | — | automática desde jan/2022 | F1 art. 4º, parágrafo único (Lei 14.203/2021); F4; F5 |
| R7 | **Renda que conta.** Soma do que todos ganham por mês ÷ número de pessoas. **Não entram** o Bolsa Família e outros programas de transferência de renda, nem auxílios eventuais. **O BPC entra** na soma | — | — | F7 art. 5º, VI, "b" |
| R8 | **Documentos para o CadÚnico (gratuito, presencial).** Responsável familiar: CPF (de preferência) ou título de eleitor; documento com foto; comprovante de endereço ou declaração de residência assinada. Cada outra pessoa: um destes: CPF ou título, certidão de nascimento ou casamento, RG ou carteira de trabalho | — | página de 15/12/2025 | F6 |
| R9 | **Onde ir.** Não está no CadÚnico, ou precisa atualizar (renda, endereço, pessoas, ou mais de 2 anos): **CRAS** ou posto do Cadastro Único da prefeitura. Conta no nome de outra pessoa, caso da doença (R1-c) ou desconto que não aparece: **distribuidora**. Dúvida do CadÚnico: **Disque 121** (MDS) | — | — | F5; F6; F4 |
| R10 | **Não está recebendo?** 1) Confira no CRAS se o CadÚnico está atualizado e o endereço é o da conta. 2) Confira se a conta está no nome de alguém da família. 3) Ligue para a distribuidora e anote o protocolo. 4) Sem solução: ouvidoria da distribuidora. 5) Ainda sem solução: **ANEEL, telefone 167** (seg. a sáb., 8h às 20h, grátis), app "ANEEL Consumidor" ou site (conta gov.br) | — | página de 15/12/2025 | F4; F9 |
| R11 | **Convocação.** As distribuidoras chamam, até **31/12/2026**, as famílias que precisam acertar o cadastro. Quem não atender pode perder o benefício | prazo 31/12/2026 | REN 1.147/2025 | F3 |

**Exato, estimado e suposto:** R1–R11 são regras de lei ou de página oficial (exatas). Os valores em R$ do salário
mínimo valem **só em 2026** (F8): em 01/01/2027 mudam, e o código precisa de data de vigência (critério 4). O
percentual do Desconto Social **não é publicado** de forma simples: é desconhecido, não estimar.

### Rascunho das perguntas "você pode ter direito" (para o ux-acessibilidade revisar)

Tom: frases curtas, sem sigla sem explicar. Nunca "você tem direito". Nada é guardado.

1. **Alguém da sua casa recebe o BPC?** _(BPC é o benefício de um salário mínimo do INSS para idosos de 65 anos ou
   mais e pessoas com deficiência.)_ Sim · Não · Não sei
   - Sim → resultado A.
2. **Sua família está no CadÚnico?** _(o Cadastro Único do governo, feito no CRAS.)_ Sim · Não · Não sei
3. **Quantas pessoas moram na sua casa?** (número, 1 a 20)
4. **Somando o que todos ganham por mês, quanto dá?** _(Não conte o Bolsa Família. Conte salário, bicos,
   aposentadoria e BPC.)_ (R$, 0 a 100.000)
5. **Alguém da casa precisa de aparelho elétrico ligado para cuidar da saúde?** _(Por exemplo, aparelho de oxigênio.)_
   Sim · Não
6. **A conta de luz está no nome de alguém que mora na casa?** Sim · Não · Não sei

Resultados (texto a lapidar pelo ux):

| Id | Quando | O que o site diz |
| --- | --- | --- |
| A | BPC = sim, **ou** renda por pessoa ≤ ½ SM | "Sua família **pode ter direito à Tarifa Social**: a energia dos primeiros 80 kWh do mês sai de graça. Confira no CRAS." |
| B | renda por pessoa > ½ SM e ≤ 1 SM | "Sua família **pode ter direito ao Desconto Social**: desconto na conta até 120 kWh por mês. Confira no CRAS." |
| C | saúde = sim e renda total ≤ 3 SM (e não caiu em A) | "Sua família **pode ter direito à Tarifa Social** por causa do aparelho de saúde. Peça na distribuidora, com relatório e atestado do médico, e esteja no CadÚnico." |
| D | nenhum dos anteriores | "Pelas respostas, a família não se encaixa nas regras de hoje. Se a renda mudar, confira de novo." |
| + | CadÚnico = não ou não sei (com A, B ou C) | "Primeiro, faça o CadÚnico no CRAS. É de graça. Leve: [lista R8]." |
| + | conta no nome = não ou não sei (com A, B ou C) | "O desconto só vem se a conta estiver no nome de alguém da família. Peça a troca na distribuidora." |
| + | sempre que A, B ou C | "Se já tem tudo isso e o desconto não aparece na conta: [passos R10]." e "Até 31/12/2026, atenda se a distribuidora chamar para atualizar o cadastro." |

### Casos de teste (SM 2026 = R$ 1.621,00; conta em centavos: `renda × 2 ≤ pessoas × SM` para ½ SM)

| Caso | Entradas | Conta à mão | Resultado |
| --- | --- | --- | --- |
| C1 | 4 pessoas, R$ 3.000,00, sem BPC | 3.000 ÷ 4 = 750,00 ≤ 810,50 | A |
| C2 | 4 pessoas, R$ 3.242,00 | 3.242 ÷ 4 = 810,50 = ½ SM (inclusive) | A |
| C3 | 4 pessoas, R$ 3.242,04 | 810,51 > 810,50 e ≤ 1.621 | B |
| C4 | 3 pessoas, R$ 4.863,00 | 4.863 ÷ 3 = 1.621,00 = 1 SM (inclusive) | B |
| C5 | 3 pessoas, R$ 4.863,03 | 1.621,01 > 1 SM; sem saúde | D |
| C6 | 1 pessoa, R$ 1.621,00, recebe BPC | BPC = sim, renda não importa | A |
| C7 | 2 pessoas, R$ 4.000,00, saúde = sim | 2.000 por pessoa > 1 SM; total 4.000 ≤ 4.863 | C |
| C8 | 2 pessoas, R$ 4.863,00, saúde = sim | total = 3 SM (inclusive) | C |
| C9 | 2 pessoas, R$ 4.863,01, saúde = sim | total > 3 SM; 2.431,51 por pessoa > 1 SM | D |
| C10 | 3 pessoas, R$ 2.000,00 + R$ 600,00 de Bolsa Família | Bolsa Família não entra: 2.000 ÷ 3 = 666,67 ≤ 810,50 | A |
| C11 | 2 pessoas, R$ 1.000,00 + BPC de R$ 1.621,00 | BPC entra e já dá A pela pergunta 1 | A |
| C12 | 2 pessoas, R$ 1.200,00, CadÚnico = não, conta no nome = não | 600 ≤ 810,50 | A + "faça o CadÚnico" + "troque o nome da conta" |
| C13 | 0 pessoas ou renda negativa | entrada inválida | não calcula; pede para corrigir |

Para a Tarifa Social no cálculo da conta (já no ar, sem mudança): consumo 150 kWh, tarifa R$ 0,80/kWh →
cobrados 150 − 80 = 70 kWh → R$ 56,00 (sem impostos); a energia gratuita vale 80 × 0,80 = R$ 64,00 (estimativa).

### Defeitos no ar (achados em 13/11/2026)

| # | Onde | O que está errado | Correção proposta |
| --- | --- | --- | --- |
| D1 | `apps/web/src/funcionalidades/inicio/PaginaInicial.tsx:190` | "o nosso cálculo já considera a regra": **falso para o Desconto Social**, que não é calculado (`packages/core/src/calculos.ts:95-96`). "Desde 2025" também está impreciso: a Tarifa Social existe desde 2010; os 80 kWh grátis valem desde 05/07/2025 e o Desconto Social desde 01/01/2026. "Automaticamente" sem as condições (R5) | "A Tarifa Social já entra no nosso cálculo. O Desconto Social ainda não: a conta real fica um pouco menor." + "O desconto vem sozinho se a família estiver no CadÚnico em dia e a conta estiver no nome de alguém da casa." |
| D2 | `PaginaInicial.tsx:116` ("por mês sem pagar nada") e `:202` ("80 kWh grátis") | A **energia** dos 80 kWh é grátis, mas a conta ainda pode trazer ICMS, iluminação pública e parcelas (F4, F5). "Sem pagar nada" promete conta zerada | Linha 116: "de energia de graça por mês para famílias com Tarifa Social". Linha 202: manter e acrescentar "Impostos e iluminação pública podem continuar na conta." |
| D3 | `PaginaInicial.tsx:203`, `apps/web/src/funcionalidades/ajustes/TelaAjustes.tsx:19`, `apps/web/src/funcionalidades/cadastro/Cadastro.tsx:32`, `packages/core/src/dicas.ts:355` | Falta o 3º caminho da Tarifa Social: renda **total** até 3 salários mínimos com alguém que usa aparelho elétrico para a saúde (F1 art. 2º, § 1º). Justo quem mais gasta energia não fica sabendo | Acrescentar "ou família com alguém que precisa de aparelho elétrico para a saúde" (e, na dica, "peça na distribuidora com atestado médico") |
| D4 | `TelaAjustes.tsx:96` | "a distribuidora aplica o desconto automaticamente": incompleto. Só é automático se a conta estiver no nome de alguém da família, o CadÚnico estiver em dia (2 anos) e o endereço for o mesmo; o caso da saúde precisa de pedido (R5, R6) | "O desconto vem sozinho quando o CadÚnico está em dia e a conta está no nome de alguém da família." + link para o guia |
| D5 | `apps/web/src/funcionalidades/acompanhamento/PainelAcompanhamento.tsx:88` | Com Desconto Social, a estimativa mostrada **não tira o desconto** e o texto não diz isso: a família vê valor maior sem saber por quê (honestidade) | "Esta estimativa não tira o Desconto Social, porque o valor muda em cada distribuidora. A sua conta deve vir um pouco menor." |
| D6 | `PainelAcompanhamento.tsx:87` | "A Tarifa Social já tirou R$ X" soa exato; é estimativa (o preço pode vir da conta, com impostos) | "A Tarifa Social tira cerca de R$ X da conta: a energia dos primeiros 80 kWh é de graça." |
| D7 (baixo) | `Cadastro.tsx:35` | Promete "No fim mostramos como descobrir se você tem direito", mas só existe a dica em /casa/dicas | A HIS-103 cumpre: ligar o "Não sei" ao guia |
| D8 (baixo) | `apps/web/src/app/sobre/page.tsx:34` | "isenta os primeiros 80 kWh das famílias de baixa renda": só de quem tem Tarifa Social; não diz que o Desconto Social não entra no cálculo | "…e a Tarifa Social (a energia dos primeiros 80 kWh de graça). O Desconto Social ainda não entra no cálculo." |
| D9 (fora do ar) | `packages/core/src/tipos.ts:85` (comentário) | Lista "indígenas e quilombolas" como se fosse um caminho à parte; a lei exige renda ≤ ½ SM ou BPC (R2) | Ajustar o comentário |

Números que **estão certos** no ar: 80 kWh grátis (R3), até 120 kWh no Desconto Social (R4), ½ e 1 salário mínimo
por pessoa (R1, R4), BPC (R1), CRAS para o CadÚnico (R9), consumo mínimo 30/50/100 kWh.

## Fluxo e textos

_(ux-acessibilidade)_ Lapidar as perguntas e os resultados do rascunho acima; onde o guia fica (rota própria ou
seção) e como o "Não sei" do cadastro leva até ele.

## Desenho técnico

_(tech-lead)_ Regra de elegibilidade em `packages/core` (função pura, com os casos C1–C13 como teste); salário
mínimo numa tabela com vigência e fonte; respostas só em estado de tela, sem `persist`.

## Ameaças

_(seguranca)_ Renda e saúde são dados sensíveis: confirmar que nada vai para `localStorage`, analytics ou URL.

| Ameaça | Gravidade | Mitigação |
| --- | --- | --- |
| … | … | … |

## Plano de testes

_(qa)_ Unidade com C1–C13; e2e do guia em 390 px e 1280 px; conferir D1–D8 corrigidos.

## Perguntas abertas

- [ ] `[para: seguranca]` As respostas de renda, número de pessoas e saúde podem ficar só em memória da tela (sem
  salvar)? Proposta do dominio-energia: sim, não guardar nada.
- [ ] `[para: scrum-master]` D1–D6 são defeitos no ar. Corrigir dentro da HIS-103 ou abrir uma correção rápida antes?
  Proposta: correção rápida já (só texto), porque D1 e D2 prometem mais do que a família recebe.
- [ ] `[para: dominio-energia]` (pendência minha) Como o custo de disponibilidade (30/50/100 kWh) se combina com os 80
  kWh grátis, sobretudo na ligação trifásica? Hoje `calculos.ts:107-109` ignora o mínimo para a Tarifa Social. Preciso
  do texto da REN 1.147/2025 (cedoc não abriu). Não bloqueia o guia; pode mudar a estimativa da conta.

## Conversa da equipe

### [dominio-energia] 2026-11-13 — regras da Tarifa Social e do Desconto Social validadas; 9 defeitos no ar
- O que fiz: conferi lei (12.212 atualizada, 15.235), ANEEL, MME, gov.br e decretos do CadÚnico e do salário
  mínimo. Escrevi R1–R11, o rascunho das perguntas, os casos C1–C13 e a lista D1–D9.
- Decisões e porquê: o guia diz "pode ter direito", nunca "tem". Salário mínimo com vigência (muda em 2027). Desconto
  Social sem percentual (não há fonte única). Renda e saúde não são guardadas.
- Arquivos alterados: esta história; minha pasta.
- Como verifiquei: fontes oficiais lidas em 13/11/2026; REN 1.147 só pela notícia da ANEEL (cedoc fora do ar daqui).
- Para o próximo: **scrum-master** (refino e decisão sobre D1–D6) ‖ **ux-acessibilidade** (textos das perguntas).

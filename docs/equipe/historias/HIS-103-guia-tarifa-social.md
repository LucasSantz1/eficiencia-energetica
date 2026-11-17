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

_(ux-acessibilidade, 2026-11-17)_ Componentes: `Casca`, `Botao`, `Opcao`, `Campo`, `Entrada`, `Aviso`, `Pilulas` (passos), `TransicaoTela`.

### 1. Onde mora

- Página `/tarifa-social`, sem cadastro. Entradas: o link da `/` (`#tarifa-social`) ganha o botão "Ver se posso ter" no fim da seção, e Minha casa (Ajustes, linha Tarifa Social) ganha o link "Ver se pode ter direito". O "Não sei" do cadastro leva para cá (D7).
- Topo: "Tarifa Social: será que a sua família pode ter?" Abaixo: "São 6 perguntas rápidas. Não pedimos nome nem CPF. Suas respostas ficam só nesta tela e somem quando você sair."

### 2. Perguntas (uma por vez)

Cada passo: "Pergunta 2 de 6" (`Pilulas`), título (`h1`), ajuda curta, botões grandes (mín. 56 px de altura, largura total no celular), "Voltar" no topo. Sim e Não têm o mesmo peso visual; "Não sei" é botão de contorno. Escolher uma opção avança na hora (sem "Continuar"); só número e renda têm "Continuar".

| # | Título | Ajuda | Botões |
| --- | --- | --- | --- |
| 1 | Alguém da sua casa recebe o BPC? | BPC é o Benefício de Prestação Continuada: um salário mínimo por mês do INSS para idosos de 65 anos ou mais e pessoas com deficiência. | Sim, recebe / Não / Não sei |
| 2 | Sua família está no CadÚnico? | CadÚnico é o Cadastro Único do governo. Faz-se no CRAS, de graça. CRAS é o Centro de Referência de Assistência Social da prefeitura. | Sim, está / Não / Não sei |
| 3 | Quantas pessoas moram na sua casa? | Conte você e todos que dividem a mesma casa e as mesmas despesas. | campo número (1 a 20), "Continuar" |
| 4 | Somando o que todos ganham por mês, quanto dá? | Conte salário, bico, aposentadoria e BPC. Não conte o Bolsa Família. | campo R$ (0 a 100.000), "Continuar"; "Não sei o valor" explica: some o que cada um ganha em um mês comum |
| 5 | Alguém da casa precisa de aparelho elétrico ligado para cuidar da saúde? | Por exemplo, aparelho de oxigênio. | Sim / Não |
| 6 | A conta de luz está no nome de alguém que mora na casa? | Veja o nome que aparece no alto da conta. | Sim / Não / Não sei |

- Se a resposta 1 for "Sim", pula direto para a 6 (a renda não importa): "Pergunta 2 de 3" ajusta o contador.
- Erros (ao sair do campo, com `aria-invalid` e `aria-describedby`; "Continuar" nunca fica desligado): pessoas "Digite um número de 1 a 20." Renda "Digite quanto a família ganha por mês. Se for nada, digite 0." Sem negativo.
- "Voltar" mantém o que já foi respondido na tela. Renda vazia nunca vira 0 sozinha.
- Valor raro (renda acima de R$ 30.000): "Confere?" padrão da HIS-003.

### 3. Resultado

Título (`h1`, recebe o foco): resultado em frase; abaixo, R$ antes de kWh. Nunca "você tem direito". Botão "Responder de novo" (apaga tudo da tela) e "Voltar ao início".

| Caso | Título | Texto |
| --- | --- | --- |
| A | Sua família pode ter direito à Tarifa Social | A energia dos primeiros 80 kWh do mês sai de graça. Numa conta de R$ 0,80 por kWh, são cerca de R$ 64,00 por mês (estimativa). Confira no CRAS. |
| B | Sua família pode ter direito ao Desconto Social | Você paga menos na conta até 120 kWh por mês. O tamanho do desconto muda em cada distribuidora. Confira no CRAS. |
| C | Sua família pode ter direito à Tarifa Social, por causa do aparelho de saúde | Peça na distribuidora, com relatório e atestado do médico. A família precisa estar no CadÚnico. |
| D | Pelo que você respondeu, não parece | Hoje a família não se encaixa nas regras. Se a renda ou a casa mudar, responda de novo. Em caso de dúvida, o CRAS pode confirmar. |
| C13 | (fica na pergunta) | Mostra o erro do campo e não calcula. |

Avisos abaixo do resultado (só com A, B ou C), em `Aviso`:
- CadÚnico "Não" ou "Não sei": "Primeiro, faça o CadÚnico no CRAS. É de graça. Leve os documentos da lista abaixo."
- Conta "Não" ou "Não sei": "O desconto só vem se a conta estiver no nome de alguém da família. Peça a troca na distribuidora (a empresa que manda a conta de luz)."
- Sempre: "Até 31/12/2026, atenda se a distribuidora chamar para atualizar o cadastro. Quem não atender pode perder o desconto." (tom faísca)
- Salário mínimo vencido (critério 4): sem R$; o texto diz "meio salário mínimo" e "O valor do salário mínimo mudou. Confira o valor de hoje no CRAS."
- Explicação em R$ (só quando o valor está em vigor): "Renda por pessoa: R$ 750,00. O limite é R$ 810,50 (meio salário mínimo)."

### 4. Blocos fixos (abaixo do resultado ou, antes de responder, no fim da página; `details` fechados no celular, abertos no computador)

1. **Documentos para o CadÚnico** (gratuito, presencial). Quem responde pela família: CPF (de preferência) ou título de eleitor; documento com foto; comprovante de endereço ou declaração de residência assinada. Cada outra pessoa: um destes: CPF ou título de eleitor, certidão de nascimento ou casamento, RG ou carteira de trabalho. Link: "Ver a lista no gov.br".
2. **Onde ir.** CRAS ou posto do Cadastro Único da prefeitura: fazer ou atualizar o CadÚnico (renda, endereço, pessoas, ou mais de 2 anos). Distribuidora: conta em nome de outra pessoa, caso do aparelho de saúde, ou desconto que não aparece. Dúvida do CadÚnico: ligue 121 (grátis). Link "Achar o CRAS mais perto" (serviço do gov.br).
3. **Não estou recebendo. O que fazer?** Lista numerada: 1) Veja no CRAS se o CadÚnico está em dia e o endereço é o da conta. 2) Veja se a conta está no nome de alguém da família. 3) Ligue para a distribuidora e anote o número do protocolo. 4) Sem solução: fale com a ouvidoria da distribuidora. 5) Ainda sem solução: ANEEL, órgão do governo que cuida da luz, telefone 167 (segunda a sábado, das 8h às 20h, grátis). Link "Falar com a ANEEL".
- Telefones são `tel:` com o número no texto. Links externos: `rel="noopener noreferrer"`, `target="_blank"` e "(abre em outra página)" no nome acessível.

### 5. Estados

- Vazio/sem internet: as perguntas funcionam sem rede (conta no aparelho). Só os links externos precisam de internet: "Sem internet agora. Os documentos continuam aqui; os links abrem quando voltar."
- Carregando: nenhum (a regra vem junto da página).
- Erro de carga: `TelaDeErro` padrão, foco no `h1`.

### 6. Layout

- 390 px: uma coluna, `Casca` normal, botões de largura total, `Pilulas` no topo, blocos fixos em `details` fechados.
- A partir de 1024 px (padrão HIS-112): container `lg:max-w-[64rem]`, grade `minmax(0,34rem) minmax(0,1fr)` com intervalo 3rem. Pergunta à esquerda; à direita o `aside aria-label="Por que perguntamos"` (renda e pessoas: "Comparamos a renda de cada pessoa com meio salário mínimo. Nada sai do seu aparelho."), `hidden lg:block`, nunca com instrução obrigatória. Resultado ocupa as 2 colunas: texto à esquerda, blocos fixos abertos à direita. A ordem do código é a do celular.

### 7. Acessibilidade

- A cada passo, o foco vai para o `h1` da pergunta (`tabIndex={-1}`); no resultado, para o `h1` do resultado. Voltar também.
- Região `role="status"` sempre presente: anuncia "Pergunta 2 de 6" ao trocar e o resultado em uma frase. Nada de `aria-live` no campo enquanto digita.
- Opções em grupo `role="radiogroup"`/`fieldset` com `legend` igual ao título; nome do botão começa pelo texto visível (WCAG 2.5.3). Todo campo com rótulo e `inputMode="numeric"`.
- Resultado nunca só em cor: ícone e texto ("Pode ter" / "Não parece"). Contraste AA; alvos de 44 px ou mais; foco visível.
- Movimento: `TransicaoTela` desliza entre perguntas; com movimento reduzido, troca na hora. Sem contagem animada no resultado.
- Privacidade: nada em `localStorage`, URL ou analytics; estado só em `useState`.

**O frontend confere:** os textos acima copiados sem alterar; pular da 1 para a 6; limites 1 a 20 e 0 a 100.000; "Voltar" sem perder resposta; foco no `h1`; a 390, 1024 e 1280 px sem rolagem para o lado; links com `rel`; sem R$ vencido.

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

### [dominio-energia] 2026-11-13 — revisão dos textos D1–D9: aprovado com 2 ajustes
- Aprovados: `PaginaInicial.tsx:116, 190, 205, 210`, `PainelAcompanhamento.tsx:87-88`, `TelaAjustes.tsx:96`, `sobre/page.tsx:34`, `dicas.ts:357` e `tipos.ts:85`.
- Ajuste obrigatório (o texto promete mais do que a lei dá, porque falta o limite de 3 salários mínimos e o CadÚnico da R1-c): em `TelaAjustes.tsx:19`, usar "CadÚnico com renda de até meio salário mínimo por pessoa, BPC, ou CadÚnico com renda de até 3 salários mínimos e alguém que precisa de aparelho elétrico para a saúde. A energia dos primeiros 80 kWh é de graça."
- Em `Cadastro.tsx:32`, usar "Família no CadÚnico com renda de até meio salário mínimo por pessoa, alguém recebe o BPC, ou renda de até 3 salários mínimos com alguém que precisa de aparelho elétrico para a saúde."

### [frontend] 2026-11-13 — D1–D6, D8 e D9 corrigidos, só texto (`f54b0e3`…`4cf4fa6`, um commit por arquivo)
- `/` (D1–D3), Minha casa (D3, D4), cadastro (D3), dica e comentário do core (D3, D9), acompanhamento (D5, D6), Sobre (D8), com a fonte (Lei 12.212, art. 2º) no código. O caminho da saúde cita a renda de até 3 salários mínimos (R1-c), para não prometer a mais. Nenhum e2e conferia esses textos. O link do D4 para o guia espera a página do guia; o D7 fica para o guia.
- Lint, typecheck, test, build e e2e (121) verdes, sem erro no console. Capturas a 390 px em `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/his103/`.
- Ao integrar: conflito de linha com a HIS-110 (`<dd>` da Tarifa Social na `/`) e com a 003a/112 (Minha casa, acompanhamento, cadastro).
- Próximo: **dominio-energia** (conferir os textos) ‖ **qa**.

### [ux-acessibilidade] 2026-11-17 — desenho do guia (`/tarifa-social`) pronto
- Seção "Fluxo e textos" escrita: 6 perguntas (uma por vez, pula para a 6 se BPC = sim), resultados A–D sem prometer direito, 3 blocos fixos, layout 390 px e `lg`, acessibilidade.
- Decisão: respostas só em `useState`; salário mínimo vencido some do R$.
- Próximo: **frontend** (tech-lead define a função de elegibilidade).

# Fontes · "Por que minha conta veio alta?"

Autor: dominio-energia · consulta em 27/11/2026 · sem edição de código.

## Aviso sobre a fonte principal

- O texto da REN 1.000/2021 no cedoc da ANEEL (`https://www2.aneel.gov.br/cedoc/ren20211000.html`) **não abriu
  daqui**: o pedido de acesso não teve resposta. O Planalto (CDC, `l8078compilado.htm`) também ficou bloqueado.
- Usei o **texto compilado da REN 1.000/2021** que a Cemig publica:
  https://www.cemig.com.br/wp-content/uploads/2025/08/ren20211000.pdf (acesso em 27/11/2026).
  - É cópia de distribuidora, não da ANEEL.
  - As alterações vão até a MP 1.300/2025.
  - Os trechos que vêm entre aspas são curtos: a ferramenta de leitura só deixa citar trechos assim. O resto é paráfrase fiel.
- **Antes de publicar:** conferir os artigos abaixo no cedoc, porque pode haver alteração depois de ago/2025. O texto
  da interface pode citar o número do artigo, mas o link no código deve ser o do cedoc.

Legenda:
- **OK**: fonte oficial confirmada.
- **OK-cópia**: texto oficial lido em cópia de terceiro; falta conferir no cedoc.
- **Sem fonte, não usar.**

---

## 1. Dias de leitura

| Regra | Status | Fonte e trecho |
| --- | --- | --- |
| Grupo B (residencial): leitura a cada ~30 dias, **mínimo 27 e máximo 33 dias**, conforme o calendário de leitura | OK-cópia | REN 1.000, **art. 260, caput**: "observados o mínimo de 27 e o máximo de 33 dias" |
| Exceção: de **15 a 47 dias** no 1º faturamento, no remanejamento de rota ou na reprogramação do calendário | OK-cópia | art. 260, § 1º |
| Remanejamento ou reprogramação: a pessoa deve ser avisada **por escrito, com pelo menos um ciclo de antecedência** | OK-cópia | art. 260, § 2º |
| **Menos de 27 dias:** fatura o consumo medido, **sem aplicar o custo de disponibilidade** (mínimo) | OK-cópia | art. 285, I |
| **Mais de 33 dias:** o consumo é **proporcionalizado** ao máximo de dias permitido, e a leitura atual é ajustada ao consumo resultante (o que passou vai para o ciclo seguinte) | OK-cópia | art. 285, II |
| Onde ver o nº de dias na conta | **Sem fonte, não usar** como "obrigatório por lei" | O art. 327 lista o conteúdo da fatura (I a XI) e remete ao Módulo 11 do PRODIST. Ele cita "grandezas medidas e faturadas" (IV) e "histórico de consumo" (VIII), mas **não diz** de forma expressa "nº de dias", "leitura anterior/atual" nem "data da leitura". O Módulo 11 não foi lido. |

Como dizer à família:
- Pode dizer: "Procure na conta as datas da leitura anterior e da atual, ou o número de dias. O nome muda de uma
  empresa para outra."
- Não dizer: "a lei obriga a mostrar".

Regra para o produto (é aritmética, não regulação): **compare kWh por dia** (kWh ÷ dias), não o total do mês. Uma
conta de 33 dias tem até 22% a mais de dias que uma de 27 dias (33 ÷ 27 = 1,222).

## 2. Bandeira na conta

| Regra | Status | Fonte e trecho |
| --- | --- | --- |
| A bandeira é aplicada sobre o consumo faturado com **tarifa proporcional aos dias de vigência de cada bandeira** (pro rata por dias) | OK-cópia | REN 1.000, **art. 307, caput**: "utilizando uma tarifa proporcional aos dias de vigência de cada bandeira" |
| Com medição apropriada (medidor que registra por dia), vale o consumo de cada dia de cada bandeira | OK-cópia | art. 307, § 1º |
| Não se aplica aos Sistemas Isolados. Na geração própria (SCEE), não incide sobre a energia compensada | OK-cópia | art. 307, § 3º e § 2º (o texto repete o nº do § 2º) |
| **Há tributos sobre o adicional da bandeira?** Sim: "Aplicam-se às Bandeiras os mesmos tributos incidentes sobre as tarifas." | OK | ANEEL, Perguntas frequentes sobre bandeiras: https://www.gov.br/aneel/pt-br/assuntos/tarifas/bandeiras-tarifarias/faq-bandeiras-tarifarias/ (publicada em 24/02/2022; acesso em 27/11/2026). A página não diz "ICMS" nem "PIS/COFINS" pelo nome. |
| Tarifa Social e bandeira: "Aplicam-se às Bandeiras os mesmos descontos da tarifa social." | OK, mas o texto é **anterior à Lei 15.235/2025** | Mesma FAQ. Como fica a isenção de 80 kWh sobre a bandeira: conferir na REN 1.147/2025 (pendência minha). **Não afirmar** até lá. |

Simples para a família:
- "Se a leitura pegou parte de um mês e parte do outro, a bandeira de cada mês vale só para os dias dele."
- "Na conta, a bandeira vem com impostos por cima, como o resto da energia. O valor que mostramos é sem impostos.
  Na conta, ele fica um pouco maior."

Dado do site: `tarifas.json → bandeiras[].adicionalKwh` vem em R$/kWh **sem tributos**, um valor por competência
(mês). Rotular sempre como "sem impostos".

Como a distribuidora conta o dia da leitura (se ele entra no ciclo antigo ou no novo): **sem fonte, não usar**. A
função deve receber os dias de cada mês como entrada, ou dizer que é estimativa.

## 3. Como reclamar de conta errada

Caminho oficial:
1. Distribuidora
2. Ouvidoria da distribuidora
3. ANEEL ou agência estadual conveniada

| Regra | Status | Fonte |
| --- | --- | --- |
| Distribuidora: prazo para resolver, contado do protocolo: **até 5 dias úteis** sem visita técnica e **até 10 dias úteis** com visita (salvo prazo específico da ANEEL) | OK-cópia | REN 1.000, **art. 408, I e II** (e § 1º) |
| Demanda sem prazo específico: até 30 dias | OK-cópia | art. 409 |
| Protocolo obrigatório, informado no início do atendimento | OK-cópia | art. 403 |
| **Cobrança indevida:** a parte questionada deve ser **suspensa imediatamente**, salvo se a distribuidora comprovar a contratação e a dívida | OK-cópia | art. 413 (a paráfrase cita "serviço não solicitado ou cobrança indevida"; conferir no cedoc se vale para qualquer erro de consumo) |
| Se a distribuidora negar: resposta por escrito, com os motivos, e aviso do direito de reclamar na Ouvidoria | OK-cópia | art. 416, I a III |
| Ouvidoria: obrigatória nas concessionárias, com **telefone exclusivo e gratuito**, dias úteis, das 8h às 18h | OK-cópia | art. 419, caput e § 2º |
| Quando ir à Ouvidoria: quando o prazo venceu ou quando a pessoa discorda da resposta | OK-cópia | art. 421, caput |
| Ouvidoria responde em **até 10 dias úteis**. Se a pessoa discordar, a Ouvidoria informa a agência estadual ou a ANEEL | OK-cópia | art. 421, § 1º, II |
| Enquanto a Ouvidoria não responde: **não pode cortar a luz** por falta de pagamento do valor questionado, nem exigir que ele seja pago | OK-cópia | art. 422 |
| Quando ir à ANEEL: sem Ouvidoria, prazo vencido ou discordância da resposta | OK-cópia | art. 423 |
| **ANEEL: telefone 167 ou 0800 727 0167**, de segunda a sábado, das 8h às 20h, **gratuito**. Também pelo app "ANEEL Consumidor" (Android e iOS) e pelo formulário na internet. Antes, tentar a distribuidora e depois a Ouvidoria dela | **OK** | gov.br, "Registrar reclamação sobre demanda junto à distribuidora": https://www.gov.br/pt-br/servicos/registrar-reclamacao-sobre-demanda-junto-a-distribuidora-de-energia-eletrica-ANEEL (atualizada em 15/12/2025; acesso em 27/11/2026). O 167 voltou a funcionar em 30/08/2025: https://www.gov.br/aneel/pt-br/assuntos/noticias/2025/aneel-retoma-servico-de-teleatendimento-167-da-ouvidoria-da-aneel |
| Prazo de resposta da ANEEL | **Sem fonte, não usar** | A página do gov.br diz "Não estimado ainda" |

Devolução em dobro:

| Regra | Status | Fonte |
| --- | --- | --- |
| **Faturamento a maior:** a distribuidora devolve até o **2º ciclo depois de constatar o erro**, **em dobro, "independentemente de dolo ou culpa da distribuidora"**, com correção pelo IPCA e juros de 1% ao mês pro rata die | OK-cópia | REN 1.000, **art. 323, II e § 2º, I a III** |
| **Exceção:** a devolução é **simples** (não em dobro) se a distribuidora provar que o erro foi causado só pela pessoa (art. 324) ou por terceiro | OK-cópia | art. 323, § 3º |
| Período de até 60 ciclos para trás: **efeitos suspensos** pelo Despacho ANEEL 2.006/2024 | OK-cópia, **não usar número de meses** | nota no art. 323, II |
| CDC, art. 42, parágrafo único (dobro, "salvo engano justificável") | **Sem fonte confirmada hoje** (Planalto bloqueado). Não citar até conferir. | Para conta de luz, a regra própria e mais forte é a REN 1.000 art. 323 § 2º: em dobro **sem precisar provar culpa**. Usar esta. |

Texto sugerido: "Se cobraram a mais por erro da distribuidora, ela deve devolver em dobro, com correção. Se o erro
foi por informação sua (por exemplo, a leitura que você mesmo mandou), a devolução é simples."

## 4. Teste do relógio (fuga de corrente)

| Fonte | Status | Passo a passo e avisos |
| --- | --- | --- |
| **Cemig**, cartilha "Eficiência energética: saiba como economizar energia" (seção "Instalação elétrica", pp. 6–7): https://www.cemig.com.br/wp-content/uploads/2025/10/Cartilha-Eficiencia-Energetica-Saiba-como-economizar-energia.pdf (acesso em 27/11/2026) | OK | "Verifique se existe fuga de energia na instalação. Para isso, desconecte todos os equipamentos das tomadas" e "desligue toda a iluminação para ver se o medidor de energia continua em movimento." Aviso: "Execute inspeção e reparo nas instalações elétricas sempre com um eletricista experiente e de confiança." |
| **Neoenergia Brasília**, "Conheça seu medidor": https://www.neoenergia.com/web/brasilia/sua-casa/conheca-seu-medidor (acesso em 27/11/2026) | OK (lido em paráfrase) | Passos: tirar todos os aparelhos da tomada e ver se o medidor continua girando ou registrando. Se continuar, há energia escapando: chamar um eletricista de confiança para revisar a instalação. Avisos: manter distância do medidor; **não tocar em fios, condutores ou partes metálicas do medidor**; não deixar crianças por perto. |
| **Disjuntor geral** | **Nenhuma das duas fontes manda desligar o disjuntor geral.** Não incluir esse passo. | Também não incluir "desligar disjuntor por disjuntor" (sem fonte de distribuidora). |

Passo a passo do produto (só o que as fontes dizem):
1. Tire todos os aparelhos da tomada.
2. Apague todas as luzes.
3. Olhe o medidor de longe, sem tocar.
4. Se ele continuar girando ou contando, pode haver fuga de energia.
5. Chame um eletricista de confiança.
6. Não mexa na fiação nem no medidor.
7. Não deixe crianças por perto.

Risco: a geladeira fora da tomada por pouco tempo é aceitável, mas **não há fonte** sobre quanto tempo. Não dar número.

## 5. Erro de leitura, leitura estimada e média

| Regra | Status | Fonte |
| --- | --- | --- |
| Ler o medidor: digital (os números da tela); ciclométrico (como odômetro); de ponteiros (sentido de cada relógio; entre dois números, vale o menor) | OK (paráfrase) | Neoenergia Brasília, "Conheça seu medidor" (link no item 4). A página **não** ensina a comparar com a conta: comparar o número do medidor com a "leitura atual" da conta é orientação nossa, de bom senso. Pode usar, sem citar fonte de distribuidora. |
| **Impedimento de acesso** (medidor dentro da casa e leitura não feita por culpa da pessoa): fatura pela **média dos últimos 12 ciclos**, comunica a pessoa e oferece alternativas (agendar, autoleitura, medidor para fora...) | OK-cópia | REN 1.000, arts. 277 a 279 e 289. O medidor no limite da via pública **não** conta como impedimento (art. 277, parágrafo único). |
| Corte possível depois do 3º ciclo seguido com impedimento | OK-cópia | art. 280 |
| **Sem leitura e sem impedimento** (falha da distribuidora): fatura o **custo de disponibilidade** (30/50/100 kWh) enquanto não houver leitura, **"vedada futura compensação"** se a diferença for positiva | OK-cópia, **conferir no cedoc** | art. 288, § 2º. A paráfrase põe este artigo na seção de leitura plurimensal (zona rural). Confirmar se vale para qualquer residência antes de usar. |
| Quando a leitura volta: calcula a média diária desde a última leitura; diferença negativa é **devolvida**; diferença positiva é **cobrada, limitada a 90 dias** | OK-cópia, **conferir no cedoc** | art. 323, § 11, I, IV e V, b |
| Medidor retirado ou com defeito: média dos 12 últimos ciclos | OK-cópia | art. 320, I |
| Emergência ou calamidade: média dos 12 ciclos e acerto no ciclo seguinte | OK-cópia | art. 321, I e III |
| Autoleitura: só com concordância expressa da pessoa. A distribuidora continua responsável pela leitura. Erro na autoleitura cai no art. 323 | OK-cópia | arts. 263, 265, 267 e 269 |
| Compensação por defeito de medição ou irregularidade: notificação por escrito; a pessoa reclama **em até 30 dias**; a distribuidora responde **em 15 dias**; depois, Ouvidoria em até 30 dias, e a cobrança fica suspensa até a resposta | OK-cópia | art. 325, §§ 1º a 6º |

Texto sugerido: "Confira o número do seu medidor. Ele deve ser igual ou um pouco maior que a 'leitura atual' da conta.
Se for menor, a leitura pode ter sido estimada ou errada: ligue para a distribuidora."

Diga também: "A conta pode vir pela média se o leiturista não entrou. O acerto vem depois."

## 6. Estação (texto qualitativo)

| Afirmação | Status | Fonte |
| --- | --- | --- |
| **Inverno:** o consumo tende a crescer pelo uso de chuveiro elétrico e aquecedor; o chuveiro fica mais tempo e na potência máxima | OK | Cemig, notícia de 28/05/2025: https://www.cemig.com.br/noticia/imprensa/com-a-chegada-do-frio-confira-dicas-da-cemig-para-economizar-energia/ ("a utilização da energia tende a crescer devido ao uso mais intenso de chuveiros elétricos, aquecedores"; "Nos dias frios, o chuveiro costuma ser utilizado em sua potência máxima e por mais tempo"). Copel/AEN-PR, 17/05/2022: chuveiro e aquecedor são os "maiores vilões" nos dias frios: https://www.parana.pr.gov.br/aen/Noticia/Copel-orienta-sobre-como-economizar-energia-durante-os-dias-mais-frios |
| **Verão:** o calor aumenta o uso de ar-condicionado e refrigeração, e a conta pode subir. A geladeira e o ar "apresentam aumento de desempenho" no calor | OK | Neoenergia Elektro, 20/12/2022: https://www.neoenergia.com/web/sp/w/neoenergia-elektro-alerta-para-consumo-consciente-de-energia-no-verao. Copel/AEN-PR, 10/01/2023: climatização e refrigeração "aumentam o consumo de energia": https://www.parana.pr.gov.br/aen/Noticia/Dias-mais-quentes-requerem-atencao-ao-consumo-de-energia-dos-eletrodomesticos |
| **Ventilador gasta mais no verão** | **Sem fonte, não usar** como "gasta mais por aparelho" | As fontes só dizem que se usa mais. Texto possível: "no calor, a gente liga mais ventilador e ar". |
| Números das matérias (220 kWh/mês do chuveiro, "até 30%" na posição verão, "1/3 dos gastos", "30% do consumo" da geladeira) | **Sem fonte, não usar** | São estimativas de engenheiros nas matérias, sem método. |

---

## Casos de teste de negócio (para qa e backend)

Valores de bandeira tirados do `tarifas.json` atual: 2026-09 amarela 0,01885 R$/kWh; 2026-10 verde 0.

**T1. Bandeira pro rata**
- Entrada: 300 kWh; 30 dias, sendo 20 dias em 2026-09 e 10 dias em 2026-10.
- Conta: 300 × 20/30 = 200 kWh × 0,01885 = **R$ 3,77**; 100 kWh × 0 = R$ 0,00.
- Resultado: adicional **R$ 3,77, sem impostos** (REN 1.000, art. 307).

**T2. Um mês só**
- Entrada: 300 kWh, 30 dias, todos em 2026-09.
- Conta: 300 × 0,01885 = 5,655 → **R$ 5,66** (sem impostos). Conferir o arredondamento do `formatarReais` (meio centavo).

**T3. Normalizar pelos dias**
- Entrada: conta anterior 270 kWh em 27 dias; conta atual 330 kWh em 33 dias.
- Conta: 10,0 kWh/dia nas duas.
- Resultado: o site diz **"o consumo por dia não mudou; a conta teve mais dias"** (+22% de kWh só por dias).

**T4. Período longo**
- Entrada: 36 dias e 360 kWh medidos, sem ser 1º faturamento nem reprogramação.
- Resultado esperado pela regra: faturado 360 × 33/36 = **330 kWh**; 30 kWh vão para o ciclo seguinte (art. 285, II).
- O site mostra o aviso: "o período passou de 33 dias; a distribuidora deve cobrar no máximo 33 dias".

**T5. Período curto**
- Entrada: 25 dias, 40 kWh, bifásico.
- Resultado: fatura 40 kWh, **sem o mínimo de 50 kWh** (art. 285, I).

**T6. Fora da faixa com reprogramação**
- Entrada: 45 dias, com aviso da distribuidora.
- Resultado: dentro da exceção de 15 a 47 dias (art. 260, § 1º). Sem alerta de erro; só a normalização por dia.

**T7. Leitura do medidor menor que a "leitura atual" da conta**
- Resultado: o site orienta a conferir com a distribuidora (leitura estimada ou errada). Não afirma "erro" e não calcula
  devolução.

**T8. Texto do adicional**
- Resultado: o valor do adicional sempre vem com o rótulo "sem impostos" (FAQ da ANEEL: tributos incidem).

## Riscos

- R1. Toda a REN foi lida em **cópia da Cemig** (cedoc bloqueado). Conferir os artigos 260, 285, 288, 307, 323, 408,
  413, 419, 421, 422 e 423 no cedoc antes do merge.
- R2. O art. 288, § 2º e o art. 323, § 11 têm a situação de aplicação incerta: não usar até conferir.
- R3. Período de devolução (60 ciclos) suspenso: não prometer "até 5 anos".
- R4. A bandeira na Tarifa Social depois da Lei 15.235: não modelar.
- R5. O site nunca deve dizer "sua conta está errada". Deve dizer "pode valer conferir", e o cálculo é estimativa.

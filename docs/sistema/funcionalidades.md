# Especificação funcional

Descrição completa de cada tela e função do site como ele está hoje. Os diagramas de fluxo estão em
[diagramas.md](diagramas.md); as regras de cálculo, em [calculos-e-fontes.md](calculos-e-fontes.md).

## Visão geral

| Rota | Tela | Precisa de casa cadastrada? |
| --- | --- | --- |
| `/` | Página inicial | não |
| `/comecar` | Cadastro da casa | não |
| `/casa` | Acompanhamento | sim (sem casa, convida a cadastrar) |
| `/casa/comodos` | Cômodos e aparelhos | sim |
| `/casa/dicas` | Dicas e plano de economia | sim |
| `/casa/ajustes` | Minha casa | sim |
| `/casa/aparelhos` | endereço antigo; leva para `/casa/comodos` | — |
| `/sobre` | Sobre o projeto | não |

Na área da casa, a navegação tem quatro seções: **Acompanhamento**, **Cômodos**, **Dicas** e **Minha casa**.
No celular ela fica embaixo da tela; no computador, no topo. O nome da cidade no cabeçalho leva para Minha casa.

## 1. Página inicial (`/`)

Página estática, atualizada uma vez por dia com os dados da ANEEL.

| Seção | Conteúdo |
| --- | --- |
| Abertura | "A conta de luz, cômodo por cômodo." com a casa ilustrada por cômodos e o botão para começar |
| Números | "Dados oficiais, conferidos todos os dias": distribuidoras com tarifa vigente, cidades com distribuidora conhecida, bandeira do mês e os 80 kWh gratuitos da Tarifa Social |
| Experimente | "Quanto custa um banho de 10 minutos?": simulador rápido com um aparelho, usando a tarifa média do Brasil e a bandeira do mês |
| Como funciona | "Três passos e você sabe onde está o gasto" |
| Tarifa Social | "Sua família pode pagar menos na conta de luz": quem tem direito e como pedir |
| Perguntas comuns | respostas curtas (é exato? meus dados vão para algum lugar? etc.) |
| Final | "Comece pela sua casa." com o botão para começar |

Os números entram contando e as seções aparecem ao rolar (desligado com movimento reduzido).

## 2. Cadastro da casa (`/comecar`)

Assistente com **uma pergunta por tela**, barra de progresso, botão Voltar e transição deslizando entre os passos.
A casa só é guardada no fim. Se já existe uma casa cadastrada, a tela "Você já cadastrou a sua casa" oferece ir para o acompanhamento.

| Passo | Pergunta | Opções e regras |
| --- | --- | --- |
| Estado | Em qual estado você mora? | lista com os 27 estados; botão Continuar |
| Cidade | Qual é a sua cidade? | busca por nome, sem diferenciar acentos e maiúsculas; ao escolher, segue sozinho |
| Distribuidora | Qual empresa manda a sua conta de luz? | **pulado** quando só uma distribuidora atende a cidade; cada opção mostra a tarifa sem impostos |
| Benefício | Sua família está no CadÚnico? | Tarifa Social; renda até 1 salário mínimo por pessoa (Desconto Social); Não; Não sei |
| Pessoas | Quantas pessoas moram na casa? | contador; usado para sugerir banhos e carregadores |
| Cômodos | Quais cômodos a sua casa tem? | cozinha, sala, quarto, banheiro, lavanderia, escritório, quintal, outro; começa com 1 cozinha, 1 sala, 2 quartos, 1 banheiro, 1 lavanderia |
| Cada cômodo | O que tem em (nome do cômodo)? | "Cômodo 1 de N"; nome editável (até 40 letras); aparelhos sugeridos (ver catálogo), quantidade, tempo de uso, frequência e perguntas do aparelho; lâmpadas à parte; adicionar outro aparelho do catálogo |
| Revisão | O que tem na sua casa | ver "Por cômodo" ou "Tudo junto", com atalho para editar cada cômodo |
| Conta (opcional) | Tem uma conta de luz em mãos? | consumo do mês (kWh) e valor total (R$); pode pular |

Ao concluir, a casa é criada no aparelho e o site abre o acompanhamento com a animação de entrada no painel.

## 3. Acompanhamento (`/casa`)

| Bloco | O que mostra | O que dá para fazer |
| --- | --- | --- |
| Conta estimada | valor do mês, consumo em kWh, como foi calculado (preço da conta ou tarifa da distribuidora + bandeira), aviso de consumo mínimo, economia da Tarifa Social | ir para Minha casa para ajustar |
| Cômodos | cada cômodo com o valor do mês e a parte da conta | abrir o cômodo |
| Quem mais gasta | aparelhos do que mais gasta para o que menos gasta, com quantidade, cômodo, uso, porcentagem e valor, nas cores da etiqueta do INMETRO | tocar para editar o aparelho |
| Melhor dica | a dica que mais economiza (ou a próxima para o plano) | colocar no plano, ver todas |
| Mês a mês | aba "Contas de luz": contas por mês com gráfico de consumo e o preço real do kWh; aba "Relógio de luz": consumo por dia entre leituras | anotar, editar e apagar contas e leituras |
| Aviso final | os valores são estimativas | — |

Leituras do relógio no mesmo dia ou com número menor que a anterior são ignoradas e avisadas.

## 4. Cômodos e aparelhos (`/casa/comodos`)

- Cada cômodo é um cartão que abre e fecha (sanfona), com total do mês, aparelhos e lâmpadas.
- Em cada aparelho: mudar quantidade, abrir o editor completo, remover.
- **Editor do aparelho**: nome, cômodo, quantidade, perguntas do modelo (tipo de ar, BTUs, idade da geladeira...), e o
  modo de uso: tempo + frequência; banhos por dia × minutos por banho (chuveiro); ou consumo da etiqueta (geladeira, freezer).
  Mostra onde achar a potência real no aparelho.
- **Adicionar aparelho**: busca no catálogo por nome, separado por categoria.
- **Novo cômodo** e **Editar cômodo**: tipo, nome (com sugestões), apagar cômodo.
- **Painel geral** ("Ver"): junta os aparelhos iguais de todos os cômodos — quantidade total, onde estão, horas de uso
  somadas no mês, kWh e R$.

## 5. Dicas e plano de economia (`/casa/dicas`)

- Faixa fixa no topo com a conta de hoje e, com dicas marcadas, a nova conta, a economia por mês e por ano.
- Filtro: **Todas**, **Sem gastar nada** (hábitos) e **Trocando algo** (trocas de aparelho).
- Cada dica mostra o aparelho e o cômodo, o texto e a economia em R$ e kWh; um toque coloca ou tira do plano.
- **Também ajuda**: dicas gerais sem cálculo (bandeira do mês, Tarifa Social, teste de fuga de energia, tomada, selo A).
- A lista completa de dicas está em [referencia-do-dominio.md](referencia-do-dominio.md#dicas).

## 6. Minha casa (`/casa/ajustes`)

| Bloco | Campos |
| --- | --- |
| Onde você mora | estado, cidade e distribuidora |
| Benefício na conta de luz | as mesmas opções do cadastro |
| Tipo de ligação | monofásica, bifásica, trifásica ou não sei (define o consumo mínimo; "não sei" conta como monofásica) |
| Sua conta de luz | consumo do mês e valor total da conta de referência |
| Seus dados | explicação de que tudo fica no navegador e o botão **Apagar todos os meus dados**, com confirmação |

## 7. Sobre (`/sobre`)

Explica o projeto, como o cálculo é feito, de onde vêm os dados e a privacidade.

## Instalar no celular

O site tem manifesto de aplicativo (PWA): nome "Eficiência Energética", nome curto "Conta de luz", abre direto em `/casa`.
O uso sem internet ainda não existe (épico E3).

## Acessibilidade e movimento

- Toques de no mínimo 44 px, foco visível, rótulos em todos os campos, valores que mudam anunciados ao leitor de tela.
- Transições entre páginas, números contando, barras crescendo e seções surgindo; tudo desligado quando o aparelho pede
  menos movimento.

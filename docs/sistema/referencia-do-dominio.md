# Referência do domínio (`@ee/core`)

O pacote `packages/core` guarda todas as regras do sistema em TypeScript puro: sem React, sem rede e sem armazenamento.
O site usa este pacote, e o futuro aplicativo vai usar o mesmo. Tudo é exportado por `packages/core/src/index.ts`.

## Módulos

| Arquivo | Responsabilidade | Principais exportações |
| --- | --- | --- |
| `tipos.ts` | Tipos do sistema | `Residencia`, `Comodo`, `Aparelho`, `ContaMensal`, `LeituraRelogio`, `Distribuidora`, `Municipio`, `BandeiraMes`, `ArquivoTarifas`, `ArquivoMunicipios`, `Beneficio`, `Ligacao` |
| `calculos.ts` | Consumo, preço do kWh e conta | `consumoMensalKwh`, `consumoDiarioKwh`, `precoKwh`, `estimarConta`, `resumirCasa`, `valorMensalAparelho`, `bandeiraDoMes`, `competenciaAtual`, `CONSUMO_MINIMO_KWH`, `TARIFA_SOCIAL_ISENCAO_KWH`, `DESCONTO_SOCIAL_LIMITE_KWH`, `DIAS_NO_MES` |
| `catalogo.ts` | Catálogo de aparelhos e variantes | `CATALOGO`, `CATALOGO_VISIVEL`, `CATEGORIAS`, `COMODOS_PADRAO`, `itemDoCatalogo`, `aparelhoInicial`, `variantesPadrao`, `aplicarVariantes`, `descreverVariantes`, `TEMPOS_RAPIDOS`, `FREQUENCIAS`, `frequenciaMaisProxima` |
| `comodos.ts` | Cômodos e painel geral | `SUGESTOES_COMODO`, `ILUMINACAO_PADRAO`, `TIPOS_LAMPADA`, `ehLampada`, `horasPorMes`, `horasPorDiaMedia`, `agregarAparelhos`, `nomesPadrao` |
| `dicas.ts` | Dicas e plano de economia | `gerarDicas`, `simularPlano`, `Dica`, `TipoDica`, `DESCRICAO_TIPO_DICA` |
| `acompanhamento.ts` | Histórico real | `historicoContas`, `periodosDeLeitura` |
| `bandeiras.ts` | Bandeiras tarifárias | `BANDEIRAS`, `normalizarBandeira` |
| `distribuidoras.ts` | Nomes comerciais | `nomeDaDistribuidora`, `temNomeComercial` |
| `formatacao.ts` | Textos de número | `formatarReais`, `formatarKwh`, `formatarWatts`, `formatarTempo`, `formatarDias`, `formatarPorcentagem`, `formatarCompetencia` |

## Funções principais

| Função | Recebe | Devolve |
| --- | --- | --- |
| `consumoMensalKwh(aparelho)` | potência, minutos por dia, dias por semana, quantidade, fator de ciclo ou kWh da etiqueta | kWh por mês |
| `precoKwh(residencia, distribuidora, bandeira)` | conta de referência e benefício, tarifa, bandeira | `{ valor, origem: "conta" \| "aneel" \| "indisponivel", adicionalBandeira, incluiImpostos }` |
| `estimarConta(consumoKwh, residencia, preco)` | consumo total, benefício, ligação | `{ consumoKwh, kwhCobrados, valor, valorBandeira, economiaBeneficio, cobradoPeloMinimo, consumoMinimoKwh }` |
| `resumirCasa(aparelhos, residencia, preco)` | a casa | a conta e os aparelhos em ordem de gasto, com kWh, parte e valor de cada um |
| `gerarDicas({ aparelhos, residencia, preco, bandeira })` | a casa | dicas com economia em R$ e kWh, da maior para a menor, mais as gerais |
| `simularPlano(aparelhos, dicaIds)` | a casa e as dicas escolhidas | a casa como fica com o plano |
| `agregarAparelhos(aparelhos, comodos)` | a casa | aparelhos iguais somados, com onde estão |
| `periodosDeLeitura(leituras)` | leituras do relógio | períodos com kWh por dia e projeção do mês, e as leituras ignoradas |
| `historicoContas(contas)` | contas anotadas | contas em ordem, com o preço real do kWh |
| `aparelhoInicial(item)` | item do catálogo | aparelho pronto com as respostas padrão |
| `aplicarVariantes(item, escolhas)` | item e respostas | potência, kWh da etiqueta, fator de ciclo e nome ajustados |

Testes: `packages/core/test/calculos.test.ts`, `comodos.test.ts` e `catalogo.test.ts` (`pnpm --filter @ee/core test`).

## Catálogo de aparelhos

O catálogo tem 59 aparelhos visíveis (`CATALOGO_VISIVEL` em `packages/core/src/catalogo.ts`). Os valores são o ponto de partida; a pessoa pode mudar tudo.
Consumo padrão = consumo de uma unidade com o tempo, a frequência e as respostas padrão.

### Banho

| Aparelho | Como é medido | Potência padrão (faixa) | Uso padrão | Consumo padrão | Perguntas que mudam o consumo |
| --- | --- | --- | --- | --- | --- |
| Chuveiro elétrico | banhos × minutos | 5.500 W (3.500–7.800 W) | 4 banho(s) de 8 min por dia | 88 kWh/mês | Qual a potência? (4.500 W, 5.500 W, 6.800 W, 7.500 W ou mais); A casa tem aquecedor solar? (Não, só o chuveiro, Sim, aquecedor solar) |
| Torneira elétrica | potência × tempo | 3.500 W (3.000–5.500 W) | 10 min, todos os dias | 17,5 kWh/mês | — |
| Secador de cabelo | potência × tempo | 1.600 W (1.000–2.400 W) | 10 min, 4 dias por semana | 4,6 kWh/mês | — |
| Chapinha ou modelador | potência × tempo | 60 W (30–200 W) | 15 min, 3 dias por semana | 0,2 kWh/mês | — |

### Cozinha

| Aparelho | Como é medido | Potência padrão (faixa) | Uso padrão | Consumo padrão | Perguntas que mudam o consumo |
| --- | --- | --- | --- | --- | --- |
| Geladeira de 1 porta | etiqueta (kWh/mês) | 90 W (70–250 W) | ligado o tempo todo | 35 kWh/mês | Qual o modelo? (1 porta, 2 portas (degelo manual), 2 portas frost free, Inverse (freezer embaixo), Side by side ou French door, Frigobar); Quantos anos ele tem? (Até 5 anos, De 5 a 10 anos, Mais de 10 anos) |
| Freezer horizontal | etiqueta (kWh/mês) | 130 W (90–250 W) | ligado o tempo todo | 50 kWh/mês | Qual o tipo? (Horizontal (tampa em cima), Vertical (porta na frente)); Quantos anos ele tem? (Até 5 anos, De 5 a 10 anos, Mais de 10 anos) |
| Purificador ou bebedouro gelado | etiqueta (kWh/mês) | 90 W (60–120 W) | ligado o tempo todo | 15 kWh/mês | — |
| Micro-ondas | potência × tempo | 1.500 W (1.000–1.800 W) | 10 min, todos os dias | 7,5 kWh/mês | Qual o tamanho? (Pequeno (até 20 L), Grande (25 L ou mais)) |
| Air fryer | potência × tempo | 1.500 W (1.000–2.000 W) | 20 min, 5 dias por semana | 10,7 kWh/mês | Qual o tamanho do cesto? (Até 3,5 L, 4 a 6 L, Forno air fryer (10 L ou mais)) |
| Forno elétrico | potência × tempo | 1.500 W (1.000–2.500 W) | 30 min, 2 dias por semana | 6,4 kWh/mês | — |
| Cooktop de indução | potência × tempo | 2.000 W (1.200–3.500 W) | 40 min, todos os dias | 40 kWh/mês | — |
| Lava-louças | potência × tempo | 1.400 W (1.000–2.000 W) | 1 h 30 min, 3 dias por semana | 16,2 kWh/mês | — |
| Cafeteira elétrica | potência × tempo | 700 W (500–1.200 W) | 15 min, todos os dias | 5,3 kWh/mês | — |
| Cafeteira de cápsula | potência × tempo | 1.300 W (1.100–1.500 W) | 3 min, todos os dias | 2 kWh/mês | — |
| Chaleira elétrica | potência × tempo | 1.500 W (1.000–2.200 W) | 5 min, todos os dias | 3,8 kWh/mês | — |
| Panela elétrica (arroz ou pressão) | potência × tempo | 800 W (500–1.200 W) | 30 min, 5 dias por semana | 8,6 kWh/mês | — |
| Liquidificador | potência × tempo | 600 W (300–1.400 W) | 5 min, 5 dias por semana | 1,1 kWh/mês | — |
| Batedeira ou mixer | potência × tempo | 400 W (150–800 W) | 10 min, 1 dia por semana | 0,3 kWh/mês | — |
| Sanduicheira ou grill | potência × tempo | 800 W (600–1.500 W) | 10 min, 3 dias por semana | 1,7 kWh/mês | — |
| Pipoqueira elétrica | potência × tempo | 1.200 W (900–1.400 W) | 5 min, 1 dia por semana | 0,4 kWh/mês | — |
| Coifa ou exaustor | potência × tempo | 150 W (80–300 W) | 40 min, todos os dias | 3 kWh/mês | — |

### Calor e frio

| Aparelho | Como é medido | Potência padrão (faixa) | Uso padrão | Consumo padrão | Perguntas que mudam o consumo |
| --- | --- | --- | --- | --- | --- |
| Ventilador | potência × tempo | 130 W (40–200 W) | 8 horas, todos os dias | 31,2 kWh/mês | Qual o tipo? (Pequeno (30 cm), Grande (40 cm ou coluna), De teto) |
| Ar split 9.000 BTUs | potência × tempo | 855 W (500–3.500 W) | 8 horas, todos os dias | 174,4 kWh/mês | Que tipo de ar-condicionado? (Split inverter, Split comum, De janela (antigo), Portátil); De quantos BTUs? (7.500, 9.000, 12.000, 18.000, 24.000 ou mais) |
| Climatizador | potência × tempo | 120 W (60–250 W) | 6 horas, todos os dias | 21,6 kWh/mês | — |
| Aquecedor elétrico | potência × tempo | 1.500 W (800–2.200 W) | 3 horas, todos os dias | 108 kWh/mês | — |
| Desumidificador | potência × tempo | 250 W (150–500 W) | 4 horas, todos os dias | 30 kWh/mês | — |

### Lâmpadas

| Aparelho | Como é medido | Potência padrão (faixa) | Uso padrão | Consumo padrão | Perguntas que mudam o consumo |
| --- | --- | --- | --- | --- | --- |
| Lâmpada de LED | potência × tempo | 9 W (5–20 W) | 5 horas, todos os dias | 1,3 kWh/mês | — |
| Lâmpada fluorescente | potência × tempo | 15 W (9–40 W) | 5 horas, todos os dias | 2,3 kWh/mês | — |
| Lâmpada amarela antiga | potência × tempo | 60 W (40–100 W) | 5 horas, todos os dias | 9 kWh/mês | — |
| Luminária ou abajur | potência × tempo | 9 W (4–60 W) | 2 horas, todos os dias | 0,5 kWh/mês | — |
| Refletor externo | potência × tempo | 50 W (20–200 W) | 10 horas, todos os dias | 15 kWh/mês | — |

### Roupas e água

| Aparelho | Como é medido | Potência padrão (faixa) | Uso padrão | Consumo padrão | Perguntas que mudam o consumo |
| --- | --- | --- | --- | --- | --- |
| Máquina de lavar | potência × tempo | 500 W (250–2.000 W) | 1 hora, 3 dias por semana | 6,4 kWh/mês | Qual o tipo? (Tanquinho, Lavadora, Lava e seca) |
| Secadora de roupas | potência × tempo | 2.500 W (1.500–3.500 W) | 1 hora, 2 dias por semana | 21,4 kWh/mês | — |
| Centrífuga | potência × tempo | 300 W (200–400 W) | 10 min, 3 dias por semana | 0,6 kWh/mês | — |
| Ferro de passar | potência × tempo | 1.000 W (700–2.400 W) | 1 hora, 2 dias por semana | 6 kWh/mês | Qual o tipo? (Ferro seco, Ferro a vapor) |
| Bomba d'água | potência × tempo | 750 W (370–1.500 W) | 30 min, todos os dias | 11,3 kWh/mês | — |
| Máquina de costura | potência × tempo | 100 W (60–200 W) | 1 hora, 2 dias por semana | 0,9 kWh/mês | — |

### TV e eletrônicos

| Aparelho | Como é medido | Potência padrão (faixa) | Uso padrão | Consumo padrão | Perguntas que mudam o consumo |
| --- | --- | --- | --- | --- | --- |
| TV LED até 32 polegadas | potência × tempo | 45 W (30–450 W) | 5 horas, todos os dias | 6,7 kWh/mês | Que tipo de TV? (LED ou Smart TV, LCD fina antiga, Plasma, De tubo (bem antiga)); De que tamanho? (Até 32 pol., 40 a 43 pol., 50 a 55 pol., 65 pol. ou mais) |
| TV box ou aparelho de TV a cabo | potência × tempo | 10 W (5–25 W) | 5 horas, todos os dias | 1,5 kWh/mês | — |
| Aparelho de som ou caixa de som | potência × tempo | 40 W (10–300 W) | 1 hora, 5 dias por semana | 0,9 kWh/mês | — |
| Computador de mesa | potência × tempo | 180 W (60–700 W) | 4 horas, todos os dias | 21,6 kWh/mês | Para que é usado? (Para estudo e trabalho, Gamer, Tudo em um (all-in-one)) |
| Notebook | potência × tempo | 60 W (30–230 W) | 4 horas, todos os dias | 7,2 kWh/mês | — |
| Monitor extra | potência × tempo | 25 W (15–60 W) | 4 horas, 5 dias por semana | 2,1 kWh/mês | — |
| Impressora | potência × tempo | 30 W (10–500 W) | 10 min, 2 dias por semana | 0 kWh/mês | — |
| Videogame (PS5/Xbox Series) | potência × tempo | 200 W (10–250 W) | 2 horas, todos os dias | 12 kWh/mês | Qual videogame? (PS5 ou Xbox Series, PS4 ou Xbox One, Nintendo Switch ou portátil) |
| Carregador de celular | potência × tempo | 15 W (5–65 W) | 2 horas, todos os dias | 0,9 kWh/mês | — |
| Roteador ou modem de internet | potência × tempo | 12 W (6–25 W) | o dia todo, todos os dias | 8,6 kWh/mês | — |
| Assistente de voz (Alexa e similares) | potência × tempo | 3 W (2–15 W) | o dia todo, todos os dias | 2,2 kWh/mês | — |
| Câmera de segurança | potência × tempo | 5 W (3–15 W) | o dia todo, todos os dias | 3,6 kWh/mês | — |

### Limpeza

| Aparelho | Como é medido | Potência padrão (faixa) | Uso padrão | Consumo padrão | Perguntas que mudam o consumo |
| --- | --- | --- | --- | --- | --- |
| Aspirador de pó | potência × tempo | 1.200 W (600–2.000 W) | 20 min, 2 dias por semana | 3,4 kWh/mês | — |
| Robô aspirador | potência × tempo | 30 W (20–70 W) | 1 h 30 min, 5 dias por semana | 1 kWh/mês | — |
| Lavadora de alta pressão | potência × tempo | 1.500 W (1.200–2.200 W) | 30 min, 1 vez por mês | 0,8 kWh/mês | — |

### Outros

| Aparelho | Como é medido | Potência padrão (faixa) | Uso padrão | Consumo padrão | Perguntas que mudam o consumo |
| --- | --- | --- | --- | --- | --- |
| Bomba de piscina | potência × tempo | 750 W (250–1.500 W) | 4 horas, todos os dias | 90 kWh/mês | — |
| Aquário (filtro, luz e aquecedor) | potência × tempo | 40 W (10–300 W) | o dia todo, todos os dias | 28,8 kWh/mês | — |
| Portão eletrônico | potência × tempo | 350 W (200–750 W) | 2 min, todos os dias | 0,4 kWh/mês | — |
| Furadeira ou ferramenta elétrica | potência × tempo | 700 W (300–2.000 W) | 30 min, 1 vez por mês | 0,4 kWh/mês | — |
| Bicicleta ou patinete elétrico (carregar) | potência × tempo | 150 W (60–400 W) | 4 horas, 3 dias por semana | 7,7 kWh/mês | — |
| Carro elétrico (carregar em casa) | potência × tempo | 3.700 W (2.000–7.400 W) | 3 horas, 3 dias por semana | 142,7 kWh/mês | — |
| Outro aparelho | potência × tempo | 100 W (1–10.000 W) | 1 hora, todos os dias | 3 kWh/mês | — |

## Aparelhos sugeridos em cada cômodo

Ao montar um cômodo, estes aparelhos já aparecem (`SUGESTOES_COMODO` e `ILUMINACAO_PADRAO` em `packages/core/src/comodos.ts`). Os marcados vêm com quantidade 1; os outros vêm com 0, prontos para aumentar.

| Cômodo | Já vêm marcados | Sugeridos (quantidade 0) | Lâmpadas |
| --- | --- | --- | --- |
| Cozinha | Geladeira | Micro-ondas, Liquidificador, Air fryer, Cafeteira elétrica, Panela elétrica (arroz ou pressão), Sanduicheira ou grill, Forno elétrico, Purificador ou bebedouro gelado, Freezer, Torneira elétrica, Lava-louças | 1 LED, 4 horas por dia |
| Sala | Televisão, Roteador ou modem de internet | TV box ou aparelho de TV a cabo, Ventilador, Ar-condicionado, Videogame, Aparelho de som ou caixa de som, Computador de mesa | 2 LED, 5 horas por dia |
| Quarto | Ventilador, Carregador de celular | Televisão, Ar-condicionado, Notebook, Computador de mesa, Videogame, Luminária ou abajur, Aquecedor elétrico | 1 LED, 3 horas por dia |
| Banheiro | Chuveiro elétrico | Secador de cabelo, Chapinha ou modelador | 1 LED, 1 hora por dia |
| Lavanderia | Máquina de lavar | Ferro de passar, Secadora de roupas, Centrífuga, Bomba d'água | 1 LED, 1 hora por dia |
| Escritório | Computador de mesa | Notebook, Monitor extra, Impressora, Carregador de celular, Ventilador, Ar-condicionado | 1 LED, 4 horas por dia |
| Quintal | — | Refletor externo, Bomba d'água, Portão eletrônico, Câmera de segurança, Bomba de piscina, Lavadora de alta pressão | 1 LED, 10 horas por dia |
| Outro cômodo | — | — | 1 LED, 2 horas por dia |

## Tempo de uso e frequência

- **Atalhos de tempo por dia** (`TEMPOS_RAPIDOS`): 2 min, 5 min, 10 min, 15 min, 30 min, 1 hora, 2 horas, 3 horas, 5 horas, 8 horas, 12 horas, O dia todo. Também dá para ajustar minuto a minuto.
- **Frequência** (`FREQUENCIAS`, guardada como dias por semana, que pode ser fracionário): Todo dia (7), 5 dias por semana (5), 3 dias por semana (3), 2 dias por semana (2), 1 dia por semana (1), 2 vezes por mês (0,5), 1 vez por mês (0,2).

## Bandeiras tarifárias

| Bandeira | Nome mostrado |
| --- | --- |
| `verde` | Verde |
| `amarela` | Amarela |
| `vermelha-1` | Vermelha patamar 1 |
| `vermelha-2` | Vermelha patamar 2 |
| `escassez-hidrica` | Escassez hídrica |

O valor do adicional de cada bandeira vem do arquivo da ANEEL do mês (não fica fixo no código).

## Dicas

As dicas com cálculo recalculam a conta da própria casa e podem entrar no plano. As gerais não têm cálculo.

| Id | Tipo | Título | Entra no plano? |
| --- | --- | --- | --- |
| `banho-curto` | mudança de hábito | Banhos 2 minutos mais curtos | sim |
| `chuveiro-verao` | mudança de hábito | Chave na posição verão nos dias quentes | sim |
| `torneira-curta` | mudança de hábito | Use a torneira elétrica só para o necessário | sim |
| `geladeira-nova` | troca de aparelho | Trocar a geladeira por uma nova com selo A | sim |
| `geladeira-cuidados` | mudança de hábito | Afaste a geladeira da parede e não guarde comida quente | sim |
| `freezer-degelo` | mudança de hábito | Descongele o freezer quando o gelo passar de meio centímetro | sim |
| `lampada-led` | troca de aparelho | Trocar as lâmpadas amarelas antigas por LED | sim |
| `fluorescente-led` | troca de aparelho | Trocar as fluorescentes por LED | sim |
| `apagar-luz` | mudança de hábito | Apague a luz ao sair do cômodo e abra as janelas de dia | sim |
| `ar-uma-hora` | mudança de hábito | Uma hora a menos de ar-condicionado por dia | sim |
| `ar-ventilador` | mudança de hábito | Trocar 2 horas de ar-condicionado pelo ventilador | sim |
| `ar-inverter` | troca de aparelho | Na hora de trocar o ar-condicionado, escolha um inverter | sim |
| `aquecedor-uma-hora` | mudança de hábito | Uma hora a menos de aquecedor por dia | sim |
| `ferro-de-uma-vez` | mudança de hábito | Junte as roupas e passe tudo de uma vez | sim |
| `maquina-cheia` | mudança de hábito | Lave com a máquina cheia | sim |
| `secador-toalha` | mudança de hábito | Tire o excesso de água com a toalha antes do secador | sim |
| `desligar-quem-nao-usa` | mudança de hábito | Desligue a TV quando ninguém estiver assistindo / Desligue quando ninguém estiver usando | sim |
| `tv-led` | troca de aparelho | Na hora de trocar a TV, prefira uma de LED | sim |
| `notebook-no-lugar` | troca de aparelho | Na hora de trocar o computador, prefira um notebook | sim |
| `bandeira` | aviso | Bandeira (nome da bandeira) neste mês | não |
| `tarifa-social` | para a casa toda | Veja se sua família tem direito à Tarifa Social | não |
| `fuga` | para a casa toda | Teste se há fuga de energia | não |
| `tomada` | para a casa toda | Tire da tomada o que fica com a luzinha acesa | não |
| `selo-procel` | para a casa toda | Na hora de comprar, procure a letra A | não |

Regras de exibição: o aviso de bandeira só aparece com bandeira diferente da verde e quando o preço vem da ANEEL; a dica da Tarifa Social só aparece para quem marcou "nenhum" ou "não sei" no benefício; dicas com cálculo só aparecem quando economizam mais de 0,05 kWh por mês.

## Como acrescentar

- **Um aparelho:** inclua um item em `CATALOGO` (`catalogo.ts`) com id, nome, categoria, ícone Lucide, cômodo sugerido,
  modo (`tempo`, `banho` ou `etiqueta`), potência típica e faixa, uso típico, `ondeEncontrar` e, se houver, `variantes` +
  `calcular`. Cite a fonte da potência num comentário. Rode `pnpm test`.
- **Um item antigo que não deve mais aparecer:** marque `oculto: true` em vez de apagar, para não quebrar casas já cadastradas.
- **Uma dica:** inclua uma mudança em `MUDANCAS` (`dicas.ts`) com id estável, tipo, ícone, título, texto, `vale` (para
  quais aparelhos) e `aplicar` (como a casa fica depois). A economia é calculada sozinha.
- **Um nome comercial de distribuidora:** acrescente a sigla no mapa de `distribuidoras.ts`.

# Sistema de Eficiência Energética

Descubra quanto cada aparelho custa na sua conta de luz, com a **tarifa da sua distribuidora** e a **bandeira do mês**, e veja dicas para pagar menos, com a economia calculada em reais.

Projeto independente e gratuito, feito para as famílias que mais precisam economizar: não pede cadastro, não cobra nada e foi desenhado para ser fácil de usar no celular.

## O que o sistema faz

- **Cadastro da casa em poucos toques:** estado, cidade, distribuidora (escolhida sozinha quando só uma atende a cidade), benefício (Tarifa Social) e pessoas na casa.
- **Cômodo por cômodo:** quantos cômodos de cada tipo, com nome próprio ("Quarto do casal"); cada um já vem com os aparelhos comuns, a quantidade de cada (2 TVs, 3 lâmpadas), o tempo de uso estimado e a iluminação.
- **Catálogo com quase 60 aparelhos**, com perguntas que mudam o consumo: ar-condicionado split inverter, split comum, de janela ou portátil e os BTUs; geladeira por modelo e idade; TV por tecnologia e tamanho; chuveiro por potência e aquecimento solar, entre outros.
- **Tempo de uso flexível:** de 2 minutos ao dia inteiro (com ajuste minuto a minuto), todo dia, alguns dias por semana ou só 1 ou 2 vezes por mês.
- **Painel geral:** junta os aparelhos iguais de todos os cômodos, com quantidade total, onde estão, uso médio por dia, kWh e R$.
- **Acompanhamento editável:** conta estimada, cômodos, quem mais gasta, histórico das contas de luz mês a mês e leituras do relógio de luz, com gráfico comparando o real com a estimativa.
- **Tarifa real:** TE + TUSD residencial (B1, convencional) vigente da distribuidora, mais o adicional da bandeira do mês, direto dos dados abertos da ANEEL.
- **Conta de luz opcional:** com o consumo e o valor de uma conta, o cálculo passa a usar o preço real do kWh, já com impostos.
- **Quem mais gasta:** ranking dos aparelhos nas cores da etiqueta do INMETRO, com valor por aparelho e por cômodo.
- **Dicas e plano de economia:** cada dica recalcula a conta da casa para mostrar quanto economiza; a pessoa marca as que vai seguir e vê a nova conta e a economia no mês e no ano.
- **Regras consideradas:** consumo mínimo (30/50/100 kWh), Tarifa Social (80 kWh isentos, Lei 15.235/2025) e aviso do Desconto Social.

## Como rodar

Requer Node 22 e pnpm 10.

```bash
pnpm install
pnpm dev            # site em http://localhost:3000
pnpm test           # testes dos cálculos e da leitura dos dados da ANEEL
pnpm typecheck      # organização em camadas e tipos
pnpm build          # build de produção
```

## Estrutura

```
apps/web          Site em Next.js 16 (React 19, Tailwind 4). Instalável no celular (PWA).
packages/core     Regras de negócio em TypeScript puro: cálculos, catálogo de aparelhos, dicas.
                  O mesmo pacote será usado pelo app de celular.
packages/dados    Rotina que baixa os dados da ANEEL e gera os arquivos em apps/web/public/dados.
scripts           verificar-camadas.mjs: confere a organização do código do site (pnpm camadas).
```

O código do site é organizado em camadas (rotas, telas, componentes, casos de uso e acesso a dados), descritas em
[docs/arquitetura.md](docs/arquitetura.md#camadas-do-site).

### Os cálculos

- Consumo: `E = P × t` (potência × tempo de uso), mês de 30 dias.
- Custo: `Custo = Energia × Tarifa`, com `Tarifa = TE + TUSD + adicional da bandeira`.
- Exemplo do artigo, coberto por teste: geladeira de 75 W ligada 24 h dá 1,8 kWh/dia e 54 kWh/mês; com R$ 0,65/kWh, R$ 35,10/mês.

## Dados

Tudo vem de fontes públicas, atualizado todo dia pela GitHub Action [`atualizar-dados.yml`](.github/workflows/atualizar-dados.yml):

| Dado | Fonte |
| --- | --- |
| Tarifas residenciais B1 vigentes | ANEEL, [Tarifas de aplicação das distribuidoras](https://dadosabertos.aneel.gov.br/dataset/tarifas-distribuidoras-energia-eletrica) |
| Bandeira do mês e adicional | ANEEL, [Bandeiras Tarifárias](https://dadosabertos.aneel.gov.br/dataset/bandeiras-tarifarias) |
| Distribuidoras de cada cidade | ANEEL, [IndQual Município](https://dadosabertos.aneel.gov.br/dataset/indqual-municipio) cruzado com os [atributos dos Indicadores de Continuidade](https://dadosabertos.aneel.gov.br/dataset/indicadores-coletivos-de-continuidade-dec-e-fec) pelo conjunto elétrico |
| Estados e municípios | IBGE (cópia em `packages/dados/base`, de [kelvins/municipios-brasileiros](https://github.com/kelvins/municipios-brasileiros), MIT) |

A rotina valida os dados antes de gravar. Se a ANEEL publicar algo quebrado, os dados anteriores são mantidos. Para rodar à mão: `pnpm dados:atualizar`. Para desenvolver sem internet: `pnpm dados:exemplo` (gera dados fictícios e o site mostra um aviso).

> Sobre a API [tarifas-energia-api](https://github.com/mpfarias/tarifas-energia-api): ela usa a mesma fonte, mas hoje considera só a TE (sem a TUSD), tem as bandeiras fixas no código (só maio e junho de 2025) e não filtra a vigência. Por isso este projeto lê os dados da ANEEL diretamente.

## Próximos passos e equipe

- [Planejamento](docs/planejamento.md): visão, épicos, histórias e sprints.
- [Arquitetura](docs/arquitetura.md) e [decisões](docs/equipe/decisoes/README.md).
- [Como a equipe trabalha](docs/equipe/processo.md) e o [quadro da sprint](docs/equipe/quadro.md).
- [Guia do projeto](CLAUDE.md): princípios, padrões de código e regras de segurança.
- [Roteiro original](docs/roteiro.md).

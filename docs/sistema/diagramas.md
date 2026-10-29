# Diagramas das funções

Os diagramas estão em [Mermaid](https://mermaid.js.org/). O GitHub desenha os diagramas direto nesta página. No VS Code,
use a pré-visualização de Markdown com a extensão "Markdown Preview Mermaid Support".

Todos refletem o código atual: domínio em `packages/core/src/`, telas em `apps/web/src/app/`, rotina em `packages/dados/src/`.

## 1. Mapa das funções

O que a pessoa pode fazer em cada tela.

```mermaid
flowchart LR
  P(["Pessoa"])
  subgraph Inicio["Página inicial"]
    I1["Testar um aparelho<br/>no simulador rápido"]
    I2["Começar o cadastro"]
  end
  subgraph Cad["Cadastro da casa"]
    C1["Escolher estado,<br/>cidade e distribuidora"]
    C2["Informar benefício<br/>e pessoas"]
    C3["Montar cômodos<br/>e aparelhos"]
    C4["Informar uma conta<br/>(opcional)"]
  end
  subgraph Casa["Área da casa"]
    A1["Acompanhamento:<br/>conta estimada e ranking"]
    A2["Anotar contas e<br/>leituras do relógio"]
    A3["Cômodos e<br/>painel geral"]
    A4["Plano de economia"]
    A5["Minha casa:<br/>ajustes e apagar tudo"]
  end
  P --> I1 & I2
  I2 --> C1 --> C2 --> C3 --> C4 --> A1
  P --> A1 & A2 & A3 & A4 & A5
```

## 2. Fluxo do cadastro

Uma pergunta por tela (`apps/web/src/app/comecar/Cadastro.tsx`). A distribuidora só é perguntada quando a cidade tem
mais de uma, ou nenhuma conhecida.

```mermaid
flowchart TD
  E["Estado (lista)"] --> C["Cidade (busca)"]
  C --> Q{"Quantas distribuidoras<br/>atendem a cidade?"}
  Q -- "uma" --> B
  Q -- "mais de uma ou nenhuma" --> D["Escolher a distribuidora"] --> B
  B["Benefício: Tarifa Social,<br/>Desconto Social, nenhum ou não sei"] --> PE["Pessoas na casa"]
  PE --> CO["Quantos cômodos de cada tipo"]
  CO --> CI["Cada cômodo: aparelhos sugeridos,<br/>quantidade, tempo de uso e tipo"]
  CI --> M{"Falta algum cômodo?"}
  M -- "sim" --> CI
  M -- "não" --> R["Revisão"]
  R --> CT{"Tem uma conta de luz?"}
  CT -- "sim" --> CR["Informar kWh e valor"] --> FIM
  CT -- "não, pular" --> FIM
  FIM(["Casa criada e guardada no celular:<br/>abre o acompanhamento"])
```

## 3. Cálculo da conta estimada

Funções `consumoMensalKwh`, `precoKwh`, `estimarConta` e `resumirCasa` em `packages/core/src/calculos.ts`.

```mermaid
flowchart TD
  A["Cada aparelho da casa"] --> K{"Tem consumo da etiqueta<br/>(kWh/mês informado)?"}
  K -- "sim" --> KE["kWh/mês = etiqueta × quantidade"]
  K -- "não" --> KC["kWh/mês = potência ÷ 1000 × horas por dia<br/>× dias por semana ÷ 7 × 30<br/>× quantidade × fator de ciclo"]
  KE --> S["Soma do consumo da casa"]
  KC --> S
  S --> PR{"Conta de referência válida?<br/>(valor > 0 e 10 kWh ou mais cobrados)"}
  PR -- "sim" --> P1["Preço = valor ÷ kWh cobrados na conta<br/>(com impostos)"]
  PR -- "não" --> P2["Preço = TE + TUSD da distribuidora<br/>+ adicional da bandeira (sem impostos)"]
  P1 --> BE{"Tarifa Social?"}
  P2 --> BE
  BE -- "sim" --> TS["kWh cobrados = consumo − 80<br/>(nunca menos que zero)"]
  BE -- "não" --> MI["kWh cobrados = o maior entre o consumo<br/>e o mínimo da ligação (30, 50 ou 100)"]
  TS --> V(["Conta = kWh cobrados × preço"])
  MI --> V
  V --> RK["Ranking: parte de cada aparelho<br/>no consumo e na conta"]
```

Com a ligação desconhecida, o sistema assume monofásica (30 kWh), a mais comum em residências.

## 4. Dicas e plano de economia

Funções `gerarDicas` e `simularPlano` em `packages/core/src/dicas.ts`.

```mermaid
flowchart TD
  subgraph Gerar["Gerar dicas"]
    G1["Para cada aparelho"] --> G2["Para cada mudança possível<br/>(banho mais curto, lâmpada LED,<br/>ar uma hora a menos...)"]
    G2 --> G3{"A mudança vale<br/>para este aparelho?"}
    G3 -- "não" --> G2
    G3 -- "sim" --> G4["Aplicar a mudança numa cópia da casa"]
    G4 --> G5["Recalcular a conta inteira"]
    G5 --> G6{"Economiza mais<br/>que 0,05 kWh?"}
    G6 -- "não" --> G2
    G6 -- "sim" --> G7["Dica com economia em R$ e kWh"]
  end
  G7 --> O["Dicas em ordem:<br/>maior economia primeiro"]
  O --> ESC["A pessoa marca as dicas do plano"]
  subgraph Plano["Simular o plano"]
    ESC --> PL1["Aplicar as dicas marcadas,<br/>uma depois da outra"]
    PL1 --> PL2["Nova conta da casa"]
  end
  PL2 --> RES(["Economia por mês e por ano"])
```

Aplicar uma dica depois da outra evita contar a mesma economia duas vezes. Por exemplo, banho mais curto e chuveiro
na posição verão no mesmo chuveiro.

## 5. Acompanhamento: real × estimado

Funções `historicoContas` e `periodosDeLeitura` em `packages/core/src/acompanhamento.ts`.

```mermaid
flowchart LR
  CT["Contas anotadas<br/>(mês, kWh, valor)"] --> H["Histórico mês a mês<br/>com o preço real do kWh"]
  LE["Leituras do relógio<br/>(data, número em kWh)"] --> PE["Períodos entre leituras:<br/>kWh por dia"]
  PE --> IG{"Leitura no mesmo dia ou<br/>menor que a anterior?"}
  IG -- "sim" --> X["Ignorada e avisada"]
  IG -- "não" --> GR
  H --> GR["Gráfico: real × estimativa da casa"]
  EST["Conta estimada<br/>(diagrama 3)"] --> GR
```

## 6. Rotina diária de dados

`.github/workflows/atualizar-dados.yml` e `packages/dados/src/`.

```mermaid
sequenceDiagram
  autonumber
  participant GA as GitHub Actions (06:17)
  participant AN as ANEEL (dados abertos)
  participant RT as Rotina (packages/dados)
  participant RP as Repositório (main)
  participant VC as Vercel
  GA->>RT: inicia a rotina
  RT->>AN: baixa tarifas, bandeiras, IndQual e conjuntos (até 6 tentativas)
  AN-->>RT: arquivos CSV
  RT->>RT: lê, cruza município → conjunto → distribuidora (IBGE local)
  RT->>RT: valida quantidades e valores
  alt dados válidos e diferentes dos atuais
    RT->>RP: grava public/dados/*.json e faz commit
    RP->>VC: novo deploy do site
  else dados inválidos ou iguais
    RT-->>GA: mantém os dados anteriores
  end
  RT-->>GA: resumo publicado como anotação do job
```

## 7. Abrir a área da casa

O que acontece no celular quando a pessoa abre o acompanhamento.

```mermaid
sequenceDiagram
  participant N as Navegador
  participant AR as Armazenamento local
  participant D as /dados (site)
  participant C as Domínio (@ee/core)
  N->>AR: carrega a casa (versão 2, com migração)
  AR-->>N: residência, cômodos, aparelhos, contas, leituras, plano
  N->>D: busca tarifas.json
  D-->>N: tarifa da distribuidora e bandeira do mês
  N->>C: resumirCasa, gerarDicas, simularPlano
  C-->>N: conta estimada, ranking, dicas, economia
  N->>N: mostra a tela com os números animados
```

## 8. Modelo de dados

Tipos em `packages/core/src/tipos.ts`. Hoje tudo fica no navegador; a conta opcional (épico E4) usará as mesmas estruturas.

```mermaid
classDiagram
  direction LR
  class Residencia {
    uf
    municipioIbge
    municipioNome
    distribuidoraId
    beneficio
    ligacao
    pessoas
    contaReferencia
  }
  class Comodo {
    id
    nome
    tipo
  }
  class Aparelho {
    id
    comodoId
    catalogoId
    nome
    quantidade
    potenciaW
    minutosPorDia
    diasPorSemana
    fatorCiclo
    variantes
    kwhMesInformado
  }
  class ContaMensal {
    id
    competencia
    kwh
    valor
  }
  class LeituraRelogio {
    id
    data
    valorKwh
  }
  class Plano {
    dicaIds
  }
  class Distribuidora {
    id
    nome
    tarifaKwh
    ufs
  }
  class Municipio {
    ibge
    nome
    distribuidoras
  }
  Residencia "1" --> "*" Comodo
  Comodo "1" --> "*" Aparelho
  Residencia "1" --> "*" ContaMensal
  Residencia "1" --> "*" LeituraRelogio
  Residencia "1" --> "1" Plano
  Residencia ..> Distribuidora : distribuidoraId
  Municipio ..> Distribuidora : atendida por
```

`Distribuidora` e `Municipio` vêm dos arquivos públicos em `/dados`. Os demais tipos são da casa da pessoa.

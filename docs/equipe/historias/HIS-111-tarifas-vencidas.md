# HIS-111 · Tarifas vencidas: cada cidade com a distribuidora de hoje

| Campo | Valor |
| --- | --- |
| Épico | E2 · Precisão da conta (número dado por quem orquestra; o scrum-master confirma o épico) |
| Sprint | a definir pelo scrum-master (pedido do dominio-energia: prioridade alta, P-de-1 da HIS-003) |
| Tamanho | M (≈ 2 dias de backend + 0,5 dia de qa, depois das respostas do dominio-energia) |
| Papéis principais | backend, dominio-energia, qa; tech-lead (contrato do `tarifas.json`) e ux (um texto) |
| Status | Preparando |
| Branch | `his-111-tarifas-vencidas` |

> **Origem:** achado P-de-1 do dominio-energia na HIS-003 ("Achado: tarifas vencidas", 2026-10-30). Investigação e
> proposta do backend em 2026-10-30, com os arquivos publicados em 29/10/2026 (`apps/web/public/dados`, assinatura
> `d5b7116b507984cf`). A rede do ambiente de nuvem não alcança `dadosabertos.aneel.gov.br` (o proxy recusa), então os
> CSVs brutos não foram abertos aqui; ver "O que falta confirmar com os CSVs".

## Problema e valor

Como **família que mora em Alegrete, Assis, Mococa, Caracaraí e outras 223 cidades**, eu quero **ver a conta calculada
com o preço que a minha distribuidora cobra hoje** para **não achar que vou pagar quase metade do que vou pagar de verdade**.

Hoje, em 227 cidades, o site usa o preço de uma empresa que **não existe mais**. Ela foi comprada ou juntada com
outra entre 2017 e 2023. O preço dela parou no ano em que ela acabou. Desde então a luz ficou bem mais cara. Por isso, o
site mostra uma conta **de 11% a 55% menor** do que a real. Isso só não acontece quando a família informa uma conta de
luz, porque aí o preço vem da conta dela.

Uma família que planeja o mês com esse número pode faltar dinheiro. É o contrário do que o produto promete.

## Evidência

Arquivos de 29/10/2026. Hoje = 30/10/2026. Na coluna "Conta mostrada", a tarifa usada é comparada com a da sucessora
provável. Os dois valores são sem impostos e sem bandeira.

| Sigla na ANEEL | CNPJ | Tarifa usada (R$/kWh) | Vigência até | Municípios | Só ela | É a 1ª da lista | Sucessora provável | Tarifa da sucessora | Conta mostrada |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RGE SUL | 02016440000162 | 0,54732 | 18/06/2019 | 127 | 74 | 122 | RGE (**mesmo CNPJ**) | 0,94461 | 42% menor |
| EDEVP | 07297359000111 | 0,44471 | 11/07/2017 | 27 | 27 | 27 | ESS (07282377000120) | 0,81424 | 45% menor |
| CNEE | 61416244000144 | 0,41375 | 11/07/2017 | 16 | 2 | 15 | ESS | 0,81424 | 49% menor |
| EEB | 60942281000123 | 0,48717 | 11/07/2017 | 16 | 14 | 14 | ESS | 0,81424 | 40% menor |
| CFLO | 77882504000107 | 0,46967 | 11/07/2017 | 1 | 0 | 0 | ESS | 0,81424 | 42% menor |
| CPFL LESTE PAULI | 61015582000174 | 0,46109 | 21/03/2018 | 7 | 7 | 7 | CPFL Santa Cruz (53859112000169) | 0,81258 | 43% menor |
| CPFL MOCOCA | 52503802000118 | 0,46710 | 21/03/2018 | 4 | 4 | 4 | CPFL Santa Cruz | 0,81258 | 43% menor |
| CPFL SUL PAULIST | 60855608000120 | 0,47227 | 21/03/2018 | 5 | 5 | 5 | CPFL Santa Cruz | 0,81258 | 42% menor |
| ENF | 33249046000106 | 0,82193 | 21/06/2023 | 1 | 0 | 0 | EMR (19527639000158) | 0,91899 | 11% menor |
| EBO | 08826596000195 | 0,53644 | 27/08/2023 | 9 | 0 | 0 | EPB (09095183000140) | 0,70970 | 24% menor |
| CERR | 05938444000196 | 0,35264 | 31/12/2016 | 14 | 14 | 14 | Âmbar Roraima (02341470000144) | 0,78947 | 55% menor |
| CPFL JAGUARI | 53859112000169 | 0,41781 | 21/03/2018 | 0 | 0 | 0 | CPFL Santa Cruz (**mesmo CNPJ**) | 0,81258 | (não aparece em cidade) |

**Totais:**
- **227 municípios** afetados, em 7 UFs: RS 127, SP 62, RR 14, MG 13, PB 9, PR 1 e RJ 1.
- Em **147** deles, a única opção é a empresa vencida.
- Em **208**, ela é a primeira da lista.
- Nos outros 19, outra distribuidora aparece primeiro, mas a vencida continua como opção. Pode ser a sucessora ou
  uma cooperativa. Ex.: Campina Grande (EPB, EBO), Nova Friburgo (Enel RJ, ENF) e Guarapuava (Copel, CFLO).
- O problema está em todas as publicações vindas da ANEEL (`8fb9ac3` e `6cfdb74`).

**Efeito secundário:** o simulador da página inicial usa a média de todas as distribuidoras (`tarifaMedia` em
`aplicacao/resumo.ts`). Com as 12 vencidas, essa média dá R$ 0,80098. Sem elas, R$ 0,83745. Ou seja, a média sai **4,4% mais baixa**.

Exemplos para conferir à mão:
- Alegrete (RS, 4300406): `rge-sul`.
- Assis (SP, 3504008): `edevp`.
- Bragança Paulista (SP, 3507605): `eeb`.
- Mococa (SP, 3530508): `cpfl-mococa`.
- Itapetininga (SP, 3522307): `cpfl-sul-paulist`.
- Caracaraí (RR, 1400209): `cerr`.

## Causa

São três falhas na rotina (`packages/dados/src`). Elas se somam.

**C1 — CNPJ repetido: vence a sigla de nome "maior", não a tarifa mais nova (prova feita; 127 municípios).**
- Em `montar.ts`, `porCnpj = new Map(tarifas.map(t => [t.cnpj, t]))` é montado a partir da lista em ordem alfabética de sigla.
- Quando duas siglas têm o mesmo CNPJ, o `Map` fica com a **última em ordem alfabética**:
  - RGE e RGE SUL (02016440000162): fica a RGE SUL, de 2019;
  - CPFL JAGUARI e CPFL Santa Cruz (53859112000169): fica a Santa Cruz, por sorte.
- O `acharTarifa` olha o CNPJ **antes** da sigla. Por isso, qualquer conjunto com esse CNPJ cai na RGE SUL, mesmo quando
  a ANEEL escreve "RGE" no conjunto.
- Reproduzido com o `montarArquivos` de verdade: os conjuntos com `SigAgente` = "RGE", "RGE SUL" ou qualquer outro texto
  e esse CNPJ dão sempre `rge-sul`.
- **Mesmo CNPJ quer dizer mesma empresa.** A RGE Sul incorporou a RGE em 2019 e passou a se chamar RGE. A troca é
  segura e não precisa de tabela.

**C2 — conjunto elétrico extinto continua contando (provável; 100 municípios).**
- Em `aneel/municipios.ts`, `criarLeitorConjuntos` guarda o dono do **ano mais recente de cada conjunto**. Mas ele nunca
  compara esse ano com o ano mais recente do arquivo.
- O IndQual Município não tem coluna de ano. O `lerVinculos` aceita qualquer conjunto que já existiu.
- Exemplo: um conjunto de Assis que parou de reportar em 2016, quando ainda era da EDEVP, continua ligando Assis à EDEVP.
- Os CNPJs de EDEVP, CNEE, EEB, CFLO, das três CPFL, de ENF, EBO e CERR são **diferentes** dos CNPJs das sucessoras.
  Logo, o vínculo vem do conjunto antigo, e não de um problema de sigla.
- Em 19 cidades a sucessora também aparece (EBO+EPB, por exemplo). Isso mostra que o arquivo tem conjuntos novos e velhos juntos.
- Ainda não sabemos por que, nas outras 81 cidades, nenhum conjunto novo aparece. Pode ser que a sucessora tenha
  conjuntos com outro número e o IndQual Município não os ligue à cidade. Ver "O que falta confirmar".

**C3 — tarifa vencida é aceita sem limite de idade, e a validação não olha a data.**
- `selecionarTarifasVigentes`: quando nenhuma vigência cobre o dia, ele "usa a mais recente que já começou", sem limite
  nenhum de idade. Assim, uma tarifa de 2016 passa como "vigente".
- `validar` confere a faixa de valor (R$ 0,30 a 2,00), mas não confere `fimVigencia`. Os valores velhos (0,35 a 0,82)
  estão dentro da faixa.
- A barreira de "mais de 5% dos municípios sem distribuidora" (278) também não pegaria uma perda de 100 ou 150 cidades.

### O que falta confirmar com os CSVs

Um diagnóstico só de leitura foi escrito e testado com as fixtures (com um caso EDEVP inventado). Ele não usa rede e lê
o `.cache` da rotina. Para cada tarifa vencida, ele mostra:
- quantos conjuntos a têm como dono mais recente;
- o último `AnoIndice` desses conjuntos, comparado com o ano mais recente do arquivo;
- se os municípios também têm um conjunto recente de outra empresa;
- quais CNPJs aparecem com mais de uma sigla.

O script fica em
`/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/backend-tarifas/diagnosticar-sucessao.ts`.
A pasta é temporária. Na implementação, ele vira a seção nova do relatório (D6) e deixa de existir à parte.
- **Passo 0 da implementação:** rodar `pnpm dados:atualizar` numa máquina com acesso à ANEEL (ou na Action) e depois o
  diagnóstico. Se o último ano dos conjuntos das empresas vencidas for anterior ao ano máximo do arquivo, C2 está
  confirmada. Se não for, o backend revê o D3 antes de seguir.

## Proposta técnica

Ordem de aplicação dentro da rotina: D1 → D2 → D3 ao ligar município e tarifa. Depois D4 na seleção da tarifa, e
D5 e D6 na barreira e no relatório. O D7 é a ponte para quem já salvou a casa.

- **D1 — índice por CNPJ fica com a vigência mais recente** (`montar.ts`).
  - Uma função `indexarPorCnpj(tarifas)` guarda, por CNPJ, a tarifa de `inicioVigencia` mais nova.
  - As outras siglas do mesmo CNPJ viram **renomeação automática**, por exemplo `rge-sul → rge`. Elas saem do
    `tarifas.json` e entram em `substituidas` (D7).
  - Corrige os 127 municípios da RGE SUL e tira a CPFL JAGUARI do ar. Não precisa de confirmação: o CNPJ é a empresa.
- **D2 — tabela de sucessões com fonte oficial** (`packages/dados/base/sucessoes.json`, dado versionado e revisado
  pelo dominio-energia).
  - Cada linha tem: `{ cnpjAntigo, siglaAntiga, cnpjSucessor, siglaSucessora, desde, ato, fonte, consultadoEm }`.
    O `ato` é a resolução autorizativa da ANEEL que aprovou a incorporação, e a `fonte` é o link.
  - É lida por um leitor à mão na fronteira, que recusa linha sem `ato` ou sem `fonte`. É a mesma decisão D1 da HIS-003.
  - O `acharTarifa` segue a cadeia antes de procurar a tarifa: no máximo 5 saltos, e um ciclo é erro.
  - Primeiras linhas, **todas a confirmar** (ver perguntas):
    - EDEVP, CNEE, EEB e CFLO → ESS;
    - CPFL LESTE PAULI, CPFL MOCOCA e CPFL SUL PAULIST → CPFL Santa Cruz;
    - ENF → EMR;
    - EBO → EPB;
    - CERR → Âmbar Roraima.
  - **Por que não adivinhar a sucessora sozinha:** a regra "o fim de uma vigência e o começo da outra caem em dias
    seguidos" acha candidatas, mas muitas distribuidoras fazem o reajuste no mesmo dia. Trocar a empresa de uma cidade
    sem um ato oficial pode errar de novo, e sem ninguém ver.
  - Por isso essa regra só entra no relatório, como "sucessora candidata", para ajudar quem revisa.
- **D3 — conjunto extinto não liga cidade sozinho** (`aneel/municipios.ts`).
  - O leitor de conjuntos passa a expor `anoMaisRecente`, o maior `AnoIndice` do arquivo.
  - O `VinculoMunicipio` passa a levar o `ano` do dono.
  - Um vínculo com `ano < anoMaisRecente − 1` é **extinto**:
    - ele só vale se o D1 ou o D2 levar a uma sucessora com tarifa vigente;
    - se não levar, sai e é contado no relatório, com a sigla.
  - A folga de 1 ano existe porque a ANEEL publica o ano anterior com atraso.
- **D4 — tarifa vencida não é publicada** (`aneel/tarifas.ts`).
  - O "usa a mais recente que já começou" só vale se `fimVigencia ≥ hoje − 12 meses`, a regra do dominio-energia (o
    reajuste é anual). Fora disso, a tarifa vai para `descartadas` com o motivo "vencida desde AAAA-MM-DD".
  - Entre 31 dias e 12 meses vencida, a tarifa entra, mas com um aviso no relatório.
  - Hoje nenhuma tarifa está nessa janela, então o número exato não muda o arquivo atual.
  - Na mesma linha, a HIS-003a (a3) troca o corte `total <= 0.05 || total > 5` pelos `LIMITES` do core.
- **D5 — barreira que impede a volta do problema** (`validar` em `montar.ts`). Se uma regra falhar, a rotina sai com
  erro e nada é gravado:
  - V1: nenhuma distribuidora publicada tem `fimVigencia` anterior a `hoje − 12 meses`.
  - V2: nenhum CNPJ aparece em duas distribuidoras publicadas.
  - V3: nenhum município tem na lista uma distribuidora que também é chave de `substituidas`.
  - V4: toda sucessora do `sucessoes.json` existe no `tarifas.json` e está vigente. Isso pega o caso em que a própria
    sucessora foi incorporada depois.
  - V5: `agentesSemTarifa` está vazio. Hoje ele está vazio. Uma empresa nova sem tarifa quer dizer uma sucessão nova
    ainda não mapeada: a rotina para, e alguém olha.
  - V6: `municipiosSemDistribuidora ≤ 30`. Hoje são 10. O limite de 5% (278) continua, mas este pega antes.
- **D6 — relatório** (`relatorio.json` e a anotação do job). Campos novos:
  - `renomeacoesPorCnpj`;
  - `sucessoesAplicadas` (sigla antiga → nova, com o número de municípios);
  - `vinculosExtintosDescartados`;
  - `tarifasDescartadasPorVencimento`;
  - `tarifasPertoDeVencer`;
  - `sucessorasCandidatas` (só como informação).
  Assim, o resultado do diagnóstico fica visível em toda execução.
- **D7 — quem já salvou `rge-sul` não pode ficar sem preço** (contrato, `[para: tech-lead]`).
  - Se `rge-sul` sumir do arquivo, `useResumo` não acha a distribuidora, e `precoKwh` devolve `origem: "indisponivel"`
    (valor 0). A conta some para quem não informou uma conta de luz.
  - Proposta: o `ArquivoTarifas` ganha `substituidas: Record<string, string>` (id antigo → id atual), gerado do D1 e do D2.
  - A leitura da `Residencia` (o leitor da HIS-003a) troca o `distribuidoraId` antigo pelo novo e regrava uma vez.
  - Mostrar ou não um aviso: ver a pergunta para a ux.

**Corte possível, se o dominio-energia demorar:**
- D1 + D4 + D5 (V1, V2, V3) + D7 podem sair primeiro. Eles corrigem os 127 municípios da RGE SUL (56% do problema) sem
  depender de confirmação.
- Mas o V1 só passa se as outras 10 empresas vencidas saírem do arquivo. Sem o D2, isso deixa 81 cidades **sem
  distribuidora**: o site pede a conta de luz ou mostra "indisponível". Isso é honesto, mas pior para a família.
- **Recomendação:** um corte só, assim que as sucessões forem confirmadas. O scrum-master decide.

**Arquivos tocados:**
- `packages/dados/src/aneel/tarifas.ts`, `aneel/municipios.ts`, `montar.ts`, `atualizar.ts` (relatório);
- `packages/dados/base/sucessoes.json` e o leitor dele;
- `packages/dados/fixtures/` e `test/dados.test.ts`;
- `packages/core` (tipo `ArquivoTarifas`, D7);
- o leitor da `Residencia` da HIS-003a.

Quem regrava `apps/web/public/dados/` é a própria rotina; ninguém edita esses arquivos à mão.

**Conflito com a HIS-003a:** o a3 mexe em `tarifas.ts` e no `validar`. Para não haver conflito, a HIS-111 começa
depois de o a3 entrar no `main`.

## Critérios de aceite

1. **Dado** o arquivo novo, **quando** procuro Alegrete (4300406), Assis (3504008), Bragança Paulista (3507605), Mococa
   (3530508), Itapetininga (3522307) e Caracaraí (1400209), **então** a primeira distribuidora de cada uma é,
   respectivamente, `rge`, `ess`, `ess`, `cpfl-santa-cruz`, `cpfl-santa-cruz` e `ambar-roraima`. Isso vale se o
   dominio-energia confirmar as sucessões.
2. **Dado** o arquivo novo, **quando** confiro os 227 municípios da tabela de evidência, **então** nenhum deles tem
   `rge-sul`, `edevp`, `cnee`, `eeb`, `cflo`, `cpfl-leste-pauli`, `cpfl-mococa`, `cpfl-sul-paulist`, `enf`, `ebo` ou
   `cerr`, e todos têm ao menos uma distribuidora.
3. **Dado** o `tarifas.json` novo, **quando** o `arquivos-publicos.test.ts` roda, **então** nenhuma distribuidora tem
   `fimVigencia` anterior a `geradoEm − 12 meses` (V1), e nenhum CNPJ se repete (V2).
4. **Dado** uma fixture com RGE (2026) e RGE SUL (2019) com o mesmo CNPJ, e um conjunto com `SigAgente` = "RGE SUL",
   **quando** a montagem roda, **então** o município fica com `rge`, e `substituidas` tem `"rge-sul": "rge"`.
5. **Dado** uma fixture com um conjunto que parou de reportar 3 anos antes do ano máximo e é de uma empresa que está
   no `sucessoes.json`, **quando** a montagem roda, **então** o município fica com a sucessora. **Dado** o mesmo
   conjunto sem linha de sucessão, **então** o vínculo sai e aparece em `vinculosExtintosDescartados`.
6. **Dado** uma fixture com uma tarifa vencida há 13 meses e sem sucessora, **quando** `pnpm dados:atualizar` roda,
   **então** a rotina sai com código 1, lista V1 ou V5 na mensagem e **não grava nada** (a assinatura não muda).
7. **Dado** uma linha do `sucessoes.json` sem `ato` ou sem `fonte`, ou uma cadeia com ciclo, **quando** a rotina
   roda, **então** ela para com um erro que diz qual linha está errada.
8. **Dado** uma casa salva no aparelho com `distribuidoraId: "rge-sul"` e sem conta de luz, **quando** a pessoa abre
   `/casa`, **então** o preço do kWh é o da RGE (`origem: "aneel"`, R$ 0,94461 mais a bandeira), e a casa é regravada
   com `"rge"`. Teste de unidade no leitor e e2e com o `localStorage` preparado.
9. **Dado** a execução na Action, **quando** termina, **então** a anotação `::notice` mostra `sucessoesAplicadas`,
   `vinculosExtintosDescartados` e `tarifasDescartadasPorVencimento`, e o qa confere os números com esta história.
10. O diff de `apps/web/public/dados/municipios/*.json` só muda os municípios esperados. O qa anexa a contagem: perto
    de 227, mais o que o D3 tirar de vínculo extinto em cidades que já estavam certas.
11. `pnpm typecheck`, `pnpm test` e `pnpm build` passam. O simulador da `/` passa a usar a média sem as vencidas
    (R$ 0,837, contra 0,801 hoje, com os dados de 29/10).

## Fora do escopo

- Impostos, ICMS e PIS/COFINS (HIS-202).
- Nomes comerciais novos além dos que a troca exigir (HIS-205). `nomeDaDistribuidora` já tem RGE, CPFL Santa Cruz,
  Energisa e Âmbar Roraima.
- Ponderar a média nacional pelo número de consumidores (pergunta para o dominio-energia, sem bloquear).
- As 15 distribuidoras com tarifa vigente e sem município (cooperativas sem conjunto no IndQual): elas continuam
  como hoje.

## Regras de negócio e fontes

_(dominio-energia, consultado em 30/10/2026.)_ O site da ANEEL (`www2.aneel.gov.br/cedoc`) não abre daqui. Por isso,
alguns links são cópias do documento oficial. Quem tiver acesso troca pelo link do cedoc ou do `in.gov.br` no PR.

**Sucessões (linhas do `sucessoes.json`):**

| Antiga → sucessora (CNPJ) | `desde` | Ato | Fonte | Situação |
| --- | --- | --- | --- | --- |
| EDEVP, CNEE, EEB, CFLO → ESS (07282377000120) | 2017-06-30 | REA ANEEL nº 6.318/2017, "de 25 de março de 2017": aprova o agrupamento, com incorporação pela Caiuá, e forma a Energisa Sul Sudeste | Nota Técnica nº 150/2021-SGT/ANEEL, § 6, [cópia no RI da Energisa](https://api.mziq.com/mzfilemanager/v2/d/60f49a2d-bd8c-4fd9-95ab-bdf833097a83/1f1a9406-2219-1c70-8239-1b42746c5de4?origin=2). A data de 30/06/2017 vem do [Relatório Anual Energisa 2017](https://mz-filemanager.s3.amazonaws.com/60f49a2d-bd8c-4fd9-95ab-bdf833097a83/relatorios-anuais/9cb421b1892cf4fe509f85138356e1ed84175be536450bdec59e6ec2f2de8819/relatorio_anual_2017.pdf) | **Aprovada.** Conferir a data no DOU: 25/03/2017 caiu num sábado |
| CPFL Leste Paulista, CPFL Mococa, CPFL Sul Paulista → CPFL Santa Cruz (53859112000169, Cia. Jaguari) | 2018-01-01 | REA ANEEL nº 6.723, de 21/11/2017. A incorporação foi feita em 31/12/2017 | [cedoc rea20176723ti.pdf](https://www2.aneel.gov.br/cedoc/rea20176723ti.pdf) e [demonstrações da Cia. Jaguari (RI CPFL)](https://ri.cpfl.com.br/Download.aspx?Arquivo=ppJOuVjC1xAIdBWbJYeeZA%3D%3D) | **Aprovada** |
| ENF → EMR (19527639000158, ex-Energisa Minas Gerais) | 2023-06-22 | REA ANEEL nº 12.177, de 13/09/2022 (DOU de 21/09/2022, processo 48500.005211/2021-67): agrupa as áreas e aprova a incorporação da ENF pela EMG | [DOU de 21/09/2022 (cópia abrapch)](https://abrapch.org.br/2022/09/diario-oficial-da-uniao-21-09-2022/). Nova Friburgo está na área da EMR: [A Voz da Serra, reajuste de 22/06/2025](https://avozdaserra.com.br/noticias/contas-de-luz-em-friburgo-sobem-361-em-media-no-domingo) | **Aprovada, com a condição V7** (abaixo) |
| EBO → EPB (09095183000140) | 2023-08-28 | REA ANEEL nº 12.687, de 13/09/2022 (DOU de 21/09/2022, processo 48500.005212/2021-10): agrupa as áreas e aprova a incorporação da EBO pela EPB. As tarifas da EBO foram prorrogadas até 27/08/2023 | DOU (mesma cópia) e [CanalEnergia, 24/01/2023](https://www.canalenergia.com.br/noticias/53236466/tarifas-da-energisa-borborema-serao-prorrogadas-ate-agosto) | **Aprovada, com a condição V7** |
| CERR → Roraima Energia, hoje "Âmbar Roraima" (02341470000144, ex-Boa Vista Energia) | 2017-01-01 | **Não achei ato da ANEEL com número.** Há um despacho do MME (DOU de 12/08/2016, número não localizado): a Boa Vista Energia assume todo o interior. A Roraima Energia tem o Contrato de Concessão nº 04/2018-ANEEL | [MME: prazo de transição CERR → Boa Vista Energia](https://www.gov.br/mme/pt-br/assuntos/noticias/mme-define-prazo-de-transicao-de-prestacao-de-servico-da-cerr-para-a-boa-vista-energia) e [voto ANEEL de 09/12/2025 (cópia Poder360)](https://static.poder360.com.br/2025/12/roraima-sin-aneel.pdf) | **Aprovada com o ato do MME**: `ato` = "Despacho MME, DOU 12/08/2016". O número entra quando alguém abrir o DOU. Roraima tem uma só distribuidora, a do contrato 04/2018. Se o leitor exigir número, a CERR fica de fora: as 14 cidades mostram "Não achamos a sua distribuidora. Use o valor da sua conta de luz" |
| RGE SUL ↔ RGE (mesmo CNPJ) | 2019-01-01 | Agrupamento aprovado pela ANEEL em 04/12/2018. A RGE Sul incorporou a RGE e passou a se chamar RGE. Número da REA não localizado | [Formulário de referência CPFL Energia, item 1.1](https://ri.cpfl.com.br/Download.aspx?Arquivo=AiJIS2TJi1r3E7fuxnXsSQ%3D%3D&linguagem=pt) | Só para a fonte. O D1 já resolve; não entra no `sucessoes.json` |

**Condições e regras:**

- **V7 (nova, bloqueia ENF e EBO):** depois de um agrupamento, a ANEEL pode manter um preço diferente para cada área
  por um tempo. Em 2023, a EMR teve uma tabela "ENF" separada, com −2,20% no B1 contra +5,47% na EMG
  ([ANEEL, 20/06/2023](https://www.gov.br/aneel/pt-br/assuntos/noticias/2023/aneel-aprova-reajuste-nas-tarifas-da-energisa-minas-rio)).
  Hoje o `selecionarTarifasVigentes` fica com um valor qualquer quando há mais de um. No passo 0, conferir que cada
  sucessora tem **um só** valor B1 residencial convencional na vigência atual. Se tiver mais de um, a rotina para.
  Nesse caso, a cidade da área antiga não recebe tarifa até separarmos as áreas.
- **Lista depois da troca:**
  - tirar repetidos (Campina Grande: EPB + EBO viram EPB uma vez só);
  - conferir a ordem em Guarapuava e Nova Friburgo. A cidade de Guarapuava era da CFLO (hoje ESS), mas a Copel
    aparece primeiro. Nova Friburgo era da ENF (hoje EMR), mas a Enel RJ aparece primeiro.
  - Isso é um risco; não é veto.
- **D4 (limite de idade):**
  - **aviso** no relatório desde o 1º dia vencida, porque uma tarifa em vigor sempre tem `fimVigencia ≥ hoje`;
  - **descarte** depois de 6 meses, não 12. Um reajuste perdido erra a conta em 5% a 19% (ESS, 2025). Descartar por
    engano leva a "use a sua conta", que é honesto; manter por engano mostra um número errado.
  - V1 com o mesmo corte de 6 meses.
- **Média da `/`:** fica simples (não bloqueia). Ponderar por unidades consumidoras residenciais só com a fonte da
  ANEEL, numa história própria. Até lá, o texto chama o valor de "média das distribuidoras" e diz que é estimativa.

## Fluxo e textos

_(ux-acessibilidade)_ Só o texto do D7, se houver aviso.

## Desenho técnico

_(tech-lead)_ Confirmar D7 (campo `substituidas` no contrato do `ArquivoTarifas` e quem faz a troca: o leitor da
`Residencia` ou `aplicacao/`) e a ordem em relação à HIS-003a.

## Ameaças

_(seguranca)_

| Ameaça | Gravidade | Mitigação |
| --- | --- | --- |
| A tabela de sucessões é editada à mão e alguém troca a empresa de uma cidade sem ato oficial | média | Linha sem `ato` ou sem `fonte` é recusada (critério 7); a revisão do dominio-energia é obrigatória no PR; o diff dos municípios é anexado (critério 10) |
| `substituidas` aponta para um id que não existe e a casa salva fica sem preço | média | V4 e um teste que todo valor de `substituidas` existe em `distribuidoras` |

## Plano de testes

_(qa)_ Critérios 1 a 11, com as fixtures novas e o `arquivos-publicos.test.ts` da HIS-003a.

## Perguntas abertas

- [x] `[para: dominio-energia]` _(respondida em 30/10: ver "Regras de negócio e fontes"; CERR sem número de ato da ANEEL)_ Confirmar no cadastro de agentes ou nas resoluções autorizativas da ANEEL, com o
  número do ato, a data e o link de cada sucessão:
  - (a) EDEVP, CNEE, EEB e CFLO incorporadas pela Caiuá Distribuição, que virou ESS, CNPJ 07282377000120, em 2017.
  - (b) CPFL Leste Paulista, CPFL Mococa e CPFL Sul Paulista incorporadas pela CPFL Jaguari, que virou CPFL Santa Cruz,
    CNPJ 53859112000169, em 2018.
  - (c) ENF → EMR (19527639000158) em 2023. Em Nova Friburgo, hoje aparecem só Enel RJ e ENF: a EMR atende a cidade?
  - (d) EBO → EPB (09095183000140) em 2023.
  - (e) CERR → Âmbar Roraima (02341470000144, a antiga Boa Vista Energia / Roraima Energia): a mesma empresa atende
    hoje o interior de Roraima, os 14 municípios fora de Boa Vista?
  - (f) A RGE Sul incorporou a RGE e passou a se chamar RGE em 2019, com o CNPJ 02016440000162. Isso é só para a
    fonte, porque o D1 já resolve.
- [x] `[para: dominio-energia]` _(6 meses para descartar; aviso desde o 1º dia)_ O limite do D4 fica em 12 meses para descartar e 31 dias para avisar? Ou fica mais
  curto (6 meses), já que um reajuste perdido erra a conta em 5% a 15%?
- [x] `[para: dominio-energia]` _(simples por enquanto, chamada de estimativa)_ (não bloqueia) A média nacional do simulador da `/` deve ser simples, como hoje, ou
  ponderada (por município ou por consumidores)?
- [ ] `[para: tech-lead]` D7: aprovar `substituidas` no `ArquivoTarifas` e dizer onde a troca mora. E a ordem: a HIS-111
  começa depois do a3 da HIS-003a?
- [ ] `[para: ux-acessibilidade]` Quando a casa salva troca de `rge-sul` para `rge` (ou de EDEVP para Energisa
  Sul-Sudeste), mostramos um aviso, como "Sua distribuidora agora se chama RGE. O preço foi atualizado.", ou a troca
  fica sem aviso?
- [ ] `[para: scrum-master]` Prioridade e sprint. O pedido do dominio-energia é prioridade alta. Fazer um corte só ou
  dois (ver "Corte possível")? E lembrar que a rede do ambiente de nuvem não alcança a ANEEL: o passo 0 precisa da
  Action ou de uma máquina com acesso.

## Conversa da equipe

### [backend] 2026-10-30 — P-de-1 investigada: 227 municípios, três causas, proposta D1–D7
- **O que fiz:**
  - Medi o problema nos arquivos de 29/10 (tabela de evidência).
  - Li `tarifas.ts`, `municipios.ts`, `montar.ts` e `atualizar.ts`.
  - Reproduzi a C1 com o `montarArquivos` real, num script no meu scratchpad.
  - Escrevi e testei, com as fixtures, o diagnóstico de conjuntos extintos (C2).
  - Medi o efeito na média da `/`.
- **Decisões e porquê:**
  - Mesmo CNPJ é tratado como renomeação automática (D1), porque é a mesma pessoa jurídica.
  - Empresa incorporada só troca com um ato oficial na tabela (D2). A coincidência de datas não basta: muitas
    distribuidoras fazem o reajuste no mesmo dia.
  - A barreira (V1 a V6) faz a rotina parar, em vez de publicar errado.
- **Não confirmado:** a C2 é provável, mas precisa do passo 0 com os CSVs. A rede daqui é bloqueada para a ANEEL
  (403 do proxy), então não insisti.
- **Arquivos:** este arquivo (novo). Nenhum código de produção foi alterado.
- **Como verifiquei:**
  - contagens feitas com scripts de leitura sobre `apps/web/public/dados` e conferidas contra a nota do dominio-energia;
  - reprodução da C1: os três casos dão `rge-sul`;
  - diagnóstico rodado nas fixtures, com e sem um caso vencido inventado.
- **Para o próximo:**
  - **dominio-energia:** as perguntas (a) a (f) e o limite do D4. São elas que bloqueiam.
  - **tech-lead:** D7 e a ordem com a HIS-003a.
  - **ux:** o texto do D7.
  - **scrum-master:** a sprint.

### [dominio-energia] 2026-10-30 — sucessões confirmadas, uma sem número de ato
- **O que fiz:** busquei os atos da ANEEL e do DOU para as 11 empresas e preenchi "Regras de negócio e fontes".
  O cedoc da ANEEL não abre daqui; usei cópias do documento oficial e marquei quais são.
- **Resultado:**
  - ESS: aprovada (REA 6.318/2017).
  - CPFL Santa Cruz: aprovada (REA 6.723/2017).
  - EMR e EPB: aprovadas (REA 12.177/2022 e REA 12.687/2022), com a condição V7.
  - CERR → Roraima Energia: aprovada com o despacho do MME de 12/08/2016, sem número de ato da ANEEL.
  - RGE: só a fonte, porque o D1 resolve.
- **Decisões:**
  - D4 descarta a tarifa depois de 6 meses vencida, não 12, e avisa desde o 1º dia.
  - V7 nova: a sucessora com mais de um valor B1 na mesma vigência faz a rotina parar.
  - A média da `/` fica simples e é chamada de estimativa.
- **Riscos:**
  - O preço pode ser diferente em cada área depois do agrupamento (ENF em 2023).
  - A ordem da lista em Guarapuava e Nova Friburgo.
  - A data da REA 6.318 cai num sábado: conferir no DOU.
- **Próximo:** backend, com o passo 0 e o V7. Depois o qa, que confere os critérios 1 e 2 com a tabela.

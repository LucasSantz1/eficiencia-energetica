# HIS-111 · Tarifas vencidas: cada cidade com a distribuidora de hoje

| Campo | Valor |
| --- | --- |
| Épico | E2 · Precisão da conta (confirmado pelo scrum-master) |
| Sprint | **Sprint 0, prioridade 1** (scrum-master, 2026-10-30): defeito com número errado no ar, não função nova |
| Tamanho | M (≈ 3 dias: 2,25 backend, 0,25 frontend, 0,5 qa; T4) |
| Papéis principais | backend, dominio-energia, qa; tech-lead (contrato do `tarifas.json`) e ux (um texto) |
| Status | Em andamento: h0–h5 feitos pelo backend em 30/10; falta o resultado do passo 0 (push da branch), o h6 (frontend), o h7 (qa) e o h8 |
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
  _(scrum-master, 30/10: **um corte só**. Se o V7 reprovar ENF ou EBO, só essas linhas ficam fora.)_

**Arquivos tocados:**
- `packages/dados/src/aneel/tarifas.ts`, `aneel/municipios.ts`, `montar.ts`, `atualizar.ts` (relatório);
- `packages/dados/base/sucessoes.json` e o leitor dele;
- `packages/dados/fixtures/` e `test/dados.test.ts`;
- `packages/core` (tipo `ArquivoTarifas`, D7);
- o leitor da `Residencia` da HIS-003a.

Quem regrava `apps/web/public/dados/` é a própria rotina; ninguém edita esses arquivos à mão.

**Conflito com a HIS-003a:** o a3 mexe em `tarifas.ts` e no `validar`. ~~Para não haver conflito, a HIS-111 começa
depois de o a3 entrar no `main`.~~ _(tech-lead, 30/10: a HIS-111 vem antes; ver "Desenho técnico", T7.)_

## Critérios de aceite

1. **Dado** o arquivo novo, **quando** procuro Alegrete (4300406), Assis (3504008), Bragança Paulista (3507605), Mococa
   (3530508), Itapetininga (3522307) e Caracaraí (1400209), **então** a primeira distribuidora de cada uma é,
   respectivamente, `rge`, `ess`, `ess`, `cpfl-santa-cruz`, `cpfl-santa-cruz` e `ambar-roraima`. _(Sucessões
   confirmadas pelo dominio-energia em 30/10; nenhuma das seis depende do V7.)_
2. **Dado** o arquivo novo, **quando** confiro os 227 municípios da tabela de evidência, **então** nenhum deles tem
   `rge-sul`, `edevp`, `cnee`, `eeb`, `cflo`, `cpfl-leste-pauli`, `cpfl-mococa`, `cpfl-sul-paulist`, `enf`, `ebo` ou
   `cerr`, e todos têm ao menos uma distribuidora.
3. **Dado** o `tarifas.json` montado pela branch, **quando** o diagnóstico roda `conferirCoerencia` sobre a montagem
   real (PR), e depois o teste dos arquivos publicados roda no `main` (ligado no h8), **então** nenhuma distribuidora
   tem `fimVigencia` anterior a `geradoEm − 6 meses` (V1), nenhum CNPJ se repete (V2), nenhum município lista uma
   chave de `substituidas` (V3) e `substituidas` cumpre o V8. _(scrum-master, 30/10: T5 do tech-lead, 12 → 6 meses.)_
4. **Dado** uma fixture com RGE (2026) e RGE SUL (2019) com o mesmo CNPJ, e um conjunto com `SigAgente` = "RGE SUL",
   **quando** a montagem roda, **então** o município fica com `rge`, e `substituidas` tem `"rge-sul": "rge"`.
5. **Dado** uma fixture com um conjunto que parou de reportar 3 anos antes do ano máximo e é de uma empresa que está
   no `sucessoes.json`, **quando** a montagem roda, **então** o município fica com a sucessora.
   **Dado** o mesmo conjunto sem linha de sucessão, num município que tem outro vínculo recente, **então** o vínculo
   extinto sai e aparece em `vinculosExtintosDescartados`.
   **Dado** o mesmo conjunto sem linha de sucessão, sendo o único vínculo do município, **então** o vínculo fica e
   aparece em `vinculosExtintosMantidos` (aviso). _(Duas fixtures; regra segura do D3, T2.)_
6. **Dado** uma fixture com uma tarifa vencida há 7 meses e sem sucessora, **quando** `pnpm dados:atualizar` roda sem
   `--forcar`, **então** a tarifa vai para `descartadas` com "vencida desde AAAA-MM-DD", a rotina sai com código 1, a
   mensagem cita o **V5** (agente sem tarifa) e **não grava nada** (a assinatura não muda).
   **Dado** a mesma tarifa vencida há 5 meses, **então** ela é publicada e aparece em `tarifasVencidasEmUso` (aviso).
   _(scrum-master, 30/10: T5, 12 → 6 meses; bordas exatas nos testes do h2.)_
7. **Dado** uma linha do `sucessoes.json` sem `ato` ou sem `fonte`, ou uma cadeia com ciclo, **quando** a rotina
   roda, **então** ela para com um erro que diz qual linha está errada.
8. **Dado** uma casa salva no aparelho com `distribuidoraId: "rge-sul"` e sem conta de luz, e um `tarifas.json` com
   `substituidas: {"rge-sul": "rge"}`, **quando** a pessoa abre `/casa`, **então** o preço do kWh é o da RGE desde a
   primeira tela (`origem: "aneel"`, R$ 0,94461 mais a bandeira), a casa é regravada **uma vez** com `"rge"` e os
   Ajustes marcam a RGE. Prova na HIS-111: teste de unidade de `acharDistribuidora` e `distribuidorasDaCidade` (h5,
   com `"constructor"` e `"__proto__"` sem achar nada) e conferência do qa no Playwright em 390 e 1280 px (h7). O e2e
   automático entra no `casa-salva.spec.ts`, caso (h), da a7 da HIS-003a. _(scrum-master, 30/10: T5.)_
9. **Dado** a execução na Action, **quando** termina, **então** a anotação `::notice` mostra `sucessoesAplicadas`,
   `vinculosExtintosDescartados` e `tarifasDescartadasPorVencimento`, e o qa confere os números com esta história.
10. O diff de `apps/web/public/dados/municipios/*.json` só muda os municípios esperados. O qa anexa a contagem: perto
    de 227, mais o que o D3 tirar de vínculo extinto em cidades que já estavam certas.
11. `pnpm typecheck`, `pnpm test` e `pnpm build` passam. O simulador da `/` passa a usar a média sem as vencidas
    (R$ 0,837, contra 0,801 hoje, com os dados de 29/10).
12. _(scrum-master, 30/10: o V7 e as barreiras do T2 não tinham critério.)_ **Dado** uma fixture em que uma sucessora
    do `sucessoes.json` tem dois valores B1 diferentes na mesma vigência, **quando** `pnpm dados:atualizar --forcar`
    roda, **então** a rotina sai com código 1, a mensagem cita o **V7** e a sigla, e não grava nada. O `--forcar` não
    pula V1–V4, V7 e V8.
13. **Pronto só depois do h8:** os critérios 1 e 2 conferidos pelo qa nos arquivos **publicados** pela rotina no
    `main`, e o teste dos publicados ligado e verde no CI.

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

_(ux-acessibilidade, 2026-10-30. Li `Casca`, `PainelAcompanhamento`, `TelaAjustes`, o passo "distribuidora" do
`Cadastro`, `ui/Aviso`, `ui/Botao` e `nomeDaDistribuidora`.)_

### F1. Aviso do D7: a empresa de luz mudou

**Decisão: avisar, sim.** A conta estimada pode subir até 55% sem a família mexer em nada. Um número que muda sozinho,
sem explicação, parece erro do site. A família já recebe a conta com o nome novo há anos: quem estava atrasado era o
site. O texto diz isso, sem culpar ninguém.

**Quando aparece:** quando `useDistribuidoraAtualizada()` devolve `{ de, para }` **e** a casa não tem conta de luz
informada (`precoKwh(...).origem === "aneel"`). Com a conta de luz, o valor não muda, e a troca fica sem aviso.

**Onde:** na `Casca`, no topo do `<main>`, logo depois do aviso de dados de exemplo. Aparece em qualquer aba de `/casa`
em que a troca acontecer e continua ao trocar de aba, porque a `Casca` fica montada no layout.

**Por quanto tempo:** só na visita em que a troca acontece, até a pessoa tocar em "Entendi". Nada novo fica guardado no
aparelho. Na próxima visita, o id salvo já é o novo, e o aviso não volta. Para isso, o `{ de, para }` fica guardado só
durante a visita e não some quando a regravação muda o `distribuidoraId`.

```
360 px
┌────────────────────────────────────┐
│ (i) O preço da luz foi atualizado  │
│ A CPFL Mococa hoje é a CPFL Santa  │
│ Cruz. A gente ainda usava o preço  │
│ antigo. Agora a conta estimada usa │
│ o preço de hoje da CPFL Santa Cruz,│
│ mais perto da conta que chega na   │
│ sua casa.                          │
│ Usar minha conta de luz            │
│ ┌──────────┐                       │
│ │ Entendi  │                       │
│ └──────────┘                       │
└────────────────────────────────────┘
┌ Sua conta estimada por mês ────────┐
```

**Textos (prontos para copiar):**

| Peça | Texto |
| --- | --- |
| Título (negrito, em `<p><strong>`, não `h2`) | O preço da luz foi atualizado |
| Corpo, com os dois nomes | A {antiga} hoje é a {nova}. A gente ainda usava o preço antigo. Agora a conta estimada usa o preço de hoje da {nova}, mais perto da conta que chega na sua casa. |
| Corpo, sem o nome antigo | A empresa de luz da sua cidade hoje é a {nova}. A gente ainda usava um preço antigo. Agora a conta estimada usa o preço de hoje da {nova}, mais perto da conta que chega na sua casa. |
| Link (vai para `/casa/ajustes#conta`) | Usar minha conta de luz |
| Botão (fecha o aviso) | Entendi |

- `{nova}` = `nomeDistribuidora(distribuidora)`. `{antiga}` = o nome comercial do id antigo, que já saiu do
  `tarifas.json` (pedido ao tech-lead abaixo).
- **Nunca mostrar o id nem a sigla solta** ("edevp", "CERR"). Sem nome comercial conhecido, usar o corpo sem o nome
  antigo.
- Hoje já têm nome: `rge-sul`, `cpfl-mococa`, `cpfl-leste-pauli`, `cpfl-sul-paulist`, `enf` e `ebo`. Faltam `edevp`,
  `cnee`, `eeb`, `cflo` e `cerr` (pedido ao dominio-energia abaixo).
- "A {antiga} hoje é a {nova}" serve para a renomeação (RGE Sul → RGE) e para a incorporação. Não é preciso separar os casos.

**Acessibilidade:**
- `Aviso tom="faisca"` (tinta sobre amarelo claro, bem acima de 7:1), com o ícone `Info` `aria-hidden`. O título em
  texto diz o que é; nada depende só da cor.
- Anúncio: uma região `role="status"` fica sempre na `Casca`, vazia, e o aviso entra dentro dela (regra da HIS-003).
  Para não ter um `status` dentro de outro, o `Aviso` ganha uma opção para não pôr o próprio `role` (mudança pequena em `ui/`).
- O aviso não recebe o foco sozinho. Ordem: título, corpo, link, botão.
- "Entendi" = `Botao variante="secundario"` (48 px). Ao fechar, o foco vai para o `h1` da tela (regra da HIS-003).
- Entra com `surgir`, que o movimento reduzido desliga. Em 360 px e com zoom de 200%, nada corta nem rola para o lado.

### F2. D4: cidade sem o preço de hoje

Vale para a cidade cuja empresa saiu do arquivo sem sucessora (D4) e para as cidades sem nenhuma distribuidora. Nada
de "tarifa vencida", "vigência" ou "ANEEL" na tela.

**(a) Cadastro, passo "distribuidora", quando a cidade não tem nenhuma empresa com preço** (a lista do estado continua
como hoje). O título fica igual. O subtítulo novo substitui "Não sabemos qual empresa atende {cidade}…":

> Não achamos o preço de hoje da empresa de luz de {cidade}. Veja o nome no topo da sua conta de luz e escolha abaixo.
> No fim, coloque o valor da sua conta: assim o cálculo usa o preço que você paga.

**(b) Acompanhamento, cartão de cima, com `preco.origem === "indisponivel"`.** Hoje esse cartão mostra "R$ 0,00" e
"Tarifa da : R$ 0,00 por kWh", e isso está errado. O `h1` "Sua conta estimada por mês" fica. No lugar do valor:

| Peça | Texto |
| --- | --- |
| Frase grande (`text-faisca`, menor que o valor) | Falta o preço da luz |
| Corpo | Não temos o preço de hoje da empresa de luz da sua cidade. Com um preço velho, a conta sairia errada. Coloque o valor e os kWh da sua última conta de luz, e a gente calcula com o preço que você paga. |
| Botão (`BotaoLink`, vai para `/casa/ajustes#conta`) | Usar minha conta de luz |
| Linha do consumo (fica) | A casa gasta cerca de {kWh} por mês. |

Aqui o nome da empresa não aparece: ela pode nem estar mais no arquivo.

**(c) Minha casa, "Onde você mora", sem distribuidora com preço.** Hoje aparece "Distribuidora: " vazio. Texto novo:

> Distribuidora: não temos o preço de hoje. Use a sua conta de luz, mais abaixo.

"mais abaixo" é um link para `#conta`.

Em (b) e (c), o estado já vem pronto ao abrir a tela, então não há anúncio `aria-live`. O botão e o link têm 44 px ou mais.

## Desenho técnico

_(tech-lead, 2026-10-30. Li `montar.ts`, `aneel/tarifas.ts`, `aneel/municipios.ts`, `atualizar.ts`, `escrever.ts`,
`tipos.ts`, `distribuidoras.ts`, `aplicacao/resumo.ts`, o store da casa, `Cadastro`, `TelaAjustes`, os dois workflows e o
D2–D4 da HIS-003a. Decisão que vale além da história: [ADR-005](../decisoes/ADR-005-distribuidora-que-deixa-de-existir.md).)_

### T1. D7 aprovado, com ajustes: `substituidas` no `tarifas.json`

```ts
// packages/core/src/tipos.ts
export interface ArquivoTarifas {
  // … campos de hoje
  /** Id que saiu do arquivo → id que ficou no lugar (empresa renomeada ou incorporada). Sempre o id final.
   *  Ausente = nenhuma troca (arquivo antigo no cache, `dados:exemplo`). */
  substituidas?: Readonly<Record<string, string>>;
}

// packages/core/src/distribuidoras.ts (funções puras, com teste)
export function acharDistribuidora(arquivo: Pick<ArquivoTarifas, "distribuidoras" | "substituidas">, id: string): Distribuidora | undefined;
export function distribuidorasDaCidade(arquivo: Pick<ArquivoTarifas, "distribuidoras" | "substituidas">, ids: readonly string[]): Distribuidora[];
```

- `acharDistribuidora`: procura o id; se não achar e `Object.hasOwn(substituidas, id)`, procura o substituto. **Um salto
  só** (a rotina já grava o id final). `Object.hasOwn` porque o id vem do `localStorage` (`"constructor"` daria a função
  do protótipo).
- `distribuidorasDaCidade`: troca cada id pelo substituto, tira os repetidos (Campina Grande: EPB + EBO → EPB uma vez),
  mantém a ordem da rotina e tira o que não existe.
- **Por que opcional:** até a 003a o site lê o `tarifas.json` sem leitor, e pode receber um arquivo antigo do cache
  (`max-age` 1 h + `stale-while-revalidate` 1 dia). A rotina **sempre** grava o campo, com as chaves em ordem (a assinatura
  fica estável).
- **Invariantes (V8):** chave e valor no formato de id (`^[a-z0-9]+(-[a-z0-9]+)*$`, até 64 caracteres); todo valor é um
  id publicado; nenhuma chave é id publicado; nenhum valor é chave. Na rotina, sem `--forcar` (T2); no navegador, pelo
  leitor da a3 (abaixo).

**Onde a troca mora: não no leitor da `Residencia`.** O `lerCasaSalva` roda no `merge` do `persist`, na hidratação,
antes de o `tarifas.json` chegar, e pelo ADR-004 ele não corrige valor. Ele ficaria preso a um arquivo de rede. A troca
mora em dois lugares:

1. **Na leitura (core):** `useResumo` usa `acharDistribuidora`; `Cadastro` (linhas 66–77 e 115) e `TelaAjustes` (226 e
   256) usam `distribuidorasDaCidade` no lugar do `Map` + `filter` repetido 4 vezes. O preço fica certo **desde a primeira
   tela, mesmo sem regravar**, e mesmo com um `municipios/{UF}.json` antigo no cache que ainda diga `rge-sul`.
2. **Na regravação (`aplicacao/casa.ts`):** `useDistribuidoraAtualizada(): { de: string; para: string } | undefined`,
   chamado na `Casca`. Quando a casa carregou, as tarifas chegaram e `residencia.distribuidoraId` é chave de
   `substituidas`, chama `atualizarResidencia({ distribuidoraId: para })` uma vez. Assim a `TelaAjustes` marca a opção
   certa. O retorno serve ao aviso, se a ux pedir; se não pedir, ninguém usa e ele não é exportado para tela.

**Formato salvo não muda:** `distribuidoraId: string`, `version: 2`, sem `migrate`. Só o valor muda, por uma ação
normal (que passa pelos leitores da 003a quando eles existirem). Os e2e `casa-v1`/`casa-v2` da 002a continuam iguais.

**Impacto no `lerArquivoTarifas` (a3 da HIS-003a), contrato para quem implementar o a3:**
- `substituidas` ausente → `{}`, sem descarte. Presente e não objeto simples → `ErroDeFormato`.
- Entrada que quebra o V8 sai e conta em `descartados` (na rotina, isso para a gravação, como todo descarte).
- Casos novos no `arquivos-publicos.test.ts` (P8): ausente; `{"rge-sul": "rge"}` fica; valor que não existe sai; chave
  que é id publicado sai; chave `"__proto__"` sai e o protótipo continua o normal; cadeia `a → b` + `b → c` sai.
- _(backend, 30/10, R7 da seguranca: contrato para quem implementar o a3)_ O leitor monta o resultado com
  `Object.fromEntries` **depois** de validar cada chave, e as regras do V8 olham o objeto original inteiro (não o que
  sobrou depois de cada descarte). Mais de **500** entradas = `ErroDeFormato` (a rotina usa o mesmo limite,
  `MAXIMO_DE_SUBSTITUIDAS` em `packages/dados/src/montar.ts`, e nunca publica mais que isso). Falta só o caso de 501
  entradas no P8. O formato do id é o mesmo da rotina e do core: `^[a-z0-9]+(-[a-z0-9]+)*$`, até 64 caracteres.

### T2. Ajustes ao D1–D6 (decisões técnicas)

- **D1 só junta siglas do mesmo CNPJ quando a mais antiga não está vigente.** Duas siglas vigentes com o mesmo CNPJ
  querem dizer que a ANEEL tarifa áreas diferentes (o caso do V7). Aí o V2 para a rotina: não adivinhamos qual cidade
  fica com qual preço.
- **D2, `sucessoes.json`:** `packages/dados/base/sucessoes.json` = `{ "sucessoes": [ … ] }`. Leitor à mão em
  `packages/dados/src/sucessoes.ts`: `lerSucessoes(bruto: unknown): Sucessao[]`, que **lança** com o índice e a
  `siglaAntiga` da linha. Regras:
  - CNPJs com 14 dígitos e diferentes entre si; siglas com 1 a 40 caracteres;
  - `desde` e `consultadoEm` são datas que existem (UTC); linha com `desde` no futuro não é aplicada;
  - `ato` é texto não vazio. **Não exige número**: a CERR entra com `"Despacho MME, DOU 12/08/2016"`, como o
    dominio-energia aprovou. `fonte` começa com `https://`;
  - `cnpjAntigo` repetido, ciclo ou mais de 5 saltos = erro.
- **Ordem no `acharTarifa`:** (1) segue a cadeia de sucessão pelo CNPJ do vínculo (pela sigla compacta só quando o
  vínculo não tem CNPJ); (2) procura a tarifa pelo CNPJ final no índice do D1; (3) só então pela sigla. Toda sigla
  trocada em (1) ou pelo D1 entra em `substituidas`.
- **D3 com a regra segura:** o vínculo extinto (`ano < anoMaisRecente − 1`) **sai só se a cidade tiver outro vínculo
  não extinto**. Se for o único, fica e entra em `vinculosExtintosMantidos` (aviso). Motivo: o D2 + D4 + V5 já pegam a
  empresa que acabou (a tarifa dela vence, sai, e a rotina para). O D3 sozinho tiraria o único preço de uma cidade em que
  o IndQual não liga o conjunto novo, e esse preço é de uma empresa com tarifa vigente. O passo 0 diz quantos casos são.
- **D4 com 6 meses** (dominio-energia). `subtrairMeses(dataISO, meses)` em `util.ts`, presa ao fim do mês (31/08 menos
  6 meses = 28/02 ou 29/02). `fimVigencia < hoje − 6 meses` → `descartadas` com "vencida desde AAAA-MM-DD";
  `fimVigencia < hoje` e não descartada → `tarifasVencidasEmUso` (aviso desde o 1º dia). Sai o "perto de vencer": toda
  tarifa vence em menos de um ano, seria ruído.
- **V7:** `selecionarTarifasVigentes` passa a contar os valores (TE, TUSD) diferentes da vigência escolhida (mesmo
  `inicioVigencia`, depois do filtro de `DscDetalhe`). O relatório lista todas as distribuidoras com mais de um valor; a
  barreira vale só para as sucessoras do `sucessoes.json`.
- **D5 em duas barreiras:**
  - `conferirCoerencia(montagem, sucessoes, hoje): string[]` (nova, em `montar.ts`) **não passa com `--forcar`**, como
    o `conferirFormato` do ADR-004: V1, V2, V3, V4, V7 e V8. Quebrar qualquer uma é número errado ou contrato quebrado.
  - `validar` (o de hoje, que aceita `--forcar`) ganha V5 e V6. São cobertura: uma pessoa pode decidir publicar sabendo
    que algumas cidades vão pedir a conta de luz.
- **D6:** os campos do backend, com `tarifasVencidasEmUso`, `vinculosExtintosMantidos` e `tarifasComMaisDeUmValor`. O
  `atualizar.ts` imprime as linhas `::notice::` e `::warning::` direto no log, o que funciona em qualquer passo e **não
  mexe no `atualizar-dados.yml`** (a a6 da 003a reescreve esse arquivo). O `relatorio.json` só ganha chaves; o
  `lerRelatorioDosDados` da a3 lê só duas e ignora o resto. O `exemplo.ts` grava `substituidas: {}`.

### T3. Passo 0 na Action: diagnóstico sem escrita

- `packages/dados/src/fontes.ts`: sai do `atualizar.ts` a parte que baixa e lê os 4 CSVs
  (`lerFontes({ cache, hoje, baixar })`). O diagnóstico e a rotina usam o mesmo código.
- `packages/dados/src/diagnosticar.ts` (`pnpm dados:diagnosticar`, script novo na raiz e no pacote):
  - o script do scratchpad do backend (conjuntos de cada vencida, último `AnoIndice` × ano máximo, cidades com conjunto
    recente de outra empresa);
  - CNPJs com mais de uma sigla, com a vigência de cada; valores B1 diferentes na vigência de cada distribuidora (V7);
  - a montagem com o código da branch e o resultado de `conferirCoerencia` e `validar`, **sem sair com erro**;
  - a comparação com `apps/web/public/dados/municipios/*.json`: quantas cidades mudam por UF e a lista, em ordem, das 6
    do critério 1 e de Guarapuava, Nova Friburgo e Campina Grande.
  - **Não chama `escreverArquivos`.** Sai com 1 só se não conseguir baixar ou ler. Escreve um resumo curto em Markdown
    no `$GITHUB_STEP_SUMMARY`, quando a variável existir.
- `.github/workflows/diagnosticar-dados.yml`:

```yaml
name: Diagnosticar dados (sem gravar)
on:
  workflow_dispatch: {}
  push:                      # só durante a HIS-111: sai no passo h8
    branches: [his-111-tarifas-vencidas]
    paths: ["packages/dados/**", ".github/workflows/diagnosticar-dados.yml"]
permissions: {}
concurrency: { group: diagnosticar-dados, cancel-in-progress: true }
jobs:
  diagnosticar:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions: { contents: read }
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with: { persist-credentials: false }
      - uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm dados:diagnosticar
      - name: Nada mudou no repositório
        run: test -z "$(git status --porcelain --untracked-files=all)"
```

- **Por que `push` na branch:** o `workflow_dispatch` só aparece quando o arquivo já está no `main`. O gatilho de `push`
  roda o passo 0 no primeiro push da branch, sem um PR antes, e roda de novo a cada push (é daí que sai o critério 10).
  Não há segredo, não há escrita, o token é só de leitura e o `.cache` está no `.gitignore`.
- **Quem lê:** nesta sessão o `gh api` não está liberado. Quem disparar (orquestra ou dono) cola o resumo do job aqui,
  numa seção "Resultado do passo 0".
- **Portão do passo 0** (o backend confere antes do h3):
  - (a) último `AnoIndice` dos conjuntos das vencidas abaixo de `ano máximo − 1` → C2 confirmada;
  - (b) EMR e EPB com um só valor na vigência → as linhas ENF e EBO entram. Com mais de um, a linha fica fora e volta ao
    dominio-energia (V7);
  - (c) só RGE/RGE SUL e CPFL JAGUARI/CPFL Santa Cruz com CNPJ repetido;
  - (d) quantos vínculos extintos são os únicos da cidade (regra segura do D3).

### T4. Passos, quem faz e estimativa

| Passo | Quem | O quê | Est. |
| --- | --- | --- | --- |
| h0 | backend | `fontes.ts`, `diagnosticar.ts` + teste com fixtures (caso EDEVP inventado), workflow do T3. **Primeiro push = passo 0** | 0,5 d |
| h1 | backend | `sucessoes.json` (linhas do dominio-energia) + `sucessoes.ts` + testes (critério 7) | 0,25 d |
| h2 | backend | D4 e V7 em `tarifas.ts`, `subtrairMeses` + testes de borda (`fim` = limite fica; limite − 1 dia sai; 31/08; ano bissexto) | 0,25 d |
| h3 | backend | D1, D2 e D3 em `montar.ts`/`municipios.ts`, `substituidas`, sem repetidos + testes (critérios 4 e 5), **depois do portão** | 0,5 d |
| h4 | backend | `conferirCoerencia`, V5/V6 no `validar`, D6 no relatório e no log, `exemplo.ts` + testes (critério 6) | 0,25 d |
| h5 | backend | core: `substituidas?`, `acharDistribuidora`, `distribuidorasDaCidade` + testes (critério 8 na unidade) | 0,25 d |
| h6 | frontend | `useResumo`, `Cadastro`, `TelaAjustes`, `useDistribuidoraAtualizada` na `Casca`, aviso se a ux pedir | 0,25 d |
| h7 | qa | critérios 1, 2, 9 e 10 pelo resumo do diagnóstico da branch; critério 8 no Playwright (390 e 1280 px), numa cópia própria, com `tarifas.json` de teste que tenha `substituidas` e `localStorage` com `rge-sul` | 0,5 d |
| h8 | quem orquestra + backend | depois do merge: rodar `atualizar-dados.yml` à mão; qa confere as 6 cidades nos arquivos publicados; tirar o gatilho `push` do T3; ligar o teste dos publicados (V1, V2, V3, V8) | 0,25 d |

Total: cerca de 3 dias (2,25 de backend). Fixtures novas em `packages/dados/fixtures/sucessao/`, para não mudar os
números dos testes de hoje: RGE (2026) e RGE SUL (2019) com o mesmo CNPJ; EDEVP vencida e ESS vigente; um conjunto que
parou de reportar 3 anos antes; uma sucessora com dois valores na vigência.

**Por que o teste dos publicados só entra no h8:** com os arquivos de hoje ele reprova (RGE SUL de 2019). Se entrar no
PR, o CI do `main` fica vermelho até a rotina rodar. No PR, o critério 3 é provado pela mesma `conferirCoerencia`,
rodada sobre a montagem real no diagnóstico da branch.

**Ordem de entrada no ar:** primeiro o código (o site aceita os dois formatos, porque `substituidas` é opcional e
`acharDistribuidora` funciona sem ele); depois a rotina grava os arquivos novos. Nunca o contrário.

### T5. Ajustes nos critérios (para o scrum-master)

- Critérios 3 e 6: "12 meses" passa a "6 meses" (dominio-energia). No 6, com a tarifa vencida há 7 meses e sem
  sucessora, quem acusa é o **V5** (o D4 já a tirou do arquivo, e a cidade fica com um agente sem tarifa).
- Critério 5, 2ª parte: com a regra segura do D3, o vínculo extinto sem sucessão **sai** quando a cidade tem outro
  vínculo recente (`vinculosExtintosDescartados`) e **fica com aviso** quando é o único (`vinculosExtintosMantidos`).
  Duas fixtures.
- Critério 8: o e2e automático entra no `casa-salva.spec.ts` da a7 da HIS-003a (a infraestrutura de e2e é da 002a). Na
  HIS-111 ficam o teste de unidade (h5) e a conferência do qa no Playwright (h7).
- Critério 3: o teste dos arquivos publicados entra no h8.

### T6. Riscos

1. **A rotina para todo dia** (V4, V5 ou V7 depois de uma sucessão nova). Os dados do dia anterior ficam no ar (já
   certos depois da HIS-111), e a Action vermelha avisa o dono. É de propósito: parar é melhor que publicar errado.
2. **D3 tirar o preço certo de uma cidade:** a regra segura e o V6 seguram.
3. **Cache do navegador com arquivo antigo:** `distribuidorasDaCidade` e `acharDistribuidora` cobrem os dois lados.
4. **Ordem da lista em Guarapuava e Nova Friburgo:** sai no diagnóstico, e o qa confere no h7.
5. **Conflito com a HIS-003a:** ver T7.

### T7. Ordem em relação à HIS-003a

**A HIS-111 vem antes do a3, e não depois.** Número errado está no ar hoje, e a 003a só começa quando a 002a entrar no
`main`, com o a1 e o a2 antes do a3. Esperar custa vários dias com 227 cidades erradas. O conflito é pequeno e de texto:

| Arquivo | HIS-111 | HIS-003a | Custo para quem chega depois |
| --- | --- | --- | --- |
| `aneel/tarifas.ts` | D4 e V7 em `selecionarTarifasVigentes` | a3: troca uma linha (`total <= 0.05 …` → `LIMITES`) | 1 linha |
| `atualizar.ts` | chama `conferirCoerencia`, imprime `::notice::` | a3: chama `conferirFormato` | 2 a 3 linhas vizinhas |
| `core/tipos.ts` | `substituidas?` no `ArquivoTarifas` | a2: `DadosCasa` entra no mesmo arquivo | lugares diferentes |
| `aplicacao/resumo.ts` | a linha do `.find` | a4: `erro` → `falhasSeguidas` | 2 linhas |
| `lerArquivoTarifas` | — | a3 lê `substituidas` (contrato do T1) | já previsto, sem retrabalho |

Cerca de 30 minutos de rebase para a 003a. A HIS-111 não depende da 002a: não muda dependência nem `ci.yml`, e o e2e do
critério 8 vai para a a7. Pode ser implementada já, em paralelo com o fim da 002a, numa branch própria que sai do `main`
(levando os commits desta história). Ela não pisa nos arquivos que a 002a está mexendo agora (`PainelAcompanhamento` e
`TelaComodos`).

## Ameaças

_(seguranca, 2026-10-30. Li o T1–T7, o ADR-005, `atualizar-dados.yml`, `ci.yml`, `.gitignore`, `pnpm-workspace.yaml`
e os `console.log` do `atualizar.ts`. Ativo principal: **o número certo na tela**; não há dado pessoal nem segredo
nesta história. Quem pode errar ou atacar: uma linha errada no `sucessoes.json` (digitação, CNPJ trocado), texto
estranho vindo da ANEEL, um `tarifas.json` antigo ou malformado no cache do navegador.)_

| R | Ameaça | Grav. | Mitigação (onde) |
| --- | --- | --- | --- |
| R1 | Workflow do T3 escrever, vazar token ou rodar código de fora | baixo | **Aprovado como está:** `permissions: {}` + `contents: read`, `persist-credentials: false`, sem segredo, sem `${{ github.event.* }}` em `run:`, SHA = HIS-002/HIS-003, `push` só na branch (só quem tem escrita dispara; push de fork não roda aqui), nada de `pull_request_target`/`workflow_run`, scripts de instalação só `esbuild`/`sharp`. Ajuste (h0): `paths` inclui também `packages/core/**` e `pnpm-lock.yaml`. Sem isso, o h5 muda a montagem e o critério 10 fica com diagnóstico velho. O "Nada mudou" não vê o que o `.gitignore` esconde (`.cache`, `*.log`, `dist/`); isso é aceito, porque o token só lê e nada sai do job |
| R2 | Texto da ANEEL (sigla, nome, `DscDetalhe`) com `\n` ou `%` vira comando do runner (`::add-mask::`, `::stop-commands::`) ou quebra o resumo | baixo | (h0/h4) Uma função só para tudo que vai para `::notice::`/`::warning::`: `%`→`%25`, `\r`→`%0D`, `\n`→`%0A`, como o passo "Publicar resumo" já faz. No `$GITHUB_STEP_SUMMARY`: tirar `\|`, `<` e a crase, cortar cada campo em 80 caracteres e o resumo em 64 KiB. Teste com a sigla `"X\n::add-mask::a"` |
| R3 | **Troca errada de distribuidora** (número errado sem a rotina parar): uma linha com CNPJ digitado errado, ou que aponta para uma empresa **ainda vigente**, muda cidades de dona. As regras V1–V7 passam, porque a sucessora existe e está vigente | **médio** | (h1/h3, em `conferirCoerencia`, sem `--forcar`) **V9:** a linha só vale se a `cnpjAntigo` não tem tarifa vigente no CSV da ANEEL; se tiver, a rotina para e diz o índice e a `siglaAntiga`. **V10:** a `siglaAntiga` e a `siglaSucessora` batem (forma compacta) com a sigla que a ANEEL usa para aquele CNPJ, nas tarifas ou nos conjuntos. Isso pega dígito trocado. Aviso no relatório, sem parar: `desde` a mais de 12 meses do `fimVigencia` da antiga. Hoje as 10 linhas passam (a maior diferença é de 79 dias, nas CPFL). Uma fixture para cada caso em `fixtures/sucessao/` |
| R4 | Quem muda o `sucessoes.json` | baixo | Só por PR, com revisão do dominio-energia e com o resumo do diagnóstico (cidades que mudam por UF) anexado. A rotina diária **nunca** escreve em `packages/dados/base/`: hoje ela faz `git add apps/web/public/dados`, e a a6 da 003a mantém isso. `ato` e `fonte` são só registro: a rotina não abre a `fonte` (nenhum pedido além de ANEEL e IBGE), e nenhum dos dois vai para `/dados`. No h8, o gatilho `push` vira `pull_request` com `paths: [packages/dados/**]` (não `pull_request_target`; o token só lê). Assim, toda sucessão nova mostra o diff sozinha |
| R5 | Antes da a3 o site lê o `tarifas.json` sem leitor, então o V8 do navegador ainda não existe. `substituidas` com `null`, lista ou valor que não é texto faz o `Object.hasOwn` lançar no render, e sem `app/error.tsx` isso dá tela branca | baixo | (h5) `acharDistribuidora` e `distribuidorasDaCidade` funcionam sozinhas, sem depender de leitor: se `substituidas` não é objeto simples, ela é ignorada; o valor só vale se for texto e id publicado no mesmo arquivo; as funções nunca lançam. Teste com ausente, `null`, `[]`, `1` e `{"a": 2}` |
| R6 | A regravação (`useDistribuidoraAtualizada`) entra em laço com `a → a` ou `a → b` + `b → a` (arquivo sem o V8, antes da a3) | baixo | (h6) Só regrava quando `de` **não** é id publicado **e** `para` **é**, uma vez para cada par `de`/`para`. Tudo fica no aparelho: nenhum pedido novo e nada vai ao servidor. O id da distribuidora não é dado pessoal. Mostrar ou não o aviso é decisão da ux; não bloqueia |
| R7 | V8 no leitor da a3: protótipo e resultado que depende da ordem | baixo | (a3) Montar o resultado com `Object.fromEntries` **depois** de validar cada chave. As regras olham o objeto original inteiro, não o que sobrou depois de cada descarte. Mais de 500 entradas = `ErroDeFormato`. `"__proto__"` cai no formato do id; `"constructor"` é id válido, e o `Object.hasOwn` protege. Os casos do T1 bastam; falta só o de 501 entradas |
| R8 | Número errado no ar no h8 | médio residual, aceito | V1–V4 e V7–V10 sem `--forcar` (critério 12 ganha o V9 e o V10). O h8 roda o `atualizar-dados.yml` **sem** `--forcar`. O qa confere as 6 cidades e mais Guarapuava, Nova Friburgo e Campina Grande nos arquivos publicados. Na tela, o nome da distribuidora aparece e pode ser trocado em Ajustes, e a conta de luz informada sempre vence |
| R9 | O h8 roda o `atualizar-dados.yml` de hoje: token de escrita durante o `pnpm install` e actions por etiqueta | médio, já existia | Já está na a6 da HIS-003. A HIS-111 não piora isso, porque é o mesmo job do cron diário. Não bloqueia; se a a6 entrar antes do h8, melhor |

## Plano de testes

_(qa)_ Critérios 1 a 11, com as fixtures novas e o `arquivos-publicos.test.ts` da HIS-003a.

## Resultado do passo 0

_(quem orquestra cola aqui o resumo do job "Diagnosticar dados (sem gravar)", que roda no push da branch.)_

**O que conferir no resumo do job** (página da execução, `$GITHUB_STEP_SUMMARY`; o mesmo texto está no log do passo
"Diagnosticar"):

1. O job termina verde, e o passo "Nada mudou no repositório" passa (nada foi gravado).
2. **Portão (a):** a linha diz "**C2 confirmada.**". Se disser "não confirmada para essas", a lista mostra quais
   empresas reportaram em `ano máximo − 1` ou depois: o backend revê o D3 para elas.
3. **Portão (b):** "todas com um só valor B1 na vigência". Se EMR ou EPB aparecerem "com problema", as linhas ENF ou
   EBO saem do `sucessoes.json` (sem isso o V7 para a rotina). Se aparecer "sem tarifa", a sigla da sucessora no
   `sucessoes.json` não é a da ANEEL: o V10 também acusa.
4. **Portão (c):** só `02016440000162 (RGE, RGE SUL)` e `53859112000169 (CPFL JAGUARI, CPFL Santa Cruz)`. Outro par,
   com as duas siglas vigentes, faz o V2 parar a rotina.
5. **Portão (d):** quantas cidades ficam com um vínculo extinto por ser o único (aviso, não para).
6. **Coerência (critério 3):** "ok". Qualquer V1–V4, V7–V10 aqui para a rotina do h8, mesmo com `--forcar`.
7. **Validação:** o esperado é "ok". Se aparecer V5 (agente sem tarifa) ou V6 (mais de 30 cidades sem distribuidora),
   há uma sucessão que ainda não está na tabela: anotar a sigla para o dominio-energia.
8. **Comparação (critérios 1, 2 e 10):** na tabela das cidades, "Confere" = "sim" nas 6 primeiras; "ainda com uma"
   = **0** e "ficam sem distribuidora" = **0**; "mudam" perto de 227 (mais o que o D3 tirar), com RS, SP, RR, MG,
   PB, PR e RJ. Guarapuava, Nova Friburgo e Campina Grande: anotar a ordem para o qa (h7).
9. Sucessões aplicadas (D2) com as 10 linhas, e renomeações (D1) com `rge-sul → rge` e `cpfl-jaguari →
   cpfl-santa-cruz`.

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
- [x] `[para: tech-lead]` _(respondida em 30/10: ver "Desenho técnico", T1 e T7. `substituidas` aprovado, opcional,
  sempre com o id final; a troca mora no core, na leitura, e no `aplicacao/`, na regravação, não no leitor da
  `Residencia`; formato salvo igual. A HIS-111 vem **antes** do a3)_ D7: aprovar `substituidas` no `ArquivoTarifas` e
  dizer onde a troca mora. E a ordem: a HIS-111 começa depois do a3 da HIS-003a?
- [x] `[para: ux-acessibilidade]` _(respondida em 30/10: avisar, sim, só na visita da troca e só sem conta de luz; ver
  "Fluxo e textos", F1)_ Quando a casa salva troca de `rge-sul` para `rge` (ou de EDEVP para Energisa
  Sul-Sudeste), mostramos um aviso, como "Sua distribuidora agora se chama RGE. O preço foi atualizado.", ou a troca
  fica sem aviso?
- [ ] `[para: tech-lead]` (não bloqueia o h0–h5) F1: (1) como o site acha o nome comercial de um id que já saiu do
  `tarifas.json` (ex.: uma função no core, de id para nome, ou o nome junto do `substituidas`)? (2) O `{ de, para }`
  precisa ficar guardado durante a visita, depois da regravação. (3) O `Aviso` pode ganhar uma opção para não pôr o
  próprio `role`, para entrar numa região `status` que já existe?
- [ ] `[para: dominio-energia]` (não bloqueia) Qual é o nome comercial, com fonte, de EDEVP, CNEE, EEB, CFLO e CERR,
  para entrar em `nomeDaDistribuidora`? Sem isso, o aviso usa o texto sem o nome antigo.
- [ ] `[para: scrum-master]` (não bloqueia) Com `preco.origem === "indisponivel"`, os cômodos e aparelhos do painel
  também mostram R$ 0,00. O F2 corrige só o cartão de cima. O resto fica para uma história própria? Também falta um
  caminho "A minha não está aqui" no passo "distribuidora" do cadastro (princípio 3).
- [ ] `[para: tech-lead]` (não bloqueia) **V4, sentido de "vigente":** implementei o V4 como "a sucessora final está
  publicada"; junto com o V1, isso quer dizer "vigente ou vencida há até 6 meses (D4)". Com "vigente" estrito
  (`fimVigencia ≥ hoje`), a rotina pararia todo dia em que a ANEEL atrasa o reajuste de ESS, CPFL Santa Cruz, EMR, EPB
  ou Âmbar Roraima, o que contradiz o aviso desde o 1º dia do dominio-energia. Confirmar ou pedir o estrito.
- [ ] `[para: dominio-energia]` (não bloqueia) No `base/sucessoes.json`, cada linha tem um link só em `fonte`; os
  outros links e as ressalvas (data da REA 6.318 num sábado, número do despacho do MME) foram para o campo opcional
  `observacao`. Revisar as 10 linhas no PR (R4) e trocar a `fonte` pelo link do cedoc ou do DOU quando tiver acesso.
- [ ] `[para: frontend]` (h6) O core ganhou `trocaDeDistribuidora(arquivo, id)`, que devolve `{ de, para }` só quando
  `de` não está publicado e `para` está (R6). O `useDistribuidoraAtualizada` pode usar direto, guardando o par só na
  visita (F1).
- [x] `[para: scrum-master]` _(respondida em 30/10: Sprint 0, prioridade 1, **um corte só**, antes do a3; o passo 0
  roda na Action pelo `push` da branch, que quem orquestra faz. Ver a nota do scrum-master)_ Prioridade e sprint. O pedido do dominio-energia é prioridade alta. Fazer um corte só ou
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

### [tech-lead] 2026-10-30 — D7 aprovado com ajustes, desenho h0–h8, passo 0 na Action; HIS-111 antes do a3
- **O que fiz:** li o código da rotina (`montar`, `tarifas`, `municipios`, `atualizar`, `escrever`), o core
  (`tipos`, `distribuidoras`), `aplicacao/resumo.ts`, o store da casa, `Cadastro`, `TelaAjustes`, os dois workflows e o
  D2–D4 da HIS-003a. Escrevi o "Desenho técnico" (T1–T7) e o ADR-005.
- **Decisões e porquê:**
  - **D7 aprovado:** `substituidas?` opcional no `ArquivoTarifas`, sempre com o id final, com as regras do V8. Opcional
    porque o site lê arquivo antigo do cache e ainda não tem leitor.
  - **A troca não fica no leitor da `Residencia`.** Ele roda antes de o `tarifas.json` chegar e não corrige valor
    (ADR-004). A troca fica no core (`acharDistribuidora` e `distribuidorasDaCidade`): o preço fica certo sem
    regravar, e a regra repetida em 4 lugares das telas sai. A regravação, uma vez só, fica no `aplicacao/`
    (`useDistribuidoraAtualizada`). O formato salvo não muda.
  - **D1** só junta sigla vencida. Duas vigentes com o mesmo CNPJ fazem a rotina parar (V2).
  - **D3 com a regra segura:** o vínculo extinto só sai se a cidade tiver outro. O D2 + D4 + V5 já pegam a empresa
    que acabou.
  - **Duas barreiras:** V1–V4, V7 e V8 sem `--forcar` (número errado); V5 e V6 com `--forcar` (cobertura).
  - **Passo 0:** `diagnosticar-dados.yml`, só leitura (`contents: read`, sem credencial, sem gravar, confere que nada
    mudou), com `workflow_dispatch` e `push` na branch da história. O `push` deixa rodar sem PR antes, porque o
    `workflow_dispatch` só aparece com o arquivo no `main`.
  - **Ordem:** a HIS-111 vem **antes** do a3 (T7). O conflito custa uns 30 minutos de rebase. Esperar custa dias de
    conta errada em 227 cidades.
- **Arquivos alterados:** este arquivo; `docs/equipe/decisoes/ADR-005-distribuidora-que-deixa-de-existir.md` (novo);
  `docs/equipe/decisoes/README.md`; `HIS-003-base-de-seguranca.md` (contrato do `substituidas` no D2 do a3);
  `docs/equipe/quadro.md`; minha pasta.
- **Como verifiquei:** confirmei no código que o `merge` do `persist` roda antes do `fetch` das tarifas, que `Cadastro`
  e `TelaAjustes` filtram por `Map` de ids (4 lugares) e que o cache dos `/dados` é de 1 h + 1 dia. Confirmei também que
  `--forcar` pula todo o `validar`, que o `.cache` está no `.gitignore`, que o `relatorio.json` é lido só em 2 campos e
  que os SHA do workflow são os do ADR-003. Não rodei a rotina: a ANEEL dá 403 daqui.
- **Para o próximo:**
  - **scrum-master:** sprint e prioridade; aceitar os ajustes dos critérios 3, 5, 6 e 8 (T5).
  - **ux:** o aviso do D7 (sim ou não). Não bloqueia o h0–h5.
  - **seguranca:** olhar o workflow do T3 e o V8 antes do h0.
  - **backend:** h0 a h5. O primeiro push roda o passo 0. O h3 só começa depois do portão.

### [scrum-master] 2026-10-30 — Sprint 0, prioridade 1, um corte só; critérios do T5 aceitos
- **O que fiz:** decidi prioridade, sprint e corte; apliquei o T5 nos critérios 1, 3, 5, 6 e 8; criei os critérios 12
  (V7 e `--forcar`) e 13 (Pronto só depois do h8); pus o caso (h) no `casa-salva.spec.ts` da a7 da HIS-003a.
- **Decisões e porquê:**
  - **Sprint 0, prioridade 1, já.** É número errado no ar: 227 cidades veem uma conta de 11% a 55% menor, e a família
    pode planejar o mês com esse valor. É correção de defeito (decisão em vigor: entra na Sprint 0 se houver gente
    livre), e o backend está livre (a 002a está com qa e frontend). A Sprint 0 passa a fechar com seis histórias.
  - **Antes do a3, sem esperar nada:** branch `his-111-tarifas-vencidas` saindo do `main`, em paralelo com o fim da
    002a. Se a 003a chegar ao a3 e a HIS-111 ainda não estiver no `main` (ex.: passo 0 sem resultado), o a3 **não
    espera**: quem chegar depois faz o rebase. Pronta junto com outra, a HIS-111 entra primeiro no `main`.
  - **Um corte só.** As sucessões já estão confirmadas, então o corte parcial perde a razão: ele deixaria 81 cidades
    sem distribuidora. Se o portão (b) reprovar ENF ou EBO pelo V7, só essas linhas ficam fora. Nenhuma cidade perde a
    distribuidora, porque nas 10 cidades delas outra empresa já está na lista ("Só ela" = 0). A história segue sem
    esperar.
  - **T5 aceito como veio** (6 meses; V5 no critério 6; critério 5 com três casos; e2e do 8 na a7; teste dos publicados
    no h8). O V7 ganhou critério próprio (12) porque é veto do dominio-energia e não tinha critério verificável.
- **Arquivos alterados:** este arquivo (cabeçalho, critérios, pergunta, nota); `HIS-003-base-de-seguranca.md` (caso h
  do `casa-salva.spec.ts`); `docs/equipe/quadro.md`; `docs/planejamento.md`; minha pasta.
- **Como verifiquei:** conferi "Só ela" de ENF (0) e EBO (0) na tabela de evidência; conferi no T4 que nenhum passo
  depende da 002a; conferi que as seis cidades do critério 1 não são de ENF ou EBO.
- **Para o próximo:**
  - **seguranca:** workflow do T3 e V8. Isso bloqueia o h0.
  - **ux:** o aviso do D7. Bloqueia só o h6.
  - **backend:** h0 a h5, depois da seguranca.
  - **quem orquestra:** fazer o push da branch, que roda o passo 0, e colar o resumo do job em "Resultado do passo 0".
    No h8, rodar o `atualizar-dados.yml` à mão.

### [seguranca] 2026-10-30 — análise de ameaças: aprovado para o h0; ADR-005 pode virar aceito
- **O que fiz:** li o T1–T7, o ADR-005, os dois workflows, o `.gitignore`, o `pnpm-workspace.yaml` e as saídas de log
  do `atualizar.ts`. Conferi os 3 SHA do T3 contra a HIS-002 e a HIS-003. Preenchi "Ameaças" (R1–R9).
- **Resultado:** **aprovado**. Nada crítico ou alto.
  - O workflow do T3 está certo como está. Único ajuste: os `paths` (R1).
  - O V8 está certo. O que faltava era o lado do site antes da a3 (R5, R6) e a montagem do resultado (R7).
- **Achado principal, médio (R3):** nenhuma regra impede uma linha do `sucessoes.json` de tirar uma cidade de uma
  empresa **vigente**. Entram o **V9** (a antiga não pode estar vigente) e o **V10** (as siglas batem com o CNPJ na
  ANEEL), sem `--forcar`, no h1/h3. Na etapa 6, eu confiro que eles existem e têm fixture.
- **ADR-005:** pode virar **aceito**. O tech-lead acrescenta ao item 2: "a linha só vale para empresa sem tarifa
  vigente, e as siglas batem com o CNPJ". E acrescenta ao item 5: "sucessão para empresa vigente".
- **Para o próximo:**
  - **backend:** R1, R2 e R3 (h0–h4); R5 (h5).
  - **frontend:** R6 (h6).
  - **scrum-master:** V9 e V10 no critério 12.
  - **quem implementar a a3:** R7.
  - **qa:** R8 no h7/h8.

### [ux-acessibilidade] 2026-10-30 — aviso do D7: sim, uma vez; textos do D4 para a cidade sem preço
- **O que fiz:** escrevi "Fluxo e textos" (F1 e F2). Li a `Casca`, o painel, a Minha casa, o cadastro e o `Aviso`.
- **Decisões e porquê:**
  - **F1, avisar:** a conta pode subir até 55% sem a pessoa fazer nada. O aviso aparece na `Casca`, só na visita da
    troca e só sem conta de luz, e some com "Entendi". Não guarda nada novo no aparelho.
  - O texto diz que o site usava o preço antigo. A família já recebe a conta com o nome novo.
  - Nunca mostrar id nem sigla solta. Sem nome conhecido, o texto sai sem o nome antigo.
  - **F2:** hoje o painel mostra R$ 0,00 quando falta o preço. Troquei por "Falta o preço da luz" e o caminho da conta
    de luz. Também escrevi os textos do cadastro e da Minha casa.
- **Arquivos:** este arquivo ("Fluxo e textos" e "Perguntas abertas"); minha pasta.
- **O que o frontend confere no h6:** a região `status` vazia antes do aviso; o foco vai para o `h1` ao fechar; nenhum
  "R$ 0,00" ou "Tarifa da :" vazio no cartão de cima; os dois corpos do F1 (com e sem o nome antigo).
- **Próximo:** tech-lead (3 pontos do F1, não bloqueiam o h0–h5); dominio-energia (5 nomes); depois o frontend no h6.
  Eu reviso as capturas do qa (390 e 1280 px) no h7.

### [backend] 2026-10-30 — h0 a h5 implementados; passo 0 pronto para o push
- **O que fiz** (branch `his-111-tarifas-vencidas`, um commit por passo):
  - **h0** `76aee18`: `fontes.ts` (a leitura saiu do `atualizar.ts`), `diagnostico.ts` + `diagnosticar.ts`
    (`pnpm dados:diagnosticar`), `anotacoes.ts` (R2) e `.github/workflows/diagnosticar-dados.yml` com os `paths` do R1.
  - **h1** `81e1f89`: `base/sucessoes.json` com as 10 linhas do dominio-energia e `sucessoes.ts` (leitor que lança com a
    linha; V9 e V10 do R3; aviso do `desde`).
  - **h2** `175d74d`: D4 com 6 meses e V7 em `tarifas.ts`; `subtrairMeses` preso ao fim do mês.
  - **h3** `db01535`: D1, D2 e D3 em `montar.ts` e `municipios.ts`; `substituidas`; campos do D6; `rotina.ts`.
  - **h4** `64b2dd8`: `conferirCoerencia` (V1–V4, V7–V10, sem `--forcar`); V5 e V6 no `validar`; `executarAtualizacao`
    testável; `::notice`/`::warning` do D6.
  - **h5** `92e1a0a`: core com `substituidas?`, `acharDistribuidora`, `distribuidorasDaCidade` e
    `trocaDeDistribuidora` (R5, R6).
- **Decisões e porquê:**
  - **D3 com a regra segura:** um vínculo extinto que leva a uma sucessora (D1 ou D2) vale; os outros só saem quando a
    cidade tem outro vínculo recente. Assim o D3 nunca tira o único preço de uma cidade.
  - **D1 também olha as vencidas descartadas pelo D4.** Sem isso, a RGE SUL (2019) sairia pelo D4 e `rge-sul` nunca
    entraria em `substituidas`.
  - **`substituidas` leva também ids sem cidade hoje** (`cflo`, `cnee`, `eeb`, `cpfl-jaguari`), porque uma casa salva
    ainda pode ter o id antigo.
  - **V4 = sucessora publicada**, e "vigente" vem do V1 (até 6 meses). Pergunta aberta ao tech-lead.
  - **Assinatura nova:** `conferirCoerencia(montagem, contexto)` recebe também os agentes da tarifa e as siglas dos
    conjuntos, porque o V9 e o V10 precisam do que a ANEEL diz de cada CNPJ, e isso não está no `tarifas.json`.
  - A rotina lê o `sucessoes.json` **antes** de baixar: uma linha errada para tudo sem gastar o download.
  - A rotina continua gravando só em `apps/web/public/dados`; nenhum código escreve em `packages/dados/base/` (R4).
  - A fixture antiga da LIGHT SESA passou a vencer em 2026-05-14, e não mais em 2026-03-14. Os valores não mudaram, e o
    teste continua provando "usa a mais recente que já começou", agora dentro dos 6 meses.
- **Condicionado ao passo 0** (ver "Resultado do passo 0"):
  - (a) a folga do D3;
  - (b) as linhas ENF e EBO (V7);
  - (c) nenhum outro par de CNPJ com as duas siglas vigentes (V2);
  - V5, V6 e V10 com os dados reais. As siglas do `sucessoes.json` foram copiadas do `tarifas.json` publicado, e o
    V10 também aceita a sigla dos conjuntos.
  - Os critérios 1, 2 e 10 só se provam com os CSVs reais.
- **Ameaças:** a seção "Ameaças" (R1–R9) e as notas da conversa desta cópia são idênticas às da `his-002-qualidade`;
  não faltava nada. Situação de cada uma:
  - R1: feito nos `paths`.
  - R2: `anotacao`/`umaLinha`/`celulaMarkdown`/`limitarResumo`, com teste da sigla `"X\n::add-mask::a"`.
  - R3: V9 e V10, com uma fixture para cada caso.
  - R4: nada escreve em `base/`.
  - R5 e R6: no core.
  - R7: contrato registrado no T1, para o a3.
- **Arquivos:**
  - `packages/dados/src/`: `anotacoes.ts`, `fontes.ts`, `diagnostico.ts`, `diagnosticar.ts`, `sucessoes.ts` e
    `rotina.ts` (novos); `atualizar.ts`, `montar.ts`, `util.ts`, `exemplo.ts`, `aneel/tarifas.ts` e
    `aneel/municipios.ts`.
  - `packages/dados/base/sucessoes.json`.
  - `packages/dados/fixtures/sucessao/` (CSVs, `tarifas-v7.csv`, os 6 `sucessoes*.json` e `publicados/`) e
    `fixtures/tarifas.csv` (datas da LIGHT).
  - `packages/dados/test/`: `anotacoes`, `diagnostico`, `sucessoes`, `vencimento`, `montagem-sucessao`, `coerencia` e
    `rotina` (novos); `dados.test.ts`.
  - `packages/core/src/tipos.ts` e `distribuidoras.ts`; `packages/core/test/distribuidoras.test.ts`.
  - `.github/workflows/diagnosticar-dados.yml`, `package.json` e `packages/dados/package.json`.
  - `apps/web/public/dados/` não foi tocado.
- **Como verifiquei:**
  - `pnpm typecheck` e `pnpm test` verdes em cada passo (dados: de 11 para 72 testes; core: de 37 para 48).
  - `pnpm build` verde no h5.
  - Rodei `pnpm dados:diagnosticar --sem-baixar` com as fixtures copiadas para o `.cache`, comparando com os arquivos
    publicados de verdade. Alegrete e Assis passam a `rge` e `ess`. O `git status` continuou limpo.
  - Não rodei com os CSVs reais: a ANEEL dá 403 daqui.
- **Para o próximo:**
  - **Quem orquestra:** fazer o push da branch (roda o passo 0) e colar o resumo em "Resultado do passo 0". O que
    conferir está lá.
  - **Backend:** ajustar o D3 ou o `sucessoes.json` se o portão reprovar.
  - **Frontend (h6):** `acharDistribuidora` no `useResumo`; `distribuidorasDaCidade` no `Cadastro` e na
    `TelaAjustes`; `trocaDeDistribuidora` no `useDistribuidoraAtualizada`.
  - **Seguranca (etapa 6):** R1–R7 nos arquivos acima. O V9 e o V10 estão em `sucessoes.ts`; as fixtures, em
    `fixtures/sucessao/sucessoes-v9.json` e `sucessoes-v10.json`; os testes, em `test/rotina.test.ts`, com `--forcar`.
  - **qa (h7):**
    - critérios 4 a 7, 9 e 12 nos testes de `packages/dados/test/`;
    - critério 8 na unidade, em `packages/core/test/distribuidoras.test.ts`;
    - critérios 1, 2 e 10 pelo resumo do job.
  - **dominio-energia:** revisar o `sucessoes.json` no PR.

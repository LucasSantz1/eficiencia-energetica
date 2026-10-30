# HIS-003a · Dados quebrados não travam o site (base de segurança)

| Campo | Valor |
| --- | --- |
| Épico | E0 · Fundação |
| Sprint | 0 |
| Tamanho | M (≈ 3 dias com o qa: passos a1–a7 do D9) |
| Papéis principais | seguranca, backend, frontend, tech-lead |
| Status | Preparada (a2 espera a P-tl-1; a3 espera a P-tl-2; etapa 4 depois da 002a no `main`) |
| Branch | `his-003-seguranca` (sai do `main` **depois** da integração da HIS-002a) |

> **Origem:** dividida da HIS-003 pelo scrum-master em 2026-10-30, a partir da proposta D9 do tech-lead (P-tl-3). A
> outra parte é a [HIS-003b · Campos com limite e "Confere?"](HIS-003b-campos-com-limite.md). O arquivo manteve o nome
> antigo para não quebrar links. A numeração dos critérios continua a da HIS-003. Aqui fica o critério 5 só na parte
> do domínio (`limites.ts`); o critério 5 nas telas, o T5, o T6, o bloco "T5 e T6" do D5, o `campos.spec.ts` e os
> passos b1–b3 foram **movidos** para a 003b. D1–D4, D6 e D7 valem para as duas e ficam aqui.

## Problema e valor

Como **família que usa o site**, eu quero **que ele nunca mostre tela branca e que meus dados fiquem protegidos**
para **confiar no site e não perder o que cadastrei**.

Hoje o localStorage e os JSON de `/dados` são lidos sem validação. Um dado corrompido (ou alterado por extensão do
navegador) pode quebrar a tela. O site também não envia cabeçalhos de segurança e o CI não confere vulnerabilidades.

## Critérios de aceite

1. **Dado** qualquer requisição ao site, **quando** a resposta chega, **então** ela tem `Content-Security-Policy`
   (sem `unsafe-eval`; `frame-ancestors 'none'`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy` sem câmera/microfone/localização por enquanto.
2. **Dado** um localStorage com JSON inválido ou com campos fora do formato, **quando** o site abre, **então** ele não quebra:
   descarta só o que é inválido (ex.: um aparelho com potência negativa) e avisa a pessoa em linguagem simples quando algo for descartado.
3. **Dado** um `tarifas.json` ou `municipios/{UF}.json` fora do formato, **quando** carregado, **então** o site mostra mensagem
   amigável com "Tentar de novo", sem tela branca.
4. **Dado** um erro inesperado em qualquer página, **quando** acontece, **então** aparece a tela de erro do projeto (`error.tsx`)
   com "Tentar de novo" e "Voltar ao início", sem detalhes técnicos.
5. _(parte do domínio; a parte das telas está na [HIS-003b](HIS-003b-campos-com-limite.md))_ **Dado** os limites de
   tamanho e faixa (nome de cômodo, potência, minutos, kWh, valor da conta, leitura, pessoas), **quando** o `pnpm test`
   roda, **então** eles estão só em `packages/core/src/limites.ts`, com fonte em comentário, os leitores da casa salva e
   dos `/dados` usam esses limites, e os casos 1–23 do dominio-energia e as bordas de cada `Faixa` (limite, limite + 1,
   `NaN`, `Infinity`) passam no `limites.test.ts`.
6. **Dado** um push, **quando** o CI roda, **então** `pnpm audit --audit-level high` passa e o Dependabot está configurado
   para npm e GitHub Actions.
7. Existe `.env.example` (vazio por enquanto, com comentário) e `.env*` está no `.gitignore`.

## Fora do escopo

- Autenticação e banco (E4).
- Limite de taxa (não há endpoint próprio ainda).
- Mensagens de campo fora do limite (T5), "Confere?" (T6) e aviso de consumo alto da casa: [HIS-003b](HIS-003b-campos-com-limite.md).
- Avisar quando a memória do navegador estiver cheia e não der para salvar (risco 6 do D9): backlog.

## Fluxo e textos

_(ux-acessibilidade, 2026-10-30)_ Textos finais, prontos para copiar. Nenhuma tela nova além de `error.tsx`,
`global-error.tsx` e `not-found.tsx`.

**Regras para todos os textos abaixo**
- Nada técnico na tela: sem nome de arquivo, código HTTP, `error.message`, `digest` ou mensagem do zod.
- Nenhum texto culpa a pessoa. Números com `formatarReais` / `formatarKwh` / `formatarWatts` do `@ee/core`.
- `{min}` e `{max}` vêm de `packages/core/src/limites.ts` (dominio-energia), já formatados.
- No site, "aparelho" é sempre eletrodoméstico. Para o celular ou computador da pessoa: "aqui".

### T1. Parte dos dados salvos foi descartada (critério 2)

**Onde:** uma vez, no topo do conteúdo da primeira tela que abre a casa salva (telas `/casa/*` pela `Casca`; `/` e
`/comecar` se lerem a casa), abaixo do topo e acima do título. Some ao tocar em "Entendi" ou ao fechar o site. Não
volta, porque a versão limpa já fica salva. **Componente:** `Aviso tom="faisca"` (`role="status"`). Não usar `alerta`:
a pessoa não errou e o resto funciona.

**T1a. Saiu só uma parte**

> **Parte do que estava salvo aqui tinha um problema e foi tirada.**
> Tiramos {lista}. O resto da sua casa continua salvo.
> [Ver meus aparelhos] [Entendi]

`{lista}`: cada tipo com a quantidade, separados por vírgula e "e" no último. Ex.: "Tiramos 2 aparelhos e 1 conta de luz."

| Tipo | 1 | Mais de 1 |
| --- | --- | --- |
| aparelho | 1 aparelho | {n} aparelhos |
| cômodo | 1 cômodo | {n} cômodos |
| conta | 1 conta de luz | {n} contas de luz |
| leitura | 1 anotação do relógio de luz | {n} anotações do relógio de luz |
| plano | 1 dica do seu plano | {n} dicas do seu plano |

"Ver meus aparelhos" (`BotaoLink variante="secundario"`, `/casa/aparelhos`) só aparece se saiu aparelho ou cômodo.
"Entendi" é `Botao variante="fantasma"`.

**T1b. Saiu a cidade ou a empresa de luz (a `residencia`), mas os aparelhos ficaram**

> **Não conseguimos abrir sua cidade e sua empresa de luz.**
> Seus aparelhos continuam salvos. Escolha a cidade de novo para ver os valores.
> [Escolher minha cidade] [Entendi]

"Escolher minha cidade" leva para `/casa/ajustes`.

**T1c. Não sobrou nada que dê para usar**

> **Não conseguimos abrir a casa que estava salva aqui.**
> As informações tinham um problema. Cadastre a casa de novo para ver quanto cada aparelho custa.
> [Cadastrar minha casa] [Entendi]

"Cadastrar minha casa" é `BotaoLink` principal para `/comecar`.

**Acessibilidade do T1**
- O `role="status"` precisa **já estar na página, vazio**, antes de o texto chegar. A casa é lida depois da primeira
  pintura da tela; se o aviso nascer junto com o texto, o TalkBack e o NVDA não leem nada. Por isso: deixar o recipiente
  sempre na página e preencher o texto depois da leitura da casa.
- O aviso não puxa o foco.
- Ao tocar em "Entendi", o foco vai para o `h1` da tela (`tabIndex={-1}`), nunca para o `body`.
- Botões com `min-h-12`. Em 360 px ficam um embaixo do outro (`largo`); a partir de 640 px, lado a lado.
- Contraste: tinta sobre `faisca-claro` passa de 14:1.

### T2. Falha ao carregar os preços da luz ou a lista de cidades (critério 3)

Um texto só para internet caída e para arquivo fora do formato: nos dois casos a pessoa faz a mesma coisa.

**Onde:** no topo do conteúdo, abaixo do título. Troca os dois textos de hoje:
- `funcionalidades/cadastro/Cadastro.tsx` (por volta da linha 216);
- `funcionalidades/acompanhamento/PainelAcompanhamento.tsx` (por volta da linha 29). O "recarregue a página" sai, e
  `useResumo` passa a expor `tentarDeNovo`.

**Componente:** `Aviso tom="alerta"` (`role="alert"`) com `Botao variante="secundario"`. O botão sublinhado de hoje tem
menos de 44 px e sai.

**T2a. Preços da luz (`tarifas.json`)**

> **Não conseguimos carregar os preços da luz.**
> Pode ser a internet ou um problema do nosso lado. {frase de segurança}
> [Tentar de novo]

**T2b. Cidades (`municipios/{UF}.json`)**

> **Não conseguimos carregar as cidades de {nome do estado}.**
> Pode ser a internet ou um problema do nosso lado. {frase de segurança}
> [Tentar de novo]

O estado vai por extenso ("São Paulo"), nunca a sigla sozinha.

**T2c. Sem internet (`navigator.onLine === false`)**: troca as duas primeiras frases.

> **Você está sem internet.**
> Ligue os dados móveis ou o Wi-Fi e toque em "Tentar de novo". {frase de segurança}
> [Tentar de novo]

**`{frase de segurança}`**
- No cadastro: "Suas respostas não se perdem."
- No painel: "Sua casa continua salva."

**Da 2ª falha seguida em diante**, acrescentar no fim: "Se não der certo, tente mais tarde." A frase nova muda o texto,
e por isso o leitor de tela anuncia o aviso de novo. Sem ela, o `role="alert"` com o mesmo texto fica calado.

**Acessibilidade do T2**
- Enquanto carrega, o botão mostra "Carregando…" e ganha `aria-disabled="true"` (não `disabled`, que tira o foco).
  Ignora toques repetidos.
- Se der certo, o aviso some e o foco vai para o `h1` da tela, porque o botão que tinha o foco sumiu.
- Se der errado, o foco fica no botão.

### T3. Erro geral: `app/error.tsx` e `app/global-error.tsx` (critério 4)

**Onde:** ocupa o lugar da tela que quebrou. No Next 16 o botão chama `retry()` (estável desde a 16.3), não `reset()`;
ver `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`.

> `<title>`: Algo deu errado
> (ícone `CircleAlert` do lucide, decorativo)
> **Algo deu errado nesta tela.** ← `h1`
> Não foi culpa sua. O que você cadastrou continua salvo.
> Toque em "Tentar de novo". Se não funcionar, volte ao início.
> [Tentar de novo] [Voltar ao início]

- "Tentar de novo": `Botao` principal, chama `retry()`.
- "Voltar ao início": `BotaoLink variante="secundario"`, `href="/"`.
- **Se o `retry()` falhar de novo**, a última frase vira: "Ainda não deu certo. Tente mais tarde ou volte ao início."

**`global-error.tsx`:** mesmos textos. Precisa de `<html lang="pt-BR">` e `<body>` próprios, importar `globals.css`
(o Next não aplica os estilos globais nele) e usar `<title>` do React. Ali "Voltar ao início" é um `<a href="/">` comum
com o visual do botão, porque o layout raiz quebrou e a página precisa carregar do zero.

**Acessibilidade do T3**
- Ao abrir, o foco vai para o `h1` (`tabIndex={-1}`): o leitor lê o título e o Tab seguinte cai em "Tentar de novo".
- Não usar `role="alert"`: o foco já faz o anúncio, e os dois juntos repetem o texto.
- A frase que muda depois da 2ª falha fica num `<p aria-live="polite">`.
- Coluna `max-w-[34rem]`. Botões `largo`, um embaixo do outro em 360 px. Ícone com `aria-hidden`.

### T4. Página não encontrada: `app/not-found.tsx`

> título da aba (`metadata.title`): Página não encontrada
> **Não achamos esta página.** ← `h1`
> O endereço pode estar errado ou a página mudou de lugar.
> [Voltar ao início]

- Um botão só: `BotaoLink` principal, `href="/"`.
- **Acessibilidade:** o `h1` é o primeiro texto na ordem de leitura e não precisa puxar o foco. O código 404 o Next já
  manda.

### T5 e T6. Campos fora do limite e "Confere?"

_(scrum-master, 2026-10-30)_ **Movidos para a [HIS-003b](HIS-003b-campos-com-limite.md)**, sem mudança.

## Desenho técnico (proposta inicial)

- `zod` 4 (versão exata) com esquemas em `infraestrutura/validacao/` — os tipos continuam vindo de `@ee/core`;
  o esquema é conferido contra o tipo com `satisfies z.ZodType<T>`.
- Validação dentro do `migrate`/`merge` do persist e no carregamento de `/dados`.
- Cabeçalhos em `next.config.ts` (`headers()`); CSP com `nonce` só se for necessário — conferir a documentação do Next 16
  em `node_modules/next/dist/docs/` sobre CSP e scripts inline.
- Limites em `packages/core/src/limites.ts` (domínio), usados pela interface e pela validação.

_(Proposta substituída pelo desenho definitivo abaixo: sem zod; ver D1.)_

## Desenho técnico definitivo

_(tech-lead, 2026-10-30. Medições em `scratchpad/tl-his003/`: tamanho do zod e protótipo do `persist`. O que outra
história precisa está escrito aqui.)_

### D1. Decisões que respondem às perguntas

1. **Sem zod. Os leitores são escritos à mão no `@ee/core`**, sem dependência nova (ADR-004). Medi o mesmo conjunto de
   esquemas (aparelho, cômodo, conta, leitura e residência), compilado com esbuild e comprimido com gzip:
   - `zod` 4.6.7: 93 098 B. Ele também testa `new Function`, que a nossa CSP sem `unsafe-eval` bloqueia, e isso gera
     "Refused to evaluate" no console. A fixture do e2e reprova esse erro.
   - `zod/mini`: 8 173 B, sem `eval`.
   - Funções escritas à mão: 1 284 B.

   Os leitores vão para quase todas as rotas, porque o store lê a casa em `/`, `/comecar` e `/casa/*`. E o zod cobriria
   só a conferência de cada campo. A parte que exige cuidado é nossa de qualquer jeito: descartar item por item com
   contagem, ids repetidos, `comodoId`, limite por lista e os dois consertos. Assim o domínio continua sem
   dependência, e o site, a rotina e o app futuro usam o mesmo código. A3 continua garantido: o leitor monta um objeto
   novo, campo por campo, e nunca espalha o bruto.
2. **De onde a rotina tira a regra de formato:** do próprio `@ee/core`, que ela já importa. A função
   `lerArquivoTarifas`/`lerArquivoMunicipios` é a mesma no navegador, no servidor do site e na rotina. Na rotina vale a
   forma estrita: qualquer entrada descartada ou estrutura errada faz o processo sair com código 1, **mesmo com
   `--forcar`**. O `--forcar` continua valendo só para o `validar()` de variação que já existe (faixa R$ 0,30–2,00,
   contagens).
3. **`Campo` ganha `erro?: string` e `alerta?: AlertaDoCampo`**, com o contrato do T6. O `Campo` passa `id`,
   `aria-invalid` e `aria-describedby` para a `Entrada` por contexto do React (`CampoContexto`), sem `cloneElement`.
   Assim as telas só acrescentam `erro`/`alerta`. Quando os dois existem, o `erro` ganha.
4. **Formato salvo inalterado:** chave `eficiencia-energetica:casa`, `{ state: { residencia, comodos, aparelhos,
   contas, leituras, plano }, version: 2 }`. A versão não sobe. Os e2e de migração da 002a (`casa-v1.json` e
   `casa-v2.json`) continuam passando **sem aviso**: são a rede contra falso positivo.

### D2. Domínio (`packages/core/src`, arquivos planos, imports só com `./`, tudo exportado no `index.ts`)

```ts
// limites.ts: cada número com a fonte do dominio-energia em comentário ("Regras de negócio e fontes")
export interface Faixa {
  min: number; max: number;
  inteiro?: boolean;          // só número inteiro
  casas?: number;             // máximo de casas decimais (dinheiro: 2)
  minExclusivo?: boolean;     // fatorCiclo: > 0
  tolerancia?: number;        // diasPorSemana: 0,001 (fração 7/30)
  alerta?: number;            // acima disto: "Confere?" (nunca descarta)
}
export const LIMITES = {
  potenciaW, minutosPorDia, diasPorSemana, banhosPorDia, minutosPorBanho, quantidade, fatorCiclo, kwhMesInformado,
  contaKwhCalibracao, contaKwhAcompanhamento, contaValorCalibracao, contaValorAcompanhamento,
  leituraKwh, pessoas, municipioIbge, tarifaKwh, componenteDaTarifaKwh, adicionalDaBandeiraKwh,
} as const satisfies Record<string, Faixa>;
export const LIMITES_DE_TEXTO = { nomeComodo: 40, nomeAparelho: 60, nomeMunicipio: 80, id: 64, idDoPlano: 120, variante: 40 } as const;
export const LIMITES_DE_LISTA = { comodos: 80, aparelhos: 500, contas: 240, leituras: 1_000, plano: 500, variantes: 10 } as const;
export const KWH_POR_DIA_ENTRE_LEITURAS = { alerta: 100, maximo: 1_800 } as const;
export const PRECO_DA_CONTA_POR_KWH = { min: 0.3, max: 3, kwhMinimo: 30 } as const;  // estimativa
export const CONSUMO_DA_CASA_ALERTA_KWH_MES = 2_000;
export const MEDIA_BRASIL_KWH_MES = 178.2;            // EPE, Boletim nº 22 (o texto diz "perto de 180")
export type ResultadoDaFaixa = "ok" | "alerta" | "fora";
export function validarFaixa(faixa: Faixa, valor: number): ResultadoDaFaixa;          // não finito → "fora"
export function precoDaContaForaDoComum(conta: ContaReferencia, beneficio: Beneficio): number | undefined; // preço/kWh se pedir "Confere?"
export function alertaDaLeitura(anterior: LeituraRelogio, nova: LeituraRelogio): { kwhPorDia: number } | undefined;
export function consumoDaCasaForaDoComum(kwhMes: number): boolean;
```

- Os números de referência do T6 (7.800 W do chuveiro, 115 kWh da geladeira) saem do catálogo, por função em
  `limites.ts`. Não são escritos de novo na tela.
- `LIMITES_DE_LISTA` e os limites de texto de id, município e variante são **limites técnicos** (não são regra do
  setor). Ficam com o comentário dizendo isso.
- `tarifaKwh`, `componenteDaTarifaKwh` e `adicionalDaBandeiraKwh` dependem da P-tl-2, que vai para o dominio-energia.
- `acompanhamento.ts`: em `periodosDeLeitura`, um período com mais de 1.800 kWh por dia vai para `ignoradas` (caso 21).

```ts
// entrada.ts: número digitado no formato brasileiro (troca os 4 `Number(t.replace(...))` das telas)
export type NumeroDigitado = { tipo: "vazio" } | { tipo: "mal-escrito" } | { tipo: "numero"; valor: number };
export function lerNumeroDigitado(texto: string, casas: 0 | 2): NumeroDigitado;
```

Como `lerNumeroDigitado` lê o texto:

- Tira os espaços das pontas. Com mais de 15 caracteres, é "mal-escrito".
- Com vírgula: a vírgula separa os centavos, e os pontos são de milhar, em grupos de 3.
- Sem vírgula: ponto seguido de 1 ou 2 dígitos no fim é decimal ("135.90" = 135,9; hoje o `conta-valor` lê 13.590).
  Ponto seguido de 3 dígitos é milhar ("1.500" = 1.500).
- Recusa `1,2,5`, `0x10`, `1e309`, `Infinity`, sinal e mais casas do que `casas`.

```ts
// estados.ts: as 27 UFs com o nome por extenso (IBGE). Serve para o T2b e para o A6.
export const ESTADOS: Readonly<Record<Uf, string>>; export type Uf = "AC" | … | "TO"; export function ehUf(v: unknown): v is Uf;

// casa-salva.ts. DadosCasa sai de infraestrutura/armazenamento/casa.ts e vai para tipos.ts (o tipo é o mesmo).
export interface ContagemDeDescartes { aparelhos: number; comodos: number; contas: number; leituras: number; plano: number }
export interface CasaLida { casa: DadosCasa; descartados: ContagemDeDescartes; residenciaDescartada: boolean; ilegivel: boolean }
export function lerCasaSalva(bruto: unknown): CasaLida;   // undefined = nada salvo (casa vazia, sem aviso)
export type AvisoDaCasaSalva = { tipo: "nada-aproveitavel" } | { tipo: "sem-residencia" } | { tipo: "parte"; descartados: ContagemDeDescartes };
export function avisoDaCasaSalva(lida: CasaLida): AvisoDaCasaSalva | undefined;      // ordem: nada > sem-residencia > parte
export function lerAparelho(bruto: unknown): Aparelho | undefined;   // e lerComodo, lerConta, lerLeitura, lerResidencia, lerIdDoPlano
```

Regras do `lerCasaSalva`, além das da segurança em "Regras de validação":

- Raiz que não é objeto simples: `ilegivel`.
- Lista que falta: `[]` (versão 1).
- Lista que existe mas não é array: conta 1 descarte daquele tipo.
- Ids repetidos: fica o primeiro. Na conta, também conta como repetida outra com a mesma `competencia`; na leitura,
  outra com a mesma `data` (igual a `salvarConta`/`salvarLeitura`).
- Chaves de `variantes` precisam casar com `^[a-z][a-z0-9-]{0,39}$`. Isso barra `__proto__`. As chaves de hoje
  (`modelo`, `tipo`, `tamanho`, `potencia`, `tecnologia`, `idade`) passam.
- **Datas:** o leitor confere só se a data existe no calendário, **não se está no futuro**. Um relógio do celular
  atrasado apagaria anotações verdadeiras para sempre, porque a versão limpa é regravada. A tela continua barrando
  data no futuro.
- `contaReferencia` inválida: sai só ela e conta em `contas` (o T1a diz "1 conta de luz").
- `pessoas` inválido: sai só o campo, sem aviso, porque só serve de sugestão no cadastro.
- "nada-aproveitavel" = `ilegivel`, ou houve descarte e a casa ficou sem `residencia`, sem cômodos e sem aparelhos.

```ts
// arquivos-publicos.ts: mesmos leitores no navegador, no servidor e na rotina
export class ErroDeFormato extends Error {}
export function lerArquivoTarifas(bruto: unknown): { arquivo: ArquivoTarifas; descartados: number };
export function lerArquivoMunicipios(bruto: unknown, uf: Uf): { arquivo: ArquivoMunicipios; descartados: number }; // `uf` do arquivo ≠ pedida → lança
export function lerRelatorioDosDados(bruto: unknown): { municipios: number; municipiosSemDistribuidora: number };
```

- Quando lançam `ErroDeFormato`: estrutura errada, lista que falta, `origem` desconhecida ou `uf` diferente da pedida.
- Entrada inválida sai e conta em `descartados`, sem correção de valor.
- As funções de apoio (`ehObjeto`, `numeroNaFaixa`, `textoLimitado`, `umaDas`) ficam em `leitura-segura.ts` e não são
  exportadas no `index.ts`.

### D3. Casa salva (`infraestrutura/armazenamento/`)

Testado no protótipo `scratchpad/tl-his003/persist/prototipo.ts` com o zustand 5.0.16 do lockfile: 9 casos, sempre
`hasHydrated: true`, o válido sem mudança e o inválido regravado limpo.

```ts
// armazenamento-local.ts (novo)
export function criarArmazenamentoSeguro(versaoAtual: number): PersistStorage<unknown>;
```

Como o armazenamento funciona:

- **`getItem`:**
  - Sem `window` (servidor): `null`.
  - `localStorage` bloqueado lança `SecurityError`: `try/catch` devolve `null`.
  - Sem texto salvo: `null`.
  - `JSON.parse` falha, ou o envelope não é objeto com `state`: `{ state: null, version: versaoAtual }`. Isso resolve
    o **P1**: o `merge` recebe `null` e marca `ilegivel`.
  - No resto: `{ state, version }`. Se `version` não for número, vale `versaoAtual`.
- **`setItem` e `removeItem`:** com `try/catch`, para que a memória cheia não derrube a tela. O aviso de "não deu para
  salvar" vai para o backlog (risco 6).

```ts
// casa.ts (store): mesmas chave e versão
storage: criarArmazenamentoSeguro(VERSAO_DA_CASA),
partialize: (estado): unknown => dadosSalvaveis(estado),
migrate: (salvo) => salvo,   // da v1 para a v2 só entraram listas; o lerCasaSalva aceita as duas. Validar é no merge.
merge: (salvo, atual) => { const lida = lerCasaSalva(salvo); return { ...atual, ...lida.casa, avisoDaCasaSalva: avisoDaCasaSalva(lida) }; },
onRehydrateStorage: () => (estado) => { if (estado?.avisoDaCasaSalva) armazenamento.setItem(NOME, { state: dadosSalvaveis(estado), version: VERSAO_DA_CASA }); },
```

- O **`merge` roda sempre** (P2). O `migrate` só repassa.
- Existe aviso exatamente quando houve descarte. Por isso o aviso também decide se a versão limpa é regravada. Depois
  disso o aviso não volta, como pede o T1.
- `avisoDaCasaSalva` fica no estado, fora do `partialize`. Ele só tem números e o tipo do aviso. Ação nova:
  `dispensarAvisoDaCasaSalva()`.
- **As ações passam pelos mesmos leitores** antes do `set`:
  - `adicionarAparelho` (`comodoId` precisa existir e a lista tem limite) e `atualizarAparelho` (junta, depois lê).
    Os dois passam a devolver `Aparelho | undefined`.
  - `adicionarComodo` e `renomearComodo` (texto ≤ 40; nome vazio mantém o anterior).
  - `salvarConta`, `salvarLeitura`, `alternarNoPlano`, `definirResidencia`/`atualizarResidencia`.
  - `criarCasa` passa por `lerCasaSalva`.
  - O que o leitor recusar não muda o estado. Nada vai para o `console`.
- `aplicacao/casa.ts` ganha `useAvisoDaCasaSalva(): { aviso?: AvisoDaCasaSalva; dispensar(): void }`. Ele devolve
  `undefined` até o `useCasaCarregada()` ficar `true`. Assim o `role="status"` nasce vazio no HTML e o texto chega
  depois (T1).

### D4. Dados públicos

- `navegador.ts`:
  - `carregar<T>(caminho, ler: (bruto: unknown) => T, recarregar: boolean)`. O `as` sai.
  - Na nova tentativa usa `fetch(caminho, { cache: "no-cache" })`. Senão o cache HTTP de 1 h devolveria o mesmo arquivo
    ruim.
  - Estado que o hook devolve:
    `ArquivoPublico<T> = { dados?: T; carregando: boolean; falhasSeguidas: number; semInternet: boolean; tentarDeNovo(): void }`.
    - O `erro` (texto técnico) deixa de existir.
    - `falhasSeguidas` volta a 0 quando dá certo e não zera durante uma nova tentativa.
    - `semInternet` = `navigator.onLine === false` no momento da falha.
    - `tentarDeNovo` não faz nada enquanto `carregando`.
- `useMunicipios(uf)` só monta o caminho se `ehUf(uf)` (**A6**).
- `useResumo` troca `erro` por `falhasSeguidas`, `semInternet`, `carregando` e `tentarDeNovo` (os das tarifas).
- Se a 002b já estiver no `main`, reescrever o `useArquivo` sem `setState` dentro do efeito, ou manter ali a exceção na
  forma da HIS-109.
- **Servidor** (`arquivos.servidor.ts`): `lerArquivoTarifas(JSON.parse(texto)).arquivo` e `lerRelatorioDosDados`.
  - `carregarNumerosDoInicio` **perde o `try/catch`**. Arquivo ruim faz o build falhar, e na revalidação o Next segue
    servindo a última versão boa, como pede a segurança.
  - Para rodar localmente sem dados, usar `pnpm dados:exemplo`.

### D5. Telas

**T1, aviso da casa salva**

- Componente `ui/AvisoDaCasaSalva.tsx`, com props `{ aviso?: AvisoDaCasaSalva; aoEntender(): void }`. A lista com
  plural e "e" mora nele.
- Aparece em três lugares: `Casca`, `PaginaInicial` (`/`) e `Cadastro` (`/comecar`). Na `/`, o `BotaoComecar` lê a
  casa. Se a pessoa entrar por ali e o aviso não aparecer, ela nunca o vê, porque a versão limpa já foi regravada.

**T1b, a cidade saiu e os aparelhos ficaram**

- A `Casca` deixa abrir `/casa/ajustes` sem `residencia` quando há cômodos ou aparelhos.
- A `TelaAjustes` sem `residencia` mostra só "Onde você mora", com "Escolher minha cidade" abrindo o `TrocarCidade`.
  A escolha chama `definirResidencia({ …, beneficio: "nao-sei", ligacao: "nao-sei" })`.
- Mandar para o `/comecar` faria o `criarCasa` apagar os aparelhos.

**T2, falha ao carregar**

- Componente `ui/AvisoFalhaDeCarga.tsx`, com as props `assunto` (preços, ou cidades de {estado}), `fraseDeSeguranca`,
  `falhasSeguidas`, `semInternet`, `carregando` e `aoTentarDeNovo`. Cuida também do foco quando volta a dar certo.
- Usado no `Cadastro`, no `PainelAcompanhamento` e também no `TrocarCidade`, que hoje fica em branco quando as cidades
  falham.
- O nome do estado vem de `ESTADOS`.

**Foco**

- `ui/foco.ts`: `focarTitulo()` põe o foco no `main h1`, com `tabIndex=-1`. Vale para o T1, o T2 e o T3.

**T3 e T4, erro geral e página não encontrada**

- `ui/TelaDeErro.tsx`, usada por `app/error.tsx` e `app/global-error.tsx`. Não usa store nem `error`.
- `global-error.tsx` tem `<html lang="pt-BR">`, importa `globals.css` e usa um `<a href="/">`.
- `app/not-found.tsx` mostra o T4.
- A frase da 2ª falha: o frontend confere se o estado do componente sobrevive a um `retry()` que falha. Se não
  sobreviver, guarda num módulo o instante do último toque: uma falha nova em até 10 s conta como a 2ª.

**T5 e T6, campos fora do limite e "Confere?"**: movido para a [HIS-003b](HIS-003b-campos-com-limite.md), "Desenho
técnico" (scrum-master, 2026-10-30).

**Links (A15)**

- `rel="noopener noreferrer"` nos 4 links externos.

### D6. Cabeçalhos (`apps/web/next.config.ts`)

- Lista `CABECALHOS_DE_SEGURANCA` com os 7 da tabela da segurança, na regra `source: "/:caminho*"`. A CSP é escrita
  como lista de diretivas unidas por `"; "`.
- `'unsafe-eval'` só com `process.env.NODE_ENV === "development"`.
- A regra do `Cache-Control` de `/dados/:caminho*` vem depois. As chaves são diferentes, então o Next aplica as duas:
  "same header key → last overrides", conforme `docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md`.
- Sem `proxy.ts` e sem nonce. Nenhuma rota muda de estática para dinâmica (R3).

### D7. CI, dependências e ambiente

- **`ci.yml`** (o que a 002a reescreveu no A6): no job "Lint, tipos e testes", logo depois do `pnpm install`, entra o
  passo `name: Vulnerabilidades (alta ou crítica)` / `run: pnpm audit --audit-level high`. Sem `|| true`.
- **`.github/dependabot.yml`:**

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule: { interval: weekly, day: monday }
    cooldown: { default-days: 7 }
    versioning-strategy: increase
    open-pull-requests-limit: 5
    ignore:
      # Casa com o Chromium do ambiente de nuvem (ADR-003): sobe junto, à mão.
      - dependency-name: "@playwright/test"
      - dependency-name: "@types/node"
        update-types: ["version-update:semver-major"]   # segue o Node 22 do projeto
    groups:
      desenvolvimento: { dependency-type: development, update-types: [minor, patch] }
      site: { dependency-type: production, update-types: [minor, patch] }
  - package-ecosystem: github-actions
    directory: "/"
    schedule: { interval: weekly, day: monday }
    cooldown: { default-days: 7 }
    groups:
      actions: { patterns: ["*"] }
```

- **`atualizar-dados.yml`**:
  - Topo com `permissions: {}`. Os gatilhos, o `concurrency` e o `cron` não mudam.
  - SHA conferidos em 2026-10-30 com `git ls-remote --tags` (os quatro primeiros são os do ADR-003):
    - checkout v7.0.1: `3d3c42e5aac5ba805825da76410c181273ba90b1`;
    - pnpm/action-setup v6.1.0: `ea17c68df8912ef543352723c149a84f56e3d413`;
    - setup-node v7.1.0: `949feb2413d6458794dcd2491c4babbbce0c15c1`;
    - upload-artifact v7.0.2: `cf430e030ddbb5b0abf93d22962f4752f3646cd9`;
    - **download-artifact v8.0.2: `9000827ccba6bdab643e8b6fd33ac0654aef8333`** (etiqueta leve, `node24`, entradas
      `name`/`path`).

```yaml
jobs:
  gerar:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions: { contents: read }
    outputs: { mudou: "${{ steps.conferir.outputs.mudou }}" }
    steps:
      - uses: actions/checkout@<sha> # v7.0.1
        with: { persist-credentials: false }
      - uses: pnpm/action-setup@<sha> # v6.1.0
      - uses: actions/setup-node@<sha> # v7.1.0
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: Atualizar dados
        env: { FORCAR: "${{ inputs.forcar }}" }          # nunca ${{ }} dentro do run:
        run: |
          set -o pipefail
          extra=""; if [ "$FORCAR" = "true" ]; then extra="--forcar"; fi
          pnpm dados:atualizar $extra 2>&1 | tee "$RUNNER_TEMP/atualizacao.log"
      - name: Publicar resumo da atualização          # igual a hoje, lendo de $RUNNER_TEMP
        if: always()
      - name: Conferir o que mudou
        id: conferir
        run: |
          fora=$(git status --porcelain --untracked-files=all | grep -v '^.. apps/web/public/dados/' || true)
          if [ -n "$fora" ]; then echo "::error::A rotina mexeu fora de apps/web/public/dados"; echo "$fora"; exit 1; fi
          if [ -z "$(git status --porcelain --untracked-files=all -- apps/web/public/dados)" ]; then echo "mudou=false" >> "$GITHUB_OUTPUT"; else echo "mudou=true" >> "$GITHUB_OUTPUT"; fi
      - if: steps.conferir.outputs.mudou == 'true'
        uses: actions/upload-artifact@<sha> # v7.0.2
        with: { name: dados, path: apps/web/public/dados/, retention-days: 1, if-no-files-found: error }
  publicar:
    needs: gerar
    if: needs.gerar.outputs.mudou == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions: { contents: write }
    steps:                                               # sem setup-node e sem pnpm install
      - uses: actions/checkout@<sha> # v7.0.1             (credencial mantida: precisa para o push)
        with: { ref: main }
      - run: rm -rf apps/web/public/dados                # o artefato substitui a pasta inteira (UF que some)
      - uses: actions/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333 # v8.0.2
        with: { name: dados, path: apps/web/public/dados }
      - name: Conferir e salvar no repositório
        run: |
          set -euo pipefail
          fora=$(git status --porcelain --untracked-files=all | grep -v '^.. apps/web/public/dados/' || true)
          [ -z "$fora" ] || { echo "::error::Artefato fora de apps/web/public/dados"; exit 1; }
          [ -z "$(find apps/web/public/dados -type f ! -name '*.json')" ] || { echo "::error::Arquivo que não é JSON"; exit 1; }
          find apps/web/public/dados -name '*.json' -print0 | xargs -0 -n1 jq -e 'type == "object"' > /dev/null
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add -A -- apps/web/public/dados
          git commit -m "dados: atualiza tarifas e bandeiras da ANEEL"
          git push
```

- **`apps/web/.env.example`**: só comentário, sem nenhuma variável. Diz que hoje o site não precisa de nenhuma, que os
  nomes do Supabase entram no E4 sempre sem valor, e que o valor de verdade fica na Vercel e no GitHub. O `.gitignore`
  já cobre isso (conferido).
- R11 muda: **o lockfile não muda** (nenhuma dependência nova).

### D8. Testes

**Unidade (Vitest)**

- `packages/core/test/limites.test.ts`: casos 1–23 do dominio-energia; bordas de cada `Faixa` (limite, limite + 1,
  `NaN`, `Infinity`); preço com Tarifa Social e com menos de 30 kWh; `periodosDeLeitura` acima de 1.800 por dia.
- `packages/core/test/entrada.test.ts`: `135,90`, `1.359,00`, `135.90`, `1.500`, `1,2,5`, `0x10`, `1e309`,
  `Infinity`, `-5`, vazio, espaços e 16 caracteres.
- `packages/core/test/casa-salva.test.ts`: todos os casos do R4/R4b:
  - `null`, `[]`, texto;
  - potência `-5`, `"100"` e 75.001;
  - nome com 10 000 caracteres;
  - id repetido;
  - `comodoId` que não existe;
  - `__proto__` e chave extra: o resultado não tem a chave e o protótipo é o normal;
  - 10 000 aparelhos: 500 ficam e 9 500 contam como descartados, em menos de 100 ms;
  - v1 sem listas: nenhum aviso;
  - os 2 consertos e a potência 10.001 não contam como descarte;
  - data no futuro é mantida;
  - casa válida igual com `toEqual`;
  - T1a, T1b e T1c.

  **"Igual" é igualdade de conteúdo.** Quando nada sai, os bytes não mudam, porque o arquivo não é regravado. Depois de
  um descarte, o que fica é regravado na ordem de campos do leitor. O zod faria o mesmo.
- `packages/core/test/arquivos-publicos.test.ts`:
  - estrutura errada lança;
  - tarifa `-1` ou texto: 1 entrada descartada;
  - `uf` trocada lança;
  - município sem IBGE: descartado.
- `packages/dados/test/formato.test.ts`:
  - os arquivos publicados em `apps/web/public/dados` passam com **0 descartes** (contra falso positivo);
  - `conferirFormato(montagem)` recusa a tarifa `-1` mesmo com `forcar`.

**e2e (qa; arquivos novos em `apps/web/e2e/`, nos dois projetos, salvo indicação)**

| Arquivo | O que prova |
| --- | --- |
| `cabecalhos.spec.ts` (só `computador`, `request`) | R1: `/`, `/casa`, `/sobre`, `/dados/tarifas.json`, um `/_next/static/…js` tirado do HTML e `/nao-existe` com os 7 cabeçalhos no valor exato, escritos no teste e não importados do `next.config.ts`; CSP sem `unsafe-eval` |
| `casa-salva.spec.ts` | (a) JSON quebrado: T1c em `/casa`, chave regravada, depois de recarregar sem aviso. (b) potência `-5` em 1 de 2 aparelhos: "Tiramos 1 aparelho." e o outro aparece. (c) `uf` `"../x"`: T1b, **nenhum pedido a `/dados/municipios`** (R7); "Escolher minha cidade" faz a casa voltar com os aparelhos. (d) `version` 99 válida: sem aviso. (e) 10 000 aparelhos: abre em menos de 5 s. (f) aviso também em `/` e `/comecar`. (g) `role="status"` presente e vazio no HTML do servidor |
| `dados-publicos.spec.ts` | `page.route`: `tarifas.json` com 500, HTML ou `{}`: T2a no cadastro e no painel; entrada com tarifa `-1` some e as outras ficam. "Tentar de novo" depois do `unroute`: o aviso some e o foco vai para o `h1`. 2ª falha: frase nova. `setOffline`: T2c. `municipios/SP.json` com 500: T2b com "São Paulo" |
| `erros.spec.ts` | `/nao-existe`: 404 + T4. `addInitScript` que faz `Intl.NumberFormat.prototype.format` lançar enquanto uma flag estiver ligada: T3 sem o texto do erro, foco no `h1`; desligar a flag + "Tentar de novo": a tela volta; "Voltar ao início" leva a `/` |
| `campos.spec.ts` | movido para a [HIS-003b](HIS-003b-campos-com-limite.md) |

- **Fixture:** a opção `errosEsperados: RegExp[]` (o 500 e o erro de render geram `console.error` de propósito) só vale
  se cada padrão aparecer. Assim ela não esconde outro erro.
- **CSP:** violação aparece no console como "Refused to…", e a fixture da 002a já reprova. Por isso o **R2 vale em
  todos os e2e**. Negativo permanente no `sanidade.spec.ts`: injetar `<img src="https://exemplo.invalid/x.png">`, com
  `test.fail()`.
- **`global-error`:** o qa confere à mão, numa cópia própria, com um `throw` temporário no layout raiz. Nada disso vai
  para o repositório.
- **axe:** entram os estados com T1, T2, T3 e T4 (o campo com erro e com alerta é da 003b).
- **Peso:** a referência `peso-js.json` muda de propósito no PR. Espero no máximo cerca de +3 kB gzip por rota
  (leitores com cerca de 1,3 kB, mais os avisos e a tela de erro). **Acima de +4 kB, falar comigo antes.**

### D9. Passos, quem faz, estimativa e riscos

São cerca de 3,75 dias, acima dos 3. **Proponho quebrar** (decisão do scrum-master):

- **HIS-003a "Dados quebrados não travam o site":** critérios 1, 2, 3, 4, 6 e 7, mais o `limites.ts` do critério 5.
- **HIS-003b "Campos com limite e Confere?":** critério 5 nas telas (T5 e T6).

**HIS-003a**

| Passo | Quem | O quê | Est. |
| --- | --- | --- | --- |
| a1 | backend | `limites.ts`, `entrada.ts`, `estados.ts`, regra de 1.800 kWh/dia + testes | 0,5 d |
| a2 | backend | `casa-salva.ts` + `DadosCasa` no core + testes (depende da P-tl-1) | 0,5 d |
| a3 | backend | `arquivos-publicos.ts` + `conferirFormato` na rotina (sem `--forcar`) + teste dos publicados (depende da P-tl-2) | 0,25 d |
| a4 | frontend | D3 (storage, `merge`, regravar, ações, `useAvisoDaCasaSalva`) + D4 (leitores, `uf`, `falhasSeguidas`, `no-cache`, servidor sem `catch`) | 0,5 d |
| a5 | frontend | T1 (3 lugares), T1b, T2 (3 lugares), T3/T4, `focarTitulo`, links `rel`, D6 | 0,5 d |
| a6 | backend | D7 (`ci.yml`, `dependabot.yml`, `atualizar-dados.yml`, `.env.example`); o tech-lead reconfere os SHA no dia | 0,25 d |
| a7 | qa | e2e da tabela (menos `campos`), fixture `errosEsperados`, negativo da CSP, axe, peso | 0,5 d |

Total da 003a: cerca de 3 dias, com o qa. O frontend pode adiantar o T3/T4 e o D6 enquanto o a1 e o a2 andam.

**HIS-003b**: passos b1–b3 movidos para a [HIS-003b](HIS-003b-campos-com-limite.md) (scrum-master, 2026-10-30).
Ela começa depois da 003a no `main`.

**Dependências**

- **Depende da 002a no `main`:** fixture, `ci.yml` com SHA e `peso-js.json`.
- **Não depende da 002b:**
  - nenhuma dependência nova, então o lockfile não muda;
  - nenhum import novo entre camadas;
  - os arquivos do core são planos.
- O conflito com a 002b é de uma linha no `ci.yml`. Quem integrar depois faz o rebase e passa no lint da outra; ver a
  nota do `useArquivo` no D4.
- Podem ser implementadas em paralelo, em branches separadas, e integradas uma de cada vez.

**Riscos**

1. **Falso positivo apagar dado de família** (o pior risco). Mitigações:
   - o rígido é o limite físico;
   - não há conferência de data no futuro;
   - o id só tem limite de tamanho;
   - os testes rodam contra os arquivos publicados e contra `casa-v1`/`casa-v2`.
2. **Mudança interna do `persist`** (o `merge` com `undefined`, o `migrate` só quando a versão muda, o `set` da
   hidratação que não grava). O PR do Dependabot do zustand passa pelo `casa-salva.spec.ts`.
3. **CSP quebrar o que o e2e não cobre.** O R2 vale em todos os testes.
4. **Peso.** Ver D8.
5. **O build passa a falhar com arquivo de dados ruim.** É de propósito; para rodar localmente, `pnpm dados:exemplo`.
6. **Memória do navegador cheia.** O `setItem` não salva e não avisa. Vai para o backlog: "avisar quando não der para
   salvar".

## Ameaças

_(seguranca, 2026-10-30)_ Ativo: a casa salva no aparelho (não tem dado pessoal, mas perder é perder o trabalho da
pessoa) e a confiança nos números. Quem ataca: dado corrompido (bug, versão antiga, extensão do navegador, quem mexe no
console), arquivo público quebrado (rotina com bug, deploy), dependência ou action comprometida.

**Provado hoje** (`scratchpad/seg-his003/prova-hidratacao.mjs`, zustand 5.0.16 do lockfile):
- **P1.** JSON ilegível na chave `eficiencia-energetica:casa`: o `JSON.parse` do `createJSONStorage` lança, o `persist`
  cai no `catch` e **nunca** marca `hasHydrated`. `useCasaCarregada()` fica `false` para sempre: `Casca`, `Cadastro` e
  `BotaoComecar` ficam presos. Apagar a chave à mão é o único jeito de sair.
- **P2.** Com a mesma `version` (2), o `migrate` **não é chamado**: `{"potenciaW":-5}` entra direto no estado. A
  validação no `migrate` sozinha não pega nada do dia a dia.

| # | Ameaça | Gravidade | Mitigação (decisão) |
| --- | --- | --- | --- |
| A1 | P1: JSON ilegível prende o site no carregamento | alta | `storage` próprio com `try/catch` no `JSON.parse`; falhou → casa vazia + aviso T1c |
| A2 | P2: item fora do formato (negativo, `NaN`, texto no lugar de número) passa sem `migrate` → conta errada ou exceção de render | alta | validar no `merge` (roda sempre), item por item; `migrate` só traduz versão e devolve para o mesmo validador |
| A3 | Campo extra / `__proto__` / spread do bruto (`...(salvo as Partial<DadosCasa>)`, `casa.ts` l. 125) | baixa | leitor à mão (ADR-004) monta objeto literal novo campo a campo, só com propriedade própria (`Object.hasOwn`); chave de `variantes` pela expressão do D2 (barra `__proto__`); sem spread, `Object.assign` nem `for…in` do bruto |
| A4 | Texto ou lista gigante (localStorage ou campo) trava celular fraco | média | limites do `limites.ts` em texto e número **e** máximo de itens por lista |
| A5 | `tarifas.json`/`municipios/{UF}.json` fora do formato → tela quebrada ou número errado | média | mesmo esquema no navegador e no servidor; nunca corrigir valor (ver regras) |
| A6 | `uf` lido do localStorage monta o caminho do `fetch` (`navegador.ts` l. 52): `../x` vira URL qualquer da mesma origem | baixa | só montar o caminho se `uf` estiver na lista das 27 UFs |
| A7 | Exceção de render sem `error.tsx`/`global-error.tsx` → tela branca | alta | as duas telas (T3), sem depender do store |
| A8 | Tela de erro mostra `error.message`: no Next 16 o erro de componente cliente chega com a mensagem original em produção (`error.md`, §`error.message`) | média | texto fixo; sem `message`, `digest`, pilha; sem serviço de erro de terceiro (exige consentimento) |
| A9 | Script por nome de cômodo/aparelho | baixa | React escapa; lint da HIS-002b; `maxLength`. A CSP com `'unsafe-inline'` **não** barra isto (risco aceito, ver CSP) |
| A10 | Script ou pedido para terceiro sem a pessoa saber | média | `connect-src 'self'`, `script-src` sem domínio externo; domínio novo na CSP = revisão de segurança |
| A11 | Clickjacking | baixa | `frame-ancestors 'none'` + `X-Frame-Options: DENY` |
| A12 | Rebaixamento para http, *sniffing* de tipo | baixa | HSTS, `nosniff` (também em `/dados/*.json`) |
| A13 | Dependência vulnerável ou versão maliciosa recém-publicada | média | `pnpm audit` no CI, Dependabot com espera (`cooldown`), versão exata, `onlyBuiltDependencies` só com revisão |
| A14 | `atualizar-dados.yml`: token com `contents: write` disponível para o `pnpm install` e o ETL inteiros; actions por etiqueta | média | actions por SHA (ADR-003) e dois jobs (ver CI) |
| A15 | Link externo sem `rel` (`app/sobre/page.tsx` l. 44, 50, 56; `PaginaInicial.tsx` l. 279) | baixa | `rel="noopener noreferrer"` nos 4 (hoje sem `target="_blank"`) |
| A16 | Segredo em commit | baixa | `.gitignore` já tem `.env`, `.env.*`, `!.env.example` (conferido); `.env.example` só com comentário |

### CSP: sem nonce, `'unsafe-inline'` em script e estilo

Por quê (doc `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md` + build atual):
- Nonce exige **todas** as páginas dinâmicas: sem estático, sem ISR, sem cache de CDN. Vai contra "internet fraca" e
  custo zero, e a `/` usa `revalidate`.
- Hash também não serve: toda página tem `<script>self.__next_f.push(...)</script>` inline (conferido em
  `.next/server/app/index.html`), com conteúdo que muda a cada build/revalidação. O `experimental.sri` só põe
  `integrity` nos `<script src>`; não cobre os inline. Não usar (experimental e não resolve).
- `style={...}` do React vira atributo `style="..."` no HTML (`Barras`, `Etiqueta`, `Movimento`, `PaginaInicial`…):
  sem `'unsafe-inline'` em `style-src` o visual quebra.
- Risco aceito (baixo): a CSP não barra script inline injetado. A barreira contra XSS é não ter onde injetar (React +
  lint). **Reabrir** (nonce em `proxy.ts`) quando entrar Auth/Supabase (E4) ou qualquer script de terceiro (E11).

Valor de produção (uma linha no cabeçalho):

```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;
font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none';
form-action 'self'; frame-ancestors 'none'
```

- `'unsafe-eval'` só com `NODE_ENV === "development"` (doc do Next). O e2e roda em `pnpm start`, então testa a de produção.
- Sem `upgrade-insecure-requests`: tudo é `'self'`, o HSTS já cobre, e o e2e roda em `http://127.0.0.1`.
- `connect-src 'self'` é o "nada sai do aparelho" no navegador de verdade (complementa a fixture da HIS-002a).

**Demais cabeçalhos**, em `headers()` com `source: "/:caminho*"` (vale para páginas, `/dados`, `/_next/static` e 404);
o `Cache-Control` de `/dados` continua na regra própria:

| Cabeçalho | Valor |
| --- | --- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` (sem `preload` até ter domínio próprio) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()` |
| `X-Frame-Options` | `DENY` (navegador antigo que ignora `frame-ancestors`) |
| `Cross-Origin-Opener-Policy` | `same-origin` |

O OCR futuro com `<input type="file" accept="image/*" capture>` não precisa de `camera`; ligar `camera=(self)` só com
história própria. Sem `X-XSS-Protection`. `poweredByHeader: false` fica.

### Regras de validação (o que descartar, o que manter)

**localStorage**
- Por item: cômodo, aparelho, conta, leitura e id do plano inválidos saem **um a um**; o resto fica. Inválido = tipo
  errado, número não finito ou fora da faixa do `limites.ts`, texto vazio ou acima do máximo, id repetido (fica o
  primeiro), aparelho com `comodoId` que não existe, `competencia` fora de `AAAA-MM`. Lista acima do máximo: ficam os
  primeiros N, o resto conta como descartado.
- "Fora da faixa" = o **rígido** de "Regras de negócio e fontes". Valor na faixa de **alerta** nunca é descartado.
- **Não corrigir valor** (sem `Math.min`/"clamp"): número fora do rígido tira o item. Conta errada é pior que conta
  ausente. Únicas exceções, as duas do dominio-energia, porque não inventam número: `kwhMesInformado` ≤ 0 → tira só o
  campo; `minutosPorDia` ≠ `banhos × minutos` → recalcula do `banho`. Conserto não conta como descarte no aviso.
- `residencia` inválida (UF fora das 27, IBGE sem 7 dígitos, distribuidora vazia) → sai só a `residencia` (T1b).
- `version` maior que a atual (deploy voltou): valida com o esquema atual, não zera.
- Depois de descartar, **gravar a versão limpa** (`setItem`): o `persist` só regrava sozinho depois de `migrate`, e o
  T1 diz que o aviso não volta. Sem cópia de reserva do bruto (minimização; ninguém recupera à mão).
- **Retorno do validador (pedido do ux para o T1)**, função pura, testada sem React:
  `{ casa: DadosCasa; descartados: { aparelhos: number; comodos: number; contas: number; leituras: number; plano: number };
  residenciaDescartada: boolean; ilegivel: boolean }`. Aparelho que sai junto com o cômodo descartado conta em
  `aparelhos`. `ilegivel` (JSON quebrado, raiz que não é objeto) ou nada aproveitável → T1c; só `residenciaDescartada`
  → T1b; algum número > 0 → T1a; tudo zero e `false` → nenhum aviso.
- Esse retorno fica só em memória (estado do store fora do `partialize`, nunca salvo), só com números e `boolean`: sem
  nome, valor nem id do que saiu. Nada disso vai para `console`/log.
- Escrita: as ações do store (`adicionarAparelho`, `atualizarAparelho` com `Partial`, `salvarConta`, `salvarLeitura`,
  `renomearComodo`, `alternarNoPlano`) recusam o que o esquema recusa. A tela não é a única porta (console, extensão).

**`/dados`**
- Mesmo esquema em `navegador.ts` (depois do `r.json()`) e em `arquivos.servidor.ts` (saem os `as`). No navegador, a
  falha vira o `erro` que já existe → T2 (o `cache` já apaga a promessa rejeitada, então "Tentar de novo" funciona).
- Estrutura errada (não é objeto, falta a lista, formato desconhecido) → o arquivo inteiro falha. Entrada individual
  inválida (tarifa ≤ 0, não finita ou fora da faixa do domínio; município sem IBGE) → sai só a entrada: a pessoa daquela
  cidade vê "não encontramos", nunca número inventado ou corrigido.
- Servidor: esquema inválido **lança** (não engole). No build o build falha; na revalidação o Next segue servindo a
  última versão boa.
- Rotina (`packages/dados`): roda o mesmo critério de formato antes de gravar; o `--forcar` pode aceitar variação
  estranha, nunca formato inválido.

**Limites (`packages/core/src/limites.ts`)**: faixas do dominio-energia. Segurança exige: todo texto com `maxLength`
igual ao máximo do esquema; todo número com mínimo, máximo e `Number.isFinite`; máximo de itens por lista. A leitura de
número rejeita `Infinity`, `NaN`, `1e309`, `0x10` e texto colado gigante.

~~**zod**: 4.6.7 … segurança aceita qualquer um.~~ Substituído (P-tl-1, 2026-10-30): leitores à mão no `@ee/core`
(ADR-004), com as condições R4c e R4d abaixo. Sem dependência nova; o lockfile não muda.

### CI e dependências

- `ci.yml`: passo `pnpm audit --audit-level high` sem `--prod` (as ferramentas de dev rodam no CI), sem `|| true` nem
  `continue-on-error`. Exceção só por `pnpm.auditConfig.ignoreGhsas`, com história e data para rever. Hoje: limpo.
- `.github/dependabot.yml`: `npm` e `github-actions`, os dois em `directory: "/"`, semanal, `cooldown: default-days: 7`
  (não pegar versão publicada há horas), `versioning-strategy: increase` (mantém versão exata), grupos para não lotar
  de PR. O PR do Dependabot passa pelo CI normal (token só leitura; nunca `pull_request_target`), merge à mão.
- `atualizar-dados.yml`: actions por SHA com a versão em comentário (como o ADR-003) e **dois jobs**: `gerar`
  (`contents: read`, `persist-credentials: false`, instala, roda o ETL, sobe `apps/web/public/dados` como artefato) e
  `publicar` (`contents: write`, **sem** `pnpm install`: baixa o artefato, confere que só mudou `apps/web/public/dados/`
  e faz o push). `permissions` por job, não no topo. O `${{ inputs.forcar … }}` dentro do `run:` passa por `env:`.

### Pontos da minha revisão (etapa 6)

| # | O que confiro | Esperado |
| --- | --- | --- |
| R1 | `curl -sI` em `pnpm start`: `/`, `/casa`, `/sobre`, `/dados/tarifas.json`, um `/_next/static/…js`, uma rota 404 | os 7 cabeçalhos com o valor exato acima; CSP sem `unsafe-eval` e sem domínio externo; e2e confere o mesmo |
| R2 | e2e em 390 e 1280 px com a CSP ligada, todas as rotas e as transições | zero `securitypolicyviolation` e zero "Refused to" no console |
| R3 | saída do `next build` antes × depois | nenhuma rota muda de estática/ISR para dinâmica; não existe `proxy.ts` |
| R4 | casos do localStorage (unidade + 1 e2e): JSON quebrado, `null`, `[]`, texto, `version` 1/2/99, potência `-5`/`"100"`/acima do máximo, nome com 10 000 caracteres, id repetido, `comodoId` inexistente, `__proto__` e chave extra, 10 000 aparelhos | site abre, só o inválido sai, versão limpa gravada, aviso uma vez; `prova-hidratacao.mjs` contra o storage novo dá `hasHydrated: true`. **"Igual" (P-tl-1 d):** `version` 2 sem aviso (inclui consertos, `pessoas` tirado e chave extra) → texto da chave **idêntico byte a byte** depois de hidratar (prova que não regrava à toa); com descarte → regravado com `version` 2 e cada item que ficou `toEqual` ao seu original do bruto; `version` 1 e 99 → o próprio `persist` regrava (`if (migrated) return setItem()`, `middleware.mjs` do zustand 5.0.16), conteúdo `toEqual`, sem aviso se tudo é válido |
| R4c | leitores completos (risco novo do leitor à mão) | em cada leitor, lista de campos com checagem de tipo `Exclude<keyof T, (typeof CAMPOS)[number]>` = `never` (campo novo no tipo sem leitor quebra o `typecheck`); fixture `casa-completa` com **todo** opcional preenchido (`contaReferencia`, `pessoas`, `catalogoId`, `banho`, `fatorCiclo`, `variantes`, `kwhMesInformado`) passa `toEqual` em `lerCasaSalva` e num ciclo hidratar → ação → salvar; texto devolvido **sem `trim`** (confere `trim().length > 0`, devolve o original) |
| R4d | leitor total (nunca lança) | se o `merge` lança, o `persist` cai no `catch` e não marca `hasHydrated` (P1 de volta); teste com os casos do R4 + 1.000 valores JSON gerados com semente fixa, sem biblioteca: nenhum lança; `merge` com `try/catch` que, se lançar, deixa a casa vazia em memória com T1c **sem regravar**; data conferida por componentes UTC (`Date.UTC` + comparar ano/mês/dia), nunca `Date.parse`/`new Date(texto)`; tamanho conferido antes de qualquer expressão regular |
| R4b | retorno do validador nos mesmos casos + alerta (potência 10.001) e os 2 consertos | contagem certa por tipo, `residenciaDescartada`/`ilegivel` certos, T1a/T1b/T1c certos; alerta e conserto **não** contam; retorno fora do localStorage e só com números/`boolean` |
| R5 | `infraestrutura/` | nenhum `as` sobre dado de fora; `migrate` sem spread do bruto |
| R6 | `/dados` ruim via `page.route` (vazio, HTML, estrutura errada, tarifa `-1`/texto) e leitor do servidor em teste | T2 com "Tentar de novo" que funciona depois de restaurar; leitor do servidor lança |
| R7 | `uf` fora das 27 no localStorage | nenhum `fetch` de municípios |
| R8 | componente que lança (só em teste) em página e no layout | T3 sem texto do erro; `retry` chamado; "Voltar ao início" leva a `/`; nenhum pedido novo de rede |
| R9 | `limites.ts` | único lugar; `maxLength` = máximo do esquema; testes de borda (limite, limite + 1, vazio, gigante) |
| R10 | `ci.yml`, `dependabot.yml`, `atualizar-dados.yml` | como em "CI e dependências"; nenhuma action por etiqueta |
| R11 | `pnpm audit`, `pnpm-lock.yaml` | limpo; `pnpm-lock.yaml` **sem mudança** (sem zod, ADR-004); nenhum script de instalação novo |
| R12 | `grep -rn 'href="http' apps/web/src` | todos com `rel="noopener noreferrer"` |
| R13 | `.env.example`, `git log -p` por padrões de chave | sem valor; sem achado |

## Regras de negócio e fontes

_dominio-energia, 2026-10-30. Base para `packages/core/src/limites.ts`. Dois níveis:_
_**rígido** = valor impossível ou corrompido: a tela não deixa salvar e a validação do localStorage descarta o item;_
_**alerta** = possível, mas raro (quase sempre erro de digitação): a tela pergunta "Confere?" e salva se a pessoa confirmar._
_Alerta nunca descarta dado salvo. Os limites são inclusivos (mín ≤ x ≤ máx). Consultas feitas em 2026-10-30._

| Campo | Tipo | Rígido (mín – máx) | Alerta | Fonte / justificativa |
| --- | --- | --- | --- | --- |
| `potenciaW` | W, inteiro | 1 – 75.000 | > 10.000 | Máx.: uma casa do grupo B (tensão < 2,3 kV) tem no máximo 75 kW de carga (REN ANEEL 1.000/2021, art. 23, I, "a"); um aparelho não passa da casa inteira. Alerta: maior faixa do catálogo (`outro` até 10.000; chuveiro até 7.800; carro elétrico até 7.400). Mín.: menor potência do catálogo é 2 W. Hoje `EditorAparelho.tsx` corta em 30.000: passa a usar o limite. |
| `minutosPorDia` | min, inteiro | 1 – 1.440 | — | 24 h × 60 (física). Igual a `TempoUso.tsx`; modo etiqueta usa 1.440. |
| `diasPorSemana` | número (fração) | 7/30 – 7 | — | Menor opção é "1 vez por mês" (`FREQUENCIAS`). Comparar com tolerância de 0,001 por causa da fração. |
| `banho.banhosPorDia` / `banho.minutosPorBanho` | inteiros | 1 – 20 / 1 – 60 | — | Iguais à tela. Regra: `minutosPorDia = banhos × minutos` (máx. 1.200). |
| `quantidade` | inteiro | 1 – 60 | — | Igual a `EditorAparelho`. 0 só existe no rascunho do cadastro (desmarcado, não é salvo). Telas podem mostrar máximo menor (30 e 40 hoje), nunca maior. |
| `fatorCiclo` | fração | > 0 e ≤ 1 | — | Parte do tempo com o motor ligado; o catálogo usa 0,3 a 1. |
| `kwhMesInformado` (etiqueta) | kWh/mês, decimal | 0,1 – 300 | > 150 | Catálogo vai de 15 (purificador) a 115 (side by side antiga). O maior compressor da `faixaW` de geladeira/freezer (250 W) ligado o mês todo dá 250 W × 720 h = 180 kWh: acima de 300 é erro. |
| Conta: kWh (`ContaMensal.kwh`, `contaReferencia.kwh`) | kWh, decimal | 0 – 54.000 (calibração: ≥ 1) | > 2.000 | Máx. físico do grupo B: 75 kW × 24 h × 30 dias = 54.000 kWh (REN 1.000/2021, art. 23). Alerta: cerca de 11 vezes a média residencial do país, 178,2 kWh/mês em jun/2025 (EPE, Boletim Trimestral de Consumo nº 22). 0 é possível (casa fechada). |
| Conta: valor (R$) | 2 casas | 0 – 200.000 (calibração: > 0) | > 3.000 | 0 é possível com Tarifa Social. Máx.: 54.000 kWh × R$ 3,00 = R$ 162.000, arredondado para cima. Alerta: 2.000 kWh × R$ 1,50. |
| Preço implícito da conta (valor ÷ kWh) | R$/kWh | — | fora de 0,30 – 3,00 | **Estimativa**, só quando kWh ≥ 30 e o benefício não é Tarifa Social. Tarifas B1 sem impostos em `tarifas.json` (ANEEL, gerado em 29/10/2026) vão de R$ 0,353 a R$ 1,569; maior bandeira já cobrada R$ 0,142 (escassez hídrica); com ICMS, PIS/COFINS e iluminação pública fica abaixo de R$ 3,00. Serve para pegar vírgula no lugar errado. |
| Leitura do relógio (`valorKwh`) | kWh, inteiro | 0 – 999.999 | — | Justificativa, sem norma consultada: o mostrador do relógio tem de 4 a 6 dígitos. |
| Consumo entre duas leituras | kWh/dia | máx. 1.800 (acima disso, o período é ignorado, como já acontece com leitura que diminui) | > 100 | 75 kW × 24 h = 1.800 kWh/dia (REN 1.000/2021, art. 23). Alerta: cerca de 17 vezes a média (178,2 ÷ 30 ≈ 5,9 kWh/dia). |
| `pessoas` | inteiro | 1 – 20 | — | Média de 2,79 moradores por domicílio (IBGE, Censo 2022); 20 combina com o máximo de banhos por dia. A tela vai até 15 hoje: passa a usar o limite. |
| Cômodos | inteiro | 0 – 10 por tipo no cadastro; 1 – 80 no total | — | Limite técnico (8 tipos × 10, como o cadastro já faz), não é regra do setor. |
| Consumo estimado da casa | kWh/mês | — | > 2.000 | Mesmo alerta da conta; pega potência digitada com um zero a mais. |

Conserto sem perda (não descartar): `kwhMesInformado` ≤ 0 → remover o campo (volta ao cálculo potência × tempo, como `consumoMensalKwh` já faz);
`minutosPorDia` diferente de `banhos × minutos` → recalcular a partir do `banho`. Datas: competência e leitura nunca no futuro (já é assim na tela).

Fontes: [REN ANEEL 1.000/2021](https://www2.aneel.gov.br/cedoc/ren20211000.pdf) (texto conferido na cópia publicada pela
[Cemig](https://www.cemig.com.br/wp-content/uploads/2025/08/ren20211000.pdf)); EPE, Boletim Trimestral de Consumo de Eletricidade nº 22
(conferido na [cópia da epbr/eixos](https://uploads.eixos.com.br/2025/09/Boletim-Trimestral-de-Consumo-de-Eletricidade-ANO-VI-No22_r.pdf); trocar pelo link da EPE quando houver);
IBGE, Censo 2022, [Agência de Notícias](https://agenciadenoticias.ibge.gov.br/agencia-noticias/2012-agencia-noticias/noticias/37238-pais-tem-90-milhoes-de-domicilios-34-a-mais-que-em-2010)
(a página não abriu na consulta; o valor 2,79 foi conferido em reportagem que cita o IBGE); `apps/web/public/dados/tarifas.json` (ANEEL, dados abertos).

### Limites prontos para as mensagens do T5 (`{min}` e `{max}`)

O `limites.ts` guarda o número em W, kWh, R$ ou minutos. A mensagem formata com a função indicada. Conferido com `formatacao.ts`.

| Mensagem (T5) | `{min}` | `{max}` | Como formatar |
| --- | --- | --- | --- |
| Potência | 1 W | 75.000 W | `formatarWatts`. **Confirmado: o limite é 75.000 W, não 30.000.** O corte escondido `Math.min(30000)` do `EditorAparelho.tsx` sai. Acima de 10.000 W entra o alerta |
| Consumo na etiqueta (o texto já diz "por mês") | 0,1 kWh | 300 kWh | `formatarKwh` (mostra 0,1 com uma casa e 300 sem casa) |
| Consumo da conta: cadastro e ajustes (calibração) | 1 kWh | 54.000 kWh | `formatarKwh` |
| Consumo da conta: acompanhamento | 0 kWh | 54.000 kWh | `formatarKwh` |
| Valor da conta: cadastro e ajustes (calibração) | R$ 0,01 | R$ 200.000,00 | `formatarReais` |
| Valor da conta: acompanhamento | R$ 0,00 | R$ 200.000,00 | `formatarReais` |
| Tempo de uso por dia (se ficar digitável) | 1 minuto | 24 horas | **Texto fixo, não `formatarTempo`**: ele escreve "1 min" e "o dia todo", e a frase ficaria "vai de 1 min a o dia todo por dia" |
| Cada banho (o texto já diz "minutos") | 1 | 60 | número puro |

Os quatro valores de conta mudam conforme a tela (calibrar precisa de conta com consumo e valor; o acompanhamento aceita casa fechada e conta zerada da Tarifa Social).
Por isso o `limites.ts` deve ter `contaKwh` e `contaValor` com `min` próprio para cada uso, e não um `min` só.

### Casos de teste de negócio (bordas)

| # | Entrada | Esperado |
| --- | --- | --- |
| 1 | potência 0; −5; `NaN`; texto | rígido: não salva; no localStorage, aparelho descartado |
| 2 | potência 1; 10.000 | aceita, sem alerta |
| 3 | potência 10.001; 75.000 | aceita com alerta |
| 4 | potência 75.001 | rígido |
| 5 | chuveiro digitado 55.000 W (queria 5.500) | alerta de potência. Conta: 55 kW × 32/60 h × 30 = 880 kWh/mês (não chega ao alerta da casa; quem pega é o da potência) |
| 6 | `outro` 10.000 W, 60 min, 7 dias, qtd 1 | 10 kW × 1 h × 30 = 300 kWh/mês, sem alerta |
| 7 | minutos 0 / 1 / 1.440 / 1.441 | rígido / aceita / aceita / rígido |
| 8 | dias 0,2 / 7/30 / 7 / 7,01 | rígido / aceita / aceita / rígido |
| 9 | banho 20 × 60 | aceita, `minutosPorDia` = 1.200. Banho 21 × 8 → rígido |
| 10 | salvo: banho {4, 8} com `minutosPorDia` 50 | recalcula para 32, não descarta |
| 11 | quantidade 0 / 2,5 / 61 no localStorage | descarta o aparelho; 60 aceita |
| 12 | etiqueta 0 / 0,1 / 150 / 150,1 / 300 / 300,1 | remove o campo / aceita / aceita / alerta / alerta / rígido |
| 13 | conta 150 kWh, R$ 135,90 | preço 135,90 ÷ 150 = R$ 0,906/kWh, sem alerta |
| 14 | conta 150 kWh, R$ 1.359,00 | R$ 9,06/kWh → alerta de preço |
| 15 | conta 150 kWh, R$ 13,59 | R$ 0,0906/kWh → alerta de preço |
| 16 | Tarifa Social, conta 100 kWh, R$ 15,00 | sem alerta de preço (regra não se aplica); calibração: 15 ÷ (100 − 80) = R$ 0,75/kWh |
| 17 | conta 2.000 kWh / 2.000,1 kWh / 54.000 / 54.001 | aceita / alerta / alerta / rígido |
| 18 | conta R$ 0 (acompanhamento) / R$ 200.000,01 | aceita (não serve para calibrar) / rígido |
| 19 | leituras 12.340 (dia 1) → 12.375 (dia 8) | 35 ÷ 7 = 5 kWh/dia, sem alerta |
| 20 | 12.340 → 13.040 / 13.047 em 7 dias | 700 ÷ 7 = 100/dia, sem alerta / 707 ÷ 7 = 101/dia, alerta |
| 21 | 12.340 → 24.940 / 24.947 em 7 dias | 12.600 ÷ 7 = 1.800/dia, aceita com alerta / 1.801/dia, período ignorado |
| 22 | leitura 1.000.000 | rígido |
| 23 | pessoas 0 / 1 / 20 / 21 | rígido / aceita / aceita / rígido |

Riscos: (1) relógio que "dá a volta" (99.999 → 00.012) hoje cai em "leitura que diminui" e é ignorado: aceitável, mas a tela deve explicar;
(2) relógio digital com casa decimal: a tela aceita só número inteiro, então a ajuda deve dizer para ignorar o que vem depois da vírgula (ux);
(3) o alerta de preço é estimativa, não regra: o texto deve perguntar, nunca afirmar que a conta está errada.

### Faixas dos arquivos públicos (P-tl-2)

_dominio-energia, 2026-10-30. Rígido de `lerArquivoTarifas`: a entrada fora da faixa sai e conta em `descartados`.
Conferido no `tarifas.json` publicado (gerado em 29/10/2026: 114 distribuidoras e 142 meses de bandeira, de 2015-01 a 2026-10)._

| Campo | Rígido | No arquivo de hoje (menor – maior) | Folga e porquê |
| --- | --- | --- | --- |
| `tarifaKwh` (R$/kWh, sem impostos) | **> 0,05** e ≤ 3,00 | 0,35264 (CERR, vigência de 2014) – 1,56923 (CERES, REH 1.454/2026) | O teto é 1,9 vez a maior tarifa. **O piso muda de "> 0" para "> 0,05".** Assim ele pega a divisão por 1.000 feita duas vezes (0,00088), e é o mesmo corte que a rotina já faz em `packages/dados/src/aneel/tarifas.ts` (`total <= 0.05`). |
| `teKwh` | 0 – 3,00 | 0,04105 (CEA) – 0,40556 (CERES) | 7 vezes a maior. O 0 entra porque a tarifa total já tem piso. |
| `tusdKwh` | 0 – 3,00 | 0,18892 (CNEE, de 2017) – 1,16367 (CERES) | 2,6 vezes a maior. |
| Coerência (nova) | \|`teKwh` + `tusdKwh` − `tarifaKwh`\| ≤ 0,00001 | diferença máxima de 0,000001 (`montar.ts` arredonda cada valor para 6 casas) | Pega `tarifaKwh` alterado à mão ou por extensão, que a faixa sozinha deixa passar. |
| `adicionalKwh` (R$/kWh) | 0 – 1,00 | 0 – 0,142 (escassez hídrica, set/2021 a mar/2022). Maior bandeira comum: 0,09492 (vermelha 2, jul e ago/2021). Hoje: amarela 0,01885, vermelha 1 0,04463, vermelha 2 0,07877 | 7 vezes a maior já cobrada. Pega R$/MWh sem dividir (142) e R$/100 kWh (14,2). |
| Coerência (nova) | `verde` = 0; as outras > 0 | todas as 142 linhas passam | Toda bandeira que não é a verde tem acréscimo. A rotina já põe 0 na verde (`bandeiras.ts`). |

Com essas regras, o arquivo publicado hoje passa inteiro (`descartados` = 0).

**Casos de teste (qa e backend, `arquivos-publicos.test.ts`)**

| # | Entrada | Esperado |
| --- | --- | --- |
| P1 | `tarifaKwh` 0,05 / 0,050001 / 3,00 / 3,000001 | sai / fica / fica / sai |
| P2 | `tarifaKwh` 875,71 (R$/MWh sem converter) / 0,00087571 (dividido duas vezes) | sai / sai |
| P3 | `teKwh` 0 / −0,01; `tusdKwh` 3,01 | fica / sai / sai |
| P4 | `teKwh` 0,28111 + `tusdKwh` 0,5946 com `tarifaKwh` 0,87571 / 0,9 | fica / sai (incoerente) |
| P5 | `adicionalKwh` 0,142 / 1,00 / 1,000001 / 142 / 14,2 / −0,01 | fica / fica / sai / sai / sai / sai |
| P6 | `amarela` com 0; `verde` com 0,01885 | sai / sai |
| P7 | `tarifas.json` publicado hoje | lê sem erro, `descartados` = 0 |

**Para o backend (não bloqueia):**
- (a) Trocar o corte `total <= 0.05 || total > 5` de `tarifas.ts` por `validarFaixa(LIMITES.tarifaKwh, …)`. Assim fica um
  lugar só. Hoje uma tarifa de R$ 4,00 passaria pela rotina e derrubaria o processo no leitor estrito.
- (b) Risco no `divisorDaUnidade` (`bandeiras.ts`): se a ANEEL publicar só meses com valor até 20 R$/MWh (verde e
  amarela), a amarela 18,85 seria lida como R$/100 kWh. Daria 0,1885, 10 vezes o certo, e passaria no rígido de 1,00.
  Sugestão: no `validar()` de variação (aceita `--forcar`), dar erro se algum `adicionalKwh` passar de 0,15. Isso fica
  um pouco acima da maior bandeira já cobrada.

**Fontes (consultadas em 30/10/2026):**
- ANEEL, dados abertos: [Tarifas de aplicação](https://dadosabertos.aneel.gov.br/dataset/tarifas-distribuidoras-energia-eletrica)
  e [Bandeiras Tarifárias, acionamento](https://dadosabertos.aneel.gov.br/dataset/bandeiras-tarifarias). Daí saem todos
  os valores, inclusive o 142 R$/MWh da escassez hídrica, lidos no `tarifas.json` de 29/10/2026.
- ANEEL, [Sobre Bandeiras Tarifárias](https://www.gov.br/aneel/pt-br/assuntos/tarifas/bandeiras-tarifarias): valores de
  hoje, R$ 1,885, R$ 4,463 e R$ 7,877 por 100 kWh.
- ANEEL, [FAQ da Bandeira Escassez Hídrica](https://www.gov.br/aneel/pt-br/assuntos/noticias/2022/faq-tire-suas-duvidas-sobre-a-bandeira-escassez-hidrica):
  vigência de setembro de 2021 a abril de 2022, por determinação da CREG. O valor de R$ 14,20 por 100 kWh foi conferido no
  arquivo da ANEEL e na [Canal Solar](https://canalsolar.com.br/aneel-anuncia-bandeira-escassez-hidrica-com-r-1420-a-cada-100-kwh-consumidos/),
  que não é fonte oficial.

### Achado: tarifas vencidas (P-de-1, alto, fora da P-tl-2)

Onze distribuidoras do `tarifas.json` têm a última tarifa vencida entre 2016 e 2023. Mesmo assim, elas aparecem como
distribuidora de cerca de 200 municípios em `municipios/{UF}.json`, e em muitos deles são a única opção. São elas:
CERR (fim em 2016), CFLO, CNEE, EDEVP e EEB (2017), CPFL Leste Paulista, CPFL Mococa e CPFL Sul Paulista (2018),
RGE Sul (2019), ENF e EBO (2023).

Exemplos:

| Município | Tarifa mostrada hoje | Tarifa da sucessora | Diferença |
| --- | --- | --- | --- |
| Alegrete (RS) | RGE Sul, de 2019: R$ 0,54732 | RGE: R$ 0,94461 | conta mostrada 42% menor |
| Assis (SP) | EDEVP, de 2017: R$ 0,44471 | ESS (Energisa Sul-Sudeste): R$ 0,81424 | conta mostrada 45% menor |

A faixa rígida não pega isso, porque o valor é plausível, só que velho. Por isso:
- **Veto:** o número está errado e chega à família.
- **Proposta para uma história nova:**
  - (1) A rotina descarta a tarifa cuja `fimVigencia` acabou há mais de 12 meses, porque o reajuste é anual.
  - (2) Uma tabela de sucessoras troca a empresa incorporada pela atual.

Sucessoras prováveis, porque o fim de uma vigência e o começo da outra caem em dias seguidos:
- RGE Sul → RGE;
- EDEVP, CNEE, EEB e CFLO → ESS;
- as 3 CPFL → CPFL Santa Cruz, que tem o mesmo CNPJ da CPFL Jaguari;
- ENF → EMR;
- EBO → EPB;
- CERR → Âmbar Roraima.

**Ainda não confirmei isso no cadastro de agentes da ANEEL.** Confirmar antes de implementar.

## Perguntas abertas

- [x] `[para: ux-acessibilidade]` Texto do aviso quando parte dos dados salvos foi descartada.
  **Resposta (ux, 2026-10-30):** ver "Fluxo e textos", T1 (três casos: saiu uma parte, saiu a cidade, não sobrou
  nada). `Aviso tom="faisca"`, `role="status"` já presente e vazio antes de o texto chegar. Para isso, a validação
  precisa devolver **quantos itens de cada tipo** saíram (aparelho, cômodo, conta, leitura, plano) e se a `residencia`
  saiu. `[para: seguranca]` incluir isso no retorno do `migrate`/`merge`.
- [x] `[para: dominio-energia]` Faixas aceitáveis: potência (W), minutos por dia, kWh da conta e valor da conta.
  **Resposta (dominio-energia, 2026-10-30):** ver "Regras de negócio e fontes" (tabela com rígido e alerta, fontes e 23 casos de borda).
- [x] `[para: ux-acessibilidade]` Texto do **alerta** ("Confere?"), para valor possível mas raro (potência > 10.000 W, conta > 2.000 kWh,
  preço da conta fora de R$ 0,30 a R$ 3,00 por kWh etc.). Ele pergunta e deixa salvar, diferente da mensagem de "fora da faixa" do T5.
  **Resposta (ux, 2026-10-30):** ver "Fluxo e textos", T6: o texto de cada campo, "Sim, está certo" / "Corrigir",
  salvar só depois de confirmar, foco e leitor de tela. No T5 entraram o `{min}` da conta por tela e o texto fixo do
  tempo por dia.
- [x] `[para: seguranca]` **P-tl-1** (bloqueia o a2). Preciso da confirmação de quatro decisões:
  - (a) leitores escritos à mão no core no lugar do zod (D1; A3 garantido pela construção campo a campo);
  - (b) `contaReferencia` inválida sai sozinha e conta em `contas`, e `pessoas` inválido sai sem aviso;
  - (c) o leitor não descarta data no futuro (relógio do celular errado);
  - (d) "igual" no R4 é igualdade de conteúdo depois de regravar; byte a byte só quando nada sai.

  **Resposta (seguranca, 2026-10-30):** as quatro confirmadas; (a) com as condições R4c e R4d; (d) com a regra exata
  escrita no R4. O a2 está liberado. Ver a nota na "Conversa da equipe".
- [x] `[para: dominio-energia]` **P-tl-2** (bloqueia o a3). Faixa rígida dos arquivos da ANEEL. Proposta:
  - `tarifaKwh` > 0 e ≤ R$ 3,00 (a tarifa sem impostos fica abaixo do teto com impostos que vocês citaram);
  - `teKwh`/`tusdKwh` entre 0 e 3;
  - `adicionalKwh` da bandeira entre 0 e R$ 1,00 (a maior já cobrada foi 0,142).

  Confirmar ou corrigir, com a fonte.
  **Resposta (dominio-energia, 2026-10-30):** confirmado, com dois ajustes: piso da tarifa > 0,05 (não > 0) e
  duas regras de coerência (TE + TUSD = tarifa; verde = 0 e as outras > 0). Ver "Faixas dos arquivos públicos (P-tl-2)"
  em "Regras de negócio e fontes". O a3 está liberado.
- [ ] `[para: tech-lead]` `[para: scrum-master]` **P-de-1** (não bloqueia a HIS-003, mas é número errado chegando à
  família hoje). Tarifas vencidas há anos estão no ar. Ver "Achado: tarifas vencidas" em "Regras de negócio e fontes".
  Peço uma história própria, com prioridade alta.
- [x] `[para: scrum-master]` **P-tl-3**. Quebrar em HIS-003a e HIS-003b, como está no D9?
  **Resposta (scrum-master, 2026-10-30):** sim, como no D9. 003a = critérios 1, 2, 3, 4, 6, 7 e o 5 só no domínio
  (este arquivo); 003b = critério 5 nas telas e o critério 8 novo (T6), em `HIS-003b-campos-com-limite.md`. Ordem:
  002a → 003a ‖ 002b → 003b. Ver a nota na "Conversa da equipe".
- `[para: ux-acessibilidade]` (não bloqueia; para o frontend saber o que fazer):
  - o T2b também entra no `TrocarCidade` dos ajustes, com a frase "Sua casa continua salva.";
  - o T1b leva para `/casa/ajustes`, que passa a abrir sem cidade (D5).

## Conversa da equipe

### [scrum-master] 2026-10-29 — história refinada
- O que fiz: critérios de aceite a partir da análise do código atual (leitura sem validação em `lib/store.ts` e `lib/dados.ts`).
- Para o próximo (seguranca + dominio-energia + ux-acessibilidade): completar ameaças, faixas e textos. Fazer depois da HIS-001 para os arquivos já estarem no lugar novo.

### [ux-acessibilidade] 2026-10-30 — textos de aviso, erro e limites (T1 a T5); pergunta respondida

**O que fiz**
- Escrevi em "Fluxo e textos" os textos finais de:
  - T1: dados descartados;
  - T2: falha nos preços ou nas cidades, com "Tentar de novo";
  - T3: `error.tsx` e `global-error.tsx`;
  - T4: `not-found.tsx`;
  - T5: campos fora do limite.
- Para cada um: onde aparece, o componente de `ui/` e os requisitos de acessibilidade.
- Respondi a pergunta aberta.

**Decisões**
- Dados descartados usa `faisca`/`status`, não `alerta`: a pessoa não errou.
- Um texto só para internet e para arquivo fora do formato.
- Erro de campo aparece ao sair do campo, nunca a cada tecla.
- O número fora da faixa não é corrigido escondido (sai o `Math.min(30000)` da potência).
- "Ver o resultado" deixa de ficar desabilitado.

**`[para: seguranca]`** A validação devolve a contagem por tipo do que saiu e se a `residencia` saiu (é o que alimenta
o T1).

**`[para: dominio-energia]`** `{min}` e `{max}` com unidade, prontos para `formatarWatts` / `formatarKwh` /
`formatarReais`.

**Para o frontend conferir**
- `role="status"` presente e vazio antes da leitura da casa.
- Foco no `h1` depois de "Entendi", depois do "Tentar de novo" que deu certo e ao abrir o `error.tsx`.
- `retry()`, não `reset()`.
- `global-error` importa `globals.css`.
- `Campo` com `erro`, ids de erro e ajuda, `aria-invalid` e `aria-describedby`.
- Botões com 48 px.
- `/casa/ajustes` funciona sem `residencia` (T1b). Se não funcionar, o botão do T1b leva para `/comecar`.

**Para o qa:** e2e com localStorage adulterado (T1a, T1b e T1c) e com `/dados` respondendo 500 e JSON inválido (T2),
nos dois projetos. Eu reviso as capturas.

**Próximo:** seguranca e dominio-energia terminam as partes deles; depois o tech-lead fecha o desenho técnico.

**Acréscimo (2026-10-30, depois das faixas do dominio-energia)**
- T6 "Confere?" escrito: textos por campo e mais o aviso da casa acima de 2.000 kWh.
  - Botões "Sim, está certo" e "Corrigir".
  - Salva só depois de confirmar.
  - Nenhum botão recebe o foco sozinho.
  - Sem `aria-invalid`.
- T5 ajustado:
  - `{min}` da conta por tela, mais a mensagem para conta zerada na calibração, com o caminho "Pular";
  - tempo por dia com texto fixo.
- `[para: tech-lead]` `Campo` ganha `alerta` além de `erro`. `validarFaixa` → `"alerta"` alimenta o T6.

### [dominio-energia] 2026-10-30 — faixas de entrada com fonte; pergunta respondida

**O que fiz**
- Escrevi "Regras de negócio e fontes": faixa de cada campo em dois níveis (rígido e alerta), com fonte, e 23 casos de
  borda com a conta feita à mão.
- Conferi contra o catálogo e as telas atuais. Nada contradiz o catálogo: todas as faixas `faixaW`, `kwhMes` e os tempos
  típicos ficam dentro do rígido e abaixo do alerta.

**Decisões**
- O teto rígido vem do limite físico de uma casa do grupo B: 75 kW (REN ANEEL 1.000/2021, art. 23). Dele saem a potência
  máxima, 54.000 kWh/mês e 1.800 kWh/dia. Erro de digitação provável vira **alerta** (pergunta e deixa salvar), nunca
  bloqueio nem descarte.
- O alerta de preço da conta (R$ 0,30 a R$ 3,00 por kWh) é **estimativa**. Não vale com Tarifa Social nem com menos de 30 kWh.
- Ao ler o localStorage, dois campos são consertados em vez de descartados: etiqueta ≤ 0 e minutos do chuveiro
  diferentes de banhos × minutos.
- Mudanças na tela, com o mesmo limite: potência sai de 30.000 para 75.000 (com alerta acima de 10.000) e pessoas sai
  de 15 para 20.

**`[para: tech-lead]`** Sugestão de forma: `LIMITES.potenciaW = { min: 1, max: 75_000, alerta: 10_000, inteiro: true }`
e assim por diante, sempre em W, kWh e R$, com comentário da fonte em cada linha. Assim o ux formata `{min}`/`{max}`
com `formatarWatts`, `formatarKwh` e `formatarReais`. Funções puras no core: `validarFaixa(campo, valor)` →
`"ok" | "alerta" | "fora"`, mais `alertaPrecoConta(conta, beneficio)`. Testes no Vitest com os casos 1 a 23.

**`[para: ux-acessibilidade]`** Respondi o pedido de `{min}`/`{max}` com unidade: ver "Limites prontos para as mensagens
do T5". Confirmei que a potência vai até 75.000 W, e não 30.000. Duas coisas para ajustar no T5:
- (a) conta e valor têm `{min}` diferente no cadastro/ajustes e no acompanhamento;
- (b) o tempo por dia usa texto fixo, porque `formatarTempo(1440)` dá "o dia todo".

Ainda falta o texto do alerta "Confere?", que está em Perguntas abertas.

**Próximo:** tech-lead fecha o desenho de `limites.ts`; seguranca usa a tabela nos esquemas zod; qa usa os casos 1 a 23.

### [seguranca] 2026-10-30 — análise de ameaças: aprovado para implementar

**O que fiz**
- Seção "Ameaças": tabela A1–A16, decisão da CSP, demais cabeçalhos, regras de validação, CI e pontos R1–R13 (+R4b)
  para a etapa 6.
- Li o guia de CSP do Next 16, o HTML do build atual (`.next/server/app/index.html`), o `persist` do zustand 5.0.16 e
  o código de `infraestrutura/`. Provei P1 e P2 com `scratchpad/seg-his003/prova-hidratacao.mjs`.
- `pnpm audit`: limpo. `npm view zod`: 4.6.7, sem dependência nem script de instalação.

**Decisões**
- P1 (JSON quebrado prende o site no carregamento para sempre) e P2 (mesma versão não passa pelo `migrate`) são **altas**.
  A validação mora num `storage` próprio + `merge`, não só no `migrate`.
- CSP **sem nonce**: o nonce deixaria todas as páginas dinâmicas, e hash não cobre o `__next_f` inline. Fica
  `'unsafe-inline'` em script e estilo, sem `unsafe-eval`, tudo `'self'`. Reabrir no E4/E11.
- Só o **rígido** do dominio descarta. Alerta nunca descarta; os 2 consertos do dominio são aceitos (não inventam número).
- `atualizar-dados.yml` em dois jobs: o token com escrita não fica disponível durante o `pnpm install`.

**Resposta ao `[para: seguranca]` do ux:** feito. O validador devolve a contagem por tipo, `residenciaDescartada` e
`ilegivel`, só em memória (ver "Regras de validação"; conferido em R4b).

**Para o tech-lead:** escolher entre `zod` e `zod/mini` (tanto faz para segurança) e onde a rotina de dados busca o
critério de formato (`packages/dados` não importa de `apps/web`).

**Próximo:** etapa 6 com R1–R13 e R4b.

### [tech-lead] 2026-10-30 — desenho técnico definitivo (D1–D9), sem zod, quebra em 003a/003b proposta

**O que fiz**
- Li a história inteira, o ADR-001, o ADR-003, a retro e o código de `infraestrutura/`, `aplicacao/`, `Campo`,
  `Entrada` e `Aviso`, das telas com campos, do `next.config.ts` e dos dois workflows.
- Medi o zod no scratchpad (`tl-his003/zod/`) e prototipei o `persist` com o zustand 5.0.16 (`tl-his003/persist/`).
- Escrevi o "Desenho técnico definitivo" (D1–D9) e o ADR-004.

**Decisões e porquê**
- **Sem zod.** Leitores escritos à mão no `@ee/core`, usados pelo site, pela rotina e pelo app.
  - Peso medido, em gzip: `zod` 93 098 B (e testa `new Function`, que a nossa CSP bloqueia); `zod/mini` 8 173 B;
    leitores à mão 1 284 B.
  - A parte difícil (descartar item por item, contar, consertos) é nossa de qualquer jeito.
- **A rotina** usa os mesmos leitores. Na rotina, formato inválido não passa nem com `--forcar`.
- **Casa salva:** `storage` próprio + `merge` que sempre valida. O `migrate` só repassa. A versão limpa é regravada no
  `onRehydrateStorage`, e o formato salvo continua o mesmo.
  - Os 9 casos do protótipo terminam a hidratação (P1 e P2 resolvidos).
- **T1b vai para `/casa/ajustes`, que passa a abrir sem cidade.** O `/comecar` apagaria os aparelhos.
- **O leitor não descarta data no futuro.** Um relógio do celular errado apagaria anotações verdadeiras.
- **O build falha com arquivo de dados ruim**, como pede a segurança.
- **Estimativa:** cerca de 3,75 dias, então proponho 003a (cerca de 3 dias com o qa) e 003b (cerca de 1,5 dia).
- **A 003 depende só da 002a.** Não depende da 002b: o lockfile não muda, e o conflito é de uma linha no `ci.yml`.

**Arquivos alterados**
- `docs/equipe/historias/HIS-003-base-de-seguranca.md`
- `docs/equipe/decisoes/ADR-004-leitura-segura-de-dados.md`
- `docs/equipe/decisoes/README.md`
- `docs/equipe/quadro.md`
- a minha pasta (`contexto.md` e `diario.md`)

**Como verifiquei**
- Esbuild + gzip nos três jeitos de escrever os esquemas.
- `tsc` estrito e `tsx` do protótipo do `persist` contra o zustand do lockfile: JSON quebrado, `null`, `[]`, texto,
  potência `-5`, chave extra, v1, v99 e casa válida (esta sem regravar).
- SHA do `download-artifact` v8.0.2 conferido com `git ls-remote --tags` e com um clone raso.
- Regra de cabeçalhos repetidos conferida na documentação do Next.

**Para o próximo**
- **seguranca:** responder a P-tl-1.
- **dominio-energia:** responder a P-tl-2.
- **scrum-master:** decidir a P-tl-3.
- **Depois:** etapa 4 (backend a1–a3 e a6, frontend a4–a5, qa a7), quando a 002a estiver no `main`.

### [scrum-master] 2026-10-30 — P-tl-3 respondida: quebra em 003a/003b aceita
- O que fiz: retitulei este arquivo como HIS-003a (nome e branch mantidos) e criei a
  [HIS-003b](HIS-003b-campos-com-limite.md), movendo T5, T6, o bloco "T5 e T6" do D5, o `campos.spec.ts` e b1–b3, com
  remissões. O critério 5 daqui ficou só na parte do domínio, verificável pelo `limites.test.ts`. Na 003b escrevi o
  critério 8 (T6), que faltava.
- Decisões e porquê: 3,75 dias não cabem em M. A 003a vem primeiro: tem as três ameaças altas (A1, A2, A7: site preso,
  conta errada, tela branca). **003a e 002b em paralelo**, em branches separadas, porque o lockfile não muda e o
  conflito é uma linha do `ci.yml` mais o `useArquivo`/`casa.ts` (D4). Regra: integra uma de cada vez; quem chega
  depois faz o rebase e passa no lint e no e2e da outra. Se a 002b entrar antes, o `useArquivo` segue a nota do D4.
  **003b depois da 003a no `main`**: usa o a1 e mexe nas mesmas telas do T2. As três ficam na Sprint 0.
- Arquivos alterados: este arquivo, `HIS-003b-campos-com-limite.md` (novo), `docs/planejamento.md`,
  `docs/equipe/quadro.md`.
- Para o próximo: **seguranca** responde a P-tl-1 (bloqueia o a2) e **dominio-energia** a P-tl-2 (bloqueia o a3), em
  paralelo. A etapa 4 da 003a (backend a1 e a6, frontend T3/T4 e D6 adiantados) começa quando a 002a estiver no `main`.

### [dominio-energia] 2026-10-30 — P-tl-2 respondida; achado de tarifas vencidas (P-de-1)
- **O que fiz:**
  - Conferi as faixas no `tarifas.json` de 29/10/2026 (114 distribuidoras e 142 meses de bandeira) e nas páginas da ANEEL.
  - Escrevi "Faixas dos arquivos públicos (P-tl-2)", com a tabela, os casos P1–P7 e as fontes.
- **Decisões:**
  - A proposta do tech-lead fica, com dois ajustes:
    - o piso da tarifa passa a ser > 0,05, para pegar a divisão por 1.000 feita duas vezes;
    - entram duas coerências: TE + TUSD = tarifa (tolerância de 0,00001) e verde = 0, com as outras bandeiras > 0.
  - O arquivo de hoje passa inteiro. O a3 está liberado.
- **`[para: backend]`:**
  - O corte da `tarifas.ts` passa a usar `LIMITES.tarifaKwh`.
  - Pôr um alerta de variação para bandeira acima de 0,15, por causa do risco do `divisorDaUnidade`.
- **`[para: tech-lead]` `[para: scrum-master]` P-de-1 (veto):** cerca de 200 municípios usam tarifas vencidas entre 2016
  e 2023. Ex.: Alegrete (RS) mostra uma conta 42% menor; Assis (SP), 45% menor. Peço uma história própria, com
  prioridade alta. Ver "Achado: tarifas vencidas".
- **Próximo:** backend no a3 com P1–P7; qa usa P1–P7 no `arquivos-publicos.test.ts`.

### [seguranca] 2026-10-30 — P-tl-1 respondida: leitores à mão aprovados com 2 condições

**Decisão: aprovado.** O a2 pode começar.

- **(a) Leitores à mão: sim.** Para segurança são até melhores: sem `eval`, sem dependência nova, lockfile igual.
  Conferi as medidas no `scratchpad/tl-his003/zod/` (gzip -9: 93 098 / 8 173 / 1 284 B).
  - O risco novo é **esquecer um campo opcional**. No protótipo de medida (`mao.ts`), o `lerResidencia` não lê o
    `contaReferencia` e o `lerAparelho` não lê o `kwhMesInformado`. Num leitor de verdade isso apagaria, sem aviso e
    na primeira ação salva, a conta e a etiqueta de todas as famílias. Seria **alto**.
  - O protótipo também faz `trim` no texto devolvido. Isso corrige o valor e quebra o "igual".
  - Por isso entram o **R4c** (lista de campos checada pelo `typecheck`, fixture `casa-completa`, sem `trim`) e o
    **R4d** (o leitor nunca lança, porque um `merge` que lança traz o P1 de volta; data por UTC, já que o V8 aceita
    `2026-02-30` e o transforma em 2 de março).
  - A3: leitura só de propriedade própria (`Object.hasOwn`).
- **(b) Sim.** `contaReferencia` sai sozinha, a `residencia` fica e a conta entra em `contas`. `pessoas` sai sem aviso:
  só aparece em `tipos.ts`, e o cadastro usa o próprio `useState(3)`. Sem aviso não há regravação, mas o `merge` limpa
  a cada abertura e a próxima ação já grava limpo.
- **(c) Sim.** Data no futuro não faz mal à conta (`periodosDeLeitura` ignora `dias <= 0`). Descartar seria perda sem
  volta por causa de um relógio errado. O leitor confere só se a data existe no calendário (competência com mês de 01 a 12).
- **(d) Sim, com a regra exata no R4:** byte a byte quando a versão é 2 e não há aviso; `toEqual` item por item quando
  algo sai. As versões 1 e 99 o próprio `persist` regrava.

Também troquei A3, R11 e o parágrafo do zod em "Regras de validação". **Para o tech-lead:** passar o ADR-004 para
aceito, com R4c e R4d nas consequências.

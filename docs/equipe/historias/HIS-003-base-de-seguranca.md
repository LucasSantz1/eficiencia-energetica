# HIS-003 · Base de segurança e robustez

| Campo | Valor |
| --- | --- |
| Épico | E0 · Fundação |
| Sprint | 0 |
| Tamanho | M |
| Papéis principais | seguranca, frontend, tech-lead |
| Status | Preparada |
| Branch | `his-003-seguranca` |

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
5. **Dado** os campos de entrada (nome de cômodo, potência, minutos, kWh, valor da conta), **quando** a pessoa digita,
   **então** há limites de tamanho e faixa definidos em um só lugar e testados.
6. **Dado** um push, **quando** o CI roda, **então** `pnpm audit --audit-level high` passa e o Dependabot está configurado
   para npm e GitHub Actions.
7. Existe `.env.example` (vazio por enquanto, com comentário) e `.env*` está no `.gitignore`.

## Fora do escopo

- Autenticação e banco (E4).
- Limite de taxa (não há endpoint próprio ainda).

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

### T5. Campos fora do limite (critério 5)

| Campo (id) | Quando | Mensagem |
| --- | --- | --- |
| Potência (`ap-potencia`, `EditorAparelho`) | vazio ou zero | Digite a potência do aparelho, em watts (W). |
| Potência | fora da faixa | A potência vai de {min} a {max}. Confira a etiqueta ou a plaquinha atrás do aparelho. |
| Consumo na etiqueta (`ap-etiqueta`) | fora da faixa | Digite um consumo entre {min} e {max} por mês, como está na etiqueta. |
| Consumo da conta (`conta-kwh`, cadastro e acompanhamento) | fora da faixa | Digite um consumo entre {min} e {max}. Na conta, ele aparece como "Consumo (kWh)". |
| Valor da conta (`conta-valor`, cadastro e acompanhamento) | fora da faixa | Digite um valor entre {min} e {max}. É o valor total a pagar, com impostos. |
| Campos com vírgula (kWh, valor) | número mal escrito (ex.: "1,2,5") | Escreva só o número. Para centavos, use vírgula: 135,90. |
| Nome do cômodo (`nome-comodo`) | vazio | Dê um nome ao cômodo, por exemplo: Quarto do casal. |
| Nome do aparelho (`ap-nome`) | vazio | Dê um nome ao aparelho, por exemplo: Geladeira. |

**Minutos (por dia e por banho)**
- Hoje usam `Contador` (+ e −) com `min` e `max`, e não dá para digitar. Por isso não precisam de mensagem: o botão para
  no limite.
- Conferir: o `+` e o `−` ficam `disabled` no limite, e o leitor ouve o valor novo.
- Se algum campo de minutos virar digitável:
  - por dia: "O tempo de uso vai de {min} a {max} por dia." (ex.: "1 minuto" a "24 horas");
  - por banho: "Cada banho vai de {min} a {max} minutos."

**Nome com tamanho máximo:** o `maxLength` (40 e 60) já impede passar do limite. Mensagem não precisa.

**Comportamento**
- **Quando mostrar:** ao sair do campo ou ao tocar no botão de continuar, nunca a cada tecla. Quem digita "1" a caminho
  de "1500" não pode ver erro. Depois que a mensagem aparece, ela some assim que o valor fica certo (aí sim, conferindo
  a cada tecla).
- **Não corrigir o número escondido:** hoje a potência corta em 30.000 com `Math.min`. Isso sai e entra a mensagem. O
  campo mantém o que a pessoa digitou. O salvar automático guarda só valor válido, e a conta continua com o último
  valor válido.
- **Botão de continuar:** "Ver o resultado" fica habilitado, sem `disabled` (botão desabilitado não diz o que falta).
  Ao tocar com campo errado, aparecem as mensagens e o foco vai para o primeiro campo errado.

**Componentes e acessibilidade do T5**
- `Campo` ganha a prop `erro?: string`. A mensagem fica num `<p id="{id}-erro">`, com ícone `CircleAlert`
  (`aria-hidden`) e texto `text-alerta font-bold`. Fica abaixo da entrada e acima da ajuda.
- A ajuda também ganha id (`{id}-ajuda`); hoje não tem.
- `Entrada` recebe `aria-invalid="true"` e `aria-describedby="{id}-erro {id}-ajuda"`.
- A borda da `Entrada` vira `border-alerta`. O erro não depende só da cor: tem ícone, texto e borda.
- O `<p>` do erro fica dentro de um recipiente com `aria-live="polite"`, sempre na página (vazio quando está tudo
  certo). Assim a mensagem é lida quando aparece ao sair do campo.
- Contraste do `alerta` (#b42318): 6,6:1 sobre `papel`, 5,8:1 sobre `fundo` e 5,6:1 sobre `alerta-claro`. Passa AA nos três.

## Desenho técnico (proposta inicial)

- `zod` 4 (versão exata) com esquemas em `infraestrutura/validacao/` — os tipos continuam vindo de `@ee/core`;
  o esquema é conferido contra o tipo com `satisfies z.ZodType<T>`.
- Validação dentro do `migrate`/`merge` do persist e no carregamento de `/dados`.
- Cabeçalhos em `next.config.ts` (`headers()`); CSP com `nonce` só se for necessário — conferir a documentação do Next 16
  em `node_modules/next/dist/docs/` sobre CSP e scripts inline.
- Limites em `packages/core/src/limites.ts` (domínio), usados pela interface e pela validação.

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
| A3 | Campo extra / `__proto__` / spread do bruto (`...(salvo as Partial<DadosCasa>)`, `casa.ts` l. 125) | baixa | `z.object` padrão (tira o que não conhece); sem `looseObject`, `passthrough`, `z.record` nem spread do bruto |
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

**zod**: 4.6.7 (`npm view`: mantenedor colinhacks, sem dependência nem script de instalação), versão exata. `zod/mini`
é bem mais leve; a escolha entre os dois é do tech-lead/frontend, segurança aceita qualquer um.

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
| R4 | casos do localStorage (unidade + 1 e2e): JSON quebrado, `null`, `[]`, texto, `version` 1/2/99, potência `-5`/`"100"`/acima do máximo, nome com 10 000 caracteres, id repetido, `comodoId` inexistente, `__proto__` e chave extra, 10 000 aparelhos | site abre, só o inválido sai, versão limpa gravada, aviso uma vez, o válido igual byte a byte; `prova-hidratacao.mjs` contra o storage novo dá `hasHydrated: true` |
| R4b | retorno do validador nos mesmos casos + alerta (potência 10.001) e os 2 consertos | contagem certa por tipo, `residenciaDescartada`/`ilegivel` certos, T1a/T1b/T1c certos; alerta e conserto **não** contam; retorno fora do localStorage e só com números/`boolean` |
| R5 | `infraestrutura/` | nenhum `as` sobre dado de fora; `migrate` sem spread do bruto |
| R6 | `/dados` ruim via `page.route` (vazio, HTML, estrutura errada, tarifa `-1`/texto) e leitor do servidor em teste | T2 com "Tentar de novo" que funciona depois de restaurar; leitor do servidor lança |
| R7 | `uf` fora das 27 no localStorage | nenhum `fetch` de municípios |
| R8 | componente que lança (só em teste) em página e no layout | T3 sem texto do erro; `retry` chamado; "Voltar ao início" leva a `/`; nenhum pedido novo de rede |
| R9 | `limites.ts` | único lugar; `maxLength` = máximo do esquema; testes de borda (limite, limite + 1, vazio, gigante) |
| R10 | `ci.yml`, `dependabot.yml`, `atualizar-dados.yml` | como em "CI e dependências"; nenhuma action por etiqueta |
| R11 | `pnpm audit`, `pnpm-lock.yaml` | limpo; diff do lockfile só com o zod; nenhum script de instalação novo |
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

## Perguntas abertas

- [x] `[para: ux-acessibilidade]` Texto do aviso quando parte dos dados salvos foi descartada.
  **Resposta (ux, 2026-10-30):** ver "Fluxo e textos", T1 (três casos: saiu uma parte, saiu a cidade, não sobrou
  nada). `Aviso tom="faisca"`, `role="status"` já presente e vazio antes de o texto chegar. Para isso, a validação
  precisa devolver **quantos itens de cada tipo** saíram (aparelho, cômodo, conta, leitura, plano) e se a `residencia`
  saiu. `[para: seguranca]` incluir isso no retorno do `migrate`/`merge`.
- [x] `[para: dominio-energia]` Faixas aceitáveis: potência (W), minutos por dia, kWh da conta e valor da conta.
  **Resposta (dominio-energia, 2026-10-30):** ver "Regras de negócio e fontes" (tabela com rígido e alerta, fontes e 23 casos de borda).
- [ ] `[para: ux-acessibilidade]` Texto do **alerta** ("Confere?"), para valor possível mas raro (potência > 10.000 W, conta > 2.000 kWh,
  preço da conta fora de R$ 0,30 a R$ 3,00 por kWh etc.). Ele pergunta e deixa salvar, diferente da mensagem de "fora da faixa" do T5.

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

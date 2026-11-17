# HIS-112 · Layout para computador (telas de 1024 px ou mais)

| Campo | Valor |
| --- | --- |
| Épico | E1 · Inclusão |
| Sprint | Sprint 1 (entregue em 2026-11-13, junto com a 003a) |
| Tamanho | M |
| Papéis principais | ux-acessibilidade (desenho feito), frontend (qa confere) |
| Status | **Pronto** (2026-11-13), com ressalvas: esqueleto da `Casca` (HIS-116) e PR a integrar |
| Branch | `his-112-layout-computador` (sai do `main`) |

## Problema e valor

Como **pessoa que abre o site no computador**, eu quero **telas que usem a largura da janela** para **ver mais de uma vez e
não me perder numa coluna de celular no meio da tela**.

O dono do projeto pediu: a versão de computador "parece a de tela de celular" e "fica só no centro". Conferido a 1440 px:
a `/` já usa a largura toda; `/casa`, `/casa/comodos`, `/casa/dicas`, `/casa/ajustes` e `/comecar` ficam numa coluna de
cerca de 850 px (`max-w-4xl` na `Casca`; `max-w-2xl` no cadastro), com 300 px vazios de cada lado. Os cômodos viram 3
cartões por linha e o resto é uma lista longa que obriga a rolar.

## Critérios de aceite

1. **Dado** uma janela de 1024 px ou mais, **quando** abro `/casa`, `/casa/comodos`, `/casa/dicas`, `/casa/ajustes` ou
   `/comecar`, **então** o conteúdo ocupa um container de até 75rem (1200 px) e não há faixa vazia maior que 2rem até o
   container nas telas de 1024 a 1200 px.
2. **Dado** 390 px (e qualquer largura abaixo de 1024 px), **quando** abro as mesmas telas, **então** nada muda em relação
   ao `main` de hoje (as capturas de 390 px são idênticas pixel a pixel, fora o que a HIS-111 mudar).
3. **Dado** `/casa` a 1024 px ou mais, **então** a conta aparece em cima, com o número à esquerda e a explicação
   (bandeira, tarifa, Tarifa Social) à direita; abaixo, "Seus cômodos" à esquerda e, numa coluna lateral de 23,5rem,
   "Quem mais gasta" e "Seu plano de economia".
4. **Dado** `/casa/comodos` a 1024 px ou mais, **então** a lista de cômodos fica à esquerda (22rem), o cômodo aberto à
   direita, e trocar de cômodo não leva a pessoa para o alto da página.
5. **Dado** `/casa/dicas` a 1024 px ou mais, **então** as dicas ficam em grade de 2 colunas (3 a partir de 1280 px) e o
   resumo do plano numa coluna lateral.
6. **Dado** `/comecar` a 1024 px ou mais, **então** o passo fica à esquerda (até 34rem) e um painel "Por que
   perguntamos" à direita; o painel só explica, nada essencial vive só nele.
7. **Dado** qualquer tela, **então** nenhuma linha de texto corrido passa de 68 caracteres e a letra não diminui.
8. **Dado** teclado ou leitor de tela, **então** a ordem de foco e de leitura é a mesma do celular, em todas as telas,
   exceto onde o item 4 da seção "Fluxo e textos" (cômodos) diz o contrário e explica.
9. **Dado** movimento reduzido, **então** não há movimento novo; sem a preferência, só o que já existe (`surgir`,
   `cresce-x`, `TransicaoTela`).
10. **Dado** zoom de 200% a 1440 px (janela de 720 px de largura útil), **então** a tela cai no layout de celular, sem
    rolagem para o lado (WCAG 1.4.10).
11. **Dado** a barreira de qualidade, **então** `pnpm typecheck`, `pnpm test` e `pnpm build` passam, o axe não acusa nada
    novo e há capturas de 390, 1024 e 1440 px de cada tela, sem erro no console.

## Fora do escopo

- Qualquer mudança abaixo de 1024 px (inclui tablet), na `/` e em cores, textos ou números.
- Regra de negócio e cálculo (tudo continua em `packages/core`).
- Gráficos novos ou funções novas só para computador.

## Dependências

- Nenhuma de dados. Mexe na `Casca`, então conflita com a HIS-111 (aviso na `Casca`): integrar a HIS-111 primeiro.

## Regras de negócio e fontes

Não se aplica (só apresentação).

## Fluxo e textos

Autor: ux-acessibilidade, 2026-11-03. Maquetes estáticas com dados de exemplo (o dono vê antes de implementar):
`/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/maquete-computador/casa.html` e
`.../comodos.html`. Os dois arquivos copiam os tokens do `globals.css`; as demais telas estão só descritas abaixo.

### Regras gerais

- **Ponto de corte: `lg` (1024 px).** Abaixo dele, nada muda. De 640 a 1023 px continua o `max-w-4xl` de hoje.
- **Container:** `Casca` (topo, abas e `main`) e `Cadastro` passam de `max-w-4xl`/`max-w-2xl` para
  `lg:max-w-[75rem] lg:px-8`. Topo e abas usam o mesmo container, para o logotipo e o conteúdo alinharem.
- **Grade:** CSS Grid com `grid-template-areas` só no `lg:`. A ordem do código é a do celular; as áreas só mudam o lugar
  na tela. Foco e leitor seguem o código, então seguem o celular (o desenho foi feito para a ordem visual ler em "Z":
  em cima, depois esquerda, depois direita).
- **Texto corrido:** `max-w-[68ch]` em todo parágrafo (a conta no cartão escuro já tem coluna própria). Letra, espaçamento
  e alvos de toque (44 px) iguais aos do celular.
- **Coluna lateral que gruda (`sticky`):** só com `top-4` e só se couber na janela
  (`max-h-[calc(100dvh-2rem)] overflow-auto`). Se não couber, rola junto com a página. Assim nada fica escondido atrás
  dela quando o foco passa (WCAG 2.4.11). O topo da `Casca` não é fixo e continua não sendo.
- **Cartões:** os mesmos de hoje (`--radius-cartao`, `bg-papel`). Nada de sombra nova.

### `/casa` (ver `casa.html`)

```
+----------------------------------------------------------------------+
| Logo                                              Presidente Prudente |
| Acompanhamento  Cômodos  Dicas  Minha casa                            |
+----------------------------------------------------------------------+
| [ CONTA (cartão escuro, 2 colunas)                                  ] |
|  Sua conta estimada por mês      | Bandeira verde (outubro de 2026)  |
|  R$ 105,27                       | Tarifa da ...: R$ 0,81 por kWh    |
|  209 kWh, R$ 3,51 por dia        | A Tarifa Social já tirou R$ 65,14 |
|  [Com o plano, cai para R$ 87,36]|                                   |
+--------------------------------------------+-------------------------+
| Seus cômodos                    Editar >   | Quem mais gasta         |
| [Cozinha  R$ 18,69] [Sala     R$ 5,70]     |  Máquina de lavar  R$.. |
| [Quarto 1 R$ 16,55] [Quarto 2 R$ 9,80]     |  Chuveiro          R$.. |
| [Banheiro R$ 21,05] [Lavanderia R$ 33,48]  | Seu plano de economia   |
|                                            |  [Ver todas as dicas]   |
+--------------------------------------------+-------------------------+
```

1. Ordem do código (igual ao celular): conta, "Seus cômodos", "Quem mais gasta", "Seu plano de economia". Áreas:
   `"conta conta" / "comodos lado"`; "Quem mais gasta" e o plano ficam juntos na área `lado`.
2. Grade `minmax(0,1fr) 23.5rem`, intervalo `2rem`. Cômodos: 2 colunas (3 cartões de 275 px ficavam apertados; com 2,
   o nome e o valor respiram).
3. Conta: `grid-cols-[1fr_26rem]` com intervalo de `3rem`. O número gigante (`4.5rem`, faísca) à esquerda; a linha do
   plano de economia continua sendo link inteiro. À direita os três parágrafos, em `text-white/85`
   (o contraste de `text-white/85` direto no `noite` passa; sobre cartão `bg-white/10` use `text-white`, HIS-110).
4. A tarifa e a Tarifa Social ficam na ordem de hoje. Nenhum texto novo nesta tela.
5. Estado vazio, carregando e erro: iguais ao celular; o esqueleto de carregamento ocupa as mesmas áreas (conta em cima,
   cômodos e lateral embaixo) para a tela não pular quando os dados chegam.
6. Sem plano de economia: o cartão da lateral mostra "Ainda não há dicas no seu plano." e o botão "Ver as dicas".

### `/casa/comodos` (ver `comodos.html`)

```
Cômodos e aparelhos
6 cômodos, 16 aparelhos e lâmpadas. Escolha um cômodo e use o + e o - ...
( Por cômodo )  ( Painel geral )
+--------------------+  +-----------------------------------------------+
| Cozinha  R$ 18,69  |  | Cozinha                      [Editar cômodo]  |
| Sala     R$  5,70  |  | 3 itens, R$ 18,69 por mês                     |
| Quarto 1 R$ 16,55  |  |  [Lâmpadas  Acesas 4 h por dia       - 2 +  ] |
| ...                |  |  [Geladeira de 1 porta               - 1 +  ] |
| Total  R$ 105,27   |  |  [Micro-ondas                        - 1 +  ] |
| [+ Adicionar cômodo]  |  [+ Adicionar aparelho na cozinha]            |
+--------------------+  +-----------------------------------------------+
```

1. Só no `lg:`. A lista tem 22rem e fica `sticky` (regra geral). Cada cômodo é um botão de 68 px ou mais, com nome, R$ por
   mês, barra e porcentagem (a barra usa as faixas A a E, como no celular, e a porcentagem em texto: nada só em cor).
2. O cômodo aberto tem borda `energia` de 2 px, fundo `energia-claro` e `aria-current="true"`. Cor não é o único sinal: a
   borda e o título do painel à direita repetem o nome.
3. O cômodo aberto vem do primeiro da lista ao entrar na tela (ou do último que a pessoa abriu, se o `useCasa` já guarda isso).
   Trocar de cômodo não rola a página nem move o foco: o foco fica no botão tocado. Quem usa leitor ouve o painel mudar
   porque o `h2` do painel muda e o painel é uma `section aria-labelledby`; **não** usar `aria-live` (decisão já em
   vigor: anúncio sem pedir atrapalha).
4. **Ordem de foco (exceção ao critério 8):** no celular é uma sanfona (cada cômodo abre embaixo de si). No computador a
   ordem é: "Por cômodo/Painel geral" → os 6 botões da lista → "Total" e "Adicionar cômodo" → painel do cômodo aberto. Isso
   evita o foco pular de um lado para o outro. Para não repetir `id` nem ler duas vezes, o frontend **renderiza só um dos dois
   desenhos por vez** (hook de `matchMedia("(min-width: 1024px)")`), com o mesmo componente de aparelho por dentro. Antes de
   hidratar, mostra o desenho do celular (o mesmo de hoje).
5. Painel: título `h2` do cômodo, resumo ("3 itens, R$ 18,69 por mês") e botão "Editar cômodo" (hoje é só um lápis; no
   computador há espaço para o texto; o `aria-label` do lápis do celular continua). Dentro, os aparelhos como hoje; campos
   "Tipo" e "Acesas por dia" ficam em linha com o rótulo à esquerda (7,5rem) e as pílulas à direita.
6. Botões de mais e menos mantêm 44 px. Um aparelho abre/fecha como hoje.
7. "Painel geral": a tabela usa a largura toda, sem coluna rolável a 1280 px ou mais. Continua `role="region"`,
   `aria-label="Tabela com todos os aparelhos da casa"` e `tabIndex={0}` (HIS-002a).
8. Sem nenhum cômodo: a lista fica vazia e o painel mostra "Nenhum cômodo ainda." e o botão "Adicionar cômodo".
   Nova linha: "Total por mês" some quando o total é 0.

### `/casa/dicas`

1. `h1` "Dicas e plano de economia" e o texto de abertura (até 68ch) em cima. Abaixo: grade `minmax(0,1fr) 22rem`.
2. Esquerda: "Outras dicas" em grade de 2 colunas (3 a partir de 1280 px, `xl:`), cada dica com a mesma estrutura do
   celular (título `h3`, quanto economiza em R$ por mês primeiro, o que fazer). Cartões da mesma altura por linha
   (`items-stretch`), sem ordem nova.
3. Direita (`sticky`): o resumo do plano, "Seu plano de economia", com o total em R$ e os botões já existentes.
4. A dica aberta (folha `dialog`) continua folha, que no computador já vira janela de 34rem (utilidade `folha`).
5. Vazio: mantém o texto de hoje.

### `/casa/ajustes`

1. Duas colunas de cartões (`lg:grid-cols-2`, intervalo 1.5rem): à esquerda "Sua casa" e "Conta de luz"; à direita "Seus
   dados" e "Apagar tudo". Ordem do código = ordem do celular; as áreas só põem os dois primeiros à esquerda.
2. "Apagar tudo" continua com confirmação antes de apagar (princípio 5), em `dialog`.

### `/comecar`

```
+---------------------------------------+  +----------------------------+
| Passo 3 de 9              [Voltar]    |  | Por que perguntamos        |
| Qual é a sua empresa de luz?          |  | A empresa de luz define o  |
| ( ) Energisa Sul-Sudeste              |  | preço do kWh na sua conta. |
| ( ) Não sei                           |  | Nada sai do seu aparelho.  |
| [Continuar]                           |  |                            |
+---------------------------------------+  +----------------------------+
```

1. Container `lg:max-w-[64rem]`, grade `minmax(0,34rem) minmax(0,1fr)`, intervalo 3rem. O passo (o que já existe) fica à
   esquerda e **nada nele muda**: uma decisão por tela, botão "Continuar", caminho "Não sei".
2. O painel é um `aside aria-label="Por que perguntamos"`, depois do passo no código, `hidden lg:block` (no celular não
   existe; o texto é explicação extra, nunca instrução obrigatória). Fundo `energia-claro`, `rounded-[var(--radius-cartao)]`,
   `p-6`, `sticky top-4`. Troca com o passo sem animação (só `surgir` se não houver movimento reduzido).
3. Abaixo do texto do painel, uma linha fixa: "Nada sai do seu aparelho sem você aceitar." (promessa já coberta pela LGPD
   do projeto; o `seguranca` confere).
4. Textos do painel por passo (prontos para copiar):

| Passo | Título do painel | Texto |
| --- | --- | --- |
| Estado | Por que perguntamos o estado? | Cada estado tem empresas de luz diferentes. Com o estado, achamos a sua. |
| Cidade | Por que perguntamos a cidade? | O preço da luz muda de cidade para cidade. Com a cidade, usamos o preço certo. |
| Empresa de luz | Onde vejo o nome da empresa? | Está no alto da sua conta de luz. Se não achar, toque em "Não sei" e usamos a mais comum da sua cidade. |
| Tarifa Social | O que é a Tarifa Social? | É um desconto na conta para famílias de baixa renda. Se a sua família tem direito, a conta fica mais barata. |
| Pessoas | Por que perguntamos quantas pessoas? | Mais gente em casa costuma gastar mais água quente e mais energia. Isso ajuda a estimar a conta. |
| Cômodos | Por que perguntamos os cômodos? | Mostramos quanto cada cômodo pesa na conta. Pode ser só um palpite, depois você ajusta. |
| Cada cômodo | Não sabe a potência? | Sem problema. Escolha o aparelho mais parecido com o seu e usamos um valor médio. |
| Revisão | Dá para mudar depois? | Dá. Tudo isto fica em "Minha casa" e você muda quando quiser. |
| Conta | Para que serve a conta de luz? | Se você digitar o valor da conta, comparamos com a nossa estimativa e deixamos os números mais certos. |

   (Os passos que o `Cadastro` tem a mais ou a menos que esta lista ganham o texto do vizinho mais parecido; o
   frontend avisa o ux qual faltou, não inventa.)
5. Erro, carregando e "confere?": no painel não aparece erro nunca; o erro continua junto do campo, no passo.

### Acessibilidade (conferir no código)

- Um só `h1` por tela. As colunas laterais usam `h2`; o painel de `/comecar` usa `h2` dentro do `aside`.
- Todo bloco lateral é `section aria-labelledby` ou `aside aria-label`, com nome curto e diferente dos outros.
- A lista de cômodos é `nav aria-label="Cômodos"` com `ul`; o botão do aberto leva `aria-current="true"`.
- Foco: `:focus-visible` de hoje; nada fica escondido pelo `sticky`; o `h1` recebe foco quando o elemento focado some.
- Contraste: textos novos usam só pares já aprovados (tinta no papel e no fundo; `text-white` sobre `energia`/`noite`).
- `prefers-reduced-motion`: `sticky` não é movimento; não usar rolagem animada ao trocar de cômodo.
- Zoom de 200% e 400%: a 1440 px, 200% vira 720 px (celular); 400% vira 360 px. Testar os dois.

### O que o frontend deve conferir

1. `Casca`: trocar os três `max-w-4xl` por `max-w-4xl lg:max-w-[75rem] lg:px-8`.
2. Grades com `grid-template-areas` só em `lg:` (Tailwind `lg:[grid-template-areas:...]`), sem mudar a ordem do JSX.
3. Hook de media query para os cômodos (um desenho por vez), sem `id` repetido.
4. Capturas de 390, 1024, 1280 e 1440 px de cada tela, mais uma com zoom de 200%.
5. Linha de texto: medir um parágrafo a 1440 px (até 68 caracteres) e um título longo (sem corte).

## Desenho técnico

_(tech-lead, 2026-11-12, sobre o `main` em `deed1f7`. Segue o "Fluxo e textos" da ux. Onde ele e os critérios
discordam, valem os critérios, e o ponto está em L9.)_

**L1. Regra geral: só CSS, com uma exceção.** Todo o layout largo usa classes `lg:` do Tailwind 4: `lg` vale 64rem, ou
1024 px com a letra padrão. Nada muda abaixo de `lg`, e por isso a classe de hoje fica e só ganha a variante `lg:`. A
ordem do JSX não muda. A grade usa `lg:grid` com `lg:[grid-template-areas:…]` e `lg:[grid-area:…]` nos filhos, e onde
já existe `space-y-*` entra `lg:space-y-0 lg:gap-8`. Com a mesma margem no celular, a captura de 390 px fica idêntica
(critério 2). Nenhum token novo e nenhuma dependência nova.

- Texto corrido ganha `max-w-[68ch]` só onde hoje não tem limite (a nota final da `/casa`, por exemplo). Quem já tem
  `48ch`, `52ch`, `56ch` ou `62ch` fica como está.
- A coluna que gruda vira uma utilidade só, em `globals.css`:
  `@utility lateral-fixa { @media (width >= 64rem) { position: sticky; top: 1rem; align-self: start; max-height: calc(100dvh - 2rem); overflow-y: auto; } }`.
  Assim a regra do WCAG 2.4.11 do ux fica num lugar só.
- **Exceção:** `/casa/comodos` troca de desenho, com um componente por vez (L4). É o único JS novo de comportamento.

**L2. Container (critério 1).** Ele mora na `Casca` (`funcionalidades/casca/Casca.tsx`) e não no `app/casa/layout.tsx`,
que continua fino. Os três `max-w-4xl` (o `div` do topo, a `nav` do computador e o `main`) ganham
`lg:max-w-[75rem] lg:px-8`, e o logotipo, as abas e o conteúdo ficam alinhados. O esqueleto de carregamento da `Casca`
ganha a forma da `/casa` no `lg:`: o bloco de cima inteiro e o de baixo em `lg:grid-cols-[minmax(0,1fr)_23.5rem]`. É a
rota mais aberta, e assim a tela não pula quando os dados chegam. O `/comecar` usa o mesmo container (L7).

**L3. `/casa` (`PainelAcompanhamento.tsx`).**

- Raiz: `space-y-12 lg:grid lg:space-y-0 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_23.5rem]`, com as áreas
  `"conta conta" "comodos lado" "acompanhamento acompanhamento" "nota nota"`.
- Uma `div` nova envolve só o que já é vizinho no código: "Quem mais gasta", o `EspacoReservado` e a dica de economia.
  Ela recebe `space-y-12 lg:[grid-area:lado] lateral-fixa`. No celular, a margem entre os três fica igual.
- A grade dos cômodos passa de `lg:grid-cols-3` para `lg:grid-cols-2`. Hoje há `lg:grid-cols-3`, e o ux pede 2, com
  razão.
- Cartão da conta: a `section` ganha `lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-x-12`. O bloco de explicação
  (a `div` com bandeira, tarifa e Tarifa Social) recebe `lg:col-start-2 lg:row-start-1 lg:row-span-4 lg:mt-0 lg:border-t-0 lg:pt-0`.
  O número fica com `lg:text-[4.5rem]`. Nenhum texto muda.
- O `Acompanhamento` e a nota final ocupam a largura toda, embaixo. O `EditorAparelho` é folha e não entra na grade.

**L4. `/casa/comodos` (`TelaComodos.tsx`): dois desenhos, um por vez.**

- **Hook:** `ui/telaLarga.ts`, sem diretiva, exporta `useTelaLarga(): boolean` com
  `useSyncExternalStore(assinar, () => matchMedia(CONSULTA).matches, () => false)` e
  `CONSULTA = "(width >= 64rem)"`. É a mesma sintaxe e o mesmo valor que o Tailwind 4 gera para o `lg`. Assim o zoom troca o CSS e o JS juntos, e um navegador que não entende a consulta cai no celular nos dois. É
  `useSyncExternalStore`, e não `useState` + efeito: **nenhuma linha nova da HIS-109**. A tela só monta depois do
  `useCasaCarregada` (a `Casca` segura até lá). Por isso não há a fase de hidratação, e o desenho certo já aparece no
  primeiro render, sem piscar o do celular.
- **Divisão de `CartaoComodo`:** o miolo dele (iluminação, aparelhos, "Também é comum ter aqui", "Outro aparelho") vira
  `ConteudoDoComodo`. O celular continua com `CartaoComodo` (sanfona) usando esse miolo. O computador usa
  `ComodosNoComputador`, no mesmo arquivo ou em `funcionalidades/comodos/ComodosNoComputador.tsx`, se passar de umas
  120 linhas. A regra de lâmpada e sugestão não é copiada, porque fica no miolo.
- **`ComodosNoComputador`:** a ordem no código é `nav aria-label="Cômodos"` > `ul` de botões (`aria-current="true"` no
  aberto, nome, R$, barra e %), depois "Total por mês" e "Adicionar cômodo", e por fim a
  `section aria-labelledby="titulo-painel-comodo"`. Esta tem o `h2` com o nome, o resumo, "Editar cômodo" (abre o mesmo
  `EditarComodo`) e o `ConteudoDoComodo`. A coluna da lista usa `lateral-fixa`.
- **Cômodo aberto:** fica num estado só dentro do `ComodosNoComputador`, que nasce de
  `useState(() => idDoHash() ?? undefined)`. O `#comodo-id` vale também no computador, e ler o `window` aqui é seguro,
  porque o componente só existe no navegador. O que aparece é derivado:
  `comodos.find((c) => c.id === escolhido) ?? comodos[0]`. Se o cômodo for apagado, o painel passa ao primeiro sem
  efeito nenhum. Tocar num cômodo só troca o estado, sem `scrollIntoView` e sem mover o foco (critério 4).
- **`id` sem repetir:** `comodo-${id}` e `titulo-${id}` ficam só no celular. O painel usa `titulo-painel-comodo`.
- **Troca de desenho com o foco dentro:** isso acontece ao dar zoom, quando a janela cruza os 1024 px. Um
  `useEffect(…, [telaLarga])` que só lê o DOM (sem `setState`) leva o foco ao `h1` quando o `document.activeElement` virou
  o `body`. É o pedido do ux ("o `h1` recebe foco quando o elemento focado some").
- "Painel geral": a tabela perde a rolagem lateral a 1280 px (`xl:`), e o `role`, o `aria-label` e o `tabIndex` ficam.

**L5. `/casa/dicas` (`TelaDicas.tsx`).**

- Raiz: `lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-8`. O `h1` e o texto de abertura ficam com `lg:col-span-2`.
- O resumo do plano já vem antes da lista no código e já é `sticky top-2` no celular. Ele ganha
  `lg:col-start-2 lg:row-start-3 lg:mt-0 lg:shadow-none lateral-fixa`. A ordem de leitura continua a do celular: plano,
  depois a lista.
- Uma `div` nova envolve o que já é vizinho depois dele (a lista de `CartaoDica`, o espaço reservado e "Também ajuda").
  Ela recebe `lg:col-start-1 lg:row-start-3`.
- A lista (`ul`) vira `lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:items-stretch lg:gap-4 lg:space-y-0`.

**L6. `/casa/ajustes` (`TelaAjustes.tsx`).** Uma `div space-y-12` nova envolve as seções "Onde você mora", "Benefício",
"Tipo de ligação" e "Sua conta de luz". A raiz ganha `lg:grid lg:grid-cols-2 lg:gap-x-6 lg:space-y-0`, o `h1` fica com
`lg:col-span-2`, e "Seus dados" (o `SeusDados` da 003a) vai para a coluna 2, com `lg:self-start`. O "Apagar tudo" fica
como está hoje, com a confirmação na própria tela: trocar por `dialog` seria mudar o comportamento, e isso está fora do
escopo (L9).

**L7. `/comecar` (`Cadastro.tsx`).**

- A `Moldura` ganha a prop `lado?: ReactNode` e passa de `max-w-2xl` para `max-w-2xl lg:max-w-[75rem] lg:px-8`. O
  `main` vira `lg:grid lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:gap-x-12`, e o `lado` vem depois do passo no
  código.
- O painel é `aside aria-labelledby` com `h2`, `hidden lg:block`, `lateral-fixa`, e fundo e raio do ux. Fica oculto por
  CSS e não por hook: o `Cadastro` renderiza já na hidratação, e o hook faria o painel aparecer depois, com pulo.
- Os textos ficam em `funcionalidades/cadastro/porQuePerguntamos.ts`, como
  `PORQUE_PERGUNTAMOS: Record<"estado" | "cidade" | "distribuidora" | "beneficio" | "pessoas" | "comodos" | "comodo" | "revisao" | "conta", { titulo: string; texto: string }>`,
  mais `textoDoPasso(passo: Passo)` (`comodo:N` → `"comodo"`). Os 9 passos do `Cadastro` batem um a um com a tabela do
  ux (resposta à pergunta `[para: frontend]`), e nenhum fica sem texto. O `Record` fechado faz o `typecheck` reprovar
  passo novo sem texto. É texto de interface e não regra, por isso fica na funcionalidade.
- As telas "Você já cadastrou" e "Apagar tudo e começar de novo?" não têm painel.
- A linha "Nada sai do seu aparelho sem você aceitar." depende da pergunta à seguranca, que continua aberta.

**L8. Peso (critério 11; regra da HIS-001).** CSS não entra no `peso-js`, mas as classes `lg:` ficam nas strings do JSX.
Limites contra a referência do `main`:

- `/casa/comodos`: **até +2 048 B** no 11a. É a exceção, pelo desenho novo com o hook (estimo de 1,2 a 1,8 kB em gzip).
- Demais rotas: até +1 024 B no 11a, como sempre. O `/comecar` leva os 9 textos, cerca de 0,5 kB.
- 11b: até +4 096 B por rota (revisto em 2026-11-13: o 11b soma o prefetch das outras abas).

Passou disso, falar comigo antes de mudar o `peso-js.json`. O qa atualiza o arquivo uma vez, no fim, medido no último
commit de código.

**L9. Onde o critério vence o "Fluxo".** (a) O `/comecar` usa 75rem e não 64rem: com 64rem, a 1200 px, sobram 88 px de
cada lado, e o critério 1 permite 2rem. (b) O "Apagar tudo" não vira `dialog` (fora do escopo: nada muda além do
layout). (c) O esqueleto da `Casca` segue a `/casa`. O ux pode contestar na nota dele, e eu ajusto.

**L10. Ponto de rebase com a HIS-003a**, que entra antes e mexe na `Casca` (avisos T1 e "Minha casa" sem cidade), no
`PainelAcompanhamento` (aviso T2), na `TelaAjustes` (`SeusDados`) e no `Cadastro` (avisos T2).

- `TelaComodos.tsx`, `TelaDicas.tsx`, `ui/telaLarga.ts` e o `globals.css` não estão na 003a: o frontend **começa já**
  por eles (f1–f3).
- `Casca`, `PainelAcompanhamento`, `TelaAjustes` e `Cadastro` (f4–f7) **só depois** de a 003a estar no `main`, com
  `git merge origin/main` antes de mexer.
- Os avisos novos da 003a ficam acima da grade, ocupando a largura toda, no `role="status"` da `Casca`, que não entra na
  grade.

**L11. Tarefas.**

| # | Quem | O que | Pronto quando |
| --- | --- | --- | --- |
| f1 | frontend | `ui/telaLarga.ts` e a `@utility lateral-fixa` | lint e camadas verdes; nenhum `eslint-disable` novo |
| f2 | frontend | L4: `ConteudoDoComodo`, `ComodosNoComputador`, foco ao trocar de desenho, tabela | sanfona igual a 390 px; lista + painel a 1024 px |
| f3 | frontend | L5 | grade de 2 e 3 colunas; plano à direita |
| f4 | frontend | L2 (depois da 003a) | container de 75rem; esqueleto |
| f5 | frontend | L3 | áreas da `/casa`; cartão da conta em 2 colunas |
| f6 | frontend | L6 | 2 colunas |
| f7 | frontend | L7 e `porQuePerguntamos.ts` | painel a 1024 px; ausente a 390 px |
| q1 | qa | Ajustar os e2e que abrem a sanfona: o projeto `computador` (1280 px) passa a ver o desenho largo. Um helper `abrirComodo(page, nome)` que funciona nos dois | e2e de hoje verde |
| q2 | qa | `layout-computador.spec.ts` (a seguir) | verde |
| q3 | qa | Comparação única, numa cópia, dos 390 px do `main` contra os da branch, nas 5 telas (sem guardar imagem de referência no repositório: fonte e anti-aliasing variam) | 0 pixel diferente, fora a HIS-111 |
| q4 | qa | axe nas 5 telas a 1280 e 1440 px; capturas de 390, 1024 e 1440 px e de zoom de 200% | nada novo; sem erro no console |
| q5 | qa | Peso (L8) e atualização do `peso-js.json` | dentro de L8 |

Estimativa: cerca de 2,5 dias (frontend 1,5 e qa 1).

**L12. `layout-computador.spec.ts` (projeto `computador`, com viewport por teste).**

- **Container (critério 1):** a 1024, 1200 e 1440 px, a largura do `main` é no máximo 1200 px, e de 1024 a 1200 px a
  sobra até o container é de no máximo 32 px de cada lado.
- **`/casa`:** a caixa da conta fica acima das outras; "Quem mais gasta" fica à direita de "Seus cômodos" (`x` maior).
- **`/casa/comodos`:**
  - tocar no 3º cômodo não muda o `scrollY`, o foco fica no botão e o `aria-current` vai para ele;
  - Tab: "Por cômodo/Painel geral" → os botões da lista → "Adicionar cômodo" → painel;
  - `#comodo-<id>` abre aquele cômodo;
  - nenhum `id` repetido (`document.querySelectorAll('[id]')`).
- **`/casa/dicas`:** 2 colunas a 1024 px e 3 a 1280 px (pelo `x` dos cartões).
- **`/comecar`:** o `aside` fica visível a 1024 px e sem caixa a 390 px; o texto muda com o passo.
- **Zoom (critério 10):** viewport de 720 px, o equivalente a 1440 px com zoom de 200%. Sem rolagem para o lado
  (`scrollWidth <= clientWidth`) e com o desenho do celular. O mesmo vale para 360 px (400%).
- **68 caracteres (critério 7):** a 1440 px, todo `p` do `main` com largura até `68 × largura do "0"`.
- **Sem movimento novo (critério 9):** com `reducedMotion: "reduce"`, trocar de cômodo não dispara animação
  (`getAnimations().length === 0` no painel).

## Ameaças

Nenhuma nova (sem dado novo, sem entrada nova).

## Plano de testes

Ponta a ponta (Playwright) a 390 e 1440 px em cada tela; teste de que a 390 px o painel de `/comecar` não existe; teste
de teclado nos cômodos (Tab passa pela lista e depois pelo painel); axe sem violação nova; teste de zoom a 720 px sem
rolagem horizontal.

## Perguntas abertas

- [x] [para: scrum-master] Qual a sprint? — **Resposta:** Sprint 1, depois da HIS-111 e da 003a no `main`; entregue.
- [x] [para: dono do projeto] Aprovar as maquetes — **Resposta:** aprovadas.
- [x] [para: frontend] Os passos do `Cadastro` batem com a tabela de textos do painel? O que faltar, voltar ao ux.
  — **Resposta (tech-lead, 2026-11-12):** batem os 9, um a um (L7). Um `Record` fechado faz o `typecheck` reprovar
  passo novo sem texto.
- [x] [para: seguranca] (respondida em 2026-11-12, textos corrigidos em `f259306`) Conferir a frase "Nada sai do seu aparelho sem você aceitar." contra o que o site faz hoje.
- [x] [para: tech-lead] Peso 11b (L8): com f1–f3, `/casa (com casa)` dá +2 084 B e as abas `/casa*` +2 036 B (limite +2 048).
  O 11b de toda aba soma o chunk da `/casa/comodos` (11a +1 889 B, dentro do limite dela), então o teto de 11b não fecha
  com o de 11a, e f4–f7 ainda vão somar. Subir o 11b só para a HIS-112 ou cortar algo?

## Conversa da equipe

### [ux-acessibilidade] 2026-11-03 — desenho do layout para computador pronto
Desenhei `/casa` e `/casa/comodos` em maquete e descrevi `/casa/dicas`, `/casa/ajustes` e `/comecar`. Ponto de corte
`lg` (1024 px); container de 75rem; o celular não muda. Ordem de foco igual à do celular, menos nos cômodos (lista, depois
painel; um desenho por vez via media query). Faltam: o dono ver as maquetes, e o scrum-master escolher a sprint.
Próximo: dono do projeto (aprovar), depois frontend.

### [tech-lead] 2026-11-12 — desenho técnico pronto (L1–L12), sobre o `main` em `deed1f7`
- Container de 75rem na `Casca` (não no layout de `/casa`), com corte no `lg:` (64rem). Tudo em CSS com a ordem do JSX intacta, mais a utilidade `lateral-fixa` para a coluna que gruda.
- Único JS novo: `useTelaLarga` (`useSyncExternalStore`, sem linha da HIS-109), só para a `/casa/comodos`, que troca de desenho e reaproveita o `ConteudoDoComodo`.
- Peso: até +2 048 B na `/casa/comodos` e +1 024 B nas outras rotas (L8). Três pontos em que o critério vence o "Fluxo" estão no L9; o ux pode contestar.
- Rebase (L10): f1–f3 começam já; f4–f7 (`Casca`, `/casa`, ajustes, cadastro) só depois da 003a no `main`. Respondi à pergunta do frontend: os 9 textos batem.
- Próximo: **frontend** (f1–f3 já) ‖ **seguranca** (frase do painel) → **qa** (q1–q5, L12).

### [seguranca] 2026-11-12 — frase do painel e 9 textos: pedido de ajuste (sem bloqueio de segurança)
Conferido no código: casa só em `localStorage` (`casa.ts`), único `fetch` é GET de `/dados/*.json`, sem rastreador; "Apagar tudo" zera tudo e regrava vazio (verdadeiro).
- **Frase fixa:** "Nada sai do seu aparelho" é falso à letra: o `fetch` de `/dados/municipios/UF.json` mostra o estado ao servidor do site. Use: "Suas respostas ficam só neste aparelho. Não enviamos nada sobre a sua casa."
- **Empresa de luz:** não existe botão "Não sei" nem "a mais comum da cidade" (`Cadastro.tsx` l. 280–307). Troque o final por "Se não achar, peça a conta a alguém da casa ou veja no site da distribuidora."
- **Conta:** só compara com a estimativa, não recalibra. Troque por "Comparamos o valor com a nossa estimativa, para você ver a diferença."

### [frontend] 2026-11-12 — f1, f2 e f3 prontas (`06f430b`, `3f0f8e8`, `4fb507e`)
- f1 `ui/telaLarga.ts` + `@utility lateral-fixa`; f2 `ConteudoDoComodo` (miolo comum) + `ComodosNoComputador` (lista em `nav`, `aria-current`, painel `section`); o `#comodo-id` vem por `useSyncExternalStore` (o Next grava o endereço depois do render); foco ao `h1` só se o elemento focado sumiu; f3 grade 2/3 colunas, plano à direita; cartão de dica empilha o ícone no `lg:`.
- 390 e 800 px iguais pixel a pixel ao `b07454e`; lint, typecheck, test, build e axe verdes; 0 HIS-109 nova. Textos novos só os do "Fluxo": "Adicionar cômodo", "Editar cômodo", "Total por mês", "Nenhum cômodo ainda.". Sem f4, a 1440 px as 3 colunas de dica ficam apertadas no `max-w-4xl` (capturas com f4 simulado em `.../scratchpad/his112/com-f4/`).
- **qa (q1):** quebram a 1280 px, pelo desenho novo: `comodos.spec.ts:31` e `:39` e `fluxo-principal.spec.ts:23` (procuram `section[id^="comodo-"]`). Peso: pergunta ao tech-lead acima.
- Próximo: **tech-lead** (peso 11b) → frontend f4–f7 depois da 003a; **qa** q1.

### [tech-lead] 2026-11-13 — peso 11b da HIS-112: aceito, com teto novo e sem corte
1. O erro foi meu no L8: o 11b de cada aba soma o chunk das outras abas por prefetch, então não podia ter o mesmo +2 048 B do 11a. O `useTelaLarga` e o `ComodosNoComputador` só são importados pela `TelaComodos` (conferido com `git grep`), então não há o que cortar fora da `/casa/comodos`.
2. **Teto da HIS-112 inteira (f1–f7):** os tetos do 11a não mudam e continuam sendo a barreira (+2 048 B na `/casa/comodos`, +1 024 B nas outras rotas). O 11b vai até **+4 096 B** por rota. O prefetch roda depois que a página abriu (critério da HIS-001).
3. Passou disso, ou se uma rota que não é a de cômodos subir mais de 1 024 B no 11a, falar comigo antes de mudar o `peso-js.json`. O qa atualiza o arquivo uma vez, no fim (L8).

### [frontend] 2026-11-13 — f4–f7 prontas, sobre a 003a (`af04c87` merge; `eaf5d98`, `1f602b3`, `799730f`, `4d31a7b`)
- f4 Casca em 75rem e esqueleto com a forma da `/casa`; f5 áreas da `/casa` e conta em 2 colunas; f6 Minha casa em 2 colunas; f7 painel "Por que perguntamos" (`porQuePerguntamos.ts`, `Record` fechado) com os 3 textos da seguranca. **Desvio do L3:** a lateral da `/casa` não usa `lateral-fixa` (com 6 aparelhos e a dica passa da janela e virava caixa com rolagem própria, escondendo a dica).
- Lint, typecheck, test, build e e2e (200 passaram) e axe verdes, sem erro no console. 390 e 800 px: todas as caixas na mesma posição que em `af04c87`; o PNG difere em poucos pixels de anti-aliasing na `/casa` (390) e em `/casa/comodos` e `/casa/dicas` (800), sem caixa que mude (q3 confere).
- Peso contra o `peso-js.json` da 003a: 11a `/casa/comodos` +1 998 B, `/comecar` +694, `/casa` +398; 11b +3 143 (teto +4 096). O spec ainda reprova o 11b, porque o teto no código continua em +2 048: **qa** (q5). Os 3 e2e de 1280 px do q1 seguem com o qa.
- Capturas de 390, 1024 e 1440 px das 5 telas: `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/his112/f4-f7/`. Próximo: **qa** (q1–q5) ‖ **ux** (desvio do L3).

### [qa] 2026-11-13 — q1–q5 feitos: aprovado, sem defeito; 1 achado para ux e frontend
1. **q1:** helper `abrirComodo`/`esperarComodoAberto` (`e2e/apoio/telas.ts`) para a sanfona e para lista + painel; `comodos.spec` e `fluxo-principal` voltam a passar a 1280 px. **q2/q4:** `layout-computador.spec.ts` (só `computador`, de 390 a 1440 px) cobre os critérios 1, 3 a 10 e o axe a 1024 e 1440 px; e2e completo numa cópia com 226 testes que passam e 0 falhas, lint e typecheck verdes.
2. **q3 (critério 2): 0 pixel diferente** a 390 e a 800 px nas 5 telas, contra a `d324b66` (`main` + 003a, sem a 112). Comparei com movimento reduzido e sem ele; o build repetido contra ele mesmo também dá 0. A diferença que o frontend viu não se repete; com as animações paradas não há ruído, e a tolerância de 16/255 não foi usada.
3. **q5:** 11b no código passa a +4 096 B (`apoio/peso.ts`, com a decisão do c9e9fbd), e os negativos N6 seguem a constante. Contra a referência da 003a: 11a `/casa/comodos` +1 998 B (teto L8 +2 048), outras rotas até +694; 11b até +3 143. `peso-js.json` regravado com `decisao`.
4. **Achado A-112-1 (ux, frontend; não reprova o critério 3):** a 1440 px, na `/casa`, a coluna lateral (6 aparelhos e a dica) mede cerca de 1 060 px, e "Seus cômodos" cerca de 420 px. Sobra um vão de cerca de 640 px embaixo dos cômodos, antes do "Mês a mês" (captura `scratchpad/qa-his112/capturas/1440_casa.png`).
5. **Observação:** uma vez, no e2e completo antes das minhas mudanças, o `fluxo-principal` no celular contou 13 transições em vez de 14 ao terminar o cadastro. Não se repetiu em 3 rodadas isoladas nem no e2e completo final; fica anotado como possível instabilidade.
6. Evidências fora do git: `…/scratchpad/qa-his112/` (`q3/`, `q3m/`, `capturas/`, `e2e-completo.txt`). **Próximo:** ux e frontend (A-112-1) ‖ seguranca e tech-lead.

### [ux] 2026-11-13 — A-112-1: aprovo a correção do `718c5b1` (opção a)
1. WCAG 2.4.3 e 1.3.2: a ordem esquerda-topo, direita-topo, esquerda-baixo segue a leitura em Z e não muda o sentido; "Mês a mês" não depende de vir logo depois dos cômodos, e o foco nunca some nem pula sem aviso. O vão de 640 px era pior para quem usa lupa.
2. Condição: nenhum controle da lateral pode abrir ou mudar algo na coluna esquerda sem aviso (hoje não muda). Se mudar, voltar a falar comigo. Próximo: **frontend** (merge).

### [documentacao] 2026-11-13 — documentação fechada
Atualizei `site.md` (seção "Layout no computador", tabelas de telas e de `ui/`), `guia-de-uso.md` (uma linha), `arquitetura.md` (`useTelaLarga`) e `CHANGELOG.md` (duas partes). Conferido no código, incluindo o A-112-1 (Mês a mês sob os cômodos).
O CHANGELOG não tinha entrada da HIS-110: a da HIS-112 ficou no topo, acima da HIS-003a; mover quando a 110 entrar.
Próximo: **scrum-master** (conferir a Definição de Pronto).

### [tech-lead] 2026-11-13 — code review final (etapa 7): aprovado
1. **Aprovado** (f1–f7, q1–q5 e A-112-1; a 003a ficou de fora da revisão). Camadas certas: `ui/telaLarga.ts` sem diretiva, e os cômodos só importam o core, a `ui/` e o `./`. JS novo só nos cômodos: o `useTelaLarga` e o hash, os dois por `useSyncExternalStore`, mais um efeito de foco que só lê o DOM. Continuam **7** linhas da HIS-109, as mesmas da 003a. O `lg:`/`xl:` está coerente nas 5 telas, sem `md:` novo, e o A-112-1 muda só o CSS, com o DOM igual.
2. Como verifiquei: numa cópia, lint, typecheck (89 arquivos), test (239 + 16 + 104 + 152) e build verdes. O celular igual a 390 e 800 px e o peso vêm do qa (q3, q5), dentro do L8 revisto.
3. Ajuste pequeno, que não bloqueia: no esqueleto da `Casca`, o bloco `hidden lg:block` é o último filho, e o `space-y-4` dá 1rem a mais embaixo do 2º bloco no celular, só enquanto carrega. Pôr o bloco do `lg:` antes do 2º bloco, ou usar `max-lg:` no espaçamento, na próxima vez que a `Casca` for mexida.
4. Próximo: **seguranca** (se faltar) e o fechamento (documentacao → scrum-master).

### [scrum-master] 2026-11-13 — Definição de Pronto conferida: **Pronto**, com ressalvas
Conferido pelas notas, sem rodar testes: dono (maquetes), tech-lead (L1–L12; review em `16b4312`), qa (q1–q5, 226 e2e, 0 pixel a 390 e 800 px, peso dentro do L8 revisto), ux (A-112-1, ordem em Z), seguranca (textos de `/comecar`, `f259306`), documentação (`93a0c29`). Perguntas abertas todas respondidas.
- **Ressalvas (não bloqueiam):** (1) esqueleto da `Casca` com 1rem a mais no celular só enquanto carrega, vira **HIS-116** no backlog; (2) condição da ux: nenhum controle da lateral da `/casa` pode mudar a coluna esquerda sem aviso; (3) CHANGELOG: mover a entrada da HIS-112 quando a 110 entrar; (4) instabilidade única de 13 × 14 transições já está no DEF-002b-1; (5) a branch ainda precisa de PR e merge (quem orquestra).
Próximo: **quem orquestra** abre a PR da `his-112-layout-computador`.

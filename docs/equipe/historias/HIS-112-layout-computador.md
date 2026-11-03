# HIS-112 · Layout para computador (telas de 1024 px ou mais)

| Campo | Valor |
| --- | --- |
| Épico | a definir (scrum-master) |
| Sprint | a definir pelo scrum-master (proposta: logo depois da HIS-111) |
| Tamanho | M |
| Papéis principais | ux-acessibilidade (desenho feito), frontend (qa confere) |
| Status | Desenho pronto, falta o dono ver as maquetes |
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

A preencher pelo tech-lead e pelo frontend. Observação do ux: preferir classes do Tailwind em `lg:`, nada de
componente novo além do hook de media query e do painel lateral de `/comecar`.

## Ameaças

Nenhuma nova (sem dado novo, sem entrada nova).

## Plano de testes

Ponta a ponta (Playwright) a 390 e 1440 px em cada tela; teste de que a 390 px o painel de `/comecar` não existe; teste
de teclado nos cômodos (Tab passa pela lista e depois pelo painel); axe sem violação nova; teste de zoom a 720 px sem
rolagem horizontal.

## Perguntas abertas

- [para: scrum-master] Qual a sprint? Integrar a HIS-111 antes, porque as duas mexem na `Casca`.
- [para: dono do projeto] Aprovar as maquetes (`/casa` e `/casa/comodos`) antes de implementar. As outras três telas estão
  só descritas.
- [para: frontend] Os passos do `Cadastro` batem com a tabela de textos do painel? O que faltar, voltar ao ux.
- [para: seguranca] Conferir a frase "Nada sai do seu aparelho sem você aceitar." contra o que o site faz hoje.

## Conversa da equipe

### [ux-acessibilidade] 2026-11-03 — desenho do layout para computador pronto
Desenhei `/casa` e `/casa/comodos` em maquete e descrevi `/casa/dicas`, `/casa/ajustes` e `/comecar`. Ponto de corte
`lg` (1024 px); container de 75rem; o celular não muda. Ordem de foco igual à do celular, menos nos cômodos (lista, depois
painel; um desenho por vez via media query). Faltam: o dono ver as maquetes, e o scrum-master escolher a sprint.
Próximo: dono do projeto (aprovar), depois frontend.

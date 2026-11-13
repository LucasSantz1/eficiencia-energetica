# O site por dentro (`apps/web`)

Manual técnico do site: rotas, telas, componentes, estado, dados, aparência e movimento.
O código fica em camadas (`app/`, `funcionalidades/`, `ui/`, `aplicacao/`, `infraestrutura/`, `config/`); as regras de
quem pode usar quem estão em [../arquitetura.md](../arquitetura.md#camadas-do-site). Todos os caminhos abaixo são
relativos a `apps/web/src/`.

## Tecnologias

| Pacote | Versão | Para quê |
| --- | --- | --- |
| Next.js | 16.4.3 | rotas (App Router), páginas estáticas, Turbopack |
| React | 19.3.1 | interface, `<ViewTransition>` para as transições |
| Tailwind CSS | 4.3.3 | estilos com tokens em `@theme` |
| Zustand | 5.0.16 | estado da casa, guardado no navegador |
| lucide-react | 1.64.0 | ícones |
| Atkinson Hyperlegible Next, Archivo | 5.3.0 | fontes (texto e títulos da página inicial) |

## Rotas (`app/`)

As rotas são finas: não têm `"use client"` nem regra de negócio, só devolvem a tela da funcionalidade.

| Arquivo | Tipo | Tela que monta |
| --- | --- | --- |
| `layout.tsx` | servidor | fontes, metadados, `lang="pt-BR"` |
| `page.tsx` | servidor, estático; `revalidate = 86400` (1 dia) | `PaginaInicial`, com os números de `carregarNumerosDoInicio()` |
| `comecar/page.tsx` | servidor (metadados) | `Cadastro`, dentro de `TransicaoTela` |
| `casa/layout.tsx` | servidor | envolve as telas da casa na `Casca` |
| `casa/page.tsx` | servidor | `PainelAcompanhamento` |
| `casa/comodos/page.tsx` | servidor | `TelaComodos` |
| `casa/dicas/page.tsx` | servidor | `TelaDicas` |
| `casa/ajustes/page.tsx` | servidor | `TelaAjustes` |
| `casa/aparelhos/page.tsx` | redirecionamento | endereço antigo: leva para `/casa/comodos`. A página é estática, então o servidor responde **200** com o redirecionamento dentro do conteúdo (`NEXT_REDIRECT`), e quem troca de endereço é o navegador |
| `sobre/page.tsx` | servidor, estático | conteúdo fixo, sem estado (fica na própria rota) |
| `global-error.tsx` | cliente | tela de erro geral (T3): `TelaDeErro` com `<html>` e `<body>` próprios, porque substitui o documento inteiro. É o único limite de erro: não há `error.tsx` por rota, que pesaria cerca de 1,3 kB em toda rota |
| `not-found.tsx` | servidor | página não encontrada (T4): "Não achamos esta página" e "Voltar ao início" |
| `manifest.ts`, `icon.svg` | — | instalação como aplicativo |
| `globals.css` | — | tokens, utilidades de animação e regras de transição |

## Telas (`funcionalidades/`)

Uma pasta por funcionalidade. Uma funcionalidade não importa outra; o que é usado por mais de uma sobe para `ui/` ou
`aplicacao/`. Todas as telas são componentes de cliente (`"use client"`), menos a `PaginaInicial`.

| Arquivo | O que faz |
| --- | --- |
| `inicio/PaginaInicial.tsx` | página inicial (componente de servidor): números reais, bandeira do mês, ranking, perguntas |
| `inicio/Simulador.tsx` | simulador rápido da página inicial |
| `inicio/BotaoComecar.tsx`, `inicio/CasaIlustrada.tsx` | botão de começar ("Ver a minha casa" para quem já cadastrou) e a ilustração da casa por cômodos |
| `cadastro/Cadastro.tsx` | assistente de cadastro, uma pergunta por tela |
| `cadastro/porQuePerguntamos.ts` | os textos do painel "Por que perguntamos" no computador, um por passo |
| `cadastro/rascunho.ts` | a casa antes de ser criada: `ajustarComodos`, `rascunhoParaCasa`, `itemDoCatalogoParaComodo` |
| `casca/AvisoTrocaDistribuidora.tsx` | aviso "O preço da luz foi atualizado" quando a empresa de luz salva mudou de nome ou foi incorporada (HIS-111); só na visita em que a troca acontece, até "Entendi"; não aparece se a casa tem conta de luz informada |
| `inicio/AvisoDaCasaNoInicio.tsx` | o aviso T1 na página inicial, para quem abre o site por ela |
| `casca/Casca.tsx` | moldura da área da casa: marca, cidade, navegação de 4 seções (embaixo no celular, no topo no computador), transição entre telas; espera a casa carregar e mostra "Vamos cadastrar" a quem ainda não tem casa |
| `acompanhamento/PainelAcompanhamento.tsx` | tela `/casa`: conta estimada, cômodos, quem mais gasta, economia do plano |
| `acompanhamento/Acompanhamento.tsx` | contas de luz e leituras do relógio, com gráficos |
| `comodos/TelaComodos.tsx` | cômodos (sanfona no celular, lista e painel no computador), editor de aparelho, painel geral, novo cômodo |
| `comodos/ComodosNoComputador.tsx`, `comodos/ConteudoDoComodo.tsx` | o desenho de lista e painel a partir de 1024 px, e o miolo de um cômodo, comum aos dois desenhos |
| `dicas/TelaDicas.tsx` | dicas e plano de economia |
| `ajustes/TelaAjustes.tsx` | minha casa: onde mora, benefício, tipo de ligação, conta de luz e "Apagar todos os meus dados" |

## Componentes (`ui/`)

Genéricos, sem regra de negócio e sem estado da casa: os dados entram por propriedades e as mudanças saem por funções
de retorno. Podem chamar funções puras do `@ee/core` (formatação, catálogo, cálculo para exibir). Um arquivo por componente.

| Arquivo | O que faz |
| --- | --- |
| `Botao.tsx` | `Botao` e `BotaoLink` |
| `Opcao.tsx` | cartão de escolha |
| `Pilulas.tsx` | abas em pílula |
| `Contador.tsx` | − n +, com `compacto` |
| `Campo.tsx`, `Entrada.tsx` | rótulo com ajuda; campo de texto com prefixo e sufixo |
| `Folha.tsx` | janela que sobe por baixo, com `<dialog>` |
| `Aviso.tsx` | aviso de informação, alerta ou destaque |
| `Movimento.tsx` | `TransicaoTela`, `ValorAnimado`, `useValorAnimado`, `Revelar`, `Contagem`, `useVisivel` e os tipos de transição (`IR_ADIANTE`, `VOLTAR`, `ENTRAR_NO_PAINEL`) |
| `Barras.tsx`, `Etiqueta.tsx` | gráfico de barras; a barra em seta nas cores do INMETRO, legenda e selo da bandeira |
| `BuscaCidade.tsx` | busca de cidade sem acento e sem diferenciar maiúsculas |
| `Marca.tsx`, `Icone.tsx` | marca do site; ícone por nome |
| `AvisoDaCasaSalva.tsx` | aviso T1 de que parte da casa salva foi tirada (3 versões: parte, sem cidade e empresa de luz, nada aproveitável); `listaDoQueSaiu` monta "2 aparelhos e 1 conta de luz". O `role="status"` fica na página vazio e o texto chega depois da leitura da casa |
| `AvisoFalhaDeCarga.tsx` | aviso T2 quando `tarifas.json` ou `municipios/{UF}.json` não carregam: "Tentar de novo" (com `aria-disabled` enquanto carrega), versão "sem internet" e frase extra a partir da 2ª falha seguida |
| `TelaDeErro.tsx` | tela T3, usada só pelo `global-error`: texto fixo, sem mensagem técnica, foco no título, aviso da 2ª falha |
| `foco.ts`, `estilosDeBotao.ts` | `focarTitulo()` leva o foco ao `h1` quando o botão que o tinha some; classes de botão reaproveitadas pelos links |
| `telaLarga.ts` | `useTelaLarga()`: diz se a janela tem 1024 px ou mais (`useSyncExternalStore`) |
| `EspacoReservado.tsx` | espaço reservado desligado (não renderiza nada) |

### Componentes de aparelho (`ui/aparelho/`)

Usados pelo cadastro, pelo acompanhamento e pelos cômodos.

| Arquivo | O que faz |
| --- | --- |
| `LinhaAparelho.tsx` | uma linha de aparelho no cômodo: quantidade, tempo de uso, perguntas |
| `BlocoIluminacao.tsx` | lâmpadas do cômodo (tipo e horas acesas) |
| `TempoUso.tsx` | `SeletorTempo`, `SeletorFrequencia`, `SeletorVariantes` |
| `SeletorCatalogo.tsx` | busca e escolha de aparelho no catálogo |
| `EditorAparelho.tsx` | edição completa de um aparelho. Recebe `comodos`, `aoSalvar` e `aoRemover`; quem liga à casa é `useEdicaoDeAparelho()` |
| `tipos.ts` | `ItemComodo` (aparelho de um cômodo antes de ter id na casa) |
| `textosDeUso.ts` | `descreverUso`, `horasPorDiaTexto` |

## Casos de uso (`aplicacao/`)

A porta das telas para os dados. As telas nunca importam `infraestrutura/` direto.

- **`casa.ts`** — reexporta `useCasa`, `useCasaCarregada`, `useHaDadosGuardados`, `DadosCasa` e `novoId`; define `useAvisoDaCasaSalva()` (o aviso T1, que só existe depois de a casa ser lida e pode ser dispensado) e `useDistribuidoraAtualizada()` (a troca de empresa de luz da visita, para o aviso da `Casca`); e `useEdicaoDeAparelho()`, que
  liga o `EditorAparelho` à casa (salvar com id atualiza, sem id cria; remover usa a ação do store, que também tira o
  aparelho do plano).
- **`resumo.ts`** — `useResumo`: junta casa + tarifa + bandeira do mês (e expõe `falhasSeguidas`, `semInternet` e `tentarDeNovo` para o `AvisoFalhaDeCarga`) e chama `resumirCasa`, `gerarDicas` e
  `simularPlano`; também `tarifaMedia` (simulador da página inicial) e `nomeDistribuidora`.
- **`dados-publicos.ts`** — reexporta `useTarifas` e `useMunicipios`, que agora devolvem também `falhasSeguidas`, `semInternet` e `tentarDeNovo`.
- **`numeros-do-inicio.servidor.ts`** — só servidor: `carregarNumerosDoInicio()` devolve distribuidoras, cidades
  atendidas e bandeira do mês para a página inicial; se qualquer leitura falhar, devolve `undefined` e a página mostra
  números aproximados.

## Estado e armazenamento (`infraestrutura/`)

- **`armazenamento/casa.ts`** — `useCasa`, com `persist` do Zustand no `localStorage`, chave `eficiencia-energetica:casa`,
  **versão 2**. É o único lugar que cria o store e o único que usa `zustand`.
  - Dados: `residencia`, `comodos`, `aparelhos`, `contas`, `leituras`, `plano` (ids das dicas).
  - Ações: `criarCasa`, `definirResidencia`, `atualizarResidencia`, `adicionarComodo`, `renomearComodo`, `removerComodo`,
    `adicionarDoCatalogo`, `adicionarAparelho`, `atualizarAparelho`, `removerAparelho`, `salvarConta`, `removerConta`,
    `salvarLeitura`, `removerLeitura`, `alternarNoPlano`, `apagarTudo`.
  - Leitura segura (HIS-003a, ADR-004): o `merge` do `persist` passa a casa pelo `lerCasaSalva`, descarta só o inválido e
    guarda o `avisoDaCasaSalva`; `dispensarAvisoDaCasaSalva` fecha o aviso. Se o leitor lançar, a gravação trava
    (`textoGuardadoSemLer`) e o cadastro novo guarda a cópia `casa-ilegivel`. `apagarTudo` tira as duas chaves e solta a trava.
  - Migração da versão 1: acrescenta `contas`, `leituras` e `plano` vazios.
  - `useCasaCarregada()` evita mostrar a tela vazia antes de ler o armazenamento.
- **`armazenamento/armazenamento-local.ts`** — `criarArmazenamentoSeguro`: o `storage` do `persist`, que nunca lança
  (nem com a memória cheia ou bloqueada) e tem `travarGravacao`, `liberarGravacao`, `copiarTextoUmaVez` e `existe`.
  `hidratacao.ts` liga o leitor do core à trava.
- **`identificador.ts`** — `novoId()`: id local para cômodos, aparelhos, contas e leituras (`crypto.randomUUID`, ou
  data + número aleatório em navegadores antigos). Não é segredo.
- **`dados-publicos/navegador.ts`** — `useTarifas` e `useMunicipios`: buscam `/dados/tarifas.json` e
  `/dados/municipios/{UF}.json`, com cache em memória (uma busca por arquivo). O arquivo passa por `lerArquivoTarifas`/`lerArquivoMunicipios` e a sigla do estado por `ehUf`. Se falhar, conta `falhasSeguidas` e `tentarDeNovo` busca com `no-cache`.
- **`dados-publicos/arquivos.servidor.ts`** — só servidor (`import "server-only"`): lê `public/dados/tarifas.json` e
  `relatorio.json` do disco para a página inicial. É o único arquivo do site que usa `node:fs`.

Regra: qualquer mudança no formato salvo exige versão nova e `migrate` testado, para ninguém perder a casa.

## Configuração (`src/config/recursos.ts`)

`RECURSOS.espacosReservados = false`. Chaves para ligar e desligar recursos sem mexer nas telas.

## Layout no computador (a partir de 1024 px)

Abaixo de 1024 px (`lg` do Tailwind, 64rem) nada mudou: é o desenho do celular. A partir daí, quase tudo é só CSS com
classes `lg:`, e a ordem do código (e do foco do teclado) é a mesma do celular.

- **Largura:** a `Casca` e o `/comecar` passam de `max-w-4xl` (e `max-w-2xl`) para `75rem` (1200 px), com margem de 2rem.
- **Coluna que acompanha a rolagem:** a utilidade `lateral-fixa` (`globals.css`) só vale a partir de `lg`. Fica presa ao
  topo (`sticky`), com no máximo a altura da janela e rolagem própria se passar.
- **Texto corrido** tem no máximo 68 caracteres de largura (`max-w-[68ch]`).

| Tela | Como fica |
| --- | --- |
| `/casa` | a conta em cima: o número à esquerda e a explicação (bandeira, tarifa, Tarifa Social) à direita. Abaixo, "Seus cômodos" à esquerda e, numa coluna lateral de 23,5rem, "Quem mais gasta" e a dica de economia. O "Mês a mês" fica sob os cômodos e a nota final ocupa a largura toda. A lateral não usa `lateral-fixa`: com muitos aparelhos ela passava da janela |
| `/casa/comodos` | lista de cômodos à esquerda, o cômodo aberto à direita; trocar de cômodo não rola a página nem move o foco. O `#comodo-id` na barra de endereço abre aquele cômodo. O painel geral perde a rolagem lateral a partir de 1280 px |
| `/casa/dicas` | dicas em 2 colunas (3 a partir de 1280 px) e o resumo do plano numa coluna lateral de 22rem, que acompanha a rolagem |
| `/casa/ajustes` | duas colunas: as quatro seções de ajuste à esquerda e "Seus dados" à direita |
| `/comecar` | o passo à esquerda (até 34rem) e, à direita, o painel "Por que perguntamos", que só explica (`cadastro/porQuePerguntamos.ts`; um texto por passo). Fica oculto por CSS no celular |

`/casa/comodos` é a única tela que troca de desenho por JavaScript: `ui/telaLarga.ts` exporta `useTelaLarga()`, que usa a
mesma consulta do `lg` (`(width >= 64rem)`). Abaixo dela, `TelaComodos` mostra as sanfonas (`CartaoComodo`); acima,
mostra `ComodosNoComputador`. Os dois usam o mesmo miolo, `ConteudoDoComodo`, então a regra de lâmpada e sugestão não é
copiada. Ao dar zoom e cruzar os 1024 px, o foco vai para o título se o elemento focado sumiu. Peso: ver
`apps/web/e2e/peso-js.json`.

## Aparência

- Tokens em `globals.css` (`@theme`): tinta (azul-marinho), energia (verde, ação e economia), faísca (amarelo, destaque em
  fundo escuro), faixas A–E da etiqueta do INMETRO, papel e fundo, raio dos cartões.
- Utilidades próprias (`@utility`): `surgir`, `cresce-x`, `cresce-y`, `pulo`, `acende`, `titulo-largo`, `numeros`, `seta-etiqueta`, `folha`; classes `revelar` (surge ao rolar) e `sanfona`.

## Movimento

| Tipo de transição | Quando |
| --- | --- |
| `nav-forward` | avançar (link ou passo do cadastro): a tela nova entra pela direita |
| `nav-back` | voltar: entra pela esquerda |
| `entrar-painel` | fim do cadastro: o painel cresce a partir do centro |

O cabeçalho (`topo`) e a navegação (`navegacao`) ficam parados durante a troca. As abas ativas (`aba-ativa`, `pilula-ativa`)
deslizam de uma opção para a outra. Com `prefers-reduced-motion: reduce`, nada se move.

## Cabeçalhos e cache (`next.config.ts`)

- `transpilePackages: ["@ee/core"]`, `poweredByHeader: false`.
- `/dados/*`: `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`.
- Cabeçalhos de segurança entram na HIS-003.

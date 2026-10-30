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
| `cadastro/rascunho.ts` | a casa antes de ser criada: `ajustarComodos`, `rascunhoParaCasa`, `itemDoCatalogoParaComodo` |
| `casca/Casca.tsx` | moldura da área da casa: marca, cidade, navegação de 4 seções (embaixo no celular, no topo no computador), transição entre telas; espera a casa carregar e mostra "Vamos cadastrar" a quem ainda não tem casa |
| `acompanhamento/PainelAcompanhamento.tsx` | tela `/casa`: conta estimada, cômodos, quem mais gasta, economia do plano |
| `acompanhamento/Acompanhamento.tsx` | contas de luz e leituras do relógio, com gráficos |
| `comodos/TelaComodos.tsx` | cômodos em sanfona, editor de aparelho, painel geral, novo cômodo |
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

- **`casa.ts`** — reexporta `useCasa`, `useCasaCarregada`, `DadosCasa` e `novoId`; define `useEdicaoDeAparelho()`, que
  liga o `EditorAparelho` à casa (salvar com id atualiza, sem id cria; remover usa a ação do store, que também tira o
  aparelho do plano).
- **`resumo.ts`** — `useResumo`: junta casa + tarifa + bandeira do mês e chama `resumirCasa`, `gerarDicas` e
  `simularPlano`; também `tarifaMedia` (simulador da página inicial) e `nomeDistribuidora`.
- **`dados-publicos.ts`** — reexporta `useTarifas` e `useMunicipios`.
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
  - Migração da versão 1: acrescenta `contas`, `leituras` e `plano` vazios.
  - `useCasaCarregada()` evita mostrar a tela vazia antes de ler o armazenamento.
- **`identificador.ts`** — `novoId()`: id local para cômodos, aparelhos, contas e leituras (`crypto.randomUUID`, ou
  data + número aleatório em navegadores antigos). Não é segredo.
- **`dados-publicos/navegador.ts`** — `useTarifas` e `useMunicipios`: buscam `/dados/tarifas.json` e
  `/dados/municipios/{UF}.json`, com cache em memória (uma busca por arquivo; se falhar, tenta de novo na próxima vez).
- **`dados-publicos/arquivos.servidor.ts`** — só servidor (`import "server-only"`): lê `public/dados/tarifas.json` e
  `relatorio.json` do disco para a página inicial. É o único arquivo do site que usa `node:fs`.

Regra: qualquer mudança no formato salvo exige versão nova e `migrate` testado, para ninguém perder a casa.

## Configuração (`src/config/recursos.ts`)

`RECURSOS.espacosReservados = false`. Chaves para ligar e desligar recursos sem mexer nas telas.

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

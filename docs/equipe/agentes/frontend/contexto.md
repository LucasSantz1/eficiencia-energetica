# Contexto · Front-end

## O que eu cuido

- Tudo em `apps/web/src/`: rotas (`app/`), componentes, estado local, animações, PWA.

## Estado atual (mapa do código)

Estrutura em camadas do ADR-001 desde a HIS-001 (caminhos a partir de `apps/web/src/`). Desde a HIS-002b:
`pnpm lint` (ESLint 10, `eslint.config.mjs` na raiz, `--max-warnings 0`, no CI) tem a matriz de camadas e a sintaxe
proibida; `pnpm camadas` (`scripts/verificar-camadas.mjs`, parser do TS, dentro do `pnpm typecheck`) tem o que depende
de outro arquivo (C1–C10, inclusive a S2/C8); os casos ficam em `scripts/testes/` (`pnpm test:camadas`).

| Onde | O quê |
| --- | --- |
| `app/` | rotas finas, sem `"use client"`: `page.tsx` (lê os números com `carregarNumerosDoInicio` e mantém `revalidate = 86400`), `comecar/`, `sobre/`, `casa/layout.tsx` (monta a `Casca`), `casa/*/page.tsx` (só `<TelaX />`), `casa/aparelhos` (redireciona) |
| `funcionalidades/inicio/` | `PaginaInicial` (componente de servidor, recebe `numeros`), `BotaoComecar`, `Simulador`, `CasaIlustrada` |
| `funcionalidades/cadastro/` | `Cadastro` (assistente em etapas; estado `concluindo` evita piscar no fim) e `rascunho.ts` |
| `funcionalidades/casca/` | `Casca` (topo, abas, transições `topo`/`navegacao`/`aba-ativa`, "Vamos cadastrar") |
| `funcionalidades/acompanhamento/` | `PainelAcompanhamento` (conta, cômodos, ranking, melhor dica) e `Acompanhamento` (contas e relógio) |
| `funcionalidades/comodos/` · `dicas/` · `ajustes/` | `TelaComodos` (sanfona no celular, painel geral, novo/editar cômodo), `ComodosNoComputador` (lista + painel a 1024 px+, HIS-112) e `ConteudoDoComodo` (miolo comum) · `TelaDicas` (plano; grade no `lg:`) · `TelaAjustes` (minha casa, apagar tudo) |
| `ui/` | um componente por arquivo: `Botao` (+`BotaoLink`), `Opcao`, `Pilulas`, `Contador`, `Campo`, `Entrada`, `Folha`, `Aviso`, `Icone`, `Marca`, `Movimento`, `Barras`, `Etiqueta`, `EspacoReservado`, `BuscaCidade`; `tiposDeTransicao.ts` (`IR_ADIANTE`, `VOLTAR`, `ENTRAR_NO_PAINEL`, sem diretiva); `telaLarga.ts` (`useTelaLarga`, sem diretiva, HIS-112) |
| `ui/aparelho/` | componentes de aparelho compartilhados, sem store: `tipos.ts` (`ItemComodo`), `textosDeUso.ts`, `LinhaAparelho`, `BlocoIluminacao`, `TempoUso`, `SeletorCatalogo`, `EditorAparelho` (props `comodos`/`aoSalvar`/`aoRemover`) |
| `aplicacao/` | única porta para `infraestrutura/`: `casa.ts` (`useCasa`, `useCasaCarregada`, `novoId`, `useEdicaoDeAparelho`, `useDistribuidoraAtualizada`), `dados-publicos.ts` (`useTarifas`, `useMunicipios`), `resumo.ts` (`useResumo`, `tarifaMedia`, `nomeDistribuidora`), `numeros-do-inicio.servidor.ts` |
| `infraestrutura/` | `armazenamento/casa.ts` (o único `create` do store: chave `eficiencia-energetica:casa`, versão 2 + `migrate`), `identificador.ts` (`novoId`), `dados-publicos/navegador.ts` (fetch de `/dados`), `dados-publicos/arquivos.servidor.ts` (único `node:fs`) |
| HIS-003a (a4/a5) | `infraestrutura/armazenamento/armazenamento-local.ts` (nunca lança; `travarGravacao`) e `hidratacao.ts` (`lerCasaNaHidratacao`, `dadosSalvaveis`); `ui/AvisoDaCasaSalva`, `ui/AvisoFalhaDeCarga`, `ui/TelaDeErro`, `ui/foco.ts`, `ui/estilosDeBotao.ts`; `app/error.tsx`, `global-error.tsx`, `not-found.tsx`; testes do store em `apps/web/test/` (vitest) |
| `config/recursos.ts` | `RECURSOS.espacosReservados = false` |

## Decisões em vigor

- Layout de computador (HIS-112): só `lg:` (64rem); abaixo disso a classe de hoje fica igual (conferir 390 e 800 px pixel a
  pixel contra o `main`). Coluna que gruda = `lateral-fixa`. Hook de largura só onde o desenho muda (`useTelaLarga`). O
  hash da URL numa tela que monta na navegação do cliente vem por `useSyncExternalStore`, não por inicializador de `useState`.

- Camadas (ADR-001): telas importam estado e dados só de `aplicacao/`; `ui/` não lê estado; funcionalidade não importa
  outra; sem barris `index.ts`; `@/` entre pastas e `./` só na mesma pasta. Código só de servidor em `*.servidor.ts`
  com `import "server-only";` como primeiro import; arquivo `"use client"` nunca importa `.servidor`.
- Componente de servidor (rotas, `PaginaInicial`) e módulo sem diretiva só importam **componentes** (PascalCase) ou
  tipos de módulos `"use client"` (ameaça A7; C8 do script). Constante ou função usada dos dois lados mora em arquivo
  sem diretiva.
- Nenhum `eslint-disable` além da forma da HIS-109 (`// eslint-disable-next-line react-hooks/set-state-in-effect --
  <motivo> (HIS-109)`); qualquer outro comentário que muda regra reprova na C10. Efeito novo que copia estado: reescrever,
  não silenciar (teto de 8).
- Transições com `<ViewTransition>` + `transitionTypes` (`nav-forward`, `nav-back`, `entrar-painel`); `viewTransitionName`
  "topo" e "navegacao" fixam cabeçalho e navegação; indicadores "aba-ativa" e "pilula-ativa".
- Toda conta vem de `@ee/core`. Nomes longos quebram linha (não truncar). Valores fora de barras curtas.
- Distribuidora pelo id salvo: sempre `acharDistribuidora`/`distribuidorasDaCidade` do core (seguem `substituidas`,
  HIS-111/ADR-005); nunca `find`/`Map` por id na tela. Aviso que entra depois do carregamento vai numa região
  `role="status"` sempre presente, com `Aviso anunciar={false}`.

- Casa salva (HIS-003a): o `merge` lê tudo com `lerCasaSalva` a cada abertura; existe aviso exatamente quando algo
  saiu, e só então regrava. Se o leitor lançar, a gravação fica travada (nunca regravar a casa vazia); a trava solta com
  "Apagar tudo" (tira a chave e a `casa-ilegivel`) e com cadastro novo (antes copia o texto bruto, uma vez só) — D10. Toda ação do
  store passa pelo leitor; o que ele recusa não muda nada.
- `/dados`: a tela recebe `falhasSeguidas`, `semInternet`, `carregando` e `tentarDeNovo`, nunca texto técnico. O aviso
  de falha fica sempre montado para levar o foco ao título quando volta a dar certo.
- Só o `global-error.tsx` é tela de erro (sem `app/error.tsx`, D10). O que entra em toda rota (`global-error.tsx`, `not-found.tsx`) não importa `Botao.tsx`, `lucide` nem
  `next/link` no erro: usa `classesDeBotao` (medido: ~8 kB por rota).

## Pendências

- HIS-112: f1–f7 feitas (2026-11-12/13, sobre a 003a). Aguarda qa (q1–q5; o teto do 11b no spec ainda é +2 048) e o
  ux sobre a lateral da `/casa` sem `lateral-fixa`. Quando a #10 entrar, quem orquestra junta o main por cima.

- HIS-001: implementada (2026-10-29); aguarda QA, segurança e tech-lead. Pergunta aberta ao tech-lead: +1 449 B de JS
  em `/casa` sem casa, vindos da repetição de `ui/` nos chunks das abas pré-carregadas.
- HIS-002a: A5 feito (`b0bff1c`, casa ilustrada e `<dl>`) e defeitos D-A5-1/D-A5-2 corrigidos (`92e9fd9`, nome do
  "Quem mais gasta" e região focável da tabela do painel geral). Com isso, o axe passa nos 2 projetos. Falta o qa trocar o seletor
  `^${nome}: ` de `e2e/aparelhos.spec.ts:43` pelo nome novo. Achado para a HIS-110: 2 `dd` `text-white/85` nos cartões
  da Tarifa Social também falham `color-contrast`.
- HIS-002b: no main. O bloco provisório saiu no merge da 003a (`ac4fee4`, 2026-11-12); `TETO_HIS_109` = 7 (7 linhas hoje).
- Teste instável anterior: fluxo principal, "terminar o cadastro" às vezes conta 13 transições em vez de 14 (também no `main`).
- HIS-111: h6 feito (30/10); o D1 do h7 (peso de JS) foi corrigido em 31/10: o 11a de `/casa*` ficou em até +998 B (folga de
  26 B). Aguarda o qa refazer o h7. O `React.lazy` piora o peso com o Turbopack: não usar para economizar bytes.
  O F2 (cidade sem preço: cadastro, cartão de cima do painel, Minha casa) não entrou: mexe no `PainelAcompanhamento`
  da 002a.
- HIS-003a: main integrado (2026-11-12, `4cc37bc`…`9abcd0a`, com push). Falta o tech-lead decidir o peso (11a até
  +10 993 B sobre o main novo; teto +10,5 kB) e o teto 7 × 8 da HIS-109. HIS-003b (limites nas telas) vem depois.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

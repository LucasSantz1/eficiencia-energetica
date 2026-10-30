# Contexto · Front-end

## O que eu cuido

- Tudo em `apps/web/src/`: rotas (`app/`), componentes, estado local, animações, PWA.

## Estado atual (mapa do código)

Estrutura em camadas do ADR-001 desde a HIS-001 (caminhos a partir de `apps/web/src/`). `pnpm camadas`
(`scripts/verificar-camadas.mjs`, dentro do `pnpm typecheck`) barra import que fure as camadas.

| Onde | O quê |
| --- | --- |
| `app/` | rotas finas, sem `"use client"`: `page.tsx` (lê os números com `carregarNumerosDoInicio` e mantém `revalidate = 86400`), `comecar/`, `sobre/`, `casa/layout.tsx` (monta a `Casca`), `casa/*/page.tsx` (só `<TelaX />`), `casa/aparelhos` (redireciona) |
| `funcionalidades/inicio/` | `PaginaInicial` (componente de servidor, recebe `numeros`), `BotaoComecar`, `Simulador`, `CasaIlustrada` |
| `funcionalidades/cadastro/` | `Cadastro` (assistente em etapas; estado `concluindo` evita piscar no fim) e `rascunho.ts` |
| `funcionalidades/casca/` | `Casca` (topo, abas, transições `topo`/`navegacao`/`aba-ativa`, "Vamos cadastrar") |
| `funcionalidades/acompanhamento/` | `PainelAcompanhamento` (conta, cômodos, ranking, melhor dica) e `Acompanhamento` (contas e relógio) |
| `funcionalidades/comodos/` · `dicas/` · `ajustes/` | `TelaComodos` (sanfona, painel geral, novo/editar cômodo) · `TelaDicas` (plano) · `TelaAjustes` (minha casa, apagar tudo) |
| `ui/` | um componente por arquivo: `Botao` (+`BotaoLink`), `Opcao`, `Pilulas`, `Contador`, `Campo`, `Entrada`, `Folha`, `Aviso`, `Icone`, `Marca`, `Movimento`, `Barras`, `Etiqueta`, `EspacoReservado`, `BuscaCidade` |
| `ui/aparelho/` | componentes de aparelho compartilhados, sem store: `tipos.ts` (`ItemComodo`), `textosDeUso.ts`, `LinhaAparelho`, `BlocoIluminacao`, `TempoUso`, `SeletorCatalogo`, `EditorAparelho` (props `comodos`/`aoSalvar`/`aoRemover`) |
| `aplicacao/` | única porta para `infraestrutura/`: `casa.ts` (`useCasa`, `useCasaCarregada`, `novoId`, `useEdicaoDeAparelho`), `dados-publicos.ts` (`useTarifas`, `useMunicipios`), `resumo.ts` (`useResumo`, `tarifaMedia`, `nomeDistribuidora`), `numeros-do-inicio.servidor.ts` |
| `infraestrutura/` | `armazenamento/casa.ts` (o único `create` do store: chave `eficiencia-energetica:casa`, versão 2 + `migrate`), `identificador.ts` (`novoId`), `dados-publicos/navegador.ts` (fetch de `/dados`), `dados-publicos/arquivos.servidor.ts` (único `node:fs`) |
| `config/recursos.ts` | `RECURSOS.espacosReservados = false` |

## Decisões em vigor

- Camadas (ADR-001): telas importam estado e dados só de `aplicacao/`; `ui/` não lê estado; funcionalidade não importa
  outra; sem barris `index.ts`; `@/` entre pastas e `./` só na mesma pasta. Código só de servidor em `*.servidor.ts`
  com `import "server-only";` como primeiro import; arquivo `"use client"` nunca importa `.servidor`.
- Componente de servidor (rotas, `PaginaInicial`) só importa **componentes** de módulos `"use client"` (ameaça A7).
- Transições com `<ViewTransition>` + `transitionTypes` (`nav-forward`, `nav-back`, `entrar-painel`); `viewTransitionName`
  "topo" e "navegacao" fixam cabeçalho e navegação; indicadores "aba-ativa" e "pilula-ativa".
- Toda conta vem de `@ee/core`. Nomes longos quebram linha (não truncar). Valores fora de barras curtas.
- Nome acessível que repete texto visível em `<span>`s irmãos: o axe junta o texto dos filhos **sem espaço**
  (`label-content-name-mismatch`); deixar `{" "}` entre eles (num contêiner flex não aparece). `<dl>` só com
  `dt`/`dd` (ou `div` com eles); texto solto vai fora, com uma grade de mesmo `gap` em volta.
- Região que rola para o lado: `role="region"` + `aria-label` + `tabIndex={0}` sempre (também sem rolagem), contorno
  padrão do `:focus-visible`. Nome acessível de botão com vários blocos: mesmas variáveis para tela e nome.
- Comparar "sem mudança visível" numa cópia própria com execução de controle antes; na `/`, rolar devagar, parar
  animações por CSS e esperar a `Contagem` terminar (sem `clock.setFixedTime`, que a trava). Roteiro:
  `scratchpad/fe-his002/comparar.cjs` (o essencial está na nota da HIS-002a).

## Pendências

- HIS-001: implementada (2026-10-29); aguarda QA, segurança e tech-lead. Pergunta aberta ao tech-lead: +1 449 B de JS
  em `/casa` sem casa, vindos da repetição de `ui/` nos chunks das abas pré-carregadas.
- HIS-002a: A5 feito (`b0bff1c`, casa ilustrada e `<dl>`) e defeitos D-A5-1/D-A5-2 corrigidos (`92e9fd9`, nome do
  "Quem mais gasta" e região focável da tabela do painel geral). Com isso, o axe passa nos 2 projetos. Falta o qa trocar o seletor
  `^${nome}: ` de `e2e/aparelhos.spec.ts:43` pelo nome novo. Achado para a HIS-110: 2 `dd` `text-white/85` nos cartões
  da Tarifa Social também falham `color-contrast`.
- HIS-003: validação com zod, tela de erro, limites de entrada.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

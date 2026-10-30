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

## Pendências

- HIS-001: implementada (2026-10-29); aguarda QA, segurança e tech-lead. Pergunta aberta ao tech-lead: +1 449 B de JS
  em `/casa` sem casa, vindos da repetição de `ui/` nos chunks das abas pré-carregadas.
- HIS-003: validação com zod, tela de erro, limites de entrada.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

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
| `funcionalidades/comodos/` · `dicas/` · `ajustes/` | `TelaComodos` (sanfona, painel geral, novo/editar cômodo) · `TelaDicas` (plano) · `TelaAjustes` (minha casa, apagar tudo) |
| `ui/` | um componente por arquivo: `Botao` (+`BotaoLink`), `Opcao`, `Pilulas`, `Contador`, `Campo`, `Entrada`, `Folha`, `Aviso`, `Icone`, `Marca`, `Movimento`, `Barras`, `Etiqueta`, `EspacoReservado`, `BuscaCidade`; `tiposDeTransicao.ts` (`IR_ADIANTE`, `VOLTAR`, `ENTRAR_NO_PAINEL`, sem diretiva) |
| `ui/aparelho/` | componentes de aparelho compartilhados, sem store: `tipos.ts` (`ItemComodo`), `textosDeUso.ts`, `LinhaAparelho`, `BlocoIluminacao`, `TempoUso`, `SeletorCatalogo`, `EditorAparelho` (props `comodos`/`aoSalvar`/`aoRemover`) |
| `aplicacao/` | única porta para `infraestrutura/`: `casa.ts` (`useCasa`, `useCasaCarregada`, `novoId`, `useEdicaoDeAparelho`, `useDistribuidoraAtualizada`), `dados-publicos.ts` (`useTarifas`, `useMunicipios`), `resumo.ts` (`useResumo`, `tarifaMedia`, `nomeDistribuidora`), `numeros-do-inicio.servidor.ts` |
| `infraestrutura/` | `armazenamento/casa.ts` (o único `create` do store: chave `eficiencia-energetica:casa`, versão 2 + `migrate`), `identificador.ts` (`novoId`), `dados-publicos/navegador.ts` (fetch de `/dados`), `dados-publicos/arquivos.servidor.ts` (único `node:fs`) |
| `config/recursos.ts` | `RECURSOS.espacosReservados = false` |

## Decisões em vigor

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

## Pendências

- HIS-103: textos D1–D6, D8 e D9 corrigidos (2026-11-13, branch `his-103-guia-tarifa-social`). Falta o guia (D7 e o link do D4).

- HIS-001: implementada (2026-10-29); aguarda QA, segurança e tech-lead. Pergunta aberta ao tech-lead: +1 449 B de JS
  em `/casa` sem casa, vindos da repetição de `ui/` nos chunks das abas pré-carregadas.
- HIS-002a: A5 feito (`b0bff1c`, casa ilustrada e `<dl>`) e defeitos D-A5-1/D-A5-2 corrigidos (`92e9fd9`, nome do
  "Quem mais gasta" e região focável da tabela do painel geral). Com isso, o axe passa nos 2 projetos. Falta o qa trocar o seletor
  `^${nome}: ` de `e2e/aparelhos.spec.ts:43` pelo nome novo. Achado para a HIS-110: 2 `dd` `text-white/85` nos cartões
  da Tarifa Social também falham `color-contrast`.
- HIS-002b: B1–B7 feitos (2026-11-03, `7427be6`…`1062111`); aguarda tech-lead (B8, bloco provisório do
  `eslint.config.mjs` para `infraestrutura/armazenamento/casa.ts` e `packages/dados/src/escrever.ts`), qa e seguranca.
  Ao integrar a HIS-003a/HIS-111: `pnpm lint --fix`, pôr o 8º comentário da HIS-109 em `casa.ts:132`, tirar o bloco;
  o efeito novo de `aplicacao/casa.ts` da HIS-111 passaria do teto de 8.
- Teste instável anterior: fluxo principal, "terminar o cadastro" às vezes conta 13 transições em vez de 14 (também no `main`).
- HIS-003: validação com zod, tela de erro, limites de entrada.
- HIS-111: h6 feito (30/10); o D1 do h7 (peso de JS) foi corrigido em 31/10: o 11a de `/casa*` ficou em até +998 B (folga de
  26 B). Aguarda o qa refazer o h7. O `React.lazy` piora o peso com o Turbopack: não usar para economizar bytes.
  O F2 (cidade sem preço: cadastro, cartão de cima do painel, Minha casa) não entrou: mexe no `PainelAcompanhamento`
  da 002a.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

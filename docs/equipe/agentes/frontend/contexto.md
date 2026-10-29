# Contexto · Front-end

## O que eu cuido

- Tudo em `apps/web/src/`: rotas (`app/`), componentes, estado local, animações, PWA.

## Estado atual (mapa do código)

| Onde | O quê |
| --- | --- |
| `app/page.tsx` | página inicial estática (lê `public/dados`, `revalidate` diário) |
| `app/comecar/Cadastro.tsx` | assistente de cadastro em etapas (estado `concluindo` evita piscar no fim) |
| `app/casa/page.tsx` | acompanhamento (conta, cômodos, ranking, melhor dica, histórico) |
| `app/casa/comodos/page.tsx` | cômodos em sanfona, painel geral, novo/editar cômodo |
| `app/casa/dicas/page.tsx` | plano de economia |
| `app/casa/ajustes/page.tsx` | minha casa, conta de referência, apagar tudo |
| `components/` | `ui.tsx`, `Comodo.tsx`, `TempoUso.tsx`, `EditorAparelho.tsx`, `SeletorCatalogo.tsx`, `Acompanhamento.tsx`, `Barras.tsx`, `Etiqueta.tsx`, `Movimento.tsx`, `Casca.tsx`, `EspacoReservado.tsx`... |
| `lib/store.ts` | `useCasa` (Zustand persist versão 2 + `migrate`) |
| `lib/dados.ts`, `lib/resumo.ts`, `lib/rascunho.ts` | leitura de `/dados`, resumo da casa, rascunho do cadastro |
| `config/recursos.ts` | `RECURSOS.espacosReservados = false` |

## Decisões em vigor

- Transições com `<ViewTransition>` + `transitionTypes` (`nav-forward`, `nav-back`, `entrar-painel`); `viewTransitionName`
  "topo" e "navegacao" fixam cabeçalho e navegação; indicadores "aba-ativa" e "pilula-ativa".
- Toda conta vem de `@ee/core`. Nomes longos quebram linha (não truncar). Valores fora de barras curtas.

## Pendências

- HIS-001: mover para `funcionalidades/`, `ui/`, `aplicacao/`, `infraestrutura/` sem mudar nada visível.
- HIS-003: validação com zod, tela de erro, limites de entrada.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

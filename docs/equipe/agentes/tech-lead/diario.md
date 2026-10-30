# Diário · Tech Lead

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-29 · HIS-001 · code review final (etapa 7) aprovado; S1/S2 para a HIS-002, P1–P4 no backlog
- O que fiz: revisei `git diff -M -C --find-copies-harder main...HEAD` arquivo a arquivo (camadas, diretiva dos 55
  arquivos, rotas finas, `PaginaInicial` sem diretiva, `revalidate`, um só `create`, contratos 4.1–4.4, tipos, código
  morto, comentários, script de camadas). Barreiras: typecheck/test no repositório; typecheck/build numa cópia em
  `scratchpad/tl-revisao/copia`; fumaça Playwright (`tl-revisao/fumaca.cjs`, porta 3108) em 9 entradas × 390/1280 → 0 erros.
- Decisões e porquê: **aprovado**. S2 fica para a HIS-002 (pré-existente, inofensivo; corrigir agora anularia a
  comparação byte a byte do qa e a revisão da segurança por ganho zero, e a correção precisa vir com a regra automática).
  ESLint × script: convivem sem regra repetida (ESLint = regras do próprio arquivo; script = destino/estrutura).
  Observações T1 (ordem de imports → `import/order`), T2 (exports só internos, dívida), T3 (`rascunho` → `novoId`, junto da S2).
- Arquivos: `docs/equipe/historias/HIS-001-camadas.md` (seção 12 e nota), `docs/equipe/historias/HIS-002-qualidade-automatica.md`
  (critérios 7–9 e notas), `docs/planejamento.md` (HIS-107, HIS-108), `docs/equipe/quadro.md`, `contexto.md`, este diário.
- Próximos passos: documentacao (etapa 8); depois, desenho definitivo da HIS-002.

## 2026-10-29 · HIS-001 · peso do JS aceito; critério do item 11 dividido em 11a/11b
- O que fiz: respondi a pergunta do frontend sobre +1 449 B na `/casa` sem casa. Build de `57700ab` e `182f355` numa cópia
  no scratchpad (`tl-peso/copia`, porta 3102) e medição do JS referenciado pelo HTML das 7 rotas (`tl-scripts/js-do-html.mjs`).
- Decisões e porquê: aceito sem mudança de código — o JS para abrir caiu em todas as rotas (−437 a −1 705 B) e o aumento
  é só repetição entre chunks baixada pelo prefetch (união das 7 rotas +1 449 B). Critério: 11a JS do HTML ≤ +1 024 B
  (principal), 11b total com prefetch ≤ +2 048 B. Descoberta: o HTML traz um polyfill `noModule` (39 627 B) que o
  navegador moderno não baixa — excluir da medida.
- Arquivos: `docs/equipe/historias/HIS-001-camadas.md` (pergunta e nota), `contexto.md`, este diário.
- Próximos passos: qa atualiza o item 11 e o script; eu faço o code review da etapa 7.

## 2026-10-29 · HIS-001 · script de camadas endurecido e `server-only` (pergunta do seguranca)
- O que fiz: respondi a pergunta `[para: tech-lead]` da A13/A6; reescrevi a seção 6 do desenho e ajustei os passos 1 e 5,
  o contrato 4.4, a linha de risco do `node:fs` e os casos negativos da verificação.
- Decisões e porquê: aceitos (a) raiz por `import.meta.dirname` e erro com 0 arquivos, (b) `require`/`import()` não
  literal = erro, (c) `builtinModules`, (d) diretiva com BOM/comentário/aspas simples, (e) `.servidor` com extensão,
  (f) destino fora de `src/` = erro; `import "server-only"` obrigatório em todo `*.servidor.ts` (o Next 16 trata sem
  pacote novo — doc `05-server-and-client-components.md`, módulo em `next/dist/compiled/server-only`). Recusados:
  grafo de imports indiretos no script e parser (o build e o ESLint cobrem).
- Arquivos: `docs/equipe/historias/HIS-001-camadas.md`, este diário.
- Próximos passos: se um `*.servidor.ts` ganhar teste no Vitest, instalar `server-only` (versão exata) ou fazer alias.

## 2026-10-29 · HIS-001 · desenho técnico definitivo da reorganização em camadas
- O que fiz: li todo o `apps/web/src` e mapeei os imports; escrevi o desenho técnico na história (tabela arquivo → destino
  com a diretiva de cada arquivo, contratos de `aplicacao/casa.ts`, `EditorAparelho` e página inicial, estrutura final,
  script de camadas, 8 passos, riscos, verificação e dívida); respondi a pergunta aberta; revisei o ADR-001.
- Decisões e porquê: `ui/aparelho/` sem store para os componentes de aparelho compartilhados (evita funcionalidade
  importando funcionalidade); `ui/` pode usar funções puras do core; `aplicacao/` como única porta para
  `infraestrutura/` (`useEdicaoDeAparelho` liga o editor à casa); `Casca` em `funcionalidades/casca/`; `*.servidor.ts`
  para código com `node:fs`; sem barris; telas grandes não são divididas agora, para a revisão ver só movimentos e
  imports; script Node puro dentro do `pnpm typecheck`, sem mudar o CI.
- Arquivos: `docs/equipe/historias/HIS-001-camadas.md`, `docs/equipe/decisoes/ADR-001-camadas.md`,
  `docs/equipe/quadro.md`, `docs/equipe/agentes/tech-lead/contexto.md`, este diário.
- Próximos passos: `seguranca` faz a análise de ameaças; `qa` faz a linha de base (passo 0) antes do `frontend`
  começar; eu faço o code review na etapa 7.

## 2026-10-29 · criação da equipe
- O que fiz: ADR-001 (camadas) e ADR-002 (espaços reservados) registrados; proposta inicial do desenho da HIS-001.
- Próximos passos: ver "Pendências" em `contexto.md`.

# HIS-002 · Qualidade automática no CI

| Campo | Valor |
| --- | --- |
| Épico | E0 · Fundação |
| Sprint | 0 |
| Tamanho | M |
| Papéis principais | qa, tech-lead |
| Status | Preparada |
| Branch | `his-002-qualidade` |

## Problema e valor

Como **equipe**, queremos **que o CI teste sozinho o fluxo principal, a acessibilidade e o padrão de código** para
**nenhuma mudança quebrar o site ou piorar a acessibilidade sem que a gente perceba antes de ir para o ar**.

Hoje o CI faz typecheck, testes de unidade e build. Os testes no navegador são feitos à mão, com scripts soltos.

## Critérios de aceite

1. **Dado** um push ou pull request, **quando** o CI roda, **então** ele executa ESLint (configuração do Next 16) sem erros.
2. **Dado** o site de produção construído no CI, **quando** os testes Playwright rodam, **então** eles percorrem o fluxo
   cadastro → acompanhamento → cômodos → dicas → minha casa em 390 px e 1280 px, falhando em qualquer erro de console.
3. **Dado** as páginas `/`, `/comecar`, `/casa`, `/casa/comodos`, `/casa/dicas`, `/casa/ajustes` e `/sobre`, **quando** o axe roda,
   **então** não há violação de gravidade séria ou crítica.
4. **Dado** um teste que falha, **quando** o CI termina, **então** as capturas e o relatório ficam disponíveis como artefato do job.
5. Regras de lint incluem: sem `any` explícito, sem `dangerouslySetInnerHTML`, e as restrições de import entre camadas (ADR-001).
6. `pnpm test:e2e` roda localmente com o mesmo resultado.
7. **Dado** cada caso negativo de camadas da HIS-001 (item 7 da seção 10, R13 e os 21 extras da seguranca) **e** cada
   lacuna da S1 (lista abaixo), **quando** ele é escrito num arquivo de exemplo, **então** `pnpm lint` ou `pnpm camadas`
   falha com a mensagem da regra — conferido por um teste automático no CI (fixtures numa pasta de teste, fora de
   `apps/web/src`), não só à mão. _(tech-lead, vindo da HIS-001)_
8. **Dado** um arquivo sem `"use client"` (componente de servidor ou módulo comum), **quando** ele importa um **valor que
   não é componente** de um módulo `"use client"`, **então** a verificação falha (S2 da HIS-001). As constantes de
   transição (`IR_ADIANTE`, `VOLTAR`, `ENTRAR_NO_PAINEL`) saem de `ui/Movimento.tsx` para `ui/tiposDeTransicao.ts` (sem
   diretiva) e o `novoId` usado por `funcionalidades/cadastro/rascunho.ts` passa a vir de um arquivo sem diretiva
   (ex.: `aplicacao/identificador.ts` reexportando `infraestrutura/identificador.ts`). _(tech-lead, vindo da HIS-001)_
9. **Dado** a medida de peso de JS da HIS-001 (11a: JS que o HTML de cada rota referencia, sem `noModule`, com gzip,
   no máximo +1 024 B; 11b: total com prefetch, no máximo +2 048 B), **quando** o e2e roda num PR, **então** ele compara
   com a referência guardada no repositório (ex.: `apps/web/e2e/peso-js.json`, atualizada de propósito no PR que muda o
   peso, sem precisar compilar o `main` no CI) e falha acima do limite. O `apps/web/e2e-base/` provisório do qa sai do repositório quando `apps/web/e2e/`
   cobrir o que ele cobre. _(tech-lead, vindo da HIS-001)_

## Fora do escopo

- Testes visuais por comparação de pixels.
- Testes no app de celular.

## Desenho técnico (proposta inicial)

- Dependências (versão exata): `eslint` 10, `eslint-config-next` 16.4.3, `@playwright/test` 1.64, `@axe-core/playwright` 4.14.
- Testes em `apps/web/e2e/` com `playwright.config.ts` (projetos `celular` 390×844 e `computador` 1280×900, `webServer` com `next start`).
- No CI: usar o navegador do `@playwright/test` (`playwright install --with-deps chromium` **só no runner do GitHub**;
  no ambiente de nuvem da equipe o Chromium já existe).
- Dados de tarifa vêm de `public/dados` (sem rede externa no teste).

### Notas do tech-lead vindas da HIS-001 (2026-10-29 — valem para o desenho técnico definitivo)

**Decisão: ESLint e `scripts/verificar-camadas.mjs` convivem, cada regra num lugar só.** O ESLint lê a árvore de
sintaxe (não regex), então fecha de graça a maior parte das lacunas da S1; mas ele olha um arquivo por vez e não sabe a
diretiva do arquivo **importado** nem a estrutura das pastas. Divisão:

| Fica no ESLint (regra do próprio arquivo) | Fica no script (outro arquivo ou estrutura) |
| --- | --- |
| Matriz de camadas do ADR-001 por pasta (`no-restricted-imports` com `files` por camada no `eslint.config.mjs`); proibir `../` em `apps/web/src` (decisão 8 da HIS-001: `./` só na mesma pasta, o resto com `@/`; hoje nenhum arquivo usa `../`) | "use client" não importa `.servidor` (precisa resolver o destino) |
| `zustand` só em `infraestrutura`; módulos do Node só em `infraestrutura/**/*.servidor.ts`; `server-only` só em `*.servidor.ts` | Todo `*.servidor.ts` com `import "server-only";` como primeiro import |
| `require(`, `import()` com argumento não literal, `process.getBuiltinModule` (`no-restricted-syntax` / `no-restricted-properties`) | Critério 8 (S2): arquivo sem diretiva só importa componentes de módulo `"use client"` (precisa ler a diretiva do destino) |
| Diretiva `"use server"` proibida até existir regra própria para Server Actions (cada uma é um endpoint POST público; entra no E4 com a seguranca) | Pastas antigas (`components/`, `lib/`), arquivo fora das camadas, 0 arquivos lidos, **link simbólico = erro** (não pular) |
| Domínio (`packages/core/src`) só com import relativo | Ler **toda** extensão de código nas duas pastas (`.js .jsx .cjs .mjs .ts .tsx .cts .mts`) |

Quando a matriz estiver no ESLint e passar nos mesmos casos negativos (critério 7), ela **sai** do script (sem regra
repetida em dois lugares). O script continua Node puro, sem dependência, dentro do `pnpm typecheck`.

**Lacunas da S1 (seguranca, HIS-001) e onde cada uma fecha:** (a) `from"x"` e `import"x"` sem espaço — ESLint (sintaxe)
e, no script, `\bfrom\s*["']` e `^\s*import\s*["']`; (b) `import /* c */ ("…")` — ESLint (sintaxe); (c) `.js/.jsx/.cjs/.cts`
em `apps/web/src` e `.tsx` em `packages/core/src` não lidos — script lê toda extensão, ESLint com `files` cobrindo todas;
(d) link simbólico pulado em silêncio — script: erro; (e) especificador absoluto (`/…`) ou com `?sufixo` — ESLint
(`no-restricted-imports` por padrão); (f) `process.getBuiltinModule("node:fs")` — ESLint; (g) `"use server"` — ESLint.
Nenhum desses casos existe hoje no código.

**Outras da revisão da HIS-001:** T1 — ligar `import/order` (do `eslint-plugin-import`, que o `eslint-config-next` traz — conferir ao instalar) com correção automática, num
commit só de formatação, separado dos outros; T3 — `rascunho.ts` → `novoId` entra no critério 8.

## Perguntas abertas

- [ ] `[para: tech-lead]` O e2e roda em todo push ou só em pull request e no `main`? (custo de tempo do CI)

## Conversa da equipe

### [scrum-master] 2026-10-29 — história refinada
- O que fiz: critérios de aceite e páginas cobertas.
- Para o próximo (qa + tech-lead): escolher a estrutura dos testes e responder a pergunta aberta. Depende da HIS-001 só nas regras de import.

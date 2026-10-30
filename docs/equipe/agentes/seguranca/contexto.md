# Contexto · Segurança

## O que eu cuido

- Regras de segurança do `CLAUDE.md`, análise de ameaças e revisão de toda história. Poder de veto.
- Privacidade e LGPD do produto.

## Estado atual (riscos conhecidos)

| Risco | Situação | História |
| --- | --- | --- |
| localStorage: JSON quebrado prende o site no carregamento (P1, provado); mesma versão não passa pelo `migrate` (P2, provado) | alta, aberto; desenho na história (storage próprio + `merge`, descarte por item, retorno com contagem) | HIS-003 |
| JSON de `/dados` lido sem validação (`navegador.ts`, `arquivos.servidor.ts` com `as`); `uf` do localStorage monta o caminho do `fetch` | médio/baixo, aberto | HIS-003 |
| Sem `app/error.tsx`: exceção de render vira tela branca | aberto | HIS-003 |
| Sem cabeçalhos de segurança (CSP, HSTS, etc.) em `next.config.ts` | aberto; valores exatos na HIS-003 | HIS-003 |
| Sem `pnpm audit` nem Dependabot no CI; `atualizar-dados.yml` com token de escrita durante o `pnpm install` e actions por etiqueta | médio, aberto; dois jobs + SHA | HIS-003 |
| Links externos sem `rel="noopener noreferrer"` (`funcionalidades/inicio/PaginaInicial.tsx` l. 275, `app/sobre/page.tsx` l. 44–56); sem `target="_blank"`, então baixo | aberto (baixo) | HIS-003 |
| Refatoração em camadas: perda da casa salva, código de servidor no cliente, script de camadas com falso negativo | etapa 6 **aprovada com ressalvas (baixo)** em `182f355`: R1–R15 ok | HIS-001 |
| `verificar-camadas.mjs` com lacunas que pedem escrita deliberada (S1: `from"x"` sem espaço, `.js/.jsx` não lidos, link simbólico pulado em silêncio, caminho absoluto/`?sufixo`, `getBuiltinModule`, `"use server"` livre) | etapa 3 aprovada: os 21 casos estão escritos na HIS-002b (20 ESLint, 1 script, medidos contra o D4) | HIS-002b |
| Constante (`VOLTAR`) importada de módulo `"use client"` por componente de servidor (`app/sobre/page.tsx`) — armadilha A7, funciona hoje (S2) | aberto (baixo, pré-existente); correção no D7 | HIS-002b |
| Comentário `eslint-disable`/`/* eslint … off */` derruba matriz, `innerHTML` e `"use server"` (medido) | médio; mitigação C10 no script, só a forma HIS-109 | HIS-002b (Ab3) |
| `globalIgnores` com `**/build/**`, `**/out/**`, `**/test-results/**` tira pastas do site do lint (medido) | médio; ignores ancorados + controle de contagem | HIS-002b (Ab4) |
| HTML a partir de texto fora da lista (`setHTMLUnsafe`, `createContextualFragment`, `srcdoc`/`srcDoc`) | baixo; 3 seletores propostos | HIS-002b (Ab6) |
| CI: `ci.yml` sem `permissions`, actions por etiqueta, `persist-credentials` padrão; artefato público 14 dias | médio; mitigação no D11 + Aa6/Aa9/Aa10 | HIS-002a / HIS-003 |
| Site chamando terceiro sem a pessoa saber: sem barreira automática | médio; fixture "nada sai do aparelho" (Aa11, A1) | HIS-002a |
| Server Actions (`"use server"`): cada uma vira endpoint POST público; nenhuma existe | regra a definir antes do E4 | E4 |
| SQL injection | não se aplica ainda (sem banco); regra já vale para o E4 | E4 |
| XSS | React escapa texto; não há `dangerouslySetInnerHTML`, `innerHTML`, `eval` nem `new Function` | — |
| Dados pessoais | nenhum coletado; tudo no aparelho | — |
| Espaços para parceiros | desligados; ligar exige revisão de rastreamento e consentimento | E11 |

## Linha de base do build (main `57700ab`, conferida em 2026-10-29)

- Chave `eficiencia-energetica:casa` em 1 arquivo de `apps/web/.next/static`.
- Nenhum `readFile`, `process.cwd` ou `node:fs` em `.next/static`.
- Endereços nos scripts do cliente: só textos de bibliotecas (w3.org, nextjs.org, react.dev, github.com).
- `packages/core/src` só com imports relativos.
- zustand 5 `persist` só grava ao hidratar quando a versão muda (`middleware.mjs` l. 397–428): abrir o site com a
  mesma versão não reescreve a casa.

## Decisões em vigor

- Nenhum dado sai do aparelho sem consentimento. `service_role` nunca no navegador. RLS testada em toda tabela.
- Formato salvo da casa (chave, `version`, `partialize`, `migrate`) só muda com `version` nova + `migrate` + teste com
  dado da versão anterior.
- Código só de servidor em `*.servidor.ts`; recomendado `import "server-only"` neles (Next 16 trata sem pacote).
- Scripts que rodam no CI só leem arquivos: sem `child_process`, `eval`, rede ou escrita; falham (código 1) se não
  leram nada.
- Todo `*.servidor.ts` começa com `import "server-only";` (provado em 2026-10-29: import indireto a partir de `"use
  client"` derruba o `next build`). O `verificar-camadas.mjs` cobre só o import direto.
- `/casa/aparelhos` é estática: responde 200 com `NEXT_REDIRECT` no conteúdo (não 307).
- CI: `permissions: contents: read` no topo, nada de `pull_request_target`/`workflow_run`, nada de `${{ github.event.* }}`
  em `run:`, `persist-credentials: false`; artefato só com dado inventado e só das pastas do relatório.
- e2e: nenhum pedido fora de `127.0.0.1` (fixture automática); limites de peso no spec, nunca no JSON; axe sem
  `disableRules`/`withTags`/`exclude()`, exceção por nó (1 só) com história.
- CSP sem nonce enquanto não houver Auth nem script de terceiro: `script-src`/`style-src 'self' 'unsafe-inline'`, sem
  `unsafe-eval`, tudo `'self'`, `connect-src 'self'`. Nonce em `proxy.ts` volta à mesa no E4/E11 (doc do Next 16: nonce
  = tudo dinâmico; hash não cobre o `__next_f` inline).
- Validação de dado de fora: só o rígido do domínio descarta; nunca corrigir número (exceto os 2 consertos do
  domínio na HIS-003); retorno do validador só com contagens/`boolean`, em memória.
- Leitores escritos à mão no `@ee/core`, sem zod (ADR-004, P-tl-1 de 2026-10-30). Condições: todo leitor cobre todos
  os campos do tipo, com checagem no `typecheck` e a fixture `casa-completa`; nada de `trim` nem conserto no valor
  devolvido; o leitor nunca lança (um `merge` que lança traz o P1 de volta); só propriedade própria; data conferida por
  UTC; data no futuro não é descartada.
- Lint: o único `eslint-disable` aceito no site e no domínio é o da HIS-109; ignores do ESLint só com caminho ancorado;
  arquivos lidos pelo ESLint = `git ls-files`.

## Estrutura do site depois da HIS-001 (para as próximas revisões)

- Store único: `apps/web/src/infraestrutura/armazenamento/casa.ts`; `aplicacao/casa.ts` só reexporta + `useEdicaoDeAparelho`.
- Leitura de disco: só `infraestrutura/dados-publicos/arquivos.servidor.ts`; `/` revalida em `app/page.tsx`.
- Testes negativos do script: roteiro do frontend `…/scratchpad/his001/teste-camadas/testar.mjs` (36 casos) e o meu
  `…/scratchpad/his001/seg-camadas/testar-seg.mjs` (21 casos; os 10 "BRECHA" são o S1). Scratchpad é da sessão: se
  sumir, o S1 na história tem a lista de casos.

## Pendências

- **HIS-002a (etapa 6):** Ra1–Ra13 da história; pedir o artefato do commit descartável do A6 (Ra9); saber se a Aa9
  (actions por SHA) entrou no A6 ou foi para a HIS-003 "antes do E4".
- **HIS-002b (etapa 6):** Rb1–Rb9; rodar de novo os 21 + 9 casos numa cópia própria (roteiros em
  `scratchpad/seg-his002/casos-eslint.mjs` e `propostas.mjs`; se sumirem, as tabelas estão na história) esperando 0
  diferente; conferir C10 (Ab3) e ignores ancorados (Ab4).
- **HIS-003a (etapa 6):** R1–R13 + R4b, R4c, R4d da história; rodar `scratchpad/seg-his003/prova-hidratacao.mjs`
  contra o storage novo (se sumir: P1/P2 na história explicam o caso). Conferir que o ADR-004 passou para aceito.
  A HIS-003 foi dividida: T5/T6 e `campos.spec.ts` estão na `HIS-003b-campos-com-limite.md` (revisar lá também).
- **E4:** regra para Server Actions (`"use server"`): validação de entrada, limite, auth e revisão obrigatória.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

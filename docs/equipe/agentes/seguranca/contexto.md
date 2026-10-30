# Contexto · Segurança

## O que eu cuido

- Regras de segurança do `CLAUDE.md`, análise de ameaças e revisão de toda história. Poder de veto.
- Privacidade e LGPD do produto.

## Estado atual (riscos conhecidos)

| Risco | Situação | História |
| --- | --- | --- |
| localStorage lido sem validação (`lib/store.ts`, `migrate` com `as`) — dado corrompido pode quebrar a tela | aberto | HIS-003 |
| JSON de `/dados` lido sem validação (`lib/dados.ts`; `app/page.tsx` com `as`) | aberto | HIS-003 |
| Sem `app/error.tsx`: exceção de render vira tela branca | aberto | HIS-003 |
| Sem cabeçalhos de segurança (CSP, HSTS, etc.) em `next.config.ts` | aberto | HIS-003 |
| Sem `pnpm audit` nem Dependabot no CI | aberto | HIS-003 |
| Links externos sem `rel="noopener noreferrer"` (`funcionalidades/inicio/PaginaInicial.tsx` l. 275, `app/sobre/page.tsx` l. 44–56); sem `target="_blank"`, então baixo | aberto (baixo) | HIS-003 |
| Refatoração em camadas: perda da casa salva, código de servidor no cliente, script de camadas com falso negativo | etapa 6 **aprovada com ressalvas (baixo)** em `182f355`: R1–R15 ok | HIS-001 |
| `verificar-camadas.mjs` com lacunas que pedem escrita deliberada (S1: `from"x"` sem espaço, `.js/.jsx` não lidos, link simbólico pulado em silêncio, caminho absoluto/`?sufixo`, `getBuiltinModule`, `"use server"` livre) | aberto (baixo) | HIS-002 |
| Constante (`VOLTAR`) importada de módulo `"use client"` por componente de servidor (`app/sobre/page.tsx`) — armadilha A7, funciona hoje (S2) | aberto (baixo, pré-existente) | HIS-002 |
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

## Estrutura do site depois da HIS-001 (para as próximas revisões)

- Store único: `apps/web/src/infraestrutura/armazenamento/casa.ts`; `aplicacao/casa.ts` só reexporta + `useEdicaoDeAparelho`.
- Leitura de disco: só `infraestrutura/dados-publicos/arquivos.servidor.ts`; `/` revalida em `app/page.tsx`.
- Testes negativos do script: roteiro do frontend `…/scratchpad/his001/teste-camadas/testar.mjs` (36 casos) e o meu
  `…/scratchpad/his001/seg-camadas/testar-seg.mjs` (21 casos; os 10 "BRECHA" são o S1). Scratchpad é da sessão: se
  sumir, o S1 na história tem a lista de casos.

## Pendências

- **HIS-002:** conferir que S1 e S2 (seção "Revisão de código (etapa 6)" da HIS-001) entraram no ESLint ou no script;
  rodar de novo os 21 casos de `testar-seg.mjs` esperando 0 "BRECHA".
- **HIS-003:** completar a tabela de ameaças.
- **E4:** regra para Server Actions (`"use server"`): validação de entrada, limite, auth e revisão obrigatória.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

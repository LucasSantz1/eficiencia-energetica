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
| Links externos sem `rel="noopener noreferrer"` (`app/page.tsx` l. 292, `app/sobre/page.tsx` l. 44–56); sem `target="_blank"`, então baixo | aberto (baixo) | HIS-003 |
| Refatoração em camadas: perda da casa salva, código de servidor no cliente, script de camadas com falso negativo | análise feita (etapa 3), aguarda revisão (etapa 6) | HIS-001 |
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

## Pendências

- **HIS-001:** resposta do tech-lead à pergunta sobre os ajustes do `verificar-camadas.mjs` e o `server-only`;
  depois, revisão da etapa 6 com os pontos R1–R15 da seção "Ameaças" (inclui testes negativos do script numa cópia no
  scratchpad).
- **HIS-003:** completar a tabela de ameaças.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

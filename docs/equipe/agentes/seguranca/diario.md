# Diário · Segurança

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-30 · HIS-002a · etapa 6: aprovado com ressalvas (baixo), Ra9 fica com o dono do projeto
- O que fiz: Ra1–Ra13 sobre o `efab326` numa cópia própria (`scratchpad/seg-h2a/copia`, portas 3171–3173): typecheck,
  test, build e e2e verdes (107/6/0). Integridade dos 5 pacotes novos igual à do `npm view`. Ra10 plantada na `/sobre`
  → 3 vermelhos com a URL; desfeita → verdes. Ra9 com o equivalente local (traces e zips do relatório extraídos).
- Decisões e porquê: Ra9 vira ressalva baixa, não bloqueio: o job não tem segredo nem token no `env`, `persist-credentials`
  é `false` e o equivalente local está limpo; mas só quem vê o artefato real fecha a conferência. Roteiro para o dono na
  nota. Execução do `child_process` no `peso-js.spec.ts` aceita: comando fixo, só fora do CI.
- Arquivos: `docs/equipe/historias/HIS-002-qualidade-automatica.md` ("Resultado da etapa 6" e nota), `contexto.md`, `diario.md`.
- Próximos passos: etapa 6 da HIS-002b, HIS-003a e HIS-111.

## 2026-10-30 · HIS-111 · análise de ameaças: aprovado para o h0; ADR-005 pode virar aceito
- O que fiz: li o T1–T7 e o ADR-005; conferi o `diagnosticar-dados.yml` proposto (permissões, credencial, gatilho,
  SHA contra a HIS-002/003), o `.gitignore` (o `.cache` fica fora do "Nada mudou"), o `onlyBuiltDependencies` e os
  `console.log` do `atualizar.ts` (texto da ANEEL vai cru para o log). Escrevi R1–R9.
- Decisões e porquê: workflow aprovado; só os `paths` mudam (o `core` muda a montagem). R3 médio: nada impedia uma
  linha de sucessão de mover cidades de uma empresa vigente (CNPJ digitado errado passa nas V1–V7), por isso entram o
  V9 (antiga sem tarifa vigente) e o V10 (siglas batem com o CNPJ), sem `--forcar`. Antes da a3 não há V8 no navegador,
  por isso o core fica total (R5) e a regravação fica protegida contra laço (R6). R2: escape do log do runner. Depois do
  h8, `pull_request` no lugar do `push`, para mostrar o diff de toda sucessão nova.
- Arquivos: `docs/equipe/historias/HIS-111-tarifas-vencidas.md` ("Ameaças" e nota), `contexto.md`, `diario.md`.
- Próximos passos: etapa 6 da HIS-111; o tech-lead acrescenta o R3 ao ADR-005 e o passa para aceito.

## 2026-10-30 · HIS-003 · P-tl-1: leitores à mão aprovados com R4c/R4d
- O que fiz: li o D1–D9 e o ADR-004; conferi as medidas do tech-lead (`scratchpad/tl-his003/zod/`: 93 098 / 8 173 /
  1 284 B em gzip) e o `hydrate` do zustand 5.0.16 (o `merge` que lança cai no `catch` sem `hasHydrated`; versão
  diferente regrava sozinha). No protótipo `mao.ts` faltam o `contaReferencia` e o `kwhMesInformado`, e o texto sai com
  `trim`. O V8 aceita `2026-02-30` e o transforma em 2 de março. `pessoas` só aparece em `tipos.ts`.
- Decisões e porquê: (a)–(d) confirmadas. Criei o R4c (campos completos com checagem no `typecheck`, fixture
  `casa-completa`, sem `trim`), porque esquecer um campo apagaria dado de todas as famílias sem aviso. Criei o R4d
  (leitor total, `try/catch` no `merge` sem regravar, data por UTC). O "igual" do R4 ficou exato. Troquei A3, R11 e o
  parágrafo do zod.
- Arquivos: `docs/equipe/historias/HIS-003-base-de-seguranca.md`, `contexto.md`, `diario.md`.
- Próximos passos: etapa 6 da 003a; o tech-lead passa o ADR-004 para aceito.

## 2026-10-30 · HIS-003 · análise de ameaças: aprovado para implementar
- O que fiz: li o guia de CSP do Next 16, o HTML do build (`__next_f` inline em toda página, `style=` do React), o
  `persist` do zustand 5.0.16 e `infraestrutura/`. Provei P1 (JSON quebrado: `hasHydrated` nunca fica true, telas
  presas) e P2 (mesma versão: `migrate` não roda, potência -5 entra). Tabela A1–A16, CSP e cabeçalhos com valor exato,
  regras de validação (localStorage e `/dados`), CI/Dependabot/`atualizar-dados.yml`, R1–R13 + R4b. Pedido do ux
  atendido: retorno do validador com contagem por tipo, `residenciaDescartada` e `ilegivel`. `pnpm audit` limpo.
- Decisões e porquê: CSP sem nonce (nonce força tudo dinâmico; hash não cobre inline) com `'unsafe-inline'`, risco
  aceito baixo até o E4/E11; validação no `merge`/storage, não só no `migrate` (P2); só o rígido do domínio descarta,
  alerta não; aceitos os 2 consertos do domínio; `atualizar-dados.yml` em dois jobs para o token de escrita não ficar
  no `pnpm install`.
- Arquivos: `docs/equipe/historias/HIS-003-base-de-seguranca.md` ("Ameaças" e nota), `contexto.md`, `diario.md`.
  Roteiro: `scratchpad/seg-his003/prova-hidratacao.mjs`.
- Próximos passos: etapa 6 da HIS-003 (R1–R13, R4b); respostas do tech-lead sobre `zod/mini` e o critério da rotina.

## 2026-10-29 · HIS-002a/HIS-002b · análise de ameaças (etapa 3): as duas aprovadas para implementar
- O que fiz: HIS-002a — `npm view` dos 5 pacotes do navegador (sem script de instalação; Microsoft/Deque), fontes
  locais, `ci.yml` atual sem `permissions`; tabela Aa1–Aa18 e conferência Ra1–Ra13; resposta na P-qa-8. HIS-002b — rodei
  os 21 casos e 18 sondas contra o `eslint.config.mjs` do D4 na cópia do tech-lead (só leitura), o script atual nos
  casos de estrutura, `pnpm audit` (limpo, 400 pacotes), lockfile (0 origem fora do registro) e scripts de instalação
  (só `esbuild` e `unrs-resolver`); tabela Ab1–Ab14, os 21 casos escritos na história (20 ESLint, `seguranca-15` no
  script), `seguranca-14b`, 9 casos novos (`22`–`30`), Rb1–Rb9; pergunta aberta respondida.
- Decisões e porquê: nenhuma crítica/alta → aprovadas. Médias que entram na 002b: Ab3 (comentário `eslint-disable`
  derruba a barreira; C10 no script) e Ab4 (ignores `**/build/**` etc. tiram pastas do site do lint; ancorar + controle
  de contagem) — sem elas a barreira deixa de valer quando a matriz sai do script. Na 002a: fixture "nada sai do
  aparelho" obrigatória (Aa11), `persist-credentials: false`, limites de peso no spec + `git diff --exit-code`, axe sem
  atalhos; actions por SHA recomendadas no A6 (Aa9) ou HIS-003 antes do E4. `seguranca-01` deixa de ser controle.
- Arquivos: `docs/equipe/historias/HIS-002-qualidade-automatica.md` ("Ameaças", P-qa-8, nota),
  `docs/equipe/historias/HIS-002b-lint-e-camadas.md` ("Ameaças", 21 casos, pergunta, nota), `contexto.md`, `diario.md`.
  Roteiros: `scratchpad/seg-his002/` (`casos-eslint.mjs`, `msgs.mjs`, `ignorados.mjs`, `propostas.mjs`, saídas).
- Próximos passos: etapa 6 da 002a (Ra1–Ra13, artefato do A6) e da 002b (Rb1–Rb9, rodar de novo os 30 casos).

## 2026-10-29 · HIS-001 · revisão de código da etapa 6: aprovado com ressalvas (baixo)
- O que fiz: R1–R15 com evidência contra `182f355` (tabela na história); comparação das linhas não-import de cada
  arquivo movido/dividido com o `main` (sem diferença fora do previsto); build próprio + servidor na porta 3107;
  `pnpm audit` limpo; busca de segredos no `git log -p`; revisão do `linha-de-base.cjs`/fixtures do QA. Roteiro do
  frontend 36/36 ok; 21 casos meus (`seg-camadas/testar-seg.mjs`), 10 lacunas; prova em cópia de que o `server-only`
  derruba o build no import indireto.
- Decisões e porquê: aprovado com ressalvas — nenhum crítico/alto se materializou. A regex nova do `import(` está certa.
  S1 (lacunas do script, baixo: exigem escrita deliberada e o `server-only` cobre o caso grave) e S2 (`VOLTAR` de módulo
  `"use client"` na `/sobre`, pré-existente) vão para a HIS-002. Server Actions viram pendência do E4.
- Arquivos: `docs/equipe/historias/HIS-001-camadas.md` (subseção "Revisão de código (etapa 6)", R9 corrigido, nota),
  `contexto.md`, `diario.md`.
- Próximos passos: na HIS-002, rodar de novo `testar-seg.mjs` esperando 0 "BRECHA" e conferir S2.

## 2026-10-29 · HIS-001 · análise de ameaças da reorganização em camadas: aprovado para implementar
- O que fiz: li o desenho técnico e o código atual; tabela de ameaças A1–A17 e pontos de revisão R1–R15 na história;
  linha de base do build atual (chave da casa, `node:fs`, hosts) e do comportamento do `persist` do zustand.
- Decisões e porquê: aprovado — o desenho mitiga os riscos críticos/altos (store único, formato byte a byte, portão de
  hidratação, contrato do editor, apagar tudo, nada novo saindo). Ponto fraco: o `verificar-camadas.mjs` pode ter falso
  negativo (0 arquivos, `require`, builtins sem `node:`, `'use client'`); pergunta aberta ao tech-lead com os ajustes e
  o `import "server-only"`.
- Arquivos: `docs/equipe/historias/HIS-001-camadas.md` (Ameaças, Perguntas abertas, nota), `contexto.md`, `diario.md`.
- Próximos passos: aguardar resposta do tech-lead; etapa 6 com R1–R15 e testes negativos do script numa cópia no scratchpad.

## 2026-10-29 · criação da equipe
- O que fiz: Riscos conhecidos levantados no contexto; base de segurança vira a HIS-003.
- Próximos passos: ver "Pendências" em `contexto.md`.

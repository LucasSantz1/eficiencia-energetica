# HIS-117 · CSP sem `'unsafe-inline'` no script

| Campo | Valor |
| --- | --- |
| Épico | Segurança |
| Tamanho | P |
| Papéis principais | seguranca (análise), tech-lead (decisão), frontend (aplica o patch) |
| Status | **Bloqueada para decisão** do tech-lead/dono: o caminho pedido (hash + `experimental.sri`) quebra o site (provado) |
| Branch | `his-117-csp` (sai do `main` em `45e39fe`) |

## Problema

Desde a HIS-003a o `script-src` é `'self' 'unsafe-inline'`: se um dia entrar HTML de fora na página, o script injetado
roda. Pedido: tirar o `'unsafe-inline'` com hash (`experimental.sri` + o hash do script do `<head>` da HIS-102), sem
nonce, para as páginas continuarem estáticas (3G).

## Ameaças (curto)

| Ativo | Quem / como | Situação hoje |
| --- | --- | --- |
| Casa salva no aparelho (localStorage) e a confiança no site | XSS: HTML injetado roda script, lê/apaga a casa, manda para fora | Baixo: páginas estáticas, nada da pessoa volta do servidor, React escapa texto, lint proíbe `innerHTML`/`eval`; `connect-src 'self'` impede mandar para fora por `fetch` |
| Site funcionando (princípio "nunca tela sem resposta") | CSP errada bloqueia o script do próprio Next | **Risco desta história**: provado abaixo |

## O que foi provado (build de produção numa cópia, porta 3817, Chromium)

1. **`experimental.sri` + `script-src 'self'` quebra todas as páginas.** O SRI só põe `integrity` nos `<script src>`.
   O conteúdo da página vem em ~10 a 20 scripts inline por página (`self.__next_f.push(...)` e o `_R_` do Turbopack),
   diferentes em cada rota. Resultado: 33 violações em 3 páginas, `__next_f` não existe, a página não hidrata
   (botões e formulários mortos). A doc do Next 16 (`02-guides/content-security-policy.md`, "Limitations of SRI":
   "Cannot handle dynamically generated scripts") confirma.
2. **Hash por página não fecha:** a `/` revalida a cada 86 400 s (`app/page.tsx`); o HTML regenerado traz scripts
   inline novos, com hash que o cabeçalho do build não tem. A página inicial quebraria um dia depois do deploy.
3. **Armadilha:** pôr *qualquer* hash (ou nonce) no `script-src` junto com `'unsafe-inline'` faz o navegador ignorar o
   `'unsafe-inline'` (CSP nível 2). Teste: `/sobre` com um hash qualquer → 11 violações, não hidrata. **O hash do script
   da HIS-102 não pode entrar no cabeçalho**: o script inline dela já roda pelo `'unsafe-inline'`, sem hash.
4. **`script-src-attr 'none'` funciona sem quebrar nada:** 0 violações nas 8 rotas (com casa salva) em 390 e 1440 px,
   todas hidratam; `<img onerror>` injetado não executa. Nem o React nem o Next põem atributo de evento no HTML
   (conferido nos `.html` do build).

## Decisão (proposta da seguranca; o tech-lead confirma)

- **Agora:** manter `'unsafe-inline'` no `script-src` e acrescentar `script-src-attr 'none'`; nenhum hash no
  cabeçalho; não ligar `experimental.sri` (só protege arquivo de `'self'`, que já é nosso, e é experimental).
- **`style-src 'self' 'unsafe-inline'` fica:** o React escreve `style="..."` (49 atributos no build) e o
  `global-error` usa `<style>`. Injeção de CSS aqui não tem segredo para vazar e `connect-src`/`img-src` só `'self'`.
- **Tirar o `'unsafe-inline'` de verdade = nonce no `proxy.ts`**, que deixa as páginas dinâmicas. Volta à mesa no E4
  (login e sessão já obrigam página dinâmica) ou se entrar script de terceiro (E11). Até lá o risco é baixo (tabela).
- Sem ADR novo: confirma a decisão em vigor da HIS-003a ("CSP sem nonce enquanto não houver Auth nem script de
  terceiro") com a prova acima. Se o tech-lead escolher nonce agora, aí sim vira ADR (troca estático por dinâmico).

## Critérios de aceite (do patch proposto)

1. CSP com `script-src-attr 'none'`; o resto igual; `cabecalhos.spec.ts` com o valor exato novo.
2. `e2e/csp.spec.ts` reprova se: houver hash/nonce/`'strict-dynamic'` junto com `'unsafe-inline'` no `script-src`;
   sumir o `script-src-attr 'none'`; houver violação de CSP ou página sem hidratar nas 8 rotas, em 390 e 1440 px; um
   `onerror` injetado executar. Quando o nonce entrar, o teste 1 vira "script-src sem `'unsafe-inline'`".
3. Barreira completa (lint, typecheck, test, build, e2e) verde.

Patch pronto (não aplicado: a seguranca não edita código):
`/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/his117/his117-csp.patch`
(`git apply` na raiz da worktree).

## Perguntas abertas

- [para: tech-lead] Aceita a decisão acima (manter `'unsafe-inline'` + `script-src-attr 'none'`, nonce no E4)? Ou quer
  nonce já, com todas as páginas dinâmicas (ADR)?
- [para: frontend] HIS-102: o comentário do `layout.tsx` diz que a CSP permite script inline — certo; **não** pôr o hash
  do `SCRIPT_DA_PRIMEIRA_PINTURA` no cabeçalho (achado 3). O `csp.spec` reprova se alguém puser.

## Conversa da equipe

### [seguranca] 2026-11-17 — análise e prova; bloqueada para decisão
- **Alto (bloqueia o caminho pedido):** `experimental.sri` + hash sem `'unsafe-inline'` deixa o site sem hidratar
  (achados 1 e 2); hash junto com `'unsafe-inline'` também quebra (achado 3). Não aplicar.
- **Baixo (aceito até o E4):** `'unsafe-inline'` no `script-src`, com `script-src-attr 'none'` como reforço.
- Patch com `next.config.ts`, `cabecalhos.spec.ts`, `playwright.config.ts` e `e2e/csp.spec.ts` validado numa cópia
  (porta 3817): lint, typecheck, test, build e e2e verdes (270 passaram, 6 pulados de antes; `csp.spec` 4/4).
  Negativo provado: com hash ao lado do `'unsafe-inline'` e sem `script-src-attr`, o `csp.spec` reprova. Próximo: **tech-lead** decide; **frontend** aplica o patch.

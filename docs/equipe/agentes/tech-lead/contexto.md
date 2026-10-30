# Contexto · Tech Lead

## O que eu cuido

- Arquitetura e regras de camadas (ADR-001), `docs/arquitetura.md`, `docs/equipe/decisoes/`.
- Configuração: `package.json` da raiz, `pnpm-workspace.yaml`, `tsconfig*.json`, `apps/web/next.config.ts`.
- CI/CD: `.github/workflows/ci.yml` (typecheck, test, build) e `atualizar-dados.yml` (rotina diária).
- Code review final de toda história.

## Estado atual

- Monorepo pnpm 10: `apps/web` (Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Zustand 5.0.16),
  `packages/core` (domínio, 37 testes), `packages/dados` (rotina ANEEL, 11 testes).
- Código do site ainda em `components/` e `lib/` — a migração para camadas é a HIS-001. **Desenho técnico da HIS-001
  pronto (2026-10-29)**; próximo: `seguranca` (ameaças), depois `frontend` implementa em 8 passos e `qa` faz a linha
  de base antes.
- Sem ESLint ainda (entra na HIS-002). Até lá, as camadas são conferidas por `scripts/verificar-camadas.mjs`
  (a criar no passo 1 da HIS-001; entra no `pnpm typecheck` no passo 8). CI verde no `main`.
- Next 16: o build não mostra mais "First Load JS"; para comparar peso, usar `.next/prerender-manifest.json`
  (`htmlSize`, `initialRevalidateSeconds`) e os bytes de script. A `/` hoje: `htmlSize` ≈ 66 kB, revalidate 86400.
- HIS-001 implementada pelo frontend (`87bb6ba..182f355`); pergunta do peso respondida. Falta o meu code review (etapa 7).
  JS do HTML depois da HIS-001 (gzip, sem `noModule`): `/` 164 212, `/comecar` 172 561, `/casa` 175 053,
  `/casa/comodos` 172 950, `/casa/dicas` 166 026, `/casa/ajustes` 163 965, `/sobre` 139 573 B.
- `next.config.ts`: `transpilePackages: ["@ee/core"]`, `poweredByHeader: false`, cache dos `/dados`.
  Cabeçalhos de segurança entram na HIS-003.

## Decisões em vigor

- ADR-001 camadas; ADR-002 espaços reservados desligados.
- ADR-001 revisado (HIS-001): `ui/` pode chamar funções puras do `@ee/core`; componentes de domínio compartilhados em
  `ui/<assunto>/` (primeiro: `ui/aparelho/`), sem estado; `aplicacao/` é a única porta para `infraestrutura/`;
  código só de servidor em `*.servidor.ts`; sem barris `index.ts`; imports entre pastas com `@/`.
- `Casca` é a funcionalidade `funcionalidades/casca/` (lê a casa), não `ui/`.
- Versões exatas nas dependências. Formato salvo no navegador com `version` + `migrate`.
- Deploy na Vercel com Root Directory `apps/web`.
- **Critério de peso de JS (HIS-001, vale para as próximas):** principal = JS que o HTML da rota referencia
  (`<script src>` sem `noModule` + `<link rel="preload" as="script">`, comprimido), no máximo +1 024 B por rota;
  secundário = total baixado com prefetch dos `<Link>` (`networkidle` + 1 s), no máximo +2 048 B. Motivo: o prefetch
  roda depois que a página abriu, e dividir módulos por arquivo repete um pouco de código entre chunks sem atrasar a abertura.
  Medida: `scratchpad/tl-scripts/js-do-html.mjs`; levar para o e2e da HIS-002.

## Pendências

- ~~Responder: componentes de aparelho compartilhados vão para `ui/aparelho/`? (HIS-001)~~ respondido em 2026-10-29: sim.
- ~~Responder: peso do JS da `/casa` sem casa (+1 449 B) (HIS-001)~~ respondido em 2026-10-29: aceito; item 11 em 11a/11b.
- Responder: e2e em todo push ou só em PR e `main`? (HIS-002) — incluir nele a medida 11a/11b de peso.
- HIS-002: decidir se o ESLint `no-restricted-imports` substitui `scripts/verificar-camadas.mjs` ou convive com ele.
- Code review da HIS-001 (etapa 7): conferir `"use client"` arquivo a arquivo pela tabela do desenho, `PaginaInicial`
  sem diretiva, `revalidate` na rota, um só `create` do store.
- Dívida técnica registrada na HIS-001 (história futura, com `dominio-energia` quando houver número):
  - levar para `@ee/core` com teste: `faixaDoPeso` (`ui/Etiqueta`) e a escala repetida em `CasaIlustrada`; regras do
    rascunho do cadastro (banhos por pessoa, 8 min); `tarifaMedia`; `descreverUso`/`horasPorDiaTexto`;
  - juntar o `semAcento` repetido (`SeletorCatalogo`, `BuscaCidade`);
  - dividir `Cadastro.tsx` (554 linhas) e `TelaComodos.tsx` (415).

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

# Contexto · Tech Lead

## O que eu cuido

- Arquitetura e regras de camadas (ADR-001), `docs/arquitetura.md`, `docs/equipe/decisoes/`.
- Configuração: `package.json` da raiz, `pnpm-workspace.yaml`, `tsconfig*.json`, `apps/web/next.config.ts`.
- CI/CD: `.github/workflows/ci.yml` (typecheck, test, build) e `atualizar-dados.yml` (rotina diária).
- Code review final de toda história.

## Estado atual

- Monorepo pnpm 10: `apps/web` (Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Zustand 5.0.16),
  `packages/core` (domínio, 37 testes), `packages/dados` (rotina ANEEL, 11 testes).
- Código do site ainda em `components/` e `lib/` — a migração para camadas é a HIS-001.
- Sem ESLint ainda (entra na HIS-002). CI verde no `main`.
- `next.config.ts`: `transpilePackages: ["@ee/core"]`, `poweredByHeader: false`, cache dos `/dados`.
  Cabeçalhos de segurança entram na HIS-003.

## Decisões em vigor

- ADR-001 camadas; ADR-002 espaços reservados desligados.
- Versões exatas nas dependências. Formato salvo no navegador com `version` + `migrate`.
- Deploy na Vercel com Root Directory `apps/web`.

## Pendências

- Responder: componentes de aparelho compartilhados vão para `ui/aparelho/`? (HIS-001)
- Responder: e2e em todo push ou só em PR e `main`? (HIS-002)

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

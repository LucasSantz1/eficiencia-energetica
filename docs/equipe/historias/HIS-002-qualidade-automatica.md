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

## Fora do escopo

- Testes visuais por comparação de pixels.
- Testes no app de celular.

## Desenho técnico (proposta inicial)

- Dependências (versão exata): `eslint` 10, `eslint-config-next` 16.4.3, `@playwright/test` 1.64, `@axe-core/playwright` 4.14.
- Testes em `apps/web/e2e/` com `playwright.config.ts` (projetos `celular` 390×844 e `computador` 1280×900, `webServer` com `next start`).
- No CI: usar o navegador do `@playwright/test` (`playwright install --with-deps chromium` **só no runner do GitHub**;
  no ambiente de nuvem da equipe o Chromium já existe).
- Dados de tarifa vêm de `public/dados` (sem rede externa no teste).

## Perguntas abertas

- [ ] `[para: tech-lead]` O e2e roda em todo push ou só em pull request e no `main`? (custo de tempo do CI)

## Conversa da equipe

### [scrum-master] 2026-10-29 — história refinada
- O que fiz: critérios de aceite e páginas cobertas.
- Para o próximo (qa + tech-lead): escolher a estrutura dos testes e responder a pergunta aberta. Depende da HIS-001 só nas regras de import.

# Desenvolvimento, testes e publicação

## Preparar o ambiente

Requer **Node 22** e **pnpm 10** (o `packageManager` da raiz fixa a versão 10.28.0).

```bash
git clone https://github.com/LucasSantz1/eficiencia-energetica.git
cd eficiencia-energetica
pnpm install
```

## Comandos

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | site em modo desenvolvimento em http://localhost:3000 |
| `pnpm build` | build de produção do site |
| `pnpm start` | sobe o build de produção |
| `pnpm camadas` | confere se cada arquivo do site só usa as camadas permitidas (ADR-001); ver abaixo |
| `pnpm typecheck` | roda `pnpm camadas` e depois a verificação de tipos em todos os pacotes |
| `pnpm test` | testes de unidade (`@ee/core` e `@ee/dados`) |
| `pnpm dados:atualizar` | baixa os dados da ANEEL e grava em `apps/web/public/dados` |
| `pnpm dados:exemplo` | gera dados fictícios para trabalhar sem internet |

## Estrutura do repositório

```
apps/web/                 site (Next.js); o código fica em apps/web/src/, organizado em camadas
apps/web/e2e-base/        comparação de tela "antes × depois" do qa (provisória; vira apps/web/e2e/ na HIS-002)
packages/core/            regras de negócio (domínio) e testes
packages/dados/           rotina de dados da ANEEL/IBGE, fixtures e testes
scripts/                  verificar-camadas.mjs (barreira de camadas)
docs/                     documentação (índice em docs/README.md)
.claude/agents/           definições dos agentes da equipe
.github/workflows/        CI (ci.yml) e rotina diária (atualizar-dados.yml)
CLAUDE.md                 guia do projeto para a equipe
```

As pastas de `apps/web/src/` (`app/`, `funcionalidades/`, `ui/`, `aplicacao/`, `infraestrutura/`, `config/`) e o que
cada uma pode importar estão em [../arquitetura.md](../arquitetura.md#camadas-do-site). Onde colocar um arquivo novo:

| O arquivo novo é... | Vai para |
| --- | --- |
| uma rota (endereço do site) | `app/`, só montando a tela, sem `"use client"` |
| uma tela ou parte de uma só funcionalidade | `funcionalidades/<nome>/` |
| um componente usado por mais de uma funcionalidade, sem estado | `ui/` (de aparelho: `ui/aparelho/`) |
| um hook que junta a casa ou os dados públicos com o domínio | `aplicacao/` |
| leitura ou gravação de dados (armazenamento, `/dados`, futuramente Supabase) | `infraestrutura/` |
| código que só roda no servidor (lê o disco) | um arquivo `*.servidor.ts` que começa com `import "server-only";` |
| um cálculo ou regra de negócio | `packages/core`, com teste |

## Barreira de qualidade

Antes de dizer que terminou:

```bash
pnpm typecheck && pnpm test && pnpm build
```

O `pnpm typecheck` começa pelo verificador de camadas. Se ele achar um import proibido, para ali e mostra uma linha por
problema, com o arquivo, o import e a regra do ADR-001:

```
apps/web/src/ui/Botao.tsx → @/aplicacao/casa: ui não pode importar aplicacao (ADR-001, regra 4)
1 problema(s)
```

Sem problemas, mostra `Camadas: tudo certo (64 arquivos)` (o número cresce com o código). O script funciona de qualquer
pasta (`node scripts/verificar-camadas.mjs`), só lê arquivos e não precisa de dependência.

Para mudanças de interface, suba o build (`pnpm build && pnpm start`) e teste o fluxo completo em 390 px e 1280 px, sem
erro no console. A partir da HIS-002, isso vira teste automático (`pnpm test:e2e`).

## Integração contínua

| Workflow | Quando roda | O que faz |
| --- | --- | --- |
| `ci.yml` (Verificação) | todo push e pull request | instala, `typecheck` (com o verificador de camadas), `test`, `build` |
| `atualizar-dados.yml` | todo dia às 06:17 (Brasília) e à mão | atualiza os dados e faz commit só se algo mudou |

## Publicar na Vercel

1. Em vercel.com, **Add New → Project** e escolha o repositório `LucasSantz1/eficiencia-energetica`.
2. **Root Directory:** `apps/web`. O framework (Next.js) é detectado sozinho e o pnpm também.
3. **Deploy.** Cada push no `main`, inclusive os commits da rotina de dados, gera um novo deploy.
4. Opcional: em **Settings → Domains**, adicione um domínio próprio.

O plano gratuito (Hobby) é só para uso não comercial.

## Fluxo de trabalho com git

- Uma branch por história (`his-001-camadas`), commits em português no imperativo explicando o porquê.
- Pull request para o `main` com o CI verde. Não reescrever o histórico do `main`.
- Não editar `apps/web/public/dados/` à mão: é a rotina que grava.

## Trabalhar com a equipe de agentes

- Definições em `.claude/agents/`; contexto e diário de cada papel em `docs/equipe/agentes/<papel>/`.
- O processo está em `docs/equipe/processo.md`; cada história tem um arquivo em `docs/equipe/historias/`.
- No Claude Code (terminal ou VS Code), peça pelo papel: "use o agente `qa` para testar a HIS-001".

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
| `pnpm test:e2e` | testes no navegador (fluxo, acessibilidade com axe e peso de JS); precisa de `pnpm build` antes; ver abaixo |
| `pnpm dados:atualizar` | baixa os dados da ANEEL e grava em `apps/web/public/dados` |
| `pnpm dados:exemplo` | gera dados fictícios para trabalhar sem internet |

## Estrutura do repositório

```
apps/web/                 site (Next.js); o código fica em apps/web/src/, organizado em camadas
apps/web/e2e/             testes no navegador (Playwright), exceções do axe e referência de peso de JS
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

Para mudanças de interface, rode também os testes no navegador (abaixo) e olhe as capturas de tela.

## Testes no navegador

Os testes ficam em `apps/web/e2e/` e usam o Playwright com o Chromium. Eles sobem o build de produção sozinhos
(`next start` em `127.0.0.1`), por isso o build vem antes:

```bash
pnpm build
PORTA_E2E=3105 pnpm --filter @ee/web test:e2e                # tudo (113 testes)
PORTA_E2E=3105 pnpm --filter @ee/web test:e2e rotas.spec.ts  # só um arquivo
```

- **`PORTA_E2E`** escolhe a porta do servidor de teste (padrão 3100). Use uma porta sua quando outra pessoa ou outro
  agente estiver testando na mesma máquina: o teste nunca reaproveita um servidor que já está na porta.
- `pnpm test:e2e`, na raiz, faz o mesmo que `pnpm --filter @ee/web test:e2e`.
- Cada teste roda em duas larguras: `celular` (390 px) e `computador` (1280 px). Os que não dependem da largura rodam só
  no celular.
- O relatório fica em `apps/web/playwright-report/` (abra com `pnpm --filter @ee/web exec playwright show-report`); as
  capturas e os traces de quem falhou ficam em `apps/web/test-results/`. As duas pastas não vão para o git.
- O resultado é o mesmo no computador e no CI: sem nova tentativa automática. Teste instável se corrige, não se repete.

O que fica em `apps/web/e2e/`:

| Arquivo | O que confere |
| --- | --- |
| `fluxo-principal.spec.ts` | cadastro → acompanhamento → cômodos → dicas → minha casa |
| `aparelhos.spec.ts`, `comodos.spec.ts`, `ajustes.spec.ts`, `rotas.spec.ts` | editar e remover aparelho, abrir o cômodo certo, "Apagar todos os meus dados", as 8 rotas e o `/casa/aparelhos` que leva a `/casa/comodos` |
| `migracao.spec.ts` | a casa salva no formato antigo (v1) abre igual à do formato atual (v2) |
| `teclado.spec.ts`, `transicoes.spec.ts` | uso só com teclado; transições ao trocar de aba, também com movimento reduzido |
| `acessibilidade.spec.ts` + `excecoes-axe.ts` | o axe nas 7 páginas, sem e com casa salva, sem violação séria ou crítica fora da lista de exceções |
| `peso-js.spec.ts` + `peso-js.json` | o JavaScript de cada página contra a referência guardada |
| `sanidade.spec.ts` | prova que cada barreira acima reprova quando deveria (testes negativos) |
| `apoio/`, `fixtures/` | funções compartilhadas e as casas de exemplo (v1 e v2) |

Três regras valem para **todos** os testes, sem precisar escrever nada (`apoio/teste.ts`): o teste reprova se houver
erro de página, `console.error` ou **qualquer pedido para fora do site**.

**Exceções do axe.** Uma violação que só se corrige mudando o que a pessoa vê (cor, tamanho, layout) entra em
`excecoes-axe.ts`: uma entrada por elemento, com a regra, a página e a história que vai corrigir. Nunca se desliga
a regra inteira. Hoje são 8 entradas de `color-contrast` na página inicial, todas da HIS-110. A lista é revisada pela
`ux-acessibilidade`.

**Peso de JS.** O teste mede, com gzip, o JavaScript que o HTML de cada página pede (até +1 024 B acima da referência)
e o total depois do prefetch dos links (até +2 048 B). Os limites ficam no código (`apoio/peso.ts`). Quando uma mudança
aumenta o peso de propósito, atualize `peso-js.json` no mesmo PR, à vista de quem revisa.

## Integração contínua

O `ci.yml` (Verificação) roda em todo pull request, em todo push no `main` e à mão. Tem dois checks, que são os
obrigatórios para entrar no `main`:

| Check | O que faz |
| --- | --- |
| **Lint, tipos e testes** | instala, `typecheck` (com o verificador de camadas e os tipos de `e2e/`) e `test` |
| **Navegador (e2e, axe e peso)** | instala o Chromium, `build`, `test:e2e`; guarda o relatório; confere que nada mudou no repositório |

- O resumo de cada execução mostra a tabela do peso de JS e as exceções do axe.
- O artefato `relatorio-e2e` (relatório, capturas e traces) fica 14 dias, também quando os testes passam.
- O CI só lê o repositório: `permissions: contents: read`, nenhum segredo, e o token não fica salvo depois do checkout.
- As actions são fixadas pelo SHA do commit, com a versão num comentário, porque uma etiqueta como `v7` pode ser
  movida. Para subir uma versão: `git ls-remote --tags https://github.com/<action>` (use a linha `^{}` quando houver).
- Os nomes dos dois checks estão na proteção do `main`: mudar o nome no `ci.yml` exige mudar lá também.

| Outro workflow | Quando roda | O que faz |
| --- | --- | --- |
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

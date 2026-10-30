# Eficiência Energética — guia do projeto para a equipe

Este arquivo vale para **todos** os agentes da equipe (`.claude/agents/`) e para quem orquestra o trabalho.
Leia inteiro antes de qualquer tarefa. Em caso de conflito, a ordem de prioridade é:
segurança das pessoas e dos dados → princípios do produto → este guia → a história em andamento.

## O produto

Um site (e, no futuro, um app) **gratuito** que mostra quanto cada aparelho custa na conta de luz, com a tarifa
real da distribuidora e a bandeira do mês, e ajuda a família a pagar menos.

**Público principal: famílias de baixa renda.** Isso define tudo:

1. **Gratuito para sempre** para quem usa. Nenhuma função essencial pode ficar atrás de pagamento ou cadastro.
2. **Linguagem simples.** Frases curtas, palavras do dia a dia, sem sigla sem explicação. Dinheiro em R$ primeiro, kWh depois.
3. **Celular simples e internet fraca.** Páginas leves, sem bibliotecas pesadas sem necessidade, funciona com 3G e tela de 360 px.
4. **Acessível.** Letra grande, alto contraste, toque mínimo de 44 px, leitor de tela, teclado, movimento reduzido respeitado.
5. **Privacidade.** Coletamos o mínimo. Sem nome, CPF ou endereço. Nada sai do aparelho sem a pessoa saber e concordar (LGPD).
6. **Honestidade.** Estimativa é chamada de estimativa. Todo número tem fonte (ANEEL, INMETRO, PROCEL, lei) citada no código.

O site **não** menciona instituição de ensino: é um projeto independente.

## Tecnologias (versões em uso)

| Camada | Tecnologia |
| --- | --- |
| Monorepo | pnpm 10 (workspaces), Node 22, TypeScript 5.9 em modo estrito (`noUncheckedIndexedAccess`) |
| Site | Next.js 16.4 (App Router, Turbopack, `transitionTypes`), React 19.3 (`<ViewTransition>`), Tailwind CSS 4.3 (`@theme`, `@utility`) |
| Estado local | Zustand 5 com `persist` (localStorage, versão + `migrate`) |
| Domínio | `packages/core`: TypeScript puro, sem React e sem acesso a rede/armazenamento |
| Dados | `packages/dados`: rotina diária (GitHub Actions) que lê os dados abertos da ANEEL e gera `apps/web/public/dados/*.json` |
| Testes | Vitest 5 (unidade), Playwright (ponta a ponta; o navegador já vem instalado no ambiente de nuvem) |
| Ícones / fontes | lucide-react; Atkinson Hyperlegible Next (texto) e Archivo (títulos da página inicial) |
| Planejado | Supabase (Postgres + Auth + RLS), Serwist (PWA offline), Web Push, tesseract.js (OCR no aparelho), Expo (app) |

A documentação do Next.js 16 está dentro do pacote: `apps/web/node_modules/next/dist/docs/`. Consulte antes de usar
qualquer API do Next (ela mudou muito entre versões — ex.: APIs de request assíncronas, `middleware` virou `proxy`).

## Arquitetura em camadas

Regra de dependência: **cada camada só conhece as de baixo**. Nunca o contrário.

```
apps/web/src/app/               Rotas (páginas finas: montam a tela, não têm regra de negócio)
apps/web/src/funcionalidades/   Uma pasta por funcionalidade (cadastro, comodos, acompanhamento, dicas, inicio...)
                                com seus componentes e hooks. Uma funcionalidade não importa outra.
apps/web/src/ui/                Componentes de interface genéricos (Botao, Folha, Pilulas...) — sem regra de negócio
apps/web/src/aplicacao/         Casos de uso / hooks que juntam domínio + infraestrutura (ex.: useResumo)
apps/web/src/infraestrutura/    Acesso a dados: arquivos /dados, armazenamento local, futuramente Supabase
apps/web/src/config/            Chaves de recursos e constantes de configuração
packages/core/                  DOMÍNIO: cálculos, catálogo, dicas, regras (Tarifa Social, consumo mínimo)
packages/dados/                 Rotina de dados (ETL) da ANEEL/IBGE
```

> Estado atual: a reorganização em camadas terminou na HIS-001 (Sprint 0); `components/` e `lib/` não existem mais.
> O script `scripts/verificar-camadas.mjs` confere as regras (`pnpm camadas`) e roda dentro do `pnpm typecheck` e do CI.
> Componentes de aparelho usados por mais de uma tela ficam em `ui/aparelho/`; `aplicacao/` é a única porta para
> `infraestrutura/`; código só de servidor fica em `*.servidor.ts`, com `import "server-only";` como primeiro import.
> Detalhes em `docs/arquitetura.md` e no ADR-001.

## Padrões de código

- **Coesão alta:** cada arquivo tem uma responsabilidade. Funções pequenas, com nome que diz o que fazem.
- **Nomes em português**, sem abreviações obscuras (`consumoMensalKwh`, não `cmk`). Comentários explicam o *porquê*.
- **Sem `any`**, sem `as` para esconder erro de tipo, sem `// @ts-ignore`. Dados de fora (JSON, localStorage, API, formulário)
  são validados na fronteira (infraestrutura) antes de chegar ao domínio.
- **Números com fonte:** toda constante de energia/dinheiro tem comentário com a origem (ex.: "REN ANEEL 1.000/2021").
- **Dinheiro e energia** sempre formatados por `formatarReais` / `formatarKwh` do `@ee/core`.
- **Sem duplicar regra de negócio** na interface: se é cálculo, mora em `packages/core` e tem teste.
- **Interface:** usar os tokens de cor/raio do `globals.css` e os componentes de `ui/`. Animações com as utilidades
  existentes (`surgir`, `cresce-x`, `pulo`, `revelar`, `TransicaoTela`) e sempre respeitando `prefers-reduced-motion`.
- **Textos de interface:** voz ativa, sentença normal (sem CAIXA ALTA), botão diz o que acontece ("Salvar conta").

## Segurança (obrigatório)

- **SQL:** só consultas parametrizadas / query builder do Supabase. **Proibido** montar SQL com concatenação ou template string.
  Toda tabela com dado de pessoa tem **Row Level Security** ligada e testada. A chave `service_role` nunca vai para o navegador.
- **XSS:** proibido `dangerouslySetInnerHTML`, `eval`, `new Function`, `innerHTML`. Links externos com `rel="noopener noreferrer"`.
- **Segredos:** nunca no código nem em commit. Só em variáveis de ambiente; `.env.example` documenta os nomes.
- **Dependências:** só pacotes mantidos e populares, versão exata, `pnpm audit` sem alta/crítica.
- **Entrada da pessoa:** validar e limitar (tamanho, faixa numérica) antes de usar ou guardar.
- **LGPD:** dado mínimo, finalidade clara, consentimento para qualquer envio ao servidor, opção de apagar tudo.

## Barreira de qualidade (antes de dizer que terminou)

```bash
pnpm typecheck   # sem erros
pnpm test        # todos passando
pnpm build       # build de produção sem erros
```

E, para mudanças de interface: rodar o site (`pnpm build && pnpm start`), testar o fluxo no Playwright em 390 px e 1280 px,
olhar as capturas de tela e conferir que não há erro no console. Nada é "pronto" sem isso.

## Como a equipe trabalha

O processo completo está em [`docs/equipe/processo.md`](docs/equipe/processo.md). Em resumo:

- O plano geral está em [`docs/planejamento.md`](docs/planejamento.md); o quadro da sprint em [`docs/equipe/quadro.md`](docs/equipe/quadro.md).
- Cada história tem um arquivo em `docs/equipe/historias/`. **Todo agente lê a história inteira (inclusive as notas dos colegas)
  antes de começar e escreve a sua nota no fim, na seção "Conversa da equipe".** É assim que a equipe conversa.
- Cada agente tem uma pasta em `docs/equipe/agentes/<papel>/` com `contexto.md` e `diario.md`: lê antes de começar e
  atualiza ao terminar. A seção "Orientações do responsável" do `contexto.md` vale como instrução do dono do projeto.
- Perguntas para outro papel vão em "Perguntas abertas", marcadas com o papel (ex.: `[para: seguranca]`). Quem orquestra
  leva a pergunta ao agente certo antes de seguir.
- Decisões que afetam mais de uma história viram um ADR em `docs/equipe/decisoes/`.

## Git

- Branch por história: `his-001-camadas`. Commits em português, no imperativo, explicando o porquê.
- Nunca reescrever o histórico do `main`. A rotina diária de dados commita em `apps/web/public/dados/` — não editar à mão.
- Espaços reservados para conteúdo de parceiros: ver [`docs/equipe/espacos-reservados.md`](docs/equipe/espacos-reservados.md).
  Ficam desligados (`RECURSOS.espacosReservados = false`) e **não aparecem no site**.

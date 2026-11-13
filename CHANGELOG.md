# Registro de mudanças

## 2026-11-13 · HIS-110 · Contraste das cores

**Para quem usa**
- O número de cada cômodo na casa ilustrada da página inicial e os valores dos cartões da Tarifa Social ficaram mais
  fáceis de ler, inclusive no sol.

**Técnico**
- Faixa D da casa ilustrada com `text-tinta` (5,50:1) e `<dd>` da Tarifa Social com `text-white` (4,77:1); nenhum
  token mudou. A regra de texto sobre cada faixa está comentada em `ui/Etiqueta.tsx`.
- `apps/web/e2e/excecoes-axe.ts` ficou vazio: o axe agora reprova qualquer contraste abaixo de AA.

## 2026-11-13 · Dados quebrados não travam o site (HIS-003a)

**Para quem usa**
- Se os dados da sua casa neste celular estiverem estragados, o site não fica mais em branco. Ele tira só o que está
  errado (por exemplo, um aparelho com potência negativa), mantém o resto e avisa em linguagem simples: "Tiramos 2
  aparelhos e 1 conta de luz. O resto da sua casa continua salvo."
- Se a cidade e a empresa de luz saírem, os aparelhos continuam salvos e o aviso leva a "Escolher minha cidade". Se nada
  der para usar, o aviso leva a "Cadastrar minha casa".
- Se os preços da luz ou a lista de cidades não carregarem, aparece "Tentar de novo". Sem internet, o aviso diz isso.
  A sua casa e as suas respostas continuam salvas.
- Se algo inesperado acontecer, aparece "Algo deu errado nesta tela. Não foi culpa sua", com "Tentar de novo" e
  "Voltar ao início". Uma página que não existe mostra "Não achamos esta página".
- "Apagar todos os meus dados" agora aparece também quando a casa não pôde ser lida, e apaga tudo o que o site guardou.
- O número grande de aparelhos aparece com ponto de milhar ("9.500").

**Técnico**
- Leitores no `@ee/core` (ADR-004): `limites.ts`, `leitura-segura.ts`, `casa-salva.ts` (`lerCasaSalva`, `avisoDaCasaSalva`),
  `arquivos-publicos.ts` (`lerArquivoTarifas`, `lerArquivoMunicipios`, `lerRelatorioDosDados`, `ErroDeFormato`),
  `entrada.ts` e `estados.ts`. Escritos à mão, sem zod; nunca lançam para dado ruim e não corrigem nada.
- `infraestrutura/armazenamento/`: storage próprio que nunca lança e `merge` do `persist` que usa o `lerCasaSalva`. Se o
  leitor lançar, a gravação trava (a casa salva não é sobrescrita). O cadastro novo guarda uma cópia do texto em
  `eficiencia-energetica:casa-ilegivel` (uma vez só, só no aparelho) e solta a trava; `apagarTudo` remove as duas chaves.
- `/dados` passa pelos leitores no navegador e no servidor (`useResumo` expõe `tentarDeNovo`, `falhasSeguidas` e
  `semInternet`); o `lerArquivoTarifas` lê também `substituidas` (HIS-111). A sigla do estado é conferida com `ehUf`.
- Telas: `app/global-error.tsx` (sem `app/error.tsx`, que pesava 1,3 kB em toda rota), `app/not-found.tsx`, `ui/TelaDeErro`,
  `ui/AvisoDaCasaSalva`, `ui/AvisoFalhaDeCarga` e foco no título (`ui/foco.ts`).
- Sete cabeçalhos de segurança em toda resposta (`next.config.ts`; CSP sem `unsafe-eval` em produção), `pnpm audit
  --audit-level high` no CI, `.github/dependabot.yml` (npm e Actions, espera de 7 dias) e `apps/web/.env.example`.
- Rotina de dados em dois jobs: `gerar` (só leitura) e `publicar` (escrita, só no `main`, sem rodar código do projeto).
  `conferirFormato` (`packages/dados/src/formato.ts`) usa os mesmos leitores antes de gravar e não passa com `--forcar`.
  O log do resumo escapa `%`, `\r` e `\n`.
- O bloco provisório do `eslint.config.mjs` saiu; a exceção por arquivo hoje é só `app/global-error.tsx`. O teto da
  HIS-109 ficou em 7 (decisão do tech-lead).
- Testes: core 239, web 16 (vitest), dados 104, camadas 152 e 210 no navegador (204 rodam, 6 pendentes), com
  `cabecalhos`, `casa-salva`, `dados-publicos` e `erros` novos. Peso de JS aceito pelo tech-lead (`peso-js.json`).

## 2026-11-12 · Cada cidade com a distribuidora de hoje (HIS-111)

**Para quem usa**
- Em 227 cidades (RS 127, SP 62, RR 14, MG 13, PB 9, PR 1, RJ 1), o site usava o preço de uma empresa de luz que já não
  existia, comprada ou juntada com outra entre 2017 e 2023. A conta estimada saía de 11% a 55% menor do que a real. Agora
  essas cidades usam o preço da empresa de hoje, o mesmo que vem na conta de luz.
- Quem já tinha a casa salva com a empresa antiga vê um aviso: "O preço da luz foi atualizado. A CPFL Mococa hoje é a
  CPFL Santa Cruz. A gente ainda usava o preço antigo..." Toque em "Entendi" para fechar. O aviso só aparece uma vez e não
  aparece para quem informou a própria conta de luz, porque aí o preço já vinha da conta.
- Se uma empresa de luz deixar de existir no futuro, o site não volta a usar o preço antigo em silêncio.

**Técnico**
- Rotina de dados (ADR-005): não publica tarifa vencida há mais de 6 meses; uma empresa só vira outra pelo mesmo CNPJ ou
  por uma linha de `packages/dados/base/sucessoes.json` com ato e fonte oficiais; na dúvida a rotina para e nada é gravado
  (regras V1 a V10). O `tarifas.json` ganha `substituidas` (id antigo → id de hoje).
- `@ee/core`: `acharDistribuidora` e `distribuidorasDaCidade` seguem `substituidas`; `idDaSigla` é a regra única do id.
  No site, `useDistribuidoraAtualizada` regrava o id uma vez e alimenta o `AvisoTrocaDistribuidora` da `Casca`.
- h8 (PR #9): o `atualizar-dados.yml` roda sem `--forcar` (nem aceita a flag), o diagnóstico roda em `pull_request` sem
  permissão de escrita, o `\r` do log é escapado e o teste dos arquivos publicados (`publicados.test.ts`) entra no `pnpm test`.
- Conferido pelo qa nos arquivos publicados no `main`: mudam exatamente 227 cidades, nenhuma ficou com tarifa vencida, 10
  seguem sem distribuidora, como antes. Teste de unidade: core 56, dados 98, camadas 152. Peso de JS: +38 B por rota.

## 2026-11-03 · Lint e camadas conferidos sozinhos (HIS-002b)

**Para quem usa**
- Nada muda na tela. Por dentro, o projeto passou a conferir sozinho, a cada mudança, se o código segue o padrão e as
  regras de segurança. Isso ajuda a manter o site rápido e seguro para todas as famílias.

**Técnico**
- `pnpm lint` (ESLint 10.13.0, `eslint-config-next` 16.4.3, `eslint-plugin-import-x` 4.17.1; `eslint.config.mjs`, com
  `--max-warnings 0`) e novo passo no job "Lint, tipos e testes" do `ci.yml`. Regras: matriz de camadas por
  `no-restricted-imports`, `zustand` e módulos do Node só onde o ADR-001 permite, `no-explicit-any`, `ban-ts-comment`,
  `react/no-danger`, `eval`/`new Function`, `innerHTML` e afins, `"use server"`, link `target="_blank"` sem `rel`,
  `import-x/order` (ordem dos imports corrigida em commit só de formatação).
- `scripts/verificar-camadas.mjs` passou a usar o parser do TypeScript e ficou com o que depende de outro arquivo: `.servidor`,
  `"use client"`, valor importado de módulo `"use client"` por arquivo sem diretiva (S2), destino do import, link simbólico,
  comentário `eslint-disable` (só a forma da HIS-109, com teto de 7). Saída: `Camadas: tudo certo (N arquivos; M comentário(s) da HIS-109)`.
- 145 casos negativos em `scripts/testes/` (104 no ESLint, 41 no script), rodados no `pnpm test`; apagar um caso obrigatório reprova.
- Correção S2: `ui/tiposDeTransicao.ts` (constantes de transição, antes no `Movimento`) e `aplicacao/identificador.ts`
  (`novoId`, antes em `aplicacao/casa`), para valor compartilhado morar em arquivo sem diretiva.
- Bloco provisório `provisorio/arquivos-em-outras-historias` no `eslint.config.mjs`: saiu na HIS-003a (o teto da HIS-109 ficou em 7).
- `pnpm audit`: sem alta ou crítica; 2 moderadas de `minimatch` (só ferramenta de desenvolvimento, aceitas).
- ADR-001 revisado (onde cada regra é conferida); `docs/arquitetura.md` e `docs/sistema/desenvolvimento.md` atualizados.

## 2026-10-31 · Node 26 (LTS)

**Para quem usa**
- Nada muda na tela.

**Técnico**
- O projeto passa a usar o Node 26, que virou a versão LTS em 28/10/2026: `.nvmrc`, `engines` (`>=26`), CI e rotina
  diária de dados com `node-version: 26`, `@types/node` 26.6.6.
- `casa.ts` lê o armazenamento por `window.localStorage`. A partir do Node 25 o servidor tem um `localStorage` global
  vazio, que avisava no build; pelo `window`, o servidor continua sem gravar nada, como antes.
- Conferido no Node 26.13.0: typecheck, testes, build sem aviso, `pnpm audit` limpo e e2e (107 ok, 6 pendentes).

## 2026-10-30 · Rolagem suave nos links da página inicial

**Para quem usa**
- Os links do topo da página inicial ("Como funciona", "Tarifa Social" e "Perguntas") agora deslizam até a seção em vez
  de pular de uma vez. Quem pede menos movimento no celular continua com o salto direto.

**Técnico**
- `scroll-behavior: smooth` no `html` dentro de `prefers-reduced-motion: no-preference` (`globals.css`) e
  `data-scroll-behavior="smooth"` no `<html>` (`app/layout.tsx`), para o Next 16 não aplicar a rolagem suave nas trocas
  de página, que já têm a transição própria.

## 2026-10-30 · Testes no navegador a cada mudança (HIS-002a)

**Para quem usa**
- Nada muda na tela. Quem usa leitor de tela ou comando de voz ouve melhor três partes do site:
  - na casa ilustrada da página inicial, cada cômodo diz o nome, a parte da conta e o valor ("Quarto, 19% da conta,
    R$ 21,74 por mês"), na mesma ordem em que aparecem na tela;
  - em "Quem mais gasta", cada aparelho diz quantidade, nome, cômodo, parte da conta, uso e valor, como na tela;
  - a tabela do "Painel geral", que no celular passa da largura da tela, tem nome e agora recebe o foco com Tab, para
    rolar para o lado com as setas.
- Os cartões da Tarifa Social e do Desconto Social são lidos como uma lista certa, sem o aviso do CRAS misturado.

**Técnico**
- Testes no navegador em `apps/web/e2e/` (Playwright 1.63.0, Chromium), em 390 px e 1280 px: fluxo principal, aparelhos,
  cômodos, ajustes, rotas, migração v1 → v2, teclado e transições. 113 testes (107 rodam, 6 pendentes citando HIS-107 e
  HIS-108). Comando: `PORTA_E2E=3105 pnpm --filter @ee/web test:e2e`, depois do `pnpm build`.
- Todo teste reprova com erro de página, `console.error` ou pedido para fora do site (`e2e/apoio/teste.ts`).
- axe (`@axe-core/playwright` 4.14.0) nas 7 páginas, sem e com casa: nenhuma violação séria ou crítica fora de
  `e2e/excecoes-axe.ts` (8 entradas `color-contrast` da `/`, uma por elemento, todas da HIS-110).
- Peso de JS comparado com `e2e/peso-js.json`: até +1 024 B (JS do HTML) e +2 048 B (total com prefetch), gzip;
  limites em `e2e/apoio/peso.ts`. `sanidade.spec.ts` prova que cada barreira reprova quando deve.
- `ci.yml` em dois jobs, que são os checks obrigatórios do `main`: "Lint, tipos e testes" e "Navegador (e2e, axe e
  peso)". O segundo guarda o artefato `relatorio-e2e` (14 dias), escreve peso e exceções no resumo e confere que nada
  mudou no repositório. Actions fixadas por SHA, `permissions: contents: read`, `persist-credentials: false`, telemetria
  do Next desligada.
- Correções sem mudança visível: `aria-label` da `CasaIlustrada` e do "Quem mais gasta", região com nome e `tabIndex`
  na tabela do "Painel geral", `<dl>` da Tarifa Social só com `dt`/`dd`.
- A pasta provisória `apps/web/e2e-base/` saiu do repositório: o `e2e/` cobre o que ela conferia.
- ADR-003 (qualidade automática), ADR-004 (leitura segura de dados) e ADR-005 (distribuidora que deixa de existir) aceitos.

## 2026-10-29 · Código do site organizado em camadas (HIS-001)

**Para quem usa**
- Nada muda. As telas, os textos, as animações e a casa guardada no celular continuam iguais. Quem já tinha a casa
  cadastrada abre o site e encontra tudo como deixou.

**Técnico**
- `apps/web/src` reorganizado nas camadas do ADR-001: `app/` (rotas finas, sem `"use client"`), `funcionalidades/`
  (`inicio`, `cadastro`, `casca`, `acompanhamento`, `comodos`, `dicas`, `ajustes`), `ui/` (um arquivo por componente;
  `ui.tsx` foi dividido), `ui/aparelho/` (componentes de aparelho usados por mais de uma tela), `aplicacao/` e
  `infraestrutura/`. As pastas `components/` e `lib/` não existem mais.
- `aplicacao/` passa a ser a única porta das telas para `infraestrutura/`; novo hook `useEdicaoDeAparelho()`. O
  `EditorAparelho` não lê mais o store: recebe `comodos`, `aoSalvar` e `aoRemover`.
- Store da casa em `infraestrutura/armazenamento/casa.ts` (um só `create`), sem mudar o formato salvo: chave
  `eficiencia-energetica:casa`, versão 2, mesma migração. `novoId` em `infraestrutura/identificador.ts`.
- Página inicial separada em rota fina (`app/page.tsx`, com `revalidate = 86400`), tela (`funcionalidades/inicio/PaginaInicial.tsx`)
  e leitura de disco em arquivos `*.servidor.ts` com `import "server-only"` (o build falha se chegarem ao navegador).
- Verificador de camadas `scripts/verificar-camadas.mjs` (Node puro, sem dependência): `pnpm camadas`, e roda dentro do
  `pnpm typecheck` e, por isso, no CI.
- ADR-001 revisado: `ui/` pode chamar funções puras do `@ee/core`; componentes de domínio compartilhados em `ui/<assunto>/`;
  arquivos só de servidor em `*.servidor.ts`; sem `index.ts` que junta exportações.
- Comparação "antes × depois" do qa em `apps/web/e2e-base/` (provisória): 84 capturas em 390 e 1280 px, textos, DOM e casa
  salva iguais ao código anterior. O JavaScript para abrir cada página ficou igual ou menor (até 1,7 kB a menos).
- Nenhuma dependência, configuração do Next ou do CI mudou.

## 2026-10-29 · Equipe, planejamento e documentação

**Para quem usa**
- O site agora se apresenta como um projeto independente e gratuito.

**Técnico**
- Equipe de 10 agentes em `.claude/agents/`, com pasta de contexto e diário de cada um em `docs/equipe/agentes/`.
- Planejamento (`docs/planejamento.md`), processo Scrum, quadro da Sprint 0 e histórias HIS-001 a HIS-003.
- ADR-001 (camadas) e ADR-002 (espaços reservados, desligados).
- Documentação do sistema em `docs/sistema/` e arquitetura em `docs/arquitetura.md`.
- Guia do projeto para a equipe em `CLAUDE.md`.

## Catálogo de aparelhos e tempos de uso

**Para quem usa**
- Ar-condicionado split inverter, split comum, de janela ou portátil, com BTUs; geladeira por modelo e idade; TV por
  tecnologia e tamanho; chuveiro por potência e aquecimento solar. Quase 60 aparelhos.
- Tempo de uso de 2 minutos ao dia todo, e frequência de todo dia até 1 vez por mês.
- Estado escolhido numa lista.

## Animações

**Para quem usa**
- Transições suaves entre telas, entre os passos do cadastro e ao entrar no painel. Desligadas para quem prefere menos movimento.

## Cômodos, acompanhamento e plano de economia

**Para quem usa**
- Cômodos com nome e quantidade, aparelhos sugeridos por cômodo e quantidade de cada aparelho.
- Painel geral que junta os aparelhos iguais da casa.
- Acompanhamento editável, histórico de contas e leituras do relógio de luz.
- Plano de economia: escolha as dicas e veja a nova conta.
- Nova página inicial.

## Tarifa Social na conta de referência

**Técnico**
- O preço do kWh calculado a partir da conta considera só os kWh cobrados (sem os 80 kWh gratuitos).

## Primeira versão

**Para quem usa**
- Cadastro da casa, conta estimada, aparelhos que mais gastam, dicas e ajustes.

**Técnico**
- Monorepo com `@ee/core` (cálculos), `@ee/dados` (rotina diária da ANEEL) e site Next.js.

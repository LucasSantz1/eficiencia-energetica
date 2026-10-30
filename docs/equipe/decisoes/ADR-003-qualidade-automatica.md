# ADR-003 · Qualidade automática no CI: lint, camadas, navegador, acessibilidade e peso

- **Status:** aceito (2026-10-30, tech-lead, depois das revisões de seguranca, qa e ux; a essência não mudou — os
  endurecimentos pedidos estão no D16 da HIS-002a e da HIS-002b e nos itens 1 e 3–7 abaixo)
- **Data:** 2026-10-29 (aceito em 2026-10-30)
- **Responsável:** tech-lead, com qa e seguranca

## Contexto

Até a HIS-001 o CI fazia typecheck (com o `scripts/verificar-camadas.mjs`), testes de unidade e build. Os testes no
navegador eram roteiros soltos do qa (`apps/web/e2e-base/`), e o peso de JS era medido à mão. O Next 16 tirou o
`next lint`, e o `next build` não roda mais lint. Toda história daqui para a frente precisa das mesmas barreiras.
Detalhes e medições: HIS-002, "Desenho técnico definitivo" (D1–D15). Desde 2026-10-29 a HIS-002 está dividida:
[HIS-002a](../historias/HIS-002-qualidade-automatica.md) (navegador; D1–D3, D8–D15) e
[HIS-002b](../historias/HIS-002b-lint-e-camadas.md) (lint e camadas; D4–D7 e passos B1–B8).

## Decisão

1. **ESLint (configuração plana na raiz) e o script de camadas convivem, cada regra num lugar só.** O ESLint fica com o
   que se decide olhando o próprio arquivo (matriz do ADR-001 como lista do que pode, `../`, pacotes por camada,
   `require`, `"use server"`, `import()` dinâmico, `innerHTML`, `any`). O script fica com o que depende de outro arquivo
   ou da estrutura (diretiva do destino, `.servidor` e `server-only`, regra S2, pastas antigas, link simbólico, 0
   arquivos lidos) e lê os imports com o parser do `typescript`. Cada regra tem caso negativo automático
   (`scripts/testes/`), com controles e uma lista fixa de ids obrigatórios. **Nenhum comentário pode desligar regra
   do ESLint** no site e no domínio, salvo a forma da HIS-109 (regra C10, no script — fora do alcance da configuração do
   ESLint); os ignores do ESLint ficam ancorados no que é gerado, e um controle confere que o ESLint lê o mesmo número de
   arquivos que o `git ls-files`.
2. **`import()` dinâmico e `"use server"` ficam proibidos** até existir regra própria (o primeiro quando precisar dividir
   código, ex.: OCR; o segundo no E4, com a seguranca).
3. **e2e com Playwright em todo pull request e todo push no `main`**, nos projetos `celular` (390×844) e `computador`
   (1280×900), contra o build de produção, falhando em erro de console, sem repetir teste que falha (`retries: 0`). A
   versão do `@playwright/test` casa com o Chromium que o ambiente de nuvem já tem, para o resultado ser o mesmo no
   computador e no CI. Os dois checks são obrigatórios para integrar. Uma fixture automática reprova também **qualquer
   pedido para fora de `127.0.0.1`** (princípio 5 do produto: nada sai do aparelho sem a pessoa saber). Cada barreira
   tem um negativo permanente (`sanidade.spec.ts`, `test.fail()`).
4. **axe nas páginas principais, com e sem casa salva, nos passos do cadastro e nas folhas:** violação séria ou crítica
   falha. O axe roda sem filtro (`disableRules`, `withTags`, `exclude`… proibidos). A única saída para uma violação que
   exige mudança visível é uma exceção **por elemento** — seletor CSS que casa com exatamente um elemento —, com a
   história que corrige (que existe no planejamento), revisada pela `ux-acessibilidade`; exceção que não casa mais com
   nada, ou que casa com mais de um elemento, também falha.
5. **Peso de JS com referência no repositório** (`apps/web/e2e/peso-js.json`): JS que o HTML referencia (sem `noModule`,
   gzip) até +1 024 B por rota e total com prefetch até +2 048 B. Os limites são constantes de código, nunca do JSON nem
   de variável de ambiente. A referência só muda de propósito, num PR que explica o porquê; o CI nunca a atualiza, e o
   último passo do job confere que nenhum arquivo do repositório mudou.
6. **Artefato do job** com relatório, capturas e traces em toda execução não cancelada, por 14 dias, só com dados
   inventados de teste.
7. **CI com menor poder possível:** token só de leitura (`permissions: contents: read`), `persist-credentials: false`,
   só os gatilhos `push` no `main`, `pull_request` e `workflow_dispatch`, nenhum `${{ github.event.* }}` em `run:`,
   actions **fixadas pelo SHA** do commit com a versão em comentário, e telemetria do Next desligada.

## Alternativas consideradas

- **Só ESLint (tirar o script):** o ESLint olha um arquivo por vez e não sabe a diretiva do arquivo importado; a regra S2
  e o `.servidor` exigiriam um plugin próprio que lê outros arquivos — mais código para manter que o script.
- **Só o script (sem ESLint):** regex não lê sintaxe; as lacunas S1 da HIS-001 mostraram o limite.
- **e2e em todo push de qualquer branch:** dobra as execuções sem ganho (o trabalho chega ao `main` só por PR).
- **e2e só no `main`:** o defeito seria achado depois de integrar.
- **Comparar o peso compilando o `main` no CI:** o dobro do tempo de build em todo PR.
- **Testes visuais por pixel:** frágeis entre máquinas; fora do escopo do produto agora.

## Consequências

- O CI passa de ~35 s para ~4 min de parede (dois jobs em paralelo), dentro dos minutos gratuitos.
- ~300 pacotes de desenvolvimento a mais (árvore do `eslint-config-next` e Playwright): nenhum vai para o navegador; o
  `pnpm audit` e o portão de peso conferem.
- Subir o Playwright exige o mesmo navegador no ambiente de nuvem; subir o ESLint exige rodar os casos negativos.
- Toda regra nova de camadas ou de segurança entra com caso negativo na tabela de `scripts/testes/`.
- Toda história de interface ganha teste no navegador em vez de roteiro solto; mudança de peso de JS é visível no PR.
- Actions por SHA não se atualizam sozinhas: o Dependabot para `github-actions` (HIS-003) abre o PR com o SHA novo.
- Usar um serviço de terceiro no site (ex.: análise de uso) passa a exigir mudar a fixture de rede de propósito, com a
  seguranca e o consentimento da pessoa — nunca entra por engano.
- Desligar uma regra do ESLint numa linha exige mudar a C10 do script, revisada pela seguranca.
- O `apps/web/e2e-base/` (comparador antes × depois da HIS-001) saiu no commit `020db92` (A7 da HIS-002a), quando o
  `apps/web/e2e/` passou a cobrir o que ele cobria. Para uma próxima reorganização "sem mudar nada", ele volta do
  histórico: `git show 020db92^:apps/web/e2e-base/linha-de-base.cjs` (e as fixtures, já iguais às de `apps/web/e2e/fixtures/`).

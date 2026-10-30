# Contexto · Tech Lead

## O que eu cuido

- Arquitetura e regras de camadas (ADR-001), `docs/arquitetura.md`, `docs/equipe/decisoes/`.
- Configuração: `package.json` da raiz, `pnpm-workspace.yaml`, `tsconfig*.json`, `apps/web/next.config.ts`.
- CI/CD: `.github/workflows/ci.yml` (typecheck, test, build) e `atualizar-dados.yml` (rotina diária).
- Code review final de toda história.

## Estado atual

- Monorepo pnpm 10: `apps/web` (Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Zustand 5.0.16),
  `packages/core` (domínio, 37 testes), `packages/dados` (rotina ANEEL, 11 testes).
- Site em camadas (HIS-001, branch `his-001-camadas`, PR #1): `app/`, `funcionalidades/<nome>/`, `ui/` (+ `ui/aparelho/`),
  `aplicacao/`, `infraestrutura/`, `config/`. **Code review aprovado em 2026-10-29** (seção 12 do desenho); próximo:
  `documentacao` (etapa 8) e `scrum-master` (etapa 9). O `main` só muda quando a PR #1 for integrada.
- Sem ESLint ainda (entra na HIS-002). As camadas são conferidas por `scripts/verificar-camadas.mjs` (`pnpm camadas`),
  que roda dentro do `pnpm typecheck` (64 arquivos hoje). CI verde no `182f355`.
- Next 16: o build não mostra mais "First Load JS"; para comparar peso, usar `.next/prerender-manifest.json`
  (`htmlSize`, `initialRevalidateSeconds`) e os bytes de script. A `/` hoje: `htmlSize` ≈ 66 kB, revalidate 86400.
- JS do HTML depois da HIS-001 (gzip, sem `noModule`): `/` 164 212, `/comecar` 172 561, `/casa` 175 053,
  `/casa/comodos` 172 950, `/casa/dicas` 166 026, `/casa/ajustes` 163 965, `/sobre` 139 573 B.
- `next.config.ts`: `transpilePackages: ["@ee/core"]`, `poweredByHeader: false`, cache dos `/dados`.
  Cabeçalhos de segurança entram na HIS-003.
- HIS-002 dividida em **002a** (navegador; arquivo `HIS-002-qualidade-automatica.md`, branch `his-002-qualidade`) e
  **002b** (lint e camadas; branch própria depois da 002a no `main`). Desenho D1–D15 (2026-10-29) + **D16** (2026-10-30,
  decisões sobre as revisões de seguranca, qa e ux, nas duas). **002a liberada para a etapa 4** (qa A1–A5, frontend no
  A5, A6 CI, A7 tira o `e2e-base`); ≈ 2,75 dias. 002b ≈ 2–2,5 dias. ADR-003 **aceito** em 2026-10-30.
- **HIS-003:** desenho técnico pronto (D1–D9, 2026-10-30).
  - Leitores escritos à mão no `@ee/core` (sem zod), descritos no ADR-004 (proposto).
  - `storage` próprio + `merge` que valida; o `migrate` só repassa.
  - `atualizar-dados.yml` em dois jobs.
  - Quebra proposta: 003a (cerca de 3 dias com o qa) e 003b (cerca de 1,5 dia).
  - Aguarda a P-tl-1 (seguranca), a P-tl-2 (dominio-energia) e a P-tl-3 (scrum-master).
  - Depende só da 002a no `main`.
  - Protótipo do `persist` em `scratchpad/tl-his003/persist/`; medição do zod em `scratchpad/tl-his003/zod/`.
- **HIS-111 (tarifas vencidas, número errado no ar em 227 cidades):** desenho técnico pronto (T1–T7, 2026-10-30) e
  ADR-005 aceito. Passos h0–h8. **Code review do backend (h0–h5 + correções do passo 0) aprovado em 2026-10-30**,
  com o diagnóstico 4 (`fcb4462`) passando todos os portões (227 cidades mudam, 10 sem distribuidora, (d)=0). Itens
  não bloqueantes para o h8: seleção de tarifa ainda agrupa só pela sigla (comentar + teste de dois CNPJs no mesmo
  início), 2 comentários velhos, `push` → `pull_request` no `diagnosticar-dados.yml`. **h6 (frontend, `10166f5`) aprovado em 2026-10-30**; itens: `idDaSigla` do core vira o `slug` da rotina no h8, `setState` no efeito vai para a HIS-109. Próximo: qa (h7).
- CI: `ci.yml` da HIS-002a escrito no A6 (2026-10-30, branch `his-002-qualidade`). São dois checks em paralelo:
  "Lint, tipos e testes" e "Navegador (e2e, axe e peso)". Esses nomes valem para a proteção do `main` e a 002b não
  pode mudá-los. No runner (PR #3, 2026-10-30): job `e2e` ~2,8 min (Chromium 24 s, e2e ~1,9 min, 107 passam e 6
  pendentes, igual ao local); `verificar` ~25 s. O commit descartável `32f2cff` deixou `relatorio-e2e` (10,2 MB).
  **HIS-002a: code review aprovado em 2026-10-30** (etapa 7). Falta a ux revisar o `excecoes-axe.ts` e alguém copiar a
  tabela de peso do resumo do job.
- Ambiente de nuvem: Playwright 1.63.0 com Chromium revisão 1243 em `/opt/pw-browsers` (`PLAYWRIGHT_BROWSERS_PATH`);
  baixar navegador é bloqueado. `CI` e `GITHUB_ACTIONS` não estão definidas aqui. `git ls-remote` e `git clone
  --depth 1` de repositório público passam (SHA das actions). Desde 2026-10-30, a API **REST** do GitHub passa
  (`gh api repos/{owner}/{repo}/actions/runs/<id>/jobs` e `check-runs/<id>/annotations`, que trazem "N passed"). Não
  passam: o GraphQL (`gh pr checks`) e o blob dos logs e artefatos (403). O resumo do job só se vê no navegador.

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
  Medida: `scratchpad/tl-scripts/js-do-html.mjs`; levar para o e2e da HIS-002 (critério 9, referência guardada no repositório).
- **ESLint × script de camadas (decidido em 2026-10-29, vale na HIS-002):** convivem, cada regra num lugar só. ESLint =
  regras do próprio arquivo (matriz de camadas, sem `../`, `require`, `import()` não literal, `getBuiltinModule`,
  `"use server"`, pacotes por camada, domínio só `./`). Script = o que exige outro arquivo ou a estrutura (diretiva do
  destino, `.servidor`/`server-only`, sem-diretiva só importa componentes de módulo `"use client"`, pastas antigas,
  0 arquivos, link simbólico = erro, toda extensão de código). A matriz sai do script quando o ESLint passar nos casos negativos.
- **Endurecimentos do D16 (HIS-002, 2026-10-30):** actions do `ci.yml` por SHA de 40 caracteres com a versão em
  comentário (checkout v7.0.1 `3d3c42e5…`, pnpm/action-setup v6.1.0 `ea17c68d…`, setup-node v7.1.0 `949feb24…`,
  upload-artifact v7.0.2 `cf430e03…`; conferir com `git ls-remote --tags`, que passa pelo proxy — usar a linha `^{}`
  em etiqueta anotada); `persist-credentials: false`; `NEXT_TELEMETRY_DISABLED`; último passo do job `e2e` "nada mudou
  no repositório". e2e: fixture que reprova pedido para fora do `baseURL` (`data:`/`blob:` liberados); exceção do axe =
  um elemento (seletor CSS com exatamente 1); limites de peso como constantes em `e2e/apoio/peso.ts`. 002b: regra
  **C10** no script (nenhum comentário de ESLint em `src`, salvo a forma da HIS-109), ignores do ESLint ancorados +
  contagem = `git ls-files`, ids obrigatórios nos casos negativos.
- **Ferramentas de qualidade (HIS-002, ADR-003 aceito):** ESLint 10.13.0 + `eslint-config-next` 16.4.3 +
  `eslint-plugin-import-x` 4.17.1 (o `import/order` do `eslint-plugin-import` 2.32.0 quebra no ESLint 10; saída se
  outra regra quebrar: ESLint 9.39.5) e `typescript` 5.9.3 na raiz; `@playwright/test` **1.63.0** (casada com o
  Chromium do ambiente — subir junto) e `@axe-core/playwright` 4.14.0 em `apps/web`. Script de camadas passa a usar o
  parser do `typescript`. `import()` dinâmico e `"use server"` proibidos até haver regra. e2e em todo PR e push no
  `main`; sem cache do navegador no runner (rever se o passo passar de 60 s). Peso de JS com referência em
  `apps/web/e2e/peso-js.json`. `e2e-base` sai no fim da parte do navegador.
- **Builds de revisão** sempre numa cópia própria no scratchpad (`git archive HEAD` + `pnpm install --offline`), nunca no
  `apps/web/.next` do repositório: build em paralelo derruba o servidor de quem está testando (lição do qa na HIS-001).

- **Leitura segura de dados de fora (HIS-003, ADR-004 aceito em 2026-10-30, com R4c e R4d).**
  - Funções `lerX(bruto: unknown)` no `@ee/core`, sem biblioteca, com os limites em `limites.ts`.
  - Medição em gzip: `zod` 93 kB, com teste de `new Function` que a CSP bloqueia; `zod/mini` 8,2 kB; à mão 1,3 kB.
  - Rever o `zod/mini` quando os formatos crescerem (E4).
  - O mesmo leitor serve ao navegador (descarta a entrada), ao servidor (lança) e à rotina (recusa até com `--forcar`).
  - Nada é corrigido, salvo os 2 consertos do dominio.
  - O leitor não descarta data no futuro.
  - O formato salvo da casa não muda.
- **`persist` do zustand 5:**
  - o `merge` recebe `unknown` e roda sempre;
  - o `migrate` só roda quando a versão muda;
  - o `set` da hidratação não grava.

  Para regravar, `storage.setItem` no `onRehydrateStorage`. O tipo fica com `PersistStorage<unknown>` e
  `partialize: (s): unknown`, conferido com o `tsc`.
- **Distribuidora que deixa de existir (HIS-111, ADR-005 aceito em 2026-10-30, com V9/V10 e "sucessão para empresa
  vigente" sem `--forcar`):**
  - tarifa vencida há mais de 6 meses não é publicada;
  - uma empresa vira outra só por CNPJ igual (com a sigla antiga não vigente) ou por linha do `sucessoes.json` com ato
    e fonte;
  - `substituidas?` no `tarifas.json`, sempre com o id final;
  - id guardado é resolvido pelo core (`acharDistribuidora`, `distribuidorasDaCidade`) e regravado uma vez pelo
    `aplicacao/`, nunca pelo leitor da casa salva;
  - barreiras de número errado ou de contrato não passam com `--forcar`; as de cobertura passam.
  - _(revisto depois do passo 0)_ nome igual não é a mesma empresa: a sigla só liga com a mesma raiz de CNPJ (8
    dígitos) ou sem CNPJ; a empresa da tarifa é sigla + CNPJ; o ano do conjunto (arquivo parou em 2014) só tira
    vínculo que não chega a tarifa publicada, e só se a cidade tiver outro;
  - V4 = sucessora final publicada (com o V1, até 6 meses vencida), não "vigente" estrito.
- **Diagnóstico da rotina na Action:** a ANEEL dá 403 daqui. Para ler os CSVs, usar um workflow só de leitura
  (`contents: read`, `persist-credentials: false`, sem gravar, último passo "nada mudou"). O `workflow_dispatch` só
  aparece com o arquivo no `main`; numa branch, usar um gatilho `push` limitado à branch.
- **SHA de actions:** `actions/download-artifact` v8.0.2 `9000827ccba6bdab643e8b6fd33ac0654aef8333` (etiqueta leve,
  conferida em 2026-10-30).

## Pendências

- HIS-003: levar as respostas da P-tl-1, da P-tl-2 e da P-tl-3 para o desenho. No a6, reconferir os SHA. No code
  review, conferir:
  - nenhum `as` sobre dado de fora;
  - os testes de falso positivo (arquivos publicados e `casa-v1`/`casa-v2` sem aviso);
  - o peso até cerca de +3 kB por rota (acima de +4 kB, conversar antes).
- HIS-111: no code review, conferir que `lerCasaSalva` não conhece `substituidas`, que `Object.hasOwn` está no
  `acharDistribuidora`, que V1–V4 e V7–V10 ignoram o `--forcar`, que o h8 tirou o gatilho `push` do
  `diagnosticar-dados.yml` e ligou o teste dos publicados. ~~Cópia antiga do ADR-005 na branch~~ trazida a versão
  aceita (da `his-002-qualidade`; o `origin/main` ainda tem a proposta, porque o 4e58b5b não entrou no PR #3) e
  revista em 2026-10-30. Pergunta F1 resolvida pelo h6 (nome no core, par só na memória, `anunciar` no `Aviso`).
- HIS-003: no code review, conferir também que o leitor garante o cômodo de cada aparelho (sem ele, o `aria-label` do
  "Quem mais gasta" diria "em undefined").
- Dívida T2 (e2e): `seletorDoNo` e `TelaAxe` exportados sem uso de fora (`e2e/apoio/axe.ts`).
- Backlog sugerido (HIS-003, risco 6): avisar a pessoa quando o navegador não conseguir salvar (memória cheia ou
  bloqueada).

- ~~Responder: componentes de aparelho compartilhados vão para `ui/aparelho/`? (HIS-001)~~ respondido em 2026-10-29: sim.
- ~~Responder: peso do JS da `/casa` sem casa (+1 449 B) (HIS-001)~~ respondido em 2026-10-29: aceito; item 11 em 11a/11b.
- ~~Responder: e2e em todo push ou só em PR e `main`? (HIS-002)~~ respondido em 2026-10-29: todo PR e push no `main`.
- ~~HIS-002: ESLint substitui ou convive com o script?~~ decidido em 2026-10-29: convivem (ver "Decisões em vigor").
- ~~Code review da HIS-001 (etapa 7)~~ aprovado em 2026-10-29.
- ~~Desenho técnico definitivo da HIS-002~~ escrito em 2026-10-29 (D1–D15).
- ~~HIS-002: resposta do scrum-master e ajustes da seguranca/qa~~ feito em 2026-10-30 (D16); ADR-003 aceito.
- ~~HIS-002a: code review na etapa 7~~ aprovado em 2026-10-30 (2 checks verdes, artefato no descartável, mesma lista).
  Resta o peso do runner × local: o verde só prova que está dentro do limite. Pedi a quem orquestra a tabela do resumo
  do job; se a diferença passar de ±100 B, a referência passa a ser a do CI (D14). Se o e2e passar de 10 min, rever os workers.
- HIS-002b: implementação depois da 002a no `main`; no B8, a frase do ADR-001.
- Dívida nova (HIS-109, se o scrum-master confirmar): 8 efeitos que copiam estado (`react-hooks/set-state-in-effect`)
  em `TelaComodos`, `armazenamento/casa`, `dados-publicos/navegador`, `Movimento`, `EditorAparelho` — reescrever com
  `key`, estado derivado ou `useSyncExternalStore`, com e2e conferindo.
- Observação para o backend (futuro): o commit diário dos dados usa `GITHUB_TOKEN`, que não dispara o CI — dados novos
  não passam pelo e2e. Sugestão: rodar o e2e no `atualizar-dados.yml` antes do `git push`.
- Dívida técnica registrada na HIS-001 (história futura, com `dominio-energia` quando houver número):
  - levar para `@ee/core` com teste: `faixaDoPeso` (`ui/Etiqueta`) e a escala repetida em `CasaIlustrada`; regras do
    rascunho do cadastro (banhos por pessoa, 8 min); `tarifaMedia`; `descreverUso`/`horasPorDiaTexto`;
  - juntar o `semAcento` repetido (`SeletorCatalogo`, `BuscaCidade`);
  - `CasaIlustrada` formata dinheiro com um `reais()` local (Intl, espaço sem quebra U+00A0) em vez do `formatarReais`
    do `@ee/core` (que troca o U+00A0 por espaço comum). Trocar muda o texto lido e o do e2e da HIS-002a: fazer junto da
    decisão `corDaParte` × `faixaDoPeso` (HIS-110) ou quando a `CasaIlustrada` for mexida, com o e2e ajustado;
  - dividir `Cadastro.tsx` (554 linhas) e `TelaComodos.tsx` (415);
  - tirar o `export` do que só é usado no próprio arquivo (T2, igual no `main`): `Faixa`, `DESCRICAO_FAIXA`
    (`ui/Etiqueta`), `Simbolo` (`ui/Marca`), `prefereMenosMovimento`, `useValorAnimado`, `useVisivel` (`ui/Movimento`),
    `novoComodoRascunho` (`funcionalidades/cadastro/rascunho.ts`) — quando o arquivo for mexido.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

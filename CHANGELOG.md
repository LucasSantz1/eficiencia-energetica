# Registro de mudanças

## 2026-11-25 · Correções da rodada de verificação do bloco

**Para quem usa**
- **Tarifa Social com o mínimo da ligação:** até 80 kWh no mês, a conta não cobra energia. Acima disso, o mínimo da
  ligação volta a valer: numa casa trifásica com 90 kWh, o site agora cobra 20 kWh (antes, 10).
- São José do Rio Preto (SP) não aparece mais ligada à Light; a cidade é da CPFL Paulista. A casa salva com a Light lá
  passa para a CPFL, com o aviso "Corrigimos a empresa de luz da sua cidade".
- "O que é kWh?" agora diz "Um banho de 10 minutos no chuveiro elétrico gasta quase 1 kWh".
- No "Não sei qual é o meu", o tamanho da TV é comparado com a largura de uma porta.
- Sem internet, o "Não sei qual é o meu" mostra "Não deu para abrir as perguntas", com "Tentar de novo" e "Voltar", em
  vez de derrubar a tela de cômodos.
- Na folha da meta, os valores das dicas somam o total; da segunda em diante aparece "economiza mais". O aviso de
  estimativa longe da conta diz "pode faltar algum aparelho" ou "confira o tempo de uso", conforme o caso.
- Conta de 0 kWh no Mês a mês não mostra mais "R$ 0,00 por kWh" e fica fora da comparação com a estimativa.
- O foco do teclado e do leitor de tela não cai mais no começo da página ao abrir e fechar o "Não sei" e ao salvar a
  primeira conta. "Fechar" das folhas não quebra no meio a 200% de zoom. "Novembro de 2026", não "Novembro De 2026".

**Técnico**
- `estimarConta` (`calculos.ts`): na Tarifa Social, `kwhCobrados = consumo > 80 ? max(consumo, mínimo) − 80 : 0`, e
  `cobradoPeloMinimo` vale entre 81 e 99 kWh na trifásica. `detalharConta` usa `consumoMinimoKwh − consumo` na linha do
  mínimo. Casos C7 do dominio-energia no teste.
- `CODIGOS_TROCADOS`: `correto` opcional (só remove); entrada da Light × 3549805; comentário separa as trocas confirmadas
  (comunicado EFC 02/2022, Governo do RS) das prováveis. `outra-uf.ts`: situação nova `area-propria` (ESS × Guarapuava,
  antiga CFLO).
- V11: a regra dos 20% pede 2 cidades ou mais, exceto em distribuidora de até 3 cidades
  (`CIDADES_DA_DISTRIBUIDORA_MINUSCULA`). Testes 4+1, 2+2 e 2+1.
- `TempoUso`: sem `React.lazy`; a promessa do `import("./GuiaVisual")` fica guardada (mesmo se falhar, senão o React
  baixava sem parar) e é esquecida só no "Tentar de novo". Barreira `ui/aparelho/FalhaAoAbrirGuia`. e2e cortando os `.js`.
- `meta.ts`: ganho de cada passo = diferença dos valores já arredondados. `historicoContas` e `mediaDasContas` devolvem
  `precoKwh: undefined` sem kWh.
- Conferido: core 317, web 42, dados 114, camadas 156; e2e completo 308 ok, 8 pulados.

## 2026-11-25 · Nomes de distribuidoras como na conta de luz (HIS-205)

**Para quem usa**
- Cinco empresas de luz aparecem com o nome da conta: Santa Maria, Força e Luz de Urussanga, Dcelt Energia, Mux Energia
  e Pacto Energia. Os sufixos da ANEEL somem (CERAL-DIS vira CERAL). As outras cooperativas seguem pela sigla, que é o
  que vem em destaque na conta delas.

**Técnico**
- `NOMES_COMERCIAIS` em `distribuidoras.ts`, com fonte por nome; `SUFIXO_DA_ANEEL` no nome reserva. Nenhum nome sem fonte.

## 2026-11-25 · Cadastro mais leve, conta de exemplo e o que é kWh

**Para quem usa**
- O cadastro fica numa coluna só, no meio da tela. Cada pergunta tem um ícone grande e uma frase curta. "Por que
  perguntamos…?" abre embaixo do título.
- No passo da conta de luz, um desenho de conta de exemplo mostra onde ficam o consumo (**1**) e o total (**2**). O
  mesmo desenho aparece em Minha casa, em "Onde acho esses números?".
- "O que é kWh?" explica a medida com palavras do dia a dia, no cadastro e no painel.

**Técnico**
- `ui/conta/ExemploDeConta` (conta genérica marcada "Exemplo", sem imitar distribuidora; `role="img"`) e `ui/ExplicaKwh`
  (`<details>`, sem JS). O painel lateral do cadastro saiu; `layout-computador.spec.ts` reescrito para o /comecar.

## 2026-11-25 · Conta detalhada, linha por linha (HIS-201)

**Para quem usa**
- "Conta detalhada" no cartão da conta mostra a estimativa como numa fatura: energia, bandeira do mês, o que falta até o
  mínimo da ligação, o desconto da Tarifa Social e a iluminação pública. As linhas somam o valor grande.

**Técnico**
- `detalharConta` em `packages/core/src/conta-detalhada.ts`, em centavos, a partir do `estimarConta`; o centavo do
  arredondamento vai para a energia. e2e `conta-detalhada.spec.ts`. Peso: +1,2 kB gzip na /casa (registrado).

## 2026-11-25 · Cidades ligadas a distribuidora de outro estado (HIS-206)

**Para quem usa**
- Dez cidades apareciam ligadas a uma cooperativa de outro estado com cidade de mesmo nome (Nova Santa Rita, PI, com a
  CERTAJA do RS: a conta saía cerca de 18% menor). A casa salva assim passa, uma vez, para quem atende a cidade, com o
  aviso "Corrigimos a empresa de luz da sua cidade". Os arquivos publicados mudam na próxima atualização dos dados.

**Técnico**
- `CODIGOS_TROCADOS` e `trocaPorCodigoTrocado` no core (rotina e site usam a mesma tabela). Rotina: `moverCodigosTrocados`
  e barreira **V11** (não passa com `--forcar`), com as ligações conferidas em `packages/dados/src/aneel/outra-uf.ts`.
  e2e `cidade-corrigida.spec.ts`.

## 2026-11-25 · Zoom de 200% sem rolar para o lado (HIS-107 e HIS-116)

**Para quem usa**
- Com zoom de 200% num celular comum (195 px de largura), a página inicial, o cadastro, o painel e as Dicas não rolam
  mais para o lado. Linhas de aparelho quebram em vez de esconder o contador.

**Técnico**
- Grades com `minmax(0,1fr)`, `flex-wrap` e `max-w-full`; abaixo de 22rem, `overflow-wrap: anywhere` e o "…" vira quebra
  de linha. Esqueleto da `Casca` com `gap` (HIS-116). e2e `zoom.spec.ts` a 320 e 195 px em 8 rotas.

## 2026-11-25 · "Não sei qual é o meu aparelho"

**Para quem usa**
- Quem não conhece termos como potência, BTU ou inverter monta a casa pelo que vê: perguntas com desenhos ("Onde ele
  fica?", "Tem a palavra INVERTER escrita?") e sempre com "Não sei". Se não der para saber o modelo, o site mostra uma
  faixa ("Fica entre R$ X e R$ Y por mês"), usa o valor mais comum e diz onde olhar no aparelho. Vale para ar-condicionado,
  geladeira, TV, ventilador, máquina de lavar, micro-ondas e chuveiro (este só com a faixa).

**Técnico**
- Regras locais em `@ee/core/reconhecer` (`GUIAS_VISUAIS`, `reconhecer`, `faixaDeConsumo`), sem IA e sem rede; flag
  `guiaVisual` no catálogo. Desenhos em SVG de traço (`ui/aparelho/Desenhos`). As perguntas baixam só ao tocar
  (~4,2 kB gzip). O lint passa a aceitar `import("./Nome")` da mesma pasta, e nada além disso.

## 2026-11-24 · Visual limpo: painel em blocos

**Para quem usa**
- Visual mais limpo, no estilo dos apps de celular, mantendo o verde e a etiqueta do INMETRO. O painel mostra a conta
  grande e quatro blocos (meta, preço da luz, quem gasta mais, melhor dica); a página no celular ficou cerca de 1/4 mais
  curta. O Mês a mês usa a largura toda, com média por mês, preço médio do kWh e última conta. Dicas em cartões curtos,
  com "Como fazer" fechado.

**Técnico**
- Tokens `--color-fundo: #f2f2f7` e `--color-separador`; `ui/BlocoDeResumo`; grade do painel por áreas;
  `mediaDasContas` no core. A ordem do código continua a do celular. Peso: +1,4 kB gzip na /casa (registrado).

## 2026-11-24 · Meta de gasto: "quero pagar até R$ X" (HIS-104)

**Para quem usa**
- "Sua meta" no painel: escreva quanto quer pagar e veja se já está dentro, quanto falta e quais dicas ajudam. Se a meta
  for menor que o mínimo da ligação, o site avisa. Sem conta de luz, ele diz "ajudam", nunca "chegam lá".
- Iluminação pública: campo opcional em Minha casa. A taxa entra na conta estimada e sai do preço do kWh.

**Técnico**
- `avaliarMeta` em `@ee/core/meta` (escolha gulosa, sem contar a mesma economia duas vezes; casos C1–C14). Casa salva na
  versão 3 (`metaMensal`), com migração das versões 1 e 2. e2e `meta.spec.ts`. Peso: +7,7 kB gzip na /casa (registrado).

## 2026-11-24 · Compartilhar e imprimir o resumo (HIS-105)

**Para quem usa**
- No Acompanhamento, **Compartilhar resumo** abre o compartilhar do celular com um texto curto (estimativa, quem mais
  gasta, próxima dica), sem cidade nem nome. Sem esse recurso, vira **Copiar resumo**. **Imprimir** gera uma folha em
  preto e branco.

**Técnico**
- Texto por função pura com teste; impressão só com CSS (`@media print`). Nada passa por servidor. A #31 devolveu a
  chave do `@media print` perdida num conflito, que travava o deploy na Vercel.

## 2026-11-24 · Letra maior e mais contraste (HIS-102)

**Para quem usa**
- "Letra maior" (texto a 125%) e "Mais contraste" em Minha casa; "Letra maior" também no topo do cadastro. A escolha
  fica neste celular, e "Apagar todos os meus dados" apaga junto.

**Técnico**
- Chave própria no `localStorage`, lida e validada na fronteira; script de uma linha no `<head>` aplica antes da primeira
  pintura (ignora texto com mais de 200 caracteres). Nomes longos quebram a linha em vez de cortar.

## 2026-11-24 · CSP barra atributos de evento (HIS-117)

**Técnico**
- `script-src-attr 'none'` na CSP: fecha o caminho mais comum de XSS (`<img onerror=…>`). O `'unsafe-inline'` do
  `script-src` fica, com comentário (o Next põe scripts inline que mudam por página; nonce fica para quando houver login,
  com ADR). e2e `csp.spec.ts` em 8 rotas.

## 2026-11-17 · Guia da Tarifa Social (HIS-103)

**Para quem usa**
- Página nova `/tarifa-social`: 6 perguntas, uma por vez, dizem se a família **pode ter direito** à Tarifa Social ou ao
  Desconto Social, com documentos, onde pedir (CRAS e distribuidora) e o que fazer se o desconto não vier. Nada é
  guardado nem enviado.
- (HIS-103a, 13/11) Os textos da Tarifa Social deixaram de prometer mais do que o site faz: o Desconto Social não é
  calculado, os 80 kWh são de energia (impostos e iluminação podem continuar) e o desconto só é automático com o
  CadÚnico em dia e a conta no nome de alguém da família.

**Técnico**
- Regra pura em `@ee/core/tarifa-social`, com teste para os 13 casos do domínio; salário mínimo com fonte e vigência
  (fora dela, o resultado vira "confira no CRAS"). Página estática, só `useState`.

## 2026-11-17 · Campos com limite e "Confere?" (HIS-003b)

**Para quem usa**
- Os campos de número (conta, leitura, potência, minutos, quantidade) têm limite, e um valor estranho pergunta
  "Confere?" antes de salvar. Acabou o falso "Conta salva" em Minha casa.

**Técnico**
- Limites e textos no `@ee/core` (`limites.ts`), com fonte e teste; a tela confere antes de chamar o store.
- Junto: Next.js 16.4.6 (a 16.4.3 tinha falha de segurança e travava o build, #20), TypeScript 6.0.3 e lockfile
  consertado (#23), e a animação perdida ao terminar o cadastro (DEF-002b-1, #22: `router.prefetch("/casa")` na revisão).

## 2026-11-13 · Layout para computador (HIS-112)

**Para quem usa**
- No computador (janela de 1024 px ou mais), as telas aproveitam a largura em vez de ficarem numa coluna estreita no meio.
- Na tela da casa, a conta fica em cima, com a explicação ao lado; embaixo, os cômodos de um lado e "Quem mais gasta" e a
  dica de economia do outro.
- Em Cômodos, a lista fica à esquerda e o cômodo aberto à direita. Trocar de cômodo não leva você para o alto da página.
- Em Dicas, as dicas ficam em colunas e o resumo do plano fica ao lado. Em Minha casa, "Seus dados" fica ao lado das
  outras opções.
- No cadastro, ao lado de cada pergunta aparece "Por que perguntamos", só com a explicação. Nada essencial fica só nele.
- No celular nada mudou.

**Técnico**
- Só CSS com classes `lg:` (64rem) e container de 75rem na `Casca` e no `Cadastro`; a ordem do JSX e do foco não muda.
  Nova utilidade `lateral-fixa` em `globals.css`. Nenhuma dependência nova.
- `ui/telaLarga.ts` (`useTelaLarga`, `useSyncExternalStore`) só para `/casa/comodos`: `ConteudoDoComodo` (miolo comum) e
  `ComodosNoComputador` (lista e painel). Textos do painel em `cadastro/porQuePerguntamos.ts`.
- A lateral da `/casa` não usa `lateral-fixa`, e o "Mês a mês" ficou sob os cômodos (A-112-1).
- Testes: `layout-computador.spec.ts` e o helper `abrirComodo`. 390 e 800 px com 0 pixel de diferença contra o `main`.
  Peso: 11a até +1 998 B na `/casa/comodos` e +694 B nas outras; 11b até +3 143 B (tetos 2 048, 1 024 e 4 096 B).

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

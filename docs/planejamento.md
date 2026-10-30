# Planejamento do Eficiência Energética

Documento vivo, mantido pelo `scrum-master`. Ele diz **para onde o produto vai**, **em que ordem** e **por quê**.
O detalhe de cada história fica em `docs/equipe/historias/`; o andamento da sprint, em `docs/equipe/quadro.md`.

## 1. Visão

> Toda família, mesmo com celular simples e internet fraca, sabe quanto cada aparelho custa na conta de luz
> e o que fazer para pagar menos — de graça, sem cadastro e sem entregar dados pessoais.

### Princípios que não mudam

1. **Gratuito para sempre** para quem usa. Nada essencial atrás de pagamento ou conta.
2. **Linguagem simples** e dinheiro em R$ primeiro.
3. **Leve**: funciona em 3G, tela de 360 px e, no futuro, sem internet.
4. **Acessível**: WCAG 2.2 AA, letra grande, leitor de tela, teclado, movimento reduzido.
5. **Privado**: dado mínimo, tudo no aparelho por padrão, LGPD em tudo que sair dele.
6. **Honesto**: estimativa é chamada de estimativa; todo número tem fonte oficial.
7. **Custo zero de operação** enquanto for possível (planos gratuitos de Vercel, GitHub Actions e Supabase).

### Como saber se está dando certo

| Indicador | Como medir (sem rastrear a pessoa) | Meta inicial |
| --- | --- | --- |
| Cadastro concluído | contagem anônima opcional (E4) | 70% de quem começa |
| Tempo até o primeiro resultado | teste com pessoas reais (E1) | menos de 3 minutos |
| Dicas colocadas no plano | contagem anônima opcional | 1 ou mais por casa |
| Desempenho | Lighthouse no celular | 90+ em desempenho e acessibilidade |
| Peso da página inicial | build | menos de 200 kB de JS na primeira carga |
| Dados atualizados | rotina diária | 100% dos dias com dados válidos |

## 2. Equipe e processo

A equipe são 10 agentes especialistas em `.claude/agents/` (ver `docs/equipe/processo.md`):
`scrum-master`, `tech-lead`, `dominio-energia`, `ux-acessibilidade`, `frontend`, `backend`, `mobile`, `qa`, `seguranca`
e `documentacao`. Quem orquestra faz o papel de gerente de entrega.

Cada história passa por: refinamento → regras e desenho (energia + UX) → desenho técnico + ameaças → implementação →
QA → revisão de segurança → code review → documentação → Pronto. A conversa entre os agentes acontece na própria história.

## 3. Arquitetura alvo

Detalhes em `docs/arquitetura.md` e no ADR-001.

```
apps/web/src/app/               rotas finas
apps/web/src/funcionalidades/   cadastro, inicio, acompanhamento, comodos, dicas, ajustes, conta-de-luz...
apps/web/src/ui/                componentes genéricos
apps/web/src/aplicacao/         casos de uso (useResumo, usePlano...)
apps/web/src/infraestrutura/    dados públicos, armazenamento local, Supabase (depois)
apps/web/src/config/            recursos ligáveis e constantes
packages/core/                  domínio puro e testado
packages/dados/                 rotina diária ANEEL/IBGE
apps/mobile/                    app Expo (E7)
supabase/                       migrações, políticas RLS, funções (E4)
```

## 4. Épicos e histórias

Tamanho: **P** (até 1 dia), **M** (2–3 dias), **G** (uma semana — quebrar se possível).
Os papéis listados são os principais; QA, segurança, tech lead e documentação revisam todas.

### E0 · Fundação (Sprint 0) — prepara o terreno para crescer sem quebrar

| ID | História | Papéis | Tam. |
| --- | --- | --- | --- |
| HIS-001 | ✅ Reorganizar o site em camadas (`funcionalidades/`, `ui/`, `aplicacao/`, `infraestrutura/`) sem mudar nada para quem usa | tech-lead, frontend | M |
| HIS-002a | Testes no navegador no CI: fluxo principal com Playwright em 390 e 1280 px, axe nas páginas principais, artefatos do job e peso de JS com referência (critérios 2, 3, 4, 6, 9 da HIS-002; arquivo `HIS-002-qualidade-automatica.md`) | qa, tech-lead | M |
| HIS-002b | Lint e camadas no CI: ESLint (config do Next 16), matriz de camadas no lint, casos negativos automáticos, regra S2 e ordem dos imports (critérios 1, 5, 7, 8 + T1 da HIS-002). Depende da HIS-002a | tech-lead, frontend, seguranca | M |
| HIS-003a | Dados quebrados não travam o site: leitores da casa salva e dos JSON públicos no `@ee/core` (sem zod, ADR-004), `limites.ts`, avisos de dado descartado e de falha de carga, telas de erro e 404, cabeçalhos HTTP (CSP, HSTS...), `pnpm audit` e Dependabot no CI, `atualizar-dados.yml` em dois jobs, `.env.example` (critérios 1–4, 6, 7 e o 5 no domínio da HIS-003; arquivo `HIS-003-base-de-seguranca.md`). Depende da HIS-002a | seguranca, backend, frontend | M |
| HIS-003b | Campos com limite e "Confere?": mensagem de campo fora do limite (T5), pergunta para valor raro (T6) e aviso de consumo alto da casa; sai o corte escondido de 30.000 W (critério 5 nas telas + critério 8). Depende da HIS-003a | frontend, ux, qa | M |
| HIS-004 | ✅ Retirar menção a instituição de ensino e reservar espaços para parceiros (desligados) | — | P |

Critérios gerais da E0: nenhuma mudança visível para quem usa (exceto a tela de erro), CI verde, tudo documentado.

### E1 · Inclusão — para quem tem mais dificuldade

| ID | História | Papéis | Tam. |
| --- | --- | --- | --- |
| HIS-101 | Ouvir a tela: botão "Ouvir" que lê o resumo e as dicas em voz alta (Web Speech API, sem servidor) | ux, frontend | M |
| HIS-102 | Letra maior e alto contraste, escolhidos em Ajustes e lembrados no aparelho | ux, frontend | P |
| HIS-103 | Guia da Tarifa Social: quem tem direito, documentos, onde ir (CRAS, distribuidora), com perguntas simples de "você pode ter direito" | dominio-energia, ux, frontend | M |
| HIS-104 | Meta de gasto: "quero pagar até R$ X" e o painel mostra o quanto falta e quais dicas chegam lá | dominio-energia, frontend | M |
| HIS-105 | Compartilhar e imprimir o resumo (Web Share, página de impressão leve), sem enviar dado a servidor | ux, frontend | P |
| HIS-106 | Teste com pessoas reais (5 famílias): roteiro, observação, ajustes de texto | ux, scrum-master | M |
| HIS-107 | Zoom de 200% sem rolagem para o lado (WCAG 1.4.10): em 390 px, `/` (254 px de conteúdo em 195), `/casa` e `/casa/dicas` (211 px) rolam na horizontal e, no `/casa`, números e nomes quebram palavra a palavra (achado P2 do qa na HIS-001, médio, igual antes da HIS-001) | ux, frontend | M |
| HIS-108 | Foco e rolagem: (P1) no passo "cidade" do cadastro o foco começa na busca e pula para o título entre 300 e 600 ms — quem digita logo perde o foco e o leitor de tela anuncia duas coisas; (P3) pelo link do acompanhamento o cômodo abre, mas não fica alinhado ao topo como na entrada direta (`#comodo-<id>`); (P4, conferir) com o diálogo aberto, 1 em 25 Tabs leva o foco para fora do `<dialog>` (achados do qa na HIS-001, baixos, iguais antes da HIS-001) | ux, frontend | P |
| HIS-109 | Efeitos que copiam estado (dívida técnica vinda da HIS-002b): 8 lugares fazem `setState` dentro de `useEffect` (`funcionalidades/comodos/TelaComodos.tsx` ×3, `infraestrutura/armazenamento/casa.ts`, `infraestrutura/dados-publicos/navegador.ts`, `ui/Movimento.tsx` ×2, `ui/aparelho/EditorAparelho.tsx`) e a tela renderiza de novo logo depois de abrir — trabalho a mais no celular simples. **Pronto quando:** `grep -rn "HIS-109" apps/web/src` não acha nada; `pnpm lint` passa com `react-hooks/set-state-in-effect` ligada e sem `eslint-disable` dela; o e2e e o peso de JS da HIS-002a passam sem mudar nenhum teste; capturas em 390 e 1280 px de cada tela tocada iguais às de antes (feitas pelo qa) | frontend, tech-lead | M |
| HIS-110 | Contraste das cores padrão: na casa ilustrada da `/`, a pílula de porcentagem tem texto branco em laranja (`bg-faixa-d`, #ec7a1a) a 2,85:1, abaixo do mínimo de 4,5:1 (WCAG 1.4.3, AA) — quem enxerga pouco ou usa o celular no sol não lê quanto cada cômodo pesa (achado do axe no desenho da HIS-002, D10; igual antes). **Correção proposta (ux, 2026-10-29):** na faixa D, trocar o texto branco por `text-tinta` (o laranja da etiqueta fica, nenhum token novo): luminância relativa faixa-d #ec7a1a = 0,3183, tinta #13233f = 0,0170, branco = 1 → tinta (0,3183 + 0,05) / (0,0170 + 0,05) = **5,50:1** (passa); branco hoje (1 + 0,05) / (0,3183 + 0,05) = 2,85:1 (não passa). Regra para texto sobre cor de faixa, a ficar junto das cores em `ui/Etiqueta.tsx`: **A e E com branco** (4,72:1 e 5,21:1; com tinta dariam 3,32 e 3,01, abaixo de 4,5), **B, C e D com tinta** (5,80, 8,45 e 5,50:1; com branco 2,70, 1,85 e 2,85, abaixo de 4,5). Hoje só a pílula da casa ilustrada põe texto sobre faixa (as barras do painel e da etiqueta não têm texto dentro); a pílula ainda usa a sua própria escala (`corDaParte`, que pula a faixa B) em vez de `faixaDoPeso` — alinhar as duas muda a cor da Lavanderia (5%) de A para B e fica a critério do scrum-master, mas, se mudar, B leva tinta. **Ponto a decidir pelo scrum-master antes de a HIS-110 começar** (registrado pelo tech-lead em 2026-10-30, a partir da nota da ux na HIS-002a; não entra na HIS-002a porque muda o que a pessoa vê): (a) manter `corDaParte` e só trocar o texto da faixa D para `text-tinta`; ou (b) a pílula passa a usar `faixaDoPeso` de `ui/Etiqueta.tsx` — uma escala só no site, Lavanderia de A para B (com tinta). Se (b), decidir também se entra junto a dívida da HIS-001 "levar `faixaDoPeso` e a escala da `CasaIlustrada` para `@ee/core`, com teste" (com `dominio-energia` se a escala tiver número com fonte). Inclui toda outra `color-contrast` que o qa achar no passo A5 da HIS-002a. **Achadas no A5 (qa, 2026-10-30):** além das pílulas de Quarto e Cozinha, os dois `<dd>` com `text-white/85` sobre `bg-white/10` nos cartões "Tarifa Social" e "Desconto Social" da `/` (sem e com casa, 390 e 1280 px) — 4 entradas por estado em `apps/web/e2e/excecoes-axe.ts`, todas com `historia: "HIS-110"`; a ux trata as quatro juntas. **Pronto quando:** o axe da HIS-002a, nas 7 páginas, sem e com casa, em 390 e 1280 px, não acusa `color-contrast`; `excecoes-axe.ts` não tem entrada com `HIS-110`; a ux aprova a cor nova, conferindo também as outras cores de faixa que levam texto branco; capturas 390 e 1280 px. Depende da HIS-002a | ux, frontend | P |

### E2 · Precisão da conta — chegar mais perto do valor real

| ID | História | Papéis | Tam. |
| --- | --- | --- | --- |
| HIS-201 | Conta detalhada: separar energia, bandeira e consumo mínimo na tela, com "como calculamos" | dominio-energia, ux, frontend | M |
| HIS-202 | Impostos: ICMS por estado (alíquota e faixas de isenção), PIS/COFINS médio por distribuidora e iluminação pública como estimativa, com fontes | dominio-energia, backend | G |
| HIS-203 | Percentual do Desconto Social por distribuidora (quando a ANEEL publicar) | dominio-energia, backend | M |
| HIS-204 | Comparar com a Tarifa Branca: mostrar se compensaria pelo horário de uso dos aparelhos | dominio-energia, backend, frontend | G |
| HIS-205 | Mais nomes comerciais de distribuidoras e permissionárias | backend | P |
| HIS-111 | Tarifas vencidas: em 227 cidades o site usa o preço de uma distribuidora que já não existe, e a conta sai de 11% a 55% menor. Índice por CNPJ, tabela de sucessões com ato oficial, conjunto extinto, tarifa vencida há mais de 6 meses fora, barreiras na rotina e `substituidas` para quem já salvou a casa (ADR-005). **Defeito: entra na Sprint 0, prioridade 1** | backend, dominio-energia, qa | M |

### E3 · Funciona sem internet

| ID | História | Papéis | Tam. |
| --- | --- | --- | --- |
| HIS-301 | PWA offline com Serwist: páginas e dados da casa disponíveis sem internet; dados de tarifa em cache | frontend, tech-lead | M |
| HIS-302 | Guia "Instalar no celular" (Android e iPhone) com passo a passo e botão de instalar quando o navegador permitir | ux, frontend | P |
| HIS-303 | Aviso de "sem internet" e de "tarifa de X dias atrás" | ux, frontend | P |

### E4 · Plataforma — conta opcional, sincronização e lembretes

| ID | História | Papéis | Tam. |
| --- | --- | --- | --- |
| HIS-401 | Supabase: projeto, migrações, tabelas espelhando `@ee/core`, RLS em todas, testes de RLS | backend, seguranca | G |
| HIS-402 | Conta opcional sem senha (link mágico e Google), com explicação clara de para que serve | backend, ux, frontend | M |
| HIS-403 | Sincronização: enviar os dados locais na criação da conta e manter sincronizado entre aparelhos | backend, frontend | G |
| HIS-404 | LGPD: exportar meus dados (JSON), apagar tudo (local e servidor), política de privacidade simples | seguranca, backend, documentacao | M |
| HIS-405 | Métricas anônimas opcionais (contagens agregadas, sem identificador, só com "sim") | backend, seguranca | M |
| HIS-406 | Lembretes por Web Push: "registre a conta deste mês" e "a bandeira mudou" (opt-in) | backend, frontend | M |

### E5 · Ler a conta pela câmera

| ID | História | Papéis | Tam. |
| --- | --- | --- | --- |
| HIS-501 | Foto da conta → OCR no próprio aparelho (tesseract.js, carregado só quando usado) → sugerir kWh, valor e mês para a pessoa confirmar | frontend, dominio-energia, seguranca | G |
| HIS-502 | Modelos de leitura por distribuidora (onde fica o kWh na conta de cada uma) | dominio-energia, frontend | M |

A imagem **nunca** sai do aparelho.

### E6 · Engajamento — motivar a economizar

| ID | História | Papéis | Tam. |
| --- | --- | --- | --- |
| HIS-601 | Comparar com casas parecidas: consumo médio residencial do estado (EPE) por número de pessoas | dominio-energia, frontend | M |
| HIS-602 | "Vale a pena trocar?": quanto custa trocar um aparelho e em quantos meses se paga | dominio-energia, frontend | M |
| HIS-603 | Conquistas simples: mês com conta menor, dica cumprida (sem ranking entre pessoas) | ux, frontend | P |

### E7 · Aplicativo de celular

| ID | História | Papéis | Tam. |
| --- | --- | --- | --- |
| HIS-701 | App Expo em `apps/mobile` com cadastro, acompanhamento, cômodos e dicas usando `@ee/core` | mobile, tech-lead | G |
| HIS-702 | Notificações nativas e câmera (reaproveitando E4 e E5) | mobile | M |
| HIS-703 | Publicação no Google Play (custo único da conta de desenvolvedor) | mobile, scrum-master | M |

### E8 · Painel para CRAS e ONGs (futuro)

| ID | História | Papéis | Tam. |
| --- | --- | --- | --- |
| HIS-801 | Perfil de agente social que ajuda uma família a cadastrar a casa no aparelho dela | ux, backend, seguranca | G |
| HIS-802 | Relatório agregado e anônimo por bairro/cidade, com consentimento e RIPD (relatório de impacto LGPD) | backend, seguranca, documentacao | G |

### E9 · Medidor de verdade (futuro)

| ID | História | Papéis | Tam. |
| --- | --- | --- | --- |
| HIS-901 | Guia e integração com medidor caseiro (ESP32 + sensor SCT-013) ou tomadas inteligentes (Shelly) | backend, dominio-energia, seguranca | G |

### E10 · Simulador de energia solar (futuro)

| ID | História | Papéis | Tam. |
| --- | --- | --- | --- |
| HIS-1001 | Estimar geração por cidade (irradiação CRESESB/INPE), custo e retorno pelas regras da Lei 14.300/2022 | dominio-energia, frontend | G |

### E11 · Espaços reservados para parceiros (futuro, interno)

Regras em `docs/equipe/espacos-reservados.md` e ADR-002. Estão **desligados** e não aparecem no site.
Antes de ligar: troca do plano da hospedagem (o plano gratuito da Vercel é só para uso não comercial), política de privacidade
atualizada, consentimento para qualquer rastreamento e revisão de `seguranca` e `ux-acessibilidade`.

## 5. Roteiro de sprints (sprints de 1 semana)

| Sprint | Foco | Histórias |
| --- | --- | --- |
| 0 | Fundação | HIS-001, HIS-111 (defeito, prioridade 1), HIS-002a, HIS-002b, HIS-003a, HIS-003b |
| 1 | Inclusão I | HIS-110, HIS-107, HIS-102, HIS-103 |
| 2 | Precisão I | HIS-201, HIS-205, HIS-104 |
| 3 | Offline | HIS-109, HIS-301, HIS-302, HIS-303 |
| 4 | Inclusão II | HIS-108, HIS-101, HIS-105, HIS-106 |
| 5 | Precisão II | HIS-202, HIS-203 |
| 6–7 | Plataforma | HIS-401 a HIS-406 |
| 8 | Câmera | HIS-501, HIS-502 |
| 9 | Engajamento | HIS-601, HIS-602, HIS-603 |
| 10–11 | App | HIS-701 a HIS-703 |
| depois | E8, E9, E10, E11, HIS-204 | conforme prioridade |

A ordem pode mudar depois de cada retrospectiva; a Sprint 0 vem sempre primeiro.

_Revisão de 2026-10-29 (fim da HIS-001):_ a **HIS-107** (zoom de 200%, médio, WCAG 1.4.10) entra na Sprint 1 **antes**
da HIS-102, porque letra maior agrava o mesmo problema de conteúdo que não cabe na tela. A **HIS-108** (foco e rolagem,
baixo) vai para a Sprint 4, **antes** do teste com famílias (HIS-106), para o foco que pula não atrapalhar quem usa
leitor de tela. A HIS-105 (compartilhar) sai da Sprint 1 para a Sprint 4; se a Sprint 4 não couber, ela é a primeira a
passar para a seguinte (menor impacto na conta que as outras).

_Revisão de 2026-10-29 (desenho da HIS-002):_ a HIS-002 (≈ 4 dias no desenho) foi **dividida** em HIS-002a (navegador)
e HIS-002b (lint e camadas), nessa ordem. A Sprint 0 só fecha com as duas e a HIS-003 (fundação antes de função nova);
se passar de uma semana, a Sprint 1 começa depois, sem cortar a HIS-003. A **HIS-110** (contraste das cores padrão,
defeito de acessibilidade na página inicial) é a **primeira da Sprint 1** e pode até entrar antes, assim que a
HIS-002a estiver no `main`, se houver frontend e ux livres — é correção de defeito, não função nova. Se a Sprint 1 não
couber, quem passa para a seguinte é a **HIS-102** (modo opcional), não a HIS-103 (Tarifa Social, a de maior impacto
na conta). A **HIS-109** (efeitos que copiam estado) vai para a Sprint 3, **antes** da HIS-301, porque o PWA mexe em
dois dos oito lugares (`armazenamento/casa.ts` e `dados-publicos/navegador.ts`).

_Revisão de 2026-10-30 (desenho da HIS-003):_ a HIS-003 (≈ 3,75 dias no desenho) foi **dividida** em HIS-003a (dados
quebrados, telas de erro, cabeçalhos e CI, ≈ 3 dias) e HIS-003b (campos com limite e "Confere?", ≈ 1,5 dia). Ordem da
Sprint 0: HIS-002a → HIS-003a e HIS-002b em paralelo (branches separadas, integradas uma de cada vez; se ficarem
prontas juntas, a 003a entra antes) → HIS-003b. A Sprint 0 só fecha com as cinco; a 003b não sai da Sprint 0 porque o
corte escondido em 30.000 W e o "135.90" lido como R$ 13.590 dão conta errada para a família. O aviso "não deu para
salvar" (memória do navegador cheia, risco 6 do D9 da 003a) fica no backlog, sem sprint.

_Revisão de 2026-10-30 (HIS-111):_ a **HIS-111** (tarifas vencidas, épico E2) entra na **Sprint 0 com prioridade 1**.
Em 227 cidades a conta mostrada sai de 11% a 55% menor do que a real. Ela é correção de defeito, não função nova, e usa
o backend, que está livre. Começa já, em paralelo com o fim da 002a. O a3 da 003a vem depois dela, mas não espera se ela
travar no passo 0 (o rebase custa ≈ 30 min). É um corte só, porque as sucessões já estão confirmadas. A Sprint 0 fecha
com seis histórias; se passar de uma semana, a Sprint 1 começa depois.

## 6. Riscos

| Risco | Impacto | Como reduzir |
| --- | --- | --- |
| ANEEL muda formato ou sai do ar | dados velhos ou errados | validação na rotina, manter último arquivo bom, alerta na Action, testes com fixtures |
| Regra do setor muda (ex.: Tarifa Social 2025) | número errado | `dominio-energia` revisa fontes a cada sprint; datas de consulta no código |
| Dado de pessoa vazar | dano à família e ao projeto | dado mínimo, RLS testada, revisão de segurança obrigatória, sem dado pessoal por padrão |
| Site quebrar com dado antigo salvo | pessoa perde a casa | `version` + `migrate` testados, validação com zod, tela de erro com opção de recuperar |
| Custos aparecerem | projeto deixa de ser gratuito | ficar nos planos gratuitos, medir uso, avisar antes de qualquer custo |
| Página pesada | não abre em celular simples | orçamento de peso no CI, carregar OCR/recursos grandes só quando usados |
| Interface confusa | pessoa desiste | testes com famílias reais (HIS-106), UX revisa todo texto |

## 7. Custos (para manter gratuito)

| Serviço | Plano | Observação |
| --- | --- | --- |
| GitHub (código, Actions) | gratuito | repositório público tem Actions sem limite de minutos |
| Vercel (site) | Hobby, gratuito | uso não comercial; trocar de plano antes de ligar parceiros |
| Supabase (E4) | Free | projeto pausa após uma semana sem uso; limites de banco e usuários ativos |
| Google Play (E7) | taxa única | pagar só quando o app estiver pronto |
| Domínio | opcional | ~R$ 40/ano para `.com.br` |

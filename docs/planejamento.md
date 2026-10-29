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
| HIS-001 | Reorganizar o site em camadas (`funcionalidades/`, `ui/`, `aplicacao/`, `infraestrutura/`) sem mudar nada para quem usa | tech-lead, frontend | M |
| HIS-002 | Qualidade automática: ESLint (config do Next 16), testes de ponta a ponta com Playwright e verificação de acessibilidade com axe no CI | qa, tech-lead | M |
| HIS-003 | Base de segurança: cabeçalhos HTTP (CSP, HSTS...), validação com zod do localStorage e dos JSON públicos, tela de erro amigável, `pnpm audit` e Dependabot no CI, `.env.example` | seguranca, frontend | M |
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

### E2 · Precisão da conta — chegar mais perto do valor real

| ID | História | Papéis | Tam. |
| --- | --- | --- | --- |
| HIS-201 | Conta detalhada: separar energia, bandeira e consumo mínimo na tela, com "como calculamos" | dominio-energia, ux, frontend | M |
| HIS-202 | Impostos: ICMS por estado (alíquota e faixas de isenção), PIS/COFINS médio por distribuidora e iluminação pública como estimativa, com fontes | dominio-energia, backend | G |
| HIS-203 | Percentual do Desconto Social por distribuidora (quando a ANEEL publicar) | dominio-energia, backend | M |
| HIS-204 | Comparar com a Tarifa Branca: mostrar se compensaria pelo horário de uso dos aparelhos | dominio-energia, backend, frontend | G |
| HIS-205 | Mais nomes comerciais de distribuidoras e permissionárias | backend | P |

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
| 0 | Fundação | HIS-001, HIS-002, HIS-003 |
| 1 | Inclusão I | HIS-102, HIS-103, HIS-105 |
| 2 | Precisão I | HIS-201, HIS-205, HIS-104 |
| 3 | Offline | HIS-301, HIS-302, HIS-303 |
| 4 | Inclusão II | HIS-101, HIS-106 |
| 5 | Precisão II | HIS-202, HIS-203 |
| 6–7 | Plataforma | HIS-401 a HIS-406 |
| 8 | Câmera | HIS-501, HIS-502 |
| 9 | Engajamento | HIS-601, HIS-602, HIS-603 |
| 10–11 | App | HIS-701 a HIS-703 |
| depois | E8, E9, E10, E11, HIS-204 | conforme prioridade |

A ordem pode mudar depois de cada retrospectiva; a Sprint 0 vem sempre primeiro.

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

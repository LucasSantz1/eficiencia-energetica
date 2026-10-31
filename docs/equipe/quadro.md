# Quadro da sprint

## Sprint 0 · Fundação

**Objetivo:** deixar o código organizado em camadas, testado automaticamente e protegido, sem mudar nada para quem usa.
A única mudança visível de propósito é a correção da HIS-111 (conta errada em 227 cidades).

| História | Status | Etapa atual | Próximo papel |
| --- | --- | --- | --- |
| [HIS-001 · Camadas](historias/HIS-001-camadas.md) | Pronto | Definição de Pronto conferida (etapa 9) | — (quem orquestra integra ao `main`) |
| [HIS-002a · Testes no navegador no CI](historias/HIS-002-qualidade-automatica.md) | **Pronto** (ressalva Ra9) | Definição de Pronto conferida (etapa 9, 2026-10-30) | quem orquestra integra ao `main`; o dono confere o artefato (Ra9) e marca os 2 checks como obrigatórios; tabela de peso do runner (D14) |
| [HIS-002b · Lint e camadas no CI](historias/HIS-002b-lint-e-camadas.md) | Preparada | etapa 3 concluída: ameaças, 21 casos e D6 revisados; decisões do tech-lead no D16 (2026-10-30) | etapa 4 (frontend com o tech-lead) **só depois** da HIS-002a no `main` |
| [HIS-003a · Dados quebrados não travam o site](historias/HIS-003-base-de-seguranca.md) | Preparada | desenho técnico pronto (D1–D9): sem zod, leitores no `@ee/core` (ADR-004 proposto); quebra aceita (P-tl-3, 2026-10-30); ≈ 3 dias | seguranca (P-tl-1, bloqueia a2) ‖ dominio-energia (P-tl-2, bloqueia a3); etapa 4 (backend a1–a3, a6; frontend a4–a5; qa a7) depois da 002a no `main`, **em paralelo com a 002b** |
| [HIS-003b · Campos com limite e "Confere?"](historias/HIS-003b-campos-com-limite.md) | Preparada | textos (T5, T6) e desenho prontos; critério 8 (T6) novo; ≈ 1,5 dia | qa ("Plano de testes"); etapa 4 (frontend b1–b2, qa b3) **só depois** da 003a no `main` |
| HIS-004 · Sem menção a instituição; espaços reservados | Pronto | — | — |
| [HIS-111 · Tarifas vencidas (número errado no ar)](historias/HIS-111-tarifas-vencidas.md) | Preparada · **prioridade 1** | regras e desenho prontos (T1–T7); critérios do T5 aplicados, mais o 12 (V7) e o 13 (Pronto depois do h8); um corte só; ≈ 3 dias; branch própria saindo do `main`, **já**, em paralelo com o fim da 002a | **seguranca** (workflow do T3, V8; bloqueia o h0) ‖ ux (aviso do D7; bloqueia só o h6) → backend h0–h5 (o 1º push roda o passo 0; quem orquestra cola o resumo) → frontend h6 → qa h7 → etapas 6–9 → h8 (quem orquestra + backend + qa) |

Ordem (scrum-master, 2026-10-30): HIS-001 → **HIS-002a ‖ HIS-111** → **HIS-003a ‖ HIS-002b** → **HIS-003b**.
- **HIS-111 primeiro na prioridade** (revisão de 2026-10-30): número errado no ar em 227 cidades. É correção de
  defeito e usa o backend, que está livre; não depende da 002a. O a3 da 003a vem depois dela, mas **não espera** se
  ela travar no passo 0: quem chegar depois faz o rebase (≈ 30 min, T7). Se ficar pronta junto com outra, entra
  primeiro no `main`.
- 002a primeiro: a 002b e a 003a usam o e2e, a fixture e o `ci.yml` dela.
- 003a e 002b em paralelo, em branches separadas: a 003a não muda o lockfile, e o conflito é uma linha do `ci.yml`
  mais o `useArquivo`/`casa.ts` (D4 da 003a). Integra uma de cada vez; quem chega depois faz o rebase e passa no lint
  e no e2e da outra. Se as duas ficarem prontas juntas, entra antes a **003a** (ameaças altas: site preso, tela branca).
- 003b depois da 003a no `main`: usa o `limites.ts`/`entrada.ts` (a1) e mexe nas telas do T2.

### O que pode rodar em paralelo agora (sem conflito)

| Papel | Onde escreve | Em paralelo com |
| --- | --- | --- |
| seguranca | "Ameaças" da HIS-002a; "Ameaças" + lista dos 21 casos e resposta da pergunta aberta da HIS-002b | qa, ux |
| qa | "Plano de testes" da HIS-002a (D9, D10) e da HIS-002b (D6) | seguranca, ux |
| ux-acessibilidade | "Fluxo e textos" e resposta da pergunta aberta da HIS-002a | seguranca, qa |

Regras para não pisar no colega: cada um só na sua seção; edição pontual, **nunca** reescrever o arquivo inteiro; reler
o arquivo antes de pôr a nota no fim da "Conversa da equipe"; quem compilar ou subir servidor usa cópia própria no
scratchpad e porta própria (retro da HIS-001). A implementação (etapa 4) **não** roda em paralelo entre 002a e 002b.

### Pendência do dono do projeto (quem orquestra leva)

- HIS-002a (ressalva Ra9 da seguranca): baixar o `relatorio-e2e` da execução vermelha do `32f2cff` numa pasta vazia e
  seguir o roteiro da nota da seguranca de 2026-10-30. Se aparecer algo, apagar o artefato e chamar a seguranca.
- Ao fechar a HIS-002a: marcar como **obrigatórios** na proteção do `main` (configurações do GitHub) os checks
  "Lint, tipos e testes" e "Navegador (e2e, axe e peso)". No fechamento da HIS-002b o scrum-master confere que
  continuam obrigatórios. Sem isso, um PR pode ser integrado com o e2e vermelho.

## Diário

- 2026-10-29 — sprint planejada; HIS-004 entregue junto com a criação da equipe.
- 2026-10-29 — HIS-001: desenho técnico pronto (tech-lead), pergunta aberta respondida, ADR-001 revisado; próximo: seguranca.
- 2026-10-29 — HIS-001: implementada (frontend), 8 commits; comparação do QA igual em tela, texto, DOM e casa salva; JS de `/casa` sem casa +1,4 KB em pergunta ao tech-lead; próximo: qa.
- 2026-10-29 — HIS-001: qa aprovou (etapa 5), seguranca aprovou com ressalvas baixas (etapa 6, S1/S2), tech-lead aprovou o code review (etapa 7); S1/S2 foram para a HIS-002 e P1–P4 do qa para o backlog (HIS-107, HIS-108); próximo: documentacao.
- 2026-10-29 — HIS-001: documentada (etapa 8): arquitetura, site, desenvolvimento, diagramas, roteiro, agente de UX e CHANGELOG com as camadas novas e o `pnpm camadas`; texto novo da nota "Estado atual" do `CLAUDE.md` proposto ao dono do projeto; próximo: scrum-master.
- 2026-10-29 — HIS-001: **Pronto** (etapa 9): todos os itens da Definição de Pronto com evidência; S1/S2/T1/T3 na HIS-002, HIS-107/HIS-108 no backlog (HIS-107 na Sprint 1, HIS-108 na Sprint 4); aprendizados na retro da Sprint 0. HIS-002 revista: continua Preparada, com esclarecimentos nos critérios 3 e 9 e pergunta à seguranca (lista dos 21 casos); próximo: tech-lead + seguranca (etapa 3 da HIS-002).
- 2026-10-29 — HIS-002: desenho técnico definitivo (tech-lead), medido numa cópia própria: ESLint 10.13.0 + `eslint-config-next` 16.4.3 + `import-x` 4.17.1 (o `import/order` quebra no ESLint 10), `@playwright/test` 1.63.0 (casa com o Chromium do ambiente) + `@axe-core/playwright` 4.14.0; e2e em todo PR e push no `main` (~4 min de parede); ADR-003 proposto; ≈ 4 dias → proposta de quebra em HIS-002a (2, 3, 4, 6, 9) e HIS-002b (1, 5, 7, 8); próximo: seguranca + qa, e scrum-master decide a quebra.
- 2026-10-29 — HIS-002: **quebra aceita** (scrum-master): HIS-002a (arquivo antigo, retitulado) e HIS-002b (novo, com critérios 1, 5, 7, 8, T1 e os 8 `eslint-disable` como critérios 10 e 11; D4–D7 e B1–B8 movidos). HIS-109 (efeitos que copiam estado) na Sprint 3, antes da HIS-301; HIS-110 (contraste das cores padrão da `/`) primeira da Sprint 1. Próximo: seguranca ‖ qa ‖ ux em paralelo; depois etapa 4 da 002a.
- 2026-10-30 — HIS-002: tech-lead decidiu as revisões (D16 nas duas): P-qa-1 a 8 e b1–b3 aceitos (P-qa-7 unida à Aa14: uma exceção do axe = um elemento; b3 na forma estrita, regra C10); actions do `ci.yml` por SHA já no A6 (majors novas: checkout v7, setup-node v7, upload-artifact v7, action-setup v6); Ra1–Ra13 nos passos; Ab3/Ab4/Ab6 no contrato da 002b. Estimativa 002a ≈ 2,75 dias, 002b ≈ 2–2,5. ADR-003 **aceito**. **HIS-002a liberada para a etapa 4** (qa + frontend). Ponto `corDaParte` × `faixaDoPeso` registrado na HIS-110 para o scrum-master.

- 2026-10-30 — HIS-003: desenho técnico pronto (tech-lead, D1–D9). Leitores escritos à mão no `@ee/core` em vez do zod (gzip: zod 93 kB, zod/mini 8,2 kB, à mão 1,3 kB; o zod testa `new Function`, que a CSP bloqueia); `storage` próprio + `merge` que valida, protótipo com o zustand 5.0.16 em 9 casos; formato salvo inalterado; `atualizar-dados.yml` em dois jobs com SHA; ≈ 3,75 dias → proposta 003a/003b; ADR-004 proposto. Próximo: seguranca (P-tl-1), dominio-energia (P-tl-2) e scrum-master (P-tl-3).
- 2026-10-30 — HIS-003: **quebra aceita** (scrum-master, P-tl-3): HIS-003a (arquivo antigo, retitulado; critérios 1–4, 6, 7 e o 5 no domínio, passos a1–a7) e HIS-003b (novo; critério 5 nas telas e critério 8 novo do T6, passos b1–b3). Ordem 002a → 003a ‖ 002b → 003b. Próximo: seguranca (P-tl-1) ‖ dominio-energia (P-tl-2) ‖ qa (plano da 003b).
- 2026-10-30 — HIS-111: desenho técnico (tech-lead, T1–T7) e ADR-005 proposto. D7 aprovado: `substituidas` opcional no `tarifas.json`; a troca fica no core, na leitura, e no `aplicacao/`, na regravação, não no leitor da casa; formato salvo igual. Passo 0 em `diagnosticar-dados.yml`, só leitura, roda no `push` da branch. Barreiras V1–V4, V7 e V8 sem `--forcar`. Recomendação: **HIS-111 antes do a3** (cerca de 30 min de rebase na 003a, contra dias de conta errada). Próximo: scrum-master.
- 2026-10-30 — HIS-111: **Sprint 0, prioridade 1, um corte só** (scrum-master). Começa já, em branch própria saindo do `main`, em paralelo com o fim da 002a; o a3 da 003a vem depois, mas não espera se ela travar. T5 aplicado (6 meses; V5 no critério 6; critério 5 com três casos; e2e do 8 no caso (h) do `casa-salva.spec.ts` da a7; teste dos publicados no h8). Critérios novos: 12 (V7, `--forcar`) e 13 (Pronto só depois do h8). Próximo: seguranca (bloqueia o h0) ‖ ux (D7).
- 2026-10-30 — HIS-002a: **Pronto** (etapa 9). qa, seguranca (ressalva baixa Ra9), tech-lead e ux aprovaram; documentação no `35f5e61`. Pendências que não bloqueiam: o dono confere o artefato (Ra9); a tabela de peso do runner (D14). A correção dos 2 `<dd>` (3,92:1 → `text-white`, 4,77:1) entrou na HIS-110. **HIS-206** criada (Nova Santa Rita, PI, × CERTAJA; suspeita no IndQual; Triunfo e Soledade, PB, parecidos) para o backlog, primeira da Sprint 2. Próximo: quem orquestra integra ao `main`; depois, etapa 4 da 003a ‖ 002b.

## Próximas (backlog priorizado)

1. HIS-110 Contraste das cores padrão (P; pode entrar assim que a HIS-002a estiver no `main`)
2. HIS-107 Zoom de 200% sem rolagem para o lado (antes da HIS-102: letra maior agrava o mesmo problema)
3. HIS-102 Letra maior e alto contraste (se a Sprint 1 não couber, é ela que passa, não a HIS-103)
4. HIS-103 Guia da Tarifa Social
5. HIS-206 Distribuidora de outro estado na cidade (Nova Santa Rita, PI, × CERTAJA; Sprint 2, depois da HIS-111 no `main`; dominio-energia + backend)
6. HIS-201 Conta detalhada
7. HIS-205 Nomes de distribuidoras
8. HIS-104 Meta de gasto
9. HIS-109 Efeitos que copiam estado (Sprint 3, antes da HIS-301)
10. HIS-108 Foco e rolagem (Sprint 4, antes do teste com famílias)
11. HIS-105 Compartilhar e imprimir (Sprint 4)

O backlog completo está em [`../planejamento.md`](../planejamento.md).

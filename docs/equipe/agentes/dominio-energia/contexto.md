# Contexto · Especialista em energia

## O que eu cuido

- Regras e números do domínio em `packages/core/src/`: `calculos.ts` (consumo, preço do kWh, conta, consumo mínimo,
  Tarifa Social), `catalogo.ts` (potências, variantes, fator de ciclo), `dicas.ts` (mudanças e economia), `bandeiras.ts`,
  `distribuidoras.ts` (nomes comerciais).
- Leitura dos dados da ANEEL em `packages/dados/src/aneel/`.

## Estado atual (regras em uso)

| Regra | Valor | Fonte |
| --- | --- | --- |
| Consumo | P × t, mês de 30 dias, × fator de ciclo | física / convenção |
| Fator de ciclo do ar | inverter 0,6 · split comum 0,85 · janela e portátil 0,9 | estimativa a partir de PROCEL/INMETRO |
| Consumo mínimo | 30 / 50 / 100 kWh | REN ANEEL 1.000/2021 |
| Tarifa Social | 80 kWh/mês gratuitos | Lei 15.235/2025 (sancionada em 08/10/2025) |
| Desconto Social | até 120 kWh, só aviso (percentual não modelado) | Lei 15.235/2025, a partir de 01/01/2026 |
| Tarifa | B1 residencial convencional, Tarifa de Aplicação, TE + TUSD, sem impostos | ANEEL dados abertos |
| Bandeira | adicional do mês; unidade detectada pela grandeza (R$/MWh ou R$/kWh) | ANEEL dados abertos |
| Calibração pela conta | valor ÷ kWh; com Tarifa Social, divide por (kWh − 80) e ignora se der menos de 10 kWh | conta da família |

| Faixas dos arquivos públicos (HIS-003, P-tl-2) | tarifa > 0,05 e ≤ 3,00 R$/kWh; TE e TUSD 0–3,00; TE + TUSD = tarifa (±0,00001); bandeira 0–1,00, verde = 0, as outras > 0 | `tarifas.json` de 29/10/2026 (0,353–1,569; bandeira máx. 0,142); ANEEL, bandeiras e FAQ da escassez hídrica |
| Limites de entrada (HIS-003) | rígido derivado de 75 kW (grupo B): potência ≤ 75.000 W, conta ≤ 54.000 kWh, ≤ 1.800 kWh/dia; alertas: > 10.000 W, > 2.000 kWh, > R$ 3.000, preço fora de R$ 0,30–3,00/kWh | REN ANEEL 1.000/2021 art. 23, I, "a"; EPE (178,2 kWh/mês, jun/2025); IBGE Censo 2022 (2,79 moradores) |

## Decisões em vigor

- Limites em dois níveis: **rígido** (impossível → não salva / descarta) e **alerta** (raro → pergunta e salva). Alerta nunca descarta.
- Alerta de preço da conta é estimativa; não se aplica à Tarifa Social nem a contas com menos de 30 kWh.
- Tabela completa e 23 casos de borda em `docs/equipe/historias/HIS-003-base-de-seguranca.md`, seção "Regras de negócio e fontes".

## Pendências

- HIS-003: revisar o `limites.ts`, o `arquivos-publicos.ts` (P1–P7) e os testes quando o backend escrever; trocar o
  link da EPE (hoje cópia da eixos) pelo oficial.
- **P-de-1 (veto, alta):** 11 distribuidoras com tarifa vencida (2016–2023), usadas por cerca de 200 municípios em
  RS, SP, MG, RR, PB, PR e RJ. Aguarda uma história nova. Confirmar as sucessoras no cadastro de agentes da ANEEL.
- Pesquisar ICMS residencial por estado e PIS/COFINS por distribuidora (HIS-202).
- Percentual do Desconto Social por distribuidora (HIS-203).

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

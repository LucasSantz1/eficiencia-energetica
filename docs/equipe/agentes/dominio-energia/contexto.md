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

## Decisões em vigor (HIS-111, 30/10/2026)

- Sucessões no `packages/dados/base/sucessoes.json` só com ato oficial e link. São 11 linhas: ESS (4), CPFL Santa
  Cruz (4, incluindo a antiga CPFL SANTA CRUZ, 61116265000144), EMR, EPB e Âmbar Roraima. A CERR entra com despacho do MME.
- Linha 12 (RGE antiga 02016439000138 → RGE 02016440000162) confirmada, `desde` 2019-01-01 ok (aprovação 04/12/2018,
  agrupamento 31/12/2018, segundo a CPFL). Número da REA não localizado; `ato` sem número, aceito para o merge.
- Tarifa vencida: aviso desde o 1º dia; descarte depois de 6 meses.
- O arquivo de atributos dos conjuntos (IndQual) para em 2014. A sigla é a de hoje. "Conjunto velho" não quer dizer
  "empresa extinta": o D3 só vale para o vínculo sem tarifa publicada (Equatorial PI foi falso positivo).
- Equatorial Piauí = antiga Cepisa, a mesma pessoa jurídica (CNPJ 06840748000189). Em 2018 só mudou o controle.
- Nomes antigos para o aviso: Vale Paranapanema, Bragantina, Força e Luz do Oeste, Companhia Energética de Roraima;
  CNEE sem nome (sem fonte).

## Pendências

- Faixas aceitáveis de potência, minutos, kWh e valor da conta (pergunta da HIS-003).
- Pesquisar ICMS residencial por estado e PIS/COFINS por distribuidora (HIS-202).
- Percentual do Desconto Social por distribuidora (HIS-203).
- HIS-111: achar o número da REA de dez/2018 (RGE) no cedoc/DOU. Trocar as fontes de cópia pelo cedoc/DOU quando houver
  acesso. Ato da CERR melhor: Despacho MME s/n de
  23/09/2016 e Despacho ANEEL nº 580/2016. Nova Santa Rita (PI) com `certaja` (RS): parece erro de código IBGE no
  IndQual, para uma história própria.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

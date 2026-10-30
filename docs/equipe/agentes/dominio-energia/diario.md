# Diário · Especialista em energia

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-30 · HIS-003 · faixas de entrada com fonte e casos de borda
- O que fiz: respondi `[para: dominio-energia]` com a tabela rígido/alerta de potência, minutos, dias, banho, quantidade,
  fator de ciclo, etiqueta, conta (kWh, R$, preço implícito), relógio, pessoas e cômodos; 23 casos de teste; riscos.
  Conferi contra `catalogo.ts` e os limites das telas (`EditorAparelho`, `TempoUso`, `Cadastro`, `LinhaAparelho`).
- Decisões e porquê: teto físico de 75 kW do grupo B (REN 1.000/2021, art. 23, I, "a") → 75.000 W, 54.000 kWh/mês,
  1.800 kWh/dia; alertas pela média EPE (178,2 kWh/mês) e pela faixa do catálogo; preço da conta R$ 0,30–3,00/kWh pelas
  tarifas B1 do `tarifas.json` (0,353–1,569) + bandeira máx. 0,142 + impostos (estimativa). Potência na tela 30.000 → 75.000; pessoas 15 → 20.
- Arquivos: `docs/equipe/historias/HIS-003-base-de-seguranca.md` (seção "Regras de negócio e fontes", perguntas, nota).
- Pedido da ux: tabela "Limites prontos para as mensagens do T5" com `{min}`/`{max}` já com unidade (1 W a 75.000 W confirmado,
  sem o corte de 30.000); conta tem `min` diferente na calibração (1 kWh / R$ 0,01) e no acompanhamento (0); tempo por dia com
  texto fixo, porque `formatarTempo(1440)` = "o dia todo".
- Próximos passos: revisar `limites.ts` e testes; link oficial da EPE; texto do alerta com ux.

## 2026-10-29 · criação da equipe
- O que fiz: Regras em uso documentadas no contexto (consumo mínimo, Tarifa Social da Lei 15.235/2025, fator de ciclo).
- Próximos passos: ver "Pendências" em `contexto.md`.

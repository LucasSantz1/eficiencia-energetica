# HIS-101 — Ouvir a tela

**Pedido:** o dono escolheu "Ouvir a tela" no escopo do lançamento (26/11).

## O que faz

- Botão "Ouvir" no acompanhamento (a conta, quem mais pesa, o plano e a melhor dica) e nas dicas (as dicas da tela, com o filtro escolhido, até 5).
- O dinheiro e o kWh viram palavras ("182 reais e 40 centavos", "210 quilowatts-hora"): `packages/core/src/falar.ts`, com teste.
- Tocar de novo para ("Parar de ouvir"). Sair da tela para a voz. Só um "Ouvir" fala por vez.
- Só voz do aparelho (`localService`). Sem voz em português no aparelho, o botão não aparece: o texto nunca sai do aparelho (princípio 5).
- Conta "ouviu" uma vez por página (ADR-009).

## Testes

- `packages/core/test/falar.test.ts`
- `apps/web/e2e/ouvir.spec.ts` (síntese de mentira: frases, parar, fim da fala, sair da tela, voz da internet, sem voz)

## Conversa da equipe

- frontend (modo turbo, 26/11): feito como acima. Falta a rodada do qa no celular de verdade (a voz muda de aparelho para aparelho).

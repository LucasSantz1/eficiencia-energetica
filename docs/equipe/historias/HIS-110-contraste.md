# HIS-110 · Contraste das cores padrão

| Campo | Valor |
| --- | --- |
| Épico | Inclusão I |
| Sprint | 1 |
| Tamanho | P |
| Papéis principais | ux-acessibilidade, frontend (qa confere) |
| Status | Em implementação |
| Branch | `his-110-contraste` (sai do `main` em `c137969`) |

## Problema e valor

Como **pessoa que enxerga pouco ou usa o celular no sol**, eu quero **ler todo texto do site** para **saber quanto cada
cômodo pesa e quem tem direito à Tarifa Social**. Hoje, na `/`, o axe acusa 4 textos abaixo de 4,5:1 (WCAG 1.4.3, AA),
guardados como exceção em `apps/web/e2e/excecoes-axe.ts`. O escopo e as medidas da ux estão na linha da HIS-110 em
`docs/planejamento.md`.

## Critérios de aceite

1. **Dado** a casa ilustrada da `/`, **então** a pílula de porcentagem na faixa D (Quarto e Cozinha) tem texto `text-tinta`
   sobre `bg-faixa-d` (5,50:1); o laranja fica.
2. **Dado** os cartões "Tarifa Social" e "Desconto Social" da `/`, **então** o `<dd>` de explicação é `text-white` sobre
   `bg-white/10` no verde (4,77:1). Os `<p>` com `text-white/85` direto no verde (4,69:1) ficam.
3. **Dado** a regra de texto sobre cor de faixa, **então** ela está escrita junto das cores, em `ui/Etiqueta.tsx`:
   A e E com branco; B, C e D com tinta.
4. **Dado** o axe nas 7 páginas, sem e com casa, em 390 e 1280 px, **então** não há `color-contrast` e
   `excecoes-axe.ts` não tem entrada com `HIS-110`.
5. **Dado** a barreira de qualidade, **então** lint, typecheck, test, build e e2e passam, com capturas de 390 e 1280 px
   da `/` e sem erro no console. Nenhum token de cor muda.

## Fora do escopo

- Trocar a escala da pílula (`corDaParte`) por `faixaDoPeso`: muda a cor da Lavanderia (A para B) e espera a decisão do
  scrum-master (ponto (a)/(b) do planejamento). Aqui vale a opção (a), que só corrige o contraste.
- `Casca`, `casa.ts` e as telas de `/casa` que a HIS-003a e a HIS-112 mudam.

## Perguntas abertas

- [para: scrum-master] Opção (b) do planejamento (uma escala só, `faixaDoPeso`, Lavanderia de A para B, com tinta):
  entra numa história própria? A HIS-110 seguiu a (a).
- [para: ux-acessibilidade] Aprovar a cor nova da pílula da faixa D (`text-tinta`) nas capturas.

## Conversa da equipe

### [frontend] 2026-11-13 — critérios 1 a 5 feitos (`f1eb8b0`…, opção (a))
- Pílula da faixa D com `text-tinta` (`CasaIlustrada`, regra A/E branco e B/C/D tinta comentada em `ui/Etiqueta.tsx`); os 2 `<dd>` da Tarifa Social com `text-white`. Nenhum token mudou.
- `excecoes-axe.ts` ficou vazia (saíram as 8 entradas `HIS-110`). Lint, typecheck, test, build e e2e completos (121 passaram, com axe e peso), sem erro no console.
- Capturas de 390 e 1280 px em `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/his110/`.
- Próximo: **ux** (aprovar a cor da pílula) ‖ **qa**; scrum-master decide a opção (b) à parte.

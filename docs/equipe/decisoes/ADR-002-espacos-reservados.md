# ADR-002 · Espaços reservados para parceiros, desligados

- **Status:** aceito
- **Data:** 2026-10-29
- **Responsável:** tech-lead, com scrum-master e seguranca

## Contexto

No futuro pode existir conteúdo de parceiros para ajudar a manter o projeto. Hoje o site deve continuar sem nenhuma
propaganda e sem nada que indique isso. O projeto é gratuito para as famílias e isso não muda.

## Decisão

- Um componente `EspacoReservado` com posições nomeadas e uma chave `RECURSOS.espacosReservados = false`.
- Desligado, o componente retorna `null`: nada vai para o HTML.
- As regras de uso ficam em `docs/equipe/espacos-reservados.md` e qualquer ativação é uma história própria (épico E11)
  com revisão de segurança, UX e LGPD.

## Alternativas consideradas

- **Não preparar nada:** obrigaria mexer no leiaute de várias telas depois.
- **Deixar espaço vazio visível:** contraria o pedido de não deixar nada explícito no site.

## Consequências

- Custo quase zero hoje (três linhas nas telas).
- Ligar exige trocar o plano de hospedagem (o plano gratuito da Vercel é não comercial) e atualizar a política de privacidade.

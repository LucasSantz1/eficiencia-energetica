# Contexto · UX e acessibilidade

## O que eu cuido

- Fluxos e textos de todas as telas, consistência visual, acessibilidade (WCAG 2.2 AA).
- Tokens e animações em `apps/web/src/app/globals.css`; componentes de interface em `components/ui.tsx` (futuro `src/ui/`).

## Estado atual

- Telas: início, cadastro (estado em lista → cidade → distribuidora → benefício → pessoas → cômodos → cada cômodo →
  revisão → conta), acompanhamento, cômodos, plano de economia, minha casa, sobre.
- Identidade: tinta azul-marinho, verde-energia para ação/economia, amarelo-faísca para destaque, cores da etiqueta do
  INMETRO (A–E) para peso na conta. Fontes Atkinson Hyperlegible Next e Archivo (títulos da página inicial).
- Movimento: deslizar entre páginas, entrada no painel, números contando, barras crescendo; desligado com movimento reduzido.

## Decisões em vigor

- Uma decisão por tela no cadastro; sempre um caminho "não sei"; valores em R$ primeiro.
- Nada no site sobre espaços para parceiros nem sobre instituição de ensino.
- Nome acessível de botão começa pelo texto que aparece nele, na mesma ordem (WCAG 2.5.3); o que só o leitor ouve vem
  depois. Casa ilustrada da `/`: "Cômodo, NN% da conta, R$ X por mês" (HIS-002a).
- Texto sobre cor de faixa da etiqueta: A e E com branco (4,72 e 5,21:1); B, C e D com tinta (5,80, 8,45 e 5,50:1).
  Nunca branco em B, C ou D (HIS-110).

## Pendências

- Texto do aviso quando parte dos dados salvos foi descartada (HIS-003).
- Roteiro do teste com famílias (HIS-106), com o Scrum Master.
- HIS-002a: revisar `excecoes-axe.ts` quando o qa montar; conferir no A5 os 5 nomes da casa ilustrada.
- HIS-110: aprovar a cor nas capturas 390/1280 px (proposta: faixa D com `text-tinta`).
- Observação para depois (sem história): passar o mouse num cômodo troca a legenda `aria-live` e o leitor de tela
  anuncia sem a pessoa pedir; avaliar com o teste de famílias (HIS-106) antes de mudar.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

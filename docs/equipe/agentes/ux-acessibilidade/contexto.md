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

## Pendências

- Texto do aviso quando parte dos dados salvos foi descartada (HIS-003).
- Roteiro do teste com famílias (HIS-106), com o Scrum Master.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

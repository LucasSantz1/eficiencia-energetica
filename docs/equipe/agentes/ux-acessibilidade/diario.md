# Diário · UX e acessibilidade

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-29 · HIS-002 · nomes acessíveis dos 5 cômodos da `/` e cor da HIS-110
- O que fiz: nome acessível final dos 5 botões da casa ilustrada (`aria-label` "Cômodo, NN% da conta, R$ X por mês",
  tabela com os 5 textos) em "Fluxo e textos" da HIS-002a; contraste de todas as faixas com branco, tinta e noite;
  correção da HIS-110 escrita na linha dela no planejamento.
- Decisões e porquê: nome começa com o texto visível (WCAG 2.5.3; o axe exige "quarto 19" seguido); R$ fica no nome
  para quem navega com Tab. Faixa D com tinta (5,50:1) em vez de branco (2,85:1): mantém a cor do INMETRO, sem token
  novo. Regra: A e E branco; B, C e D tinta.
- Arquivos: `docs/equipe/historias/HIS-002-qualidade-automatica.md`, `docs/planejamento.md`, esta pasta.
- Próximos passos: revisar `excecoes-axe.ts` (qa); aprovar a cor da HIS-110 nas capturas.

## 2026-10-29 · criação da equipe
- O que fiz: Identidade visual e princípios de fluxo registrados no contexto.
- Próximos passos: ver "Pendências" em `contexto.md`.

# Diário · UX e acessibilidade

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-30 · HIS-003 · textos de dados descartados, falha de carga, telas de erro e limites de campo
- O que fiz:
  - Escrevi T1 a T5 em "Fluxo e textos" da HIS-003: dados descartados (3 casos), falha em tarifas e municípios
    (incluindo sem internet), `error.tsx` e `global-error.tsx`, `not-found.tsx` e as mensagens de limite por campo.
  - Para cada um: onde aparece, o componente e os requisitos de acessibilidade.
  - Respondi a pergunta aberta e deixei a nota na conversa.
- Decisões e porquê:
  - Descarte usa `faisca`/`status`, porque a pessoa não errou.
  - Live region presente antes do texto, porque a casa é lida depois da primeira pintura.
  - Na 2ª falha, uma frase nova faz o `alert` ser anunciado de novo.
  - `retry()` do Next 16.3.
  - Erro de campo ao sair do campo (não a cada tecla).
  - Sai o `Math.min` da potência, que corrigia o número escondido.
  - Botão de continuar sem `disabled`.
- Arquivos: `docs/equipe/historias/HIS-003-base-de-seguranca.md`, esta pasta.
- Próximos passos:
  - seguranca devolve a contagem por tipo no `migrate`;
  - dominio-energia passa `{min}` e `{max}`;
  - eu reviso as capturas.

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

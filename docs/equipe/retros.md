# Retrospectivas

Lido por todos os agentes no início de cada sprint. Cada agente acrescenta o que funcionou e o que melhorar.

## Aprendizados herdados (antes da equipe)

- **Dados da ANEEL:** a unidade do adicional das bandeiras muda entre arquivos (R$/MWh × R$/kWh): detectar pela grandeza.
  O IndQual Município não tem a distribuidora — precisa cruzar com os atributos dos conjuntos.
- **Rede no CI:** a ANEEL às vezes demora a responder (usar tentativas com espera) e a API do IBGE falha nos runners do
  GitHub (usar a cópia local).
- **Tarifa Social:** desde a Lei 15.235/2025 os primeiros 80 kWh são isentos; calibrar pela conta exige descontar esses 80 kWh.
- **Interface:** nomes de aparelho longos quebram linhas em 390 px — sempre testar no celular. Valores dentro de barras
  curtas ficam cortados: colocar fora.
- **Ambiente:** não usar `pkill -f "next start"` (derruba o próprio terminal); liberar a porta com `fuser -k 3100/tcp`.
- **Trocas de texto por script** podem não casar em silêncio — conferir com `grep` depois.

## Sprint 0

_(a preencher ao fim da sprint)_

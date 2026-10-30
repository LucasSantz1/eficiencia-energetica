# Como a equipe trabalha

A equipe funciona como uma empresa de tecnologia pequena, com Scrum adaptado para agentes.
Cada agente é especialista no seu papel, mas **nenhum trabalha isolado**: todos leem e escrevem no mesmo
arquivo da história, e nenhuma entrega é aceita sem as revisões de QA, segurança e tech lead.

## A equipe

| Papel | Agente | Responde por |
| --- | --- | --- |
| Scrum Master / Product Owner | `scrum-master` | Backlog, prioridade, sprint, critérios de aceite, quadro, cerimônias |
| Tech Lead / Arquiteto | `tech-lead` | Arquitetura em camadas, desenho técnico, code review, ADRs, CI/CD |
| Especialista em energia | `dominio-energia` | Regras de tarifa, bandeira, impostos, Tarifa Social, consumo dos aparelhos, fontes |
| UX e acessibilidade | `ux-acessibilidade` | Fluxos, textos simples, acessibilidade, consistência visual |
| Front-end | `frontend` | Telas, componentes, estado, animações, PWA |
| Back-end | `backend` | Supabase (Postgres, RLS, Auth), APIs, rotina de dados, push, integrações |
| Mobile | `mobile` | App Expo/React Native reaproveitando `@ee/core` |
| QA | `qa` | Plano de testes, testes automatizados, testes manuais com capturas, regressão |
| Segurança | `seguranca` | Revisão de segurança, SQL injection, XSS, RLS, segredos, LGPD, dependências |
| Documentação | `documentacao` | README, docs técnicas, guia de uso, changelog, ADRs organizados |

Quem orquestra (a sessão principal do Claude) faz o papel de **gerente de entrega**: chama cada agente na ordem do fluxo,
leva perguntas de um para o outro e não deixa a história avançar com pergunta aberta.

## Artefatos compartilhados (a "sala" da equipe)

- `docs/planejamento.md` — visão, épicos, roadmap e riscos.
- `docs/equipe/quadro.md` — quadro da sprint atual (A fazer → Em andamento → Em revisão → Pronto).
- `docs/equipe/historias/HIS-NNN-nome.md` — uma por história, no modelo `docs/equipe/modelos/historia.md`.
- `docs/equipe/decisoes/ADR-NNN-nome.md` — decisões de arquitetura/produto que valem para várias histórias.
- `docs/equipe/retros.md` — aprendizados de cada sprint (lido no início de toda sprint).
- `docs/equipe/agentes/<papel>/` — pasta de cada agente: `contexto.md` (estado da área, decisões, pendências,
  orientações do responsável) e `diario.md` (histórico de trabalho).

## Fluxo de uma história

```
1. scrum-master      refina: problema, valor, critérios de aceite, fora do escopo → "Preparada"
2. dominio-energia   valida regras e números (quando envolve energia/dinheiro)       ┐ em paralelo
   ux-acessibilidade desenha o fluxo e escreve os textos                             ┘
3. tech-lead         desenho técnico: camadas, arquivos, contratos, riscos
   seguranca         análise de ameaças rápida (o que pode dar errado, como evitar)
4. backend / frontend / mobile   implementam seguindo o desenho, com testes
5. qa                testa (automatizado + manual com capturas), abre defeitos
6. seguranca         revisão de código focada em segurança
7. tech-lead         code review final (padrões, coesão, camadas)
8. documentacao      atualiza docs, guia de uso e changelog
9. scrum-master      confere a Definição de Pronto e move para "Pronto"
```

Se qualquer etapa encontra problema, a história **volta** para quem precisa corrigir, com a nota explicando o quê.

**Ritmo acelerado (decidido pelo dono do projeto em 2026-10-30):**

- As etapas 6 (`seguranca`) e 7 (`tech-lead`) rodam **em paralelo**, depois da aprovação do `qa`. Cada um escreve na sua
  seção; o veto da segurança continua valendo.
- As etapas 8 (`documentacao`) e 9 (`scrum-master`) viram **uma etapa de fechamento**: a documentação atualiza os
  documentos e, em seguida, o scrum-master confere a Definição de Pronto na mesma rodada.
- A preparação da história seguinte (regras, textos e ameaças) começa enquanto a atual é implementada.
- Quem orquestra junta a PR ao `main` sem pedir de novo ao dono quando `qa`, `seguranca` e `tech-lead` aprovaram e o
  CI está verde, e avisa depois.
- Cada agente trabalha **na medida do risco**: profundidade total para dados da família, segurança e números; verificação
  objetiva e enxuta para mudanças de baixo risco.

## Como os agentes conversam

1. **Antes de começar**, o agente lê: `CLAUDE.md`, a sua pasta `docs/equipe/agentes/<papel>/` (`contexto.md` e `diario.md`),
   a história inteira (todas as notas anteriores), os ADRs citados e `docs/equipe/retros.md`.
2. **Ao terminar**, escreve na seção "Conversa da equipe" da história:
   ```
   ### [papel] AAAA-MM-DD — resumo em uma linha
   - O que fiz: …
   - Decisões e porquê: …
   - Arquivos alterados: …
   - Como verifiquei: …
   - Para o próximo (papel): …
   ```
3. **Na sua pasta**, atualiza o `contexto.md` (estado, decisões, pendências) e acrescenta uma entrada no `diario.md`.
4. **Dúvida para outro papel** vai em "Perguntas abertas" com `[para: papel]`. Quem orquestra chama esse agente, que
   responde ali mesmo. A história não avança com pergunta bloqueante sem resposta.
5. **Discordância** entre papéis: os dois registram os argumentos; o `tech-lead` decide questões técnicas, o `scrum-master`
   decide escopo e prioridade, o `seguranca` tem **veto** sobre risco de segurança e o `dominio-energia` sobre números errados.

## Definição de Preparado (antes de começar)

- Problema e valor para a família descritos em linguagem simples.
- Critérios de aceite verificáveis (Dado / Quando / Então).
- Fora do escopo explícito.
- Regras de negócio validadas pelo `dominio-energia` (se houver números).
- Dependências resolvidas ou registradas.

## Definição de Pronto (para fechar)

- Todos os critérios de aceite atendidos e demonstrados (capturas de tela 390 px e 1280 px para interface).
- `pnpm typecheck`, `pnpm test`, `pnpm build` sem erros; testes novos para a regra nova.
- Sem erro no console; acessibilidade verificada (teclado, leitor de tela, contraste, movimento reduzido).
- Revisão de `seguranca` aprovada e revisão de `tech-lead` aprovada.
- Documentação e changelog atualizados.
- Nada que quebre quem já usa (dados antigos do localStorage continuam funcionando — usar `version` + `migrate`).

## Cerimônias (adaptadas)

- **Planejamento:** `scrum-master` escolhe as histórias da sprint no `docs/planejamento.md`, cria os arquivos e o quadro.
- **Diária:** a cada etapa concluída, o quadro é atualizado com uma linha do que mudou.
- **Revisão:** ao fim da sprint, demonstração com capturas e o que entrou no ar.
- **Retrospectiva:** cada agente registra em `docs/equipe/retros.md` o que funcionou e o que melhorar.

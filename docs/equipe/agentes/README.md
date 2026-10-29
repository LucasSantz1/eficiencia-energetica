# Pastas dos agentes

Cada agente da equipe tem uma pasta aqui com dois arquivos:

| Arquivo | Para que serve | Quem escreve |
| --- | --- | --- |
| `contexto.md` | O que o agente cuida: área do código, estado atual, decisões em vigor, pendências e referências | o próprio agente (e você, quando quiser orientar o papel) |
| `diario.md` | O histórico de trabalho do agente, uma entrada por tarefa, da mais nova para a mais antiga | o próprio agente, ao terminar cada tarefa |

A definição de cada agente (quem ele é, o que sabe, regras) fica em [`.claude/agents/`](../../../.claude/agents/).
A pasta daqui é a **memória de trabalho** dele: o agente lê os dois arquivos antes de começar e atualiza ao terminar.

| Papel | Pasta | Definição |
| --- | --- | --- |
| Scrum Master / PO | [scrum-master](scrum-master/) | [.claude/agents/scrum-master.md](../../../.claude/agents/scrum-master.md) |
| Tech Lead | [tech-lead](tech-lead/) | [.claude/agents/tech-lead.md](../../../.claude/agents/tech-lead.md) |
| Especialista em energia | [dominio-energia](dominio-energia/) | [.claude/agents/dominio-energia.md](../../../.claude/agents/dominio-energia.md) |
| UX e acessibilidade | [ux-acessibilidade](ux-acessibilidade/) | [.claude/agents/ux-acessibilidade.md](../../../.claude/agents/ux-acessibilidade.md) |
| Front-end | [frontend](frontend/) | [.claude/agents/frontend.md](../../../.claude/agents/frontend.md) |
| Back-end | [backend](backend/) | [.claude/agents/backend.md](../../../.claude/agents/backend.md) |
| Mobile | [mobile](mobile/) | [.claude/agents/mobile.md](../../../.claude/agents/mobile.md) |
| QA | [qa](qa/) | [.claude/agents/qa.md](../../../.claude/agents/qa.md) |
| Segurança | [seguranca](seguranca/) | [.claude/agents/seguranca.md](../../../.claude/agents/seguranca.md) |
| Documentação | [documentacao](documentacao/) | [.claude/agents/documentacao.md](../../../.claude/agents/documentacao.md) |

## Como usar no VS Code

- Abra a pasta do projeto no VS Code. As pastas ficam em `docs/equipe/agentes/` e as definições em `.claude/agents/`.
- Para mudar o comportamento de um papel (ex.: "o front-end deve sempre usar tal componente"), edite o `contexto.md` dele
  na seção "Orientações do responsável". O agente lê isso antes de toda tarefa.
- Para mudar quem o agente é ou que ferramentas ele usa, edite o arquivo em `.claude/agents/`.
- Com a extensão do Claude Code no VS Code, você pode chamar um agente pelo nome (ex.: "use o agente frontend para…").

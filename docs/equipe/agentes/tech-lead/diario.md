# Diário · Tech Lead

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-29 · HIS-001 · desenho técnico definitivo da reorganização em camadas
- O que fiz: li todo o `apps/web/src` e mapeei os imports; escrevi o desenho técnico na história (tabela arquivo → destino
  com a diretiva de cada arquivo, contratos de `aplicacao/casa.ts`, `EditorAparelho` e página inicial, estrutura final,
  script de camadas, 8 passos, riscos, verificação e dívida); respondi a pergunta aberta; revisei o ADR-001.
- Decisões e porquê: `ui/aparelho/` sem store para os componentes de aparelho compartilhados (evita funcionalidade
  importando funcionalidade); `ui/` pode usar funções puras do core; `aplicacao/` como única porta para
  `infraestrutura/` (`useEdicaoDeAparelho` liga o editor à casa); `Casca` em `funcionalidades/casca/`; `*.servidor.ts`
  para código com `node:fs`; sem barris; telas grandes não são divididas agora, para a revisão ver só movimentos e
  imports; script Node puro dentro do `pnpm typecheck`, sem mudar o CI.
- Arquivos: `docs/equipe/historias/HIS-001-camadas.md`, `docs/equipe/decisoes/ADR-001-camadas.md`,
  `docs/equipe/quadro.md`, `docs/equipe/agentes/tech-lead/contexto.md`, este diário.
- Próximos passos: `seguranca` faz a análise de ameaças; `qa` faz a linha de base (passo 0) antes do `frontend`
  começar; eu faço o code review na etapa 7.

## 2026-10-29 · criação da equipe
- O que fiz: ADR-001 (camadas) e ADR-002 (espaços reservados) registrados; proposta inicial do desenho da HIS-001.
- Próximos passos: ver "Pendências" em `contexto.md`.

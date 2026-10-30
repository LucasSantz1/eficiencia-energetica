# Diário · Front-end

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-29 · HIS-001 · camadas implementadas nos passos 1–8, sem mudança visível
- O que fiz: `scripts/verificar-camadas.mjs` (ligado ao `pnpm typecheck`) e a reorganização inteira do `apps/web/src`
  em `app/`, `funcionalidades/`, `ui/`, `ui/aparelho/`, `aplicacao/`, `infraestrutura/`; um commit por passo
  (`87bb6ba`, `74cd08d`, `df8c6fb`, `a1c23d8`, `acb65fc`, `ddd061b`, `bd85f7e`, `4bcc7e8`).
- Decisões e porquê: regex do `import(` não literal com o `\s*` dentro do lookahead (a do desenho acusava
  `import( "x")`); constantes do `Botao` sem export (A7); `type LeituraRelogio` sem uso saiu do import.
- Verificação: typecheck/test/build verdes; 36 casos do script; comparação do QA com 84 capturas e 98
  textos/DOM/casas iguais. Única diferença: JS de `/casa` sem casa +1 449 B, por causa da repetição de módulos de `ui/`
  nos chunks pré-carregados (o JS para abrir cada rota diminuiu). Pergunta aberta ao tech-lead.
- Aprendizado: o Turbopack põe no chunk do layout o que o layout importa. Dividir um módulo grande que o layout puxava
  faz as partes que só as páginas usam se repetirem no chunk de cada página pré-carregada. Medir com o build do `main`
  numa cópia no scratchpad e por commit (`…/his001/medir-commits.sh`) mostrou de onde vinha.
- Arquivos: `scripts/verificar-camadas.mjs`, `package.json`, `apps/web/src/**`, a história, este diário, `contexto.md`, `quadro.md`.
- Próximos passos: responder o que vier do QA (etapa 5), da segurança (6) e do tech-lead (7).

## 2026-10-29 · criação da equipe
- O que fiz: Mapa do código atual registrado no contexto; espaços reservados (desligados) colocados em 3 telas.
- Próximos passos: ver "Pendências" em `contexto.md`.

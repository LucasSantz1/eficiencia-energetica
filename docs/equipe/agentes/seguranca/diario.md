# Diário · Segurança

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-29 · HIS-001 · revisão de código da etapa 6: aprovado com ressalvas (baixo)
- O que fiz: R1–R15 com evidência contra `182f355` (tabela na história); comparação das linhas não-import de cada
  arquivo movido/dividido com o `main` (sem diferença fora do previsto); build próprio + servidor na porta 3107;
  `pnpm audit` limpo; busca de segredos no `git log -p`; revisão do `linha-de-base.cjs`/fixtures do QA. Roteiro do
  frontend 36/36 ok; 21 casos meus (`seg-camadas/testar-seg.mjs`), 10 lacunas; prova em cópia de que o `server-only`
  derruba o build no import indireto.
- Decisões e porquê: aprovado com ressalvas — nenhum crítico/alto se materializou. A regex nova do `import(` está certa.
  S1 (lacunas do script, baixo: exigem escrita deliberada e o `server-only` cobre o caso grave) e S2 (`VOLTAR` de módulo
  `"use client"` na `/sobre`, pré-existente) vão para a HIS-002. Server Actions viram pendência do E4.
- Arquivos: `docs/equipe/historias/HIS-001-camadas.md` (subseção "Revisão de código (etapa 6)", R9 corrigido, nota),
  `contexto.md`, `diario.md`.
- Próximos passos: na HIS-002, rodar de novo `testar-seg.mjs` esperando 0 "BRECHA" e conferir S2.

## 2026-10-29 · HIS-001 · análise de ameaças da reorganização em camadas: aprovado para implementar
- O que fiz: li o desenho técnico e o código atual; tabela de ameaças A1–A17 e pontos de revisão R1–R15 na história;
  linha de base do build atual (chave da casa, `node:fs`, hosts) e do comportamento do `persist` do zustand.
- Decisões e porquê: aprovado — o desenho mitiga os riscos críticos/altos (store único, formato byte a byte, portão de
  hidratação, contrato do editor, apagar tudo, nada novo saindo). Ponto fraco: o `verificar-camadas.mjs` pode ter falso
  negativo (0 arquivos, `require`, builtins sem `node:`, `'use client'`); pergunta aberta ao tech-lead com os ajustes e
  o `import "server-only"`.
- Arquivos: `docs/equipe/historias/HIS-001-camadas.md` (Ameaças, Perguntas abertas, nota), `contexto.md`, `diario.md`.
- Próximos passos: aguardar resposta do tech-lead; etapa 6 com R1–R15 e testes negativos do script numa cópia no scratchpad.

## 2026-10-29 · criação da equipe
- O que fiz: Riscos conhecidos levantados no contexto; base de segurança vira a HIS-003.
- Próximos passos: ver "Pendências" em `contexto.md`.

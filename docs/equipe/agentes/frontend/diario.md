# Diário · Front-end

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-30 · HIS-111 · h6: id de hoje nas telas e aviso da troca de distribuidora
- O que fiz: `useResumo` com `acharDistribuidora`; `Cadastro` e `TelaAjustes` com `distribuidorasDaCidade`;
  `useDistribuidoraAtualizada` (regrava uma vez por par); `AvisoTrocaDistribuidora` na `Casca` (textos do F1);
  `Aviso` com `anunciar`; no core, 4 nomes do dominio-energia, `nomeComercialDoId`, `descreverTroca` e testes.
- Decisões e porquê: nome do id antigo no core (os nomes têm fonte lá; `Map` evita "constructor"); o par da troca fica
  só em memória (o aviso some na próxima visita sem gravar nada novo); F2 ficou de fora (arquivo da 002a).
- Verificação: typecheck/test/build verdes; Playwright em 390 e 1280 px com `tarifas.json` de teste via `route`,
  52 conferências, console limpo (`scratchpad/frontend-h6/conferir.cjs`).
- Aprendizado: rodar `next start` numa porta já ocupada falha em silêncio no fundo e o teste bate no servidor velho;
  conferir o log do servidor antes de testar.
- Arquivos: `aplicacao/casa.ts`, `aplicacao/resumo.ts`, `ui/Aviso.tsx`, `funcionalidades/casca/*`, `Cadastro.tsx`,
  `TelaAjustes.tsx`, `packages/core/src/distribuidoras.ts`, `packages/core/test/distribuidoras.test.ts`, a história.
- Próximos passos: qa no h7; responder a revisão do tech-lead.

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

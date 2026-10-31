# Diário · Documentação

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-30 · HIS-002a · testes no navegador e CI em dois jobs documentados
- O que fiz: seção "Testes no navegador" e "Integração contínua" novas em `desenvolvimento.md`; barreira "nada sai do
  aparelho" em `privacidade-e-seguranca.md`; ESLint apontando para a HIS-002b em `arquitetura.md`; CHANGELOG.
- Decisões e porquê: conferi `ci.yml`, `playwright.config.ts`, `e2e/apoio/*` e o diff do `src`; rodei `--list` (113) e
  `rotas` + `sanidade` na porta 3171 (24 passando). Exemplo do changelog com o valor real do Quarto (R$ 21,74).
- Arquivos: `docs/sistema/desenvolvimento.md`, `docs/sistema/privacidade-e-seguranca.md`, `docs/arquitetura.md`,
  `CHANGELOG.md`, a história, `contexto.md`, este diário.
- Próximos passos: HIS-002b (`pnpm lint`), HIS-110 (exceções do axe), HIS-003.

## 2026-10-29 · HIS-001 · documentação atualizada para as camadas do site
- O que fiz: conferi a estrutura real de `apps/web/src`, o `verificar-camadas.mjs` e o `package.json`; reescrevi "Camadas
  do site" em `docs/arquitetura.md` (árvore, diagrama Mermaid validado com `mmdc`, regras, decisões, verificador) e as
  seções de rotas, telas, componentes, casos de uso e armazenamento de `docs/sistema/site.md`; `pnpm camadas` em
  `desenvolvimento.md`; caminhos em `diagramas.md`, `roteiro.md`, `ux-acessibilidade.md`; termo "Camadas" no glossário;
  índices; CHANGELOG. Nota na história, quadro atualizado, commit local.
- Decisões e porquê: a estrutura fica descrita uma vez em `arquitetura.md` e os outros documentos apontam para lá;
  `/casa/aparelhos` documentado como 200 com `NEXT_REDIRECT` (correção do R9); exemplo de saída do verificador tirado de
  uma execução real numa cópia; `EspacoReservado` fora do resumo da arquitetura (regra de não citar espaços reservados).
  Não editei `CLAUDE.md`: propus o texto da nota "Estado atual" a quem orquestra.
- Arquivos: `docs/arquitetura.md`, `docs/sistema/site.md`, `docs/sistema/desenvolvimento.md`, `docs/sistema/diagramas.md`,
  `docs/sistema/glossario.md`, `docs/roteiro.md`, `docs/README.md`, `docs/equipe/decisoes/README.md`, `README.md`,
  `CHANGELOG.md`, `.claude/agents/ux-acessibilidade.md`, `docs/equipe/historias/HIS-001-camadas.md`, `docs/equipe/quadro.md`.
- Próximos passos: scrum-master confere a Definição de Pronto; pendências da HIS-002/HIS-003 no `contexto.md`.

## 2026-10-29 · criação da equipe
- O que fiz: Documentação do sistema organizada em docs/sistema/ e documento de apresentação para ONGs e órgãos públicos.
- Próximos passos: ver "Pendências" em `contexto.md`.

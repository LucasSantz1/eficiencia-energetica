# Diário · Documentação

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## 2026-11-03 · HIS-002b · lint e camadas documentados

- Apliquei a lista do D17: verificador de camadas reescrito (ESLint, script, casos), saída nova, sem "Limites conhecidos", mapa de pastas.
- `desenvolvimento.md`: `pnpm lint`, `--fix`, comentários que desligam o lint, bloco provisório (sai na HIS-003a), check do CI.
- `README.md`, `CHANGELOG.md`, índice de ADRs. Links para HIS-109 e HIS-003a ficaram sem link: os arquivos ainda não existem.

## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-11-13 · HIS-112 · layout para computador documentado
- O que fiz: seção "Layout no computador" e linhas novas nas tabelas em `site.md`; linha no `guia-de-uso.md`; decisão sobre `useTelaLarga` em `arquitetura.md`; CHANGELOG.
- Decisões: conferi no código o desvio do L3 (lateral sem `lateral-fixa`) e o A-112-1 (Mês a mês sob os cômodos). Sem entrada da HIS-110 no CHANGELOG, pus a da 112 no topo.
- Arquivos: os quatro acima, a nota na história e este diário.
- Próximos passos: se a HIS-110 entrar, ficar acima da 112.

## 2026-11-13 · HIS-003a · dados quebrados não travam o site documentado
- O que fiz: seção sobre dados ilegíveis, trava, `casa-ilegivel` e telas de erro em `privacidade-e-seguranca.md`; T1 a T4 no `guia-de-uso.md`; conferência de formato e os dois jobs em `dados.md`; "Leitura segura" em `arquitetura.md`; `desenvolvimento.md` (audit, Dependabot, specs novos); CHANGELOG.
- Decisões e porquê: teto da HIS-109 documentado como 7 (decisão do tech-lead, não 8 como eu tinha anotado); contagens reconferidas (85 arquivos, 152 testes de camadas, 210 e2e). O `site.md` ficou de fora do pedido e segue pendente.
- Arquivos: os acima, a história, `contexto.md`, este diário.
- Próximos passos: `site.md`; CHANGELOG da 111 e da 002b, se o scrum-master quiser.

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

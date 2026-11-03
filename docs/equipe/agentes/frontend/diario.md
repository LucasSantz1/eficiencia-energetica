# Diário · Front-end

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-11-03 · HIS-003a · D10: só o global-error, CAMPOS_* puros e a trava que solta
- O que fiz: `3f60fe4` (sem `app/error.tsx`, T3 conferido com o `global-error`), `040ddd4` (`/* @__PURE__ */`, −249 B),
  `1b235d5` ("Apagar tudo" e cadastro novo soltam a trava; cópia bruta uma vez só; 5 testes).
- Verificação: barreira verde; peso 11a até +10 382 B (teto +10,5 kB); e2e 106 ✓, só o peso ✗ (o qa atualiza no a7).
- Aprendizado: ler o `document.title` depois do retry mede a tela que voltou, não a de erro: medir no momento certo.

## 2026-11-03 · HIS-003a · a4 e a5: casa salva e /dados validados, avisos T1/T2, telas de erro e cabeçalhos
- O que fiz: a4 `9be1f4c` (armazenamento seguro, `merge`, trava de gravação do pedido 1, ações pelo leitor, `/dados`
  pelos leitores, servidor sem `catch`, vitest no site) e a5 `017281f` (T1 ×3, T1b, T2 ×3, T3, T4, foco, `rel`, D6).
- Decisões e porquê: `carregando` derivado da chave (caminho + tentativa), sem `setState` síncrono no efeito; 2ª falha
  do T3 por instante guardado no módulo (funciona com ou sem remontagem, conferido); telas de toda rota sem `Botao`,
  `lucide` e `next/link` no erro (o peso mostrou cada uma levando o módulo inteiro).
- Verificação: barreira verde; e2e (3351) 106 ✓ e só o peso ✗; roteiro avulso em 390/1280 com capturas.
- Aprendizado: medir o peso por pedaço (`gzip` dos `<script>` do HTML) mostra na hora qual import puxa o quê. E, para
  forçar erro no `Intl`, chamar o getter original pelo descritor.
- Arquivos: ver o contexto (linha HIS-003a), a história e este diário.
- Próximos passos: tech-lead decide o peso; qa no a7; seguranca nos R1–R13.

## 2026-10-30 · HIS-002 · D-A5-1 e D-A5-2: nome do "Quem mais gasta" e Tab na tabela do painel geral
- O que fiz: commit `92e9fd9`. Coloquei o `aria-label` da ux nos 6 botões do ranking, com `{" "}` entre os blocos, e
  `role="region"`, nome e `tabIndex={0}` na região rolável da tabela do painel geral.
- Decisões e porquê: tela e nome saem das mesmas variáveis, para nunca divergirem. A quantidade continua condicionada
  a `quantidade > 1`, sem `{"" && …}`.
- Verificação: controle e depois, 0 px em 390/1280 (`/casa` e `?visao=geral`); axe sem os 2 defeitos; o Tab chega à
  tabela e as setas rolam (rolagem suave: medir depois de esperar); e2e 106 ✓ / 6 pendentes / 1 ✗ (seletor antigo em
  `aparelhos.spec.ts:43`, do qa; com o seletor novo, numa cópia, passa).
- Aprendizado: mudar um nome acessível pode quebrar seletores do e2e que dependem dele. Procurar o nome antigo em
  `e2e/` antes de mudar.
- Arquivos: `PainelAcompanhamento.tsx`, `TelaComodos.tsx`, a história, este diário, `contexto.md`.
- Próximos passos: o qa ajusta o seletor e fecha o A5.

## 2026-10-30 · HIS-002 · A5 da 002a: nomes da casa ilustrada e `<dl>` da Tarifa Social, sem mudança visível
- O que fiz: commit `b0bff1c` — `aria-label` dos 5 cômodos com o modelo da ux (com o `reais()` local, U+00A0) e o
  `<p>` do CRAS fora do `<dl>` (div com grade `gap-6` em volta, `<dl>` com a mesma grade).
- Decisões e porquê: `{" "}` entre o nome e a porcentagem, porque o axe junta o texto dos filhos sem espaço e o nome
  novo sozinho não zerava a regra (medido); `display: contents` recusado (risco de perder a semântica).
- Verificação: cópias próprias antes × depois (portas 3121/3122): 0 pixel diferente em 390/1280 px, sem e com casa,
  depois de validar o comparador com controle; nomes pela árvore do Chromium (CDP) e pelo seletor do D16; axe sem
  `definition-list` e `label-content-name-mismatch`; typecheck e test verdes.
- Aprendizado: a captura da `/` não é determinística sem parar animações e esperar a `Contagem`; o relógio fixo do
  Playwright trava a `Contagem`. Validar o comparador com controle antes de confiar (retro da HIS-001 de novo).
- Arquivos: `apps/web/src/funcionalidades/inicio/CasaIlustrada.tsx`, `PaginaInicial.tsx`, a história, este diário, `contexto.md`.
- Próximos passos: qa no A5; os 2 `dd` com contraste baixo vão para a conversa da HIS-110.

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

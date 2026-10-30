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

_(a retro completa é feita ao fim da sprint; abaixo, os aprendizados já consolidados por história)_

### HIS-001 · Camadas (consolidado pelo scrum-master em 2026-10-29, a partir das notas da equipe)

**O que funcionou**

- **Linha de base antes de mexer no código** (qa, passo 0): capturas, texto, "foto" do DOM, casa salva e peso de JS do
  `main`, guardados antes da primeira mudança. Sem isso, "igual a antes" seria opinião.
- **Comparação antes × depois determinística:** relógio fixo (29/10/2026 12:00, Brasília), fuso, idioma `pt-BR` e
  `crypto.randomUUID` trocado por contador; `reducedMotion: "reduce"` para os números animados pararem no valor final.
  Validar o comparador com uma execução de **controle** (mesmo build → "nada mudou") e um **teste negativo** (mudanças
  plantadas → todas acusadas) antes de confiar nele.
- **Peso de JS medido em duas partes:** (11a) o JS que o HTML da rota referencia — o que a página precisa para abrir,
  critério principal — e (11b) o total com prefetch. Medir só o total confundiu repetição de módulos baixada em segundo
  plano com página mais pesada. O Next 16 não mostra mais "First Load JS" no build.
- **Ameaças viram conferência com comando e resultado** (R1–R15): o seguranca escreveu na etapa 3 o que ia conferir na
  etapa 6, e o frontend já conferiu boa parte antes de entregar.
- **Casos negativos para o próprio verificador:** "tudo certo" lendo 0 arquivos é pior que nenhuma barreira. Os testes
  negativos do frontend acharam um erro na regex do desenho (`import(` com espaço).
- **Achado pré-existente não entra em história de refatoramento:** P1–P4, S2 e T3 foram registrados com destino
  (HIS-002, HIS-107, HIS-108) em vez de mudar o escopo; corrigir S2 ali anularia a comparação byte a byte e a revisão já feitas.

**O que melhorar**

- **Builds em paralelo no mesmo `apps/web/.next` derrubam o servidor de quem está testando** (o `next start` do qa caiu
  com "Could not find a production build"). Regra: cada papel compila e sobe o servidor numa **cópia própria** no seu
  scratchpad (`git archive HEAD` + `pnpm install --offline`), com porta própria, e libera com `fuser -k <porta>/tcp`.
- **Evidência no scratchpad some:** o que outra história vai usar (ex.: lista de casos negativos para o critério 7 da
  HIS-002) precisa estar escrito na história ou no repositório, não só num roteiro do scratchpad.
- **Conferir a expectativa no `main` antes de escrever a verificação:** `/casa/aparelhos` responde 200 com
  `NEXT_REDIRECT` no conteúdo (página estática), não 307; a expectativa errada do R9 só foi corrigida pelo qa.
- **Arquivo dividido some do `git diff -M`:** revisar movimentos com `git diff -M -C` (ou `--find-copies-harder`).
- **Nota "Estado atual" do `CLAUDE.md`** depende do dono do projeto: quando uma história muda o que o `CLAUDE.md`
  descreve, levar o texto proposto ao dono **antes** da etapa 9, para não ficar defasado.

# ADR-003 · Qualidade automática no CI: lint, camadas, navegador, acessibilidade e peso

- **Status:** proposto (vira "aceito" quando a HIS-002 fechar; depende da análise de ameaças da seguranca)
- **Data:** 2026-10-29
- **Responsável:** tech-lead, com qa e seguranca

## Contexto

Até a HIS-001 o CI fazia typecheck (com o `scripts/verificar-camadas.mjs`), testes de unidade e build. Os testes no
navegador eram roteiros soltos do qa (`apps/web/e2e-base/`), e o peso de JS era medido à mão. O Next 16 tirou o
`next lint`, e o `next build` não roda mais lint. Toda história daqui para a frente precisa das mesmas barreiras.
Detalhes e medições: HIS-002, "Desenho técnico definitivo" (D1–D15).

## Decisão

1. **ESLint (configuração plana na raiz) e o script de camadas convivem, cada regra num lugar só.** O ESLint fica com o
   que se decide olhando o próprio arquivo (matriz do ADR-001 como lista do que pode, `../`, pacotes por camada,
   `require`, `"use server"`, `import()` dinâmico, `innerHTML`, `any`). O script fica com o que depende de outro arquivo
   ou da estrutura (diretiva do destino, `.servidor` e `server-only`, regra S2, pastas antigas, link simbólico, 0
   arquivos lidos) e lê os imports com o parser do `typescript`. Cada regra tem caso negativo automático
   (`scripts/testes/`), com controles.
2. **`import()` dinâmico e `"use server"` ficam proibidos** até existir regra própria (o primeiro quando precisar dividir
   código, ex.: OCR; o segundo no E4, com a seguranca).
3. **e2e com Playwright em todo pull request e todo push no `main`**, nos projetos `celular` (390×844) e `computador`
   (1280×900), contra o build de produção, falhando em erro de console, sem repetir teste que falha (`retries: 0`). A
   versão do `@playwright/test` casa com o Chromium que o ambiente de nuvem já tem, para o resultado ser o mesmo no
   computador e no CI. Os dois checks são obrigatórios para integrar.
4. **axe nas páginas principais, com e sem casa salva:** violação séria ou crítica falha. A única saída para uma violação
   que exige mudança visível é uma exceção **por elemento**, com a história que corrige, revisada pela
   `ux-acessibilidade`; exceção que não casa mais com nada também falha.
5. **Peso de JS com referência no repositório** (`apps/web/e2e/peso-js.json`): JS que o HTML referencia (sem `noModule`,
   gzip) até +1 024 B por rota e total com prefetch até +2 048 B. A referência só muda de propósito, num PR que explica
   o porquê; o CI nunca a atualiza.
6. **Artefato do job** com relatório, capturas e traces em toda execução não cancelada, por 14 dias, só com dados
   inventados de teste.

## Alternativas consideradas

- **Só ESLint (tirar o script):** o ESLint olha um arquivo por vez e não sabe a diretiva do arquivo importado; a regra S2
  e o `.servidor` exigiriam um plugin próprio que lê outros arquivos — mais código para manter que o script.
- **Só o script (sem ESLint):** regex não lê sintaxe; as lacunas S1 da HIS-001 mostraram o limite.
- **e2e em todo push de qualquer branch:** dobra as execuções sem ganho (o trabalho chega ao `main` só por PR).
- **e2e só no `main`:** o defeito seria achado depois de integrar.
- **Comparar o peso compilando o `main` no CI:** o dobro do tempo de build em todo PR.
- **Testes visuais por pixel:** frágeis entre máquinas; fora do escopo do produto agora.

## Consequências

- O CI passa de ~35 s para ~4 min de parede (dois jobs em paralelo), dentro dos minutos gratuitos.
- ~300 pacotes de desenvolvimento a mais (árvore do `eslint-config-next` e Playwright): nenhum vai para o navegador; o
  `pnpm audit` e o portão de peso conferem.
- Subir o Playwright exige o mesmo navegador no ambiente de nuvem; subir o ESLint exige rodar os casos negativos.
- Toda regra nova de camadas ou de segurança entra com caso negativo na tabela de `scripts/testes/`.
- Toda história de interface ganha teste no navegador em vez de roteiro solto; mudança de peso de JS é visível no PR.

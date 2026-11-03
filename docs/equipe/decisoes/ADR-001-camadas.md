# ADR-001 · Arquitetura em camadas

- **Status:** aceito
- **Data:** 2026-10-29 (revisado em 2026-11-03, HIS-002b: onde cada regra é conferida)
- **Responsável:** tech-lead

## Contexto

O site cresceu rápido (cadastro, cômodos, acompanhamento, plano de economia, animações) e quase todo o código de interface
está em `components/` e `lib/`. Vêm aí funções grandes — offline, conta e sincronização, câmera, app de celular — que
precisam reaproveitar regras sem duplicar e sem acoplar a interface ao armazenamento.

## Decisão

Organizar em camadas com dependência **só para baixo**:

```
app/                 rotas finas: montam a tela com funcionalidades; sem regra de negócio
funcionalidades/X/   telas e hooks de uma funcionalidade; não importa outra funcionalidade
ui/                  componentes genéricos, sem store e sem regra de negócio
aplicacao/           casos de uso que juntam domínio + infraestrutura (ex.: useResumo)
infraestrutura/      dados públicos, armazenamento local, Supabase, validação de fronteira
config/              chaves de recursos e constantes
@ee/core             domínio puro (cálculos, catálogo, dicas, regras), testado
```

Regras:

1. `app` → `funcionalidades`, `ui`, `aplicacao`, `config`.
2. `funcionalidades/X` → `ui`, `aplicacao`, `config`, `@ee/core` (nunca `funcionalidades/Y` nem `infraestrutura` direto).
3. `aplicacao` → `infraestrutura`, `@ee/core`, `config`.
4. `ui` → `@ee/core` (tipos, formatação e funções puras de catálogo e cálculo para exibição), `config`. Nunca estado,
   armazenamento ou rede. _(Revisada em 2026-10-29, HIS-001: antes dizia "só tipos e formatação"; ver Consequências.)_
5. `infraestrutura` → `@ee/core`, `config`.
6. `@ee/core` não importa nada do site, nem React, rede ou armazenamento.

Desde a HIS-002b (2026-11-03), as regras são conferidas em dois lugares, cada regra num lugar só (ADR-003):

- **ESLint** (`eslint.config.mjs`, `pnpm lint`): o que se decide olhando só o próprio arquivo — a matriz acima
  (`no-restricted-imports` por camada, com lista do que é permitido: pasta nova ou antiga já nasce proibida), sem `../`,
  `zustand` só em `infraestrutura`, módulos do Node só em `infraestrutura/**/*.servidor.ts`, `server-only` só em
  `*.servidor.ts`, domínio só com `./`, e a sintaxe proibida (`require`, `import()`, `"use server"`, HTML a partir de texto).
- **Script** (`scripts/verificar-camadas.mjs`, com o parser do TypeScript, dentro do `pnpm typecheck`): o que depende de
  outro arquivo ou da estrutura — `"use client"` não importa `.servidor`; todo `.servidor` começa com `import
  "server-only";`; arquivo sem diretiva só traz **componentes** (e tipos) de um módulo `"use client"` (S2); destino do
  import existe; pastas antigas, arquivo fora das camadas, link simbólico e 0 arquivos lidos são erro; e nenhum
  comentário que muda regra do ESLint, salvo a forma da HIS-109 (C10), para que a barreira não se desligue por comentário.

Os casos negativos de cada regra estão em `scripts/testes/casos-de-camadas.mjs` e rodam no `pnpm test`.

## Alternativas consideradas

- **Manter `components/` + `lib/`:** simples hoje, mas mistura responsabilidades e dificulta o app e a sincronização.
- **Feature-sliced design completo:** mais camadas do que o projeto precisa agora; mais difícil para quem chega.

## Consequências

- Mais pastas, mas cada arquivo tem um lugar óbvio.
- Componentes usados por mais de uma funcionalidade sobem para `ui/` e recebem dados por props.
- **Componentes de domínio compartilhados** (decisão da HIS-001, 2026-10-29) ficam em `ui/<assunto>/` — o primeiro é
  `ui/aparelho/` (linha de aparelho, iluminação, perguntas de uso, catálogo, editor de aparelho). Eles podem chamar
  funções puras do `@ee/core` (ex.: `itemDoCatalogo`, `consumoMensalKwh`, `aplicarVariantes`), porque o core é puro e
  testado e chamá-lo evita duplicar regra; mas não leem estado: dados entram por props e mudanças saem por callbacks.
  Alternativa rejeitada: deixá-los numa funcionalidade com `index.ts` público, o que faria outras funcionalidades
  importarem aquela e acoplaria as telas.
- **`aplicacao/` é a única porta para `infraestrutura/`.** Mesmo quando é só reexportação (`useCasa`, `useCasaCarregada`,
  `useTarifas`, `useMunicipios`, `novoId`), as telas importam de `aplicacao/`. Quando a ligação com a casa se repete em
  várias telas, ela vira um hook em `aplicacao/` (ex.: `useEdicaoDeAparelho`). É ali que a sincronização com o servidor
  vai entrar (E4) sem mudar as telas.
- **Código só de servidor:** `node:fs` e afins só aparecem em `infraestrutura/**/*.servidor.ts`; quem depende deles
  também termina em `.servidor.ts` (ex.: `aplicacao/numeros-do-inicio.servidor.ts`) e tem `import "server-only";` como
  primeiro import (o Next trata esse import sem pacote novo e falha o build se o arquivo chegar ao navegador). Um arquivo
  com `"use client"` nunca importa um `.servidor`.
- **Valor compartilhado entre servidor e cliente mora em arquivo sem diretiva** (HIS-002b, critério 8): quem não tem
  `"use client"` e importa um valor de um módulo `"use client"` recebe só uma referência de cliente, não o valor. Por
  isso as constantes de transição ficam em `ui/tiposDeTransicao.ts` e o `novoId` em `aplicacao/identificador.ts`.
- **Sem barris `index.ts`:** importa-se o arquivo direto, para não misturar módulos cliente e servidor nem atrapalhar o
  tree-shaking. Imports entre pastas usam `@/`; `./` só dentro da mesma pasta.
- O app Expo reaproveita `@ee/core` e copia a mesma organização.

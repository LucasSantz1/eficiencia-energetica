# ADR-001 · Arquitetura em camadas

- **Status:** aceito
- **Data:** 2026-10-29
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

As regras são verificadas pelo script `scripts/verificar-camadas.mjs`, que roda dentro do `pnpm typecheck` (e, por isso,
no CI) desde a HIS-001. Na HIS-002 decide-se se o `no-restricted-imports` do ESLint substitui o script ou convive com ele.

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
- **Sem barris `index.ts`:** importa-se o arquivo direto, para não misturar módulos cliente e servidor nem atrapalhar o
  tree-shaking. Imports entre pastas usam `@/`; `./` só dentro da mesma pasta.
- O app Expo reaproveita `@ee/core` e copia a mesma organização.

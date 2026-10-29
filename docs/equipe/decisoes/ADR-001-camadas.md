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
4. `ui` → `@ee/core` (só tipos e formatação), `config`.
5. `infraestrutura` → `@ee/core`, `config`.
6. `@ee/core` não importa nada do site, nem React, rede ou armazenamento.

As regras são verificadas no CI com `no-restricted-imports` do ESLint (HIS-002).

## Alternativas consideradas

- **Manter `components/` + `lib/`:** simples hoje, mas mistura responsabilidades e dificulta o app e a sincronização.
- **Feature-sliced design completo:** mais camadas do que o projeto precisa agora; mais difícil para quem chega.

## Consequências

- Mais pastas, mas cada arquivo tem um lugar óbvio.
- Componentes usados por mais de uma funcionalidade sobem para `ui/` e recebem dados por props.
- O app Expo reaproveita `@ee/core` e copia a mesma organização.

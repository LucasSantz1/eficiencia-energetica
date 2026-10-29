# Arquitetura

## Visão geral

```
            ANEEL (dados abertos)   IBGE (cópia local)
                       │                 │
                       ▼                 ▼
          packages/dados  ── rotina diária (GitHub Actions) ──┐
                                                              ▼
                                  apps/web/public/dados/*.json (commit no main)
                                                              │
                     Vercel faz o deploy a cada commit ───────┤
                                                              ▼
   Navegador da pessoa ── lê /dados ── calcula com @ee/core ── guarda a casa no localStorage
```

Hoje não existe servidor próprio nem banco: todo dado da casa fica no aparelho da pessoa. A conta opcional
(Supabase) entra no épico E4 e só envia dados com o consentimento da pessoa.

## Pacotes

| Pacote | Responsabilidade | Depende de |
| --- | --- | --- |
| `packages/core` (`@ee/core`) | Domínio: tipos, cálculos de consumo e custo, catálogo de aparelhos e variantes, cômodos, dicas e plano, Tarifa Social, consumo mínimo, formatação | nada |
| `packages/dados` | Baixar, ler, cruzar e validar os dados da ANEEL/IBGE e gravar os JSON públicos | `@ee/core` (tipos) |
| `apps/web` (`@ee/web`) | Site Next.js | `@ee/core` |
| `apps/mobile` (futuro) | App Expo | `@ee/core` |

## Camadas do site

Decisão no [ADR-001](equipe/decisoes/ADR-001-camadas.md). A migração do código atual (`components/`, `lib/`) para as
pastas abaixo é a história [HIS-001](equipe/historias/HIS-001-camadas.md).

```
src/app/              rotas: /, /comecar, /casa, /casa/comodos, /casa/dicas, /casa/ajustes, /sobre
src/funcionalidades/  cadastro, inicio, acompanhamento, comodos, dicas, ajustes
src/ui/               Botao, Opcao, Pilulas, Contador, Campo, Folha, Aviso, Icone, Movimento, Barras, Etiqueta, Casca
src/aplicacao/        useResumo, ações da casa usadas pelas telas
src/infraestrutura/   dados públicos (/dados), armazenamento local (Zustand persist), validação de fronteira
src/config/           RECURSOS (chaves de funções)
```

## Dados públicos

| Arquivo | Conteúdo |
| --- | --- |
| `/dados/tarifas.json` | distribuidoras (tarifa B1 vigente em R$/kWh, nome, UFs), bandeiras por mês e adicional, data de atualização |
| `/dados/municipios/{UF}.json` | municípios do estado e as distribuidoras de cada um, da que atende mais para a que atende menos |

A página inicial é estática e se atualiza uma vez por dia (`revalidate = 86400`).

## Estado local

`useCasa` (Zustand 5 com `persist`, chave no localStorage, `version` 2 com `migrate`): residência, cômodos, aparelhos,
contas mensais, leituras do relógio e plano de economia. Qualquer mudança de formato exige versão nova e migração testada.

## Movimento

Transições de página com `<ViewTransition>` do React 19.3 e `transitionTypes` do Next 16 (`nav-forward`, `nav-back`,
`entrar-painel`), cabeçalho e navegação fixos durante a troca, e utilidades CSS (`surgir`, `cresce-x`, `revelar`...).
Tudo desligado com `prefers-reduced-motion`.

## Segurança

Regras obrigatórias no [`CLAUDE.md`](../CLAUDE.md#segurança-obrigatório). Base de segurança do site na história
[HIS-003](equipe/historias/HIS-003-base-de-seguranca.md).

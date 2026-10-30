# HIS-001 · Reorganizar o site em camadas

| Campo | Valor |
| --- | --- |
| Épico | E0 · Fundação |
| Sprint | 0 |
| Tamanho | M |
| Papéis principais | tech-lead, frontend |
| Status | Preparada |
| Branch | `his-001-camadas` |

## Problema e valor

Como **equipe**, queremos **o código do site organizado em camadas com responsabilidades claras** para **adicionar as
próximas funções (offline, conta, câmera, app) sem quebrar o que já funciona para as famílias**.

Hoje quase tudo está em `components/` e `lib/`, misturando componentes genéricos, telas de funcionalidade,
acesso a dados e estado. Isso dificulta revisar, testar e reaproveitar no app.

## Critérios de aceite

1. **Dado** o código atual, **quando** a reorganização terminar, **então** os arquivos estão em `app/` (rotas finas),
   `funcionalidades/<nome>/`, `ui/`, `aplicacao/`, `infraestrutura/` e `config/`, conforme o ADR-001.
2. **Dado** qualquer arquivo de `funcionalidades/<a>/`, **quando** se olha os imports, **então** ele não importa nada de
   `funcionalidades/<b>/` (verificado por regra automática ou script no CI).
3. **Dado** `ui/` e `infraestrutura/`, **quando** se olha os imports, **então** eles não importam de `funcionalidades/` nem de `app/`.
4. **Dado** uma casa salva no navegador pela versão atual (persist versão 2), **quando** o site novo abre, **então** a casa
   aparece igual, sem perder nada.
5. **Dado** o fluxo completo (cadastro → acompanhamento → cômodos → dicas → minha casa), **quando** percorrido em 390 px e
   1280 px, **então** a aparência e o comportamento são iguais aos de antes, sem erro no console e com as transições funcionando.
6. `pnpm typecheck`, `pnpm test` e `pnpm build` passam.

## Fora do escopo

- Mudança visual ou de texto.
- Mudar o formato salvo no navegador.
- Novas funcionalidades.

## Desenho técnico

_(tech-lead, 2026-10-29 — definitivo. Base: `main` em `57700ab`, `pnpm typecheck` verde. Todos os caminhos abaixo são
relativos a `apps/web/src/`, salvo quando dito.)_

### 1. Mapa de quem importa quem hoje (resumo do grep)

- `lib/store.ts` (`useCasa`, `useCasaCarregada`, `novoId`) é importado por 4 telas de `app/`, por `Cadastro.tsx` e por
  5 componentes (`Casca`, `BotaoComecar`, `Acompanhamento`, `EditorAparelho`, e `lib/rascunho.ts`).
- `lib/resumo.ts` é importado por 4 telas, `Cadastro`, `Casca` e `Simulador`; `lib/dados.ts` por `resumo`, `Cadastro`,
  `ajustes` e `Simulador`.
- Usados por **mais de uma** tela (o ponto da pergunta aberta):
  - `Comodo.tsx` (`LinhaAparelho`, `BlocoIluminacao`, `horasPorDiaTexto`, `ItemComodo`): cadastro **e** cômodos;
    `descreverUso`: acompanhamento (`app/casa/page.tsx`).
  - `SeletorCatalogo.tsx`: cadastro e cômodos. `TempoUso.tsx`: via `LinhaAparelho` e `EditorAparelho`.
  - `EditorAparelho.tsx`: acompanhamento **e** cômodos — e ele lê e grava no store direto.
  - `BuscaCidade.tsx`: cadastro e ajustes.
- `lib/rascunho.ts` importa o tipo `ItemComodo` de um componente (`components/Comodo`), dependência para cima.
- `app/page.tsx` lê arquivos do disco (`node:fs`) dentro da rota. Ninguém usa o `export type { LeituraRelogio }` de `Acompanhamento.tsx`.

### 2. Decisões

1. **Componentes compartilhados de aparelho vão para `ui/aparelho/`** (resposta à pergunta aberta). Ficam sem store:
   dados entram por props e mudanças saem por callbacks. Não ficam em `funcionalidades/comodos/` com `index.ts` público
   porque o cadastro **e** o acompanhamento passariam a importar `comodos` — três arestas entre funcionalidades, e
   qualquer mudança na tela de cômodos quebraria o cadastro.
2. **`ui/` pode chamar funções puras do `@ee/core`** (catálogo, `consumoMensalKwh`, `aplicarVariantes`, `BANDEIRAS`,
   formatação). O core é puro e testado; chamá-lo evita duplicar regra. O que `ui/` nunca faz: ler estado, armazenamento
   ou rede, nem importar `aplicacao/`, `infraestrutura/`, `funcionalidades/` ou `app/`. (ADR-001 regra 4 revisada.)
3. **`aplicacao/` é a única porta para `infraestrutura/`.** As telas importam `useCasa`, `useCasaCarregada`, `useResumo`,
   `useTarifas`, `useMunicipios` e `novoId` de `aplicacao/`. Hoje parte disso é só reexportação; é aí que a sincronização
   com o Supabase vai entrar (E4) sem mexer nas telas.
4. **`EditorAparelho` deixa de usar o store.** Recebe `comodos`, `aoSalvar` e `aoRemover`. Quem liga o editor à casa é o
   hook `useEdicaoDeAparelho()` em `aplicacao/casa.ts`, usado pelo acompanhamento e pelos cômodos (sem duplicar a ligação).
5. **`Casca` vira a funcionalidade `funcionalidades/casca/`**, não `ui/`: ela lê a casa (cidade, carregamento, "Vamos
   cadastrar") e a rota atual. Só `app/casa/layout.tsx` a usa.
6. **Arquivos só de servidor terminam em `.servidor.ts`** (leitura de `public/dados` com `node:fs` para a página inicial).
   Arquivo com `"use client"` nunca importa um `.servidor`.
7. **Sem barris (`index.ts`).** Importa-se o arquivo direto (`@/ui/Botao`). Motivo: barris misturam módulos cliente e
   servidor, atrapalham o tree-shaking (o pacote não declara `sideEffects`) e escondem de onde vem cada import.
   Isso substitui o `ui/index.ts` da proposta inicial.
8. **Alias:** continua só `@/*` → `./src/*` (`apps/web/tsconfig.json`), sem alias novo. Import entre pastas diferentes
   sempre com `@/` (`@/ui/Botao`, `@/aplicacao/casa`, `@/funcionalidades/inicio/Simulador`); `./` só dentro da mesma pasta.
9. **Mudança mínima de código.** Arquivos se movem com `git mv` e só mudam os imports, exceto: a divisão de `ui.tsx`,
   `Comodo.tsx` e `lib/store.ts`; as props do `EditorAparelho`; a leitura de disco da página inicial; o corpo das
   rotas indo para `funcionalidades/`; e a remoção do `export type { LeituraRelogio }` morto em `Acompanhamento.tsx`.
   Telas grandes (`Cadastro`, `TelaComodos`) **não** são divididas nesta história: assim o `git diff -M` mostra
   renomeação + imports e a revisão fica segura. Nada de renomear funções, ids, classes ou textos.

### 3. Tabela completa: arquivo atual → destino

`uc` = o arquivo começa com `"use client";` (primeira linha, antes dos imports). Quem tinha continua tendo; arquivo
novo que define ou reexporta hook/componente interativo também tem. `sem` = sem diretiva.

| Hoje | Destino | Diretiva | O que muda além do caminho |
| --- | --- | --- | --- |
| `components/ui.tsx` | **dividido:** `ui/Botao.tsx` (`Botao`, `BotaoLink`, `Variante`, `estilosBotao`, `baseBotao`), `ui/Opcao.tsx`, `ui/Pilulas.tsx`, `ui/Contador.tsx`, `ui/Campo.tsx`, `ui/Entrada.tsx`, `ui/Folha.tsx`, `ui/Aviso.tsx` | uc em todos | cada arquivo leva só os imports que usa (`Check` → Opcao; `Minus`/`Plus` → Contador; `Link` → Botao; `useEffect`/`useRef` → Folha) |
| `components/Icone.tsx` | `ui/Icone.tsx` | sem | — |
| `components/Marca.tsx` | `ui/Marca.tsx` | sem | — |
| `components/Movimento.tsx` | `ui/Movimento.tsx` | uc | — (continua um arquivo: tudo é movimento) |
| `components/Barras.tsx` | `ui/Barras.tsx` | uc | — |
| `components/Etiqueta.tsx` | `ui/Etiqueta.tsx` | sem | — |
| `components/EspacoReservado.tsx` | `ui/EspacoReservado.tsx` | sem | — |
| `components/BuscaCidade.tsx` | `ui/BuscaCidade.tsx` | uc | — |
| `components/Comodo.tsx` | **dividido:** `ui/aparelho/tipos.ts` (`ItemComodo`), `ui/aparelho/textosDeUso.ts` (`descreverUso`, `horasPorDiaTexto`), `ui/aparelho/LinhaAparelho.tsx`, `ui/aparelho/BlocoIluminacao.tsx` (com `TIPOS` e `HORAS_LUZ`) | tipos/textos: sem; componentes: uc | — |
| `components/TempoUso.tsx` | `ui/aparelho/TempoUso.tsx` | uc | — |
| `components/SeletorCatalogo.tsx` | `ui/aparelho/SeletorCatalogo.tsx` | uc | — |
| `components/EditorAparelho.tsx` | `ui/aparelho/EditorAparelho.tsx` | uc | sem `useCasa`; props novas (contrato 4.3) |
| `components/Casca.tsx` | `funcionalidades/casca/Casca.tsx` | uc | imports de `aplicacao/` |
| `components/Acompanhamento.tsx` | `funcionalidades/acompanhamento/Acompanhamento.tsx` | uc | remove a última linha `export type { LeituraRelogio };` (ninguém usa) |
| `components/BotaoComecar.tsx` | `funcionalidades/inicio/BotaoComecar.tsx` | uc | — |
| `components/Simulador.tsx` | `funcionalidades/inicio/Simulador.tsx` | uc | — |
| `components/inicio/CasaIlustrada.tsx` | `funcionalidades/inicio/CasaIlustrada.tsx` | uc | — |
| `lib/store.ts` | **dividido:** `infraestrutura/armazenamento/casa.ts` (`DadosCasa`, `Acoes`, `nomeDoComodo`, `useCasa`, `useCasaCarregada` — byte a byte) + `infraestrutura/identificador.ts` (`novoId`) | casa: uc; identificador: sem | `casa.ts` passa a importar `novoId` de `@/infraestrutura/identificador` |
| `lib/dados.ts` | `infraestrutura/dados-publicos/navegador.ts` | uc | — |
| `lib/resumo.ts` | `aplicacao/resumo.ts` | uc | importa `useTarifas` de `@/infraestrutura/dados-publicos/navegador` e `useCasa` de `@/infraestrutura/armazenamento/casa` |
| `lib/rascunho.ts` | `funcionalidades/cadastro/rascunho.ts` | sem | `ItemComodo` de `@/ui/aparelho/tipos`; `novoId` de `@/aplicacao/casa` |
| `app/comecar/Cadastro.tsx` | `funcionalidades/cadastro/Cadastro.tsx` | uc | `./rascunho` continua relativo |
| `app/page.tsx` | corpo → `funcionalidades/inicio/PaginaInicial.tsx` (JSX, `RANKING`, `PERGUNTAS`, `RevelarBandeira`, recebe `numeros` por prop); leitura de disco → `infraestrutura/dados-publicos/arquivos.servidor.ts`; `numerosReais()` → `aplicacao/numeros-do-inicio.servidor.ts` (`carregarNumerosDoInicio`) | **sem em todos** (servidor) | a rota fica fina e **mantém** `export const revalidate = 86400` |
| `app/casa/page.tsx` | corpo → `funcionalidades/acompanhamento/PainelAcompanhamento.tsx` (com `COR_FAIXA`) | uc | `EditorAparelho` ligado por `useEdicaoDeAparelho()` |
| `app/casa/comodos/page.tsx` | corpo → `funcionalidades/comodos/TelaComodos.tsx` (`Comodos` vira `export function TelaComodos`; `CartaoComodo`, `PainelGeral`, `Numero`, `NovoComodo`, `EditarComodo` ficam no arquivo) | uc | idem `EditorAparelho` |
| `app/casa/dicas/page.tsx` | corpo → `funcionalidades/dicas/TelaDicas.tsx` (`Dicas` → `TelaDicas`, com `CartaoDica`) | uc | — |
| `app/casa/ajustes/page.tsx` | corpo → `funcionalidades/ajustes/TelaAjustes.tsx` (`Ajustes` → `TelaAjustes`, com `Secao`, `TrocarCidade`, `BENEFICIOS`, `LIGACOES`) | uc | — |
| — (novo) | `aplicacao/casa.ts`, `aplicacao/dados-publicos.ts` | uc | contratos 4.1 e 4.2 |
| `app/layout.tsx`, `app/manifest.ts`, `app/globals.css`, `app/icon.svg`, `app/casa/aparelhos/page.tsx`, `config/recursos.ts` | ficam | — | nada |
| `app/comecar/page.tsx`, `app/sobre/page.tsx`, `app/casa/layout.tsx` | ficam | sem | só os imports (`@/ui/Movimento`, `@/ui/Marca`, `@/funcionalidades/...`). `sobre` é conteúdo fixo sem estado: continua na rota |

Rotas finas (as quatro de `/casa/*` e `/`) **não** têm `"use client"`; são componentes de servidor que montam a tela:

```tsx
// app/casa/comodos/page.tsx (mesmo formato para page.tsx de /casa, /casa/dicas e /casa/ajustes)
import { TelaComodos } from "@/funcionalidades/comodos/TelaComodos";

export default function Pagina() {
  return <TelaComodos />;
}
```

```tsx
// app/page.tsx — segment config precisa ser exportado direto da rota (Next 16 sem cacheComponents)
import { carregarNumerosDoInicio } from "@/aplicacao/numeros-do-inicio.servidor";
import { PaginaInicial } from "@/funcionalidades/inicio/PaginaInicial";

// Os números da página vêm dos dados da ANEEL, que são atualizados todo dia.
export const revalidate = 86400;

export default async function Pagina() {
  return <PaginaInicial numeros={await carregarNumerosDoInicio()} />;
}
```

### 4. Contratos novos

**4.1 `aplicacao/casa.ts`** (uc)

```ts
import type { Aparelho, Comodo } from "@ee/core";
import { useCasa } from "@/infraestrutura/armazenamento/casa";

export { useCasa, useCasaCarregada, type DadosCasa } from "@/infraestrutura/armazenamento/casa";
export { novoId } from "@/infraestrutura/identificador";

export interface EdicaoDeAparelho {
  comodos: Comodo[];
  /** Com id, atualiza o aparelho; sem id, cria um novo. */
  salvar: (dados: Omit<Aparelho, "id">, id?: string) => void;
  remover: (id: string) => void;
}

/** Liga o editor de aparelho (ui/aparelho/EditorAparelho) à casa guardada no aparelho da pessoa. */
export function useEdicaoDeAparelho(): EdicaoDeAparelho {
  const comodos = useCasa((s) => s.comodos);
  const adicionarAparelho = useCasa((s) => s.adicionarAparelho);
  const atualizarAparelho = useCasa((s) => s.atualizarAparelho);
  const remover = useCasa((s) => s.removerAparelho);
  const salvar = (dados: Omit<Aparelho, "id">, id?: string) => {
    if (id) atualizarAparelho(id, dados);
    else adicionarAparelho(dados);
  };
  return { comodos, salvar, remover };
}
```

Só reexportação **nomeada** (`export { x } from`); `export *` não é aceito em módulo cliente do Next. Existe **um só**
`create(...)` do store (em `infraestrutura/armazenamento/casa.ts`); ninguém cria outro.

**4.2 `aplicacao/dados-publicos.ts`** (uc): `export { useMunicipios, useTarifas } from "@/infraestrutura/dados-publicos/navegador";`
`aplicacao/resumo.ts` mantém as exportações de hoje: `useResumo`, `tarifaMedia`, `nomeDistribuidora`.

**4.3 `ui/aparelho/EditorAparelho.tsx`** — props passam a ser:

```ts
{
  aparelho: Rascunho | undefined; aberto: boolean; aoFechar: () => void; preco: PrecoKwh;
  comodos: Comodo[];                                            // antes: useCasa((s) => s.comodos)
  aoSalvar: (dados: Omit<Aparelho, "id">, id?: string) => void; // antes: adicionarAparelho / atualizarAparelho
  aoRemover: (id: string) => void;                              // antes: removerAparelho
}
```

`salvar` continua montando `limpo` igual a hoje e chama `aoSalvar(limpo, id)` e depois `aoFechar()`; o botão
"Sim, remover" chama `aoRemover(r.id!)` e depois `aoFechar()`. Uso nas telas:

```tsx
const edicao = useEdicaoDeAparelho();
<EditorAparelho aparelho={...} aberto={...} aoFechar={...} preco={preco} comodos={edicao.comodos} aoSalvar={edicao.salvar} aoRemover={edicao.remover} />
```

**4.4 Página inicial (servidor)**

```ts
// infraestrutura/dados-publicos/arquivos.servidor.ts (sem diretiva) — único lugar com node:fs
import "server-only"; // primeiro import: o build falha se este arquivo chegar ao navegador
import type { ArquivoTarifas } from "@ee/core";
export interface RelatorioDados { municipios: number; municipiosSemDistribuidora: number }
export function lerTarifasPublicadas(): Promise<ArquivoTarifas>;  // lê public/dados/tarifas.json (process.cwd() na chamada)
export function lerRelatorioPublicado(): Promise<RelatorioDados>; // lê public/dados/relatorio.json
// Os `as` de hoje ficam aqui, na fronteira; a validação com zod entra na HIS-003.

// aplicacao/numeros-do-inicio.servidor.ts (sem diretiva)
import "server-only";
import type { BandeiraMes } from "@ee/core";
export interface NumerosDoInicio { distribuidoras: number; cidades: number; bandeira: BandeiraMes | undefined }
/** Igual ao numerosReais() de hoje: lê tarifas e depois relatório; qualquer erro devolve undefined. */
export function carregarNumerosDoInicio(): Promise<NumerosDoInicio | undefined>;

// funcionalidades/inicio/PaginaInicial.tsx (sem diretiva — componente de servidor)
export function PaginaInicial({ numeros }: { numeros: NumerosDoInicio | undefined }) { /* JSX de hoje */ }
// import type { NumerosDoInicio } from "@/aplicacao/numeros-do-inicio.servidor";
```

### 5. Estrutura final de pastas

```
apps/web/src/
├── app/                         rotas finas (sem estado, sem regra)
│   ├── layout.tsx  page.tsx  manifest.ts  globals.css  icon.svg
│   ├── comecar/page.tsx         sobre/page.tsx
│   └── casa/ layout.tsx  page.tsx  comodos/page.tsx  dicas/page.tsx  ajustes/page.tsx  aparelhos/page.tsx
├── funcionalidades/
│   ├── inicio/          PaginaInicial.tsx  BotaoComecar.tsx  Simulador.tsx  CasaIlustrada.tsx
│   ├── cadastro/        Cadastro.tsx  rascunho.ts
│   ├── casca/           Casca.tsx
│   ├── acompanhamento/  PainelAcompanhamento.tsx  Acompanhamento.tsx
│   ├── comodos/         TelaComodos.tsx
│   ├── dicas/           TelaDicas.tsx
│   └── ajustes/         TelaAjustes.tsx
├── ui/                  Botao  Opcao  Pilulas  Contador  Campo  Entrada  Folha  Aviso  Icone  Marca
│   │                    Movimento  Barras  Etiqueta  EspacoReservado  BuscaCidade   (.tsx)
│   └── aparelho/        tipos.ts  textosDeUso.ts  LinhaAparelho.tsx  BlocoIluminacao.tsx
│                        TempoUso.tsx  SeletorCatalogo.tsx  EditorAparelho.tsx
├── aplicacao/           casa.ts  resumo.ts  dados-publicos.ts  numeros-do-inicio.servidor.ts
├── infraestrutura/      identificador.ts
│   ├── armazenamento/   casa.ts
│   └── dados-publicos/  navegador.ts  arquivos.servidor.ts
└── config/              recursos.ts
```

`components/` e `lib/` deixam de existir.

### 6. Verificação de camadas até o ESLint (HIS-002)

Script **`scripts/verificar-camadas.mjs` na raiz do repositório**, Node 22 puro (`node:fs`, `node:path`, `node:module`),
sem dependência. _(Revisado em 2026-10-29 com os ajustes (a)–(f) do seguranca, ameaças A6, A13 e A14.)_

- **Raiz e arquivos lidos:** raiz = `path.resolve(import.meta.dirname, "..")` (funciona de qualquer `cwd`). Lê
  `apps/web/src/**/*.{ts,tsx,mts,mjs}` e `packages/core/src/**/*.ts`, com `readdirSync(..., { withFileTypes: true })`,
  **pulando links simbólicos**, `node_modules` e `.next`. Se qualquer uma das duas pastas render **0 arquivos** → erro
  "nenhum arquivo lido em <pasta>" e código 1.
- **Imports extraídos** (aceita import em várias linhas e `import type`):
  `/\bfrom\s+["']([^"']+)["']/g`, `/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g`, `/^\s*import\s+["']([^"']+)["']/gm`.
- **Proibidos em qualquer arquivo:** `/\brequire\s*\(/` (o projeto é ESM) e `import(` cujo argumento não é um texto fixo
  entre aspas (`/\bimport\s*\(\s*(?!["'][^"'`]+["']\s*\))/` — pega variável e template string) → erro "import que o
  verificador não consegue conferir". Texto parecido em comentário também acusa: preferimos o falso positivo.
- **Resolução:** `@/x` → `apps/web/src/x`; `./` e `../` → `path.resolve(pasta do arquivo, x)`; o resto é pacote externo.
- **Camada** = primeira pasta abaixo de `src/` (para `funcionalidades`, as duas primeiras): `app`,
  `funcionalidades/<nome>`, `ui`, `aplicacao`, `infraestrutura`, `config`. Erro "fora das camadas" quando o arquivo ou o
  destino resolvido: está em outra pasta (`components/`, `lib/`); fica solto em `src/` ou direto em `funcionalidades/`
  sem subpasta; ou fica **fora de `apps/web/src`** (ex.: `../../public/dados/tarifas.json`).
- **Regras** (destino interno permitido por origem; o resto é erro):

| Origem | Pode importar |
| --- | --- |
| `app` | `app`, qualquer `funcionalidades/*`, `ui`, `aplicacao`, `config` |
| `funcionalidades/X` | `funcionalidades/X` (a mesma), `ui`, `aplicacao`, `config` |
| `ui` | `ui`, `config` |
| `aplicacao` | `aplicacao`, `infraestrutura`, `config` |
| `infraestrutura` | `infraestrutura`, `config` |
| `config` | `config` |

- **Regras de pacote externo:**
  - `zustand` e `zustand/*` só em `infraestrutura`.
  - **Módulos do Node** = começa com `node:` **ou** está em `builtinModules` de `node:module` (inclui `fs/promises`,
    `child_process`, `os`, `crypto`, `url`…; comparar o nome inteiro e a parte antes da primeira `/`): só em
    `infraestrutura/**/*.servidor.ts`.
  - `server-only` só em arquivos `*.servidor.ts`, e **todo** `*.servidor.ts` precisa dele (próximo item).
  - `@ee/core`, `react`, `react-dom`, `next/*`, `lucide-react` em qualquer camada.
- **Cliente × servidor:**
  - Diretiva: tirar o BOM (`﻿`), pular espaços, comentários `//` e `/* */` do começo e conferir
    `/^["']use client["']\s*;?/`. Assim `'use client'` e diretiva depois de comentário contam.
  - Arquivo com `"use client"` não pode importar destino que case `/\.servidor(\.tsx?)?$/` (com ou sem extensão).
  - Todo arquivo `*.servidor.ts` tem `import "server-only";` como **primeiro import**. O Next 16 trata esse import
    internamente, sem pacote novo (`next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, "Preventing
    environment poisoning"; o módulo vem em `next/dist/compiled/server-only`), e falha o build se o arquivo chegar ao
    navegador **por qualquer caminho** — inclusive o indireto, que o script não vê.
- **Domínio (ADR-001 regra 6):** em `packages/core/src`, só import relativo (`./`); qualquer outro → erro.
- **Pastas antigas:** se `apps/web/src/components` ou `apps/web/src/lib` existir → erro "pasta antiga ainda existe".
- **O script é inofensivo (A14):** só lê arquivos; sem `child_process`, `eval`, `import()` dos arquivos lidos, rede ou
  escrita; sem `try/catch` que engula erro — qualquer exceção termina com código diferente de 0.
- **Saída:** uma linha por problema, ex.:
  `apps/web/src/ui/Botao.tsx → @/aplicacao/casa: ui não pode importar aplicacao (ADR-001, regra 4)`;
  no fim `N problema(s)` e código de saída 1; sem problemas, `Camadas: tudo certo (N arquivos)` e código 0.
- **Ligação:** no `package.json` da raiz, `"camadas": "node scripts/verificar-camadas.mjs"` (passo 1) e, no último passo,
  `"typecheck": "pnpm camadas && pnpm -r --if-present typecheck"`. O CI (`ci.yml`) já roda `pnpm typecheck`: não muda.
  Durante a migração, `pnpm camadas` falha listando o que falta mover — serve de lista de tarefas.
- **Fora do script (recusado, com motivo):** não seguimos imports **indiretos** (grafo completo cliente → … → servidor):
  o `server-only` já cobre isso no build com a mensagem do próprio Next, e um resolvedor de grafo deixaria o script grande.
  Também não interpretamos JavaScript (sem parser): regex + falso positivo é suficiente até o ESLint.
- Na HIS-002 decidimos se o ESLint `no-restricted-imports` substitui o script ou se os dois convivem.

### 7. O que NÃO muda

- **Formato salvo:** chave `eficiencia-energetica:casa`, `version: 2`, o mesmo `partialize` e o mesmo `migrate`. O código
  do store muda só de arquivo (o `novoId` sai para `identificador.ts` com o mesmo corpo).
- **Textos, classes, ids e visual:** nenhum caractere de JSX muda. Ids usados por âncora e acessibilidade (`comodo-<id>`,
  `titulo-*`, `busca-aparelho`, `busca-cidade`, `#conta`, `#ligacao`) ficam iguais.
- **Rotas e metadados:** as mesmas 8 rotas; `metadata` de `/comecar` e `/sobre` continua na rota; `revalidate` na `/`.
- **Movimento:** `viewTransitionName: "topo"` e `"navegacao"` e `<ViewTransition name="aba-ativa" | "pilula-ativa">`
  continuam na `Casca`; `TransicaoTela` continua envolvendo as mesmas árvores (na `/` ela fica dentro da `PaginaInicial`).
- **Dependências:** nenhuma nova. `next.config.ts`, `globals.css` (Tailwind 4 detecta as pastas novas sozinho) e CI iguais.

### 8. Ordem de execução (cada passo compila: `pnpm typecheck` verde no fim de cada um)

0. **QA, antes de tudo:** capturas, "fotos" do DOM e bytes de script por rota no `main` (ver seção 10).
1. Criar `scripts/verificar-camadas.mjs` (seção 6 inteira, inclusive os ajustes (a)–(f)) e o script `camadas` (ainda
   fora do `typecheck`). Antes de seguir, conferir os casos negativos da seção 10, item 7.
2. **`ui/` genérico:** dividir `ui.tsx`; `git mv` de Icone, Marca, Movimento, Barras, Etiqueta, EspacoReservado,
   BuscaCidade; corrigir imports em todos os arquivos.
3. **`infraestrutura/` + `aplicacao/`:** store, identificador, `navegador.ts`, `aplicacao/casa.ts` (por enquanto sem
   `useEdicaoDeAparelho`), `aplicacao/resumo.ts`, `aplicacao/dados-publicos.ts`. Trocar `@/lib/store` → `@/aplicacao/casa`,
   `@/lib/dados` → `@/aplicacao/dados-publicos`, `@/lib/resumo` → `@/aplicacao/resumo` (o `rascunho` ainda fica em `lib/`).
4. **`ui/aparelho/`:** dividir `Comodo.tsx`, mover TempoUso, SeletorCatalogo, EditorAparelho (props novas) e criar
   `useEdicaoDeAparelho`; ajustar `app/casa/page.tsx`, `app/casa/comodos/page.tsx`, `Cadastro.tsx` e `lib/rascunho.ts`.
5. **`funcionalidades/inicio/`** + `arquivos.servidor.ts` + `numeros-do-inicio.servidor.ts` (os dois com
   `import "server-only";` como primeiro import); `app/page.tsx` fino.
   Rodar `pnpm build` e conferir a `/` no manifesto de prerender e os bytes de script (seção 10, item 6).
6. **`funcionalidades/cadastro/`:** `Cadastro.tsx` e `rascunho.ts`; `lib/` some.
7. **`casca`, `acompanhamento`, `comodos`, `dicas`, `ajustes`;** rotas finas; `components/` some.
8. `pnpm camadas` verde → ligar no `typecheck`; `pnpm typecheck && pnpm test && pnpm build`; conferir com
   `grep -rn '@/components\|@/lib' apps/web/src` (tem que voltar vazio — retro: troca por script pode falhar em silêncio).

Sugestão para quem orquestra: um commit por passo (com `git mv`, para o histórico seguir cada arquivo).

### 9. Riscos e como evitar

| Risco | Como evitar |
| --- | --- |
| Import quebrado ou esquecido | `pnpm typecheck` a cada passo + `grep` do passo 8 + `pnpm camadas` |
| `"use client"` perdido ou fora do topo ao dividir arquivos (quebra hooks/onClick) | primeira linha de cada arquivo marcado `uc` na tabela; `pnpm build` acusa |
| `"use client"` posto por engano na `PaginaInicial` ou numa rota fina: a `/` inteira vira JavaScript no celular | tabela diz "sem"; comparar os bytes de script da `/` antes/depois (passo 5) |
| `node:fs` chegando ao navegador (erro de build) | só em `*.servidor.ts`; o script barra `"use client"` → `.servidor` (direto) e o `import "server-only"` barra no build qualquer caminho |
| `revalidate` movido para fora da rota (Next ignora em silêncio e a `/` para de atualizar) | fica em `app/page.tsx`; conferir no manifesto de prerender (seção 10, item 6) |
| Dois stores (casa "some" ao navegar) | um só `create` em `infraestrutura/armazenamento/casa.ts`; `aplicacao` só reexporta |
| Perda de dados salvos | store copiado byte a byte; QA testa casa salva na versão 2 e na versão 1 (seção 10) |
| Transições quebradas (cabeçalho piscando) | nomes de view transition intactos na `Casca`; QA navega entre as abas e confere |
| `export *` em módulo cliente (erro do Next) | só reexportação nomeada |
| Editor de aparelho salvando diferente | contrato 4.3 mantém a ordem salvar → fechar e remover → fechar |

### 10. Como verificar

```bash
pnpm camadas                       # "Camadas: tudo certo"
pnpm typecheck && pnpm test && pnpm build
grep -rn '@/components\|@/lib' apps/web/src     # vazio
ls apps/web/src                    # app aplicacao config funcionalidades infraestrutura ui
```

O QA compara **antes (main `57700ab`) × depois**, com o mesmo `tarifas.json` de `public/dados`:

1. **Capturas** em 390 px e 1280 px de `/`, `/comecar` (cada passo do cadastro), `/casa`, `/casa/comodos` (por cômodo
   e `?visao=geral`), `/casa/dicas`, `/casa/ajustes` e `/sobre`: têm que ser iguais.
2. **"Foto" do DOM:** com `reducedMotion: "reduce"` (os números animados param no valor final), salvar o `innerHTML` do
   `<body>` de cada rota com a mesma casa salva e comparar com `diff`. Diferença aceitável: nenhuma.
3. **Casa salva:** antes de abrir o site, gravar em `eficiencia-energetica:casa` um JSON `{"state": {...}, "version": 2}`
   com residência, 2+ cômodos, aparelhos (inclusive chuveiro com banho e geladeira por etiqueta), contas, leituras e
   plano. O site mostra tudo; depois de recarregar, o JSON guardado continua igual (comparar parseado). Repetir com
   `"version": 1` sem `contas`/`leituras`/`plano`: abre com as três listas vazias.
4. **Comportamento:** o fluxo inteiro (cadastro → acompanhamento → cômodos → dicas → minha casa), incluindo abrir o editor
   de aparelho pelo "Quem mais gasta" e pelos cômodos, salvar, remover, e "Apagar todos os meus dados". Console sem erro.
5. **Transições:** trocar de aba em `/casa/*` desliza; o topo e a navegação de baixo ficam parados.
6. **Peso e cache** (o Next 16 tirou o "First Load JS" da saída do build): a tabela de rotas do `pnpm build` tem as
   mesmas rotas; `node -e 'const r=require("./apps/web/.next/prerender-manifest.json").routes["/"];console.log(r.initialRevalidateSeconds,r.htmlSize)'`
   mostra `86400` e um `htmlSize` parecido com o de antes (hoje ≈ 66 kB); e, no Playwright, a soma de
   `performance.getEntriesByType("resource")` com `initiatorType === "script"` (`encodedBodySize`) em `/`, `/comecar` e
   `/casa` não cresce mais que 1 kB.
7. **Teste do próprio script:** um caso por vez (numa cópia ou revertendo depois), `pnpm camadas` tem que sair com 1 e
   a mensagem da regra: `ui/Botao.tsx` → `@/aplicacao/casa`; `funcionalidades/a` → `@/funcionalidades/b/X` e `../b/X`;
   funcionalidade → `@/infraestrutura/…`; `require("x")`; ``import(`@/${x}`)``; `'use client'` depois de um comentário
   importando `.servidor`; `fs`, `node:fs` e `child_process` fora de `.servidor`; `.servidor.ts` sem `server-only`;
   `zustand` fora de `infraestrutura`; `../../public/dados/tarifas.json`; `src/lib/` recriada; `react` em
   `packages/core/src`. E `cd / && node <repo>/scripts/verificar-camadas.mjs` dá o mesmo número de arquivos e código 0
   (lista completa nos pontos R13 da seção "Ameaças").

### 11. Fora desta história (dívida registrada no contexto do tech-lead)

- Regras de negócio que ainda moram no site e devem ir para `@ee/core` com teste: `faixaDoPeso` (`ui/Etiqueta`) e a
  mesma escala repetida em `CasaIlustrada`; as regras do rascunho do cadastro (banhos por pessoa, 8 min); `tarifaMedia`;
  `descreverUso`/`horasPorDiaTexto`; `semAcento` repetido em `SeletorCatalogo` e `BuscaCidade`.
- Dividir `Cadastro.tsx` (554 linhas) e `TelaComodos.tsx` (415) em componentes menores.
- Validação na fronteira (`as` em `arquivos.servidor.ts`, `navegador.ts` e no `migrate`): HIS-003, em `infraestrutura/validacao/`.

### 12. Code review (etapa 7)

_(tech-lead, 2026-10-29 — `main` × `1f7fffb` (código igual ao `182f355`; os commits depois dele só têm docs e o
`e2e-base` do qa). Revisado arquivo a arquivo com `git diff -M -C --find-copies-harder main...HEAD -- apps/web/src`,
mais `scripts/verificar-camadas.mjs` e `package.json`. Build numa cópia própria
(`…/scratchpad/tl-revisao/copia`, `git archive HEAD` + `pnpm install --offline`), sem tocar o `.next` do repositório.)_

**Barreiras:** no repositório, `pnpm typecheck` (`Camadas: tudo certo (64 arquivos)`) e `pnpm test` (37 + 11) verdes; na
cópia, `pnpm typecheck` e `pnpm build` verdes, tabela de rotas com as mesmas 8 rotas estáticas e `/` com revalidate de
1 dia; prerender da `/` com `86400` e `htmlSize` 66 350; chave da casa em 1 arquivo de `.next/static`; nada de
`readFile`/`process.cwd`/`node:fs`/`relatorio.json` no `.next/static`. **Fumaça própria** (Playwright, casa v2 do qa,
`next start` na porta 3108, depois `fuser -k`): as 8 rotas + `?visao=geral` em 390 e 1280 px → 200, `/casa/aparelhos`
termina em `/casa/comodos`, **0 erros** de console/página. As capturas 390/1280 e o fluxo completo são os do qa (84 iguais).

| O que conferi | Resultado |
| --- | --- |
| Camadas (ADR-001) | ok — cada import bate com a matriz da seção 6; nenhuma funcionalidade importa outra; `ui/` só `ui`/`config`/`@ee/core`; telas só chegam à casa por `aplicacao/` |
| `"use client"` por arquivo | ok — a 1ª linha dos 55 `.ts/.tsx` bate com a tabela da seção 3; rotas finas e `PaginaInicial` **sem** diretiva |
| `revalidate` | ok — só em `app/page.tsx`, com o comentário do porquê |
| Store | ok — um só `create` (`infraestrutura/armazenamento/casa.ts:52`); `aplicacao/casa.ts` só reexporta (nomeado) e define `useEdicaoDeAparelho` |
| Contratos 4.1–4.4 | ok — iguais ao desenho; `EditorAparelho` sem store, `aoSalvar(limpo, id)` → `aoFechar()`; `carregarNumerosDoInicio` mantém o `try/catch → undefined` |
| Código movido | ok — corpos iguais (só imports e o nome da função exportada); a divisão de `ui.tsx` e `Comodo.tsx` não mudou nenhuma linha de lógica |
| Tipos | ok — nenhum `any`, `@ts-ignore` ou `eslint-disable` novo; os únicos `as` em linhas novas são os 2 de `arquivos.servidor.ts`, que vieram da página (previstos, HIS-003) |
| Código morto | ok — o `export type { LeituraRelogio }` e o import dele saíram; nenhum export novo sem uso (`EdicaoDeAparelho` e `RelatorioDados` são o tipo de retorno de funções exportadas) |
| Nomes e comentários | ok — português, sem abreviação; os comentários novos explicam o porquê (porta única, reexportação nomeada, `server-only`, `process.cwd()` na chamada, ação do store no remover) |
| Script de camadas | ok — legível, sem dependência, sem `try/catch`, só leitura; regex do `import(` do frontend correta (melhor que a do desenho); `import.meta.dirname` exige Node ≥ 20.11 e o projeto pede ≥ 22 (`engines`, CI) |
| Dependências / configuração | ok — lockfile, `apps/web/package.json`, `next.config.ts` e CI iguais; raiz só ganhou `camadas` e o `typecheck` encadeado |
| Peso no celular | ok — critério 11a/11b (JS para abrir caiu em todas as rotas; +1 449 B só no prefetch) |

**Observações que não bloqueiam** (nenhuma é regressão desta história):

| # | Observação | Para onde |
| --- | --- | --- |
| T1 | Ordem dos imports varia de arquivo para arquivo (ex.: `./rascunho` entre dois `@/aplicacao/…` no `Cadastro`) | HIS-002: `import/order` do ESLint com correção automática, num commit só de formatação |
| T2 | Exports usados só dentro do próprio arquivo, **iguais no `main`**: `Faixa`, `DESCRICAO_FAIXA` (`ui/Etiqueta`), `Simbolo` (`ui/Marca`), `prefereMenosMovimento`, `useValorAnimado`, `useVisivel` (`ui/Movimento`), `novoComodoRascunho` (`rascunho`) | dívida no meu `contexto.md`: tirar o `export` quando o arquivo for mexido |
| T3 | Além do `VOLTAR` da `/sobre` (S2), `funcionalidades/cadastro/rascunho.ts` (sem diretiva) importa o **valor** `novoId` de `aplicacao/casa.ts` (`"use client"`). Inofensivo (só o `Cadastro`, cliente, usa o rascunho; igual no `main`, que importava de `lib/store`), mas a regra proposta na S2 o acusaria | HIS-002, junto com a S2 (ver lá) |

**Decisão sobre S2 (seguranca): fica para a HIS-002, não volta para o frontend agora.** Motivos: (1) é pré-existente e
funciona — o `VOLTAR` só é repassado a um componente de cliente (`<Link>`), e nenhuma família vê diferença; (2) a correção
mexe em 5 arquivos (`ui/Movimento.tsx`, que hoje está byte a byte igual ao `main`, mais `sobre`, `Casca`, `Cadastro` e
`BotaoComecar`) e muda o payload RSC da `/sobre`: anularia a comparação byte a byte do qa e a revisão da segurança feitas
sobre `182f355`, e teríamos de refazer as duas por um ganho zero para quem usa; (3) a correção só fica de pé junto com a
regra automática que impede a volta do problema, e essa regra é o assunto da HIS-002. Lá entram juntas: constantes de
transição em `ui/tiposDeTransicao.ts` (sem diretiva), `novoId` vindo de um arquivo sem diretiva (T3) e a regra
"arquivo sem diretiva só importa componentes de módulo `use client`".

**Decisão da etapa 7: aprovado.** Camadas, diretivas, contratos, store único, `revalidate`, tipos e comentários estão
como o desenho pede; as três barreiras passam; nada muda para a família (qa) e nada novo sai do aparelho (seguranca).
S1, S2 e T1/T3 foram para a HIS-002 (`docs/equipe/historias/HIS-002-qualidade-automatica.md`, "Notas do tech-lead
vindas da HIS-001"); P1–P4 do qa foram para o backlog (`docs/planejamento.md`, E1, HIS-107 e HIS-108).

## Ameaças

_(seguranca, 2026-10-29 — análise de ameaças da etapa 3, feita contra o desenho técnico e o código de `57700ab`/`e49a14f`.)_

**Ativos:** a casa salva no aparelho da pessoa (`localStorage["eficiencia-energetica:casa"]`: residência, cômodos,
aparelhos, contas, leituras, plano); o direito de apagar tudo (LGPD); a garantia de que nada sai do aparelho; o site
abrindo no celular (tela branca = família sem a ferramenta); a barreira de camadas do CI.
**Quem "ataca":** não há atacante novo nesta história (nenhuma entrada, rota de API, banco ou dependência nova). A ameaça
real é **o próprio refatoramento**: um erro silencioso que passa no typecheck e no build e aparece só no celular da família.

**Fatos conferidos no código atual** (servem de linha de base):
- O zustand `persist` (`node_modules/zustand/esm/middleware.mjs`, l. 397–428) **só grava ao hidratar quando a versão
  muda** (`migrated`). Com `version: 2` igual, abrir o site não reescreve a casa: uma regressão de tela, sozinha, não
  apaga dados. A perda só acontece se o código novo chamar `set` com estado errado ou houver dois stores.
- `Cadastro` usa `useCasaCarregada` + `jaTemCasa` para não mostrar o assistente a quem já tem casa; terminar o
  assistente chama `criarCasa`, que **substitui** residência, cômodos e aparelhos. É o caminho mais curto para perda de dados.
- Build atual: a chave `eficiencia-energetica:casa` aparece em 1 arquivo de `.next/static`; nenhum `readFile`,
  `process.cwd` ou `node:fs` em `.next/static`; os únicos endereços nos scripts do cliente são textos de bibliotecas
  (w3.org, nextjs.org, react.dev, github.com). Nenhum `dangerouslySetInnerHTML`, `innerHTML`, `eval` ou `new Function`.
- `packages/core/src` só tem imports relativos. CI (`ci.yml`) roda `pnpm typecheck`, `pnpm test`, `pnpm build` na raiz.

| # | Ameaça | Gravidade | Mitigação |
| --- | --- | --- | --- |
| A1 | **Dois stores** com a mesma chave (outro `create`/`persist` em `aplicacao/`, ou o store copiado em vez de reexportado): cada um guarda uma cópia em memória e a última gravação apaga o que o outro salvou (aparelho some, conta some) | crítico | Um só `create` em `infraestrutura/armazenamento/casa.ts`; `aplicacao/casa.ts` só reexporta com `export { } from` (desenho 4.1). Conferir R1 |
| A2 | **Formato salvo alterado** na mudança de arquivo (`name`, `version`, `partialize`, `migrate`, `storage`): versão diferente dispara `migrate` e regrava; `partialize` diferente deixa de salvar uma lista | crítico | Store copiado byte a byte; só muda o `import` de `novoId`. Conferir R2; QA testa casa v2 e v1 (seção 10, item 3) |
| A3 | **Portão de hidratação quebrado** (`useCasaCarregada` removido, trocado de ordem ou de outra instância): `/comecar` mostra o assistente a quem já tem casa e `criarCasa` substitui tudo; a `Casca` mostra "Vamos cadastrar" | alto | Mesma instância (A1); `Cadastro`, `Casca` e `BotaoComecar` mantêm as mesmas chamadas. QA: com casa v2 salva, abrir `/comecar` direto mostra "você já cadastrou" (não o passo "estado"). Conferir R3 |
| A4 | **Editor de aparelho grava diferente** com as props novas: `aoSalvar` sem `id` cria duplicado em vez de atualizar; remoção reimplementada fora do store não limpa o `plano` (`${id}:`); ordem salvar/fechar invertida | alto | Contrato 4.3: `salvar` usa `atualizarAparelho` quando há `id`; `remover` é o `removerAparelho` do store (não um `filter` novo); `aoSalvar(limpo, id)` → `aoFechar()`. Conferir R4; QA confere no JSON salvo que editar mantém o mesmo `id` e a mesma quantidade de aparelhos |
| A5 | **"Apagar todos os meus dados" deixa de funcionar** (direito de apagar, LGPD) ao mover `TelaAjustes`/`Cadastro` | alto | `apagarTudo` continua sendo a ação do store; nada de limpar `localStorage` à mão. QA: depois de apagar, `state` sem `residencia` e com as cinco listas vazias, e `router.push("/")` como hoje |
| A6 | **Código de servidor no navegador**: `node:fs`/`process.cwd` em arquivo importado (direta ou **indiretamente**) por um `"use client"`. O script só vê o import direto `"use client"` → `.servidor` | médio | `.servidor.ts` + regra do script. **Recomendado:** `import "server-only";` na 1ª linha dos dois `.servidor.ts` (o Next 16 trata esse import internamente, sem pacote novo — `next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, l. 584–604): pega o caso indireto no build. Conferir R5 |
| A7 | **Componente de servidor recebendo "referência de cliente"**: `PaginaInicial` (sem diretiva) importando de um módulo `"use client"` algo que não é componente (ex.: `estilosBotao`, `IR_ADIANTE`, `TIPOS`) — no servidor isso vira um objeto de referência, e a classe ou o texto sai errado em silêncio | médio | `PaginaInicial` e rotas finas só importam **componentes** de módulos `uc` (como o `app/page.tsx` faz hoje); constantes e funções vêm do `@ee/core` ou de arquivos sem diretiva. Conferir R6 |
| A8 | **`"use client"` perdido** (hooks em componente de servidor) ou **posto a mais** (`PaginaInicial` ou rota fina → a `/` inteira vira JavaScript no celular de 3G) | médio | Tabela de diretivas da seção 3; build acusa o primeiro caso; bytes de script do QA (seção 10, item 6) acusam o segundo. Conferir R7 |
| A9 | **`revalidate` fora da rota**: a `/` congela com a bandeira e o número de distribuidoras do dia do build (número errado = quebra da honestidade) | médio | Fica em `app/page.tsx`. Conferir R8 |
| A10 | **Rotas e redirecionamento**: `/casa/aparelhos` deixa de redirecionar; `?visao=geral` e `#comodo-<id>` deixam de abrir; `/casa/*` muda de estática para dinâmica | médio | As mesmas 8 rotas; `redirect` intocado; o `useEffect` que lê `window.location.search` vai junto para `TelaComodos`. Conferir R9 |
| A11 | **Import circular / ordem de inicialização** ao dividir `ui.tsx` e `Comodo.tsx` (ex.: `LinhaAparelho` ↔ `BlocoIluminacao` ↔ `TempoUso`): passa no typecheck e quebra no navegador com "Cannot access … before initialization" → tela branca | médio | `tipos.ts` e `textosDeUso.ts` só dependem do `@ee/core`; componentes de `ui/aparelho/` não se importam em ciclo. Conferir R10; QA: console sem erro em todas as rotas |
| A12 | **Tela branca por exceção** num caminho novo (não há `app/error.tsx`; dado corrompido já quebra hoje — HIS-003) | médio (pré-existente) | Nenhum `throw` novo, nenhum acesso novo a campo da casa sem `?.`; a validação de fronteira continua na HIS-003. Conferir R11 |
| A13 | **Falso negativo no `verificar-camadas.mjs`** (a barreira do CI some em silêncio). Lacunas do desenho da seção 6: (a) se ler **0 arquivos** (caminho relativo ao `cwd`, glob errado) diz "tudo certo" com código 0; (b) `require("…")` e `import(\`…\`)` não são extraídos; (c) módulos do Node sem `node:` além de `fs`/`path` (`child_process`, `os`, `crypto`, `http`, `url`…) passam; (d) `'use client'` com aspas simples, BOM ou comentário antes não é reconhecido; (e) `.servidor` com extensão (`.servidor.ts`) não casa; (f) destino fora de `src/` (ex.: `../../public/dados/tarifas.json`, permitido pelo `resolveJsonModule`) ou arquivo solto em `funcionalidades/` sem pasta | médio | Ajustes no script (ver pergunta aberta ao tech-lead): raiz por `import.meta.dirname`, erro se ler 0 arquivos; `require(` e `import(` não literal viram erro; `module.builtinModules` (com e sem `node:`); detectar a diretiva ignorando BOM, comentários e tipo de aspas; casar `/\.servidor(\.tsx?)?$/`; destino fora das camadas = erro. Conferir R13 com casos negativos |
| A14 | **O script executar ou alterar algo**: ele roda no CI de todo PR | médio | Só `node:fs` (leitura), `node:path`, `node:module`/`node:url`; sem `child_process`, `eval`, `import()` dos arquivos lidos, rede ou escrita; não segue links simbólicos; ignora `node_modules` e `.next`; sem `try/catch` que engula erro e saia com 0. Conferir R12 |
| A15 | **Algo novo saindo do aparelho** (LGPD): `fetch`/`sendBeacon` novo, dependência nova, host novo nos scripts, mudança no `next.config.ts` | alto (se acontecer) | Fora do escopo por definição: nenhuma dependência, nenhum `fetch` novo, `next.config.ts` igual. Conferir R14 |
| A16 | Links externos sem `rel="noopener noreferrer"` (`app/page.tsx` l. 292, `app/sobre/page.tsx` l. 44–56) | baixo (pré-existente) | Sem `target="_blank"` não há troca de aba; o JSX não pode mudar nesta história. Registrado para a HIS-003 |
| A17 | `novoId` com `Math.random` quando não há `crypto.randomUUID` | baixo | Ids só locais, não são segredo; corpo igual ao de hoje |

**Pontos que vou conferir na revisão de código (etapa 6)** — `main` = `57700ab`; caminhos a partir da raiz:

- **R1 · store único.** `grep -rnE "\bcreate(<|\()" apps/web/src` → 1 linha, em `infraestrutura/armazenamento/casa.ts`;
  `grep -rn "eficiencia-energetica:casa" apps/web/src` → 1 linha; `grep -rn "from \"zustand" apps/web/src` → só esse
  arquivo; depois do build, `grep -rl "eficiencia-energetica:casa" apps/web/.next/static | wc -l` → 1 (igual ao `main`).
- **R2 · formato salvo.** `git diff main:apps/web/src/lib/store.ts HEAD:apps/web/src/infraestrutura/armazenamento/casa.ts`
  → só o `import { novoId }` e a saída do `export const novoId`; `name`, `version: 2`, `storage`, `partialize`, `migrate`
  e as 16 ações idênticos. `novoId` em `identificador.ts` com o mesmo corpo.
- **R3 · portão de hidratação.** `grep -rn "useCasaCarregada" apps/web/src` → definida 1 vez, usada em `Casca`,
  `Cadastro` e `BotaoComecar` como hoje; diff de `Cadastro.tsx` só nos imports.
- **R4 · editor.** `grep -rn "useCasa" apps/web/src/ui` → vazio; diff de `EditorAparelho.tsx`: `aoSalvar(limpo, id)` →
  `aoFechar()`, `aoRemover(r.id!)` → `aoFechar()`; `useEdicaoDeAparelho` usa `atualizarAparelho`/`adicionarAparelho`/
  `removerAparelho` do store, sem `filter` próprio.
- **R5 · servidor.** `grep -rnE "node:|from \"(fs|path|os|child_process|crypto)|process\.cwd" apps/web/src` → só
  `infraestrutura/dados-publicos/arquivos.servidor.ts`; `grep -rln "\.servidor" apps/web/src` → só `app/page.tsx`,
  `funcionalidades/inicio/PaginaInicial.tsx` (`import type`) e `aplicacao/numeros-do-inicio.servidor.ts`, nenhum com
  `"use client"`; `grep -rlE "readFile|process\.cwd|node:fs|relatorio\.json" apps/web/.next/static` → vazio.
- **R6 · referência de cliente.** Nos arquivos sem diretiva que são componentes de servidor (`PaginaInicial`, rotas),
  todo import de módulo `uc` é de componente (nome com inicial maiúscula e usado como `<Nome>`).
- **R7 · diretivas.** `for f in $(git ls-files 'apps/web/src/*.ts' 'apps/web/src/*.tsx'); do printf '%s\t%s\n' "$(head -1 $f)" $f; done`
  bate com a coluna "Diretiva" da seção 3; rotas finas e `PaginaInicial` sem diretiva.
- **R8 · cache da `/`.** `grep -rn "revalidate" apps/web/src` → só `app/page.tsx`; manifesto de prerender da `/` com `86400`.
- **R9 · rotas.** Tabela de rotas do `pnpm build` igual à do `main` (mesmas 8, mesmas estáticas);
  `curl -s localhost:3100/casa/aparelhos` → **200** com `NEXT_REDIRECT;replace;/casa/comodos;307` no conteúdo (página
  estática; o redirecionamento acontece no navegador — correção do qa); `/casa/comodos?visao=geral` abre a visão geral.
- **R10 · ciclos.** Grafo de imports de `ui/` e `ui/aparelho/` sem ciclo (script de leitura no meu scratchpad, mesmas
  expressões do `verificar-camadas`); `tipos.ts` e `textosDeUso.ts` só importam `@ee/core`; console do QA sem erro.
- **R11 · exceções novas.** `git diff -M main -- apps/web/src | grep -E '^\+.*\bthrow\b'` → vazio (fora linhas movidas).
- **R12 · o script é seguro.** Ler o arquivo inteiro; `grep -nE "child_process|exec|spawn|eval|new Function|require\(|fetch|https?:|writeFile|rm(Sync)?\(|unlink" scripts/verificar-camadas.mjs`
  → só os textos dos regex; varredura ignora `node_modules`, `.next` e links simbólicos.
- **R13 · o script não deixa passar.** Numa cópia do repositório no meu scratchpad (sem tocar a branch), injetar um caso
  por vez e exigir código 1 com a mensagem da regra: `ui` → `@/aplicacao/casa`; `funcionalidades/a` → `@/funcionalidades/b/X`
  e `../b/X`; `funcionalidades` → `@/infraestrutura/…` direto; `import type` em várias linhas; `export { x } from`;
  `import("@/infraestrutura/…")`; `'use client'` com comentário antes importando `.servidor`; `fs`, `node:fs`,
  `child_process` fora de `.servidor`; `zustand` fora de `infraestrutura`; `../../public/dados/tarifas.json`; `require(…)`;
  pasta `src/lib/` recriada; `react` dentro de `packages/core/src`. E rodar a cópia limpa a partir de outra pasta
  (`cd / && node <cópia>/scripts/verificar-camadas.mjs`) → mesmo número de arquivos e código 0.
- **R14 · nada novo sai do aparelho.** `git diff main --stat -- pnpm-lock.yaml apps/web/package.json apps/web/next.config.ts .github`
  → vazio (no `package.json` da raiz, só `camadas` e `typecheck`); `git diff -M main -- apps/web/src | grep -E '^\+.*(fetch\(|sendBeacon|XMLHttpRequest|WebSocket|https?://|localStorage|sessionStorage|document\.cookie)'`
  → vazio fora de linhas movidas; endereços em `.next/static` iguais à linha de base; `pnpm audit` sem alta/crítica.
- **R15 · XSS e limpeza.** `grep -rnE "dangerouslySetInnerHTML|innerHTML|eval\(|new Function" apps/web/src scripts` → vazio;
  `grep -rn '@/components\|@/lib' apps/web/src` → vazio.

**Decisão da etapa 3:** aprovado para implementar. Nenhum risco alto fica sem mitigação no desenho; A1–A5 dependem de a
implementação seguir o desenho à risca e serão conferidos com evidência (R1–R4 e testes do QA). A13 pede ajustes no
script antes do passo 1 (pergunta aberta abaixo); se não entrarem, a revisão da etapa 6 aponta como médio.

### Revisão de código (etapa 6)

_(seguranca, 2026-10-29 — `main` `57700ab` × `182f355` (commits `87bb6ba..182f355`; `da2a3c4` só tem docs). Revisado
com `git diff -M -C main HEAD -- apps/web/src`. Build próprio: `pnpm build` verde, servidor na porta 3107, depois
`fuser -k 3107/tcp`. Evidências fora do git em `…/scratchpad/his001/seg-*` e `…/his001/seg-camadas/`.)_

**Barreiras:** `pnpm typecheck` (com `Camadas: tudo certo (64 arquivos)`), `pnpm test` (37 + 11) e `pnpm build` verdes;
`pnpm audit --audit-level high` → "No known vulnerabilities found"; `git log -p main..HEAD` sem padrão de chave/segredo
fora de `docs/`; nenhum `.env` versionado. **Código movido sem mudança:** linhas que não são import comparadas (ordenadas)
entre o `main` e o destino de cada arquivo: `ui.tsx` × as 8 peças de `ui/`, `Comodo.tsx` × as 4 de `ui/aparelho/`, e
mais 10 arquivos movidos → nenhuma diferença, exceto o `export type { LeituraRelogio }` removido (previsto). Corpos das
rotas → funcionalidades: só o nome da função e a ligação do editor (`useEdicaoDeAparelho`).

| Ponto | Resultado | Evidência |
| --- | --- | --- |
| R1 | ok | 1 `create(` (`infraestrutura/armazenamento/casa.ts:52`); 1 chave `eficiencia-energetica:casa` (l. 118); `zustand` só nesse arquivo; chave em **1** arquivo de `.next/static` (igual ao `main`) |
| R2 | ok | `git diff main:…/lib/store.ts HEAD:…/armazenamento/casa.ts` → só `+import { novoId }` e a saída do `export const novoId`; `identificador.ts` com o corpo idêntico |
| R3 | ok | `useCasaCarregada` definida 1 vez, usada em `Casca`, `Cadastro` e `BotaoComecar` (como no `main`); diff do `Cadastro.tsx` só em imports |
| R4 | ok | `useCasa` ausente de `ui/`; `aoSalvar(limpo, id)` → `aoFechar()`, `aoRemover(r.id!)` → `aoFechar()`; hook usa `atualizarAparelho`/`adicionarAparelho`/`removerAparelho` do store, sem `filter` próprio; as 2 telas passam as 3 props |
| R5 | ok | `node:`/`process.cwd` só em `arquivos.servidor.ts`; `.servidor` citado só por `app/page.tsx`, `PaginaInicial` (`import type`) e `numeros-do-inicio.servidor.ts`, nenhum `uc`; os 2 `.servidor.ts` com `import "server-only"` na 1ª linha; `readFile`/`process.cwd`/`node:fs`/`relatorio.json`/`server-only` em `.next/static` → vazio. **Prova do caso indireto:** numa cópia, `aplicacao/indireto.ts` (sem diretiva) reexportando o `.servidor` e importado pela `TelaDicas` (`uc`): `verificar-camadas` → código 0 (esperado, não segue grafo) e `next build` → **falha** com "'server-only' cannot be imported from a Client Component module" |
| R6 | ok | `PaginaInicial` e rotas só importam componentes de módulos `uc` (`Contagem`, `Revelar`, `TransicaoTela`, `BotaoComecar`, `Simulador`, `CasaIlustrada`, telas). Pré-existente: ver S2 |
| R7 | ok | 1ª linha de cada um dos 55 `.ts/.tsx` bate com a coluna "Diretiva" da seção 3; rotas finas e `PaginaInicial` sem diretiva (o "use client" na l. 45 da `PaginaInicial` é só texto de comentário) |
| R8 | ok | `revalidate` só em `app/page.tsx:6`; prerender da `/`: `86400`, `htmlSize` 66 350, 12 entradas (igual ao `antes`) |
| R9 | ok (expectativa corrigida pelo qa) | tabela de rotas do build idêntica à do `antes/build.log` (`diff` vazio); as 12 respostas (8 rotas, `?visao=geral`, manifest, ícone, `/dados/tarifas.json`) → 200; `/casa/aparelhos` → **200** com `NEXT_REDIRECT;replace;/casa/comodos;307;` no conteúdo, como no `main`; leitura de `?visao=geral` e `#comodo-<id>` foi junto para `TelaComodos` (l. 47 e 142) |
| R10 | ok | grafo de `apps/web/src` (54 arquivos, 137 arestas internas, mesmas expressões do script): **0 ciclos**; `tipos.ts` e `textosDeUso.ts` só importam `@ee/core` |
| R11 | ok | `git diff -M -C main HEAD -- apps/web/src \| grep -E '^\+.*\bthrow\b'` → vazio; `carregarNumerosDoInicio` mantém o `try/catch → undefined` do `numerosReais()` (JSON corrompido não derruba a `/`) |
| R12 | ok | script só importa `node:fs` (`existsSync`, `readdirSync`, `readFileSync`), `node:module`, `node:path`; grep de `child_process\|exec\|spawn\|eval\|fetch\|https?:\|writeFile\|rm\|unlink\|import(\|try\|catch` → só comentários e textos de mensagem; sai com `process.exitCode = 1` |
| R13 | ok, com lacunas baixas (S1) | roteiro do frontend (`teste-camadas/testar.mjs`, lido antes: só escreve em `teste-camadas/copias` e apaga só essa pasta) contra o HEAD: **36/36 ok** (cópia limpa de `/` com 64 arquivos, link ignorado, 34 negativos com código 1 e a mensagem da regra). Meus 21 casos extras (`seg-camadas/testar-seg.mjs`): a **regex nova do `import(`** está certa — `import( "x" )` não acusa; `import("a" + x)`, ``import(`…`)`` sem interpolação, aspas trocadas, `import  (x)`, `import(/* c */ x)` e `import(` em várias linhas acusam; `export *`, `import x = require()`, `@/aplicacao/../infraestrutura` e `"use client"` → `./x.servidor` acusam. 10 passam sem acusar: S1 |
| R14 | ok | `git diff --stat main HEAD -- pnpm-lock.yaml apps/web/package.json apps/web/next.config.ts .github packages` → vazio; `package.json` da raiz só `camadas`/`typecheck`; linhas novas sem `fetch`/`sendBeacon`/`XMLHttpRequest`/`WebSocket`/URL/`localStorage`/`sessionStorage`/`cookie`/`indexedDB`; hosts em `.next/static`: w3.org, nextjs.org, react.dev, github.com + `https://a`, `https://x`, `http://n` (textos de teste de recurso do polyfill de `URL` e base do `Link`, sem rede) |
| R15 | ok | `dangerouslySetInnerHTML\|innerHTML\|eval(\|new Function\|javascript:` em `apps/web/src` e `scripts` → vazio; `@/components\|@/lib` → vazio |

Fora do código do site, também revisei `apps/web/e2e-base/` (QA, provisório, fora do CI): `execSync` só com 2 comandos
fixos (`git rev-parse`, `git status`), `rmSync` só na subpasta `diferencas` da pasta de evidências; fixtures com dados
fictícios (sem nome, CPF ou endereço; só cidade e ids de contador).

**Achados**

| # | Achado | Gravidade | Correção recomendada (para quem) |
| --- | --- | --- | --- |
| S1 | **Lacunas restantes do `verificar-camadas.mjs`** (provadas em cópia, código 0): (a) `from"x"` e `import"x"` sem espaço (`\bfrom\s+`, `import\s+`); (b) `import /* c */ ("…")`; (c) arquivos `.js`/`.jsx`/`.cjs`/`.cts` em `apps/web/src` e `.tsx` em `packages/core/src` não são lidos — o Next compila `page.jsx`; (d) **links simbólicos são pulados em silêncio**, mas o Next segue o link e compila o destino; (e) especificador com caminho absoluto ou com `?sufixo` vira "pacote externo"; (f) `process.getBuiltinModule("node:fs")` lê o disco sem import; (g) `"use server"` não é barrado. Nenhum caso existe hoje no código; todos pedem escrita deliberada, e o caso grave (servidor no navegador) é barrado no build pelo `server-only` (R5) | baixo | **tech-lead/frontend, na HIS-002** (no script ou no ESLint): `\bfrom\s*["']` e `^\s*import\s*["']`; ler toda extensão de código (`.js .jsx .cjs .mjs .ts .tsx .cts .mts`) nas duas pastas; link simbólico = erro, não pular; especificador que começa com `/` ou contém `?` = erro; `getBuiltinModule` = texto proibido como `require(`; `"use server"` = erro até existir regra própria (cada Server Action é um endpoint POST público: exige validação de entrada, limite e revisão da segurança antes do E4) |
| S2 | `app/sobre/page.tsx` (componente de servidor) importa a **constante** `VOLTAR` de `ui/Movimento` (`"use client"`) e passa para `<Link transitionTypes>` — a armadilha da A7. Funciona hoje porque a referência só é repassada a um componente de cliente; usar o valor no servidor (ler, juntar) quebraria em silêncio. **Pré-existente** (igual no `main`), não muda nesta história | baixo | **tech-lead**: na HIS-002, tirar `IR_ADIANTE`/`VOLTAR`/`ENTRAR_NO_PAINEL` para um arquivo sem diretiva (ex.: `ui/tiposDeTransicao.ts`) e acrescentar ao script/ESLint: arquivo sem diretiva só importa de módulo `uc` nomes com inicial maiúscula |
| — | A16 (links externos sem `rel`, agora em `PaginaInicial.tsx:275` e `sobre/page.tsx:44–56`) e os `as` na fronteira (`arquivos.servidor.ts`, `navegador.ts`, `migrate`) continuam como estavam | baixo (pré-existente) | HIS-003, como já registrado |

**Decisão da etapa 6: aprovado com ressalvas (baixo).** Os riscos crítico/alto da análise (A1–A5, A15) foram conferidos
com evidência e não se materializaram: um só store, formato salvo idêntico, portão de hidratação, editor e apagar tudo
iguais, nada novo saindo do aparelho. S1 e S2 não bloqueiam e ficam para a HIS-002.

## Plano de testes

_(qa, 2026-10-29 — linha de base **feita** (passo 0) antes de qualquer mudança de código. O "depois" roda o mesmo
script contra o site novo e compara.)_

**Ferramenta.** `apps/web/e2e-base/linha-de-base.cjs` (Node + Playwright do ambiente, sem dependência nova) e as fixtures
`apps/web/e2e-base/fixtures/casa-v1.json` e `casa-v2.json`. A pasta inteira é provisória: a HIS-002 a troca por
`apps/web/e2e/` no CI. As evidências ficam **fora do git**, no scratchpad do QA:
`/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/his001/antes/` (`resumo.json` tem todos os números).

**Como rodar o "depois"** (frontend ao fim do passo 8, ou qa na etapa 5):

```bash
pnpm build && pnpm --filter @ee/web start -p 3100        # em segundo plano
node apps/web/e2e-base/linha-de-base.cjs capturar <scratchpad>/his001/depois   # sem --gerar-fixtures
fuser -k 3100/tcp                                          # nunca pkill -f "next start"
node apps/web/e2e-base/linha-de-base.cjs comparar <scratchpad>/his001/antes <scratchpad>/his001/depois
```

`capturar` leva ~5 min e sai com 1 se houver erro no console, erro de página ou verificação falha. `comparar` lista
cada diferença (com o `diff -u` a rodar), marca em vermelho os pixels diferentes em `depois/diferencas/` e sai com 1 se
algo não bate. **Não** regerar as fixtures no "depois": o mesmo JSON entra nos dois lados.

**Por que dá para comparar byte a byte.** O script fixa o relógio (29/10/2026 12:00, Brasília), o fuso, o idioma
(`pt-BR`) e troca `crypto.randomUUID` por um contador, então ids, meses e textos saem iguais em qualquer dia. Provas:
(1) **controle** — duas execuções do mesmo build: `comparar antes controle` → "nada mudou" (84 capturas, 98
textos/DOM/casas iguais; só ruído de rasterização ≤ 10/255 em 2 capturas com diálogo);
(2) **teste negativo** — numa cópia do controle mudei 1 texto, 1 retângulo de 40×10 px, 1 item do `plano` e +2048 bytes
de JS: as 4 mudanças foram acusadas e a saída foi 1.

**Ambiente da linha de base:** `apps/web/src` idêntico ao `main` `57700ab` (`git diff main --stat -- apps/web/src` vazio;
HEAD `d743c1f` só tem docs e esta pasta); build `iv_ootDWVtQo_q10gOA-t`; sha256 de `public/dados`: `tarifas.json`
`d07eaad4…`, `relatorio.json` `5c8d732b…`, `municipios/SP.json` `d75b57cd…`. O comparador **avisa** se esses
arquivos mudarem (a rotina diária commita neles): aí a diferença pode ser de dado, e o "antes" é refeito num
`git worktree` do `57700ab` com o mesmo `public/dados`. A `/` é estática: se o mês virar entre os dois builds, a bandeira
pré-renderizada muda — rodar antes e depois no mesmo mês.

**O que é comparado e quando passa**

| # | O quê | Como | Linha de base (antes) | Aprova quando |
| --- | --- | --- | --- | --- |
| 1 | **Capturas** (390×844 e 1280×900, página inteira, animações no estado final) | Fluxo: `/` → cadastro (estado SP pelo `select#estado` + Continuar, Presidente Prudente, Tarifa Social, 4 pessoas, 6 cômodos, cada cômodo, revisão por cômodo e "Tudo junto", conta pulada) → acompanhamento (editor pelo "Quem mais gasta", 2 contas, 2 leituras) → cômodos (2º cômodo aberto, editor, remover, painel geral) → dicas (1 dica marcada) → acompanhamento → minha casa → sobre → `/`; e entradas diretas `?visao=geral`, `/comecar`, `/casa/aparelhos` | **84 PNG**: 34 por largura + migração v1 (2) e v2 (3) + movimento reduzido (8 rotas) + remover do plano (1) + apagar (2) | 0 pixels com diferença > 16/255 em algum canal. Ruído abaixo disso só vira aviso |
| 2 | **Texto visível** | `innerText` do `<main>` (do `<body>` na `/`, que não tem `<main>`) de cada captura | 84 `.txt` | iguais byte a byte |
| 3 | **"Foto" do DOM** | `reducedMotion: "reduce"`, casa v2, 8 rotas (`/`, `/comecar`, `/casa`, `/casa/comodos`, `?visao=geral`, `/casa/dicas`, `/casa/ajustes`, `/sobre`); `body.innerHTML` sem `<script>`/`<template>`, com `useId` e `/_next/static/…` normalizados (mudam de build para build sem mudar a tela) | 8 `.html` em `dom/` | iguais byte a byte |
| 4 | **Casa salva** | `localStorage["eficiencia-energetica:casa"]` no fim do fluxo, comparado como JSON canônico | `casa-final-390.json` = `casa-final-1280.json`: SP, 4 pessoas, Tarifa Social, 6 cômodos, 14 aparelhos (chuveiro com banho 4×8 min, geladeira por etiqueta 35 kWh), 2 contas, 2 leituras, 1 dica no plano | igual |
| 5 | **Migração v2 e v1** | Fixture gravada antes de abrir `/casa`; abre, recarrega e lê o que ficou | v2: guardado = fixture; v1 (sem `contas`/`leituras`/`plano`): vira `version: 2` com as três listas vazias e o resto igual; os 6 cômodos aparecem | idem, e capturas/textos iguais |
| 6 | **Portão de hidratação (A3)** | Com casa v2, abrir `/comecar` direto | "Você já cadastrou a sua casa"; casa guardada intacta | idem |
| 7 | **Editor de aparelho (A4)** | Salvar sem mudar pelo "Quem mais gasta" e pelos cômodos; remover pelo "Quem mais gasta" o chuveiro, que está no plano | ids e quantidade iguais depois de salvar; remover: 14 → 13 aparelhos, `plano` `["…85:banho-curto"]` → `[]` | idem |
| 8 | **Apagar todos os meus dados (A5)** | Casa v2 → `/casa/ajustes` → "Apagar todos os meus dados" → "Sim, apagar" | volta para `/`; `state` sem `residencia` e as 5 listas vazias | idem |
| 9 | **Transições** | `document.startViewTransition` contado por `addInitScript`, acumulado por passo; `view-transition-name` do topo e da navegação | **21** por largura, mesma sequência nas duas (1 por passo do cadastro, exceto a troca "Por cômodo/Tudo junto"; 1 por troca de aba e por link; 0 nos diálogos e nas entradas por endereço, exceto `/casa/aparelhos`, cujo redirecionamento no navegador conta 1); topo `topo`, navegação de baixo `navegacao` | mesma contagem **em cada passo**, mesmos nomes |
| 10 | **Movimento reduzido** | `reducedMotion: "reduce"`; duração de `.surgir`; 4 trocas de aba | `.surgir` dura `1e-05s` (0,01 ms do `globals.css`); 4 transições em 4 trocas (o React continua chamando a API, o CSS zera a animação) | igual |
| 11a | **JS para abrir a página** (principal; critério do tech-lead, 2026-10-29) | `medir-js-html` (também roda no fim do `capturar`; grava `js-do-html.json`): `<script src>` sem `noModule` + `<link rel="preload" as="script">` do HTML de 7 rotas, corpo com gzip como o servidor manda. Mesma regra do `js-do-html.mjs` do tech-lead (números batem byte a byte) | medido no `main` `57700ab` em 2026-10-29 (build próprio do qa): `/` **165 917** · `/comecar` **173 594** · `/casa` **176 681** · `/casa/comodos` **173 387** · `/casa/dicas` **167 401** · `/casa/ajustes` **164 464** · `/sobre` **139 573** B; união das 7: 235 128 B | cada rota cresce no máximo 1 024 B |
| 11b | **JS total com prefetch** | Chromium sem cache, 390 px, depois de `networkidle` + 1 s; soma de `encodedBodySize` de todo recurso `.js` (o Next pré-carrega parte dos chunks por `<link rel="preload">`, que não aparece como `initiatorType: "script"`; esse número também fica no `resumo.json`) | `/` **185 227 B** (10 arquivos; 602 122 B sem compressão) · `/comecar` **185 227 B** (10) · `/casa` sem casa **231 010 B** (15) · `/casa` com casa **211 700 B** (13). Só `initiatorType: "script"`: 183 254 / 183 254 / 229 037 / 209 727 | cada rota cresce no máximo 2 048 B (era 1 024 até a decisão do tech-lead) |
| 12 | **Rotas e cache** | `fetch` de cada rota; manifesto de prerender copiado para as evidências | as 8 rotas respondem 200; `/casa/aparelhos` é estática: responde **200** com `NEXT_REDIRECT;replace;/casa/comodos;307` no conteúdo e o navegador termina em `/casa/comodos`; prerender com 12 entradas, `/` com `initialRevalidateSeconds` **86400** e `htmlSize` **66 350** | mesmas rotas e status, mesmo redirecionamento, 86400; `htmlSize` com variação > 2 % vira aviso para olhar |
| 13 | **Console** | `pageerror` e `console.error` em todas as sessões (fluxo, migração, reduzido, remover, apagar, bytes) | **0** | 0 |

**Também na etapa 5 (manual, no "depois"):** navegar o cadastro e as abas só com teclado (foco no título de cada passo,
`Esc` fecha o diálogo); zoom de 200% em 390 px; nomes acessíveis dos botões do "Quem mais gasta" e dos contadores
(vêm nos textos e no DOM do item 3); conferir as capturas lado a lado onde o comparador apontar algo.
E as barreiras da história: `pnpm camadas`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

**Diferença aceitável:** nenhuma. Qualquer item vermelho volta para o frontend com o arquivo e o `diff`.

**Limites conhecidos do script:** em 390 px a captura de página inteira mostra a navegação fixa de baixo por cima de uma
faixa do conteúdo (na altura de 844 px), igual nos dois lados; o que fica coberto é conferido pelo texto (item 2).
O `#comodo-<id>` (rolar até o cômodo) não é capturado: o fluxo chega aos cômodos pela aba (coberto no manual da etapa 5).

### Resultado da etapa 5 (qa, 2026-10-29)

**Ambiente.** Cópia isolada do repositório em `182f355` no scratchpad do qa (`…/his001/copia-qa/`, `git status` limpo),
porque outro agente rodou `pnpm build` no `.next` do repositório no meio do meu teste (às 21:31, o `next start` caiu com
"Could not find a production build"). Build `_qVAe_v1GjC4-rgfRKeiq`; `public/dados` com os mesmos sha256 da linha de base.
Para o 11a e para o manual lado a lado, segunda cópia em `57700ab` (build `2bhg1cNnVmkuk6NmfVjUU`). Os commits
`da2a3c4` e `28b9a29` só têm documentos (`git diff --stat 182f355 HEAD -- apps scripts package.json` vazio).
Evidências: `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/his001/depois-qa/` (comparação),
`…/his001/manual-qa-depois/` e `…/his001/manual-qa-main/` (manual), roteiro `…/his001/manual-qa.cjs`.

| # | Resultado | Números do "depois" |
| --- | --- | --- |
| barreiras | ok | `pnpm typecheck` (`Camadas: tudo certo (64 arquivos)`), `pnpm test` 37 + 11, `pnpm build` verdes; tabela de rotas igual ao `antes/build.log` |
| 1 | ok | 84 de 84 capturas iguais; ruído ≤ 16/255 em 3 (5, 50 e 107 pixels, diálogo e cômodos), como no controle |
| 2, 3, 4 | ok | 98 de 98 textos, fotos do DOM e casas salvas iguais byte a byte |
| 5 | ok | v2: guardado = fixture; v1 → `version: 2` com as 3 listas vazias e o resto igual |
| 6 | ok | `/comecar` com casa v2 → "Você já cadastrou"; casa intacta |
| 7 | ok | salvar pelo "Quem mais gasta" e pelos cômodos mantém ids; remover o chuveiro: 14 → 13, `plano` → `[]` |
| 8 | ok | volta para `/`, `state` sem `residencia` e 5 listas vazias |
| 9 | ok | 21 transições por largura, mesma sequência por passo; nomes `topo` e `navegacao` |
| 10 | ok | `.surgir` 1e-05s; 4 transições em 4 trocas de aba |
| 11a | **ok** | `/` 164 212 (−1 705) · `/comecar` 172 561 (−1 033) · `/casa` 175 053 (−1 628) · `/casa/comodos` 172 950 (−437) · `/casa/dicas` 166 026 (−1 375) · `/casa/ajustes` 163 965 (−499) · `/sobre` 139 573 (0); união 236 577 (+1 449) |
| 11b | **ok** | `/` 184 404 (−823) · `/comecar` 184 404 (−823) · `/casa` sem casa 232 459 (**+1 449**, limite 2 048) · com casa 212 267 (+567) |
| 12 | ok | 8 rotas 200; `/casa/aparelhos` 200 com `NEXT_REDIRECT` para `/casa/comodos`; prerender 12 entradas, `/` 86400 e `htmlSize` 66 350 |
| 13 | ok | 0 erros de console/página em todas as sessões (fluxo, migração, reduzido, remover, apagar, bytes e manual) |

`comparar antes depois-qa` → **"Comparação: nada mudou"** (código 0). O script agora ignora logs de evidência (`*.log`,
`saida-*.txt`, `controle-comparacao.txt`), que antes viravam falsa diferença. Teste negativo dos critérios novos: +1 050 B
no JS do HTML de `/casa/dicas` e +2 049 B no total da `/` → as duas acusadas, código 1.

**Manual (roteiro `manual-qa.cjs`, rodado igual no `main` e no "depois"; relatório e as 18 árvores de acessibilidade
idênticos nos dois; capturas iguais ou com ruído ≤ 3/255):**

| O quê | Resultado |
| --- | --- |
| Cadastro só com teclado (390 px; Tab, Enter, Espaço; `<select>` por digitação) | ok — do estado até `/casa`, 6 cômodos; ao entrar em cada passo o foco vai para o `h1` do passo; contorno de foco visível (3 px amarelo) em campo, botões e opções |
| Folhas com teclado (editor pelo "Quem mais gasta", editor pelos cômodos, "Anotar conta"; 390 e 1280) | ok — Enter abre, o foco vai para "Fechar" dentro do diálogo, `Esc` fecha e o foco volta para o botão que abriu |
| Abas com teclado (Cômodos → Dicas → Minha casa → Acompanhar) | ok — Enter navega, contorno visível, 4 transições em 4 trocas |
| Nomes acessíveis (8 rotas + diálogo do editor, 390 e 1280) | ok — nenhum botão, link, campo, rádio ou contador sem nome; "Quem mais gasta" lido como "Chuveiro elétrico: R$ 44,26 por mês, 42% da conta. Toque para ajustar."; contadores "Aumentar/Diminuir quantidade de …" com `status` |
| Movimento reduzido | ok — `.surgir` 1e-05s e opacidade 1 já aos 300 ms; nenhuma animação de view transition em andamento 120 ms depois da troca de aba |
| `/casa/aparelhos` | ok — termina em `/casa/comodos` (390 e 1280) |
| `#comodo-<id>` pelo link do acompanhamento (Quarto 2) | ok — 6 links; abre `/casa/comodos#comodo-…45`, Quarto 2 expandido e visível (390: 371 px do topo; 1280: 491 px), 1 transição. Direto pelo endereço: expandido, a 112 px (`scroll-mt-28`) |
| Zoom 200% em 390 px (195 px CSS) | igual ao `main` — ver P2 |

**Achados pré-existentes** (iguais no `main`; não são regressão e não cabem aqui, porque a história proíbe mudança
visual; registrados para o backlog):

| # | Achado | Gravidade | Para |
| --- | --- | --- | --- |
| P1 | No passo "cidade" do cadastro o foco começa na busca (`autoFocus`) e passa para o título entre 300 e 600 ms (8 de 8 vezes, nos dois builds): quem começa a digitar logo perde o foco no meio, e o leitor de tela anuncia duas coisas | baixo | ux-acessibilidade / frontend |
| P2 | Zoom 200% em 390 px: rolagem horizontal em `/` (254 px de conteúdo em 195), `/casa` e `/casa/dicas` (211 px); no `/casa` os números e nomes quebram palavra a palavra (`…/manual-qa-depois/capturas/zoom200-_casa.png`) | médio | ux-acessibilidade (história de reflow) |
| P3 | Pelo link do acompanhamento o cômodo abre e fica visível, mas não alinhado ao topo como na entrada direta (371 px × 112 px); causa não investigada (suspeita: a rolagem do `useEffect` disputa com a da navegação/transição) | baixo | frontend |
| P4 | Com o diálogo aberto, 1 de 25 Tabs deixa o foco fora do diálogo (`activeElement` fora do `<dialog>`; no `<dialog>` modal nativo do Chromium o ciclo de Tab passa pela interface do navegador) | baixo (informativo) | — |

## Perguntas abertas

- [x] `[para: tech-lead]` Os componentes compartilhados de aparelho vão para `ui/aparelho/` ou ficam em `funcionalidades/comodos/` exportados por um `index.ts` público?
  — **resposta (tech-lead, 2026-10-29):** vão para `ui/aparelho/`, sem store (props entram, callbacks saem). `EditorAparelho` também, ligado à casa pelo hook `useEdicaoDeAparelho()` de `aplicacao/casa.ts`. Um `index.ts` em `comodos` faria o cadastro e o acompanhamento importarem outra funcionalidade. `ui/` pode chamar funções puras do `@ee/core`; ADR-001 regra 4 revisada. Detalhes no desenho técnico, seções 2 e 4.
- [x] `[para: tech-lead]` (seguranca, 2026-10-29 — responder **antes do passo 1**; não bloqueia o resto do desenho)
  Aceita estes ajustes na seção 6 para o `verificar-camadas.mjs` não ter falso negativo (ameaça A13)?
  (a) achar a raiz pelo `import.meta.dirname`, não pelo `cwd`, e **falhar se ler 0 arquivos**;
  (b) `require("…")` e `import(` com argumento que não é texto fixo viram erro;
  (c) módulos do Node pela lista `builtinModules` de `node:module`, com e sem `node:` (hoje só `node:*`, `fs`, `fs/promises`, `path`);
  (d) reconhecer a diretiva ignorando BOM, comentários e aspas simples/duplas;
  (e) casar `.servidor` com ou sem extensão (`/\.servidor(\.tsx?)?$/`);
  (f) destino fora de `apps/web/src` (ex.: JSON de `public/`) e arquivo solto em `funcionalidades/` = erro "fora das camadas".
  E aceita `import "server-only";` na 1ª linha de `arquivos.servidor.ts` e `numeros-do-inicio.servidor.ts` (ameaça A6)?
  O Next 16 trata esse import internamente (sem pacote novo) e barra no build o caso **indireto** que o script não vê.
  — **resposta (tech-lead, 2026-10-29): aceito (a)–(f) e o `server-only`**, já escritos na seção 6 e nos passos 1 e 5.
  Detalhes: (a) raiz por `import.meta.dirname` e erro com 0 arquivos em **cada** pasta lida; (b) `require(` e `import(`
  sem texto fixo viram erro mesmo em comentário (falso positivo é preferível); (c) `builtinModules` + prefixo `node:`;
  (d) BOM, comentários e os dois tipos de aspas; (e) `/\.servidor(\.tsx?)?$/`; (f) destino fora de `apps/web/src` e
  arquivo solto em `src/` ou direto em `funcionalidades/` = "fora das camadas". `server-only`: conferi em
  `next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (instalar é **opcional**, o Next trata o
  import internamente e traz os tipos) e o módulo existe em `next/dist/compiled/server-only` — sem pacote novo, sem mudar
  o lockfile. Acrescentei: o script exige `import "server-only";` como primeiro import de **todo** `*.servidor.ts` e só
  aceita `server-only` nesses arquivos. **Recusado:** seguir imports indiretos dentro do script (grafo completo) — o
  `server-only` cobre isso no build e o script ficaria grande; e trocar regex por um parser (dependência nova) antes do
  ESLint da HIS-002. **Atenção futura:** se um `*.servidor.ts` ganhar teste no Vitest (fora do Next), o import não
  resolve; aí instalamos `server-only` como devDependency com versão exata ou criamos um alias no `vitest.config`.

- [x] `[para: tech-lead]` (frontend, 2026-10-29 — não bloqueia o QA; bloqueia fechar o item 11 do plano de testes)
  O JS baixado em `/casa` **sem casa** cresceu 1 449 B (limite 1 024) por causa da divisão do `ui.tsx` (decisão 2): os
  componentes que só as páginas usam (`Pilulas`, `Folha`, `Contador`, `Opcao`) agora se repetem nos chunks das abas que
  o Next pré-carrega. O JS que cada página precisa para abrir ficou menor em todas as rotas, e o código único baixado
  também (números na minha nota). Aceita a diferença como esperada (e o QA passa a medir o JS do HTML de cada rota além do
  total com prefetch), ou prefere outra saída? As que vejo vão contra o desenho: juntar os componentes de novo num módulo
  (decisões 2 e 7) ou mudar o agrupamento de chunks no `next.config.ts` (R14).
  — **resposta (tech-lead, 2026-10-29): aceito a diferença; nenhuma mudança de código.** Medi eu mesmo, com builds de
  `57700ab` e `182f355` numa cópia do repositório, o JS que o HTML de cada rota referencia (`<script src>` sem `noModule`
  + `<link rel="preload" as="script">`, corpo como o servidor manda com gzip): `/` 165 917 → 164 212 (−1 705),
  `/comecar` 173 594 → 172 561 (−1 033), `/casa` 176 681 → 175 053 (−1 628), `/casa/comodos` 173 387 → 172 950 (−437),
  `/casa/dicas` 167 401 → 166 026 (−1 375), `/casa/ajustes` 164 464 → 163 965 (−499), `/sobre` igual. A união dos
  arquivos das 7 rotas cresce +1 449 B (235 128 → 236 577) — o mesmo número da `/casa` sem casa: é a repetição de
  `Pilulas`/`Folha`/`Contador` entre chunks, baixada **depois** que a página abriu (prefetch dos `<Link>`, em segundo
  plano, uma vez, e fica em cache). Em 3G (~50 kB/s úteis) são ~30 ms fora do caminho de abertura, contra até 1,7 kB a
  menos antes da página ficar pronta. As saídas que contrariam o desenho custam mais do que esse ganho. (Os números do
  frontend incluem o polyfill `noModule` de 39 627 B, igual nos dois lados; as diferenças são as mesmas.)
  **Critério novo do item 11 (o qa atualiza a tabela e o script):** (11a, principal) JS do HTML de cada uma das 7 rotas,
  medido como acima: cresce no máximo 1 024 B; (11b) total baixado depois de `networkidle` + 1 s, com prefetch: cresce
  no máximo 2 048 B por rota. Os dois bloqueiam; 11b continua pegando dependência nova (que vem em dezenas de kB).
  Com isso o item 11 da HIS-001 passa. Script da medida: `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/tl-scripts/js-do-html.mjs`.

## Conversa da equipe

### [scrum-master] 2026-10-29 — história refinada e pronta para o desenho técnico
- O que fiz: problema, critérios de aceite e fora do escopo; mapa inicial de arquivos com base no código atual.
- Decisões e porquê: história sem mudança visível, para isolar o risco de regressão; vem antes de qualquer nova função.
- Para o próximo (tech-lead): confirmar o mapa, responder a pergunta aberta e definir como o CI verifica as camadas.

### [tech-lead] 2026-10-29 — desenho técnico definitivo; pergunta aberta respondida
- O que fiz: li todo o `apps/web/src` e mapeei os imports com grep; escrevi o desenho técnico (tabela arquivo → destino
  com a diretiva `"use client"` de cada um, contratos novos, estrutura final, script de camadas, ordem em 8 passos,
  riscos e verificação); revisei a regra 4 e as consequências do ADR-001.
- Decisões e porquê: componentes de aparelho em `ui/aparelho/` sem store (evita três ligações entre funcionalidades);
  `ui/` pode usar funções puras do core (usar o core evita duplicar regra); `aplicacao/` é a única porta para
  `infraestrutura/` (ponto da futura sincronização); `EditorAparelho` recebe `comodos`/`aoSalvar`/`aoRemover`;
  `Casca` vira `funcionalidades/casca/` (lê a casa, não é genérica); código só de servidor em `*.servidor.ts`; sem
  barris `index.ts`; telas grandes não são divididas agora, para a revisão ver só movimentos e imports. Verificação
  por `scripts/verificar-camadas.mjs` (Node puro) dentro do `pnpm typecheck`, então o CI não muda.
- Arquivos alterados: `docs/equipe/historias/HIS-001-camadas.md`, `docs/equipe/decisoes/ADR-001-camadas.md`,
  `docs/equipe/quadro.md`, `docs/equipe/agentes/tech-lead/contexto.md` e `diario.md`. Nenhum código mudou.
- Como verifiquei: `pnpm typecheck` verde no estado atual (linha de base); conferi na documentação do Next 16 que
  `revalidate` precisa ficar exportado na rota (sem `cacheComponents`) e que o build não mostra mais "First Load JS"
  (por isso a verificação de peso usa o manifesto de prerender e os bytes de script no Playwright).
- Para o próximo (seguranca): análise de ameaças — principal é perda ou corrupção da casa salva (formato não muda; store
  copiado byte a byte) e `node:fs` vazando para o navegador (barrado pela regra `.servidor`). Depois: frontend
  implementa os passos 1–8; qa faz o passo 0 **antes** de qualquer mudança. Para documentacao (etapa 8): atualizar
  caminhos em `docs/arquitetura.md`, `docs/roteiro.md`, `docs/sistema/site.md`, a nota "Estado atual" do `CLAUDE.md` e
  `.claude/agents/ux-acessibilidade.md`, que ainda citam `components/` e `lib/`.

### [seguranca] 2026-10-29 — análise de ameaças: aprovado para implementar; uma pergunta ao tech-lead antes do passo 1
- O que fiz: li o desenho técnico inteiro e o código atual (`lib/store.ts`, `lib/dados.ts`, `lib/resumo.ts`,
  `lib/rascunho.ts`, `app/page.tsx`, `Casca`, `Cadastro`, `EditorAparelho`, rotas de `/casa`); conferi no zustand
  quando o `persist` grava; conferi no build atual onde aparecem a chave da casa, `node:fs` e endereços externos;
  preenchi "Ameaças" (17 ameaças, A1–A17) e os 15 pontos verificáveis da etapa 6 (R1–R15).
- Decisões e porquê: **aprovado para implementar**. O desenho já cobre os riscos graves: um só store (A1), formato salvo
  byte a byte (A2), portão de hidratação (A3), contrato do editor (A4), apagar tudo (A5) e nenhum dado novo saindo (A15).
  Eles continuam crítico/alto porque um deslize na execução apaga a casa da família — por isso viram conferência com
  evidência na etapa 6, não confiança. O ponto fraco do desenho é o script de camadas (A13, médio): do jeito que está,
  ele pode dizer "tudo certo" lendo 0 arquivos e não vê `require`, módulos do Node sem `node:` nem `'use client'` com
  aspas simples. Pedi os ajustes e o `import "server-only"` ao tech-lead em "Perguntas abertas".
- Arquivos alterados: `docs/equipe/historias/HIS-001-camadas.md` (só "Ameaças", "Perguntas abertas" e esta nota),
  `docs/equipe/agentes/seguranca/contexto.md` e `diario.md`. Nenhum código mudou.
- Como verifiquei: `grep` no `apps/web/src` e no `.next/static` atual (linha de base: chave da casa em 1 arquivo,
  sem `readFile`/`process.cwd`, sem host de terceiros); leitura de `zustand/esm/middleware.mjs` (l. 397–428: só grava ao
  hidratar quando a versão muda); docs do Next 16 sobre `server-only` (tratado internamente, sem pacote).
- Para o próximo: **tech-lead** — responder a pergunta aberta antes do passo 1. **frontend** — seguir a tabela de
  diretivas à risca; nada de `filter` próprio no editor nem de mexer em `localStorage` à mão; `PaginaInicial` só importa
  componentes de módulos `"use client"`. **qa** — além da seção 10, incluir: (1) com casa v2 salva, abrir `/comecar`
  direto mostra "você já cadastrou", não o passo "estado"; (2) editar um aparelho pelo "Quem mais gasta" e pelos
  cômodos mantém o mesmo `id` e a mesma quantidade de aparelhos no JSON salvo; (3) remover um aparelho que está no plano
  tira as dicas dele do `plano`; (4) depois de "Apagar todos os meus dados", `state` sem `residencia` e cinco listas vazias.

### [tech-lead] 2026-10-29 — pergunta do seguranca sobre o script respondida; seção 6 revisada
- O que fiz: aceitei os ajustes (a)–(f) da A13 e o `import "server-only"` da A6; reescrevi a seção 6 e ajustei os
  passos 1 e 5, o contrato 4.4, a linha de risco do `node:fs` e o item 7 da seção 10 (casos negativos alinhados com R13).
- Decisões e porquê: barreira que diz "tudo certo" sem ter lido nada é pior que nenhuma; o `server-only` é tratado pelo
  próprio Next 16 (doc conferida, sem pacote novo) e cobre o caso indireto. Recusei o grafo de imports no script e o
  parser: o build e o ESLint (HIS-002) cobrem, e o script continua pequeno e sem dependência.
- Arquivos alterados: esta história (seções 4.4, 6, 8, 9, 10 e "Perguntas abertas"); meu `diario.md`. Não mexi em "Plano de testes".
- Como verifiquei: li a seção do Next 16 sobre `server-only` e conferi `next/dist/compiled/server-only` no `node_modules`.
- Para o próximo (frontend, depois do passo 0 do qa): o passo 1 já inclui as regras novas do script e os casos negativos.

### [qa] 2026-10-29 — passo 0 feito: linha de base sem erros e plano de testes escrito; frontend liberado
- O que fiz: build de produção do código atual (`apps/web/src` = `main` `57700ab`) na porta 3100; escrevi
  `apps/web/e2e-base/linha-de-base.cjs` (modos `capturar` e `comparar`) e gerei as fixtures `casa-v1.json`/`casa-v2.json`
  a partir da casa salva pelo próprio fluxo; rodei a linha de base, uma segunda execução de controle e um teste negativo
  do comparador; preenchi "Plano de testes" (13 itens com números e critérios).
- Decisões e porquê: relógio, fuso e `crypto.randomUUID` fixos no navegador, para textos, DOM e casa salva serem
  comparáveis byte a byte em dias diferentes; tolerância de 16/255 por canal nas capturas, porque duas execuções do mesmo
  build diferem até 10/255 na borda de pílulas dentro do `<dialog>` (medido); bytes de JS somados por arquivo `.js`, não só
  `initiatorType: "script"`, porque o Next pré-carrega chunks por `<link rel="preload">` (os dois números ficam no
  `resumo.json`); as quatro verificações pedidas pela segurança (portão de hidratação, ids no editor, plano ao remover,
  apagar tudo) entraram no script, não só no plano.
- Arquivos alterados: `apps/web/e2e-base/linha-de-base.cjs`, `apps/web/e2e-base/fixtures/casa-v1.json` e `casa-v2.json`
  (novos; o commit `d743c1f` levou uma versão intermediária deles, a árvore de trabalho tem a final); esta história
  (só "Plano de testes" e esta nota); `docs/equipe/agentes/qa/contexto.md` e `diario.md`. Nenhum código de `apps/web/src`.
- Como verifiquei: `capturar` → 0 erros de console/página, 84 capturas, 84 textos, 8 fotos do DOM, 21 transições em
  cada largura, migração v1/v2 ok, `/comecar` com casa mostra "Você já cadastrou", editar mantém ids, remover o chuveiro
  limpa o `plano`, apagar esvazia a casa; JS `/` 185 227 B, `/comecar` 185 227 B, `/casa` 231 010 B (sem casa) e
  211 700 B (com casa); prerender da `/` com 86400 e `htmlSize` 66 350. `comparar antes controle` → "nada mudou".
  Teste negativo (1 texto, 1 retângulo, 1 item do plano, +2 KB de JS) → as 4 acusadas, saída 1.
  Evidências: `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/his001/antes/` (capturas, textos,
  `dom/`, casas salvas, `resumo.json`, `prerender-manifest.json`, `build.log`) e `…/his001/controle/`.
  Defeitos encontrados: nenhum.
- Para o próximo: **frontend** — pode começar o passo 1. Ao fim do passo 5 (página inicial) e do passo 8, rodar
  `capturar …/his001/depois` e `comparar …/his001/antes …/his001/depois` (comandos no "Plano de testes"); não usar
  `--gerar-fixtures`. **seguranca** — no R9, `curl -sI localhost:3100/casa/aparelhos` dá **200**, não 307, já no `main`:
  a página é estática e o redirecionamento vai dentro do conteúdo (`NEXT_REDIRECT;replace;/casa/comodos;307`) e acontece no
  navegador. O script confere as duas coisas; sugiro trocar a expectativa do R9. **qa (eu, etapa 5)** — comparação
  completa + teclado, zoom 200% e nomes acessíveis no "depois".

### [frontend] 2026-10-29 — HIS-001 implementada nos passos 1–8; tudo igual na tela, uma diferença de peso explicada
- O que fiz: segui a seção 8 do desenho, com um commit local por passo e `git mv` em todo arquivo que mudou de lugar.
  Commits: `87bb6ba` Cria o verificador de camadas do ADR-001 · `74cd08d` Separa os componentes genéricos de interface
  em ui/ · `df8c6fb` Move o store e os dados públicos para infraestrutura/ e cria aplicacao/ · `a1c23d8` Reúne os
  componentes de aparelho em ui/aparelho/ e tira o store do editor · `acb65fc` Separa a página inicial em rota fina,
  funcionalidade e leitura de servidor · `ddd061b` Move o assistente de cadastro para funcionalidades/cadastro ·
  `bd85f7e` Move as telas de /casa para funcionalidades/ e deixa as rotas finas · `4bcc7e8` Liga o verificador de
  camadas ao pnpm typecheck (e o commit desta nota).
- Decisões e porquê (onde o desenho deixava escolha ou não funcionava como escrito):
  1. **Regex do `import(` não literal:** a expressão da seção 6 (`/\bimport\s*\(\s*(?!…)/`) dá falso positivo com
     espaço antes das aspas (`import( "x")`), porque o `\s*` recua e o lookahead olha o espaço. Usei a mesma regra com o
     `\s*` dentro do lookahead: `/\bimport\s*\((?!\s*["'][^"'`]+["']\s*\))/`. O sentido é o mesmo, só sem o recuo.
  2. **Arquivo `.servidor`** = `/\.servidor\.tsx?$/`, a mesma definição para "módulo do Node só em
     infraestrutura/**/*.servidor.ts" e para "todo .servidor começa com server-only". `server-only` precisa ser o
     **primeiro** import pela posição no arquivo. No domínio, só `./` é aceito (nem `../`).
  3. **`Variante`, `estilosBotao` e `baseBotao`** continuam sem `export` em `ui/Botao.tsx`, como no `ui.tsx`: ninguém
     usa e, exportados de um módulo `"use client"`, viravam a armadilha da A7. `Acoes` e `nomeDoComodo` também seguem sem export.
  4. Ao tirar `export type { LeituraRelogio }` do `Acompanhamento.tsx`, tirei também o `type LeituraRelogio` do import,
     que ficou sem uso. Os ids e textos não mudaram.
  5. **Histórico do git:** `ui.tsx → ui/Botao.tsx` e as rotas `app/casa/*/page.tsx` → `funcionalidades/*` aparecem como
     "apaga + cria" no `git diff -M` (o arquivo dividido ficou abaixo de 50% de semelhança; a rota continua existindo no
     mesmo caminho). **Revisem com `git diff -M -C main -- apps/web/src`**: aí cada corpo aparece como cópia com 2–47
     linhas mudadas (só imports e o nome da função).
- Arquivos alterados: `scripts/verificar-camadas.mjs` (novo), `package.json` (scripts `camadas` e `typecheck`) e todo
  `apps/web/src` (estrutura da seção 5, igual à do desenho; `components/` e `lib/` não existem mais). Nenhuma dependência,
  `next.config.ts`, lockfile, `globals.css` ou CI mudou.
- Como verifiquei:
  - `pnpm typecheck` (com `Camadas: tudo certo (64 arquivos)`), `pnpm test` (37 + 11) e `pnpm build` verdes. Tabela de
    rotas igual à do `main` (8 rotas estáticas, `/` com revalidate de 1 dia); prerender da `/` com `86400` e `htmlSize`
    66 350 (igual). `grep -rn '@/components\|@/lib' apps/web/src` vazio.
  - Conferi por conta própria R1, R3, R4, R5, R7, R8, R14 e R15: um só `create` e uma só chave da casa (1 arquivo em
    `.next/static`), `useCasa` ausente de `ui/`, `node:`/`process.cwd` só em `arquivos.servidor.ts`, nada de
    `readFile`/`relatorio.json` em `.next/static`, diretivas iguais à tabela da seção 3, `revalidate` só em `app/page.tsx`.
  - **Script de camadas:** 36 verificações em cópias no scratchpad (`…/his001/teste-camadas/testar.mjs`), todas certas:
    cópia limpa rodada de `/` (código 0, 64 arquivos), link simbólico ignorado e 34 casos negativos com código 1 e a
    mensagem da regra (todos os do item 7 e do R13, mais `import type` em várias linhas, `export { } from`, `.servidor`
    com extensão e BOM, `server-only` fora do lugar ou depois de outro import, 0 arquivos no domínio, `app`/`aplicacao`/
    `infraestrutura`/`config` importando para cima). Rodei também contra a árvore sintética antes do passo 2. Nenhuma violação ficou no repositório.
  - **Comparação do QA** (`capturar …/his001/depois` e `comparar …/antes …/depois`): **84 capturas iguais e 98
    textos/DOM/casas salvas iguais**; 21 transições por largura, migração v1/v2, portão de hidratação, ids no editor,
    remover do plano, apagar tudo e console com 0 erro iguais à linha de base; ruído de rasterização ≤ 16/255 em 2
    capturas (aviso, como no controle). Olhei 390 (`16-acompanhamento`, `23-comodos-editor-aparelho`) e 1280
    (`01-inicio`, `08-cadastro-comodo-2`, `29-minha-casa`). O `comparar` sai com 1 por 4 itens:
    - `controle-comparacao.txt` falta no "depois", `build.log` e `saida-capturar.txt` diferentes: são logs de evidência
      (o `build.log` difere só nos tempos de compilação). Não são o site.
    - **JS de `/casa` sem casa: 231 010 → 232 459 B (+1 449, limite 1 024).** Com casa: +567; `/` e `/comecar`: −823.
      Investiguei com builds do `main` e de cada commit numa cópia no scratchpad: o aumento nasce no passo 2 (+4 887),
      e os passos 4 e 7 devolvem parte. **Não é código novo:** somando os módulos sem repetição, a visita baixa menos código
      que antes (≈ 643 → 636 KB brutos); o que cresce é a **repetição** de módulos entre chunks (≈ 97 → 113 KB brutos).
      No `main`, o `ui.tsx` inteiro entrava no chunk do layout de `/casa` (a `Casca` o importava) e servia a todas as
      páginas. Agora a `Casca` só usa `Aviso` e `Botao`, e `Pilulas`, `Folha`, `Contador` e `Opcao` vão para o chunk de
      cada página: na visita "sem casa", `Pilulas`/`Folha`/`Contador` aparecem em 4 chunks (antes 1), porque o Next
      pré-carrega as outras abas e o cadastro pelos `<Link>`. O JS que **cada página precisa para abrir** (o que o HTML
      referencia) ficou menor em todas as rotas: `/` 205 544 → 203 839, `/comecar` 213 221 → 212 188, `/casa` 216 308 →
      214 680, `/casa/comodos` 213 014 → 212 577, `/casa/dicas` 207 028 → 205 653, `/casa/ajustes` 204 091 → 203 592 B gzip.
      **Não corrigi:** voltar a juntar os componentes num módulo desfaz a decisão 2 (um arquivo por componente) ou é um
      barril (decisão 7), e mexer no agrupamento de chunks exige mudar o `next.config.ts` (R14). Fica para o tech-lead
      decidir (pergunta abaixo).
- Para o próximo: **qa** — etapa 5 (teclado, zoom 200%, nomes acessíveis). O item 11 vai continuar vermelho só em
  `/casa` sem casa até o tech-lead responder; sugiro medir também o JS do HTML de cada rota (o que bloqueia a abertura),
  além do total depois do prefetch. **seguranca** — R2 (`git diff main:apps/web/src/lib/store.ts
  HEAD:apps/web/src/infraestrutura/armazenamento/casa.ts`: só o import e a saída do `novoId`), R4 no `EditorAparelho`
  (`aoSalvar(limpo, id)` → `aoFechar()`; `aoRemover(r.id!)` → `aoFechar()`; o hook usa as três ações do store) e R12/R13
  no script (a regex do item 1 acima é diferente da escrita no desenho). **tech-lead** — a pergunta aberta sobre o peso.

### [tech-lead] 2026-10-29 — peso do JS: diferença aceita, item 11 passa a medir o JS que abre a página
- O que fiz: respondi a pergunta do frontend em "Perguntas abertas". Medi por conta própria o JS referenciado pelo HTML
  das 7 rotas em builds de `57700ab` e `182f355`, numa cópia no meu scratchpad (o `.next` do repositório não foi tocado).
- Decisões e porquê: **aceito, sem mudança de código.** O JS para abrir caiu em todas as rotas (−437 a −1 705 B; `/sobre`
  igual); só cresce a repetição baixada em segundo plano pelo prefetch (+1 449 B na sessão inteira). Juntar os componentes
  de novo ou mexer no `next.config.ts` desfaria as decisões 2 e 7 e o R14 por ~30 ms em 3G fora do caminho de abertura.
  Item 11 vira 11a (JS do HTML, ≤ +1 024 B, principal) e 11b (total com prefetch, ≤ +2 048 B).
- Arquivos alterados: esta história ("Perguntas abertas" e esta nota); meu `contexto.md` e `diario.md`. Não mexi em
  "Plano de testes", "Ameaças" nem em código.
- Como verifiquei: `pnpm build` + `next start` (porta 3102) dos dois commits; `js-do-html.mjs` (no meu scratchpad, citado na
  resposta) — os números do `main` batem com os do frontend, descontado o polyfill `noModule` que o navegador moderno não baixa.
- Para o próximo: **qa** — atualizar o item 11 do "Plano de testes" e o `linha-de-base.cjs` com 11a/11b (pode reaproveitar
  a extração do meu script) e marcar o item como aprovado. Depois sigo para o code review da etapa 7.

### [seguranca] 2026-10-29 — revisão de código (etapa 6): aprovado com ressalvas (baixo)
- O que fiz: conferi R1–R15 com comando e resultado (tabela em "Ameaças → Revisão de código (etapa 6)"); comparei as
  linhas que não são import de cada arquivo movido ou dividido com o `main`; build próprio e servidor na porta 3107
  (rotas, redirecionamento, prerender, hosts e chave da casa no `.next/static`); `pnpm audit`; busca de segredos no
  `git log -p`; revisei o `linha-de-base.cjs` e as fixtures do QA. Repeti o roteiro do frontend (36/36 ok) e rodei 21
  casos meus contra o script, inclusive a regex nova do `import(`; provei numa cópia que o `server-only` derruba o build
  no caso indireto que o script não vê.
- Decisões e porquê: **aprovado com ressalvas (baixo).** Nada do que era crítico/alto (A1–A5, A15) aconteceu: um store,
  formato salvo byte a byte, portão de hidratação, editor e apagar tudo iguais, nenhuma dependência, configuração ou
  envio novo. A regex do `import(` do frontend está certa (sem o falso positivo do desenho e sem perder caso). Ficam
  dois baixos: S1, lacunas do script que pedem escrita deliberada (`from"x"` sem espaço, `.js/.jsx`, link simbólico
  pulado em silêncio, caminho absoluto, `getBuiltinModule`, `"use server"`); S2, a constante `VOLTAR` importada de
  módulo `"use client"` pela `/sobre` (pré-existente).
- Arquivos alterados: esta história (só a subseção "Revisão de código (etapa 6)" em "Ameaças" e esta nota);
  `docs/equipe/agentes/seguranca/contexto.md` e `diario.md`. Nenhum código. Repositório sem violação deixada (`git status`
  só com docs); cópias apagadas.
- Como verifiquei: ver a tabela; roteiros em `…/scratchpad/his001/seg-camadas/` (`testar-seg.mjs`, `ciclos.mjs`,
  `saida.txt`), saída do roteiro do frontend em `…/his001/seg-testar-frontend.txt`, build em `…/his001/seg-build.log` e
  `seg-build-indireto.log`.
- Para o próximo: **tech-lead** — etapa 7 liberada pela segurança; levar S1 e S2 para a HIS-002 (correções na tabela de
  achados). **qa** — nada novo da minha parte. **documentacao** — R9: a expectativa certa é 200 com `NEXT_REDIRECT` no
  conteúdo, não 307.

### [qa] 2026-10-29 — etapa 5: aprovado
- O que fiz: rodei a comparação antes × depois de forma independente, com build próprio de `182f355` numa cópia isolada
  (outro agente reconstruiu o `.next` do repositório no meio do meu teste); medi o 11a no `main` `57700ab` numa segunda
  cópia; incorporei 11a/11b ao `linha-de-base.cjs` (modo `medir-js-html`, chamado também no fim do `capturar`) e ao
  "Plano de testes"; escrevi e rodei o roteiro manual (`manual-qa.cjs`) igual contra o `main` e o "depois": teclado no
  cadastro, nas folhas e nas abas, nomes acessíveis (árvore de acessibilidade do Playwright), movimento reduzido, zoom
  200% em 390 px, `/casa/aparelhos` e `#comodo-<id>` pelo link do acompanhamento e direto. Olhei 9 capturas novas
  (390: `07-cadastro-comodo-1`, `23-comodos-editor-aparelho` — a de maior ruído —, `26-dicas`, `ancora-pelo-link-390`,
  `zoom200-_casa`; 1280: `01-inicio`, `16-acompanhamento`, `29-minha-casa`, `folha-comodos-teclado-1280`).
- Decisões e porquê: **aprovado.** Todos os critérios de aceite verificados: 1–3 (camadas: `pnpm camadas` verde no
  typecheck), 4 (casa v2 e v1 abrem iguais), 5 (84 capturas, 98 textos/DOM/casas, 21 transições por largura, 0 erros no
  console, iguais ao `main`), 6 (barreiras verdes). Item 11 aprovado com o critério novo do tech-lead: 11a caiu em todas
  as rotas (−437 a −1 705 B, `/sobre` 0) e 11b +1 449 B no pior caso (limite 2 048). Teclado, nomes acessíveis, movimento
  reduzido e a âncora funcionam e saem idênticos ao `main`. Os 4 achados (P1–P4) são **pré-existentes** (iguais no
  `main`) e ficam fora desta história, que proíbe mudança visual.
- Arquivos alterados: `apps/web/e2e-base/linha-de-base.cjs` (11a/11b, `medir-js-html`, logs ignorados no `comparar`);
  esta história (só "Plano de testes" — item 11 em 11a/11b e "Resultado da etapa 5" — e esta nota);
  `docs/equipe/agentes/qa/contexto.md` e `diario.md`. Nenhum código de `apps/web/src`.
- Como verifiquei: `comparar antes depois-qa` → "nada mudou", código 0; teste negativo do 11a/11b (as duas acusadas);
  números do 11a batem byte a byte com o `js-do-html.mjs` do tech-lead. Evidências em
  `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/his001/depois-qa/` (`saida-comparar.txt`,
  `js-do-html.json`, `resumo.json`, `typecheck.log`, `test.log`, `build.log`, `foco-cidade-*.txt`),
  `…/his001/manual-qa-depois/` e `…/his001/manual-qa-main/` (`manual.json`, `aria/`, `capturas/`); o 11a do `main` foi
  gravado em `…/his001/antes/js-do-html.json`. Defeitos da HIS-001: **nenhum**.
- Para o próximo: **tech-lead** — etapa 7 liberada pelo qa. **ux-acessibilidade** — P1 (foco no passo "cidade") e P2
  (zoom 200%: rolagem horizontal em `/`, `/casa`, `/casa/dicas`) para o backlog. **frontend** — P3 (âncora pelo link não
  alinha ao topo) para o backlog. **quem orquestra** — builds em paralelo no mesmo `apps/web/.next` derrubam o servidor de
  quem está testando: cada papel deve compilar numa cópia própria (ou combinar a vez).

### [tech-lead] 2026-10-29 — code review final (etapa 7): aprovado; S1/S2 para a HIS-002, P1–P4 no backlog
- O que fiz: revisei o diff `main...HEAD` arquivo a arquivo contra o desenho (seção 12 do "Desenho técnico"): camadas,
  diretiva de cada um dos 55 arquivos, rotas finas, `PaginaInicial` sem diretiva, `revalidate` na rota, um só `create`,
  contratos 4.1–4.4, tipos, código morto, nomes, comentários e o `verificar-camadas.mjs`. Rodei as barreiras e uma fumaça
  de console em 390/1280 px numa cópia própria.
- Decisões e porquê: **aprovado** — tudo como o desenho pede e as barreiras verdes. **S2 vai para a HIS-002** (não peço
  ao frontend agora): é pré-existente e inofensivo, a correção mexe em 5 arquivos e no payload da `/sobre` e anularia a
  comparação byte a byte do qa e a revisão da segurança por ganho zero para a família; e só faz sentido junto com a regra
  automática, que é o tema da HIS-002. **ESLint × script** (pendência minha): os dois convivem, sem regra repetida — o
  ESLint fica com as regras que dependem só do próprio arquivo (matriz de camadas, `require`, `import()` não literal,
  `"use server"`, pacotes por camada), lendo a árvore de sintaxe, o que fecha a maior parte da S1; o script fica com o
  que exige olhar outro arquivo ou a estrutura (diretiva do destino, contrato `.servidor`/`server-only`, pastas antigas,
  0 arquivos, link simbólico = erro). Detalhes e critérios de aceite na HIS-002. Três observações sem bloqueio (T1–T3).
- Arquivos alterados: esta história (seção 12 do desenho e esta nota); `docs/equipe/historias/HIS-002-qualidade-automatica.md`
  (critérios 7–9 e "Notas do tech-lead vindas da HIS-001"); `docs/planejamento.md` (HIS-107 e HIS-108 na E1, com P1–P4);
  `docs/equipe/quadro.md`; meu `contexto.md` e `diario.md`. Nenhum código.
- Como verifiquei: repositório — `pnpm typecheck` (`Camadas: tudo certo (64 arquivos)`) e `pnpm test` (37 + 11) verdes;
  cópia em `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/tl-revisao/` — `pnpm typecheck` e
  `pnpm build` verdes (`build.log`), prerender da `/` `86400`/66 350, chave da casa em 1 arquivo, `fumaca.cjs` com as 9
  entradas × 2 larguras → 200 e 0 erros; `grep` de diretivas, `create(`, `revalidate`, `any`/`as`/`@ts-` em linhas novas
  e de exports sem uso (comparado com o `main`).
- Para o próximo: **documentacao** (etapa 8) — atualizar os caminhos em `docs/arquitetura.md`, `docs/roteiro.md`,
  `docs/sistema/site.md` e `.claude/agents/ux-acessibilidade.md`, e propor ao dono do projeto o texto novo da nota
  "Estado atual" do `CLAUDE.md`; registrar o `scripts/verificar-camadas.mjs` (`pnpm camadas`) e a convenção `*.servidor.ts`; R9 com 200 + `NEXT_REDIRECT`.
  **scrum-master** (etapa 9) — Definição de Pronto e priorizar HIS-107/HIS-108.

### [documentacao] 2026-10-29 — etapa 8: documentação atualizada para as camadas; pronta para a Definição de Pronto
- O que fiz: li a história inteira e conferi cada caminho no código (`find apps/web/src`, 1ª linha de cada arquivo,
  exports, `scripts/verificar-camadas.mjs`, `package.json`). Troquei tudo o que citava `components/` e `lib/` nos
  documentos vivos e descrevi a estrutura real.
- Documentos que mudaram:
  - `docs/arquitetura.md` — sem a nota "a migração é a HIS-001"; árvore real de `apps/web/src`, diagrama Mermaid de quem
    importa quem (validado com `mmdc`), tabela de regras do ADR-001 revisado, decisões (porta única `aplicacao/`, um só
    store, `ui/` sem estado, `*.servidor.ts` + `server-only`, sem `index.ts`, rotas finas sem `"use client"`) e a seção
    "Verificador de camadas" (o que acusa, saída, limites que ficam para a HIS-002).
  - `docs/sistema/site.md` — rotas finas (com o tipo de cada uma; `/casa/aparelhos` = 200 com `NEXT_REDIRECT`, como pediu a
    seguranca no R9), tabelas novas de telas (`funcionalidades/`), componentes (`ui/` e `ui/aparelho/`), casos de uso
    (`aplicacao/`) e estado e armazenamento (`infraestrutura/`).
  - `docs/sistema/desenvolvimento.md` — `pnpm camadas`, verificador dentro do `pnpm typecheck` e do CI, exemplo de saída,
    `scripts/` e `apps/web/e2e-base/` na estrutura, tabela "onde colocar um arquivo novo".
  - `docs/sistema/diagramas.md` — caminho do `Cadastro.tsx` e das telas (nenhum diagrama mudou).
  - `docs/roteiro.md` (só o caminho de `DadosCasa`), `.claude/agents/ux-acessibilidade.md` (componentes em `src/ui/`),
    `docs/sistema/glossario.md` (termo "Camadas"), `docs/equipe/decisoes/README.md`, `docs/README.md`, `README.md`.
    `.claude/agents/frontend.md` não citava caminho antigo: não mudou.
  - `CHANGELOG.md` — entrada "Código do site organizado em camadas (HIS-001)".
- Resumo do changelog: **Para quem usa** — nada muda; telas, textos, animações e a casa guardada continuam iguais.
  **Técnico** — `apps/web/src` em `app/`, `funcionalidades/`, `ui/`, `ui/aparelho/`, `aplicacao/`, `infraestrutura/`,
  `config/`; `components/` e `lib/` removidas; `aplicacao/` como porta única e `useEdicaoDeAparelho`; store no mesmo
  formato (versão 2); página inicial com `*.servidor.ts` + `server-only`; verificador `pnpm camadas` no `typecheck`/CI;
  ADR-001 revisado; nenhuma dependência nova.
- Não mudei: `CLAUDE.md` (o texto proposto para a nota "Estado atual" foi entregue a quem orquestra, para o dono do
  projeto decidir); notas antigas de histórias e o "Contexto" do ADR-001, que citam `lib/` como registro histórico.
- Como verifiquei: `pnpm camadas` → `Camadas: tudo certo (64 arquivos)`, código 0, também rodado de `/tmp`; `pnpm typecheck`
  verde; numa cópia no meu scratchpad, um `ui/` importando `@/aplicacao/casa` deu exatamente a mensagem documentada e código 1;
  `mmdc` renderizou o diagrama novo; `grep` de `components/|lib/` nos documentos vivos só acha as duas menções intencionais
  (pastas que não existem mais). Nenhuma menção a instituição de ensino ou a parceiros.
- Para o próximo: **scrum-master** — a história está pronta para conferir a Definição de Pronto (etapa 9).

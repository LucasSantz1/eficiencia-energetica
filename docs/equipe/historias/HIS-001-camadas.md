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
import type { ArquivoTarifas } from "@ee/core";
export interface RelatorioDados { municipios: number; municipiosSemDistribuidora: number }
export function lerTarifasPublicadas(): Promise<ArquivoTarifas>;  // lê public/dados/tarifas.json (process.cwd() na chamada)
export function lerRelatorioPublicado(): Promise<RelatorioDados>; // lê public/dados/relatorio.json
// Os `as` de hoje ficam aqui, na fronteira; a validação com zod entra na HIS-003.

// aplicacao/numeros-do-inicio.servidor.ts (sem diretiva)
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

Script **`scripts/verificar-camadas.mjs` na raiz do repositório**, Node 22 puro (`node:fs`, `node:path`), sem dependência.

- **Arquivos lidos:** `apps/web/src/**/*.{ts,tsx,mts,mjs}` e `packages/core/src/**/*.ts`.
- **Imports extraídos** (aceita import em várias linhas e `import type`):
  `/\bfrom\s+["']([^"']+)["']/g`, `/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g`, `/^\s*import\s+["']([^"']+)["']/gm`.
- **Resolução:** `@/x` → `apps/web/src/x`; `./` e `../` → `path.resolve(pasta do arquivo, x)`; o resto é pacote externo.
- **Camada** = primeira pasta abaixo de `src/`: `app`, `funcionalidades/<nome>`, `ui`, `aplicacao`, `infraestrutura`,
  `config`. Arquivo ou destino fora delas (ex.: `components/`, `lib/`) → erro "fora das camadas".
- **Regras** (destino interno permitido por origem; o resto é erro):

| Origem | Pode importar |
| --- | --- |
| `app` | `app`, qualquer `funcionalidades/*`, `ui`, `aplicacao`, `config` |
| `funcionalidades/X` | `funcionalidades/X` (a mesma), `ui`, `aplicacao`, `config` |
| `ui` | `ui`, `config` |
| `aplicacao` | `aplicacao`, `infraestrutura`, `config` |
| `infraestrutura` | `infraestrutura`, `config` |
| `config` | `config` |

- **Regras de pacote externo:** `zustand` e `zustand/*` só em `infraestrutura`; `node:*`, `fs`, `fs/promises`, `path`
  só em `infraestrutura/**/*.servidor.ts`; `@ee/core`, `react`, `next/*`, `lucide-react` em qualquer camada.
- **Cliente × servidor:** arquivo cujo primeiro comando é `"use client"` não pode importar caminho terminado em `.servidor`.
- **Domínio (ADR-001 regra 6):** em `packages/core/src`, só import relativo (`./`); qualquer outro → erro.
- **Pastas antigas:** se `apps/web/src/components` ou `apps/web/src/lib` existir → erro "pasta antiga ainda existe".
- **Saída:** uma linha por problema, ex.:
  `apps/web/src/ui/Botao.tsx → @/aplicacao/casa: ui não pode importar aplicacao (ADR-001, regra 4)`;
  no fim `N problema(s)` e código de saída 1; sem problemas, `Camadas: tudo certo (N arquivos)` e código 0.
- **Ligação:** no `package.json` da raiz, `"camadas": "node scripts/verificar-camadas.mjs"` (passo 1) e, no último passo,
  `"typecheck": "pnpm camadas && pnpm -r --if-present typecheck"`. O CI (`ci.yml`) já roda `pnpm typecheck`: não muda.
  Durante a migração, `pnpm camadas` falha listando o que falta mover — serve de lista de tarefas.
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
1. Criar `scripts/verificar-camadas.mjs` e o script `camadas` (ainda fora do `typecheck`).
2. **`ui/` genérico:** dividir `ui.tsx`; `git mv` de Icone, Marca, Movimento, Barras, Etiqueta, EspacoReservado,
   BuscaCidade; corrigir imports em todos os arquivos.
3. **`infraestrutura/` + `aplicacao/`:** store, identificador, `navegador.ts`, `aplicacao/casa.ts` (por enquanto sem
   `useEdicaoDeAparelho`), `aplicacao/resumo.ts`, `aplicacao/dados-publicos.ts`. Trocar `@/lib/store` → `@/aplicacao/casa`,
   `@/lib/dados` → `@/aplicacao/dados-publicos`, `@/lib/resumo` → `@/aplicacao/resumo` (o `rascunho` ainda fica em `lib/`).
4. **`ui/aparelho/`:** dividir `Comodo.tsx`, mover TempoUso, SeletorCatalogo, EditorAparelho (props novas) e criar
   `useEdicaoDeAparelho`; ajustar `app/casa/page.tsx`, `app/casa/comodos/page.tsx`, `Cadastro.tsx` e `lib/rascunho.ts`.
5. **`funcionalidades/inicio/`** + `arquivos.servidor.ts` + `numeros-do-inicio.servidor.ts`; `app/page.tsx` fino.
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
| `node:fs` chegando ao navegador (erro de build) | só em `*.servidor.ts`; o script barra `"use client"` → `.servidor` |
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
7. **Teste do próprio script:** pôr temporariamente `import { useCasa } from "@/aplicacao/casa";` em `ui/Botao.tsx` →
   `pnpm camadas` falha com a mensagem da regra 4; tirar → volta a passar.

### 11. Fora desta história (dívida registrada no contexto do tech-lead)

- Regras de negócio que ainda moram no site e devem ir para `@ee/core` com teste: `faixaDoPeso` (`ui/Etiqueta`) e a
  mesma escala repetida em `CasaIlustrada`; as regras do rascunho do cadastro (banhos por pessoa, 8 min); `tarifaMedia`;
  `descreverUso`/`horasPorDiaTexto`; `semAcento` repetido em `SeletorCatalogo` e `BuscaCidade`.
- Dividir `Cadastro.tsx` (554 linhas) e `TelaComodos.tsx` (415) em componentes menores.
- Validação na fronteira (`as` em `arquivos.servidor.ts`, `navegador.ts` e no `migrate`): HIS-003, em `infraestrutura/validacao/`.

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
  `curl -sI localhost:3100/casa/aparelhos` → 307 para `/casa/comodos`; `/casa/comodos?visao=geral` abre a visão geral.
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

## Plano de testes

_(qa — a preencher)_ Teste de ponta a ponta antes e depois com as mesmas capturas; teste com localStorage da versão atual.

## Perguntas abertas

- [x] `[para: tech-lead]` Os componentes compartilhados de aparelho vão para `ui/aparelho/` ou ficam em `funcionalidades/comodos/` exportados por um `index.ts` público?
  — **resposta (tech-lead, 2026-10-29):** vão para `ui/aparelho/`, sem store (props entram, callbacks saem). `EditorAparelho` também, ligado à casa pelo hook `useEdicaoDeAparelho()` de `aplicacao/casa.ts`. Um `index.ts` em `comodos` faria o cadastro e o acompanhamento importarem outra funcionalidade. `ui/` pode chamar funções puras do `@ee/core`; ADR-001 regra 4 revisada. Detalhes no desenho técnico, seções 2 e 4.
- [ ] `[para: tech-lead]` (seguranca, 2026-10-29 — responder **antes do passo 1**; não bloqueia o resto do desenho)
  Aceita estes ajustes na seção 6 para o `verificar-camadas.mjs` não ter falso negativo (ameaça A13)?
  (a) achar a raiz pelo `import.meta.dirname`, não pelo `cwd`, e **falhar se ler 0 arquivos**;
  (b) `require("…")` e `import(` com argumento que não é texto fixo viram erro;
  (c) módulos do Node pela lista `builtinModules` de `node:module`, com e sem `node:` (hoje só `node:*`, `fs`, `fs/promises`, `path`);
  (d) reconhecer a diretiva ignorando BOM, comentários e aspas simples/duplas;
  (e) casar `.servidor` com ou sem extensão (`/\.servidor(\.tsx?)?$/`);
  (f) destino fora de `apps/web/src` (ex.: JSON de `public/`) e arquivo solto em `funcionalidades/` = erro "fora das camadas".
  E aceita `import "server-only";` na 1ª linha de `arquivos.servidor.ts` e `numeros-do-inicio.servidor.ts` (ameaça A6)?
  O Next 16 trata esse import internamente (sem pacote novo) e barra no build o caso **indireto** que o script não vê.

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

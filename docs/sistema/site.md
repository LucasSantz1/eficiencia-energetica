# O site por dentro (`apps/web`)

Manual técnico do site: rotas, componentes, estado, dados, aparência e movimento.
A organização em camadas que vem com a HIS-001 está em [../arquitetura.md](../arquitetura.md).

## Tecnologias

| Pacote | Versão | Para quê |
| --- | --- | --- |
| Next.js | 16.4.3 | rotas (App Router), páginas estáticas, Turbopack |
| React | 19.3.1 | interface, `<ViewTransition>` para as transições |
| Tailwind CSS | 4.3.3 | estilos com tokens em `@theme` |
| Zustand | 5.0.16 | estado da casa, guardado no navegador |
| lucide-react | 1.64.0 | ícones |
| Atkinson Hyperlegible Next, Archivo | 5.3.0 | fontes (texto e títulos da página inicial) |

## Rotas (`src/app/`)

| Arquivo | Tipo | Observação |
| --- | --- | --- |
| `layout.tsx` | servidor | fontes, metadados, `lang="pt-BR"` |
| `page.tsx` | servidor, estático | lê `public/dados/tarifas.json` no build; `revalidate = 86400` (1 dia) |
| `comecar/page.tsx` + `Cadastro.tsx` | cliente | assistente de cadastro, dentro de `TransicaoTela` |
| `casa/layout.tsx` | — | envolve as telas da casa na `Casca` (cabeçalho, navegação, transição entre telas, espera a casa carregar) |
| `casa/page.tsx` | cliente | acompanhamento |
| `casa/comodos/page.tsx` | cliente | cômodos, editor, painel geral |
| `casa/dicas/page.tsx` | cliente | dicas e plano |
| `casa/ajustes/page.tsx` | cliente | minha casa |
| `casa/aparelhos/page.tsx` | redirecionamento | para `/casa/comodos` |
| `sobre/page.tsx` | servidor, estático | sobre o projeto |
| `manifest.ts`, `icon.svg` | — | instalação como aplicativo |
| `globals.css` | — | tokens, utilidades de animação e regras de transição |

## Componentes (`src/components/`)

| Componente | O que faz |
| --- | --- |
| `ui.tsx` | `Botao`, `BotaoLink`, `Opcao` (cartão de escolha), `Pilulas` (abas), `Contador` (− n +, com `compacto`), `Campo`, `Entrada`, `Folha` (janela por baixo, com `<dialog>`), `Aviso` |
| `Casca.tsx` | moldura da área da casa: marca, cidade, navegação de 4 seções (embaixo no celular, no topo no computador) |
| `Comodo.tsx` | `LinhaAparelho`, `BlocoIluminacao`, `descreverUso`, `horasPorDiaTexto` |
| `EditorAparelho.tsx` | edição completa de um aparelho |
| `SeletorCatalogo.tsx` | busca e escolha de aparelho no catálogo |
| `TempoUso.tsx` | `SeletorTempo`, `SeletorFrequencia`, `SeletorVariantes` |
| `Acompanhamento.tsx` | contas de luz e leituras do relógio, com gráficos |
| `Barras.tsx`, `Etiqueta.tsx` | gráfico de barras e a barra em seta nas cores do INMETRO |
| `Movimento.tsx` | `TransicaoTela`, `ValorAnimado`, `useValorAnimado`, `Revelar`, `Contagem`, `useVisivel` e os tipos de transição |
| `Simulador.tsx` | simulador rápido da página inicial |
| `BuscaCidade.tsx` | busca de cidade sem acento e sem diferenciar maiúsculas |
| `BotaoComecar.tsx`, `Marca.tsx`, `Icone.tsx`, `inicio/CasaIlustrada.tsx` | botão de começar, marca, ícone por nome, ilustração da casa |
| `EspacoReservado.tsx` | espaço reservado desligado (não renderiza nada) |

## Estado e armazenamento (`src/lib/`)

- **`store.ts`** — `useCasa`, com `persist` do Zustand no `localStorage`, chave `eficiencia-energetica:casa`, **versão 2**.
  - Dados: `residencia`, `comodos`, `aparelhos`, `contas`, `leituras`, `plano` (ids das dicas).
  - Ações: `criarCasa`, `definirResidencia`, `atualizarResidencia`, `adicionarComodo`, `renomearComodo`, `removerComodo`,
    `adicionarDoCatalogo`, `adicionarAparelho`, `atualizarAparelho`, `removerAparelho`, `salvarConta`, `removerConta`,
    `salvarLeitura`, `removerLeitura`, `alternarNoPlano`, `apagarTudo`.
  - Migração da versão 1: acrescenta `contas`, `leituras` e `plano` vazios.
  - `useCasaCarregada()` evita mostrar a tela vazia antes de ler o armazenamento.
- **`dados.ts`** — busca `/dados/tarifas.json` e `/dados/municipios/{UF}.json`, com cache em memória (uma busca por arquivo; se falhar, tenta de novo na próxima vez).
- **`resumo.ts`** — `useResumo`: junta casa + tarifa + bandeira do mês e chama `resumirCasa`, `gerarDicas` e `simularPlano`.
- **`rascunho.ts`** — estrutura do cadastro antes de virar casa: `ajustarComodos`, `rascunhoParaCasa`, `itemDoCatalogoParaComodo`.

Regra: qualquer mudança no formato salvo exige versão nova e `migrate` testado, para ninguém perder a casa.

## Configuração (`src/config/recursos.ts`)

`RECURSOS.espacosReservados = false`. Chaves para ligar e desligar recursos sem mexer nas telas.

## Aparência

- Tokens em `globals.css` (`@theme`): tinta (azul-marinho), energia (verde, ação e economia), faísca (amarelo, destaque em
  fundo escuro), faixas A–E da etiqueta do INMETRO, papel e fundo, raio dos cartões.
- Utilidades próprias (`@utility`): `surgir`, `cresce-x`, `cresce-y`, `pulo`, `acende`, `titulo-largo`, `numeros`, `seta-etiqueta`, `folha`; classes `revelar` (surge ao rolar) e `sanfona`.

## Movimento

| Tipo de transição | Quando |
| --- | --- |
| `nav-forward` | avançar (link ou passo do cadastro): a tela nova entra pela direita |
| `nav-back` | voltar: entra pela esquerda |
| `entrar-painel` | fim do cadastro: o painel cresce a partir do centro |

O cabeçalho (`topo`) e a navegação (`navegacao`) ficam parados durante a troca. As abas ativas (`aba-ativa`, `pilula-ativa`)
deslizam de uma opção para a outra. Com `prefers-reduced-motion: reduce`, nada se move.

## Cabeçalhos e cache (`next.config.ts`)

- `transpilePackages: ["@ee/core"]`, `poweredByHeader: false`.
- `/dados/*`: `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`.
- Cabeçalhos de segurança entram na HIS-003.

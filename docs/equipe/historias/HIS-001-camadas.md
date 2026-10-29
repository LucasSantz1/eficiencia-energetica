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

## Desenho técnico (proposta inicial do tech-lead, a confirmar na etapa 3)

| Hoje | Destino |
| --- | --- |
| `components/ui.tsx` | `ui/` dividido: `Botao.tsx`, `Opcao.tsx`, `Pilulas.tsx`, `Contador.tsx`, `Campo.tsx`, `Folha.tsx`, `Aviso.tsx` + `ui/index.ts` |
| `components/Icone.tsx`, `Marca.tsx`, `Movimento.tsx`, `Barras.tsx`, `Etiqueta.tsx` | `ui/` |
| `components/Casca.tsx` | `ui/Casca.tsx` (navegação da área da casa) |
| `app/comecar/Cadastro.tsx`, `components/BuscaCidade.tsx`, `lib/rascunho.ts` | `funcionalidades/cadastro/` |
| `components/inicio/*`, `BotaoComecar.tsx`, `Simulador.tsx` | `funcionalidades/inicio/` |
| `components/Acompanhamento.tsx` | `funcionalidades/acompanhamento/` |
| `components/Comodo.tsx`, `EditorAparelho.tsx`, `SeletorCatalogo.tsx`, `TempoUso.tsx` | `funcionalidades/comodos/` (o cadastro usa partes destes: o que for compartilhado vira `ui/` ou é exposto por `aplicacao/`) |
| `components/EspacoReservado.tsx` | `ui/EspacoReservado.tsx` |
| `lib/store.ts` | `infraestrutura/armazenamento/casa.ts` (store) + `aplicacao/casa.ts` (ações usadas pelas telas) |
| `lib/dados.ts` | `infraestrutura/dados-publicos.ts` |
| `lib/resumo.ts` | `aplicacao/resumo.ts` |

Ponto de atenção: o cadastro e os cômodos compartilham `LinhaAparelho`, `SeletorCatalogo` e `TempoUso`. Como uma
funcionalidade não pode importar outra, esses componentes viram componentes genéricos de aparelho em `ui/aparelho/`
(sem acesso ao store, recebendo dados e callbacks por props) — decisão a confirmar pelo tech-lead.

Verificação de camadas: ESLint `no-restricted-imports` por pasta (entra junto com HIS-002) ou um script simples no CI até lá.

## Ameaças

_(seguranca — a preencher na etapa 3)_ Risco principal: regressão (site quebrar) e perda de dados salvos.

## Plano de testes

_(qa — a preencher)_ Teste de ponta a ponta antes e depois com as mesmas capturas; teste com localStorage da versão atual.

## Perguntas abertas

- [ ] `[para: tech-lead]` Os componentes compartilhados de aparelho vão para `ui/aparelho/` ou ficam em `funcionalidades/comodos/` exportados por um `index.ts` público?

## Conversa da equipe

### [scrum-master] 2026-10-29 — história refinada e pronta para o desenho técnico
- O que fiz: problema, critérios de aceite e fora do escopo; mapa inicial de arquivos com base no código atual.
- Decisões e porquê: história sem mudança visível, para isolar o risco de regressão; vem antes de qualquer nova função.
- Para o próximo (tech-lead): confirmar o mapa, responder a pergunta aberta e definir como o CI verifica as camadas.

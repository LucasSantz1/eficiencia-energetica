# Contexto · Documentação

## O que eu cuido

| Documento | Para quem |
| --- | --- |
| `README.md` | quem chega ao repositório |
| `docs/README.md` | índice de toda a documentação |
| `docs/sistema/guia-de-uso.md` | quem usa o site (linguagem simples) |
| `docs/sistema/funcionalidades.md` | especificação de cada tela |
| `docs/sistema/diagramas.md` | diagramas das funções (Mermaid) |
| `docs/sistema/referencia-do-dominio.md` | desenvolvedores e quem confere o catálogo e as dicas |
| `docs/sistema/site.md` | desenvolvedores do site |
| `docs/sistema/desenvolvimento.md` | quem vai rodar, testar ou publicar |
| `docs/sistema/glossario.md` | todos |
| `docs/sistema/calculos-e-fontes.md` | quem quer conferir os números (ONGs, órgãos públicos, pesquisadores) |
| `docs/sistema/dados.md` | quem mantém a rotina de dados |
| `docs/sistema/privacidade-e-seguranca.md` | quem avalia LGPD e segurança |
| `docs/arquitetura.md` | desenvolvedores |
| `CHANGELOG.md` | todos: "Para quem usa" e "Técnico" |
| `docs/equipe/decisoes/README.md` | índice dos ADRs |

Também existe um documento de apresentação para ONGs e órgãos públicos (fora do repositório, no Claude), que resume
o projeto, o planejamento e o Scrum. Quando algo grande mudar, atualizar os dois.

## Decisões em vigor

- Documentação pública não menciona instituição de ensino nem os espaços para parceiros.
- Todo número citado tem fonte e bate com o código.
- Caminhos de código na documentação seguem as camadas do ADR-001 (`app/`, `funcionalidades/`, `ui/`, `ui/aparelho/`,
  `aplicacao/`, `infraestrutura/`, `config/`). Fonte única da estrutura: `docs/arquitetura.md#camadas-do-site`; o
  `site.md` detalha arquivo a arquivo. Notas antigas de histórias e o "Contexto" do ADR-001 ficam como registro histórico.
- Exemplo de saída do verificador documentado (arquitetura e desenvolvimento) foi conferido numa cópia: se a mensagem do
  `scripts/verificar-camadas.mjs` mudar, atualizar os dois.

## Pendências

- Manter o CHANGELOG a cada história fechada.
- HIS-001: o dono do projeto precisa aplicar no `CLAUDE.md` o texto novo da nota "Estado atual" (proposto em 2026-10-29,
  entregue a quem orquestra; a documentação não edita o `CLAUDE.md`).
- HIS-002: quando o ESLint dividir as regras com o script e `apps/web/e2e-base/` virar `apps/web/e2e/`, atualizar
  `docs/arquitetura.md` ("Verificador de camadas") e `docs/sistema/desenvolvimento.md` (`pnpm test:e2e`, estrutura).
- HIS-003: validação de fronteira em `infraestrutura/validacao/` → acrescentar em `site.md` e `arquitetura.md`.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

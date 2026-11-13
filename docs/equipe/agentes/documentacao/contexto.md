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
- Lint e camadas (HIS-002b): fonte única em `arquitetura.md#verificador-de-camadas`; os números (85 arquivos, 7
  comentários, 152 testes) mudam com o código: reconferir com `node scripts/verificar-camadas.mjs`.
- Leitura segura (HIS-003a): fonte única em `arquitetura.md#leitura-segura-dos-dados-de-fora`; trava e `casa-ilegivel` em
  `privacidade-e-seguranca.md`. O bloco provisório do lint saiu e o teto da HIS-109 ficou em 7 (não 8). e2e: 210 (204 rodam, 6 pendentes).
- Testes no navegador: fonte única em `desenvolvimento.md` ("Testes no navegador" e "Integração contínua"). Se mudar o
  nome dos checks no `ci.yml`, o número de testes ou as exceções do axe, atualizar lá (HIS-002a).

## Pendências

- Manter o CHANGELOG a cada história fechada.
- HIS-001: o dono do projeto precisa aplicar no `CLAUDE.md` o texto novo da nota "Estado atual" (proposto em 2026-10-29,
  entregue a quem orquestra; a documentação não edita o `CLAUDE.md`).
- HIS-110: quando corrigir o contraste da `/`, tirar a frase "8 entradas de `color-contrast`" de `desenvolvimento.md`.
- HIS-003a: `arquitetura.md` já descreve os leitores; falta o `site.md` (ui/AvisoDaCasaSalva, AvisoFalhaDeCarga, TelaDeErro, foco, global-error, not-found, storage próprio).
- CHANGELOG não tem entradas da HIS-111 nem da HIS-002b: pedir ao scrum-master se entram agora.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_

- HIS-112 (layout para computador): fonte única em `site.md#layout-no-computador-a-partir-de-1024-px`; `arquitetura.md` só resume. Entrada no CHANGELOG fica acima da HIS-003a; a HIS-110 não estava no CHANGELOG (ordenar quando entrar).

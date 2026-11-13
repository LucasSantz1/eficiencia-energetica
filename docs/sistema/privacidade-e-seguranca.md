# Privacidade e segurança

## Resumo

- O site **não coleta dados pessoais**: não pede nome, CPF, endereço, telefone nem e-mail.
- Os dados da casa (cidade, distribuidora, cômodos, aparelhos, contas anotadas) ficam **só no navegador do celular**.
- Não há rastreamento de terceiros nem cookies de publicidade.
- A pessoa pode **apagar tudo** a qualquer momento em Minha casa → "Apagar todos os meus dados". Isso apaga também a
  cópia de segurança descrita em "Dados salvos que o site não consegue ler".

## LGPD (Lei 13.709/2018)

| Princípio | Como o projeto cumpre |
| --- | --- |
| Finalidade | Os dados servem só para calcular a conta e as dicas da própria casa |
| Necessidade | Só o mínimo; a cidade serve para achar a distribuidora e a tarifa |
| Livre acesso | A pessoa vê e edita tudo o que cadastrou |
| Qualidade | Tarifas oficiais da ANEEL, atualizadas todo dia |
| Transparência | Código aberto, com a fonte de cada número |
| Segurança | Regras de código obrigatórias e revisão de segurança em toda mudança |
| Prevenção | Nada é enviado a servidor; recursos futuros que enviarem dados exigirão consentimento |
| Não discriminação | O site é igual para todos e gratuito |

**Recursos planejados que vão tratar dados** (épico E4): conta opcional sem senha e sincronização entre aparelhos.
Antes de existirem, terão consentimento explícito, política de privacidade em linguagem simples, opção de exportar
e de apagar todos os dados, e banco com segurança por linha (cada pessoa só acessa os próprios dados).

## Medidas de segurança

| Ameaça | Medida |
| --- | --- |
| SQL injection | Só consultas parametrizadas ou o construtor de consultas do Supabase; montar SQL com texto é proibido |
| Acesso a dados de outra pessoa | Row Level Security em toda tabela com dado de pessoa, com teste automático |
| Injeção de script (XSS) | Proibido inserir HTML cru, `eval` e semelhantes; o React escapa todo texto |
| Vazamento de chaves | Segredos só em variáveis de ambiente, nunca no código; chave de administrador nunca no navegador |
| Biblioteca vulnerável | Versões fixas, só pacotes mantidos; o CI roda `pnpm audit --audit-level high` e reprova com falha alta ou crítica; o Dependabot sugere atualizações toda semana, esperando 7 dias depois da publicação (HIS-003a) |
| Dado salvo corrompido quebrar o site | Os dados salvos passam por um leitor que tira só o que está errado e avisa a pessoa; se der erro inesperado, aparece uma tela amigável (HIS-003a; ver abaixo) |
| Arquivo da ANEEL inesperado | A rotina diária confere os valores e o formato; se algo falhar, não grava e os dados anteriores continuam. O site também confere o arquivo ao abrir (HIS-003a) |
| Clickjacking e outros ataques de navegador | 7 cabeçalhos de segurança em toda resposta do site, entre eles a política de conteúdo (CSP), que só deixa a página falar com o próprio site (HIS-003a) |
| Texto digitado com tamanho ou número absurdo | Limites de tamanho e faixa num lugar só, `packages/core/src/limites.ts`, com a fonte de cada um (HIS-003a) |

## Dados salvos que o site não consegue ler

Os dados da casa ficam no navegador e podem estragar (falha do aparelho, extensão do navegador, versão antiga). O site
não confia neles: cada pedaço passa por um leitor do `@ee/core` (ADR-004) antes de ser usado.

- **Descarta só o que está errado.** Um aparelho com potência negativa sai; o resto da casa continua. A pessoa vê um
  aviso em linguagem simples dizendo o que saiu (ver o [guia de uso](guia-de-uso.md#se-os-dados-salvos-ou-os-preços-da-luz-estiverem-estragados)).
- **Trava de gravação.** Se o leitor falhar de um jeito inesperado (um erro do nosso código, não um dado ruim), o site
  mostra o aviso de que não conseguiu abrir a casa e **para de gravar**. Assim, a casa vazia que aparece na tela não
  é gravada por cima da casa que estava salva. A trava solta quando a pessoa abre o site de novo, faz um cadastro novo
  ou toca em "Apagar tudo".
- **Cópia `casa-ilegivel`.** Quando a pessoa confirma um cadastro novo com a trava ligada, o site guarda uma cópia do
  texto antigo na chave `eficiencia-energetica:casa-ilegivel` do navegador, uma vez só e sem sobrescrever, para que uma
  correção futura possa recuperar a casa. A cópia **fica só no aparelho**: nada a lê, o site só faz pedidos ao próprio
  endereço (a política de conteúdo tem `connect-src 'self'`) e ela não cresce além do tamanho do original. Dado
  quebrado comum, como um JSON mal formado, não cria cópia.
- **"Apagar tudo" apaga tudo.** Remove a chave da casa **e** a `casa-ilegivel`, e solta a trava, também quando a casa
  está travada ou ilegível. O botão aparece mesmo sem cidade salva ou só com a cópia ilegível. Se um dia a
  `casa-ilegivel` for lida por uma recuperação, ela passará pelo mesmo leitor e a chave será apagada depois.
- **Arquivos de `/dados` fora do formato.** O site confere `tarifas.json` e `municipios/{UF}.json` ao abrir. Se não
  servirem, mostra "Não conseguimos carregar..." com "Tentar de novo"; a casa continua salva. A sigla do estado é
  conferida contra a lista dos 27 estados antes de montar o endereço do arquivo.

### Telas de erro

| Situação | O que a pessoa vê | Arquivo |
| --- | --- | --- |
| Erro inesperado em qualquer tela | "Algo deu errado nesta tela", com "Tentar de novo" e "Voltar ao início" | `app/global-error.tsx`, `ui/TelaDeErro.tsx` |
| Página que não existe | "Não achamos esta página", com "Voltar ao início" | `app/not-found.tsx` |

Os textos são fixos. Nunca mostram a mensagem do erro, nome de arquivo, código ou detalhe técnico, e não inserem HTML.
Não há tela `error.tsx` por rota: o `global-error` cobre todas, para o site não ficar mais pesado.

## Como garantimos

- Um agente de segurança faz a análise de ameaças antes de cada história e revisa o código depois. Ele tem poder de veto.
- Toda mudança passa por verificação de tipos, testes e build no CI antes de entrar no site.
- **"Nada sai do aparelho" é conferido sozinho.** Os testes no navegador usam o site como uma pessoa usaria (cadastro,
  cômodos, dicas, apagar os dados) e reprovam se a página pedir qualquer coisa a outro endereço que não o próprio site.
  Um teste a mais prova que essa barreira funciona: ele tenta um pedido para fora e confere que é pego.
- Os testes de segurança (`cabecalhos`, `casa-salva`, `dados-publicos`, `erros`) conferem os 7 cabeçalhos, a trava,
  a `casa-ilegivel`, o "Apagar tudo" e as telas de erro no navegador, a 390 e a 1280 px.
- O CI só tem permissão de leitura do repositório, não usa nenhum segredo e usa versões fixas das ferramentas
  (pelo código do commit, não por um nome que pode ser trocado).
- As regras completas estão em [`CLAUDE.md`](../../CLAUDE.md#segurança-obrigatório).

## Contato para relatar um problema de segurança

Abra uma issue no repositório sem detalhes sensíveis pedindo um contato privado.

# Privacidade e segurança

## Resumo

- O site **não coleta dados pessoais**: não pede nome, CPF, endereço, telefone nem e-mail.
- Os dados da casa (cidade, distribuidora, cômodos, aparelhos, contas anotadas) ficam **só no navegador do celular**.
- Não há rastreamento de terceiros nem cookies de publicidade.
- A pessoa pode **apagar tudo** a qualquer momento em Minha casa → "Apagar todos os meus dados".

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
| Biblioteca vulnerável | Versões fixas, só pacotes mantidos e verificação de vulnerabilidades no CI (HIS-003) |
| Dado salvo corrompido quebrar o site | Validação dos dados salvos e tela de erro amigável (HIS-003) |
| Arquivo da ANEEL inesperado | Validação na rotina diária; se falhar, os dados anteriores continuam |
| Clickjacking e outros ataques de navegador | Cabeçalhos de segurança (CSP, HSTS, etc.) (HIS-003) |

## Como garantimos

- Um agente de segurança faz a análise de ameaças antes de cada história e revisa o código depois. Ele tem poder de veto.
- Toda mudança passa por verificação de tipos, testes e build no CI antes de entrar no site.
- As regras completas estão em [`CLAUDE.md`](../../CLAUDE.md#segurança-obrigatório).

## Contato para relatar um problema de segurança

Abra uma issue no repositório sem detalhes sensíveis pedindo um contato privado.

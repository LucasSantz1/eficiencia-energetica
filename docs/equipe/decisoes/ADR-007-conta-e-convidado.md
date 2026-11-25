# ADR-007 · Conta opcional com e-mail e senha, sessão em cookie cifrado e link de convidado só de leitura

- **Status:** proposto (2026-11-25, quem orquestra, a pedido do dono no modo turbo). A seguranca vetou a primeira versão
  (`d7e33ee`) por A1 e A2. Revisto no mesmo dia com A1, A2, M1 a M5 e parte das baixas (ver "Revisão da seguranca");
  volta à seguranca antes de juntar.
- **Data:** 2026-11-25
- **Responsável:** quem orquestra; revisão: seguranca (poder de veto) e tech-lead

## Contexto

O dono pediu (25/11):
- uma tela de login para guardar o cadastro da pessoa, **sem nada escapar pelos cookies**;
- um link de convidado para outras pessoas acompanharem o consumo da casa, **só de visualização**.

Respostas dele:
- Supabase, com projeto criado por ele;
- cadastro com e-mail e senha, confirmado por link no e-mail;
- link de convidado válido até o dono apagar.

Princípios que pesam:
- **conta opcional:** "nenhuma função essencial atrás de cadastro";
- **LGPD:** nada sai do aparelho sem a pessoa concordar;
- **CSP `connect-src 'self'`**, nada para terceiros no navegador;
- RLS obrigatória.

## Decisão

1. **O navegador só fala com o nosso site (BFF).**
   - As rotas `/api/conta/*`, `/api/casa`, `/api/convites` e `/api/convidado` rodam no servidor da Vercel e falam com
     o Supabase.
   - A URL e a chave anon ficam em variáveis sem `NEXT_PUBLIC_`. A `service_role` não existe no código.
   - O `@supabase/supabase-js` só pode ser importado em `infraestrutura/**/*.servidor.ts` (regra de lint com casos de
     controle).
   - A CSP continua `connect-src 'self'`.
2. **Sessão num cookie só, cifrado.**
   - `__Host-sessao` com os tokens do Supabase em AES-256-GCM. A chave sai do `SESSAO_SEGREDO` por HKDF-SHA256.
   - Atributos: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, 30 dias.
   - Sem a chave, o cookie não revela e-mail, id nem token. O GCM recusa qualquer mudança, e cookie estranho é apagado.
   - O token de acesso é renovado no servidor quando falta menos de 60 s para vencer.
3. **CSRF:**
   - toda rota que muda algo exige `Origin` igual ao do site e `Content-Type: application/json`;
   - o `SameSite=Lax` fecha o resto;
   - corpo até 600 kB;
   - toda resposta de `/api` é `no-store`, e o erro do Supabase nunca vai à tela nem ao log (pode trazer o e-mail).
4. **Sem descobrir e-mails:**
   - "senha errada" e "e-mail sem conta" dão a mesma resposta;
   - criar conta e "esqueci a senha" respondem igual, exista ou não a conta.
5. **Links dos e-mails com o código depois do `#`:**
   - `/conta/confirmar#token_hash=…` e `/conta/nova-senha#token_hash=…`, nos modelos de e-mail do Supabase;
   - o código não vai ao servidor no pedido da página;
   - a página manda o código num POST e depois o tira do endereço;
   - a confirmação espera um toque, porque antivírus de e-mail abrem links sozinhos e gastariam o código.
6. **Banco** (`supabase/migrations/20261125120000_conta_e_convites.sql`):
   - `casas`, com uma por dono e a casa em `jsonb` (até 500 kB);
   - `convites`, com o SHA-256 do código e no máximo 20 por casa;
   - RLS ligada e forçada, uma política por operação, `dono = auth.uid()`;
   - `anon` sem acesso a tabela nenhuma;
   - `casa_do_convite(hash)`: `security definer`, só `select`, devolve só a casa;
   - `apagar_minha_conta()`: apaga o usuário, e a casa e os convites vão em cascata;
   - teste em Postgres descartável: `pnpm test:banco`, no CI. A mudança é conferida para reprovar quando a RLS sai.
7. **Link de convidado:**
   - 32 bytes aleatórios (`crypto.randomBytes`) em base64url, em `/convidado#<código>`;
   - o banco guarda só o hash, então um vazamento do banco não abre nenhum link;
   - o código aparece uma vez para o dono copiar ou compartilhar;
   - apagar o link corta o acesso na hora, porque nada fica em cache: `/api` é `no-store` e o service worker não toca
     em `/api`.
8. **A casa que entra e sai do servidor passa pelo `lerCasaSalva`** (ADR-004), como a do `localStorage`.
9. **Sincronização local primeiro:**
   - a casa continua no aparelho;
   - com conta, cada mudança vai ao servidor 2 s depois (`PUT /api/casa`, com `atualizada_em` para detectar outro
     aparelho; no conflito, a versão da conta vale e a pessoa é avisada);
   - casas diferentes no primeiro login: a pessoa escolhe qual fica;
   - sem internet, a mudança fica pendente e vai quando a conexão volta.
10. **LGPD:**
    - o "Concordo em guardar a minha casa na conta" é obrigatório para criar a conta;
    - "Apagar todos os meus dados" apaga também a conta, a casa no servidor e os links;
    - se o servidor falhar, nada é apagado no aparelho.

## Revisão da seguranca (25/11)

- **A1, corrigido.** A casa do aparelho nunca vai para uma conta sem a pessoa tocar em "Guardar na conta", com o e-mail
  da conta à vista. As telas de confirmar e de senha nova mostram o e-mail e têm "Não é você? Sair".
- **A2, corrigido.** Os textos de privacidade mudaram no início, no Sobre, no cadastro, na meta, no consentimento e no
  link da família: agora dizem o que vai para a conta e o que o convidado vê.
- **M1, corrigido.** `over_email_send_rate_limit` responde como sucesso no cadastro e no "esqueci".
- **M2, corrigido em parte.** Falha passageira não apaga o cookie. Ficam para antes de divulgar o limite próprio por IP
  nas rotas e a limpeza de contas não confirmadas.
- **M3, corrigido.** Toda rota com sessão confere a sessão no Supabase.
- **M4, corrigido.**
  - Conflito com outro aparelho: a pessoa escolhe, e nada é trocado sozinho.
  - Versão do formato: o servidor só aceita `VERSAO_DO_FORMATO_DA_CASA` (no core), e o cliente não sincroniza com casa
    de versão mais nova.
- **M5, corrigido.** O convidado recebe a casa sem pessoas, meta, leituras, plano e contas antigas.
- **Baixas corrigidas:**
  - B1: `ENDERECO_DO_SITE` fixo para os links dos e-mails;
  - B2: trava de 20 links com `for update`;
  - B3: o teste do banco roda a migração com um dono sem superusuário;
  - B6: "esqueci" com o Supabase fora responde erro;
  - B7: senha recusada mantém a pessoa na conta e explica;
  - B8: variáveis só em *Production*;
  - B9: funções em `gru1`;
  - B11: apagar a conta entrou na conferência do guia.
- **Baixas que ficam:**
  - B4: limite total da sessão e "Sair de todos os aparelhos";
  - B5: aviso ao sair sem internet;
  - B10: registro da data e da versão do "concordo".

## Alternativas

- **`@supabase/ssr` com o navegador falando com o Supabase:**
  - os tokens ficariam em cookies legíveis pelo JavaScript da página (o JWT traz o e-mail);
  - a CSP teria de liberar o domínio do Supabase.

  Contra o pedido do dono.
- **Sessão em tabela no banco (id opaco no cookie):** pediria a `service_role` no servidor para ler a tabela. O cookie
  cifrado não precisa de tabela nem de chave de administrador.
- **Link do e-mail com `?token_hash=`:** o código iria para logs e para o histórico do servidor.
- **Link mágico sem senha (o planejamento previa):** o dono escolheu e-mail e senha.

## Consequências

- **Limite do Supabase por IP:** as tentativas chegam todas do IP da Vercel. Com muita gente ao mesmo tempo, o limite
  é compartilhado. Aceito para o começo; se doer, passar o IP da pessoa (precisa da `service_role` ou de um proxy).
- **Trocar o `SESSAO_SEGREDO`** desconecta todo mundo. É a forma de reagir a um vazamento.
- **Sem teste de ponta a ponta contra um Supabase de verdade no CI.** O que cobre:
  - unidade dos casos de uso com um Supabase de mentira;
  - RLS em Postgres;
  - e2e da conta desligada e das barreiras das rotas.

  O fluxo completo é conferido à mão depois de ligar o projeto (`docs/sistema/conta-supabase.md`, passo 6).
- **O e-mail grátis do Supabase** só serve para teste; para divulgar, é preciso SMTP próprio.

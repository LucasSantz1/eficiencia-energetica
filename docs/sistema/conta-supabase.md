# Ligar a conta e o link de convidado (Supabase)

A conta é **opcional**. Sem os passos abaixo, o site funciona como sempre e a seção "Sua conta" nem aparece. Leva
uns 20 minutos, uma vez só. Decisões e motivos: [ADR-007](../equipe/decisoes/ADR-007-conta-e-convidado.md).

## 1. Criar o projeto

1. Entre em [supabase.com](https://supabase.com) e crie uma conta (o plano Free basta).
2. **New project**:
   - **Name:** `eficiencia-energetica`.
   - **Database password:** clique em *Generate a password* e guarde num gerenciador de senhas. O site não usa essa
     senha; ela serve para você entrar no banco.
   - **Region:** *South America (São Paulo)*. Os dados ficam no Brasil.
3. Espere o projeto ficar pronto (1 a 2 minutos).

No plano Free, o projeto **pausa depois de uma semana sem nenhum acesso**. É só abrir o painel e clicar em *Restore*.

## 2. Criar as tabelas e as regras de acesso

1. No menu da esquerda, abra **SQL Editor** → **New query**.
2. Copie todo o conteúdo de [`supabase/migrations/20261125120000_conta_e_convites.sql`](../../supabase/migrations/20261125120000_conta_e_convites.sql),
   cole e clique em **Run**. Deve aparecer *Success. No rows returned*.
3. Confira em **Table Editor** que existem `casas` e `convites`, as duas com o cadeado de **RLS enabled**.

Mudanças futuras no banco vêm como arquivos novos nessa pasta, sempre com o mesmo passo.

## 3. Login por e-mail e senha

Em **Authentication**:

1. **Sign In / Providers → Email:**
   - **Enable Email provider:** ligado;
   - **Confirm email:** ligado (a conta só vale depois do link no e-mail);
   - **Secure email change:** ligado;
   - **Minimum password length:** `8`.
2. **URL Configuration:**
   - **Site URL:** o endereço do site, por exemplo `https://eficiencia-energetica.vercel.app`, sem barra no fim;
   - **Redirect URLs:** o mesmo endereço seguido de `/**`.
3. **Emails → Templates**. Troque só o link de dois modelos. O link vai depois do `#`: o navegador nunca o manda para
   nenhum servidor, então ele não fica em log.
   - **Confirm signup**, assunto `Confirme a sua conta`:

     ```html
     <h2>Confirme a sua conta</h2>
     <p>Toque no botão para confirmar o e-mail da sua conta no Eficiência Energética.</p>
     <p><a href="{{ .SiteURL }}/conta/confirmar#token_hash={{ .TokenHash }}&type=email">Confirmar meu e-mail</a></p>
     <p>Se não foi você que criou a conta, é só ignorar este e-mail.</p>
     ```

   - **Reset password**, assunto `Crie uma senha nova`:

     ```html
     <h2>Senha nova</h2>
     <p>Toque no botão para criar uma senha nova no Eficiência Energética.</p>
     <p><a href="{{ .SiteURL }}/conta/nova-senha#token_hash={{ .TokenHash }}&type=recovery">Criar senha nova</a></p>
     <p>Se não foi você que pediu, é só ignorar este e-mail: a senha continua a mesma.</p>
     ```

4. **Rate Limits:** deixe como está. Atenção: o Supabase conta as tentativas por IP, e todas as tentativas chegam do
   servidor da Vercel. Com muita gente entrando ao mesmo tempo, o limite vale para todos juntos (ADR-007).

## 4. E-mail de verdade (antes de divulgar)

O e-mail grátis do Supabase manda **poucos e-mails por hora** e só serve para testar. Para uso de verdade:

1. Crie uma conta num serviço de e-mail com plano grátis, como o [Resend](https://resend.com) (3.000 e-mails por mês),
   e confirme um domínio seu.
2. No Supabase, em **Project Settings → Authentication → SMTP Settings**, ligue *Enable Custom SMTP* e preencha com os
   dados do serviço: servidor, porta, usuário e senha.

## 5. Variáveis na Vercel

1. No Supabase, abra **Project Settings → API** e copie:
   - **Project URL**;
   - a chave **anon / public**. **Nunca** copie a `service_role`: o site não precisa dela.
2. Gere o segredo da sessão, num terminal com Node:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. Na Vercel, abra **Project → Settings → Environment Variables** e crie as três variáveis, para *Production* e
   *Preview*:

   | Nome | Valor |
   | --- | --- |
   | `SUPABASE_URL` | o Project URL |
   | `SUPABASE_ANON_KEY` | a chave anon |
   | `SESSAO_SEGREDO` | o segredo gerado no item 2 |

   Os nomes **não** começam com `NEXT_PUBLIC_`, de propósito: só o servidor os lê.
4. Faça um novo deploy (**Deployments → Redeploy**).

## 6. Conferir

1. Abra o site → **Minha casa**. A seção **Sua conta** deve aparecer.
2. **Entrar ou criar conta** → **Criar uma conta** com um e-mail seu → abra o e-mail e toque em **Confirmar meu e-mail**.
3. Em Minha casa, deve aparecer "A sua casa está guardada na conta". Em **Links para a família acompanhar**, crie um
   link e abra-o numa janela anônima. A casa aparece com "Só para ver".
4. Apague o link e recarregue a janela anônima. Deve aparecer "Este link não vale mais".

Se trocar o `SESSAO_SEGREDO`, todo mundo sai da conta (os cookies antigos deixam de abrir). Faça isso se suspeitar que
o segredo vazou.

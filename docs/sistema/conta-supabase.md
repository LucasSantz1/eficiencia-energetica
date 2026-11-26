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
3. **Emails → Templates**. Desde 3/6/2026, projeto novo no plano Free só edita os modelos **depois de ligar um SMTP
   próprio** (passo 4); faça o passo 4 primeiro e volte aqui. Troque só o link de dois modelos. O link vai depois do `#`: o navegador nunca o manda para
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

4. **Rate Limits:** deixe como está. As funções do site rodam em São Paulo (`gru1`), perto do banco. Atenção: o Supabase conta as tentativas por IP, e todas as tentativas chegam do
   servidor da Vercel. Com muita gente entrando ao mesmo tempo, o limite vale para todos juntos (ADR-007).

## 4. SMTP próprio (obrigatório para trocar o link dos e-mails)

Sem SMTP próprio, o projeto novo não deixa editar os modelos do passo 3, e o e-mail grátis do Supabase manda só 2
e-mails por hora. Escolha um dos caminhos:

- **Com um domínio seu** (ex.: `eficienciaenergetica.com.br`): crie conta no [Resend](https://resend.com) (3.000
  e-mails por mês grátis) ou no [Brevo](https://www.brevo.com), confirme o domínio (registros SPF e DKIM no DNS) e crie
  um remetente como `nao-responda@seudominio`. É o melhor caminho: os e-mails caem menos no spam.
- **Sem domínio, para começar:** use um Gmail criado só para o projeto, com uma **senha de app**:
  1. crie o Gmail (ex.: `eficiencia.energetica.app@gmail.com`) e ligue a verificação em duas etapas;
  2. em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), crie uma senha de app;
  3. use os dados abaixo com `smtp.gmail.com`, porta `465`, usuário = o Gmail e senha = a senha de app.

  O Gmail manda até cerca de 500 e-mails por dia. Não use o seu Gmail pessoal: ele apareceria como remetente para
  todo mundo.

No Supabase, em **Authentication → Emails → SMTP Settings**, ligue *Enable custom SMTP* e preencha: *Sender email*,
*Sender name* (`Eficiência Energética`), *Host*, *Port*, *Username* e *Password*. Salve, volte ao passo 3 e troque os
modelos. Depois, em **Rate Limits**, o limite de e-mails por hora pode subir (o padrão com SMTP próprio é 30).

## 5. Variáveis na Vercel

1. No Supabase, abra **Project Settings → API** e copie:
   - **Project URL**;
   - a chave **anon / public**. **Nunca** copie a `service_role`: o site não precisa dela.
2. Gere o segredo da sessão, num terminal com Node:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. Na Vercel, abra **Project → Settings → Environment Variables** e crie as quatro variáveis **só para *Production***.
   Não marque *Preview*: as versões de teste de cada PR usariam o banco e o segredo de verdade. Se quiser testar a conta
   numa versão de teste, crie outro projeto no Supabase só para isso.

   | Nome | Valor |
   | --- | --- |
   | `SUPABASE_URL` | o Project URL |
   | `SUPABASE_ANON_KEY` | a chave anon |
   | `SESSAO_SEGREDO` | o segredo gerado no item 2 |
   | `ENDERECO_DO_SITE` | o mesmo Site URL do passo 3, sem barra no fim (os links dos e-mails usam este endereço) |

   Os nomes **não** começam com `NEXT_PUBLIC_`, de propósito: só o servidor os lê.
4. Faça um novo deploy (**Deployments → Redeploy**).

## 6. Conferir

1. Abra o site → **Minha casa**. A seção **Sua conta** deve aparecer.
2. **Entrar ou criar conta** → **Criar uma conta** com um e-mail seu → abra o e-mail e toque em **Confirmar meu e-mail**.
3. Em Minha casa, deve aparecer "A sua casa está guardada na conta". Em **Links para a família acompanhar**, crie um
   link e abra-o numa janela anônima. A casa aparece com "Só para ver".
4. Apague o link e recarregue a janela anônima. Deve aparecer "Este link não vale mais".
5. Em **Minha casa → Seus dados → Apagar todos os meus dados**, apague tudo. No Supabase, em **Authentication → Users**, a
   conta deve ter sumido, e em **Table Editor** a casa e os links também. Se aparecer "Não deu para apagar a conta",
   avise: a permissão da função `apagar_minha_conta` precisa ser conferida no projeto.

Se trocar o `SESSAO_SEGREDO`, todo mundo sai da conta (os cookies antigos deixam de abrir). Faça isso se suspeitar que
o segredo vazou.

# ADR-008 · Limite de tentativas por IP e por e-mail, e a casa cifrada no banco

- **Status:** proposto (2026-11-26, quem orquestra, a pedido do dono no modo turbo; revisão da seguranca antes de juntar)
- **Data:** 2026-11-26
- **Responsável:** quem orquestra; revisão: seguranca (poder de veto)

## Contexto

O dono pediu (26/11):
1. rotas de API protegidas com autenticação;
2. senhas cifradas no banco;
3. limite de tentativas de login;
4. RLS nas tabelas;
5. dados da pessoa guardados cifrados.

Ele também quer, no futuro, um painel de uso (E12).

O que já existia (ADR-007):
- **(1)** toda rota com dado da pessoa confere a sessão no Supabase a cada pedido;
- **(2)** o Supabase Auth guarda só o hash bcrypt (conferido no banco: `$2a$10$`);
- **(4)** RLS ligada e forçada, testada no CI.

Faltavam:
- **(3):** o limite do Supabase conta por IP, mas todo pedido chega do IP da Vercel, então era um limite só para todo mundo;
- **(5):** a casa ficava aberta em `jsonb`. O disco do Supabase é cifrado, mas quem tem acesso ao banco lê.

## Decisão

1. **Limite de tentativas no próprio Postgres.** Sem serviço novo, como Redis ou Upstash: a stack continua a mesma.
   - **Tabela `tentativas`:** ação, chave de 32 bytes, janela e contagem. RLS forçada, sem política e sem acesso para ninguém.
   - **Função `contar_tentativa(ação, chave)`:** `security definer`, só `anon` executa. Os **limites ficam na função, fixos por ação**, de modo que quem chamar direto não escolhe limite nem janela. Ação fora da lista dá erro.
   - **Limites:**

     | Ação | Por | Limite |
     | --- | --- | --- |
     | entrar | IP | 60 / 15 min |
     | entrar | e-mail | 10 / 15 min |
     | criar conta | IP | 20 / h |
     | esqueci a senha | IP | 20 / h |
     | esqueci a senha | e-mail | 3 / h |
     | links do e-mail | IP | 60 / 15 min |
     | link de convidado | IP | 120 / 15 min |

   - **A chave é um HMAC-SHA256 do IP ou do e-mail**, com uma chave tirada do `SESSAO_SEGREDO` por HKDF. O banco nunca guarda IP nem e-mail. Quem chama a função direto não consegue gastar as tentativas de outra pessoa, porque não tem o segredo.
   - **Os limites por IP são folgados de propósito.** No 4G, a operadora junta muitas famílias num IP só (CGNAT). Quem segura a adivinhação de senha é o limite por e-mail.
   - **O IP vem de `x-real-ip` ou `x-forwarded-for`.** A Vercel põe e sobrescreve esses cabeçalhos. **Só vale na Vercel:** em outro host, o navegador escolheria o cabeçalho. IPv6 conta pela rede /64 (B4 da seguranca).
   - **Respostas:**
     - passou do limite: 429 "muitas-tentativas", sem chamar o Supabase;
     - banco sem resposta: 503, falha fechada;
     - "esqueci" para o mesmo e-mail demais: responde igual a sucesso e não manda mais e-mail, para não revelar se a conta existe.
   - **Limpeza:** de vez em quando, em 2% das chamadas, a função apaga janelas com mais de um dia.
2. **A casa vai cifrada para o banco.**
   - **Cifra:** AES-256-GCM no servidor, com IV aleatório e AAD com o contexto **e o dono**. A cifra de uma casa copiada para a linha de outra pessoa não abre (M1 da seguranca). `casa_do_convite` devolve o dono só para o servidor abrir a cifra; o convidado não o recebe. A chave vem de uma variável nova, **`CASA_SEGREDO`** (32 bytes), separada da sessão: trocar o `SESSAO_SEGREDO` tira todo mundo da conta, mas não pode deixar as casas ilegíveis.
   - **Formato no banco:** `dados_cifrados` = `v1.` + base64url(iv | etiqueta | cifra).
   - **Sem `CASA_SEGREDO`, a conta fica desligada:** nunca grava casa sem cifra. A chave tem de ter 32 bytes e ser diferente da da sessão.
   - **Casas de antes:** continuam em `dados` e o servidor regrava cifrado na próxima mudança. O banco exige um formato só por linha (`casas_um_formato`).
   - **Cifra que não abre** (mexida ou de outra chave) vira erro, nunca uma casa vazia, que o aparelho gravaria por cima.
   - **`casa_do_convite`** devolve a cifra, e o servidor decifra e corta o que o convidado não vê (M5).
3. **Ordem de subir:** a migração é compatível com o código de antes, então roda primeiro e o deploy vem depois.

## Alternativas

- **Upstash ou Redis para o limite:** é um serviço e uma conta a mais. O Postgres aguenta a escala do site.
- **Limite na memória da função:** na Vercel cada pedido pode cair numa instância nova, então não segura nada.
- **Firewall da Vercel:** depende do plano e fica fora do código e dos testes. Pode somar no futuro.
- **Passar o IP da pessoa ao Supabase:** pede a `service_role` no servidor, o que o ADR-007 recusou.
- **pgsodium ou Vault do Supabase para cifrar no banco:** a chave ficaria no mesmo lugar dos dados. Cifrar no servidor separa os dois.

## Consequências

- **O que a cifra protege:** quem só **lê** o banco sem a chave (um backup vazado, uma consulta de leitura) não lê a casa. **O que ela não protege:** quem pode **escrever** no banco (o painel do Supabase, por exemplo) troca a senha da pessoa no `auth.users` e entra pelo site (M2 da seguranca). Contra isso valem a senha forte e a verificação em duas etapas na conta do Supabase do dono.
- **Não voltar o deploy para antes desta mudança** depois que houver casa cifrada: o código antigo lê `dados` vazio e mostraria uma casa vazia para a pessoa escolher (B3 da seguranca). A cifra no banco não se perde.
- **Bloquear outra pessoa:** 10 senhas erradas para o e-mail de alguém em 15 min impedem essa pessoa de entrar até a janela virar, e 3 pedidos de "esqueci" por hora seguram os e-mails dela (B1). É o preço comum do limite por e-mail, e a conta é opcional: a casa continua no aparelho.

- **Perder o `CASA_SEGREDO` perde as casas guardadas na conta.** As casas que estão nos aparelhos continuam. O guia manda guardar uma cópia num gerenciador de senhas.
- **O banco não consegue somar nada de dentro das casas.** O painel de uso (E12) não lê casas: ele vai usar eventos anônimos e agregados, numa tabela própria, como já estava planejado. A cifra não atrapalha o painel.
- **Ainda dá para chamar `contar_tentativa` direto com chaves aleatórias e encher a tabela.** O tamanho fica limitado pela limpeza diária e pelo limite de pedidos do Supabase. Se doer, dá para exigir um segredo do servidor na função.
- **O e-mail continua aberto no `auth.users`**, porque o Supabase precisa dele para entrar e mandar e-mail.
- **Rotas protegidas e RLS:** agora há um teste que prova o 401 sem sessão em toda rota com dado da pessoa (`conta-servidor.test.ts`). O `pnpm test:banco` confere a tabela nova e a cifra.

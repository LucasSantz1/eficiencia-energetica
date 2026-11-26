-- Limite de tentativas e casa cifrada (pedido do dono em 26/11; ADR-008).
--
-- Regras que este arquivo garante, e que o teste supabase/testes/rls.sql confere:
-- 1. O site conta as tentativas de entrar, criar conta, "esqueci a senha", usar o link do e-mail e abrir link de
--    convidado, por IP e por e-mail. O banco guarda só um HMAC de 32 bytes feito no servidor com um segredo (nunca o
--    IP nem o e-mail), a ação e a janela de tempo. Os limites ficam AQUI, fixos: quem chamar a função direto não
--    escolhe limite nem janela.
-- 2. Ninguém lê nem escreve a tabela de tentativas: só a função mexe nela.
-- 3. A casa passa a ser gravada cifrada pelo servidor (AES-256-GCM, chave CASA_SEGREDO na Vercel) em dados_cifrados,
--    amarrada ao dono (a cifra de uma casa não abre na linha de outra). Quem só LÊ o banco (um backup vazado, uma
--    consulta de leitura) não lê a casa. Não protege de quem pode ESCREVER no banco (ADR-008). A coluna antiga `dados` só fica para as casas
--    gravadas antes desta migração; o servidor regrava cifrado na próxima mudança. Cada linha tem UM dos dois.
-- Compatível com o código de antes: a migração pode rodar antes do deploy.

-- 1. Tentativas ---------------------------------------------------------------------------------------------------
create table public.tentativas (
  acao text not null,
  chave bytea not null check (octet_length(chave) = 32),
  janela timestamptz not null,
  quantas integer not null default 1,
  primary key (acao, chave, janela)
);
create index tentativas_por_janela on public.tentativas (janela);

alter table public.tentativas enable row level security;
alter table public.tentativas force row level security;
revoke all on public.tentativas from public, anon, authenticated;
-- Sem política nenhuma: com a RLS forçada, nem quem tem acesso à tabela lê uma linha. Só a função abaixo.

-- Conta mais uma tentativa e diz se ainda está dentro do limite. Janela fixa (ex.: das 14:00 às 14:15).
create function public.contar_tentativa(nome_da_acao text, chave_da_pessoa bytea) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare
  limite integer;
  segundos integer;
  inicio timestamptz;
  total integer;
begin
  -- ação, tentativas por janela, tamanho da janela em segundos
  select l.limite, l.segundos into limite, segundos
  from (values
    -- Por IP, folgado: no 4G, a operadora junta muitas famílias num IP só (CGNAT). Quem segura senha é o por e-mail.
    ('entrar-ip', 60, 900),        -- 60 tentativas de entrar a cada 15 min por IP
    ('entrar-email', 10, 900),     -- 10 por e-mail a cada 15 min: adivinhar senha fica inviável
    ('cadastrar-ip', 20, 3600),    -- 20 contas novas por hora por IP
    ('esqueci-ip', 20, 3600),
    ('esqueci-email', 3, 3600),    -- 3 e-mails de senha nova por hora para o mesmo endereço
    ('link-ip', 60, 900),          -- confirmar e-mail e senha nova pelo link
    ('convidado-ip', 120, 900)     -- abrir link de convidado (o código não dá para adivinhar; isto barra varredura)
  ) as l (acao, limite, segundos)
  where l.acao = nome_da_acao;
  if limite is null or octet_length(chave_da_pessoa) is distinct from 32 then
    raise exception 'tentativa inválida' using errcode = '22023';
  end if;
  inicio := to_timestamp(floor(extract(epoch from now()) / segundos) * segundos);
  insert into public.tentativas as t (acao, chave, janela) values (nome_da_acao, chave_da_pessoa, inicio)
  on conflict (acao, chave, janela) do update set quantas = t.quantas + 1
  returning t.quantas into total;
  -- Limpeza de vez em quando (sem agendador): janelas de mais de um dia não servem para nada.
  if random() < 0.02 then
    delete from public.tentativas where janela < now() - interval '1 day';
  end if;
  return total <= limite;
end;
$$;
-- O Supabase dá EXECUTE a anon e authenticated em toda função nova (privilégios padrão): tira de todos primeiro.
revoke all on function public.contar_tentativa(text, bytea) from public, anon, authenticated;
-- O servidor chama antes de saber quem é a pessoa (entrar, criar conta), então com a chave pública (anon).
grant execute on function public.contar_tentativa(text, bytea) to anon;

-- 2. Casa cifrada --------------------------------------------------------------------------------------------------
alter table public.casas
  add column dados_cifrados text check (dados_cifrados is null or (dados_cifrados like 'v1.%' and octet_length(dados_cifrados) <= 700000));
alter table public.casas alter column dados drop not null;
alter table public.casas add constraint casas_um_formato check ((dados is null) <> (dados_cifrados is null));

-- O convidado recebe a casa como está no banco; o servidor decifra e corta o que o convidado não vê (ADR-007, M5).
-- O `dono` só serve ao servidor para abrir a cifra (amarrada ao dono); nunca vai para a tela do convidado.
-- Mesmo nome e mesmo argumento: o código de antes continua lendo `dados` das casas antigas até o deploy.
drop function public.casa_do_convite(bytea);
create function public.casa_do_convite(hash bytea)
returns table (dados jsonb, dados_cifrados text, versao_do_formato integer, atualizada_em timestamptz, dono uuid)
language sql stable security definer set search_path = '' as $$
  select c.dados, c.dados_cifrados, c.versao_do_formato, c.atualizada_em, c.dono
  from public.convites v
  join public.casas c on c.dono = v.dono
  where v.hash_do_codigo = hash and octet_length(hash) = 32;
$$;
revoke all on function public.casa_do_convite(bytea) from public;
grant execute on function public.casa_do_convite(bytea) to anon, authenticated;

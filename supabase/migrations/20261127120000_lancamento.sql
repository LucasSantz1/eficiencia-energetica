-- Lançamento (pedido do dono em 26/11): limpeza de contas não confirmadas, contagem anônima de uso e "Isto te ajudou?"
-- (ADR-009). Compatível com o código de antes: roda antes do deploy.
--
-- Regras que este arquivo garante, e que o teste supabase/testes/rls.sql confere:
-- 1. Conta criada e não confirmada em 7 dias é apagada (M2 da seguranca, ADR-007). Roda todo dia pelo pg_cron, quando
--    ele existe (no Supabase existe; no Postgres descartável do teste, não, e a função é testada direto).
-- 2. Uso: só uma contagem por dia e por evento, de uma lista fixa. Nada de id, IP, cookie, cidade, horário ou casa:
--    não dá para saber quem fez o quê, nem juntar dois eventos da mesma pessoa.
-- 3. Opinião: nota de 1 a 5, o momento (de uma lista fixa), o dia (sem hora) e um texto opcional de até 280 letras.
--    A tela pede para não escrever nome, telefone nem endereço.
-- 4. Ninguém lê essas tabelas pela API: só o dono do projeto, no painel do Supabase (e, depois, no painel do E12).

-- 1. Limpeza de contas não confirmadas -----------------------------------------------------------------------------
create function public.limpar_contas_nao_confirmadas() returns integer
language sql volatile security definer set search_path = '' as $$
  with apagadas as (
    delete from auth.users
    where email_confirmed_at is null and created_at < now() - interval '7 days'
    returning 1
  )
  select count(*)::integer from apagadas;
$$;
revoke all on function public.limpar_contas_nao_confirmadas() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    -- Todo dia às 06:17 UTC (03:17 em Brasília), longe da hora cheia.
    perform cron.schedule('limpar-contas-nao-confirmadas', '17 6 * * *', 'select public.limpar_contas_nao_confirmadas()');
  end if;
end;
$$;

-- 2. Contagem anônima de uso ---------------------------------------------------------------------------------------
create table public.uso_por_dia (
  dia date not null,
  evento text not null,
  quantas integer not null default 1 check (quantas > 0),
  primary key (dia, evento)
);
alter table public.uso_por_dia enable row level security;
alter table public.uso_por_dia force row level security;
revoke all on public.uso_por_dia from public, anon, authenticated;

create function public.contar_uso(nome_do_evento text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
begin
  -- Lista fixa: quem chamar direto não inventa evento nem enche a tabela de nomes.
  if nome_do_evento not in (
    'visita',               -- abriu o site (uma vez por aba)
    'cadastro-concluido',   -- terminou o cadastro da casa
    'painel-aberto',        -- abriu Minha casa / acompanhamento (uma vez por aba)
    'conta-anotada',        -- anotou uma conta de luz de verdade
    'estimativa-perto',     -- a conta anotada ficou a até 10% da estimativa
    'estimativa-media',     -- entre 10% e 25%
    'estimativa-longe',     -- mais de 25%
    'dica-no-plano',        -- pôs uma dica no plano
    'meta-definida',
    'compartilhou',
    'imprimiu',
    'ouviu',                -- usou o "Ouvir"
    'comparou',             -- abriu a comparação com casas parecidas
    'conta-confirmada',     -- confirmou o e-mail de uma conta nova
    'convite-criado'        -- criou um link para a família
  ) then
    raise exception 'evento inválido' using errcode = '22023';
  end if;
  insert into public.uso_por_dia as u (dia, evento) values ((now() at time zone 'America/Sao_Paulo')::date, nome_do_evento)
  on conflict (dia, evento) do update set quantas = u.quantas + 1;
  return true;
end;
$$;
revoke all on function public.contar_uso(text) from public, anon, authenticated;
grant execute on function public.contar_uso(text) to anon;

-- 3. "Isto te ajudou?" ---------------------------------------------------------------------------------------------
create table public.opinioes (
  id bigint generated always as identity primary key,
  dia date not null,
  momento text not null,
  nota smallint not null check (nota between 1 and 5),
  texto text check (texto is null or char_length(texto) between 1 and 280)
);
create index opinioes_por_dia on public.opinioes (dia);
alter table public.opinioes enable row level security;
alter table public.opinioes force row level security;
revoke all on public.opinioes from public, anon, authenticated;

create function public.registrar_opiniao(nome_do_momento text, nota_dada smallint, texto_livre text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
begin
  if nome_do_momento not in ('painel', 'dica', 'conta', 'comparacao') then
    raise exception 'momento inválido' using errcode = '22023';
  end if;
  insert into public.opinioes (dia, momento, nota, texto)
  values ((now() at time zone 'America/Sao_Paulo')::date, nome_do_momento, nota_dada, nullif(btrim(texto_livre), ''));
  return true;
end;
$$;
revoke all on function public.registrar_opiniao(text, smallint, text) from public, anon, authenticated;
grant execute on function public.registrar_opiniao(text, smallint, text) to anon;

-- 4. Limites novos de tentativa (ADR-008): a mesma função, com as ações do uso e da opinião. -------------------------
create or replace function public.contar_tentativa(nome_da_acao text, chave_da_pessoa bytea) returns boolean
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
    ('entrar-ip', 60, 900),
    ('entrar-email', 10, 900),
    ('cadastrar-ip', 20, 3600),
    ('esqueci-ip', 20, 3600),
    ('esqueci-email', 3, 3600),
    ('link-ip', 60, 900),
    ('convidado-ip', 120, 900),
    ('uso-ip', 300, 900),          -- contagem de uso: folgada (o CGNAT junta muita gente), só barra robô
    ('opiniao-ip', 10, 3600)       -- "Isto te ajudou?": 10 por hora por IP
  ) as l (acao, limite, segundos)
  where l.acao = nome_da_acao;
  if limite is null or octet_length(chave_da_pessoa) is distinct from 32 then
    raise exception 'tentativa inválida' using errcode = '22023';
  end if;
  inicio := to_timestamp(floor(extract(epoch from now()) / segundos) * segundos);
  insert into public.tentativas as t (acao, chave, janela) values (nome_da_acao, chave_da_pessoa, inicio)
  on conflict (acao, chave, janela) do update set quantas = t.quantas + 1
  returning t.quantas into total;
  if random() < 0.02 then
    delete from public.tentativas where janela < now() - interval '1 day';
  end if;
  return total <= limite;
end;
$$;
revoke all on function public.contar_tentativa(text, bytea) from public, anon, authenticated;
grant execute on function public.contar_tentativa(text, bytea) to anon;

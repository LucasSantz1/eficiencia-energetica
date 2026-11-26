-- Lançamento (pedido do dono em 26/11): limpeza diária, contagem anônima de uso, "Isto te ajudou?" e registro do
-- "concordo" (ADR-009). Compatível com o código de antes: roda antes do deploy.
--
-- Regras que este arquivo garante, e que o teste supabase/testes/rls.sql confere:
-- 1. Limpeza diária (pg_cron, quando ele existe: no Supabase existe; no Postgres descartável do teste, não, e a função é
--    testada direto): conta não confirmada há 7 dias (M2 da seguranca, ADR-007); sessão do Supabase com mais de 31 dias
--    (o limite de 30 dias do site vale também lá); contagem de tentativas com mais de 1 dia (ADR-008); texto das
--    opiniões com mais de 12 meses (a nota fica).
-- 2. Uso: só uma contagem por dia e por evento, de uma lista fixa. Nada de id, IP (nem o código do IP), cookie, cidade,
--    horário ou casa: não dá para saber quem fez o quê, nem juntar dois eventos da mesma pessoa (A1 da seguranca).
-- 3. Opinião: nota de 1 a 5, o momento (de uma lista fixa), o dia (sem hora), um id aleatório (não sequencial: não dá
--    para ligar a opinião à hora em que chegou) e um texto opcional de até 280 letras, sem caractere de controle,
--    invisível ou de troca de direção e sem começar com = + - @ (vira fórmula numa planilha). No máximo 2000 por dia.
-- 4. Ninguém lê essas tabelas pela API: só o dono do projeto, no painel do Supabase (e, depois, no painel do E12).
-- 5. O "concordo" da conta (versão e data) fica numa tabela que a pessoa não muda (B10 da seguranca).

-- 1. Contagem anônima de uso ---------------------------------------------------------------------------------------
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
  -- Teto por dia e evento: quem chamar sem parar só infla o número até aqui (A4 da seguranca).
  insert into public.uso_por_dia as u (dia, evento) values ((now() at time zone 'America/Sao_Paulo')::date, nome_do_evento)
  on conflict (dia, evento) do update set quantas = u.quantas + 1 where u.quantas < 200000;
  return true;
end;
$$;
revoke all on function public.contar_uso(text) from public, anon, authenticated;
grant execute on function public.contar_uso(text) to anon;

-- 2. "Isto te ajudou?" ---------------------------------------------------------------------------------------------
create table public.opinioes (
  id uuid primary key default gen_random_uuid(),
  dia date not null,
  momento text not null,
  nota smallint not null check (nota between 1 and 5),
  texto text check (
    texto is null or (
      char_length(texto) between 1 and 280
      -- Sem controle (C0, C1), invisível (largura zero) nem troca de direção; sem =, +, - ou @ no começo (fórmula).
      and texto !~ '[\u0001-\u001f\u007f-\u009f​-‏‪-‮⁠-⁩﻿]'
      and texto !~ '^[=+@-]'
    )
  )
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
  -- Teto do dia: mesmo com a chave pública vazada, ninguém enche o banco (A4 da seguranca).
  if (select count(*) from public.opinioes where dia = (now() at time zone 'America/Sao_Paulo')::date) >= 2000 then
    return false;
  end if;
  insert into public.opinioes (dia, momento, nota, texto)
  values ((now() at time zone 'America/Sao_Paulo')::date, nome_do_momento, nota_dada, nullif(btrim(texto_livre), ''));
  return true;
end;
$$;
revoke all on function public.registrar_opiniao(text, smallint, text) from public, anon, authenticated;
grant execute on function public.registrar_opiniao(text, smallint, text) to anon;

-- 3. Limite de tentativas da opinião (ADR-008): a mesma função, com a ação nova. ------------------------------------
-- A contagem de uso NÃO passa por aqui (A1 da seguranca): ela não guarda nem o código do IP.
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

-- 4. Registro do "concordo" (B10 da seguranca) ----------------------------------------------------------------------
-- O site manda a versão e a data no cadastro (user_metadata, que a pessoa pode mudar depois). Este gatilho copia, na
-- criação da conta, para uma tabela que ninguém muda pela API. Some junto com a conta (cascade).
create table public.consentimentos (
  dono uuid primary key references auth.users (id) on delete cascade,
  versao_dos_termos text not null check (char_length(versao_dos_termos) between 1 and 20),
  aceito_em timestamptz not null,
  registrado_em timestamptz not null default now()
);
alter table public.consentimentos enable row level security;
alter table public.consentimentos force row level security;
revoke all on public.consentimentos from public, anon, authenticated;

create function public.registrar_consentimento() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  versao text := new.raw_user_meta_data ->> 'termos_versao';
  quando text := new.raw_user_meta_data ->> 'termos_aceitos_em';
begin
  if versao is not null and char_length(versao) between 1 and 20 then
    insert into public.consentimentos (dono, versao_dos_termos, aceito_em)
    values (new.id, versao, coalesce(nullif(quando, '')::timestamptz, now()))
    on conflict (dono) do nothing;
  end if;
  return new;
exception when others then
  -- Nunca impede a criação da conta por causa do registro.
  return new;
end;
$$;
revoke all on function public.registrar_consentimento() from public, anon, authenticated;
create trigger registrar_consentimento after insert on auth.users for each row execute function public.registrar_consentimento();

-- 5. Limpeza diária -----------------------------------------------------------------------------------------------
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

-- Cada passo no seu bloco: um que falhe (permissão no auth, por exemplo) não impede os outros. A falha aparece como
-- aviso no cron.job_run_details.
create function public.limpeza_diaria() returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  begin
    perform public.limpar_contas_nao_confirmadas();
  exception when others then
    raise warning 'limpeza: contas não confirmadas falhou (%)', sqlerrm;
  end;
  begin
    -- O refresh token do Supabase não vence sozinho: a sessão abandonada some depois de 31 dias, como no site (B4).
    if to_regclass('auth.sessions') is not null then
      execute $sql$delete from auth.sessions where created_at < now() - interval '31 days'$sql$;
    end if;
  exception when others then
    raise warning 'limpeza: sessões falhou (%)', sqlerrm;
  end;
  begin
    delete from public.tentativas where janela < now() - interval '1 day';
  exception when others then
    raise warning 'limpeza: tentativas falhou (%)', sqlerrm;
  end;
  begin
    update public.opinioes set texto = null
    where texto is not null and dia < (now() at time zone 'America/Sao_Paulo')::date - interval '12 months';
  exception when others then
    raise warning 'limpeza: texto das opiniões falhou (%)', sqlerrm;
  end;
end;
$$;
revoke all on function public.limpeza_diaria() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    -- Todo dia às 06:17 UTC (03:17 em Brasília), longe da hora cheia. Conferir depois: select * from cron.job;
    perform cron.schedule('limpeza-diaria', '17 6 * * *', 'select public.limpeza_diaria()');
  end if;
end;
$$;

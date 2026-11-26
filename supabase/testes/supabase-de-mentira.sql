-- O mínimo do Supabase para testar a migração num Postgres comum (supabase/testes/rls.sql). Roda como o superusuário
-- (supabase_admin, como no Supabase); a migração roda depois como "postgres", que NÃO é superusuário e tem bypassrls,
-- como no projeto hospedado (B3 da seguranca). Só para teste: nunca roda no projeto de verdade.
create role postgres login createrole bypassrls;
grant create on database postgres to postgres;
alter schema public owner to postgres;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant anon, authenticated, service_role to postgres;
create schema auth;
grant usage on schema auth to anon, authenticated, service_role, postgres;
create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz default now(), created_at timestamptz not null default now());
grant all on auth.users to postgres;
-- auth.uid() lê o "sub" do JWT, como no Supabase.
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;
$$;
grant execute on function auth.uid() to anon, authenticated, postgres;
-- Como no Supabase: anon e authenticated ganham acesso às tabelas e funções novas do public. A migração tem de tirar.
alter default privileges for role postgres in schema public grant all on tables to anon, authenticated;
alter default privileges for role postgres in schema public grant execute on functions to anon, authenticated;

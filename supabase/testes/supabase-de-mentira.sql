-- O mínimo do Supabase para testar a migração num Postgres comum (supabase/testes/rls.sql): os papéis anon,
-- authenticated e service_role, a tabela auth.users e a função auth.uid(), que lê o "sub" do JWT como o Supabase faz.
-- Só para teste: nunca roda no projeto de verdade.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;
$$;
grant execute on function auth.uid() to anon, authenticated;
-- Como no Supabase: anon e authenticated ganham acesso às tabelas novas do public por padrão. A migração tem de tirar.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;

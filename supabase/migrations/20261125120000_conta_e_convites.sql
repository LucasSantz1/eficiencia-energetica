-- Conta opcional e link de convidado (E4: HIS-401, HIS-402, HIS-403, HIS-404 e HIS-407; ADR-007).
--
-- Regras que este arquivo garante, e que o teste supabase/testes/rls.sql confere:
-- 1. Cada casa só é lida, criada, mudada ou apagada pelo dono (RLS ligada e forçada em toda tabela).
-- 2. Quem não está logado (anon) não lê nem escreve tabela nenhuma: só chama casa_do_convite, que SÓ LÊ.
-- 3. O banco guarda o hash (SHA-256) do código do convite, nunca o código: um vazamento do banco não abre nenhum link.
-- 4. Apagar a conta apaga a casa e os convites (on delete cascade), e o convidado perde o acesso na hora.
-- Nenhum dado de identificação além do que o Supabase Auth já guarda (e-mail): a casa é a mesma que fica no celular.

create table public.casas (
  dono uuid primary key references auth.users (id) on delete cascade,
  -- A casa no formato do site (lerCasaSalva do @ee/core). O servidor confere antes de gravar; o teto evita abuso.
  dados jsonb not null check (jsonb_typeof(dados) = 'object' and octet_length(dados::text) <= 500000),
  versao_do_formato integer not null check (versao_do_formato between 1 and 1000),
  atualizada_em timestamptz not null default now()
);

alter table public.casas enable row level security;
alter table public.casas force row level security;

create policy "o dono lê a própria casa" on public.casas for select to authenticated using (dono = (select auth.uid()));
create policy "o dono cria a própria casa" on public.casas for insert to authenticated with check (dono = (select auth.uid()));
create policy "o dono muda a própria casa" on public.casas for update to authenticated
  using (dono = (select auth.uid())) with check (dono = (select auth.uid()));
create policy "o dono apaga a própria casa" on public.casas for delete to authenticated using (dono = (select auth.uid()));

revoke all on public.casas from anon, authenticated;
grant select, insert, update, delete on public.casas to authenticated;

create table public.convites (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references public.casas (dono) on delete cascade,
  hash_do_codigo bytea not null unique check (octet_length(hash_do_codigo) = 32),
  -- Só para o dono reconhecer o link na lista ("Mãe", "Vizinha"). Opcional.
  nome text check (nome is null or char_length(nome) between 1 and 40),
  criado_em timestamptz not null default now()
);

create index convites_do_dono on public.convites (dono);

alter table public.convites enable row level security;
alter table public.convites force row level security;

create policy "o dono vê os próprios convites" on public.convites for select to authenticated using (dono = (select auth.uid()));
create policy "o dono cria convite da própria casa" on public.convites for insert to authenticated with check (dono = (select auth.uid()));
create policy "o dono apaga os próprios convites" on public.convites for delete to authenticated using (dono = (select auth.uid()));
-- Sem política de update: convite não muda, só nasce e morre.

revoke all on public.convites from anon, authenticated;
grant select, insert, delete on public.convites to authenticated;

-- No máximo 20 links por casa: lista curta para o dono revisar, e sem abuso de criação.
create function public.limitar_convites() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.convites where dono = new.dono) >= 20 then
    raise exception 'limite de 20 convites por casa' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke all on function public.limitar_convites() from public, anon, authenticated;

create trigger limitar_convites before insert on public.convites for each row execute function public.limitar_convites();

-- O convidado: entra com o hash do código e só recebe a casa para ler. A função não grava nada e não devolve o dono,
-- o e-mail nem o id do convite.
create function public.casa_do_convite(hash bytea)
returns table (dados jsonb, versao_do_formato integer, atualizada_em timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.dados, c.versao_do_formato, c.atualizada_em
  from public.convites v
  join public.casas c on c.dono = v.dono
  where v.hash_do_codigo = hash and octet_length(hash) = 32;
$$;
revoke all on function public.casa_do_convite(bytea) from public;
grant execute on function public.casa_do_convite(bytea) to anon, authenticated;

-- "Apagar todos os meus dados" (LGPD): apaga a conta do próprio usuário; a casa e os convites vão junto (cascade).
create function public.apagar_minha_conta() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = (select auth.uid());
$$;
revoke all on function public.apagar_minha_conta() from public, anon;
grant execute on function public.apagar_minha_conta() to authenticated;

-- Testes de RLS e das funções da migração (E4, ADR-007). Roda com scripts/testar-banco.sh num Postgres descartável.
-- Cada bloco "deve" termina com erro se a regra quebrar; o psql para no primeiro (ON_ERROR_STOP).
\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'ana@exemplo.org'),
  ('00000000-0000-4000-8000-00000000000b', 'bia@exemplo.org');

create function pg_temp.como(papel text, usuario text) returns void language plpgsql as $$
begin
  execute format('set role %I', papel);
  perform set_config('request.jwt.claims', coalesce(json_build_object('sub', usuario)::text, ''), false);
end;
$$;

create function pg_temp.deve_falhar(comando text, motivo text) returns void language plpgsql as $$
begin
  begin
    execute comando;
  exception when others then
    return;
  end;
  raise exception 'deveria ter falhado (%): %', motivo, comando;
end;
$$;

-- A Ana cria a casa dela e um convite.
select pg_temp.como('authenticated', '00000000-0000-4000-8000-00000000000a');
insert into public.casas (dono, dados, versao_do_formato) values ('00000000-0000-4000-8000-00000000000a', '{"comodos": []}', 3);
insert into public.convites (dono, hash_do_codigo, nome) values ('00000000-0000-4000-8000-00000000000a', sha256('codigo-da-ana'), 'Mãe');
do $$ begin
  if (select count(*) from public.casas) <> 1 then raise exception 'a Ana devia ver a casa dela'; end if;
end $$;

-- 1. A Bia não vê, não muda, não apaga a casa da Ana, e não cria casa nem convite em nome dela.
select pg_temp.como('authenticated', '00000000-0000-4000-8000-00000000000b');
do $$ begin
  if (select count(*) from public.casas) <> 0 then raise exception 'a Bia viu a casa da Ana'; end if;
  if (select count(*) from public.convites) <> 0 then raise exception 'a Bia viu os convites da Ana'; end if;
  update public.casas set dados = '{"roubado": true}';
  delete from public.casas;
  delete from public.convites;
end $$;
select pg_temp.deve_falhar($$insert into public.casas (dono, dados, versao_do_formato) values ('00000000-0000-4000-8000-00000000000a', '{}', 3)$$, 'casa em nome de outro');
select pg_temp.deve_falhar($$insert into public.convites (dono, hash_do_codigo) values ('00000000-0000-4000-8000-00000000000a', sha256('da-bia'))$$, 'convite na casa de outro');

-- 2. anon não lê nem escreve tabela nenhuma; só a função do convite, que só lê.
reset role;
select pg_temp.como('anon', null);
select pg_temp.deve_falhar('select * from public.casas', 'anon lendo casas');
select pg_temp.deve_falhar('select * from public.convites', 'anon lendo convites');
select pg_temp.deve_falhar($$insert into public.casas (dono, dados, versao_do_formato) values ('00000000-0000-4000-8000-00000000000a', '{}', 3)$$, 'anon criando casa');
select pg_temp.deve_falhar('select public.apagar_minha_conta()', 'anon apagando conta');
select pg_temp.deve_falhar('select public.limitar_convites()', 'anon chamando a trava');
do $$ begin
  if (select dados from public.casa_do_convite(sha256('codigo-da-ana'))) <> '{"comodos": []}'::jsonb then raise exception 'o convite certo devia abrir a casa'; end if;
  if exists (select 1 from public.casa_do_convite(sha256('codigo-errado'))) then raise exception 'código errado abriu uma casa'; end if;
  if exists (select 1 from public.casa_do_convite('\x00'::bytea)) then raise exception 'hash curto abriu uma casa'; end if;
end $$;

-- 3. A Ana muda a casa; os dados da casa continuam só dela; e o convite não muda (sem update).
reset role;
select pg_temp.como('authenticated', '00000000-0000-4000-8000-00000000000a');
do $$ begin
  update public.casas set dados = '{"comodos": [1]}';
  if (select dados from public.casas) <> '{"comodos": [1]}'::jsonb then raise exception 'a Ana devia mudar a casa dela'; end if;
end $$;
select pg_temp.deve_falhar($$update public.convites set nome = 'Outro'$$, 'convite não muda');
select pg_temp.deve_falhar($$update public.casas set dono = '00000000-0000-4000-8000-00000000000b'$$, 'passar a casa para outro dono');

-- 4. No máximo 20 convites.
do $$ begin
  for i in 2..20 loop
    insert into public.convites (dono, hash_do_codigo) values ('00000000-0000-4000-8000-00000000000a', sha256(convert_to('c' || i, 'UTF8')));
  end loop;
end $$;
select pg_temp.deve_falhar($$insert into public.convites (dono, hash_do_codigo) values ('00000000-0000-4000-8000-00000000000a', sha256('c21'))$$, '21º convite');

-- 5. Apagar o convite tira o acesso na hora.
delete from public.convites where nome = 'Mãe';
reset role;
select pg_temp.como('anon', null);
do $$ begin
  if exists (select 1 from public.casa_do_convite(sha256('codigo-da-ana'))) then raise exception 'convite apagado ainda abre a casa'; end if;
end $$;

-- 6. Apagar a conta apaga a casa e os convites; a Bia continua de pé.
reset role;
select pg_temp.como('authenticated', '00000000-0000-4000-8000-00000000000a');
select public.apagar_minha_conta();
reset role;
do $$ begin
  if exists (select 1 from auth.users where id = '00000000-0000-4000-8000-00000000000a') then raise exception 'a conta não foi apagada'; end if;
  if exists (select 1 from public.casas) or exists (select 1 from public.convites) then raise exception 'a casa ou os convites sobraram'; end if;
  if not exists (select 1 from auth.users where id = '00000000-0000-4000-8000-00000000000b') then raise exception 'apagou a conta errada'; end if;
end $$;

-- 7. Casa cifrada (ADR-008): a casa nova vai em dados_cifrados; nunca os dois formatos, nem nenhum; o convite devolve a cifra.
select pg_temp.como('authenticated', '00000000-0000-4000-8000-00000000000b');
insert into public.casas (dono, dados_cifrados, versao_do_formato) values ('00000000-0000-4000-8000-00000000000b', 'v1.cifra-da-bia', 3);
insert into public.convites (dono, hash_do_codigo) values ('00000000-0000-4000-8000-00000000000b', sha256('codigo-da-bia'));
select pg_temp.deve_falhar($$update public.casas set dados = '{}'$$, 'dois formatos na mesma casa');
select pg_temp.deve_falhar($$update public.casas set dados_cifrados = null$$, 'casa sem formato nenhum');
select pg_temp.deve_falhar($$update public.casas set dados_cifrados = 'texto-aberto'$$, 'cifra sem o prefixo v1.');
reset role;
select pg_temp.como('anon', null);
do $$ begin
  if (select dados_cifrados from public.casa_do_convite(sha256('codigo-da-bia'))) <> 'v1.cifra-da-bia' then raise exception 'o convite devia devolver a cifra'; end if;
  if (select dados from public.casa_do_convite(sha256('codigo-da-bia'))) is not null then raise exception 'casa cifrada com texto aberto'; end if;
  -- O dono volta só para o servidor abrir a cifra, que é amarrada a ele (M1).
  if (select dono from public.casa_do_convite(sha256('codigo-da-bia'))) <> '00000000-0000-4000-8000-00000000000b' then raise exception 'o convite devia devolver o dono para abrir a cifra'; end if;
end $$;

-- 8. Tentativas (ADR-008): ninguém lê nem escreve a tabela; a função conta, barra no limite e não aceita limite de fora.
select pg_temp.deve_falhar('select * from public.tentativas', 'anon lendo tentativas');
select pg_temp.deve_falhar($$insert into public.tentativas (acao, chave, janela) values ('entrar-ip', sha256('x'), now())$$, 'anon gravando tentativa');
select pg_temp.deve_falhar($$select public.contar_tentativa('inventada', sha256('x'))$$, 'ação fora da lista');
select pg_temp.deve_falhar($$select public.contar_tentativa('entrar-email', '\x00'::bytea)$$, 'chave curta');
do $$ begin
  for i in 1..10 loop
    if not public.contar_tentativa('entrar-email', sha256('ip-da-ana')) then raise exception 'barrou antes do limite (%)', i; end if;
  end loop;
  if public.contar_tentativa('entrar-email', sha256('ip-da-ana')) then raise exception 'a 11ª tentativa devia ser barrada'; end if;
  if not public.contar_tentativa('entrar-email', sha256('outra-pessoa')) then raise exception 'barrou a pessoa errada'; end if;
  if not public.contar_tentativa('entrar-ip', sha256('ip-da-ana')) then raise exception 'cada ação conta à parte'; end if;
end $$;
reset role;
select pg_temp.como('authenticated', '00000000-0000-4000-8000-00000000000b');
select pg_temp.deve_falhar('select * from public.tentativas', 'logado lendo tentativas');
select pg_temp.deve_falhar($$select public.contar_tentativa('entrar-ip', sha256('x'))$$, 'logado chamando a contagem');
reset role;

-- 9. Lançamento (ADR-009): contas não confirmadas há mais de 7 dias somem; as confirmadas e as novas ficam.
insert into auth.users (id, email, email_confirmed_at, created_at) values
  ('00000000-0000-4000-8000-0000000000c1', 'velha-sem-confirmar@exemplo.org', null, now() - interval '8 days'),
  ('00000000-0000-4000-8000-0000000000c2', 'nova-sem-confirmar@exemplo.org', null, now() - interval '1 day'),
  ('00000000-0000-4000-8000-0000000000c3', 'velha-confirmada@exemplo.org', now() - interval '20 days', now() - interval '20 days');
do $$ begin
  if public.limpar_contas_nao_confirmadas() <> 1 then raise exception 'devia apagar só a conta velha sem confirmar'; end if;
  if exists (select 1 from auth.users where id = '00000000-0000-4000-8000-0000000000c1') then raise exception 'a conta velha sem confirmar ficou'; end if;
  if (select count(*) from auth.users where id in ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000c3')) <> 2 then raise exception 'apagou conta que não devia'; end if;
end $$;
select pg_temp.como('anon', null);
select pg_temp.deve_falhar('select public.limpar_contas_nao_confirmadas()', 'anon chamando a limpeza');

-- 10. Uso e opinião: anon só conta e opina pela função, de listas fixas; ninguém lê as tabelas pela API.
do $$ begin
  perform public.contar_uso('visita');
  perform public.contar_uso('visita');
  perform public.registrar_opiniao('painel', 5::smallint, '  Me ajudou a ver o chuveiro  ');
  perform public.registrar_opiniao('dica', 2::smallint, '   ');
end $$;
select pg_temp.deve_falhar($$select public.contar_uso('inventado')$$, 'evento fora da lista');
select pg_temp.deve_falhar($$select public.registrar_opiniao('outro', 3::smallint, null)$$, 'momento fora da lista');
select pg_temp.deve_falhar($$select public.registrar_opiniao('painel', 6::smallint, null)$$, 'nota 6');
select pg_temp.deve_falhar($$select public.registrar_opiniao('painel', 4::smallint, repeat('a', 281))$$, 'texto longo');
select pg_temp.deve_falhar('select * from public.uso_por_dia', 'anon lendo o uso');
select pg_temp.deve_falhar('select * from public.opinioes', 'anon lendo opiniões');
select pg_temp.deve_falhar($$insert into public.opinioes (dia, momento, nota) values (current_date, 'painel', 5)$$, 'anon gravando opinião direto');
do $$ begin
  if not public.contar_tentativa('uso-ip', sha256('ip')) or not public.contar_tentativa('opiniao-ip', sha256('ip')) then raise exception 'ações novas do limite'; end if;
end $$;
reset role;
select pg_temp.como('authenticated', '00000000-0000-4000-8000-00000000000b');
select pg_temp.deve_falhar($$select public.contar_uso('visita')$$, 'logado contando uso direto');
select pg_temp.deve_falhar('select * from public.opinioes', 'logado lendo opiniões');
reset role;
do $$ begin
  if (select quantas from public.uso_por_dia where evento = 'visita') <> 2 then raise exception 'a contagem devia somar'; end if;
  if (select count(*) from public.uso_por_dia) <> 1 then raise exception 'uma linha por dia e evento'; end if;
  if (select texto from public.opinioes where nota = 5) <> 'Me ajudou a ver o chuveiro' then raise exception 'o texto devia sair sem espaços nas pontas'; end if;
  if (select texto from public.opinioes where nota = 2) is not null then raise exception 'texto só de espaços vira vazio'; end if;
end $$;

\echo 'RLS: tudo certo'

#!/usr/bin/env bash
# Testa a migração do Supabase (supabase/migrations) num Postgres descartável: RLS, convites e apagar conta (E4).
# Precisa dos binários do PostgreSQL (initdb, pg_ctl, psql), que já vêm no runner do GitHub e no ambiente de nuvem.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
PASTA="$(mktemp -d)"
PORTA="${PORTA_BANCO:-54329}"
trap '"${COMO[@]}" "$BIN/pg_ctl" -D "$PASTA/dados" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$PASTA"' EXIT
# O Postgres não roda como root (ambiente de nuvem): aí usa o usuário postgres do pacote.
COMO=()
if [ "$(id -u)" = 0 ]; then chown postgres "$PASTA"; COMO=(runuser -u postgres --); fi
"${COMO[@]}" "$BIN/initdb" -D "$PASTA/dados" -U supabase_admin --auth=trust >/dev/null
"${COMO[@]}" "$BIN/pg_ctl" -D "$PASTA/dados" -o "-p $PORTA -k $PASTA -c listen_addresses=''" -l "$PASTA/log" -w start >/dev/null
# Como no Supabase: o superusuário prepara; a migração roda como "postgres" (sem superusuário, com bypassrls).
ADMIN=(psql -X -q -o /dev/null -v ON_ERROR_STOP=1 -h "$PASTA" -p "$PORTA" -U supabase_admin -d postgres)
DONO=(psql -X -q -o /dev/null -v ON_ERROR_STOP=1 -h "$PASTA" -p "$PORTA" -U postgres -d postgres)
"${ADMIN[@]}" -f "$RAIZ/supabase/testes/supabase-de-mentira.sql"
for migracao in "$RAIZ"/supabase/migrations/*.sql; do "${DONO[@]}" -f "$migracao"; done
"${ADMIN[@]}" -f "$RAIZ/supabase/testes/rls.sql"

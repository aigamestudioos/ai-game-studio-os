#!/usr/bin/env bash
# Sprint 2.16a — roda os testes de `transition_submission`/`complete_submission_job`
# contra o Postgres do stack Supabase LOCAL (Docker). Nunca aponta para produção.
#
# Uso: bash scripts/test-submission-lifecycle.sh
set -euo pipefail
cd "$(dirname "$0")/.."

CONTAINER="${SUPABASE_DB_CONTAINER:-supabase_db_ai-game-studio-os}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "❌ Container '$CONTAINER' não está rodando — suba o stack local (npx supabase start)."
  exit 1
fi

echo "=== supabase/tests/submission_lifecycle_test.sql (banco local, tudo em ROLLBACK) ==="
docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d postgres \
  < supabase/tests/submission_lifecycle_test.sql

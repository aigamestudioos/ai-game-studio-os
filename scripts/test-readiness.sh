#!/usr/bin/env bash
# Sprint 2.12a — roda os testes do avaliador de Readiness contra o Postgres
# do stack Supabase LOCAL (Docker). Nunca aponta para produção: o container
# é fixo e o script falha se ele não estiver de pé.
#
# Uso: bash scripts/test-readiness.sh
set -euo pipefail
cd "$(dirname "$0")/.."

CONTAINER="${SUPABASE_DB_CONTAINER:-supabase_db_ai-game-studio-os}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "❌ Container '$CONTAINER' não está rodando — suba o stack local (npx supabase start)."
  exit 1
fi

echo "=== supabase/tests/readiness_test.sql (banco local, tudo em ROLLBACK) ==="
docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d postgres \
  < supabase/tests/readiness_test.sql

echo
echo "=== scripts/test-readiness-golden-path.mjs (Sprint 2.12c — fluxo HTTP real) ==="
node scripts/test-readiness-golden-path.mjs

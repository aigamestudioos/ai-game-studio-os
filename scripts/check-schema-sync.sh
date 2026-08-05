#!/usr/bin/env bash
# Verifica se todas as migrations locais (supabase/migrations/) já foram
# aplicadas ao projeto Supabase de produção. Não aplica nada — só compara e
# falha (exit 1) se houver migration local sem aplicar remotamente.
#
# Ver DEPLOY_RUNBOOK.md para quando rodar isso (obrigatório antes de
# declarar a validação de produção de qualquer sprint que mude schema como
# concluída) e como aplicar uma migration pendente.
#
# Precisa de UMA das duas credenciais (nunca commitar nenhuma delas):
#   SUPABASE_ACCESS_TOKEN — gerar em supabase.com/dashboard/account/tokens
#   SUPABASE_DB_URL       — connection string do Postgres de produção (com senha, percent-encoded)
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -n "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  MODE="--linked"
elif [ -n "${SUPABASE_DB_URL:-}" ]; then
  MODE="--db-url $SUPABASE_DB_URL"
else
  echo "❌ Nenhuma credencial disponível (SUPABASE_ACCESS_TOKEN ou SUPABASE_DB_URL)."
  echo "   Defina uma delas antes de rodar este script. Ver DEPLOY_RUNBOOK.md."
  exit 1
fi

echo "=== supabase migration list $MODE ==="
# shellcheck disable=SC2086
OUTPUT=$(npx supabase migration list $MODE 2>&1) || {
  echo "$OUTPUT"
  echo "❌ Falha ao consultar o estado das migrations (credencial inválida ou projeto não linkado?)."
  exit 1
}
echo "$OUTPUT"

# A CLI emite uma linha JSON ({"migrations":[{"local":...,"remote":...}]}) —
# não uma tabela de texto. Extraído com node (sempre disponível neste
# monorepo) em vez de awk/grep na tabela antiga, que nunca soube ler JSON e
# reportava "tudo pendente" mesmo com o schema em sincronia (bug real,
# achado e corrigido no Sprint 2.7.1 comparando contra o schema real via
# PostgREST antes de confiar cegamente na saída deste script).
JSON_LINE=$(echo "$OUTPUT" | grep -oE '\{"migrations".*\}' | tail -1)

if [ -z "$JSON_LINE" ]; then
  echo "❌ Não consegui encontrar a linha JSON de 'migrations' na saída acima — formato inesperado da CLI."
  exit 1
fi

LOCAL_ONLY=$(node -e '
  const data = JSON.parse(process.argv[1]);
  const pending = data.migrations.filter((m) => !m.remote);
  for (const m of pending) console.log(m.local);
' "$JSON_LINE")

if [ -n "$LOCAL_ONLY" ]; then
  echo ""
  echo "❌ Migrations locais AINDA NÃO aplicadas em produção:"
  echo "$LOCAL_ONLY" | sed 's/^/   - /'
  echo ""
  echo "   Aplicar com: npx supabase db push (revise o diff antes de confirmar)."
  exit 1
fi

echo ""
echo "✅ Schema de produção em sincronia com supabase/migrations/."

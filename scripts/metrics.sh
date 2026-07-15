#!/usr/bin/env bash
# Collects repo metrics and prints a METRICS.md-ready snapshot.
# Usage: ./scripts/metrics.sh
set -euo pipefail
cd "$(dirname "$0")/.."

APPS=$(ls apps 2>/dev/null | wc -l | tr -d ' ')
PACKAGES=$(ls packages 2>/dev/null | wc -l | tr -d ' ')
FILES=$(git ls-files | wc -l | tr -d ' ')
LOC=$(git ls-files | grep -E '\.(ts|tsx|js|jsx|sql)$' | xargs cat 2>/dev/null | wc -l | tr -d ' ')
COMMITS=$(git rev-list --count HEAD)

TYPECHECK_STATUS="⬜ não executado"
LINT_STATUS="⬜ não executado"
BUILD_STATUS="⬜ não executado"

if pnpm typecheck >/tmp/metrics-typecheck.log 2>&1; then TYPECHECK_STATUS="✅"; else TYPECHECK_STATUS="❌"; fi
if pnpm lint >/tmp/metrics-lint.log 2>&1; then LINT_STATUS="✅"; else LINT_STATUS="❌"; fi

BUILD_START=$(date +%s)
if pnpm build >/tmp/metrics-build.log 2>&1; then BUILD_STATUS="✅"; else BUILD_STATUS="❌"; fi
BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))

# Métricas isoladas de apps/web (só roda se o app existir).
WEB_BUILD_TIME="—"
WEB_DEV_START_TIME="—"
WEB_TYPECHECK_TIME="—"
if [ -d apps/web ]; then
  T0=$(date +%s)
  pnpm --filter web build >/tmp/metrics-web-build.log 2>&1 || true
  WEB_BUILD_TIME="$(( $(date +%s) - T0 ))s"

  T0=$(date +%s)
  pnpm --filter web typecheck >/tmp/metrics-web-typecheck.log 2>&1 || true
  WEB_TYPECHECK_TIME="$(( $(date +%s) - T0 ))s"

  rm -f /tmp/metrics-web-dev.log
  T0=$(date +%s)
  (cd apps/web && pnpm exec next dev -p 3999 >/tmp/metrics-web-dev.log 2>&1) &
  timeout 30 bash -c 'until grep -q "Ready in" /tmp/metrics-web-dev.log 2>/dev/null; do sleep 0.2; done' || true
  WEB_DEV_START_TIME="$(( $(date +%s) - T0 ))s"
  pkill -f "next dev -p 3999" 2>/dev/null || true
fi

# Testes: só roda se houver script "test" configurado em algum package; não falha o snapshot se não houver.
UNIT_TESTS="0 (sem suíte configurada)"
E2E_TESTS="0 (sem suíte configurada)"
COVERAGE="0% (sem cobertura configurada)"
if pnpm test >/tmp/metrics-test.log 2>&1; then
  UNIT_TESTS="ver /tmp/metrics-test.log"
fi

echo "=== Código ==="
echo "Apps: $APPS"
echo "Packages: $PACKAGES"
echo "Arquivos (git-tracked): $FILES"
echo "Linhas de código (ts/tsx/js/jsx/sql): $LOC"
echo "Commits: $COMMITS"
echo "Typecheck: $TYPECHECK_STATUS"
echo "Lint: $LINT_STATUS"
echo "Build: $BUILD_STATUS"
echo
echo "=== Infraestrutura ==="
echo "Tempo do build (monorepo completo): ${BUILD_TIME}s"
echo "Tempo do pnpm install: (medir manualmente com 'time pnpm install')"
echo "Tempo do CI: (preencher a partir do log do GitHub Actions)"
echo "Tempo do build (apps/web isolado): $WEB_BUILD_TIME"
echo "Tempo de start do dev server (apps/web): $WEB_DEV_START_TIME"
echo "Tempo do typecheck (apps/web isolado): $WEB_TYPECHECK_TIME"
echo
echo "=== Qualidade ==="
echo "Testes unitários: $UNIT_TESTS"
echo "Testes E2E: $E2E_TESTS"
echo "Cobertura: $COVERAGE"
echo
echo "=== Produto / Deploy ==="
echo "Módulos, integrações, telas, Vercel, Supabase, Ambientes: preencher manualmente com base no sprint atual."

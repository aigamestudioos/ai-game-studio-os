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
echo "Tempo do build: ${BUILD_TIME}s"
echo "Tempo do pnpm install: (medir manualmente com 'time pnpm install')"
echo "Tempo do CI: (preencher a partir do log do GitHub Actions)"
echo
echo "=== Qualidade ==="
echo "Testes unitários: $UNIT_TESTS"
echo "Testes E2E: $E2E_TESTS"
echo "Cobertura: $COVERAGE"
echo
echo "=== Produto / Deploy ==="
echo "Módulos, integrações, telas, Vercel, Supabase, Ambientes: preencher manualmente com base no sprint atual."

#!/bin/bash

# pre-commit.sh - Run checks before allowing commit

set -e

echo "🔍 Running pre-commit checks..."

# TypeScript check
echo "📘 TypeScript..."
pnpm typecheck || {
    echo "❌ TypeScript errors found"
    exit 1
}

# Lint check
echo "🧹 Linting..."
pnpm lint || {
    echo "❌ Lint errors found"
    exit 1
}

# Test check (optional - can be slow)
# Uncomment if you want tests on every commit
# echo "🧪 Tests..."
# pnpm test || {
#     echo "❌ Tests failed"
#     exit 1
# }

echo "✅ All checks passed!"

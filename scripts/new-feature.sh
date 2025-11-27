#!/bin/bash

# new-feature.sh - Set up a new feature branch and documentation

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/new-feature.sh <feature-name>"
    echo "Example: ./scripts/new-feature.sh user-auth"
    exit 1
fi

FEATURE_NAME=$1
BRANCH_NAME="feature/${FEATURE_NAME}"
DATE=$(date +%Y-%m-%d)

echo "🚀 Setting up feature: ${FEATURE_NAME}"

# 1. Ensure we're on main and up to date
echo "📥 Updating main..."
git checkout main
git pull origin main

# 2. Create feature branch
echo "🌿 Creating branch: ${BRANCH_NAME}"
git checkout -b "${BRANCH_NAME}"

# 3. Create phase marker
PHASE_FILE="docs/phases/${FEATURE_NAME}-phase.md"
echo "📝 Creating phase marker: ${PHASE_FILE}"
cat > "${PHASE_FILE}" << EOF
# Phase: ${FEATURE_NAME}

**Status:** 🟡 In Progress
**Started:** ${DATE}
**Completed:** -
**Branch:** \`${BRANCH_NAME}\`

## Objectives

- [ ] 

## Quality gates

### Product
- [ ] PRD approved
- [ ] Metrics defined

### Design
- [ ] Spec complete
- [ ] A11y reviewed

### Dev
- [ ] Tests pass
- [ ] Code reviewed
- [ ] No TS errors

### Release
- [ ] CHANGELOG updated
- [ ] PR merged

## Progress

### ${DATE}
- Feature started

## Blockers

| Blocker | Owner | Status |
|---------|-------|--------|

## Links

- PRD: docs/requirements/${FEATURE_NAME}-prd.md
- Design: docs/design/${FEATURE_NAME}-design-spec.md
EOF

# 4. Initial commit
git add "${PHASE_FILE}"
git commit -m "chore: start ${FEATURE_NAME} feature"

echo ""
echo "✅ Feature setup complete!"
echo ""
echo "Next steps:"
echo "  1. Create PRD: claude then /create-prd ${FEATURE_NAME}"
echo "  2. Create design spec: /create-design-spec ${FEATURE_NAME}"
echo "  3. Start implementation"
echo ""
echo "Branch: ${BRANCH_NAME}"
echo "Phase marker: ${PHASE_FILE}"

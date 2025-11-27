#!/bin/bash

# sync-obsidian.sh - Sync project status to Obsidian vault

# Configure your vault path
VAULT_PATH="${OBSIDIAN_VAULT_PATH:-/Users/delfo/Documents/delf0}"
PROJECT_NAME="cursor-ai-mvp"
DATE=$(date +%Y-%m-%d)

echo "📚 Syncing to Obsidian: ${VAULT_PATH}"

# Check vault exists
if [ ! -d "$VAULT_PATH" ]; then
    echo "❌ Vault not found at ${VAULT_PATH}"
    echo "Set OBSIDIAN_VAULT_PATH environment variable"
    exit 1
fi

PROJECT_DIR="${VAULT_PATH}/01-projects/${PROJECT_NAME}"
DAILY_DIR="${VAULT_PATH}/daily/$(date +%Y/%m)"

# Create directories if needed
mkdir -p "$PROJECT_DIR"
mkdir -p "$DAILY_DIR"

# Sync phase status to project index
echo "📊 Updating project index..."

# Count phases by status
IN_PROGRESS=$(grep -l "🟡 In Progress" docs/phases/*.md 2>/dev/null | wc -l)
COMPLETE=$(grep -l "🟢 Complete" docs/phases/*.md 2>/dev/null | wc -l)
BLOCKED=$(grep -l "🔴 Blocked" docs/phases/*.md 2>/dev/null | wc -l)

# Update project log
cat >> "${PROJECT_DIR}/_index.md" << EOF

### ${DATE} (auto-sync)
- In progress: ${IN_PROGRESS}
- Complete: ${COMPLETE}
- Blocked: ${BLOCKED}
- Branch: $(git branch --show-current)
EOF

echo "✅ Synced to ${PROJECT_DIR}/_index.md"

# Append to daily note if exists
DAILY_NOTE="${DAILY_DIR}/${DATE}.md"
if [ -f "$DAILY_NOTE" ]; then
    echo "📝 Appending to daily note..."
    cat >> "$DAILY_NOTE" << EOF

## Auto-sync: ${PROJECT_NAME}
- Branch: $(git branch --show-current)
- Recent commits:
$(git log --oneline -3)
EOF
    echo "✅ Updated ${DAILY_NOTE}"
fi

echo ""
echo "Done!"

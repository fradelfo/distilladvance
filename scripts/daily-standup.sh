#!/bin/bash

# daily-standup.sh - Generate standup summary from git and phase markers

DATE=$(date +%Y-%m-%d)
YESTERDAY=$(date -d "yesterday" +%Y-%m-%d 2>/dev/null || date -v-1d +%Y-%m-%d)

echo "📋 Daily Standup - ${DATE}"
echo "=========================="
echo ""

# Yesterday's commits
echo "## Yesterday (${YESTERDAY})"
echo ""
COMMITS=$(git log --since="${YESTERDAY} 00:00" --until="${DATE} 00:00" --oneline 2>/dev/null)
if [ -z "$COMMITS" ]; then
    echo "No commits yesterday"
else
    echo "$COMMITS"
fi
echo ""

# Active phases
echo "## In Progress"
echo ""
if [ -d "docs/phases" ]; then
    grep -l "🟡 In Progress" docs/phases/*.md 2>/dev/null | while read file; do
        name=$(basename "$file" .md | sed 's/-phase//')
        echo "- ${name}"
    done
fi
echo ""

# Blocked items
echo "## Blockers"
echo ""
if [ -d "docs/phases" ]; then
    grep -l "🔴 Blocked" docs/phases/*.md 2>/dev/null | while read file; do
        name=$(basename "$file" .md | sed 's/-phase//')
        echo "- ${name}"
    done
fi
echo ""

# Current branch
echo "## Current State"
echo ""
echo "Branch: $(git branch --show-current)"
echo "Status:"
git status --short

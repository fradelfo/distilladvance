# Scripts

Automation scripts for the workflow.

## Available scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `new-feature.sh` | Set up new feature branch and docs | `./scripts/new-feature.sh feature-name` |
| `pre-commit.sh` | Run checks before commit | Runs via git hook |
| `sync-obsidian.sh` | Sync project status to Obsidian | `./scripts/sync-obsidian.sh` |
| `daily-standup.sh` | Generate standup from git + phases | `./scripts/daily-standup.sh` |

## Setup

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Set up git hooks
cp scripts/pre-commit.sh .git/hooks/pre-commit
```

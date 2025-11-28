---
name: sync-to-obsidian
description: Bulk sync local docs to Obsidian vault (periodic use)
allowed-tools: Read, Glob, mcp__MCP_DOCKER__obsidian_append_content, mcp__MCP_DOCKER__obsidian_get_file_contents, mcp__MCP_DOCKER__obsidian_delete_file, mcp__MCP_DOCKER__obsidian_list_files_in_dir
---

# Sync to Obsidian

Bulk sync local documentation to Obsidian vault.

## Mapping

| Local | Obsidian |
|-------|----------|
| `cursormvp/docs/logs/development-log.md` | `Projects/DistillAdv/Development Log.md` |
| `cursormvp/docs/logs/roadmap.md` | `Projects/DistillAdv/Roadmap.md` |
| `cursormvp/docs/logs/session-start.md` | `Projects/DistillAdv/Session Start.md` |
| `cursormvp/docs/logs/sprints/sprint-1.md` | `Projects/DistillAdv/Sprint 1/Summary.md` |
| `cursormvp/docs/logs/sprints/sprint-2.md` | `Projects/DistillAdv/Sprint 2/Summary.md` |
| `cursormvp/docs/logs/sprints/sprint-3.md` | `Projects/DistillAdv/Sprint 3/Summary.md` |
| `cursormvp/docs/logs/sprints/sprint-4.md` | `Projects/DistillAdv/Sprint 4/Summary.md` |

## Process

1. Read each local file
2. Delete existing Obsidian file (if exists)
3. Create new Obsidian file with local content
4. Confirm sync status

## When to use

- End of significant session
- Before sharing documentation
- Weekly sync for backup

## Output

After sync, report:
- Files synced successfully
- Any errors encountered
- Timestamp of sync

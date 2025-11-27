# Memory MCP Bootstrap

How to set up and seed the Memory MCP for context persistence.

## What is Memory MCP?

The Memory MCP stores a knowledge graph of entities and relationships that persists across sessions. Claude can read/write to this, maintaining context about your project.

## Setup

### 1. Install

Already configured in `.mcp.json`:
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "./.memory.jsonl"
      }
    }
  }
}
```

### 2. Bootstrap with initial context

On first session, tell Claude to store key entities:

```
Please store these in memory:

PROJECT: cursor-ai-mvp
- Type: Digital product
- Stage: Post-MVP, continuing development
- Tech: [your stack]
- Goal: [main goal]

USER: [your name]
- Role: Solo developer/product person
- Preferences: Enterprise-lite workflow, TDD, accessibility-first

CURRENT_PHASE: [current feature]
- Status: In progress
- Branch: feature/[name]
- Blockers: [any]
```

### 3. Verify storage

Ask Claude:
```
What do you know about this project from memory?
```

## What to store

### Always store
- Project metadata (name, stack, stage)
- Current active feature/phase
- Key decisions made
- Your preferences

### Store when relevant
- User personas (for product discussions)
- Technical constraints discovered
- Patterns that worked well
- Mistakes to avoid

### Don't store
- Code (use files instead)
- Temporary notes (use Obsidian)
- Sensitive data

## Memory file location

The `.memory.jsonl` file is gitignored by default (it's in `.gitignore`). If you want to:

**Share across machines:** Remove from `.gitignore` and commit

**Keep private:** Leave gitignored, it stays local

## Updating memory

As you work, Claude can update memory:

```
Update memory: Feature X is now complete.
Current phase is now Feature Y.
```

Or explicitly:
```
Store in memory: We decided to use PostgreSQL because [reason].
```

## Troubleshooting

**Memory not persisting:**
- Check `.memory.jsonl` exists and is writable
- Verify MCP is loaded: Claude shows available tools at session start

**Memory getting cluttered:**
- Ask Claude to clean up: "Remove outdated entities from memory"
- Or delete `.memory.jsonl` and re-bootstrap

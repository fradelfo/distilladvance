# Cursor AI MVP

> Enterprise-lite product development workflow with Claude Code

## Overview

[PASTE PROJECT DESCRIPTION]

## Quick start

```bash
# Install
pnpm install

# Develop
pnpm dev

# Test
pnpm test

# Start Claude Code
claude
```

## First time setup

1. Read [WORKFLOW.md](WORKFLOW.md) — understand the process
2. Read [SESSION-RESUME.md](SESSION-RESUME.md) — how to pick up work
3. Read [MEMORY-SETUP.md](MEMORY-SETUP.md) — bootstrap memory MCP
4. Run `/ask-context` in Claude Code — it will ask for your docs

## Project structure

```
cursor-ai-mvp/
├── .claude/
│   ├── agents/           # AI agent definitions
│   │   ├── product-manager.md
│   │   ├── designer.md
│   │   └── developer.md
│   ├── commands/         # Slash commands (14 commands)
│   └── settings/         # Hooks, config
├── .github/              # CI, templates
├── docs/
│   ├── backlog/         # Feature ideas before PRD
│   ├── requirements/     # PRDs
│   ├── design/          # Design specs
│   ├── decisions/       # ADRs
│   ├── phases/          # Phase markers
│   ├── handoffs/        # Handoff docs
│   ├── research/        # Discovery, research
│   └── existing-examples/ # Your existing content
├── scripts/             # Automation scripts
├── src/                 # Source code
├── tests/               # Tests
├── CLAUDE.md            # Project context
├── WORKFLOW.md          # Sign-off process
├── SESSION-RESUME.md    # Pickup guidance
├── MEMORY-SETUP.md      # Memory MCP guide
└── CHANGELOG.md
```

## Workflow

### Feature lifecycle

```
Idea → Backlog → PRD → Design → Dev → Review → Merge → Retro
```

See [WORKFLOW.md](WORKFLOW.md) for full sign-off process.

### Slash commands

| Command | Purpose |
|---------|---------|
| `/ask-context` | **Start here** — asks for project context |
| `/resume` | Resume from previous session |
| `/product-review` | Product evaluation |
| `/design-review` | Design evaluation |
| `/code-review` | Code review |
| `/create-prd` | New PRD |
| `/create-design-spec` | New design spec |
| `/create-adr` | New decision record |
| `/create-handoff` | Create handoff document |
| `/start-feature` | Begin feature |
| `/complete-feature` | Finish feature |
| `/log-to-obsidian` | Log to vault |
| `/retrospective` | Run retro |

### Scripts

```bash
./scripts/new-feature.sh [name]   # Set up new feature
./scripts/daily-standup.sh        # Generate standup
./scripts/sync-obsidian.sh        # Sync to vault
```

## Documentation

- [Discovery Report](docs/research/discovery-report.md)
- [MVP PRD](docs/requirements/mvp-prd.md)

## License

[Your license]

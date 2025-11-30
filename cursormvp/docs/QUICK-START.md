# Distill — Quick Reference

## Vision
Transform AI chat conversations into reusable, team-ready prompt templates with built-in coaching and privacy controls.

## Current Status
**Sprint 6** — UI/UX Improvements (3/6 items complete)

| Completed | Remaining |
|-----------|-----------|
| Left sidebar navigation | Firefox extension |
| Home page redesign | Billing (Stripe) |
| Stats API + tests | Performance optimization |

## Development Process

### Session Start
```bash
/resume                    # Load context automatically
# OR manually check:
git status && git branch
```

### Daily Commands
| Command | Purpose |
|---------|---------|
| `bun run dev` | Start all servers |
| `bun run test` | Run tests |
| `bun run lint` | Check code quality |

### Servers
- **Web:** localhost:3000
- **API:** localhost:3001
- **DB:** `docker-compose up -d`

### Slash Commands
| Command | When to Use |
|---------|-------------|
| `/resume` | Start of session |
| `/log` | Record progress |
| `/code-review` | Before PR |
| `/start-feature` | New feature |
| `/complete-feature` | Finish feature |

## Domain Model
```
Conversation → Prompt → Collection → Workspace
     ↓            ↓
  (capture)   (distill)
```

- **Conversation**: Raw AI chat capture
- **Prompt**: Reusable template with `{{variables}}`
- **Collection**: Folder of prompts
- **Workspace**: Team container
- **Privacy Mode**: `PROMPT_ONLY` | `FULL`

## Key Files
| File | Purpose |
|------|---------|
| `CLAUDE.md` | Full project context |
| `docs/logs/development-log.md` | Session history |
| `docs/logs/sprints/sprint-6.md` | Current sprint |

## Architecture
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Extension  │→ │   Web App   │→ │  API Server │
│  (Capture)  │  │  (Next.js)  │  │   (tRPC)    │
└─────────────┘  └─────────────┘  └─────────────┘
                                        ↓
                              ┌─────────────────┐
                              │   PostgreSQL    │
                              │ Redis │ Chroma  │
                              └─────────────────┘
```

## Git Workflow
```bash
feature/[ref]/description   # New feature
fix/[ref]/description       # Bug fix
```

Commits: `feat(scope):`, `fix(scope):`, `docs:`, `test:`

---
*Full details: See `CLAUDE.md`*

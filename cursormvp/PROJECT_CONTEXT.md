# Distill - Project Context

> This file maintains current project state, decisions, and context for Claude Code sessions.
> Updated: 2025-11-26

## Project Summary

**Distill** is a browser extension + AI web application that captures conversations from AI chat platforms (ChatGPT, Claude, Gemini, Copilot) and distills them into reusable, optimized prompts.

## Current State

### Implemented ✅
- [x] Monorepo structure with Bun workspaces
- [x] Browser extension scaffold (Manifest V3)
  - `manifest.json` configured for target platforms
  - Background service worker with message handling
  - Content script with conversation extraction framework
  - Platform detection (ChatGPT, Claude, Gemini, Copilot)
- [x] Web app package (Next.js 14+ scaffold)
- [x] API server package (Express/tRPC scaffold)
- [x] Shared types package with core domain types
- [x] Prisma schema with full data model
- [x] Docker Compose for local services
- [x] Kubernetes production manifests
- [x] Playwright E2E test configuration
- [x] Root configuration (tsconfig, biome, package.json)
- [x] Claude Code agents and commands

### In Progress 🔄
- [ ] Extension popup UI components
- [ ] Platform-specific conversation extractors
- [ ] API endpoint implementations

### Not Started ⏳
- [ ] Authentication flow (NextAuth.js)
- [ ] AI distillation service
- [ ] Vector embedding pipeline
- [ ] Semantic search functionality
- [ ] User dashboard
- [ ] Chrome Web Store deployment

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Package Manager | Bun | Speed, native TypeScript, workspace support |
| Linting | Biome | Single tool replacing ESLint + Prettier |
| Vector DB | ChromaDB | Self-hosted, easy local dev (Pinecone for prod option) |
| API Layer | tRPC | End-to-end type safety with React Query |
| State Management | Zustand | Lightweight, TypeScript-first |
| AI Provider | Multi (Anthropic primary) | Fallback strategy, cost optimization |

## Key File Locations

```
Configuration:
├── CLAUDE.md                 # Main project instructions
├── .claude/CLAUDE.md         # Same (Claude Code loads this)
├── PROJECT_CONTEXT.md        # This file - current state
├── STRUCTURE.md              # Detailed structure guide
├── package.json              # Root monorepo config
├── tsconfig.json             # TypeScript config
├── biome.json                # Linting config
├── docker-compose.yml        # Local services
└── playwright.config.ts      # E2E test config

Application Code:
├── app/packages/browser-extension/
│   ├── manifest.json
│   └── src/
│       ├── background/service-worker.ts
│       └── content/main.ts
├── app/packages/web-app/
├── app/packages/api/
│   └── prisma/schema.prisma
└── app/packages/shared-types/
    └── src/index.ts

Claude Code:
├── .claude/agents/           # Specialized agents
├── .claude/commands/         # Slash commands
└── .claude/settings.json     # Settings
```

## Environment Setup

### Prerequisites
- Node.js 20+
- Bun 1.1+
- Docker (for databases)

### Quick Start
```bash
./scripts/development/dev-setup.sh
# Or manually:
bun install
cp .env.example .env
docker-compose up -d postgres redis chromadb
bun run db:migrate
bun run dev
```

### Required Environment Variables
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
CHROMA_URL=http://localhost:8000
```

## Claude Code Usage

### Available Agents
- `/frontend` - React, TypeScript, extension UI
- `/platform-agent` - AI integration, backend APIs
- `/security` - Security audits, privacy compliance
- `/devops` - Infrastructure, deployment
- `/quality` - Testing, performance
- `/code-reviewer` - Code review, best practices
- `/tech-lead` - Architecture decisions

### Common Commands
- `/code-review` - Run comprehensive code review
- `/feature-dev` - Full feature development workflow
- `/github-issue` - Analyze and resolve issues
- `/security-audit` - Security vulnerability check

## Data Model Overview

```
User
 ├── Conversations (captured from AI chats)
 │    └── Prompts (distilled content)
 │         └── Embeddings (for semantic search)
 ├── Collections (organized prompt groups)
 ├── ApiKeys (for external integrations)
 └── AiUsageLogs (cost tracking)
```

## Ports & Services

| Service | Port | Purpose |
|---------|------|---------|
| Web App | 3000 | Next.js frontend |
| API | 3001 | Express backend |
| PostgreSQL | 5432 | Main database |
| Redis | 6379 | Cache & queues |
| ChromaDB | 8000 | Vector storage |

## Notes & Reminders

- Extension uses Shadow DOM for style isolation
- Content scripts detect platform via hostname matching
- AI provider selection based on task complexity (cost optimization)
- All message passing is type-safe via shared-types package

## Obsidian Reference

Project documentation also saved to Obsidian vault:
- `Projects/Distill/README.md`
- `Projects/Distill/Structure.md`
- `Projects/Distill/Quick Reference.md`
- `Projects/Distill/Development Log.md`

---

*This file is auto-loaded context for Claude Code sessions. Keep it updated as the project evolves.*

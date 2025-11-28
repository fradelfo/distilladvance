# Distill - Project Context

> This file maintains current project state, decisions, and context for Claude Code sessions.
> Updated: 2025-11-28

## Project Summary

**Distill** is a browser extension + AI web application that captures conversations from AI chat platforms (ChatGPT, Claude, Gemini, Copilot) and distills them into reusable, optimized prompts.

## Current State

### Sprint 1: Foundation ✅ COMPLETE
- [x] Monorepo structure with Bun workspaces
- [x] Browser extension scaffold (Manifest V3)
- [x] Content scripts for ChatGPT, Claude, Gemini, Copilot
- [x] Background service worker with message handling
- [x] Web app package (Next.js 14+)
- [x] API server (Express + tRPC)
- [x] Shared types package
- [x] Prisma schema + PostgreSQL connection
- [x] Docker Compose for local services
- [x] Authentication (NextAuth.js v5 + Google OAuth + Credentials)
- [x] User registration + login/signup pages
- [x] Protected route middleware

### Sprint 2: Core Loop ✅ COMPLETE
- [x] Extension popup UI (React + Vite + Tailwind)
- [x] Capture modal with conversation preview
- [x] Privacy mode selector (full/prompt-only)
- [x] Distillation service (Anthropic Claude)
- [x] Prompt library UI (`/prompts` + `/prompts/[id]`)
- [x] tRPC CRUD routers for prompts
- [x] Typed message passing system
- [x] Keyboard shortcut (Ctrl+Shift+D)

### Sprint 3: Team Features ✅ COMPLETE
- [x] Workspace creation & management (`/workspaces`)
- [x] Workspace invites & member roles
- [x] Collections/folders (`/collections`)
- [x] Run prompt flow with variable extraction
- [x] Onboarding wizard (`/onboarding`)
- [x] Privacy mode API integration
- [x] Conversation router with privacy modes

### Sprint 4: Advanced Features 🟡 IN PROGRESS
- [x] Vector embedding pipeline (OpenAI text-embedding-3-small)
- [x] Semantic search functionality (cosine similarity)
- [x] Production deployment configuration (Vercel + Railway)
- [x] GitHub Actions CI/CD pipeline
- [x] MCP integrations (GitHub + PostgreSQL)
- [ ] Prompt editor with rich formatting
- [ ] Coach feature (prompt improvement suggestions)
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
 ├── Conversations (captured from AI chats, with PrivacyMode)
 │    └── Prompts (distilled content)
 │         └── Embeddings (for semantic search)
 ├── Collections (organized prompt groups)
 ├── Workspaces (team containers)
 │    ├── Members (with roles: Owner, Admin, Member)
 │    ├── Invites (pending invitations)
 │    ├── Prompts (shared prompts)
 │    └── Collections (shared collections)
 ├── ApiKeys (for external integrations)
 └── AiUsageLogs (cost tracking)
```

## Ports & Services (Local Development)

| Service | Port | Purpose |
|---------|------|---------|
| Web App | 3000 | Next.js frontend |
| API | 3001 | Express backend |
| PostgreSQL | 5432 | Main database |
| Redis | 6379 | Cache & queues |
| ChromaDB | 8000 | Vector storage |

## Production Deployment

| Component | Platform | Config File |
|-----------|----------|-------------|
| Web App | Vercel | `app/packages/web-app/vercel.json` |
| API Server | Railway | `app/packages/api/railway.json` |
| Database | Railway PostgreSQL | (managed) |
| CI/CD | GitHub Actions | `.github/workflows/deploy-production.yml` |

### Deployment Flow
```
Push to main → CI (lint/test/build) → Deploy API (Railway) → Deploy Web (Vercel) → Verify
```

### Required GitHub Secrets
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `RAILWAY_TOKEN`
- `DATABASE_URL`, `NEXTAUTH_SECRET`, `API_SECRET`
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## Notes & Reminders

- Extension uses Shadow DOM for style isolation
- Content scripts detect platform via hostname matching
- AI provider selection based on task complexity (cost optimization)
- All message passing is type-safe via shared-types package

## Available Routes (12)

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/login` | Authentication |
| `/signup` | User registration |
| `/dashboard` | User home |
| `/prompts` | Prompt library |
| `/prompts/[id]` | Prompt detail & run |
| `/collections` | Collections list |
| `/collections/[id]` | Collection detail |
| `/workspaces` | Team workspaces |
| `/workspaces/[slug]` | Workspace detail |
| `/onboarding` | Welcome wizard |

## Obsidian Reference

Project documentation also saved to Obsidian vault:
- `Projects/DistillAdv/README.md`
- `Projects/DistillAdv/Development Log.md`
- `Projects/DistillAdv/Roadmap.md`

---

*This file is auto-loaded context for Claude Code sessions. Keep it updated as the project evolves.*

# CLAUDE.md — Distill

## Project overview

**Project:** Distill
**Description:** Browser extension + web app (SaaS) that captures AI chat conversations and distills them into reusable, coached prompt templates with team sharing and privacy controls
**Stage:** Development - Sprint 7 Active (Cross-Browser & Polish)
**Repository:** /Users/delf0/Desktop/distill2/cursormvp/

### Tech stack
- **Frontend:** React 18+, Next.js 14+, Tailwind CSS, Radix UI, Zustand
- **Backend:** Node.js 20+, Express.js, tRPC, Prisma ORM
- **Database:** PostgreSQL 15+, Redis (caching), ChromaDB (vectors)
- **Extension:** Manifest V3, TypeScript, Vite
- **Build:** Bun 1.1+, Biome (linting), Vitest, Playwright
- **Deployment:** Docker, Kubernetes, GitHub Actions

## Quick start

```bash
# Install dependencies
bun install

# Start databases
docker-compose up -d postgres redis chromadb

# Run migrations
bun run db:migrate

# Start all development servers
bun run dev

# Or individually:
bun run ext:dev    # Extension (hot reload)
bun run web:dev    # Web app (localhost:3000)
bun run api:dev    # API server (localhost:3001)
```

## Commands reference

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all development servers |
| `bun run build` | Production build all packages |
| `bun run test` | Run all tests |
| `bun run test:unit` | Unit tests only (Vitest) |
| `bun run test:e2e` | E2E tests (Playwright) |
| `bun run lint` | Run Biome linting |
| `bun run lint:fix` | Fix lint issues |
| `bun run type-check` | TypeScript checking |
| `bun run db:migrate` | Run Prisma migrations |
| `bun run db:studio` | Open Prisma Studio |

## Project context

### Problem being solved
Knowledge workers and teams don't have a simple, trusted way to:
- Capture the essence of successful AI chats
- Turn them into structured, reusable prompt templates
- Share templates across teams while respecting privacy constraints
- Learn how to improve their prompts over time

### Target users
1. **AI Champions / Enablement Leads** — Set up workspaces, curate team prompt libraries
2. **Knowledge Workers** — Capture good chats, search and run team prompts
3. **Agencies / Consultants** — Client-scoped prompt workspaces

### Success metrics
| Metric | Target | Current |
|--------|--------|---------|
| Activation (3+ prompts in 7 days) | 40% | - |
| Weekly prompt runs per user | 5+ | - |
| Day-30 workspace retention | 60% | - |
| Shared prompts used by 2+ people | 50% | - |

## Current implementation status

> **Current Sprint:** 7 - Cross-Browser & Polish
> **See:** `cursormvp/docs/logs/development-log.md` for detailed progress

### Sprint 1: Foundation ✅ COMPLETE
- [x] Monorepo structure with Bun workspaces
- [x] Browser extension scaffold (Manifest V3)
- [x] Content scripts for ChatGPT, Claude, Gemini, Copilot
- [x] Background service worker with message handling
- [x] Web app package scaffold (Next.js)
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
- [x] Workspace invites & member roles (Owner, Admin, Member)
- [x] Collections/folders (`/collections` + `/collections/[id]`)
- [x] Run prompt flow with {{variable}} extraction
- [x] Onboarding wizard (`/onboarding`)
- [x] Privacy mode API (PrivacyMode enum: PROMPT_ONLY, FULL)
- [x] Conversation router with privacy-aware data handling

### Sprint 4: Advanced Features ✅ COMPLETE
- [x] Vector embedding pipeline (OpenAI text-embedding-3-small)
- [x] Semantic search functionality (cosine similarity in PostgreSQL)
- [x] Production deployment config (Vercel + Railway)
- [x] GitHub Actions CI/CD pipeline
- [x] MCP integrations (GitHub + PostgreSQL)
- [x] Prompt editor with rich formatting (`/prompts/[id]/edit`)
- [x] Coach feature (prompt improvement suggestions)
- [x] Chrome Web Store preparation (packaging, store listing, privacy policy)

### Sprint 5: Analytics & Instrumentation ✅ COMPLETE
- [x] PostHog self-hosted analytics setup
- [x] Server-side event tracking service
- [x] Client-side analytics (web app + extension)
- [x] Analytics dashboard UI (`/analytics`)
- [x] All PRD tracking events implemented (10/10)

### Sprint 6: UI/UX Improvements ✅ COMPLETE
- [x] Left sidebar navigation (collapsible, mobile responsive)
- [x] Home page redesign (stats, activity feed, quick actions)
- [x] Stats API endpoint (`distill.stats`) with unit tests
- [x] Performance optimization (Redis caching, code splitting, DB indexes)
- [x] Billing & payments (Stripe integration, plan enforcement)

### Sprint 7: Cross-Browser & Polish 🔄 IN PROGRESS
- [x] Firefox extension support (Manifest V3, webextension-polyfill, min Firefox 121.0)
- [ ] Edge extension support (stretch goal - uses Chrome build)
- [ ] Cross-browser testing and validation
- [ ] Bug fixes and polish

## Code conventions

### General
- ES modules only (no CommonJS)
- Functional components with hooks
- Explicit return types for exports
- Files under 300 lines

### Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`

### Testing
- TDD: failing test → implement → verify
- Test files next to source: `*.test.ts`
- Integration tests preferred for UI

### Accessibility
- WCAG 2.1 AA minimum
- Keyboard accessible
- Semantic HTML
- ARIA labels where needed

## Role-based context

### Product role
**Trigger:** "As product manager..." or `/product-review`

Focus:
- User value and outcomes
- Success metrics
- Scope management
- MVP vs future

Reference: `/docs/requirements/`

### Design role
**Trigger:** "As designer..." or `/design-review`

Focus:
- User flows and states
- Accessibility (WCAG 2.1 AA)
- Edge cases and errors
- Design system consistency

Reference: `/docs/design/`

### Developer role
**Trigger:** "As developer..." or `/code-review`

Focus:
- Clean, tested code
- Performance
- Security
- Documentation

Reference: `/docs/design/`, `/docs/decisions/`

## Git workflow

### Branches
```
feature/[ref]/[description]
fix/[ref]/[description]
chore/[description]
```

### Commits (Conventional)
```
feat(scope): description
fix(scope): description
docs: description
refactor: description
test: description
chore: description
```

### PR process
1. Create feature branch from `main`
2. Implement with tests
3. Self-review or `/code-review`
4. Squash merge

## Do not touch

**Never modify directly:**
- `.env` files (use `.env.example`)
- Lock files (`bun.lockb`)
- Accepted ADRs (append only)
- Deployed migrations
- `manifest.json` permissions without security review

## Project-specific

### Key domain concepts
- **Conversation**: Raw captured AI chat from extension
- **Prompt**: Distilled, reusable template with variables
- **Collection**: Organized group of prompts (folders)
- **Workspace**: Team container with shared prompts
- **Privacy Mode**: Prompt-only vs Full chat storage

### External dependencies
- OpenAI API (GPT-4) — distillation, embeddings
- Anthropic API (Claude) — primary AI provider
- ChromaDB — vector storage for semantic search

### Known limitations
- Extension only captures visible conversation (no API access)
- Chrome and Firefox supported; Edge uses Chrome build (untested)
- No SSO in MVP

### Open questions
- [ ] Exact distillation prompt engineering
- [x] Coach suggestions: LLM-based or heuristic? (implemented: LLM-based with Anthropic Claude)
- [x] Variable extraction algorithm (implemented: `{{variable}}` syntax)

### Available Routes (15)

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/login`, `/signup` | Authentication |
| `/dashboard` | User home |
| `/prompts`, `/prompts/[id]` | Prompt library & detail |
| `/prompts/[id]/edit` | Prompt editor |
| `/collections`, `/collections/[id]` | Collections & detail |
| `/workspaces`, `/workspaces/[slug]` | Team workspaces |
| `/onboarding` | Welcome wizard |
| `/privacy` | Privacy policy |
| `/analytics` | Analytics dashboard |

---

## Documentation (Local)

**Path:** `cursormvp/docs/logs/`

| Document | Path |
|----------|------|
| Development Log | `cursormvp/docs/logs/development-log.md` |
| Session Resume | `cursormvp/docs/logs/session-start.md` |
| Roadmap | `cursormvp/docs/logs/roadmap.md` |
| Sprint Details | `cursormvp/docs/logs/sprints/sprint-[N].md` |

### Slash Commands

| Command | Purpose |
|---------|---------|
| `/resume` | Load context from local docs |
| `/log` | Append progress to development-log.md |
| `/sync-to-obsidian` | Bulk sync to Obsidian vault |

### Obsidian Sync (Optional)
Obsidian MCP remains available for manual use via `/sync-to-obsidian`.
Vault path: `Projects/DistillAdv/`

---

## Session start checklist

When starting a new session:
1. Run `/resume` for automatic context loading
2. Or manually check:
   - `git branch --show-current` + `git status`
   - `cursormvp/docs/logs/development-log.md` for last session
   - `cursormvp/docs/logs/sprints/` for current sprint status
   - `docs/phases/` for active phases

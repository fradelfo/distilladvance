# CLAUDE.md — Distill

## Project overview

**Project:** Distill
**Description:** Browser extension + web app (SaaS) that captures AI chat conversations and distills them into reusable, coached prompt templates with team sharing and privacy controls
**Stage:** Post-MVP scaffold, pre-implementation
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

### Implemented
- [x] Monorepo structure with Bun workspaces
- [x] Browser extension scaffold (Manifest V3)
- [x] Content scripts for ChatGPT, Claude, Gemini, Copilot
- [x] Background service worker with message handling
- [x] Web app package scaffold (Next.js)
- [x] API server package scaffold (Express/tRPC)
- [x] Shared types package
- [x] Prisma schema (User, Conversation, Prompt, Collection, Embeddings)
- [x] Docker Compose for local services
- [x] Kubernetes manifests
- [x] Test configuration (Vitest, Playwright)

### In progress
- [ ] Extension popup UI components
- [ ] Platform-specific conversation extractors

### Not started
- [ ] Authentication flow (NextAuth.js)
- [ ] AI distillation service
- [ ] Vector embedding pipeline
- [ ] Semantic search
- [ ] Prompt coach feature
- [ ] User dashboard
- [ ] Workspace/team features
- [ ] Privacy mode implementation

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
- Chrome-first (Firefox/Edge later)
- No SSO in MVP

### Open questions
- [ ] Exact distillation prompt engineering
- [ ] Coach suggestions: LLM-based or heuristic?
- [ ] Variable extraction algorithm

---

## Session start checklist

When starting a new session:
1. Check current branch: `git branch --show-current`
2. Check status: `git status`
3. Review open phase: `docs/phases/`
4. Check PROJECT_CONTEXT.md in cursormvp/ for latest state
5. Check Obsidian daily log for blockers

# Distill Project Structure Guide

This document explains the project structure and how to work with different components of the Distill browser extension and AI web application.

## Quick Reference

```
distill/
├── app/                          # Application source code
│   └── packages/                 # Monorepo packages
│       ├── browser-extension/    # Manifest V3 browser extension
│       ├── web-app/              # Next.js frontend
│       ├── api/                  # Express/tRPC backend
│       └── shared-types/         # Shared TypeScript definitions
├── .claude/                      # Claude Code configuration
│   ├── agents/                   # Specialized development agents
│   ├── commands/                 # Custom slash commands
│   └── settings.json             # Claude Code settings
├── claude/                       # Additional agent configurations
├── tests/                        # Test suites
├── docs/                         # Documentation
├── k8s/                          # Kubernetes manifests
├── scripts/                      # Automation scripts
└── work/                         # Work logs and notes
```

## Application Packages

### Browser Extension (`app/packages/browser-extension/`)

The browser extension captures conversations from AI chat platforms.

```
browser-extension/
├── src/
│   ├── background/           # Service worker (MV3)
│   │   └── service-worker.ts # Message handling, context menus
│   ├── content/              # Content scripts injected into pages
│   │   └── main.ts           # Conversation extraction
│   ├── popup/                # Extension popup UI
│   ├── options/              # Extension settings page
│   └── shared/               # Shared utilities
├── manifest.json             # Extension manifest (MV3)
├── package.json              # Package configuration
└── dist/                     # Built extension files
```

**Key Commands:**
```bash
bun run ext:dev        # Development with hot reload
bun run ext:build      # Production build
bun run ext:preview    # Load in browser for testing
bun run ext:package    # Package for store submission
```

**Supported Platforms:**
- ChatGPT (chat.openai.com, chatgpt.com)
- Claude (claude.ai)
- Gemini (gemini.google.com)
- Microsoft Copilot (copilot.microsoft.com)

### Web Application (`app/packages/web-app/`)

The React/Next.js frontend for managing distilled prompts.

```
web-app/
├── src/
│   ├── components/           # Reusable UI components
│   ├── pages/                # Next.js pages/routes
│   ├── hooks/                # Custom React hooks
│   ├── store/                # State management (Zustand)
│   ├── utils/                # Utility functions
│   └── lib/                  # Library configurations
├── public/                   # Static assets
├── package.json              # Package configuration
└── next.config.js            # Next.js configuration
```

**Key Commands:**
```bash
bun run web:dev        # Development server (port 3000)
bun run web:build      # Production build
bun run web:analyze    # Bundle analysis
```

### API Server (`app/packages/api/`)

Node.js backend with AI/LLM integration.

```
api/
├── src/
│   ├── routes/               # API endpoints
│   ├── services/             # Business logic
│   ├── models/               # Data models
│   ├── middleware/           # Express middleware
│   ├── ai/                   # AI/LLM integration
│   │   ├── providers/        # OpenAI, Anthropic clients
│   │   ├── prompts/          # Prompt templates
│   │   └── embeddings/       # Vector embedding logic
│   └── utils/                # Utility functions
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Database migrations
│   └── seed.ts               # Database seeding
├── package.json              # Package configuration
└── tests/                    # API tests
```

**Key Commands:**
```bash
bun run api:dev        # Development server (port 3001)
bun run api:build      # Production build
bun run db:migrate     # Run database migrations
bun run db:seed        # Seed development data
bun run db:studio      # Open Prisma Studio
```

### Shared Types (`app/packages/shared-types/`)

TypeScript definitions shared across all packages.

```
shared-types/
├── src/
│   └── index.ts              # All shared type definitions
├── package.json              # Package configuration
└── dist/                     # Compiled types
```

**Usage in other packages:**
```typescript
import type { Conversation, Prompt, ExtensionMessage } from '@distill/shared-types';
```

## Claude Code Integration

### Agent System (`.claude/agents/` and `claude/agents/`)

Specialized agents for different development tasks:

| Agent | Purpose |
|-------|---------|
| `frontend/` | React/TypeScript, extension UI development |
| `platform-agent/` | AI/LLM integration, backend services |
| `security/` | Security audits, privacy compliance |
| `devops/` | Infrastructure, deployment automation |
| `quality/` | Testing, performance optimization |
| `code-reviewer/` | Code quality, security scanning |
| `tech-lead/` | Architecture decisions, coordination |

**Using Agents:**
```bash
# In Claude Code session
/frontend       # Activate frontend expert
/security-audit # Run security analysis
/code-review    # Comprehensive code review
```

### Custom Commands (`.claude/commands/`)

Available slash commands for common workflows:

```bash
/feature-dev       # Full feature development workflow
/github-issue      # Analyze and resolve GitHub issues
/extension-deploy  # Browser store deployment
/database-migrate  # Safe database migrations
/api-test          # API testing and validation
```

## Testing Structure

```
tests/
├── e2e/                      # End-to-end Playwright tests
│   ├── browser-extension/    # Extension-specific E2E tests
│   └── web-app/              # Web application E2E tests
├── integration/              # Cross-system integration tests
├── performance/              # Load and performance tests
├── security/                 # Security scanning tests
├── unit/                     # Unit tests (via Vitest)
│   └── ai/                   # AI functionality tests
├── config/                   # Test configurations
│   ├── vitest.config.ts      # Unit test config
│   └── vitest.ai.config.ts   # AI test config
└── utils/                    # Test utilities and helpers
```

**Key Commands:**
```bash
bun run test           # Run all tests
bun run test:unit      # Unit tests only
bun run test:e2e       # E2E tests with Playwright
bun run test:security  # Security scanning
bun run test:ai        # AI functionality tests
```

## Infrastructure

### Docker Compose (`docker-compose.yml`)

Local development services:
- PostgreSQL (port 5432)
- Redis (port 6379)
- ChromaDB vector database (port 8000)

```bash
docker-compose up -d postgres redis chromadb  # Start services
docker-compose down                            # Stop services
docker-compose logs -f                         # View logs
```

### Kubernetes (`k8s/`)

Deployment manifests for different environments:

```
k8s/
├── development/              # Local K8s development
├── staging/                  # Staging environment
└── production/               # Production deployment
    ├── kustomization.yaml    # Kustomize configuration
    ├── namespace.yaml        # Namespace definition
    ├── deployment-*.yaml     # Deployment specs
    ├── service-*.yaml        # Service definitions
    └── ingress.yaml          # Ingress configuration
```

## Getting Started

### 1. Initial Setup

```bash
# Clone and setup
cd distill
./scripts/development/dev-setup.sh

# Or manual setup:
bun install
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start Development Services

```bash
# Start databases
docker-compose up -d postgres redis chromadb

# Run migrations
bun run db:migrate

# Start all development servers
bun run dev

# Or start individually:
bun run ext:dev    # Extension (hot reload)
bun run web:dev    # Web app (localhost:3000)
bun run api:dev    # API server (localhost:3001)
```

### 3. Load Extension in Browser

**Chrome:**
1. Navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `app/packages/browser-extension/dist`

**Firefox:**
```bash
bun run ext:preview:firefox
```

### 4. Development Workflow

1. **Make Changes**: Edit files in `app/packages/`
2. **Type Check**: `bun run type-check`
3. **Test**: `bun run test`
4. **Lint**: `bun run lint:fix`
5. **Review**: Use `/code-review` in Claude Code

## Environment Variables

Key environment variables (see `.env.example`):

```bash
# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER_PRIMARY=anthropic

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Vector Database
VECTOR_DB_PROVIDER=chroma
CHROMA_URL=http://localhost:8000

# App URLs
WEB_URL=http://localhost:3000
API_URL=http://localhost:3001
```

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ConversationCard.tsx` |
| Hooks | camelCase with `use` prefix | `useConversations.ts` |
| Utils | camelCase | `formatDate.ts` |
| Types | PascalCase | `Conversation.ts` |
| Tests | `*.test.ts` or `*.spec.ts` | `api.test.ts` |
| Config | lowercase with dots | `vitest.config.ts` |

## Common Tasks

### Adding a New AI Chat Platform

1. Update `manifest.json` with new URL patterns
2. Add extraction logic in `content/main.ts`
3. Test with `/quality` agent
4. Update documentation

### Creating a New API Endpoint

1. Add route in `api/src/routes/`
2. Implement service in `api/src/services/`
3. Add types to `shared-types/`
4. Write tests
5. Run `/code-review`

### Adding UI Components

1. Create component in `web-app/src/components/`
2. Add Storybook story (if applicable)
3. Write unit tests
4. Use `/frontend` agent for review

## Troubleshooting

**Extension not loading?**
- Check `chrome://extensions` for errors
- Ensure `dist/` folder exists after build
- Verify manifest.json syntax

**Database connection issues?**
- Ensure Docker services are running
- Check `DATABASE_URL` in `.env`
- Run `bun run db:migrate`

**AI service errors?**
- Verify API keys in `.env`
- Check rate limits
- Use `/ai-optimize` for diagnostics

---

For more detailed documentation, see the `docs/` directory or use the Claude Code `/help` command.

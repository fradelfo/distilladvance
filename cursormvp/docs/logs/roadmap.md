# Distill MVP Roadmap

> Development plan from research to launch

## Phase Overview

```
Research --> PRD --> Design --> Development --> Alpha --> Beta --> Launch
   Done      Done     Done        Active
```

---

## Development Sprints

### Sprint 1: Foundation - COMPLETE
- [x] Authentication (NextAuth.js + Google OAuth)
- [x] API Server (Express + tRPC)
- [x] Database (Prisma + PostgreSQL)
- [x] Web App Shell

### Sprint 2: Core Loop - COMPLETE
- [x] Extension popup UI (capture modal)
- [x] Distillation service (Anthropic Claude)
- [x] Prompt library (list, search, detail)
- [x] Basic prompt storage

### Sprint 3: Team Features - COMPLETE
- [x] Workspace creation & invites
- [x] Onboarding flow
- [x] Run prompt flow
- [x] Privacy mode implementation
- [x] Collections/folders

### Sprint 4: Advanced Features - COMPLETE
- [x] Semantic search
- [x] Production deployment config
- [x] Prompt editor
- [x] Coach feature
- [x] Chrome Web Store deployment

### Sprint 5: Analytics & Instrumentation - COMPLETE
- [x] PostHog self-hosted setup
- [x] Event tracking (all PRD events)
- [x] Analytics dashboard UI
- [x] Extension tracking
- [x] Activation funnel visualization

### Sprint 6: UI/UX Improvements - IN PROGRESS
- [x] Left sidebar navigation (collapsible, mobile responsive)
- [x] Home page redesign (stats, activity feed, quick actions)
- [x] Stats API endpoint with tests
- [ ] Firefox extension support
- [ ] Billing & payments (Stripe)
- [ ] Performance optimization

---

## Success Metrics

| Metric | Alpha | Beta | Launch |
|--------|-------|------|--------|
| Activation (3+ prompts/7 days) | 25% | 40% | 50% |
| Weekly runs/user | 3 | 5 | 7 |
| D30 retention | 35% | 60% | 70% |
| NPS | 25 | 40 | 50 |

---

## Key Decisions

| Decision | Choice |
|----------|--------|
| Auth provider | NextAuth.js + Google OAuth |
| AI provider | Anthropic Claude |
| Privacy modes | Prompt-only & Full chat |
| Platform priority | Chrome first |
| Variable syntax | `{{variable}}` |

---

## Lessons Learned

### Sprint 5: Analytics
- **Timing:** Consider if infrastructure features should wait until user base exists
- **Complexity:** Self-hosted solutions add operational burden - evaluate cloud alternatives first
- **Priority:** Admin-only features (dashboards) serve ~10% of users - weigh against user-facing features
- **Future:** Can migrate to PostHog Cloud initially, self-host when scale justifies cost

---

*Last updated: 2025-11-29*

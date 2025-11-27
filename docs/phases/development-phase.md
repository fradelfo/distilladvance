# Phase: Development - Distill MVP

**Status:** In Progress
**Started:** 2025-11-27
**Completed:** -
**Branch:** `main` (feature branches to be created)

---

## Objectives

### Sprint 1: Foundation (COMPLETE)
- [x] Authentication system (NextAuth.js + Google OAuth)
- [x] API server foundation (Express + tRPC)
- [x] Database migrations
- [x] Web app shell

### Sprint 2: Core Loop (COMPLETE)
- [x] Extension popup UI (capture modal)
- [x] Distillation service
- [x] Prompt library (list, search, detail)

### Sprint 3: Team Features
- [ ] Workspace creation & invites
- [ ] Onboarding flow
- [ ] Run prompt flow

### Sprint 4: Polish
- [ ] Prompt editor
- [ ] Coach feature
- [ ] Collections/folders

---

## Quality Gates

### Product
- [x] PRD approved (`docs/requirements/mvp-prd.md` v0.2)
- [x] Success metrics defined (activation 40%, retention 60%)

### Design
- [x] All P0 specs complete (5 design specs)
- [x] Accessibility reviewed (WCAG 2.1 AA)
- [x] Design review passed (4.2/5)

### Dev
- [ ] Tests pass
- [ ] Code reviewed
- [ ] No TS errors
- [ ] Lint clean

### Release
- [ ] CHANGELOG updated
- [ ] PR merged
- [ ] Extension submitted to Chrome Web Store

---

## Progress

### 2025-11-27
- Created development phase marker
- Created Obsidian project `Projects/DistillAdv/`
- Completed project assessment and planning
- Confirmed Sprint 1 approach: Foundation First
- **Sprint 1 COMPLETE**: Auth, API server, database, web shell
- **Sprint 2 COMPLETE**: Extension popup, distillation service, prompt library

---

## Blockers

| Blocker | Owner | Status |
|---------|-------|--------|
| None | - | - |

---

## Decisions

| Decision | Date | ADR |
|----------|------|-----|
| Auth: NextAuth.js + Google OAuth | 2025-11-27 | `docs/decisions/0001-authentication-strategy-nextauth-google-oauth.md` |
| Sprint approach: Foundation First | 2025-11-27 | - |

---

## Open Questions (Non-blocking)

| Question | Options | Decision Due |
|----------|---------|--------------|
| Coach implementation | Heuristics / LLM / Hybrid | Before beta |
| Solo user pricing | Teams only / Free solo / Paid solo | Before beta |
| Variable extraction | LLM / Pattern matching / Hybrid | Sprint 2 |

---

## Links

- **PRD:** `docs/requirements/mvp-prd.md`
- **Design Specs:** `docs/design/`
- **Research:** `docs/research/discovery-report.md`
- **Obsidian:** `Projects/DistillAdv/`

---

## Sprint 1 Acceptance Criteria

- [ ] User can sign up with email and password
- [ ] User can sign in with Google OAuth
- [ ] Session persists across browser restarts
- [ ] Protected pages redirect to login
- [ ] API endpoints require authentication
- [ ] Health check endpoint returns 200

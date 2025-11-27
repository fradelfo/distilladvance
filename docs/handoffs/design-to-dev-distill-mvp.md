# Handoff: Design to Dev - Distill MVP

**Feature:** Distill MVP (Full Product)
**Date:** 2025-11-27
**PRD:** `docs/requirements/mvp-prd.md` v0.2
**Design Specs:** `docs/design/*.md` (5 specs)

---

## Summary

Distill MVP consists of a Chrome browser extension and Next.js web application that together allow users to:
1. Capture AI conversations from ChatGPT, Claude, Gemini, and Copilot
2. Auto-distill conversations into reusable prompt templates
3. Organize prompts in a searchable team library
4. Share prompts within workspaces with privacy controls
5. Get coaching suggestions to improve prompts

---

## Design Specs Reference

| Spec | Priority | Components | Location |
|------|----------|------------|----------|
| Capture Flow | P0 | 8 | `capture-flow-design-spec.md` |
| Web App Library | P0 | 8 | `web-app-library-design-spec.md` |
| Onboarding Flow | P1 | 8 | `onboarding-flow-design-spec.md` |
| Prompt Editor & Coach | P0/P1 | 7 | `prompt-editor-coach-design-spec.md` |
| Settings & Privacy | P0 | 7 | `settings-privacy-design-spec.md` |

**Total:** 38 components specified

---

## Sprint 1 Acceptance Criteria (Foundation)

### Authentication
- [ ] User can sign up with email (min 8 char password)
- [ ] Email verification sent within 30 seconds
- [ ] User can sign in with Google OAuth
- [ ] Session persists with 7-day JWT expiry
- [ ] Password reset flow functional
- [ ] Rate limiting: max 5 failed attempts per 15 minutes

### API Server
- [ ] Express app with tRPC router running on port 3001
- [ ] Health check endpoint returns 200
- [ ] Prisma client connected to PostgreSQL
- [ ] Auth middleware validates JWT tokens
- [ ] Error responses follow consistent format

### Web App Shell
- [ ] Next.js app running on port 3000
- [ ] Layout with header and navigation
- [ ] Login page (`/login`)
- [ ] Signup page (`/signup`)
- [ ] Protected dashboard route (`/dashboard`)
- [ ] Redirect unauthenticated users to login

---

## Implementation Guide

### Components by Sprint

#### Sprint 1: Foundation
| Component | Package | Priority |
|-----------|---------|----------|
| AuthProvider | web-app | P0 |
| LoginForm | web-app | P0 |
| SignupForm | web-app | P0 |
| AppLayout | web-app | P0 |
| Header | web-app | P0 |
| ProtectedRoute | web-app | P0 |

#### Sprint 2: Core Loop
| Component | Package | Priority |
|-----------|---------|----------|
| CaptureModal | browser-extension | P0 |
| ConversationPreview | browser-extension | P0 |
| PrivacyModeSelector | browser-extension | P0 |
| ProcessingState | browser-extension | P0 |
| PromptCard | web-app | P0 |
| PromptList | web-app | P0 |
| SearchBar | web-app | P0 |
| FilterBar | web-app | P0 |

#### Sprint 3: Team Features
| Component | Package | Priority |
|-----------|---------|----------|
| OnboardingWizard | web-app | P1 |
| WorkspaceSetup | web-app | P1 |
| InviteTeamModal | web-app | P1 |
| RunPromptModal | web-app | P1 |

#### Sprint 4: Polish
| Component | Package | Priority |
|-----------|---------|----------|
| PromptEditor | web-app | P1 |
| VariablesPanel | web-app | P1 |
| CoachPanel | web-app | P2 |
| SuggestionCard | web-app | P2 |
| CollectionsSidebar | web-app | P2 |

### API Endpoints

| Endpoint | Method | Priority | Description |
|----------|--------|----------|-------------|
| `/api/health` | GET | P0 | Health check |
| `/api/auth/*` | * | P0 | NextAuth.js routes |
| `/api/trpc/user.*` | * | P0 | User CRUD |
| `/api/trpc/conversation.*` | * | P0 | Conversation CRUD |
| `/api/trpc/prompt.*` | * | P0 | Prompt CRUD |
| `/api/trpc/collection.*` | * | P1 | Collection CRUD |
| `/api/trpc/workspace.*` | * | P1 | Workspace management |
| `/api/trpc/distill.*` | * | P0 | Distillation service |
| `/api/trpc/search.*` | * | P1 | Semantic search |
| `/api/trpc/coach.*` | * | P2 | Coach suggestions |

---

## Edge Cases (Priority)

| Scenario | Behaviour | Sprint |
|----------|-----------|--------|
| Invalid email format | Show validation error inline | 1 |
| Password too short | Show "Min 8 characters" | 1 |
| Google OAuth cancelled | Return to login, show message | 1 |
| Session expired | Redirect to login with message | 1 |
| Network error on API | Show retry button, offline indicator | 2 |
| Empty conversation | Show error: "No messages found" | 2 |
| Distillation timeout | Allow retry after 10s | 2 |
| Unsupported AI platform | Grey icon, tooltip explains | 2 |
| Workspace invite expired | Show "Link expired" with new invite option | 3 |

---

## Accessibility Requirements

All components must meet WCAG 2.1 AA:

- [ ] Color contrast >= 4.5:1 for text
- [ ] Touch targets >= 44x44px
- [ ] Visible focus indicators
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader labels (aria-label where needed)
- [ ] Respect `prefers-reduced-motion`
- [ ] Error messages announced to screen readers

---

## Test Scenarios

### Authentication
- Sign up with valid email/password succeeds
- Sign up with existing email shows error
- Login with correct credentials succeeds
- Login with wrong password shows error
- Google OAuth flow completes successfully
- Password reset email is received
- Session persists after browser restart
- Logout clears session

### API
- Authenticated requests succeed
- Unauthenticated requests return 401
- Invalid tokens return 403
- Rate limiting blocks after 5 failures

---

## Design Tokens (Action Items)

From design review, address before Sprint 2:

| Item | Priority | Action |
|------|----------|--------|
| Color naming | P1 | Unify `gray` vs `neutral` tokens |
| Offline states | P1 | Add stale data indicators |
| Dark mode | P3 | Defer to post-MVP |

---

## Technical Constraints

- Extension popup max width: 400px
- Extension size limit: 500KB
- API response time target: <500ms (P95)
- Distillation timeout: 10 seconds
- Max conversation length: 5000 tokens
- Max prompts per workspace: 1000

---

## Questions Resolved

| Question | Decision |
|----------|----------|
| Google OAuth in MVP? | Yes - reduces friction |
| Session storage? | JWT with 7-day expiry, refresh tokens |
| Password requirements? | Min 8 characters |

## Questions Open (Non-blocking)

| Question | Owner | Decision Due |
|----------|-------|--------------|
| Coach: LLM vs heuristics | Product | Before beta |
| Variable extraction algorithm | Dev | Sprint 2 |

---

## Checklist

- [x] PRD approved
- [x] All P0 design specs complete
- [x] Component states documented
- [x] Edge cases identified (54 total)
- [x] Accessibility requirements specified
- [x] Design review passed (4.2/5)
- [x] Phase marker created
- [x] Obsidian project created

---

**Ready for Development**

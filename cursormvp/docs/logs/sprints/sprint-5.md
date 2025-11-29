# Sprint 5: Analytics & Instrumentation

**Status:** COMPLETE
**Started:** 2025-11-28
**Completed:** 2025-11-28
**Focus:** Event tracking, dashboards, activation funnels

## Objectives

### Analytics Foundation
- [x] Choose analytics provider: PostHog Self-hosted
- [x] Create analytics service abstraction
- [x] Define TypeScript types for all events
- [x] Set up provider integration

### Event Tracking (PRD Section 7.1)
- [x] `user_signed_up` - source, referrer
- [x] `workspace_created` - privacy_default
- [x] `extension_installed` - browser, version
- [x] `chat_captured` - platform, privacy_mode, token_count
- [x] `prompt_created` - source (capture/manual), has_variables
- [x] `prompt_run` - platform, variable_count
- [x] `prompt_edited` - edit_type, time_since_creation
- [x] `coach_used` - suggestions_shown, suggestions_applied
- [x] `member_invited` - count
- [x] `search_performed` - query_length, results_count

### Dashboard UI
- [x] `/analytics` route
- [x] Activation funnel visualization
- [x] Engagement metrics (DAU/WAU, runs/user)
- [x] Team health metrics
- [x] Feature adoption charts (privacy mode, platform distribution)

### Extension Tracking
- [x] Track extension install
- [x] Track capture events from extension
- [x] Track keyboard shortcuts and context menu usage

## Architecture Decision

**Chosen:** PostHog Self-hosted

**Rationale:**
- Open source, self-hostable for data control
- Built-in funnels, retention analysis
- Feature flags for future use
- GDPR compliant
- Free tier sufficient for MVP

## Implementation Summary

### Files Created
- `app/packages/api/src/services/analytics.ts` - Server-side tracking & metrics
- `app/packages/api/src/trpc/routers/analytics.ts` - tRPC endpoints
- `app/packages/web-app/src/lib/analytics.ts` - Client-side PostHog
- `app/packages/web-app/src/app/analytics/page.tsx` - Dashboard page
- `app/packages/web-app/src/app/analytics/AnalyticsDashboard.tsx` - Dashboard UI
- `app/packages/browser-extension/src/shared/analytics.ts` - Extension tracking
- `app/packages/shared-types/src/index.ts` - Analytics types (added)

### Files Modified
- `docker-compose.yml` - Added PostHog service
- `app/packages/api/src/lib/env.ts` - Added PostHog config
- `app/packages/api/src/trpc/router.ts` - Added analytics router
- `app/packages/web-app/src/lib/providers.tsx` - Added analytics provider
- `app/packages/browser-extension/src/background/service-worker.ts` - Added tracking

### Build Status
- Web app: 15 routes (new `/analytics` route)
- All type checks passing

## Success Criteria

| Metric | Target | Status |
|--------|--------|--------|
| All PRD events tracked | 10/10 | Done |
| Dashboard loads <2s | Yes | Done |
| No PII in analytics | Verified | Done |
| Extension tracking works | Yes | Done |

---

## Retrospective Action Items (2025-11-29)

### Completed

**1. Fixed shared-types Package Resolution**
- Updated `api/tsconfig.json` with path mapping
- Updated `web-app/tsconfig.json` with path mapping
- Fixed root `tsconfig.json` path alias
- Changed `shared-types/package.json` to point to src instead of dist

**2. Added Comprehensive Analytics Tests**
| Test File | Tests |
|-----------|-------|
| `api/src/services/analytics.test.ts` | 31 |
| `web-app/src/lib/analytics.test.ts` | 17 |
| `api/src/trpc/routers/analytics.test.ts` | 24 |
| **Total** | **72** |

Helper: `tests/utils/analytics-test-helpers.ts`

**3. PostHog Self-Hosted Documentation**
Created `docs/setup/posthog-self-hosted.md` with:
- Docker Compose and Helm chart deployment
- Security configuration (network policies, SSL/TLS, CORS)
- Data retention policies
- Monitoring (Prometheus metrics)
- Backup & recovery procedures
- Scaling guidelines and cost estimation
- Troubleshooting guide

### Verification
- 78 unit tests passing
- Build passes (17 routes)

---

## Lessons Learned

### What Went Well
- Clean implementation with 72 tests
- PostHog abstraction allows easy provider switch
- Dashboard provides immediate visibility for admins

### What to Reconsider
| Observation | Future Action |
|-------------|---------------|
| Built analytics before users exist | Wait for user data before building dashboards |
| Self-hosted = operational burden | Start with PostHog Cloud free tier (1M events/mo) |
| Dashboard serves admins only (~10%) | Prioritize user-facing features first |
| 72 tests but limited integration coverage | Add E2E tests for critical paths |

### Deferred Items
- [ ] Data export (CSV) for admins
- [ ] Period comparison (this week vs last)
- [ ] Alerting on metric drops
- [ ] Feature flag rollouts

---

*Sprint complete - 2025-11-28*
*Retrospective items complete - 2025-11-29*
*Lessons learned documented - 2025-11-29*

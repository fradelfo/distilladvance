# Handoff: Sprint 5 Analytics Implementation

**Feature:** Analytics & Instrumentation
**Date:** 2025-11-29
**PRD:** `docs/requirements/mvp-prd.md` (Section 7)
**Design:** N/A (infrastructure feature)

## Summary

Sprint 5 implemented a complete analytics pipeline using self-hosted PostHog. All 10 PRD-defined tracking events are now captured across the web app and browser extension. An analytics dashboard was added to the web app for viewing metrics.

## Acceptance criteria

1. [x] All 10 PRD tracking events implemented
2. [x] Server-side event tracking for sensitive operations
3. [x] Client-side tracking for web app interactions
4. [x] Extension tracking for capture events
5. [x] Analytics dashboard UI at `/analytics`
6. [x] Unit tests for analytics service (72+ tests)
7. [x] No PII in event properties
8. [x] Events fire reliably without blocking UI

## Implementation

### Components

| Component | Action | Location |
|-----------|--------|----------|
| AnalyticsService | Created | `api/src/services/analytics.ts` |
| PostHog Provider | Added | `web-app/src/providers/posthog.tsx` |
| Analytics Dashboard | Created | `web-app/src/app/analytics/page.tsx` |
| Extension Analytics | Added | `browser-extension/src/analytics.ts` |

### APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `distill.stats` | GET | Aggregate stats for dashboard |

### Events

| Event | Trigger | Properties |
|-------|---------|------------|
| `user_signed_up` | Registration complete | source, referrer |
| `workspace_created` | New workspace saved | privacy_default |
| `extension_installed` | Extension first load | browser, version |
| `chat_captured` | Capture complete | platform, privacy_mode, token_count |
| `prompt_created` | Prompt saved | source, has_variables |
| `prompt_run` | Run prompt clicked | platform, variable_count |
| `prompt_edited` | Edit saved | edit_type, time_since_creation |
| `coach_used` | Coach suggestions viewed | suggestions_shown, suggestions_applied |
| `member_invited` | Invite sent | count |
| `search_performed` | Search submitted | query_length, results_count |

## Edge cases

| Scenario | Behaviour |
|----------|-----------|
| PostHog unavailable | Events queued, logged to console, no user impact |
| Extension offline | Events stored locally, sent on reconnect |
| Rate limiting | Batch events, send max 100/minute |
| Invalid properties | Sanitize, log warning, send partial event |

## Accessibility

- [x] Keyboard: Dashboard fully navigable
- [x] Screen reader: Charts have text alternatives
- [x] Focus: Clear focus states on all controls

## Test scenarios

- Analytics service unit tests (72+ passing)
- Mock PostHog client for isolation
- Event property validation
- Error handling for network failures
- Batch processing verification

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Web App         │    │ API Server       │    │ PostHog         │
│ Client Events   │───►│ AnalyticsService │───►│ Self-Hosted     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                      │
         │                      │
┌─────────────────┐             │
│ Extension       │─────────────┘
│ Capture Events  │
└─────────────────┘
```

## Questions (Resolved)

- [x] Self-hosted vs cloud? → Self-hosted for privacy
- [x] Server-side vs client-side? → Hybrid (sensitive ops server-side)
- [x] Which events are critical path? → All 10 PRD events

## Timeline

| Milestone | Date | Status |
|-----------|------|--------|
| PostHog setup | 2025-11-29 | Complete |
| Server-side service | 2025-11-29 | Complete |
| Client-side integration | 2025-11-29 | Complete |
| Extension integration | 2025-11-29 | Complete |
| Dashboard UI | 2025-11-29 | Complete |
| Unit tests | 2025-11-29 | Complete (72+ tests) |

## Checklist

- [x] Spec complete
- [x] All events documented
- [x] Privacy reviewed (no PII in events)
- [x] Tests passing
- [x] ADR documented (`docs/decisions/0003-analytics-posthog.md`)

## Related Documents

- ADR: `docs/decisions/0003-analytics-posthog.md`
- PRD Section 7: `docs/requirements/mvp-prd.md`
- Development phase: `docs/phases/development-phase.md`

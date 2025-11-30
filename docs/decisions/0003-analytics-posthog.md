---
status: accepted
date: 2025-11-29
---

# Analytics Platform: PostHog Self-Hosted

## Context and problem statement

Distill needs product analytics to:

- Track PRD-defined success metrics (activation, retention, engagement)
- Understand user behavior (capture patterns, feature adoption)
- Measure coach and search feature effectiveness
- Make data-driven product decisions

The PRD specifies 10 tracking events that must be implemented (Section 7.1) and 4 dashboards needed (Section 7.2).

## Decision drivers

- **Privacy compliance** - Users trust us with their prompt data; analytics must respect that
- **Full data ownership** - Ability to export and control all analytics data
- **Self-service dashboards** - Product team should create dashboards without engineering
- **Event flexibility** - Track custom events with arbitrary properties
- **Cost control** - Predictable pricing as we scale
- **Extension support** - Must work in browser extension context

## Options

### Option 1: PostHog Self-Hosted

Deploy PostHog on our infrastructure.

**Pros:**
- Full data ownership and control
- No data leaves our infrastructure
- Unlimited events (no per-event pricing)
- Open source, transparent
- Feature flags, session replay included
- Good JavaScript SDK for extension

**Cons:**
- Requires infrastructure maintenance
- Self-managed upgrades
- Initial setup complexity

### Option 2: PostHog Cloud

Use PostHog's managed cloud offering.

**Pros:**
- No infrastructure to manage
- Automatic updates
- Same feature set

**Cons:**
- Data stored on PostHog servers
- Per-event pricing at scale
- Less control over data retention

### Option 3: Mixpanel

Use Mixpanel for product analytics.

**Pros:**
- Industry standard
- Excellent funnel analysis
- Strong mobile SDK

**Cons:**
- Per-event pricing expensive at scale
- Data on third-party servers
- Privacy concerns for prompt-adjacent data

### Option 4: Amplitude

Use Amplitude for behavioral analytics.

**Pros:**
- Powerful cohort analysis
- Good retention charts

**Cons:**
- Complex pricing model
- Data on third-party servers
- Overkill for MVP needs

### Option 5: Build custom analytics

Build our own event tracking system.

**Pros:**
- Full control
- No external dependencies

**Cons:**
- Significant engineering effort
- No visualization tools
- Maintenance burden
- Reinventing the wheel

## Decision

**Chosen:** Option 1 - PostHog Self-Hosted

**Because:**

1. **Privacy-first** - User prompt data is sensitive; keeping analytics data on our infrastructure aligns with our privacy positioning
2. **Cost predictable** - No per-event pricing; scales with infrastructure, not usage
3. **Full ownership** - Can export, backup, and migrate data at any time
4. **Feature complete** - Events, funnels, retention, feature flags all included
5. **Extension compatible** - JavaScript SDK works in Manifest V3 service workers
6. **Open source** - Transparent, auditable, no vendor lock-in

### Consequences

**Good:**
- All 10 PRD tracking events implemented
- Full data ownership on our infrastructure
- No ongoing per-event costs
- Privacy policy accurately states "data stored on our servers"
- Can add session replay, feature flags later without new vendor

**Bad:**
- Requires Docker/infrastructure knowledge
- Must handle upgrades ourselves
- Initial setup took ~1 day

### Confirmation

We'll know this decision was right if:
- All 10 tracking events captured reliably
- Dashboards answer product questions without engineering help
- Analytics costs remain predictable
- No privacy concerns raised about analytics

## Implementation

### Events implemented

All 10 PRD events (Section 7.1):

| Event | Properties | Server/Client |
|-------|------------|---------------|
| `user_signed_up` | source, referrer | Server |
| `workspace_created` | privacy_default | Server |
| `extension_installed` | browser, version | Client (extension) |
| `chat_captured` | platform, privacy_mode, token_count | Server |
| `prompt_created` | source, has_variables | Server |
| `prompt_run` | platform, variable_count | Server |
| `prompt_edited` | edit_type, time_since_creation | Server |
| `coach_used` | suggestions_shown, suggestions_applied | Server |
| `member_invited` | count | Server |
| `search_performed` | query_length, results_count | Server |

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Web App         │    │ API Server       │    │ PostHog         │
│ (posthog-js)    │───►│ (analytics svc)  │───►│ (self-hosted)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                              ▲
         │                                              │
┌─────────────────┐                                     │
│ Extension       │─────────────────────────────────────┘
│ (posthog-js)    │
└─────────────────┘
```

### Test coverage

- 72+ unit tests for analytics service
- Mock PostHog client for testing
- Event property validation

### Dashboard location

Analytics dashboard available at `/analytics` in the web app.

## More information

- [PostHog Documentation](https://posthog.com/docs)
- [PostHog Self-Hosting](https://posthog.com/docs/self-host)
- Related: Sprint 5 Analytics Handoff (`docs/handoffs/sprint-5-analytics-handoff.md`)
- Related: PRD Section 7 Analytics Requirements (`docs/requirements/mvp-prd.md`)

# Workflows (Prompt Chains) Feature

> **Status:** APPROVED | **Decision:** Strategic Bet
> **Last Updated:** 2025-11-30
> **Author:** Product Team

## Overview

This folder contains comprehensive research and specifications for the "Workflows" (prompt chaining) feature in Distill. Workflows allow users to chain multiple prompts in sequence, passing outputs from one prompt as inputs to the next.

## Documents

| Document | Purpose |
|----------|---------|
| [Phase 1 Specification](./workflows-phase1-spec.md) | Implementation spec (START HERE) |
| [Executive Summary](./executive-summary.md) | Quick reference for decision-makers |
| [Full Research Report](./research-report.md) | Comprehensive analysis with all findings |
| [Sources](./sources.md) | All referenced sources and links |

## Decision Summary

**Decision:** Build Full Workflows (Option A) as a **Strategic Bet**

**Rationale:**
- Workflows are core to the product vision
- Technical feasibility confirmed (7-12 weeks LOE)
- Market exists (MindPal $70K ARR, LangChain $1.3B valuation)
- Unique positioning: capture → chain → share

**Scope:**
- User creates workflow from existing prompts
- Define execution order (2+ steps)
- Run entire sequence with one click
- Record output of each step
- Output from step N feeds into step N+1
- "Suggested next prompt" as discovery mechanism

## Key Findings

### Market Reality
- $20-24B workflow automation market growing at 10-23% CAGR
- Agentic AI segment growing fastest at **47% CAGR**
- Competitors: LangChain ($1.3B), MindPal (50K users, $70K ARR), PromptHub (3.4K users)

### Technical Evidence
- Anthropic officially recommends chaining for complex tasks
- Research shows chaining outperforms single prompts for multi-step work
- **Risk:** Large context windows (128K+) enable "prompt stuffing" as alternative

### Technical Feasibility
- Existing Distill infrastructure supports workflows (Prisma schema, distillation service, tRPC)
- Estimated LOE: **7-12 weeks**
- New components: Workflow/WorkflowStep models, execution engine, builder UI

## Deferred Items

| Item | Reason | Revisit When |
|------|--------|--------------|
| Financial model (ROI) | Strategic bet, not ROI-driven | Post-launch |
| Roadmap prioritization | Team committed | Next planning cycle |
| User research | No user access | When available |

## Related Documents

- [MVP PRD](/docs/prd/distill_mvp_prd_v0_1.md)
- [Development Log](/docs/logs/development-log.md)
- [Sprint 6 Status](/docs/logs/sprints/sprint-6.md)

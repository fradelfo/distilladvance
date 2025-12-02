# Workflows Feature: Executive Summary

> **TL;DR:** Workflows APPROVED as a strategic bet. Building full prompt chaining capability despite risks from large context windows and agentic AI trends. Unique positioning: capture → chain → share. Estimated 7-12 weeks LOE.

---

## Decision

| | |
|---|---|
| **Status** | APPROVED |
| **Decision Type** | Strategic Bet |
| **Date** | 2025-11-30 |
| **LOE** | 7-12 weeks |

**Rationale:** Workflows are core to the product vision. Building without waiting for user validation because no user access is available and the team believes this differentiates Distill's positioning.

---

## What We're Building

Workflows (Prompt Chains) let users chain multiple prompts in sequence:
1. Define a sequence of prompts (2+ steps)
2. Pass outputs from one prompt as inputs to the next
3. Save as reusable, shareable workflows
4. Execute with a single set of initial inputs
5. View execution history with outputs at each step

**Example:** Extract Data → Analyze Trends → Create Visualization Description

**See:** [Phase 1 Specification](./workflows-phase1-spec.md)

---

## Business Case

### FOR Building

| Factor | Evidence |
|--------|----------|
| Market validation | LangChain ($1.3B), MindPal ($70K ARR, 50K users) |
| Performance proof | Research: chaining outperforms single prompts |
| Enterprise need | Step-by-step validation for compliance |
| Revenue path | Natural Pro/Team tier feature |
| Differentiation | **Capture → Chain → Share** is unique |

### Risks Accepted

| Factor | Evidence |
|--------|----------|
| Timing concerns | 128K+ context windows reducing need |
| Industry trajectory | Moving toward autonomous agents (47% CAGR) |
| MVP dilution | Core capture loop not fully proven |
| No validated demand | Limited evidence users want this |
| Competition | LangChain dominates developers |
| Complexity cost | 7-12 weeks LOE |

---

## Competitor Traction

| Competitor | Users | Revenue | Funding | Valuation |
|------------|-------|---------|---------|-----------|
| **LangChain** | 1K customers, 96K GitHub stars | $16M ARR | $260M | **$1.3B** |
| **MindPal** | 50K+ businesses | $70K | $0 (bootstrapped) | M&A offer received |
| **PromptHub** | 3.4K users | Not disclosed | $0 | Not disclosed |

**Gap:** No player owns "capture → workflow" positioning.

---

## Technical Feasibility

| Component | Status |
|-----------|--------|
| Prisma Schema | Ready to extend |
| CollectionPrompt.order | Pattern exists |
| Distillation Service | Reusable |
| Variable Extraction | `{{variable}}` implemented |
| tRPC API | Add workflow router |

**New Components Required:**
- Workflow/WorkflowStep/WorkflowExecution models
- Execution engine with step orchestration
- Workflow builder UI (drag-drop)
- Execution progress UI

---

## Implementation Phases

| Phase | Scope | Weeks |
|-------|-------|-------|
| 1A: Foundation | Schema, migrations, basic CRUD | 1-2 |
| 1B: Execution Engine | Step orchestration, variable mapping | 2-3 |
| 1C: Builder UI | Create/edit workflows, drag-drop | 2-3 |
| 1D: Runner UI | Execute, progress, outputs | 1-2 |
| 1E: History & Polish | Execution history, UX refinement | 1-2 |
| **Total** | | **7-12** |

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Workflow creation | 20% of active users create 1+ workflow in 30 days |
| Workflow execution | Average 3+ executions per workflow |
| Completion rate | 80%+ workflows complete successfully |
| User satisfaction | Positive qualitative feedback |

---

## Deferred Items

| Item | Reason | Revisit |
|------|--------|---------|
| Financial model (ROI) | Strategic bet | Post-launch |
| User research | No access | When available |
| Roadmap prioritization | Team committed | Next cycle |

---

## Next Steps

1. Review [Phase 1 Specification](./workflows-phase1-spec.md)
2. Plan implementation sprint
3. Begin Phase 1A (schema + CRUD)

---

**Full analysis:** [research-report.md](./research-report.md)
**Implementation spec:** [workflows-phase1-spec.md](./workflows-phase1-spec.md)
**Sources:** [sources.md](./sources.md)

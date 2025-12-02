# Team Workflow Command System

## Overview

A holistic set of lightweight workflow commands for daily work, integrating with existing comprehensive agents and workflows.

## Project Documents Reference

Commands automatically analyze these documents when relevant:

### Core Documents
| Document | Path | Used By |
|----------|------|---------|
| PRD | `docs/prd/distill_mvp_prd_v0_1.md` | All commands |
| Strategy | `docs/strategy/distill_product_research_strategy_v0_1.md` | `/discover` |
| Roadmap | `work/product/roadmap.md` | `/validate-idea`, `/start-work` |
| Backlog | `work/product/backlog.md` | `/validate-idea`, `/start-work` |

### Research Documents
| Document | Path | Used By |
|----------|------|---------|
| Market Notes | `docs/research/market-notes.md` | `/discover` |
| User Insights | `docs/research/user-insights.md` | `/discover` |

### Engineering Documents
| Document | Path | Used By |
|----------|------|---------|
| Architecture | `work/engineering/architecture.md` | `/validate-idea`, `/complete-work` |
| API Design | `work/engineering/api-design.md` | `/complete-work` |
| Extension Design | `work/engineering/extension-design.md` | When extension work |

### Design Documents
| Document | Path | Used By |
|----------|------|---------|
| UX Flows | `work/design/ux-flows.md` | `/validate-idea` (UI work) |
| UI Specs | `work/design/ui-specs.md` | `/validate-idea`, `/complete-work` |

---

## Workflow Stages

```
Discovery → Validate → Start → Work → Complete → Ship → Measure
    ↓          ↓         ↓       ↓        ↓        ↓        ↓
 discovery  product   start-  frontend  code    devops   metrics
 research   strategy   work   backend   review           experiments
            ux-spec           quality   security
            delivery          security  audit
            tech-lead
```

---

## Quick Reference

| Stage | Command | Purpose |
|-------|---------|---------|
| Discovery | `/discover` | Research ideas from online sources |
| Validate | `/validate-idea` | Assess feasibility, value, scope |
| Start | `/start-work` | Create issue, branch, setup |
| Work | `/frontend`, `/backend`, `/quality` | Implementation |
| Complete | `/complete-work` | Code review + create PR |
| Ship | `/ship` | Merge and deploy |
| Measure | `/metrics-experiments` | Track impact |

---

## Commands

### `/discover` - Research & Discovery

**Purpose**: Research ideas from online sources, competitors, trends

**Usage**:
```
/discover How are other apps handling AI prompt management?
```

**What it does**:
1. Uses WebSearch to find relevant online sources
2. Runs `/discovery-research` agent to analyze findings
3. Synthesizes into actionable summary

**Output**:
- Key findings with sources
- Opportunities identified
- Suggested next steps

---

### `/validate-idea` - Idea Validation

**Purpose**: Quick validation before starting work

**Usage**:
```
/validate-idea Add a feature to export prompts as markdown files
```

**What it does**:
1. Runs `/product-strategy` for value assessment
2. Runs `/delivery-execution-planner` for scope estimate
3. If UI work: runs `/ux-spec-writer`
4. If complex: runs `/tech-lead`
5. Synthesizes recommendation

**Output**:
- Feasibility: ✅ Feasible / ⚠️ Needs Research / ❌ Not Recommended
- Value: High / Medium / Low
- Scope: S (hours) / M (1-3 days) / L (week+)
- Recommendation: Proceed / Refine / Reject

**Note**: For complex features, use `/feature-dev` instead.

---

### `/start-work` - Begin Work

**Purpose**: Set up issue, branch, project tracking

**Usage**:
```
/start-work Add dark mode toggle to the settings page
```

**What it does**:
1. Creates GitHub issue with description
2. Creates feature branch linked to issue
3. Updates project board

**Output**:
- Issue URL
- Branch name
- Ready to work confirmation

---

### `/checkpoint` - Progress Update

**Purpose**: Save progress mid-work

**Usage**:
```
/checkpoint Completed auth flow, starting tests
```

**What it does**:
1. Commits current changes
2. Updates GitHub issue with progress comment
3. Shows summary of work done

---

### `/complete-work` - Finish Work

**Purpose**: Prepare for PR with quality checks

**Usage**:
```
/complete-work
```

**What it does**:
1. Ensures all changes committed
2. Runs `/code-review` for quality analysis
3. If security-sensitive: runs `/security-audit`
4. If issues found: reports and stops
5. If OK: creates PR linking to issue

**Output**:
- Code review summary
- Security findings (if applicable)
- PR URL (if review passed)

---

### `/ship` - Deploy

**Purpose**: Merge PR and deploy

**Usage**:
```
/ship
```
or
```
/ship #42
```

**What it does**:
1. Checks PR is approved and checks passing
2. Squash merges the PR
3. Deletes feature branch
4. If deployment configured: runs `/devops`
5. Confirms issue auto-closed

---

## Decision Tree

```
Have an idea?
│
├─ Need research first? → /discover
│
├─ Quick validation? → /validate-idea
│   └─ Complex feature? → /feature-dev
│
├─ Ready to start? → /start-work
│   └─ From GitHub issue? → /github-issue
│
├─ During work:
│   ├─ Frontend task → /frontend
│   ├─ Backend task → /backend
│   ├─ Need tests → /quality
│   └─ Save progress → /checkpoint
│
├─ Finishing up? → /complete-work
│   └─ Needs security review? → /security-audit first
│
├─ Ready to merge? → /ship
│
└─ Measure impact? → /metrics-experiments
```

---

## Existing Commands Reference

### Comprehensive Workflows
| Command | Purpose |
|---------|---------|
| `/feature-dev` | Full multi-agent feature development |
| `/github-issue` | Issue analysis and resolution |

### Specialist Agents
| Command | Purpose |
|---------|---------|
| `/tech-lead` | Architecture, system design |
| `/frontend` | React/TypeScript implementation |
| `/backend` | Node.js, API, database |
| `/security` | Security expert |
| `/quality` | Testing and QA |
| `/devops` | Infrastructure, deployment |
| `/code-reviewer` | Code review |

### Research/Analysis Agents
| Command | Purpose |
|---------|---------|
| `/discovery-research` | Market analysis, user research |
| `/product-strategy` | Prioritization, value assessment |
| `/ux-spec-writer` | UX specs, design docs |
| `/delivery-execution-planner` | Scope, timeline |
| `/metrics-experiments` | A/B testing, analytics |

### Specialized Operations
| Command | Purpose |
|---------|---------|
| `/code-review` | Code quality analysis |
| `/security-audit` | Security auditing |
| `/ai-optimize` | AI cost/performance optimization |

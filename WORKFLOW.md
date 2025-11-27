# Workflow & Sign-off Process

How features move from idea to production.

## Overview

```
Idea → Backlog → PRD → Design → Dev → Review → Merge → Retro
         ↓         ↓        ↓       ↓        ↓
      Prioritise  Sign-off Sign-off Sign-off Sign-off
```

## Phases

### 1. Backlog
**Owner:** Product agent
**Input:** Idea, user feedback, data
**Output:** Feature brief in `docs/backlog/`

**Sign-off criteria:**
- [ ] Problem clearly stated
- [ ] Evidence exists
- [ ] Rough sizing done

### 2. PRD
**Owner:** Product agent
**Input:** Prioritised feature brief
**Output:** PRD in `docs/requirements/`

**Sign-off criteria:**
- [ ] Problem statement validated
- [ ] Target users defined
- [ ] Success metrics measurable
- [ ] Acceptance criteria testable
- [ ] Scope bounded (MVP vs future)
- [ ] Dependencies identified
- [ ] Risks documented

**Command:** `/create-prd [feature]`

### 3. Design
**Owner:** Designer agent
**Input:** Approved PRD + handoff
**Output:** Design spec in `docs/design/`

**Sign-off criteria:**
- [ ] User flow complete (happy + unhappy paths)
- [ ] All states documented
- [ ] Edge cases identified
- [ ] Accessibility requirements met
- [ ] Responsive behaviour defined
- [ ] Design tokens used

**Commands:** 
- `/create-design-spec [feature]`
- `/design-review [feature]`

### 4. Development
**Owner:** Developer agent
**Input:** Approved design spec + handoff
**Output:** Working code + tests

**Sign-off criteria:**
- [ ] All acceptance criteria met
- [ ] Tests pass
- [ ] No TypeScript errors
- [ ] No lint warnings
- [ ] Code self-reviewed
- [ ] CHANGELOG updated

**Commands:**
- `/start-feature [feature]`
- `/code-review`
- `/complete-feature`

### 5. PR Review
**Owner:** Developer agent (self-review or peer)
**Input:** Feature branch
**Output:** Approved PR

**Sign-off criteria:**
- [ ] CI passes
- [ ] Code review checklist complete
- [ ] No blocking comments
- [ ] Docs updated

### 6. Merge
**Owner:** Developer
**Action:** Squash merge to main

**Post-merge:**
- [ ] Phase marker updated to complete
- [ ] Obsidian log updated

### 7. Retrospective
**Owner:** All agents
**Input:** Completed feature
**Output:** Retro doc in `docs/phases/`

**Command:** `/retrospective [feature]`

---

## Handoff documents

Create handoffs at phase transitions:

| Transition | Template | Location |
|------------|----------|----------|
| Product → Design | `_product-to-design.md` | `docs/handoffs/` |
| Design → Dev | `_design-to-dev.md` | `docs/handoffs/` |

**Command:** `/create-handoff [feature] [from] [to]`

---

## Sign-off in practice

Since you're solo, sign-offs are self-reviews:

1. **Use the review commands** before transitioning:
   - `/product-review` before design handoff
   - `/design-review` before dev handoff
   - `/code-review` before PR

2. **Update phase markers** in `docs/phases/`:
   - Check off quality gates
   - Log progress

3. **Log to Obsidian** at each transition:
   - What was decided
   - Any open questions resolved

---

## Quick reference

| Phase | Start command | Review command | Output |
|-------|---------------|----------------|--------|
| Backlog | — | — | Brief |
| PRD | `/create-prd` | `/product-review` | PRD |
| Design | `/create-design-spec` | `/design-review` | Spec |
| Dev | `/start-feature` | `/code-review` | Code |
| Complete | `/complete-feature` | — | PR |
| Retro | `/retrospective` | — | Learnings |

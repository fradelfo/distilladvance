---
description: Create Product Requirements Document
allowed-tools: Read, Write, Grep, Glob, WebSearch
---

Create PRD for:

$ARGUMENTS

## Before starting

Ask about:
- Target users + context
- Problem being solved
- Business goals + metrics
- Constraints (time, tech, compliance)
- MVP vs future scope

Check:
- `/docs/requirements/` for related PRDs
- `/docs/research/` for user research
- `/docs/decisions/` for relevant decisions

## Template

```markdown
# [Feature] PRD

**Status:** Draft
**Author:** 
**Updated:** [date]

## Problem statement


## Target users


## Success metrics
| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|

## User stories

### [Story 1]
As a [user], I want [action] so that [benefit].

**Acceptance criteria:**
- [ ] Given..., when..., then...

## Scope

### In scope (MVP)
- 

### Out of scope
- 

### Non-goals
- 

## User flow


## Technical constraints
- 

## Dependencies
- 

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|

## Open questions
- [ ] Question — Owner — Due

## Appendix

```

## Output

Save to `/docs/requirements/[feature]-prd.md`

# Validate Idea - Quick Validation

Validate feasibility, value, and scope before starting work.

## Arguments
- $ARGUMENTS: Idea description to validate

## Required Documents to Read

Before validation, **MUST read** these documents for context:

| Document | Path | Why |
|----------|------|-----|
| PRD | `docs/prd/distill_mvp_prd_v0_1.md` | Check alignment with requirements |
| Roadmap | `work/product/roadmap.md` | Understand priorities |
| Backlog | `work/product/backlog.md` | Check if already planned |
| Architecture | `work/engineering/architecture.md` | Technical context |

**IF UI work involved, also read:**
| Document | Path | Why |
|----------|------|-----|
| UX Flows | `work/design/ux-flows.md` | Existing user flows |
| UI Specs | `work/design/ui-specs.md` | Design patterns |

**IF extension work involved, also read:**
| Document | Path | Why |
|----------|------|-----|
| Extension Design | `work/engineering/extension-design.md` | Extension architecture |

## Instructions

When user runs `/validate-idea {idea}`:

### ⚠️ IMPORTANT - MUST invoke these agents:

1. **`/product-strategy` agent** (ALWAYS)
   - Assess value and business prioritization
   - Evaluate user impact and strategic fit
   - Get High/Medium/Low value rating

2. **`/delivery-execution-planner` agent** (ALWAYS)
   - Estimate scope: S (hours) / M (1-3 days) / L (week+)
   - Identify dependencies and risks
   - Assess timeline feasibility

3. **`/tech-lead` agent** (IF complex architecture)
   - Only if idea involves significant technical decisions
   - Assess technical feasibility
   - Identify architectural considerations

4. **`/ux-spec-writer` agent** (IF UI work involved)
   - Only if idea involves user interface changes
   - Assess UX implications
   - Identify design considerations

### Workflow

1. **Initial Analysis**
   - Parse the idea description
   - Determine if UI work is involved
   - Determine if complex architecture is needed

2. **Agent Consultation** (run in sequence)
   - MUST run `/product-strategy {idea}`
   - MUST run `/delivery-execution-planner {idea}`
   - IF UI work: run `/ux-spec-writer {idea}`
   - IF complex: run `/tech-lead {idea}`

3. **Synthesis**
   - Combine all agent outputs
   - Formulate recommendation

### Output Format

```markdown
## Validation: {idea}

### Assessment

| Criteria | Rating | Notes |
|----------|--------|-------|
| Feasibility | ✅/⚠️/❌ | [from tech analysis] |
| Value | High/Medium/Low | [from product-strategy] |
| Scope | S/M/L | [from delivery-planner] |

### Product Perspective
[Summary from /product-strategy]

### Scope Estimate
[Summary from /delivery-execution-planner]
- Estimated effort: [S/M/L]
- Key dependencies: [list]
- Risks: [list]

### UX Considerations (if applicable)
[Summary from /ux-spec-writer]

### Technical Considerations (if applicable)
[Summary from /tech-lead]

### Recommendation

**[Proceed / Refine / Reject]**

[Reasoning for recommendation]

### Next Steps
- [ ] [If proceed: use /start-work]
- [ ] [If refine: what needs clarification]
- [ ] [If complex: consider /feature-dev instead]
```

## Decision Guide

- **Proceed**: Clear value, feasible, reasonable scope
- **Refine**: Good idea but needs more definition or scope reduction
- **Reject**: Low value, not feasible, or too risky

**Note**: For complex features requiring multiple specialists, recommend `/feature-dev` instead.

## Example

```
/validate-idea Add a feature to export prompts as markdown files with metadata
```

$ARGUMENTS

# Full Workflow Example

A complete example showing the entire workflow from discovery to shipping.

---

## Scenario: Adding Prompt Templates Feature

### Step 1: Discovery

**Command:**
```
/discover How do other apps implement prompt templates with variables?
```

**Documents Analyzed:**
- `docs/prd/distill_mvp_prd_v0_1.md` - PRD mentions variable support as future enhancement
- `docs/strategy/distill_product_research_strategy_v0_1.md` - Variables align with "reusable prompts" goal
- `docs/research/market-notes.md` - No existing research on variable syntax

**Result:**
Found that most apps use `{{variable}}` syntax, some offer default values, and advanced tools have conditional logic. Key competitors: PromptLayer, Langchain Hub.

**Decision:** Proceed with investigation.

---

### Step 2: Validate the Idea

**Command:**
```
/validate-idea Add prompt templates with {{variable}} syntax and a visual variable editor
```

**Documents Analyzed:**
- `docs/prd/distill_mvp_prd_v0_1.md` - Variables mentioned in "future enhancements"
- `work/product/roadmap.md` - Not currently scheduled, fits Q2
- `work/product/backlog.md` - Related item: "Template variables"
- `work/engineering/architecture.md` - Can extend existing prompt model
- `work/design/ui-specs.md` - Need to define variable editor component

**Result:**
```
Feasibility: ✅ Feasible
Value: High
Scope: M (2-3 days)
Recommendation: Proceed
```

**Decision:** Start work on this feature.

---

### Step 3: Start Work

**Command:**
```
/start-work Add prompt templates with variable syntax and visual editor
```

**Result:**
```
✅ Issue created: #120 - Add prompt templates with variable syntax
✅ Branch created: feature/120-prompt-templates
✅ Ready to work
```

---

### Step 4: Development (Day 1)

Work on the backend variable extraction...

**End of day checkpoint:**
```
/checkpoint Completed variable extraction service and API endpoint. Starting on frontend tomorrow.
```

**Result:**
```
✅ Committed: "WIP: Variable extraction service"
✅ Issue #120 updated with progress
```

---

### Step 5: Development (Day 2)

Work on the frontend variable editor...

**Mid-day checkpoint:**
```
/checkpoint Variable editor UI complete, working on integration with prompt preview
```

**Result:**
```
✅ Committed: "WIP: Variable editor component"
✅ Issue #120 updated
```

---

### Step 6: Development (Day 3)

Finish integration and tests...

**Ready for review:**
```
/complete-work Added prompt templates with {{variable}} syntax, visual editor, and real-time preview
```

**Documents Verified:**
- `work/engineering/architecture.md` - Follows service layer pattern ✅
- `work/engineering/api-design.md` - New endpoints follow conventions ✅
- `docs/prd/distill_mvp_prd_v0_1.md` - Requirement alignment verified ✅
- `work/design/ui-specs.md` - Variable editor matches design system ✅

**Result:**
```
Code Review: ✅ Passed (9/10)
Security: N/A
PR Created: #135
```

---

### Step 7: Ship It

After teammate approves PR...

**Command:**
```
/ship
```

**Result:**
```
✅ Shipped!
- PR #135 merged
- Issue #120 closed
- Branch deleted
```

---

## Timeline Summary

| Day | Action | Command |
|-----|--------|---------|
| 0 | Research | `/discover` |
| 0 | Validate | `/validate-idea` |
| 1 | Start | `/start-work` |
| 1 | Save progress | `/checkpoint` |
| 2 | Save progress | `/checkpoint` |
| 3 | Complete | `/complete-work` |
| 3 | Ship | `/ship` |

---

## Commands Used

1. `/discover` - Researched the problem space
2. `/validate-idea` - Confirmed feasibility and value
3. `/start-work` - Created issue and branch
4. `/checkpoint` (x2) - Saved progress, updated issue
5. `/complete-work` - Code review + PR creation
6. `/ship` - Merged and deployed

---

## Tips from This Workflow

1. **Use `/discover` before `/validate-idea`** when exploring new territory
2. **Checkpoint frequently** - at least once per day for multi-day work
3. **Let `/complete-work` catch issues** before creating PR
4. **Don't skip validation** - even "obvious" features benefit from scope check
5. **Issue linking is automatic** - branch naming convention enables this

---

## Alternative Paths

### Quick Bug Fix
```
/start-work Fix button alignment on mobile
/complete-work
/ship
```
Skip discovery and validation for obvious fixes.

### Complex Feature
```
/discover [topic]
/validate-idea [idea]
# If scope is L (week+):
/feature-dev [description]  # Use comprehensive workflow instead
```

### Experiment
```
/start-work Experiment with new animation library
# Work on experiment...
# If successful:
/validate-idea Adopt framer-motion for animations
/start-work Migrate to framer-motion
```

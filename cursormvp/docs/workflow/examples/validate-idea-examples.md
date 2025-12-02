# /validate-idea Examples

## Example 1: Simple Feature - PROCEED

**Command:**
```
/validate-idea Add a feature to export prompts as markdown files
```

**Expected Output:**
```markdown
## Validation: Export prompts as markdown files

### Documents Reviewed
- ✅ `docs/prd/distill_mvp_prd_v0_1.md` - Export not in MVP scope but aligns with data portability goal
- ✅ `work/product/roadmap.md` - Not currently scheduled
- ✅ `work/product/backlog.md` - Similar item exists: "Data export capabilities"
- ✅ `work/engineering/architecture.md` - Can use existing prompt service

### Assessment

| Criteria | Rating | Notes |
|----------|--------|-------|
| Feasibility | ✅ Feasible | Straightforward implementation |
| Value | Medium | Useful for backup/portability |
| Scope | S (hours) | Simple file generation |

### Product Perspective
*From /product-strategy:*
- Aligns with data portability expectations
- Low effort, good user goodwill feature
- Not a differentiator but expected functionality
- Priority: Medium (nice-to-have for launch)

### Scope Estimate
*From /delivery-execution-planner:*
- Estimated effort: **S (2-4 hours)**
- Key dependencies: None
- Risks:
  - Markdown format decisions (frontmatter? variables?)
  - Batch export considerations

### Recommendation

**✅ Proceed**

Simple, low-risk feature with clear user value. Good candidate for a quick win.

### Next Steps
- [ ] Use `/start-work Export prompts as markdown with metadata`
- [ ] Define markdown format (suggest: frontmatter + body)
- [ ] Consider batch export in same scope
```

---

## Example 2: UI Feature - PROCEED with UX input

**Command:**
```
/validate-idea Add a visual prompt builder with drag-and-drop blocks
```

**Expected Output:**
```markdown
## Validation: Visual prompt builder with drag-and-drop

### Documents Reviewed
- ✅ `docs/prd/distill_mvp_prd_v0_1.md` - PRD mentions "prompt editing" but not visual builder
- ✅ `work/product/roadmap.md` - Not in current roadmap
- ✅ `work/product/backlog.md` - Related: "Enhanced prompt editor"
- ✅ `work/engineering/architecture.md` - Would need new component architecture
- ✅ `work/design/ux-flows.md` - Current flow is text-based editing
- ✅ `work/design/ui-specs.md` - No drag-drop patterns defined yet

### Assessment

| Criteria | Rating | Notes |
|----------|--------|-------|
| Feasibility | ⚠️ Needs Research | Complex UI, needs design |
| Value | High | Differentiator feature |
| Scope | L (week+) | Significant frontend work |

### Product Perspective
*From /product-strategy:*
- High differentiation potential
- Appeals to non-technical users
- Risk: May not align with power user expectations
- Priority: High value but high effort - consider for v2

### Scope Estimate
*From /delivery-execution-planner:*
- Estimated effort: **L (1-2 weeks)**
- Key dependencies:
  - UI component library selection
  - Block type definitions
  - State management for builder
- Risks:
  - Scope creep (how many block types?)
  - Mobile support complexity
  - Performance with large prompts

### UX Considerations
*From /ux-spec-writer:*
- Need to define block types and interactions
- Drag-and-drop accessibility concerns (keyboard alternatives)
- Consider: How does this integrate with existing text editor?
- Suggest: Start with simple version (3-4 block types)

### Recommendation

**⚠️ Refine**

High value but needs more definition before starting. Recommend:
1. Define MVP block types (text, variable, conditional)
2. Create UX wireframes first
3. Consider phased approach

### Next Steps
- [ ] Create UX spec with `/ux-spec-writer`
- [ ] Define phase 1 scope (minimal blocks)
- [ ] Then use `/start-work` with refined scope
- [ ] Or: Use `/feature-dev` for full multi-agent coordination
```

---

## Example 3: Complex Feature - USE /feature-dev

**Command:**
```
/validate-idea Implement real-time collaborative prompt editing like Google Docs
```

**Expected Output:**
```markdown
## Validation: Real-time collaborative prompt editing

### Assessment

| Criteria | Rating | Notes |
|----------|--------|-------|
| Feasibility | ⚠️ Needs Research | Complex architecture |
| Value | High | Strong team feature |
| Scope | L (weeks) | Major infrastructure |

### Product Perspective
*From /product-strategy:*
- High value for team use case
- Significant competitive differentiator
- But: Is this core to MVP? Consider post-launch
- Priority: High value, defer to v2

### Scope Estimate
*From /delivery-execution-planner:*
- Estimated effort: **L (2-4 weeks)**
- Key dependencies:
  - Real-time sync infrastructure (WebSockets/CRDT)
  - Conflict resolution strategy
  - Presence indicators
  - Permission system updates
- Risks:
  - Operational complexity (WebSocket servers)
  - Edge cases in conflict resolution
  - Mobile support challenges

### Technical Considerations
*From /tech-lead:*
- Options: Yjs, Automerge, or Liveblocks
- Infrastructure: Need WebSocket server or use managed service
- Database changes: Need operational transforms or CRDT storage
- Consider: Liveblocks for faster implementation

### Recommendation

**❌ Reject for now / Defer**

This is a significant architectural change that requires dedicated planning:
- Too complex for simple `/start-work` flow
- Needs full technical design
- Consider for v2 roadmap

**If proceeding:**
Use `/feature-dev` instead for full multi-agent coordination.

### Next Steps
- [ ] Add to v2 roadmap
- [ ] If prioritized: Use `/feature-dev Implement real-time collaboration`
- [ ] Research Liveblocks vs self-hosted options
```

---

## Example 4: Bug Fix - PROCEED

**Command:**
```
/validate-idea Fix the prompt preview not updating when variables change
```

**Expected Output:**
```markdown
## Validation: Fix prompt preview variable update bug

### Assessment

| Criteria | Rating | Notes |
|----------|--------|-------|
| Feasibility | ✅ Feasible | Bug fix, known scope |
| Value | High | Affects core functionality |
| Scope | S (hours) | Debugging + fix |

### Product Perspective
*From /product-strategy:*
- High priority - affects core user experience
- Bug fixes should generally take priority
- User-reported issues damage trust

### Scope Estimate
*From /delivery-execution-planner:*
- Estimated effort: **S (1-3 hours)**
- Key dependencies: None
- Risks:
  - Root cause may be deeper than expected
  - May reveal related issues

### Recommendation

**✅ Proceed**

Clear bug with user impact. Fix promptly.

### Next Steps
- [ ] Use `/start-work Fix prompt preview variable reactivity bug`
- [ ] Investigate React state/effect dependencies
- [ ] Add test case to prevent regression
```

---

## Example 5: Low Value - REJECT

**Command:**
```
/validate-idea Add animated confetti when user saves a prompt
```

**Expected Output:**
```markdown
## Validation: Animated confetti on prompt save

### Assessment

| Criteria | Rating | Notes |
|----------|--------|-------|
| Feasibility | ✅ Feasible | Simple animation |
| Value | Low | Nice but not impactful |
| Scope | S (hours) | Quick implementation |

### Product Perspective
*From /product-strategy:*
- Low impact on core metrics
- Could feel gimmicky for professional users
- Not aligned with current priorities
- Priority: Very low

### Scope Estimate
*From /delivery-execution-planner:*
- Estimated effort: **S (1-2 hours)**
- Key dependencies: Animation library (canvas-confetti)
- Risks: None significant

### Recommendation

**❌ Reject**

While technically simple, this doesn't align with current priorities and may not fit the professional tone of the product.

Consider instead:
- Subtle success toast notifications
- Progress indicators for long operations

### Next Steps
- [ ] Deprioritize or remove from backlog
- [ ] If user feedback requests celebration UX, reconsider
```

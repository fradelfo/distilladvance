# Feature Backlog

Ideas and features before they become PRDs.

## Workflow

```
Idea → Backlog → Prioritised → PRD → Design → Dev → Done
```

## Files

- `_intake.md` — Quick feature intake template
- `prioritised.md` — Ordered list of what's next
- `icebox.md` — Parked ideas (not now, maybe later)
- `[feature-name].md` — Individual feature briefs

## Prioritisation

Use RICE or simple Impact/Effort:

| Feature | Impact (1-5) | Effort (1-5) | Score | Status |
|---------|--------------|--------------|-------|--------|
| Feature A | 5 | 2 | 2.5 | → PRD |
| Feature B | 3 | 4 | 0.75 | Backlog |

**Score = Impact / Effort** (higher = do first)

## Moving to PRD

When a feature is prioritised:
1. Use `/create-prd [feature]`
2. Move brief to `docs/requirements/`
3. Update `prioritised.md`

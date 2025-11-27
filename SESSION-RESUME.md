# Session Resume Guide

How to pick up where you left off.

## Starting a new session

### 1. Run context check

```bash
# In Claude Code, the SessionStart hook shows:
# - Current branch
# - Git status

# Or manually:
git branch --show-current
git status
```

### 2. Check phase markers

Look at `docs/phases/` for active work:
- What phase is in progress?
- What objectives remain?
- Any blockers logged?

### 3. Check Obsidian daily log

Review yesterday's log:
- What was done?
- What's next?
- Any blockers?

### 4. Resume with context

Tell Claude:
```
Resuming work on [feature].
Current state: [branch/phase]
Last session: [what was done]
Next task: [what to do]
```

---

## Session resume command

Use at start of any session:

```
/resume
```

This will:
1. Show current branch and status
2. Find active phase markers
3. Summarise last progress
4. Suggest next actions

---

## If context is lost

If Claude doesn't remember previous work:

1. **Point to phase marker:**
   "Read docs/phases/[feature]-phase.md for context"

2. **Point to PRD/design:**
   "Review docs/requirements/[feature]-prd.md"

3. **Point to CLAUDE.md:**
   "Review CLAUDE.md for project context"

4. **Check git log:**
   ```bash
   git log --oneline -10
   ```

---

## Session handoff template

At end of session, log:

```markdown
## Session end: [date] [time]

### Done
- [x] What was completed

### In progress
- [ ] What's partially done

### Blocked
- What's blocking

### Next session
- Priority 1: ...
- Priority 2: ...

### Context for next time
- Key decisions made
- Files changed
- Anything to remember
```

Add to:
- Phase marker (`docs/phases/`)
- Obsidian daily log

---

## Using --continue and --resume

Claude Code supports session continuity:

```bash
# Continue last session
claude --continue

# Resume specific session
claude --resume <session_id>
```

Get session ID from previous output (JSON format includes it).

---

## Multi-day features

For features spanning multiple days:

1. **Phase marker** tracks overall progress
2. **Daily logs** track daily work
3. **Feature branch** preserves code state
4. **Commits** document incremental progress

Pattern:
```bash
# End of day
git add .
git commit -m "wip: [what was done]"
# Update phase marker
# Update Obsidian daily

# Next day
claude --continue  # or fresh session with context
```

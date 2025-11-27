# First Prompt for Claude Code

Copy and paste this entire prompt when you first open Claude Code in your project directory.

---

## The Prompt

```
I'm starting work on this project using an enterprise-lite workflow with AI agents.

Before we do anything, I need you to:

1. **Read the project configuration:**
   - Read CLAUDE.md for project context
   - Read WORKFLOW.md for the sign-off process
   - Read SESSION-RESUME.md for how we work together
   - Check .claude/agents/ to understand the available roles
   - Check .claude/commands/ to see available slash commands

2. **Understand what's here:**
   - Check docs/existing-examples/ for my existing content I've pasted
   - Check docs/requirements/mvp-prd.md for the product requirements
   - Check docs/research/discovery-report.md for discovery findings

3. **Ask me clarifying questions** about anything unclear or missing, specifically:
   - Project goals and current state
   - What's already built (MVP status)
   - What I want to work on next
   - Any blockers or open decisions

4. **Summarise your understanding** before we start any work:
   - What the project is
   - Current state
   - What success looks like
   - Suggested first action

Do NOT start implementing anything until you've done all of the above and I've confirmed your understanding is correct.

Let's begin.
```

---

## What happens next

Claude will:
1. Read all the config files
2. Review your pasted content in `docs/existing-examples/`
3. Ask you targeted questions
4. Summarise understanding
5. Wait for your confirmation

Only after you confirm will Claude suggest the first action (likely `/start-feature` for your next feature).

---

## Alternative: Use the command

If you've set everything up, you can also just run:

```
/ask-context
```

This triggers the same context-gathering flow.

---

## Tips for the first session

1. **Have your content ready to paste** if you haven't already put it in `docs/existing-examples/`

2. **Know what you want to work on next** — a specific feature or task

3. **Be ready to answer:**
   - What's the current state of the MVP?
   - What's the priority for this session?
   - Any constraints (time, tech decisions already made)?

4. **After Claude summarises**, correct anything wrong before proceeding

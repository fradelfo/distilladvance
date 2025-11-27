# Product Strategy Agent

This file defines how this agent should work.

## Role

- This agent focuses on a specific area of the project related to product strategy.
- It follows the global project rules defined in `claude/claude-project.md`.

## Log reading protocol (agent)

Before doing any task:

1. Read the latest 1–3 log files in this agent's `logs/` folder:
   - `.claude/agents/product-strategy/logs/`
2. If the task involves a specific area, also read that area's logs:
   - e.g. `docs/.../logs/`, `work/.../logs/`, `app/.../logs/` as appropriate.
3. Use these logs to:
   - Avoid repeating work
   - Pick up open questions
   - Continue from the last state

## Log writing protocol (agent)

After completing a task:

1. Create a new file in `.claude/agents/product-strategy/logs/` with:
   - Filename format: `YYYY-MM-DD_HHMM-short-slug.md`
2. Include minimal information:
   - Date and time
   - Very short task description
   - Files or areas touched
   - One-line outcome or next step

The agent must not overwrite existing log files.

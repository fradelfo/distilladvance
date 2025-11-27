# Claude Project – Distill

This file defines how Claude should work with this project.

## Directories

- `docs/` – documents (strategy, PRD, research)
- `work/` – planning and specs
- `app/` – code and configuration
- `claude/` – orchestrator and agents
- `logs/` – high-level project logs

## Log reading protocol (global)

Before any agent performs a task:

1. Identify the most relevant area (e.g. `docs/strategy`, `work/product`, `app/packages/web-app`, `claude/agents/product-strategy`).
2. Open the `logs/` folder inside that area.
3. Read the most recent 1–3 log files to understand:
   - What was done last
   - Any open questions or TODOs
4. Only then proceed with the requested task.
5. When the task is complete, create a new log file in the same `logs/` folder with:
   - Filename: `YYYY-MM-DD_HHMM-short-slug.md`
   - Short summary of goal, steps, and outcome.

All agents (including the orchestrator) must follow this protocol.

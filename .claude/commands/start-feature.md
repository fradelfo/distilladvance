---
description: Start new feature with proper setup
allowed-tools: Read, Write, Bash, Grep, Glob
---

Start work on:

$ARGUMENTS

## Pre-flight

1. **Docs exist:**
   - [ ] PRD in `/docs/requirements/`
   - [ ] Design spec in `/docs/design/`
   - [ ] Relevant ADRs in `/docs/decisions/`

2. **Review:**
   - List acceptance criteria
   - Identify what needs tests

3. **Dependencies:**
   - Blocking work?
   - External deps ready?

## Setup

```bash
# Update main
git checkout main
git pull origin main

# Create branch
git checkout -b feature/[ref]/[description]

# Create phase marker
cat > docs/phases/[feature]-phase.md << 'EOF'
# Phase: [Feature]

**Status:** 🟡 In Progress
**Started:** [date]
**Branch:** `feature/[ref]/[description]`

## Objectives
- [ ] 

## Quality gates
- [ ] PRD approved
- [ ] Design spec complete
- [ ] Tests passing
- [ ] Code reviewed
- [ ] CHANGELOG updated

## Progress
### [date]
- Started
EOF
```

## Output

1. Feature branch created
2. Phase marker created
3. Implementation plan ready
4. First test identified

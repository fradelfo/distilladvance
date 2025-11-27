---
description: Create Architecture Decision Record
allowed-tools: Read, Write, Grep, Glob
---

Create ADR for:

$ARGUMENTS

## When to write ADR

- Choosing core tech
- Irreversible decisions
- Explaining "why we did X" repeatedly
- Architectural changes

## Template (MADR 4.0)

```markdown
---
status: proposed
date: [YYYY-MM-DD]
---

# [Short title]

## Context and problem statement


## Decision drivers
- 
- 

## Options

### Option 1: [Title]

**Pros:**
- 

**Cons:**
- 

### Option 2: [Title]

**Pros:**
- 

**Cons:**
- 

## Decision

**Chosen:** [Option X]

**Because:**
- 

### Consequences

**Good:**
- 

**Bad:**
- 

### Confirmation
[How we'll know it was right]

## More information
[Related ADRs, links]
```

## Output

Save to `/docs/decisions/[NNNN]-[title].md`

Check existing files for next number.

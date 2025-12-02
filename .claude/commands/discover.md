# Discover - Research & Discovery

Research ideas from online sources, competitors, and trends.

## Arguments
- $ARGUMENTS: Topic or question to research

## Required Documents to Read

Before conducting research, **MUST read** these existing documents for context:

| Document | Path | Why |
|----------|------|-----|
| PRD | `docs/prd/distill_mvp_prd_v0_1.md` | Understand product scope |
| Strategy | `docs/strategy/distill_product_research_strategy_v0_1.md` | Align with strategy |
| Market Notes | `docs/research/market-notes.md` | Avoid duplicate research |
| User Insights | `docs/research/user-insights.md` | Context on user needs |

## Instructions

When user runs `/discover {topic}`:

### ⚠️ IMPORTANT - MUST invoke these tools/agents:

1. **WebSearch tool** (ALWAYS)
   - Search for relevant online sources about the topic
   - Look for competitors, trends, best practices
   - Gather 5-10 relevant sources

2. **`/discovery-research` agent** (ALWAYS)
   - After gathering search results, invoke the discovery-research agent
   - Pass the search findings for structured analysis
   - Get market analysis and user research perspective

### Workflow

1. **Search Phase**
   - Use WebSearch with multiple relevant queries
   - Focus on: competitors, trends, best practices, user needs
   - Collect URLs and key information

2. **Analysis Phase**
   - Run `/discovery-research` agent with the findings
   - Request structured analysis of opportunities

3. **Synthesis Phase**
   - Combine WebSearch results with agent analysis
   - Structure into actionable output

### Output Format

```markdown
## Discovery: {topic}

### Executive Summary
[2-3 sentence overview]

### Key Findings
1. [Finding with source]
2. [Finding with source]
3. [Finding with source]
4. [Finding with source]
5. [Finding with source]

### Opportunities Identified
- [Opportunity 1]
- [Opportunity 2]
- [Opportunity 3]

### Sources
- [Link 1]
- [Link 2]
- [Link 3]

### Suggested Next Steps
- [ ] [Action item 1]
- [ ] [Action item 2]
- [ ] [Action item 3]
```

## Example

```
/discover How are other apps handling AI prompt templates and sharing?
```

$ARGUMENTS

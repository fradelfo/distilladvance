# /discover Examples

## Example 1: Competitive Research

**Command:**
```
/discover How are other apps handling AI prompt templates and sharing?
```

**Expected Output:**
```markdown
## Discovery: AI Prompt Templates and Sharing

### Documents Reviewed
Before research, analyzed existing project context:
- ✅ `docs/prd/distill_mvp_prd_v0_1.md` - PRD defines prompt distillation as core feature
- ✅ `docs/strategy/distill_product_research_strategy_v0_1.md` - Strategy targets knowledge workers
- ✅ `docs/research/market-notes.md` - Previous research on PromptBase noted
- ✅ `docs/research/user-insights.md` - Users want "capture and share" workflow

### Executive Summary
The market for AI prompt management is emerging, with solutions ranging from simple prompt libraries to full team collaboration platforms. Key players include PromptBase (marketplace), FlowGPT (community), and enterprise tools like Dust.tt.

**Alignment with PRD:** Our "distill from conversation" approach is differentiated - most competitors require manual prompt creation.

### Key Findings
1. **PromptBase** - Marketplace model for buying/selling prompts, focuses on monetization rather than team use (promptbase.com)
2. **FlowGPT** - Community-driven prompt sharing with upvoting, gamification elements (flowgpt.com)
3. **Dust.tt** - Enterprise focus with workspace management, API access, and team permissions
4. **Langchain Hub** - Developer-focused prompt registry with versioning and composition
5. **OpenAI's GPT Store** - Full applications rather than raw prompts, requires ChatGPT Plus

### Opportunities Identified
- Gap in "capture and distill" workflow - most tools require manual prompt creation
- Team privacy controls are underdeveloped in most solutions
- Browser extension approach is underutilized
- Variable/template systems vary widely in sophistication

### Sources
- https://promptbase.com
- https://flowgpt.com
- https://dust.tt
- https://smith.langchain.com
- https://openai.com/blog/introducing-the-gpt-store

### Suggested Next Steps
- [ ] Analyze Dust.tt's team permission model for inspiration
- [ ] Review FlowGPT's community features for engagement ideas
- [ ] Consider marketplace features for v2 roadmap
```

---

## Example 2: Technology Research

**Command:**
```
/discover Best practices for browser extension authentication with web apps
```

**Expected Output:**
```markdown
## Discovery: Browser Extension Authentication

### Executive Summary
Modern browser extensions use OAuth flows, token exchange, or web app session sharing for authentication. Chrome's Manifest V3 introduces new constraints around background scripts that affect auth patterns.

### Key Findings
1. **OAuth with identity API** - Chrome's chrome.identity API provides built-in OAuth flow (developer.chrome.com)
2. **Token exchange pattern** - Extension opens web app login, receives token via message passing
3. **Cookie sharing** - Extensions can access cookies from permitted domains for session auth
4. **Background service worker limits** - MV3 service workers can't maintain persistent connections
5. **Security best practices** - PKCE flow recommended, avoid storing tokens in local storage

### Opportunities Identified
- Our current NextAuth session can be shared via cookie access
- Consider implementing refresh token rotation for extension
- WebAuthn/passkey support emerging in extensions

### Sources
- https://developer.chrome.com/docs/extensions/reference/identity/
- https://web.dev/articles/passkeys
- https://auth0.com/blog/browser-extension-authentication/

### Suggested Next Steps
- [ ] Audit current extension auth flow against best practices
- [ ] Evaluate chrome.identity API for Google OAuth
- [ ] Document token refresh strategy
```

---

## Example 3: UX Research

**Command:**
```
/discover How do productivity apps handle onboarding for complex features?
```

**Expected Output:**
```markdown
## Discovery: Productivity App Onboarding

### Executive Summary
Leading productivity apps use progressive disclosure, interactive tutorials, and contextual tips rather than upfront comprehensive onboarding. The trend is toward "learn by doing" with just-in-time guidance.

### Key Findings
1. **Notion** - Empty states with templates, contextual slash command hints, optional video tours
2. **Linear** - Keyboard shortcut discovery through command palette, minimal initial setup
3. **Figma** - Interactive first-run experience with guided project creation
4. **Slack** - Slackbot as onboarding companion, progressive feature introduction
5. **Loom** - Record first video immediately, explain features after first success

### Opportunities Identified
- Our onboarding could benefit from "capture first conversation" as immediate value
- Consider empty state templates for prompt library
- Keyboard shortcut hints could improve power user adoption

### Sources
- https://www.reallygoodux.io/categories/onboarding
- https://growth.design/case-studies
- https://www.useronboard.com/user-onboarding-teardowns/

### Suggested Next Steps
- [ ] Map our critical "aha moment" (first successful distillation?)
- [ ] Design empty states for prompts and collections
- [ ] Plan progressive feature disclosure
```

---

## Example 4: Market Trends

**Command:**
```
/discover Emerging trends in AI-assisted developer tools 2024
```

**Expected Output:**
```markdown
## Discovery: AI Developer Tools Trends 2024

### Executive Summary
AI developer tools are shifting from code completion to full autonomous agents, with emphasis on context awareness, multi-file editing, and integration with existing workflows. Privacy and local models are growing concerns.

### Key Findings
1. **Autonomous agents** - Devin, Claude Code, Cursor Agent moving beyond autocomplete to task completion
2. **Context windows** - Models now support 100k-1M tokens, enabling full codebase awareness
3. **Local/private models** - Growing demand for on-premise solutions (Ollama, llama.cpp)
4. **IDE integration** - VS Code and JetBrains deeply integrating AI, not just plugins
5. **Prompt engineering for devs** - System prompts, CLAUDE.md files becoming standard practice

### Opportunities Identified
- Prompt templates for development workflows is adjacent market
- Could position as "prompt management for AI-assisted development"
- Integration with Claude Code, Cursor could be valuable

### Sources
- https://www.cognition-labs.com/introducing-devin
- https://cursor.sh
- https://sourcegraph.com/blog/cody

### Suggested Next Steps
- [ ] Explore developer-focused prompt templates
- [ ] Consider Claude Code integration
- [ ] Research developer community channels
```

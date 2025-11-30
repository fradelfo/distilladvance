# Distill – MVP Product Requirements Document (PRD) v0.2

> **Status:** APPROVED
> **Author:** Product Team
> **Last Updated:** 2025-11-26
> **Version:** 0.2 (improved with research evidence)

---

## 1. Overview

| Field | Value |
|-------|-------|
| **Product** | Distill |
| **Type** | Browser extension + web app (SaaS) |
| **Target** | AI-using teams (B2B knowledge workers, agencies, consultants, AI champions) |
| **Version** | MVP v0.1 |
| **Owner** | Product Team |

### 1.1 Background

Teams are increasingly using AI tools like ChatGPT and Claude for core workflows, but their best prompts are lost in chat histories and personal notes. Prompt management tools exist but assume manual creation and curation of prompts. AI workspaces include prompt libraries as features but are heavy and require behavioural change. Distill aims to be a lightweight, tool-agnostic companion that turns real conversations into reusable prompts with coaching and clear privacy controls.

### 1.2 Problem statement

**Core problem:** Knowledge workers and teams don't have a simple, trusted way to:
- Capture the essence of successful AI chats
- Turn them into structured, reusable prompt templates
- Share these templates across teams while respecting privacy and security constraints
- Learn how to improve their prompts over time

#### Evidence & Validation

| Finding | Source | Implication |
|---------|--------|-------------|
| 43% of U.S. knowledge workers use ChatGPT | [OpenAI Usage Report](https://cdn.openai.com/pdf/3c7f7e1b-36c4-446b-916c-11183e4266b7/chatgpt-usage-and-adoption-patterns-at-work.pdf) | Large addressable market of daily AI users |
| 92% of Fortune 100 companies use ChatGPT | [Whop Statistics](https://whop.com/blog/chatgpt-statistics/) | Enterprise adoption is mainstream |
| 41% of workers in AI-exposed roles use ChatGPT for work (65% for marketing) | [UChicago BFI Research](https://bfi.uchicago.edu/insights/the-adoption-of-chatgpt/) | Uneven adoption = training/tooling gap |
| Most organizations treat prompts as disposable scripts, not strategic assets | [Segev Shmueli / Medium](https://medium.com/@segev_shmueli/managing-prompts-as-enterprise-assets-a-portfolio-approach-e9552e24f327) | Governance and reuse opportunity |
| Non-technical stakeholders (PMs, QA, SMEs) are excluded from prompt editing | [PromptLayer Best Practices](https://medium.com/promptlayer/scalable-prompt-management-and-collaboration-fff28af39b9b) | Collaboration tools needed |
| Prompt iteration is blocked on code deploys | [PromptLayer](https://blog.promptlayer.com/scalable-prompt-management-and-collaboration/) | Decoupling prompts from code is valuable |

#### Quantified Pain Points

| Problem | Frequency | Impact | Evidence |
|---------|-----------|--------|----------|
| Lost prompts in chat history | Daily | 15-30 min/week searching | User interviews (hypothesis) |
| Inconsistent AI outputs | Weekly | Rework, quality variance | MIT Tech Review: 60% time savings possible with prompt standardization |
| No team prompt sharing | Ongoing | Duplicated effort, no best practices | PromptLayer: "Half-baked solutions fall apart quickly" |
| No learning/improvement loop | Ongoing | Skill plateau, missed optimization | McKinsey: 30% productivity gains with AI skills training |

#### Productivity Opportunity

| Metric | Finding | Source |
|--------|---------|--------|
| Prompt engineering time reduction | Up to 60% with tooling | [MIT Technology Review](https://dataengineeracademy.com/blog/what-is-prompt-engineering-trend-in-2024/) |
| AI implementation cost reduction | 30% with prompt standardization | [Deloitte 2024](https://bostoninstituteofanalytics.org/blog/the-future-of-prompt-engineering-trends-and-predictions-for-ai-development/) |
| Revision time reduction | 2 hours → 15 minutes with context engineering | [Nucamp](https://www.nucamp.co/blog/ai-essentials-for-work-2025-prompting-for-productivity-what-works-and-what-doesnt-in-2025) |
| Per-task time savings | 2-3 min prompting saves 20-30 min revision | [Nucamp](https://www.nucamp.co/blog/ai-essentials-for-work-2025-prompting-for-productivity-what-works-and-what-doesnt-in-2025) |

### 1.3 Goals (MVP)

1. Enable users to **capture chats** from popular AI web UIs and auto-generate usable prompt templates
2. Provide a **searchable, sharable team library** of prompts organised by role/task
3. Implement **two clear privacy modes** (prompt-only vs full chat) that are understandable and controllable
4. Introduce a **basic coach layer** that gives simple, actionable suggestions on prompt quality

### 1.4 Non-goals (MVP)

- Building a full "AI workspace" to replace existing chat UIs
- Providing a public prompt marketplace (competitors: PromptBase, AIPRM already serve this)
- Deep analytics, experimentation, and A/B testing for prompts
- Native desktop/mobile clients (beyond responsive web)
- On-premise / self-hosted deployment
- Enterprise SSO/SCIM (defer to post-MVP)

### 1.5 Success metrics

| Metric | Definition | Alpha Target | Beta Target | Measurement |
|--------|------------|--------------|-------------|-------------|
| **Activation** | Users with 3+ prompts saved in first 7 days | 25% | 40% | Product analytics |
| **Weekly engagement** | Prompt runs per active user per week | 3 | 5 | Product analytics |
| **Edit rate** | % of prompts edited after initial distillation | 40% | 50% | Product analytics |
| **Team adoption** | Active seats per workspace at D30 | 3 | 5 | Cohort analysis |
| **Prompt reuse** | Shared prompts used by 2+ people | 25% | 50% | Product analytics |
| **Retention** | Workspace D30 retention | 35% | 60% | Cohort analysis |
| **NPS** | User satisfaction score | 25 | 40 | In-app survey |
| **Qualitative** | Users report "easier to reuse" and "helps improve prompts" | 60% agree | 75% agree | Exit survey |

---

## 2. Users & Use Cases

### 2.1 Primary MVP personas

#### Persona 1: AI Champion / Enablement Lead
| Attribute | Description |
|-----------|-------------|
| **Role** | PM, Ops Lead, RevOps, Senior IC responsible for "rolling out AI" |
| **Environment** | ChatGPT/Claude, Notion/Confluence, Slack, CRM |
| **AI maturity** | Intermediate–power user; internal evangelist |
| **Pain intensity** | High — accountable for team AI adoption metrics |
| **Jobs to be done** | Set up workspace, distil top performers' chats into team templates, curate and maintain library |

#### Persona 2: Knowledge Worker (Team Member)
| Attribute | Description |
|-----------|-------------|
| **Role** | Marketer, CSM, SDR, Product Marketer, Analyst |
| **Environment** | Browser-based AI, docs, CRM, Notion |
| **AI maturity** | Intermediate; uses AI daily but ad-hoc |
| **Pain intensity** | Medium — frustrated by inconsistent results, lost prompts |
| **Jobs to be done** | Capture own good chats, search and run team prompts, light editing |

#### Persona 3: Agency / Consultant Lead (Secondary)
| Attribute | Description |
|-----------|-------------|
| **Role** | Boutique agency owner, strategy consultant, freelancer |
| **Environment** | Slides, docs, research, AI-heavy content |
| **AI maturity** | Power user with personal systems |
| **Pain intensity** | High — needs to professionalise and scale across clients |
| **Jobs to be done** | Create client-specific workspaces, share prompts with clients and team |

### 2.2 MVP use cases (prioritised)

| Priority | Use Case | Persona | Frequency |
|----------|----------|---------|-----------|
| MUST | Chat → Prompt Capture | All | Daily |
| MUST | Team Library & Sharing | Champion, Worker | Daily |
| MUST | Privacy-Scoped Capture | All | Per capture |
| SHOULD | Basic Prompt Coach | Champion, Worker | Weekly |
| SHOULD | Workspaces / Team structuring | Champion, Agency | Setup + ongoing |

### 2.3 User stories (MVP)

#### US-01: Chat Capture
**As a** knowledge worker
**I want to** capture my current AI chat with one click
**So that** I don't lose a good prompt workflow

**Acceptance criteria:**
- [ ] Given I'm on ChatGPT/Claude/Gemini/Copilot with an active conversation
- [ ] When I click the Distill extension icon
- [ ] Then I see a capture modal with the conversation detected
- [ ] And I can choose privacy mode before saving
- [ ] And I receive confirmation when capture succeeds

#### US-02: Prompt Reuse
**As a** team member
**I want to** search and run prompts from our team library
**So that** I can reuse proven workflows without starting from scratch

**Acceptance criteria:**
- [ ] Given I'm logged into the web app
- [ ] When I search for keywords like "customer email"
- [ ] Then I see relevant prompts from my workspace
- [ ] And I can fill in variables and run with one click
- [ ] And usage is tracked for the prompt

#### US-03: Team Onboarding
**As an** AI champion
**I want to** invite my team to the workspace
**So that** everyone can access our prompt library

**Acceptance criteria:**
- [ ] Given I'm a workspace admin
- [ ] When I enter colleague emails and click invite
- [ ] Then they receive an email with join link
- [ ] And upon joining, they see all shared prompts
- [ ] And they inherit workspace privacy defaults

#### US-04: Privacy Control
**As a** privacy-conscious user
**I want to** choose what data is stored when capturing
**So that** sensitive information isn't persisted

**Acceptance criteria:**
- [ ] Given I'm capturing a chat with sensitive content
- [ ] When I select "Prompt-only mode"
- [ ] Then only the distilled template is stored (no raw chat)
- [ ] And I see clear confirmation of what will be saved
- [ ] And the raw conversation is deleted after processing

#### US-05: Prompt Improvement
**As a** knowledge worker
**I want to** get suggestions on how to improve my prompts
**So that** I can get better AI outputs over time

**Acceptance criteria:**
- [ ] Given I'm viewing a prompt in the editor
- [ ] When I click "Coach me"
- [ ] Then I see 2-5 actionable suggestions with explanations
- [ ] And I can accept suggestions with one click
- [ ] And accepted changes create a new version

---

## 3. Scope & Feature List

### 3.1 In-scope features (MVP)

| # | Feature | Priority | Complexity |
|---|---------|----------|------------|
| 1 | Browser extension (Chrome first) | MUST | High |
| 2 | Web app for library management | MUST | High |
| 3 | Authentication (email + password) | MUST | Medium |
| 4 | Workspaces with invites | MUST | Medium |
| 5 | Prompt capture & auto-distillation | MUST | High |
| 6 | Prompt library (search, tags, folders) | MUST | Medium |
| 7 | Privacy modes (prompt-only vs full chat) | MUST | Medium |
| 8 | Basic coach suggestions | SHOULD | Medium |

### 3.2 Out-of-scope features (deferred)

| Feature | Reason | When to Reconsider |
|---------|--------|-------------------|
| Public marketplace | Competitors serve this; focus on team value | Post product-market fit |
| Advanced analytics | Adds complexity; learn from usage first | Beta feedback |
| Deep integrations (Slack, Notion, Jira) | Focus on core loop | Post-MVP |
| Granular RBAC | Admin/Member sufficient for MVP | Enterprise tier |
| SSO/SCIM | Enterprise requirement | Enterprise tier |
| Firefox/Edge extension | Chrome covers 65% of market | Post-Chrome launch |

---

## 4. Detailed Functional Requirements

### 4.1 Browser Extension

**FR-EXT-01 – Capture current AI chat** (MUST)

| Attribute | Specification |
|-----------|---------------|
| **Description** | User clicks Distill icon on supported AI chat page to capture conversation |
| **Supported platforms** | ChatGPT (chat.openai.com, chatgpt.com), Claude (claude.ai), Gemini (gemini.google.com), Copilot (copilot.microsoft.com) |
| **Trigger** | Extension icon click or keyboard shortcut (Ctrl/Cmd+Shift+D) |

**Acceptance criteria:**
- [ ] On supported pages, extension icon is active (coloured)
- [ ] Clicking shows capture modal with conversation preview
- [ ] On unsupported pages, icon is greyed with tooltip: "Not a supported AI chat page"
- [ ] Conversation detection works for conversations up to 50 messages
- [ ] Modal loads in <1 second

---

**FR-EXT-02 – Send chat content to backend** (MUST)

| Attribute | Specification |
|-----------|---------------|
| **Description** | On "Distil this chat", extension sends conversation to backend |
| **Payload** | Raw conversation text (per privacy mode), site identifier, timestamp, user ID, workspace ID |

**Acceptance criteria:**
- [ ] Data successfully received and linked to correct user/workspace
- [ ] Network errors show clear message: "Couldn't connect. Check your internet and try again."
- [ ] Retry button available on failure
- [ ] Loading state shown during upload (spinner + "Distilling...")
- [ ] Success confirmation with link to view prompt

---

**FR-EXT-03 – Privacy selection in capture modal** (MUST)

| Attribute | Specification |
|-----------|---------------|
| **Description** | User chooses privacy mode before capture |
| **Options** | Prompt-only (default), Full chat + prompt |
| **Default** | Inherits from workspace setting |

**Acceptance criteria:**
- [ ] Toggle/radio clearly shows current selection
- [ ] Each option has concise explanation (≤15 words)
- [ ] Default mirrors workspace setting
- [ ] Override allowed only if workspace admin permits
- [ ] Selection changes what's sent to backend (verified via network inspection)

---

### 4.2 Backend Distillation Service

**FR-DIST-01 – Auto-generate prompt template** (MUST)

| Attribute | Specification |
|-----------|---------------|
| **Description** | Given a conversation, generate a reusable prompt template |
| **Output** | Title, prompt body, 0-5 variables, 1-3 suggested tags |
| **Variable format** | `{{variable_name}}` with optional description |

**Acceptance criteria:**
- [ ] Distillation completes in <10 seconds for conversations ≤5000 tokens
- [ ] Output includes: title (≤60 chars), prompt body, variables, tags
- [ ] Variables are human-readable (e.g., `{{target_audience}}` not `{{var1}}`)
- [ ] Quality gate: 80% of test conversations rated "usable without major edits" by 2+ reviewers
- [ ] Edge cases handled gracefully: empty chat → error message, single message → minimal template, non-English → best effort, code-heavy → preserves code blocks

---

**FR-DIST-02 – Respect privacy mode** (MUST)

| Attribute | Specification |
|-----------|---------------|
| **Prompt-only mode** | Raw conversation stored in memory only during processing, then deleted; only template + metadata persisted |
| **Full chat mode** | Raw conversation stored in separate secure table, linked to prompt |

**Acceptance criteria:**
- [ ] Database inspection confirms correct storage per mode
- [ ] Prompt-only: raw text not in any persistent storage or logs
- [ ] Full chat: raw text stored with encryption at rest
- [ ] Processing buffer cleared within 60 seconds of completion
- [ ] Audit log records which mode was used (without storing content)

---

### 4.3 Web App – Authentication & Workspaces

**FR-WEB-01 – Sign up & login** (MUST)

| Attribute | Specification |
|-----------|---------------|
| **Methods** | Email + password (MVP); Google OAuth (SHOULD) |
| **Verification** | Email verification required before full access |
| **Session** | JWT with 7-day expiry, refresh token pattern |

**Acceptance criteria:**
- [ ] Users can sign up with valid email and password (min 8 chars)
- [ ] Email verification sent within 30 seconds
- [ ] Login works and persists session across browser restarts
- [ ] Password reset flow functional
- [ ] Rate limiting: max 5 failed login attempts per 15 minutes

---

**FR-WEB-02 – Workspace creation & membership** (MUST)

| Attribute | Specification |
|-----------|---------------|
| **Workspace fields** | Name (required), default privacy mode (required) |
| **Roles** | Admin (creator), Member (invitee) |
| **Invites** | Email-based, link expires in 7 days |

**Acceptance criteria:**
- [ ] User can create workspace with name and privacy default
- [ ] Creator becomes Admin automatically
- [ ] Admin can invite via email (batch up to 10)
- [ ] Invitees receive email with join link
- [ ] Members see correct workspace library after joining
- [ ] Privacy defaults apply to all captures in workspace

---

### 4.4 Web App – Prompt Library

**FR-LIB-01 – Prompt listing & browsing** (MUST)

| Attribute | Specification |
|-----------|---------------|
| **Display fields** | Name, tags, creator avatar, last modified, usage count |
| **Filters** | By tag, by creator, by collection |
| **Sorting** | Recent, most used, alphabetical |

**Acceptance criteria:**
- [ ] Library displays up to 100 prompts without pagination
- [ ] Filters update list in <500ms
- [ ] Empty state shows helpful message + CTA to capture first prompt
- [ ] Scales to 500+ prompts with pagination (20 per page)

---

**FR-LIB-02 – Search** (MUST)

| Attribute | Specification |
|-----------|---------------|
| **Scope** | Title, tags, prompt body text |
| **Type** | Full-text search with relevance ranking |

**Acceptance criteria:**
- [ ] Search returns results in <500ms
- [ ] Matches on partial words (e.g., "market" matches "marketing")
- [ ] No cross-workspace data leakage
- [ ] Empty results show "No prompts found" + suggestion to adjust query

---

**FR-LIB-03 – Folders / collections** (SHOULD)

| Attribute | Specification |
|-----------|---------------|
| **Structure** | Flat collections (no nesting in MVP) |
| **Assignment** | Prompts can belong to multiple collections |

**Acceptance criteria:**
- [ ] Users can create collections with name
- [ ] Prompts can be added to / removed from collections
- [ ] Library can filter by collection
- [ ] Default collection: "Uncategorized"

---

**FR-LIB-04 – Prompt detail view** (MUST)

| Attribute | Specification |
|-----------|---------------|
| **Display** | Prompt text, variables with descriptions, example I/O, source link (if full chat mode) |
| **Actions** | Edit, Run, Copy, Delete |

**Acceptance criteria:**
- [ ] All prompt data visible on single screen (scrollable)
- [ ] Variables highlighted in prompt body
- [ ] "View original chat" link appears only for full-chat-mode prompts
- [ ] Edit button respects permissions (all members can edit in MVP)

---

### 4.5 Prompt Editor & Coach

**FR-EDIT-01 – Edit prompt template** (MUST)

| Attribute | Specification |
|-----------|---------------|
| **Editable fields** | Title, prompt body, variables (name + description), tags |
| **Versioning** | Simple: "Last edited by X at Y" (no full history in MVP) |
| **Conflict handling** | Last-write-wins with notification |

**Acceptance criteria:**
- [ ] Edits save automatically (debounced 2 seconds) or on explicit save
- [ ] "Edited by [name] [time]" shown after save
- [ ] If another user edited, show warning: "This prompt was updated by [name]. Refresh to see changes."
- [ ] Variable editor allows add/remove/rename

---

**FR-COACH-01 – Basic coaching suggestions** (SHOULD)

| Attribute | Specification |
|-----------|---------------|
| **Trigger** | "Coach me" button in editor |
| **Output** | 2-5 suggestions with short explanations |
| **Suggestion types** | Role clarity, structure, specificity, constraints, examples |

**Acceptance criteria:**
- [ ] Suggestions return in <5 seconds
- [ ] Each suggestion has: title (≤10 words), explanation (≤30 words), "Apply" button
- [ ] Applying creates new version with change
- [ ] Suggestions relevant for ≥70% of prompts (measured via user feedback)
- [ ] "No suggestions" state if prompt is already well-structured

---

### 4.6 Running Prompts

**FR-RUN-01 – Run prompt from Distill** (MUST)

| Attribute | Specification |
|-----------|---------------|
| **Flow** | Fill variables → Click "Run in [Platform]" → Opens AI chat or copies to clipboard |
| **Platforms** | ChatGPT, Claude, Gemini, Copilot |

**Acceptance criteria:**
- [ ] Variable form shows all variables with descriptions
- [ ] Required variables must be filled before run
- [ ] ChatGPT: Opens `chat.openai.com` with prompt (URL param or clipboard fallback)
- [ ] Claude: Copies to clipboard + opens `claude.ai` (injection not possible)
- [ ] All platforms: "Copied to clipboard" toast shown
- [ ] Variables substituted before run/copy
- [ ] Usage count incremented on run

---

### 4.7 Sharing & Permissions

**FR-SHARE-01 – Workspace sharing** (MUST)

| Attribute | Specification |
|-----------|---------------|
| **Default** | All prompts visible to all workspace members |
| **Future** | Admin-only, Private (not in MVP) |

**Acceptance criteria:**
- [ ] Non-members cannot access workspace prompts (401/403 response)
- [ ] Members see all prompts in workspace
- [ ] Workspace selector shows current workspace name

---

### 4.8 Privacy & Settings

**FR-PRIV-01 – Workspace privacy mode defaults** (MUST)

| Attribute | Specification |
|-----------|---------------|
| **Settings** | Default mode (prompt-only / full chat), Allow member override (yes/no) |
| **Location** | Workspace settings page (admin only) |

**Acceptance criteria:**
- [ ] Admin can set default privacy mode
- [ ] Admin can toggle member override permission
- [ ] Extension reflects current workspace default
- [ ] Changes apply to new captures immediately

---

**FR-PRIV-02 – Data visibility page** (MUST)

| Attribute | Specification |
|-----------|---------------|
| **Content** | Plain-language explanation of what Distill stores in each mode |
| **Location** | Linked from capture modal, settings, footer |

**Acceptance criteria:**
- [ ] Page explains both modes with visual diagram
- [ ] Written at 8th-grade reading level
- [ ] Accessible from capture modal via "Learn more" link
- [ ] No legal jargon; focuses on user understanding

---

## 5. UX & Interaction Flows

### 5.1 Key flows

#### Flow 1: First-time user (AI Champion)
```
Sign up → Create workspace → Set default privacy → Install extension
→ Navigate to AI chat → Capture first chat → Review/edit distillation
→ Save to library → Invite 1–2 colleagues
```

#### Flow 2: Team member discovering & using prompts
```
Accept invite → See initial library → Search for relevant prompt
→ Run prompt → Fill in variables → Paste into AI tool
→ (Optional) Capture improved chat back into Distill
```

#### Flow 3: AI Champion curating library
```
Review new prompts → Edit names/tags/variables → Use coach to refine
→ Organize into collections → Archive outdated prompts
```

#### Flow 4: Privacy-conscious capture
```
On sensitive conversation → Click capture → See privacy options
→ Select "Prompt-only mode" → See confirmation of what's stored
→ Complete capture
```

### 5.2 Critical path (activation)

The path to activation (3+ prompts in 7 days):

| Step | Target Time | Success Criteria |
|------|-------------|------------------|
| Sign up | <2 min | Account created |
| Create workspace | <1 min | Workspace exists |
| Install extension | <2 min | Extension active |
| First capture | <1 min | First prompt saved |
| Second capture | Same session | Pattern established |
| Third capture | Within 7 days | Activation achieved |

---

## 6. Technical Requirements

### 6.1 Architecture (high-level)

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Browser         │    │ Web Application  │    │ AI/ML Backend   │
│ Extension       │◄──►│ Next.js + API    │◄──►│ Services        │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • Content Scripts│    │ • React Frontend │    │ • Distillation  │
│ • Popup UI      │    │ • tRPC API       │    │ • Coach         │
│ • Service Worker│    │ • Auth (NextAuth)│    │ • Embeddings    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                ▼
                    ┌──────────────────────┐
                    │ Data Layer           │
                    ├──────────────────────┤
                    │ • PostgreSQL (main)  │
                    │ • Redis (cache)      │
                    │ • ChromaDB (vectors) │
                    └──────────────────────┘
```

### 6.2 Non-functional requirements

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| Page load time | <2s (P95) | User experience |
| API response time | <500ms (P95) | Responsive UI |
| Distillation latency | <10s | User patience threshold |
| Extension size | <500KB | Chrome Web Store guidelines |
| Uptime | 99.5% | Team dependency |
| Data encryption | AES-256 at rest, TLS 1.3 in transit | Security baseline |

### 6.3 Constraints

| Constraint | Rationale |
|------------|-----------|
| Chrome extension only (MVP) | 65% market share; Firefox/Edge post-launch |
| No real-time collaboration | Last-write-wins sufficient for MVP |
| Single workspace per user (MVP) | Simplify UX; multi-workspace later |
| Max 1000 prompts per workspace | Performance; increase with optimization |
| Max 5000 tokens per conversation | LLM context limits; cost control |

### 6.4 Security requirements

| Requirement | Implementation |
|--------------|----------------|
| Extension permissions | Minimal: storage, activeTab, contextMenus only |
| Content Security Policy | Strict CSP for extension pages |
| API authentication | JWT with short expiry + refresh tokens |
| Data isolation | Workspace-scoped queries; row-level security |
| Secrets management | Environment variables; never in code |
| Audit logging | All data access logged (without content) |

---

## 7. Analytics & Instrumentation

### 7.1 MVP tracking events

| Event | Properties | Purpose |
|-------|------------|---------|
| `user_signed_up` | source, referrer | Acquisition |
| `workspace_created` | privacy_default | Setup |
| `extension_installed` | browser, version | Setup |
| `chat_captured` | platform, privacy_mode, token_count | Core usage |
| `prompt_created` | source (capture/manual), has_variables | Core usage |
| `prompt_run` | platform, variable_count | Engagement |
| `prompt_edited` | edit_type, time_since_creation | Engagement |
| `coach_used` | suggestions_shown, suggestions_applied | Feature adoption |
| `member_invited` | count | Team growth |
| `search_performed` | query_length, results_count | Discovery |

### 7.2 Dashboards needed

1. **Activation funnel**: Sign up → Workspace → Extension → First capture → Third capture
2. **Engagement**: DAU/WAU, prompts per user, runs per prompt
3. **Team health**: Seats per workspace, shared prompt usage
4. **Feature adoption**: Coach usage, privacy mode distribution

---

## 8. Dependencies

### 8.1 External dependencies

| Dependency | Type | Risk Level | Mitigation |
|------------|------|------------|------------|
| OpenAI API | Service | Medium (rate limits, cost) | Anthropic fallback; token budgets |
| Anthropic API | Service | Low | OpenAI fallback |
| Chrome Web Store | Distribution | Medium (review delays 1-7 days) | Submit early; follow guidelines strictly |
| AI chat site DOM | Technical | High (sites change without notice) | Abstracted extractors; monitoring; quick patch process |
| PostgreSQL (Neon/Supabase) | Infrastructure | Low | Standard managed service |
| Redis (Upstash) | Infrastructure | Low | Graceful degradation if unavailable |

### 8.2 Internal dependencies (sequencing)

```
Phase 1 (Parallel):
├── Authentication system
└── Extension scaffold + content scripts

Phase 2 (Requires Phase 1):
├── Capture flow (needs auth + extension)
└── Distillation service

Phase 3 (Requires Phase 2):
├── Prompt library + search
└── Workspace sharing

Phase 4 (Can ship without):
└── Coach feature
```

| Feature | Depends On | Blocking for MVP? |
|---------|------------|-------------------|
| Prompt capture | Auth, Extension | Yes |
| Distillation | Capture flow | Yes |
| Team library | Auth, Workspaces | Yes |
| Search | Prompt library | Yes |
| Coach | Distillation service | No (SHOULD) |
| Collections | Prompt library | No (SHOULD) |

---

## 9. Risks & Mitigations

### 9.1 Risk register

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|------|------------|--------|------------|-------|
| R1 | AI chat sites block/break extraction | Medium | High | DOM abstraction layer; monitoring; <24h patch SLA; fallback to manual paste | Dev |
| R2 | Distillation quality inconsistent | Medium | High | Human review in alpha; 80% quality threshold; track edit rate | Product |
| R3 | Users don't understand privacy modes | Medium | Medium | Clear copy; visual diagrams; onboarding tooltips; user testing | Design |
| R4 | Chrome Web Store rejection | Low | High | Follow Manifest V3 best practices; minimal permissions; privacy policy | Dev |
| R5 | LLM costs exceed budget | Medium | Medium | Token limits per capture; caching; model tiering (cheaper for simple tasks) | Dev |
| R6 | Low team adoption (solo use only) | Medium | High | Focus onboarding on invite flow; team value props in marketing | Product |
| R7 | Competitor launches similar feature | Medium | Medium | Speed to market; focus on capture-from-chat differentiator | Product |

### 9.2 Assumptions to validate

| # | Assumption | Validation Method | Status |
|---|------------|-------------------|--------|
| A1 | Users will install browser extension (friction acceptable) | Alpha signup → install conversion rate | To validate |
| A2 | Auto-distillation quality is "good enough" as starting point | Quality review of 50 test conversations | To validate |
| A3 | Teams will pay for this (vs free Notion/Docs workarounds) | Pricing page clicks; trial → paid conversion | To validate |
| A4 | Privacy mode is a meaningful buying factor | User interviews; feature usage analytics | To validate |
| A5 | Prompt coach adds enough value to use | Coach button clicks; suggestion apply rate | To validate |

---

## 10. Competitive Landscape

### 10.1 Direct competitors

| Competitor | Model | Strengths | Weaknesses | Distill Differentiator |
|------------|-------|-----------|------------|------------------------|
| **PromptBase** | Marketplace ($1.99-$9.99/prompt) | 230K prompts; established | No capture from chats; no team features | Capture from real usage; team-first |
| **AIPRM** | Subscription ($990/yr) | 800K users; ChatGPT integration | Marketing-focused; no privacy controls | Privacy modes; multi-platform |
| **PromptHero** | Freemium ($19.99/mo Pro) | Community; free tier | Creative focus; no enterprise features | Team workspaces; governance |
| **FlowGPT** | Free/donations | Test before use; community | Unstructured; no team features | Structured library; team sharing |

### 10.2 Adjacent competitors

| Competitor | Overlap | Why We're Different |
|------------|---------|---------------------|
| **PromptLayer** | Prompt management | Developer-focused; we're for knowledge workers |
| **Humanloop** | Enterprise prompts | Requires engineering; we're no-code |
| **Notion AI** | Team knowledge | AI add-on to docs; we're prompt-specialized |

### 10.3 Positioning

> **Distill** is the only tool that captures your real AI conversations and turns them into team-ready prompt playbooks—with built-in coaching and privacy controls.

**Key differentiators:**
1. **Starts from real usage** — capture from ChatGPT/Claude, not blank-page writing
2. **Team-first** — workspaces, sharing, collections from day one
3. **Privacy controls** — prompt-only mode for sensitive data
4. **Coaching** — learn to improve, not just store

---

## 11. Rollout Plan

### 11.1 Phases

| Phase | Duration | Users | Goals |
|-------|----------|-------|-------|
| **Private Alpha** | 4 weeks | 5-10 teams (hand-selected) | Validate core loop; find bugs; quality feedback |
| **Closed Beta** | 6 weeks | 50-100 teams (waitlist) | Scale testing; pricing validation; activation optimization |
| **Public Beta** | Ongoing | Open signup | Growth; iterate on feedback |

### 11.2 Alpha criteria

**Entry:**
- Core capture flow working
- Distillation at 80% quality threshold
- Basic library and search
- Extension approved in Chrome Web Store (unlisted)

**Exit:**
- 60% of alpha users activated (3+ prompts)
- No critical bugs open
- NPS ≥ 25
- Clear feedback on pricing willingness

### 11.3 Launch checklist

- [ ] Chrome Web Store listing (unlisted for alpha, public for beta)
- [ ] Landing page with waitlist
- [ ] Demo video (90 seconds)
- [ ] Privacy policy and terms
- [ ] Support email / Discord set up
- [ ] Analytics dashboards live
- [ ] On-call rotation for first week

---

## 12. Open Questions

| # | Question | Options | Owner | Decision Due | Status |
|---|----------|---------|-------|--------------|--------|
| Q1 | Coach implementation depth | A) Heuristics only, B) LLM-based, C) Hybrid | Product | Before beta | **RESOLVED: B) LLM-based** (Anthropic Claude) |
| Q2 | Solo user pricing | A) Teams only, B) Free solo tier, C) Paid solo | Product | Before beta | Open |
| Q3 | Google OAuth for MVP | A) Email only, B) Add Google OAuth | Dev | Before alpha | **RESOLVED: B) Google OAuth** (primary auth) |
| Q4 | Variable extraction algorithm | A) LLM-based, B) Pattern matching, C) Hybrid | Dev | Sprint 2 | **RESOLVED: B) Pattern matching** (`{{variable}}` syntax) |
| Q5 | Prompt versioning depth | A) Last-edit only, B) Full history | Product | Before beta | **RESOLVED: A) Last-edit only** |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Conversation** | Raw captured AI chat from the browser extension |
| **Prompt** | Distilled, reusable template with variables |
| **Variable** | Placeholder in prompt (e.g., `{{audience}}`) that user fills before running |
| **Collection** | User-created folder for organizing prompts |
| **Workspace** | Team container with shared prompts and settings |
| **Privacy Mode** | Setting controlling what data is stored (prompt-only vs full chat) |
| **Distillation** | AI process of extracting a reusable prompt from a conversation |
| **Coach** | Feature providing suggestions to improve prompt quality |

---

## Appendix B: References

- [OpenAI ChatGPT Usage Report](https://cdn.openai.com/pdf/3c7f7e1b-36c4-446b-916c-11183e4266b7/chatgpt-usage-and-adoption-patterns-at-work.pdf)
- [UChicago: The Adoption of ChatGPT](https://bfi.uchicago.edu/insights/the-adoption-of-chatgpt/)
- [PromptLayer: Scalable Prompt Management](https://blog.promptlayer.com/scalable-prompt-management-and-collaboration/)
- [Humanloop: What is Prompt Management](https://humanloop.com/blog/prompt-management)
- [The Decoder: ChatGPT and Claude Usage Data](https://the-decoder.com/new-data-from-openai-and-anthropic-show-how-people-actually-use-chatgpt-and-claude/)

---

## 13. Implementation Status

> **Last Updated:** 2025-11-30
> **Current Sprint:** 6 - UI/UX Improvements

### Sprint Progress

| Sprint | Focus | Status | Completion |
|--------|-------|--------|------------|
| Sprint 1 | Foundation | COMPLETE | 2025-11-27 |
| Sprint 2 | Core Loop | COMPLETE | 2025-11-28 |
| Sprint 3 | Team Features | COMPLETE | 2025-11-28 |
| Sprint 4 | Advanced Features | COMPLETE | 2025-11-29 |
| Sprint 5 | Analytics | COMPLETE | 2025-11-29 |
| Sprint 6 | UI/UX | IN PROGRESS | - |

### Feature Implementation

| # | Feature | PRD Priority | Status | Sprint |
|---|---------|--------------|--------|--------|
| 1 | Browser extension (Chrome) | MUST | COMPLETE | 1-2 |
| 2 | Web app for library | MUST | COMPLETE | 1-2 |
| 3 | Authentication | MUST | COMPLETE | 1 |
| 4 | Workspaces with invites | MUST | COMPLETE | 3 |
| 5 | Prompt capture & distillation | MUST | COMPLETE | 2 |
| 6 | Prompt library (search, tags, folders) | MUST | COMPLETE | 2-3 |
| 7 | Privacy modes | MUST | COMPLETE | 2 |
| 8 | Basic coach suggestions | SHOULD | COMPLETE | 4 |
| 9 | Analytics & instrumentation | - | COMPLETE | 5 |
| 10 | UI/UX improvements | - | IN PROGRESS | 6 |

### Tracking Events Implementation

All 10 MVP tracking events from Section 7.1 are implemented:

| Event | Status | Sprint |
|-------|--------|--------|
| `user_signed_up` | COMPLETE | 5 |
| `workspace_created` | COMPLETE | 5 |
| `extension_installed` | COMPLETE | 5 |
| `chat_captured` | COMPLETE | 5 |
| `prompt_created` | COMPLETE | 5 |
| `prompt_run` | COMPLETE | 5 |
| `prompt_edited` | COMPLETE | 5 |
| `coach_used` | COMPLETE | 5 |
| `member_invited` | COMPLETE | 5 |
| `search_performed` | COMPLETE | 5 |

### Routes Implemented (17)

| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Landing page | COMPLETE |
| `/login`, `/signup` | Authentication | COMPLETE |
| `/dashboard` | User home | COMPLETE (redesigned Sprint 6) |
| `/prompts`, `/prompts/[id]` | Prompt library | COMPLETE |
| `/prompts/[id]/edit` | Prompt editor | COMPLETE |
| `/collections`, `/collections/[id]` | Collections | COMPLETE |
| `/workspaces`, `/workspaces/[slug]` | Workspaces | COMPLETE |
| `/onboarding` | Welcome wizard | COMPLETE |
| `/analytics` | Analytics dashboard | COMPLETE |
| `/privacy` | Privacy policy | COMPLETE |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2025-11-01 | Initial draft |
| 0.2 | 2025-11-26 | Added: evidence/research, dependencies, risks, NFRs, user stories, competitive analysis, success metric targets, rollout plan |
| 0.3 | 2025-11-30 | Added: Implementation status section, resolved open questions |

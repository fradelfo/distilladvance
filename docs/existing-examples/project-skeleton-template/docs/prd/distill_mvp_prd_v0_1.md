# Distill – MVP Product Requirements Document (PRD) v0.1

## 1. Overview

- **Product**: Distill  
- **Type**: Browser extension + web app (SaaS)  
- **Target**: AI-using teams (knowledge workers in B2B SaaS, agencies, consultants, AI champions)  
- **Version**: MVP v0.1  
- **Owner**: (TBD)  

### 1.1 Background

Teams are increasingly using AI tools like ChatGPT and Claude for core workflows, but their best prompts are lost in chat histories and personal notes. Prompt management tools exist but assume manual creation and curation of prompts. AI workspaces include prompt libraries as features but are heavy and require behavioural change. Distill aims to be a lightweight, tool-agnostic companion that turns real conversations into reusable prompts with coaching and clear privacy controls.

### 1.2 Problem statement

Knowledge workers and teams don’t have a simple, trusted way to:

- Capture the essence of successful AI chats.
- Turn them into structured, reusable prompt templates.
- Share these templates across teams while respecting privacy and security constraints.
- Learn how to improve their prompts over time.

### 1.3 Goals (MVP)

- Enable users to **capture chats** from popular AI web UIs and auto-generate usable prompt templates.
- Provide a **searchable, sharable team library** of prompts organised by role/task.
- Implement **two clear privacy modes** (prompt-only vs full chat) that are understandable and controllable.
- Introduce a **basic coach layer** that gives simple, actionable suggestions on prompt quality.

### 1.4 Non-goals (MVP)

- Building a full “AI workspace” to replace existing chat UIs.
- Providing a public prompt marketplace.
- Deep analytics, experimentation, and A/B testing for prompts.
- Native desktop/mobile clients (beyond responsive web).
- On-premise / self-hosted deployment (beyond generic “data residency” planning).

### 1.5 Success metrics (early)

- **Activation**:  
  - % of new users who capture at least 3 chats and save 3+ prompts in the first 7 days.
- **Engagement**:  
  - # of prompt runs per active user per week.  
  - % of prompts with at least one edit after initial distillation.
- **Team adoption**:  
  - # of active seats per workspace after 30 days.  
  - # of shared prompts used by >2 people.
- **Retention**:  
  - Day-30 retention of workspaces (team still active).
- **Qualitative**:  
  - Users reporting that Distill makes prompts “easier to reuse” and “helps me improve my prompts”.

---

## 2. Users & use cases (MVP focus)

### 2.1 Primary MVP personas

1. **AI Champion / Enablement Lead**
   - Sets up the workspace, defines defaults (privacy mode, folder structure).
   - Distils top performers’ chats into team templates.
   - Curates and maintains the library.

2. **Knowledge Worker (Team Member)**
   - Captures their own chats when they stumble on good workflows.
   - Searches and runs prompts from the team library.
   - Lightly edits and gives feedback.

3. **Agency / Consultant Lead** (secondary)
   - Creates client-specific workspaces or folders.
   - Shares selected prompts with clients and internal team.

### 2.2 MVP use cases

MVP focuses on:

1. **Chat → Prompt Capture** (MUST)  
2. **Team Library & Sharing** (MUST)  
3. **Privacy-Scoped Capture** (MUST)  
4. **Basic Prompt Coach** (SHOULD)  
5. **Workspaces / Client & Team structuring** (SHOULD)  

---

## 3. Scope & feature list

### 3.1 In-scope features (MVP)

1. **Browser extension (Chrome first; others later)**
2. **Web app for library management and prompt running**
3. **Authentication & workspaces**
4. **Prompt capture & auto-distillation**
5. **Prompt library (search, tags, folders)**
6. **Privacy modes (prompt-only vs full chat)**
7. **Basic coach suggestions in the editor**

### 3.2 Out-of-scope features (for now)

- Public sharing/marketplace beyond controlled share links.
- Advanced analytics and reporting.
- Deep integrations (Slack, Notion, Jira, etc.)—beyond possibly generic share links.
- Granular RBAC (keep it simple at first: Admin, Member).

---

## 4. Detailed functional requirements

Below: requirement IDs + priority (MUST/SHOULD/LATER) and acceptance criteria.

### 4.1 Browser extension

**FR-EXT-01 – Capture current AI chat** (MUST)  
- User clicks Distill icon while on a supported AI chat page (ChatGPT, Claude, Gemini).
- Extension reads visible conversation (within allowed permissions).
- Opens a capture modal overlay.

*Acceptance:*
- On supported pages, extension icon is active and clicking it shows capture modal with the conversation detected.
- On unsupported pages, extension shows a helpful message (“Not a supported AI chat page yet”).

---

**FR-EXT-02 – Send chat content to backend** (MUST)  
- On “Distil this chat” in modal, extension sends:
  - Raw conversation text (subject to privacy selection).
  - Metadata: site, timestamp, user ID, workspace ID.

*Acceptance:*
- Chat data is successfully received by backend and linked to the correct user/workspace.
- Errors (e.g. network) are surfaced clearly in the UI.

---

**FR-EXT-03 – Privacy selection in capture modal** (MUST)  
- Within the capture modal, user can choose:
  - Prompt-only mode (default, configurable at workspace level).
  - Full chat + prompt mode.
- Display concise explanation per mode.

*Acceptance:*
- Changing the selection changes what’s sent to the backend.
- Default mirrors workspace setting but can be overridden (if allowed by admin settings).

---

### 4.2 Backend distillation service

**FR-DIST-01 – Auto-generate prompt template** (MUST)  
- Given a conversation, the service:
  - Identifies the key “final” prompts / instructions.
  - Produces a single consolidated prompt (or a system+user prompt pair if desired).
  - Suggests variables (slots) based on common patterns (e.g. [audience], [product], [tone]).
  - Generates a default name and tags.

*Acceptance:*
- For ≥80% of test conversations, internal reviewers say the template is a “good starting point” that captures the core intent.
- Variables are human-readable and editable.

---

**FR-DIST-02 – Respect privacy mode** (MUST)  
- If Prompt-only mode is selected:
  - Raw conversation text is not stored persistently (or stored in a short-lived buffer for processing only).
  - Only the distilled template, metadata and minimal derived info are stored.
- If Full chat mode:
  - Raw conversation is stored and linked to the prompt for reference.

*Acceptance:*
- Data inspection in DB/logs shows correct storage behaviour.
- System logs do not retain PII beyond necessary processing where prompt-only mode is chosen.

---

### 4.3 Web app – authentication & workspaces

**FR-WEB-01 – Sign up & login** (MUST)  
- Email + password sign-up.
- Basic email verification.
- Optionally, social/professional SSO (LATER).

*Acceptance:*
- Users can sign up, login, and stay logged in via session/token.

---

**FR-WEB-02 – Workspace creation & membership** (MUST)  
- A user can create a workspace.
- Workspace has:
  - Name.
  - Default privacy mode.
- Creator is Admin by default.
- Admin can invite others via email (basic role: Member).

*Acceptance:*
- Members see the correct workspace library.
- Privacy defaults apply to all workspace members unless admin overrides.

---

### 4.4 Web app – prompt library

**FR-LIB-01 – Prompt listing & browsing** (MUST)  
- Users can view a list of prompts in their workspace.
- Prompts show: name, tags, creator, last modified, last used (if available).
- Basic filters by tag, creator, and folder.

*Acceptance:*
- Library scales to at least a few hundred prompts with responsive UI.
- Filters and search update the list quickly (<500ms for typical sizes).

---

**FR-LIB-02 – Search** (MUST)  
- Text search across prompt titles, tags, and body text.

*Acceptance:*
- Searching for key words returns relevant prompts.
- No access to prompts from other workspaces.

---

**FR-LIB-03 – Folders / collections** (SHOULD)  
- Admins/members can create folders or “collections” (e.g. “CSM / QBRs”, “Marketing / Ads”).
- Prompts can live in one or more collections.

*Acceptance:*
- Users can move prompts between collections.
- Library can filter by collection.

---

**FR-LIB-04 – Prompt detail view** (MUST)  
- Clicking a prompt opens a detail/editor view showing:
  - Prompt text.
  - Variables (with descriptions).
  - Example input(s) & output(s).
  - Optional: link to original chat (if full chat mode enabled).

*Acceptance:*
- Users can see all relevant info and edit fields (subject to permissions).

---

### 4.5 Prompt editor & coach

**FR-EDIT-01 – Edit prompt template** (MUST)  
- Users can edit:
  - Prompt text.
  - Variables/slots.
  - Name, tags, descriptions.
- Changes are versioned at least at a simple “last edited by X at time Y” level.

*Acceptance:*
- Edits persist and are visible to others in the workspace.
- Conflicts are handled with last-write-wins and clear “edited by” info.

---

**FR-COACH-01 – Basic coaching suggestions** (SHOULD)  
- Within editor, user can click “Coach me”.
- System returns:
  - 2–5 suggestions (e.g. “Add a clearer role statement”, “Split multiple objectives into bullet points”, “Add constraints on length/format”).
  - Short explanation for each suggestion.

*Acceptance:*
- Suggestions are relevant for ≥70% of tested prompts.
- Users can accept/reject suggestions with one click (creating a new edited version).

---

### 4.6 Running prompts

**FR-RUN-01 – Run prompt from Distill** (MUST)  
- From prompt detail, user can:
  - Fill in variables in a simple form.
  - Click “Run in [ChatGPT/Claude/etc.]”.
- System opens the AI chat in a new tab with prompt pre-filled (where possible) OR copies prompt to clipboard with a “copied” confirmation.

*Acceptance:*
- For supported tools, prompt is correctly injected or easily pasted.
- If technical injection isn’t feasible, fallback (copy to clipboard) works reliably.

---

### 4.7 Sharing & permissions

**FR-SHARE-01 – Workspace sharing** (MUST)  
- Prompts are visible to all workspace members by default.
- Admin can mark some prompts as “Admin-only” or “Private” (for future features).

*Acceptance:*
- Non-members cannot access workspace prompts.
- Members see all non-private prompts.

---

**FR-SHARE-02 – Share link (optional)** (LATER / nice-to-have)  
- Ability to generate a view-only link for a prompt that can be shared outside the workspace.

---

### 4.8 Privacy & settings

**FR-PRIV-01 – Workspace privacy mode defaults** (MUST)  
- Admin can set:
  - Default: Prompt-only or Full chat.
  - Whether members can override at capture time.

*Acceptance:*
- New captures respect defaults.
- UI in extension clearly displays the current default and whether override is allowed.

---

**FR-PRIV-02 – Data visibility page** (MUST)  
- Simple “What Distill Stores” page:
  - For prompt-only mode.
  - For full chat mode.
- Written in plain language.

*Acceptance:*
- Page is easy to find and understandable; can be linked in modals and onboarding.

---

## 5. UX & interaction flows (MVP)

### 5.1 Key flows

1. **First-time user (AI Champion)**
   - Sign up → Create workspace → Set default privacy → Install extension → Capture first chat → Review/edit distillation → Save to library → Invite 1–2 colleagues.

2. **Team member discovering & using prompts**
   - Accept invite → See initial library (starter collections) → Run a prompt → Fill in variables → Paste into AI tool → Optionally capture improved chat back into Distill.

3. **AI Champion curating library**
   - Review new prompts → Merge duplicates → Edit/clean names, tags, variables → Use coach to refine prompts → Organise into collections.

4. **Privacy-conscious user capturing chat**
   - On sensitive conversation → Capture → Select “Prompt-only mode” → Confirm and see summary of what’s stored.

---

## 6. Technical & architectural notes (high-level)

- **Frontend**:  
  - Web app: Next.js / React + design system.  
  - Extension: Chrome first; re-use React components where possible.

- **Backend**:  
  - API: Node/NestJS with endpoints for auth, workspaces, prompts, coach.  
  - LLM: Model-agnostic where possible (Claude / OpenAI / etc. via a thin LLM service).  
  - Storage:  
    - Prompt templates & metadata in relational DB.  
    - Raw chats (where enabled) in a secure store; consider separate table/bucket with stricter access.

- **Security / Privacy**:  
  - Minimal scopes for extension permissions.  
  - HTTPS everywhere; secure credentials storage.  
  - Data retention policies, especially for prompt-only mode (quick deletion of raw input post-processing).

---

## 7. Analytics & instrumentation

For MVP, track:

- # sign-ups, # workspaces created.
- # of chats captured per user.
- # of prompts created, edited, and run.
- Privacy mode distribution (how many capture events in each mode).
- Team size distribution and active seats per workspace.
- Qualitative in-app feedback (simple “This prompt was helpful / Not helpful”).

---

## 8. Rollout & open questions

### 8.1 Rollout idea

- **Private alpha** with ~5–10 teams:
  - Mix of AI-heavy teams (e.g. marketing, CS, agencies).
  - Direct onboarding calls, guided setup.
- **Beta waitlist**:
  - Landing page with clear messaging and demo video.
  - Emphasis on “distill your chats into prompt playbooks” and privacy choices.

### 8.2 Open questions

- Which AI chat tools to support first beyond ChatGPT & Claude? (e.g. Gemini, Perplexity, others.)
- How deep should the first version of the coach be? (Simple static heuristics vs LLM-based critique.)
- Do you want to support **SSO / SCIM** or advanced enterprise features in v1, or postpone them until you find fit?
- Should solo users have a cheap/easy entry point, or is the product explicitly “teams-only” from day one?

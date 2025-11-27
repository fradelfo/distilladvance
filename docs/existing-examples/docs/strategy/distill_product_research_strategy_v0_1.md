# Distill – Product Research & Strategy v0.1

## 1. Concept overview

Distill is a browser extension and web app that turns long, messy AI chats (e.g. in ChatGPT, Claude, Gemini) into clean, reusable prompt templates. It extracts the “essence” of a successful interaction—prompt text, variables, tags, examples—and stores it in a searchable, sharable library for individuals and teams. Users can then re-run, tweak, and improve these prompts, aided by a “coach” layer that explains why prompts work and how to refine them. Distill also offers privacy modes, allowing teams to store either full conversations + prompts or only distilled prompts + metadata.

---

## 2. Core problems & category

### 2.1 Core problems Distill solves

- **Prompt sprawl & loss**  
  Good prompts live across chat histories, docs, screenshots, bookmarks, and people’s heads.

- **Lack of reusability & standardisation**  
  Even great prompts are used once and forgotten; there’s no shared library with variables, examples, or role-based context.

- **No team-wide prompt governance**  
  Teams can’t easily codify “how we use AI here” into playbooks and libraries.

- **No learning layer**  
  Most tools provide prompts, but don’t explain *why* they’re good or how to adapt them.

### 2.2 Category placement (overlapping)

- **Prompt management / prompt library for teams**
- **AI productivity / AI workspace companion**
- **Lightweight knowledge management (AI playbooks / SOPs)**

Distill is best framed as:

> A **team prompt OS** that sits on top of existing AI tools, turning real conversations into reusable, coached prompt playbooks with clear privacy control.

---

## 3. Market & landscape (high-level)

### 3.1 Adjacent product categories

- **Prompt libraries & marketplaces**  
  Community collections and marketplaces of prompts (e.g. SEO, marketing, coding). Typically focused on public, generic prompts of varying quality.

- **Prompt management tools**  
  SaaS tools + extensions for saving, tagging, and reusing prompts; some offer team features (folders, access control, variables).

- **AI workspaces / “AI OS” tools**  
  Full AI frontends aggregating multiple models, chat UIs, file tools, and often including a built-in prompt library as one feature.

- **Knowledge tools with AI features**  
  Note-taking / documentation apps that incorporate reusable prompts and templates as part of knowledge workflows.

### 3.2 Observed patterns (macro trends)

- Strong, repeated pain around **losing prompts** in chat histories and notes, leading to many homegrown systems (Notion tables, docs, spreadsheets).
- Growing interest in **team-level AI enablement**: standardising prompts, tone, workflows, and training new joiners with AI playbooks.
- Prompt libraries are often **manual**: users must create, structure, and maintain templates themselves.
- AI workspaces are getting heavier and more complex; prompt management is usually a **secondary feature**, not the primary focus.
- Public prompt marketplaces are **noisy and generic**, often misaligned with specific team context and quality needs.

### 3.3 Clear unmet needs

- Tools that **start from real chats** and extract reusable templates automatically (instead of expecting blank-page prompt engineering).
- A **lightweight, tool-agnostic layer** that doesn’t require moving to a new AI workspace.
- A **coaching layer** that actually teaches good prompt craft, instead of just storing strings.
- **Transparent, controllable privacy** for teams wary of storing sensitive chats.

---

## 4. Target users & Jobs-To-Be-Done

### 4.1 Primary segments

1. **Team AI Champions / Enablement Leads**  
   PMs, ops leads, RevOps, senior ICs responsible for “rolling out AI”.  
   Environment: ChatGPT/Claude, Notion/Confluence, Slack/Jira, CRM.  
   AI attitude: Intermediate–power; internal evangelists.

2. **Hands-on Knowledge Workers (B2B teams)**  
   Marketers, CSMs, SDRs, product marketers, analysts.  
   Environment: Browser-based AI, docs, CRM, Notion, internal playbooks.  
   AI attitude: Intermediate; use AI daily but ad-hoc.

3. **Agencies / Consultants**  
   Boutique agencies, strategy consultants, freelancers applying similar workflows across clients.  
   Environment: Slides, docs, research, AI-heavy content and analysis.  
   AI attitude: Power users with personal systems; looking to professionalise.

4. **Tech-adjacent Builders / No-code Makers**  
   Founders, operators, no-code builders prototyping workflows and products.  
   Environment: AI chats + no-code tools (Airtable, Make/Zapier, Notion, Framer).  
   AI attitude: Power users and tinkerers.

### 4.2 JTBD examples

**Team AI Champions**

- When I’m tasked with “rolling out AI” across the team, I want to collect and standardise our best prompts, so I can avoid everyone reinventing the wheel and show clear productivity gains.
- When a new team member joins, I want to give them a ready-made prompt library by role and task, so I can shorten ramp-up time and maintain quality.

**Knowledge Workers**

- When I find a prompt that gives me a great result, I want to save and reuse it quickly, so I can stop rewriting and hunting for it later.
- When my AI outputs are inconsistent, I want to understand how to tweak the prompt, so I can get reliable, high-quality results.

**Agencies / Consultants**

- When I onboard a new client, I want to adapt my proven prompt workflows to their brand and constraints, so I can look professional and start delivering quickly.
- When collaborating with juniors, I want to see and refine the prompts they use, so I can uplevel their work and maintain standards.

**Builders / No-code Makers**

- When I move from an exploratory chat that works to a repeatable process, I want to convert that chat into a structured prompt spec, so I can plug it into automations or product features.

---

## 5. Use cases & core workflows

### 5.1 Top use cases (MVP and beyond)

1. **Chat → Prompt Capture (Core)**  
   Capture a successful AI conversation via the browser extension. Distill auto-generates a prompt template with variables, tags, and examples. User edits and saves to the library.  
   **Status**: MVP MUST.

2. **Team Prompt Library & Starter Packs**  
   AI Champion distils top performers’ chats into team playbooks (e.g. for CSMs, SDRs, marketers). Organised by role, function, task. Shared across workspace with basic permissions.  
   **Status**: MVP MUST.

3. **Prompt Coach**  
   User opens prompt editor and gets feedback on structure, clarity, variables, and constraints. Coach suggests improvements and explains *why*.  
   **Status**: MVP SHOULD (first version can be modest).

4. **Privacy-Scoped Capture**  
   At capture time, user/workspace chooses between full chat + template or template-only + minimal metadata, with clear communication of what’s stored.  
   **Status**: MVP MUST (core differentiator and trust driver).

5. **Client-Scoped Libraries (Agencies / Consultants)**  
   Workspaces or folders per client; ability to duplicate base templates and customise them per client.  
   **Status**: MVP SHOULD (can be built on general team features).

6. **Exploration → Template for Builders**  
   Convert an exploratory conversation into a structured prompt spec suitable for dev handoff or automation.  
   **Status**: LATER.

7. **Prompt Usage Analytics**  
   Basic stats: usage counts, recency, favourites, feedback.  
   **Status**: LATER.

---

## 6. Value proposition & positioning

### 6.1 Core value proposition

> Distill turns your messy AI chats into reusable, team-ready prompt playbooks—with built-in coaching and privacy controls—so your best prompts never get lost and everyone can work at their best.

Key differentiators:

- Starts from **real usage** (actual chats), not blank-page prompt writing.
- Provides a **coaching layer**, helping users understand and improve prompts.
- Acts as a **tool-agnostic companion**, not another heavy AI workspace.
- Offers **explicit privacy modes** (prompt-only vs full chat).

### 6.2 Segment-specific value props

- **AI Champions / Enablement Leads**  
  Distill helps AI champions standardise and scale successful prompts across their team by transforming real conversations into shared playbooks, without forcing everyone into a new AI platform.

- **Knowledge Workers**  
  Distill helps marketers, CSMs, and product folks stop losing great prompts by capturing and refining their best chats into reusable templates with guidance, instead of scattered notes and ad-hoc copy-paste.

- **Agencies / Consultants**  
  Distill lets agencies and consultants turn their proven AI workflows into client-scoped prompt playbooks with versions and privacy-safe storage, unlike generic marketplaces that can’t reflect their process or protect client context.

### 6.3 Tagline options

- “From messy AI chats to sharp team prompts.”
- “Capture your best chats. Turn them into playbooks.”
- “Distil conversations into reusable prompts.”
- “Stop losing great prompts in your chat history.”
- “Your team’s prompt playbook, distilled from real work.”

---

## 7. Privacy & trust

### 7.1 Differentiator

The ability to choose between:

- **Prompt-only mode** – store distilled prompt + metadata, no raw chat text.
- **Full context mode** – store full conversation + distilled prompt.

is a key differentiator for teams working with sensitive data or cautious IT/security functions.

Communication principles:

- Plain language: “You’re in control of what Distill remembers.”
- Visual clarity: simple diagrams / icons for what’s stored in each mode.
- Workspace defaults: admins choose a default; users see it clearly.

### 7.2 UX patterns

- **Capture modal toggle**  
  “What should Distill save from this chat?”  
  Option A: “Prompt-only mode (safer)” – “We store the distilled template and tags, not the raw conversation.”  
  Option B: “Full chat + prompt” – “We store the full text for richer context.”

- **Workspace banner**  
  “This workspace uses **Prompt-only mode**. Distill never stores full conversation text.”

- **Inline nudge for sensitive content**  
  “Working with sensitive customer data? Switch to Prompt-only mode to store just the structure, not the story.”

---

## 8. Risks, assumptions, opportunities

### 8.1 Key assumptions

- Users are willing to install a browser extension alongside ChatGPT/Claude.
- Teams see value in a **separate prompt-management layer** rather than relying only on built-in workspace features.
- Users will actually convert chats into prompts if friction is low and benefits are clear.
- Prompt coaching is valuable enough to use (not just “nice-to-have”).
- Privacy mode is a meaningful decision factor for team adoption.
- Teams will pay for this (vs using free docs/Notion workarounds).
- Starting “teams-first” is viable without a huge solo user base.
- Auto-distillation quality will be high enough to be trusted as a starting point.

### 8.2 Testing high-risk assumptions (examples)

- **Behaviour (chat → prompt capture)**  
  Lightweight extension prototype, track capture events and follow-up usage; interviews on why they did/didn’t capture.

- **Willingness to pay**  
  Simple landing page with clear value + pricing and “Request team trial” CTA; measure sign-ups and sales calls.

- **Distillation quality**  
  Test with real conversations from power users; rate fidelity and usefulness vs writing from scratch; iterate until ≥80% “good starting point”.

- **Separate layer vs workspace features**  
  Discovery: ask “Why not just use built-in prompt libraries?” and push for concrete reasons; refine positioning accordingly.

### 8.3 “Sharp edges” to lean into

- **Auto-distillation from real chats** – “Turn yesterday’s great chat into tomorrow’s team playbook.”
- **Prompt coach** – Distill is not just a library; it’s a quiet teacher embedded in your workflows.
- **Privacy choices** – Fine-grained, explicit, non-technical privacy modes as a first-class feature.
- **Browser-native, tool-agnostic** – Works across your AI stack, not just one app.

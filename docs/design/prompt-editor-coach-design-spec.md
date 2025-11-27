# Design Spec: Prompt Editor & Coach

> **Feature:** Prompt editing and AI coaching interface
> **Priority:** P0 (Editor) / P1 (Coach)
> **PRD References:** FR-EDIT-01, FR-COACH-01
> **Status:** DRAFT
> **Last Updated:** 2025-11-27

---

## 1. Overview

### 1.1 Purpose

The Prompt Editor enables users to refine auto-distilled prompts into high-quality, reusable templates. The Coach feature provides AI-powered suggestions to improve prompt effectiveness. Together, they support Flow 3: AI Champion curating library.

### 1.2 User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-EDIT-01 | As a team member, I want to edit prompt titles and tags so I can organize my library | MUST |
| US-EDIT-02 | As a champion, I want to add/modify variables so prompts are reusable across contexts | MUST |
| US-EDIT-03 | As a user, I want auto-save so I don't lose my work | MUST |
| US-COACH-01 | As a knowledge worker, I want coaching suggestions so I can improve my prompts | SHOULD |
| US-COACH-02 | As a user, I want one-click apply for suggestions so improvement is effortless | SHOULD |

### 1.3 Success Metrics

| Metric | Target |
|--------|--------|
| Edit rate (prompts edited after distillation) | 40-50% |
| Coach usage (click rate on "Coach me") | 25% of prompts |
| Suggestion apply rate | 50% of suggestions shown |
| Time to first edit | <30 seconds from opening |

---

## 2. User Flow

### 2.1 Editor Flow (Happy Path)

```
Library → Click prompt → Detail Panel → Click "Edit" → Editor opens
→ Make changes (title, body, variables, tags) → Auto-saves
→ See "Saved" confirmation → Close or continue editing
```

### 2.2 Coach Flow (Happy Path)

```
Editor open → Click "Coach me" → Loading (spinner)
→ See 2-5 suggestions with explanations → Click "Apply" on suggestion
→ Change applied to prompt body → Auto-saves
→ Repeat or close coach panel
```

### 2.3 Alternative Paths

| Scenario | Flow |
|----------|------|
| No suggestions needed | "Coach me" → "Your prompt looks great! No suggestions." |
| Conflict detected | Edit → Save → Warning: "Updated by [name]. Refresh?" → User chooses |
| Apply multiple suggestions | Apply one → Coach panel stays → Apply another |
| Undo applied suggestion | Cmd/Ctrl+Z → Suggestion unapplied |

### 2.4 Error Paths

| Error | User Sees | Recovery |
|-------|-----------|----------|
| Save failed | "Couldn't save. Retrying..." + auto-retry | Manual "Retry" after 3 attempts |
| Coach API timeout | "Coach unavailable. Try again later." | Manual retry button |
| Session expired | "Session expired. Please log in." | Redirect to login, preserve draft |

---

## 3. Screen Inventory

### 3.1 Prompt Editor (Full-screen or Modal)

| Element | Description |
|---------|-------------|
| Header | Prompt title (editable), Save status, Close button |
| Main area | Prompt body editor with variable highlighting |
| Variables panel | List of variables with name + description |
| Tags input | Tag chips with autocomplete |
| Coach panel | Slide-in panel for suggestions |
| Footer | "Coach me" button, Last edited info |

**Entry points:**
- Click "Edit" from Prompt Detail Panel
- Click "Edit" from Prompt Card context menu
- Keyboard shortcut `E` when prompt is selected

**Exit points:**
- Close button (X)
- Escape key
- Click outside (if modal)
- Navigate away (with unsaved changes warning if needed)

---

## 4. Component Specifications

### 4.1 Editor Header

```
┌────────────────────────────────────────────────────────┐
│  [Editable Title.....................]   Saved ✓   [X] │
└────────────────────────────────────────────────────────┘
```

**States:**

| State | Appearance |
|-------|------------|
| Default | Title text, "Saved ✓" in green |
| Editing title | Title with cursor, status hidden |
| Saving | "Saving..." in gray with spinner |
| Error | "Save failed" in red with retry icon |
| Conflict | Warning banner below header |

**Props:**
```typescript
interface EditorHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  saveStatus: 'saved' | 'saving' | 'error' | 'conflict';
  lastEditedBy?: { name: string; timestamp: Date };
  onClose: () => void;
}
```

---

### 4.2 Prompt Body Editor

```
┌────────────────────────────────────────────────────────┐
│ You are a {{role}} expert helping with {{task}}.       │
│                                                        │
│ Please analyze the following and provide:              │
│ 1. Summary                                             │
│ 2. Key insights                                        │
│ 3. Recommendations                                     │
│                                                        │
│ Context: {{context}}                                   │
└────────────────────────────────────────────────────────┘
```

**States:**

| State | Appearance |
|-------|------------|
| Default | Plain text with variables highlighted |
| Focused | Blue border, cursor active |
| Variable hover | Variable pill shows tooltip with description |
| Variable selected | Variable background darker, edit affordance |
| Read-only | Gray background (if user lacks permission) |

**Features:**
- Syntax highlighting for `{{variables}}`
- Click variable to edit inline
- Auto-resize textarea
- Character count (optional)
- Markdown preview toggle (optional)

**Props:**
```typescript
interface PromptBodyEditorProps {
  content: string;
  variables: Variable[];
  onChange: (content: string) => void;
  onVariableClick: (variableName: string) => void;
  readOnly?: boolean;
}
```

---

### 4.3 Variables Panel

```
┌─────────────────────────────────────────┐
│ Variables                    [+ Add]    │
├─────────────────────────────────────────┤
│ {{role}}                                │
│ The professional role or expertise      │
│ [Edit] [Delete]                         │
├─────────────────────────────────────────┤
│ {{task}}                                │
│ The specific task to accomplish         │
│ [Edit] [Delete]                         │
├─────────────────────────────────────────┤
│ {{context}}                             │
│ Background information or data          │
│ [Edit] [Delete]                         │
└─────────────────────────────────────────┘
```

**States:**

| State | Appearance |
|-------|------------|
| Default | List of variables with descriptions |
| Empty | "No variables yet. Add one or type {{name}} in prompt." |
| Editing | Inline form replaces variable row |
| Hover | Shows Edit/Delete buttons |
| Dragging | Variable row lifted, drop indicator |

**Props:**
```typescript
interface Variable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

interface VariablesPanelProps {
  variables: Variable[];
  onAdd: () => void;
  onEdit: (name: string, updates: Partial<Variable>) => void;
  onDelete: (name: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}
```

---

### 4.4 Tags Input

```
┌─────────────────────────────────────────────────────────┐
│ [marketing ×] [email ×] [outreach ×] [Add tag...]      │
└─────────────────────────────────────────────────────────┘
```

**States:**

| State | Appearance |
|-------|------------|
| Default | Tag chips with "Add tag..." placeholder |
| Focused | Input expanded, autocomplete dropdown |
| Autocomplete | Dropdown shows matching workspace tags |
| Max tags | Input disabled, "Maximum 10 tags" tooltip |

**Props:**
```typescript
interface TagsInputProps {
  tags: string[];
  suggestions: string[]; // from workspace
  onChange: (tags: string[]) => void;
  maxTags?: number; // default 10
}
```

---

### 4.5 Coach Panel (Slide-in)

```
┌───────────────────────────────────────────────────────────┐
│ Coach Suggestions                                    [X]  │
├───────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 1. Add a clear role                                 │   │
│ │    Your prompt lacks a defined persona. Adding      │   │
│ │    "You are a [role]" helps the AI respond          │   │
│ │    appropriately.                                   │   │
│ │                                              [Apply]│   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 2. Be more specific about output format             │   │
│ │    Specify whether you want bullet points, a        │   │
│ │    paragraph, or structured data.                   │   │
│ │                                              [Apply]│   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 3. Add constraints                                  │   │
│ │    Include word limits, tone, or audience to        │   │
│ │    narrow down the response.                        │   │
│ │                                              [Apply]│   │
│ └─────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

**States:**

| State | Appearance |
|-------|------------|
| Closed | Not visible |
| Loading | Skeleton cards + "Analyzing your prompt..." |
| Loaded | 2-5 suggestion cards |
| Empty | "Your prompt looks great! No suggestions." |
| Error | Error message + retry button |
| Applied | Card shows checkmark, fades slightly |

**Props:**
```typescript
interface Suggestion {
  id: string;
  title: string;
  explanation: string;
  type: 'role' | 'structure' | 'specificity' | 'constraints' | 'examples';
  suggestedChange: string; // The actual text change
  applied: boolean;
}

interface CoachPanelProps {
  isOpen: boolean;
  isLoading: boolean;
  suggestions: Suggestion[];
  error?: string;
  onApply: (suggestionId: string) => void;
  onClose: () => void;
  onRetry: () => void;
}
```

---

### 4.6 Suggestion Card

```
┌─────────────────────────────────────────────────────────┐
│ [icon] Add a clear role                                 │
│                                                         │
│ Your prompt lacks a defined persona. Adding             │
│ "You are a [role]" helps the AI respond appropriately.  │
│                                                         │
│                                               [Apply]   │
└─────────────────────────────────────────────────────────┘
```

**States:**

| State | Appearance |
|-------|------------|
| Default | White card with blue "Apply" button |
| Hover | Slight elevation, preview of change |
| Applying | Spinner on button |
| Applied | Green checkmark, grayed out, "Applied" badge |
| Dismissed | Faded with "Dismissed" label (if feature added) |

**Interaction:**
- Hover shows preview of what will change
- Click "Apply" inserts/modifies prompt text
- Applied suggestions stay visible but inactive

---

### 4.7 Conflict Warning Banner

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  Alex updated this prompt 2 minutes ago.             │
│     [View changes]  [Refresh]  [Keep mine]              │
└─────────────────────────────────────────────────────────┘
```

**States:**

| State | Appearance |
|-------|------------|
| Hidden | Not rendered |
| Visible | Yellow warning banner below header |

**Actions:**
- View changes: Opens diff view
- Refresh: Discards local, loads server version
- Keep mine: Overwrites server (last-write-wins)

---

## 5. Design Tokens

### 5.1 Colors

| Token | Value | Usage |
|-------|-------|-------|
| `editor-bg` | `neutral-50` | Editor background |
| `editor-border` | `neutral-200` | Editor border |
| `editor-focus` | `indigo-500` | Focus ring |
| `variable-bg` | `indigo-100` | Variable highlight |
| `variable-text` | `indigo-700` | Variable text |
| `coach-bg` | `white` | Coach panel background |
| `suggestion-border` | `neutral-200` | Card border |
| `suggestion-applied` | `green-100` | Applied card bg |
| `warning-bg` | `amber-50` | Conflict banner |
| `warning-border` | `amber-200` | Conflict border |

### 5.2 Typography

| Element | Style |
|---------|-------|
| Title input | `text-xl font-semibold` |
| Prompt body | `text-base font-mono` |
| Variable name | `text-sm font-medium font-mono` |
| Variable description | `text-sm text-neutral-600` |
| Suggestion title | `text-base font-semibold` |
| Suggestion explanation | `text-sm text-neutral-600` |

### 5.3 Spacing

| Element | Value |
|---------|-------|
| Editor padding | `24px` |
| Section gap | `24px` |
| Card padding | `16px` |
| Variable row gap | `12px` |

### 5.4 Animation

| Element | Animation |
|---------|-----------|
| Coach panel | Slide in from right, 200ms ease-out |
| Save status | Fade transition, 150ms |
| Suggestion apply | Scale down + checkmark, 300ms |
| Conflict banner | Slide down, 200ms |

---

## 6. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1024px) | Side-by-side: Editor left, Variables right, Coach slides over |
| Tablet (768-1024px) | Variables collapse below editor, Coach full overlay |
| Mobile (<768px) | Full-screen editor, Variables in accordion, Coach full overlay |

---

## 7. Accessibility

### 7.1 Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between fields |
| Escape | Close coach panel / exit edit mode |
| Cmd/Ctrl + S | Explicit save (even with auto-save) |
| Cmd/Ctrl + Z | Undo |
| Cmd/Ctrl + Shift + Z | Redo |
| Enter (in title) | Focus prompt body |

### 7.2 Screen Reader

| Element | Announcement |
|---------|--------------|
| Variable in text | "Variable: [name]" |
| Save status | "Changes saved" / "Saving" / "Save failed" |
| Coach suggestion | "Suggestion [n] of [total]: [title]" |
| Applied suggestion | "[title] applied" |

### 7.3 Requirements

- [ ] All form fields labeled
- [ ] Focus visible on all interactive elements
- [ ] Color not sole indicator (icons + text for states)
- [ ] ARIA live regions for status updates
- [ ] Minimum 44x44px touch targets

---

## 8. Edge Cases

| # | Scenario | Handling |
|---|----------|----------|
| 1 | Very long prompt (>5000 chars) | Warn user about token limits |
| 2 | Many variables (>10) | Allow but suggest simplifying |
| 3 | Duplicate variable names | Prevent, show error |
| 4 | Empty prompt body | Disable save, show validation |
| 5 | Special characters in variable name | Sanitize, allow only alphanumeric + underscore |
| 6 | Concurrent edits by same user (multiple tabs) | Last-write-wins, no conflict |
| 7 | Edit while offline | Queue save, sync when online |
| 8 | Coach returns 0 suggestions | "Your prompt looks great!" message |
| 9 | Coach returns irrelevant suggestions | Feedback button "Not helpful" |
| 10 | Variable in prompt not in panel | Auto-detect and add to panel |
| 11 | Variable removed from text | Prompt to remove from panel |
| 12 | Rapid-fire "Coach me" clicks | Debounce, show loading for first |

---

## 9. Technical Notes

### 9.1 Auto-save Implementation

```
User types → Debounce 2 seconds → Save to server
           → If error, retry up to 3 times
           → If still failing, show error + manual retry
```

### 9.2 Coach API

```typescript
// Request
POST /api/prompts/:id/coach
{
  promptBody: string;
  existingVariables: Variable[];
}

// Response
{
  suggestions: Suggestion[];
  generatedAt: Date;
}
```

**Latency target:** <5 seconds

### 9.3 Conflict Detection

- Poll for updates every 30 seconds while editing
- Compare `lastModified` timestamp
- If mismatch, show conflict banner

---

## 10. Open Questions

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | Full-screen vs modal editor? | A) Full-screen, B) Large modal | A - More space for editing |
| 2 | Show diff for applied suggestions? | A) No diff, B) Inline diff | B - Helps users understand changes |
| 3 | Allow dismissing suggestions? | A) No, B) Yes with feedback | B - Improves coach over time |
| 4 | Preview mode for prompt? | A) Not in MVP, B) Include | A - Defer to post-MVP |

---

## 11. Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| Prompt Detail Panel | Internal | Editor accessed from detail |
| Coach API | Backend | Requires LLM integration |
| WebSocket/Polling | Infra | For conflict detection |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2025-11-27 | Initial draft |

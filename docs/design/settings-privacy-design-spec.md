# Settings & Privacy Design Spec

**Status:** Draft
**PRD:** `/docs/requirements/mvp-prd.md` (FR-PRIV-01, FR-PRIV-02, US-04)
**Updated:** 2025-11-27

---

## Overview

Settings & Privacy provides workspace administrators with controls for privacy defaults and gives all users transparency about what data Distill stores. This supports Flow 4 (Privacy-conscious capture) and builds trust through clear, plain-language explanations.

### User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-04 | As a privacy-conscious user, I want to choose what data is stored when capturing so that sensitive information isn't persisted | MUST |
| US-SET-01 | As a workspace admin, I want to set default privacy mode so my team follows our data policy | MUST |
| US-SET-02 | As an admin, I want to control whether members can override privacy defaults | MUST |
| US-SET-03 | As a user, I want to understand exactly what Distill stores so I can trust the tool | MUST |

### Acceptance Criteria (from PRD)

**FR-PRIV-01:**
- [ ] Admin can set default privacy mode
- [ ] Admin can toggle member override permission
- [ ] Extension reflects current workspace default
- [ ] Changes apply to new captures immediately

**FR-PRIV-02:**
- [ ] Page explains both modes with visual diagram
- [ ] Written at 8th-grade reading level
- [ ] Accessible from capture modal via "Learn more" link
- [ ] No legal jargon; focuses on user understanding

---

## User Flow

### Happy Path: Admin Configures Privacy

```
Settings (sidebar) → Privacy tab → View current settings
→ Select default mode (Prompt-only / Full chat) → Toggle override permission
→ See "Settings saved" confirmation → Changes apply immediately
```

### Happy Path: User Views Data Visibility

```
Capture modal "Learn more" link → Data Visibility page opens
→ Read explanation → View visual diagram → Understand both modes
→ Close or return to capture
```

### Alternative Paths

| Scenario | Flow |
|----------|------|
| Access from footer | Footer "Privacy" link → Data Visibility page |
| Access from settings | Settings → Privacy tab → "Learn more about privacy modes" |
| Non-admin views settings | Settings → Privacy tab → See current settings (read-only) |

### Error Paths

| Error | User Sees | Recovery |
|-------|-----------|----------|
| Save failed | "Couldn't save settings. Please try again." | Retry button |
| Unauthorized | "Only workspace admins can change these settings." | Contact admin prompt |
| Session expired | "Please log in again." | Redirect to login |

---

## Screen Inventory

| Screen | Purpose | Entry | Exit |
|--------|---------|-------|------|
| Settings Shell | Container for all settings | Sidebar "Settings" | Back to Library |
| Privacy Settings Tab | Admin privacy controls | Settings → Privacy tab | Other tabs, close |
| Data Visibility Page | Explain what's stored | "Learn more" links | Close, back |
| Workspace Settings Tab | Name, members, billing | Settings → Workspace | Other tabs, close |
| Account Settings Tab | Personal profile, password | Settings → Account | Other tabs, close |

---

## Components

### Settings Shell

**Purpose:** Container with sidebar navigation for settings sections

```
┌──────────────────────────────────────────────────────────────┐
│ Settings                                               [X]   │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│ Account    │   [Active Tab Content]                          │
│ Workspace  │                                                 │
│ Privacy  ← │                                                 │
│ Billing    │                                                 │
│            │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

**States:**
- Default: First tab (Account) selected
- Tab hover: Background highlight
- Tab active: Bold text, accent border
- Loading: Skeleton in content area

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| activeTab | string | 'account' | Currently selected tab |
| userRole | 'admin' \| 'member' | - | Determines visible tabs |
| onTabChange | (tab: string) => void | - | Tab selection handler |

**Accessibility:**
- Keyboard: Arrow keys navigate tabs, Enter selects
- Screen reader: "Settings navigation, [tab name] tab, [n] of [total]"
- ARIA: `role="tablist"`, `aria-selected` on active tab

---

### Privacy Settings Tab

**Purpose:** Admin controls for workspace privacy defaults

```
┌─────────────────────────────────────────────────────────────┐
│ Privacy Settings                                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Default Capture Mode                                    │ │
│ │                                                         │ │
│ │ ( ) Prompt-only                                         │ │
│ │     Only the distilled template is saved.               │ │
│ │     Raw chat is deleted after processing.               │ │
│ │                                                         │ │
│ │ (•) Full chat + prompt                                  │ │
│ │     Both the template and original chat are saved.      │ │
│ │     Enables "View original" in prompt detail.           │ │
│ │                                                         │ │
│ │ [Learn more about privacy modes]                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Member Permissions                                      │ │
│ │                                                         │ │
│ │ [Toggle] Allow members to override default mode         │ │
│ │          When off, all captures use workspace default.  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                                        [Cancel] [Save]      │
└─────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Current settings displayed
- Dirty: Unsaved changes, Save button enabled
- Saving: Save button shows spinner
- Saved: Toast "Settings saved" appears
- Error: Error message below form
- Read-only (member): Controls disabled, info text shown

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| defaultMode | 'prompt-only' \| 'full-chat' | - | Current default |
| allowOverride | boolean | - | Member override setting |
| isAdmin | boolean | false | Enables editing |
| onSave | (settings: PrivacySettings) => Promise | - | Save handler |

**Accessibility:**
- Keyboard: Tab between options, Space to select radio
- Screen reader: "Default capture mode: Prompt-only selected"
- ARIA: `role="radiogroup"`, `aria-describedby` for explanations

---

### Privacy Mode Radio Card

**Purpose:** Visual radio option with explanation

```
┌─────────────────────────────────────────────────────────────┐
│ (•) Prompt-only                                             │
│     Only the distilled template is saved.                   │
│     Raw chat is deleted after processing.                   │
└─────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Unselected, neutral border
- Hover: Light background, cursor pointer
- Selected: Accent border, filled radio
- Focus: Focus ring around card
- Disabled: Grayed out, cursor not-allowed

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | string | - | Option value |
| label | string | - | Option title |
| description | string | - | Explanation text |
| selected | boolean | false | Selection state |
| disabled | boolean | false | Disabled state |
| onChange | (value: string) => void | - | Selection handler |

**Accessibility:**
- Keyboard: Space/Enter to select
- Screen reader: "[label], radio button, [selected/not selected], [description]"
- ARIA: `role="radio"`, `aria-checked`, `aria-describedby`

---

### Override Toggle

**Purpose:** Switch control for member override permission

```
┌─────────────────────────────────────────────────────────────┐
│ [====•] Allow members to override default mode              │
│         When off, all captures use workspace default.       │
└─────────────────────────────────────────────────────────────┘
```

**States:**
- Off: Toggle left, neutral color
- On: Toggle right, accent color
- Hover: Slight scale, cursor pointer
- Focus: Focus ring
- Disabled: Grayed out

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| checked | boolean | false | Toggle state |
| label | string | - | Primary label |
| description | string | - | Helper text |
| disabled | boolean | false | Disabled state |
| onChange | (checked: boolean) => void | - | Change handler |

**Accessibility:**
- Keyboard: Space to toggle
- Screen reader: "[label], switch, [on/off]"
- ARIA: `role="switch"`, `aria-checked`

---

### Data Visibility Page

**Purpose:** Plain-language explanation of what Distill stores

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back                                                      │
│                                                             │
│ # What does Distill store?                                  │
│                                                             │
│ Distill helps you save and reuse your best AI prompts.      │
│ Here's exactly what we keep and what we delete.             │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                   [VISUAL DIAGRAM]                      │ │
│ │                                                         │ │
│ │   Your Chat          Distill          What's Saved      │ │
│ │   ┌───────┐          ┌─────┐         ┌───────────┐      │ │
│ │   │ Raw   │ ──────►  │ AI  │ ──────► │ Template  │      │ │
│ │   │ Chat  │          │     │         │ + Tags    │      │ │
│ │   └───────┘          └─────┘         └───────────┘      │ │
│ │                         │                               │ │
│ │                    [Deleted] (Prompt-only mode)         │ │
│ │                    [Saved] (Full chat mode)             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ## Prompt-only mode (recommended for sensitive data)        │
│                                                             │
│ ✓ We save: The template, variables, and tags                │
│ ✗ We delete: Your original chat (within 60 seconds)         │
│                                                             │
│ Use this when your chat contains private information,       │
│ customer data, or anything you don't want stored.           │
│                                                             │
│ ## Full chat mode                                           │
│                                                             │
│ ✓ We save: The template AND your original chat              │
│ ✓ You get: "View original" link in prompt details           │
│                                                             │
│ Use this when you want to reference the original            │
│ conversation for context or training.                       │
│                                                             │
│ ## Your data is protected                                   │
│                                                             │
│ • All data is encrypted                                     │
│ • Only your team can see your prompts                       │
│ • You can delete any prompt anytime                         │
│ • We never sell your data                                   │
│                                                             │
│ Questions? Contact us at privacy@distill.app                │
└─────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Full page content
- Loading: Skeleton layout
- Scrolled: Back button sticks to top

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onBack | () => void | - | Back navigation handler |

**Accessibility:**
- Keyboard: Tab navigates links, Escape goes back
- Screen reader: Heading hierarchy for navigation
- ARIA: Landmarks for main content

---

### Workspace Settings Tab

**Purpose:** Workspace name, member management

```
┌─────────────────────────────────────────────────────────────┐
│ Workspace Settings                                          │
│                                                             │
│ Workspace name                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Acme Marketing Team                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Members (5)                                    [+ Invite]   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Avatar] Alex Kim         alex@acme.com       Admin     │ │
│ │ [Avatar] Jordan Lee       jordan@acme.com     Member    │ │
│ │ [Avatar] Sam Chen         sam@acme.com        Member    │ │
│ │ ...                                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Danger Zone                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Delete Workspace]                                      │ │
│ │ This will permanently delete all prompts and data.      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Current workspace data shown
- Editing name: Input focused, Save button appears
- Member hover: Shows remove button (admin only)
- Deleting: Confirmation modal

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| workspace | Workspace | - | Workspace data |
| members | Member[] | - | Member list |
| isAdmin | boolean | false | Admin controls |
| onUpdateName | (name: string) => Promise | - | Name update handler |
| onInvite | () => void | - | Opens invite modal |
| onRemoveMember | (id: string) => Promise | - | Remove handler |
| onDelete | () => Promise | - | Delete handler |

**Accessibility:**
- Keyboard: Tab through controls
- Screen reader: "Member list, [count] members"
- ARIA: `role="list"` for member list

---

### Account Settings Tab

**Purpose:** Personal profile and security settings

```
┌─────────────────────────────────────────────────────────────┐
│ Account Settings                                            │
│                                                             │
│ Profile                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Avatar]  [Change photo]                                │ │
│ │                                                         │ │
│ │ Display name                                            │ │
│ │ ┌───────────────────────────────────────────────────┐   │ │
│ │ │ Alex Kim                                          │   │ │
│ │ └───────────────────────────────────────────────────┘   │ │
│ │                                                         │ │
│ │ Email                                                   │ │
│ │ alex@acme.com (verified)                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Security                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Password                                                │ │
│ │ Last changed 30 days ago          [Change password]     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Sessions                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Log out of all devices]                                │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Profile data displayed
- Editing: Input focused, Save appears
- Uploading avatar: Progress indicator
- Password change: Modal opens

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| user | User | - | Current user data |
| onUpdateProfile | (updates: Partial<User>) => Promise | - | Profile update |
| onChangePassword | () => void | - | Opens password modal |
| onLogoutAll | () => Promise | - | Log out all sessions |

**Accessibility:**
- Keyboard: Tab through form fields
- Screen reader: Form labels announced
- ARIA: `aria-describedby` for helper text

---

## Edge Cases

| Scenario | Behaviour | Message |
|----------|-----------|---------|
| Admin demotes self | Prevent if last admin | "Workspace must have at least one admin" |
| Delete workspace with prompts | Require confirmation with prompt count | "Delete [n] prompts permanently?" |
| Change privacy affects existing | Only applies to new captures | "Existing prompts unchanged" info |
| Override disabled mid-capture | Capture continues with user's selection | No interruption |
| Very long workspace name | Truncate at 50 chars | Character counter shown |
| Invalid email in invite | Show validation error | "Please enter a valid email" |
| Invite existing member | Show info message | "[email] is already a member" |
| Remove last member | Prevent | "Cannot remove the only member" |
| Session expired during save | Show error, preserve form state | "Session expired. Log in to save." |
| Network error on page load | Retry with backoff | "Couldn't load settings. Retrying..." |

---

## Responsive

| Breakpoint | Changes |
|------------|---------|
| Mobile (<640px) | Tabs become dropdown, full-width content, stacked form fields |
| Tablet (640-1024px) | Tabs remain sidebar, narrower content area |
| Desktop (>1024px) | Full layout with sidebar tabs and wide content |

---

## Accessibility Checklist

- [x] Contrast ≥ 4.5:1 (all text on backgrounds)
- [x] Focus states (visible ring on all interactive elements)
- [x] Keyboard accessible (all actions reachable via keyboard)
- [x] Labels visible (all form fields labeled)
- [x] Descriptive errors (specific, actionable messages)
- [x] prefers-reduced-motion (disable animations when set)
- [x] Touch targets ≥ 44px (all buttons, toggles, radios)

---

## Design Tokens

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `settings-bg` | `neutral-50` | Page background |
| `settings-card` | `white` | Card backgrounds |
| `settings-border` | `neutral-200` | Card borders |
| `tab-active` | `indigo-600` | Active tab indicator |
| `tab-hover` | `neutral-100` | Tab hover background |
| `toggle-on` | `indigo-600` | Toggle enabled |
| `toggle-off` | `neutral-300` | Toggle disabled |
| `danger` | `red-600` | Danger zone elements |
| `danger-bg` | `red-50` | Danger zone background |

### Typography

| Element | Style |
|---------|-------|
| Page title | `text-xl font-semibold` |
| Section heading | `text-lg font-medium` |
| Label | `text-sm font-medium` |
| Description | `text-sm text-neutral-600` |
| Radio label | `text-base font-medium` |

### Spacing

| Element | Value |
|---------|-------|
| Page padding | `24px` (desktop), `16px` (mobile) |
| Section gap | `32px` |
| Card padding | `20px` |
| Form field gap | `16px` |

---

## Open Questions

| Question | Options | Recommendation |
|----------|---------|----------------|
| Show privacy mode in header/navbar? | A) No, B) Yes as badge | B - Reinforces current mode |
| Allow personal privacy preference? | A) Workspace only, B) Personal override | A for MVP - Simpler |
| Audit log for setting changes? | A) Not in MVP, B) Basic log | A - Defer to enterprise |
| Export workspace data? | A) Not in MVP, B) Include | A - Defer to post-MVP |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2025-11-27 | Initial draft |

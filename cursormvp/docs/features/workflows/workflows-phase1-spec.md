# Workflows Feature: Phase 1 Specification

> **Status:** Ready for Implementation
> **Version:** 1.0
> **Date:** 2025-11-30
> **Decision:** Strategic Bet (APPROVED)

---

## 1. Overview

### 1.1 What We're Building

**Workflows** allow users to chain multiple prompts in sequence, run them with one click, and record outputs at each step. This is a first-class feature, not an extension of Collections.

### 1.2 Core Value Proposition

> "Capture a conversation → Distill it into prompts → Chain them into workflows → Share with your team"

This completes Distill's end-to-end story: from capturing real AI usage to creating reusable, automated multi-step processes.

### 1.3 Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Workflow creation | 20% of active users create 1+ workflow in first 30 days | Analytics |
| Workflow execution | Average 3+ executions per workflow | Analytics |
| Completion rate | 80%+ of started workflows complete successfully | Analytics |
| User satisfaction | Qualitative feedback positive | Support tickets, NPS |

---

## 2. User Stories

### 2.1 Primary User Stories

**US-1: Create a Workflow**
> As a user, I want to create a workflow by selecting existing prompts and defining their order, so I can automate multi-step tasks.

**US-2: Define Input/Output Mapping**
> As a user, I want to specify how the output of one step feeds into the next step, so my workflows produce coherent results.

**US-3: Run a Workflow**
> As a user, I want to run an entire workflow with a single click, providing only the initial inputs, so I save time on repetitive multi-step tasks.

**US-4: View Execution Progress**
> As a user, I want to see each step's progress and output as the workflow runs, so I can monitor results and catch issues early.

**US-5: Access Workflow History**
> As a user, I want to view past workflow executions with their inputs/outputs, so I can reference previous results or debug issues.

**US-6: Share Workflows**
> As a user, I want to share workflows with my workspace, so my team can use workflows I've created.

### 2.2 Secondary User Stories (Nice-to-Have)

**US-7: Suggested Next Prompts**
> As a user, after running a prompt, I want to see AI-suggested follow-up prompts, so I can discover workflow opportunities.

**US-8: Workflow from Capture**
> As a user, when I capture a multi-turn conversation, I want the option to create a workflow from the distilled prompts, so I can automate conversations I already have.

---

## 3. Feature Requirements

### 3.1 Workflow Creation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | User can create a new workflow with name and description | MUST |
| FR-1.2 | User can add existing prompts as workflow steps | MUST |
| FR-1.3 | User can reorder steps via drag-and-drop | MUST |
| FR-1.4 | User can remove steps from a workflow | MUST |
| FR-1.5 | Workflow requires minimum 2 steps | MUST |
| FR-1.6 | User can assign workflow to a workspace | SHOULD |
| FR-1.7 | User can make workflow public/private | SHOULD |

### 3.2 Input/Output Mapping

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Each step shows its required variables (from `{{variable}}` syntax) | MUST |
| FR-2.2 | User can map step output to next step's input variables | MUST |
| FR-2.3 | User can define initial input variables for step 1 | MUST |
| FR-2.4 | System validates that all required variables are mapped | MUST |
| FR-2.5 | User can preview variable mapping before execution | SHOULD |
| FR-2.6 | System auto-suggests mappings based on variable names | COULD |

### 3.3 Workflow Execution

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | User provides initial inputs and clicks "Run Workflow" | MUST |
| FR-3.2 | System executes steps sequentially, passing outputs to inputs | MUST |
| FR-3.3 | User sees real-time progress indicator (step X of Y) | MUST |
| FR-3.4 | User sees each step's output as it completes | MUST |
| FR-3.5 | If a step fails, execution stops and shows error | MUST |
| FR-3.6 | User can cancel a running workflow | SHOULD |
| FR-3.7 | User can retry from failed step | COULD |
| FR-3.8 | System shows token usage and cost per step | SHOULD |

### 3.4 Execution History

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | System saves all workflow executions with inputs/outputs | MUST |
| FR-4.2 | User can view list of past executions | MUST |
| FR-4.3 | User can view details of any past execution | MUST |
| FR-4.4 | User can copy outputs from past executions | SHOULD |
| FR-4.5 | User can re-run a workflow with same inputs | SHOULD |
| FR-4.6 | User can delete execution history | COULD |

### 3.5 Sharing & Discovery

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Workflows appear in workspace prompt library | MUST |
| FR-5.2 | Workspace members can run shared workflows | MUST |
| FR-5.3 | Only owner/admin can edit shared workflows | MUST |
| FR-5.4 | Workflows searchable by name/description | SHOULD |
| FR-5.5 | "Suggested next prompt" after running individual prompts | COULD |

---

## 4. Data Model

### 4.1 Database Schema (Prisma)

```prisma
// ============================================================================
// Workflow Models
// ============================================================================

model Workflow {
  id          String   @id @default(cuid())
  userId      String
  workspaceId String?
  name        String
  description String?
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace?        @relation(fields: [workspaceId], references: [id], onDelete: SetNull)
  steps       WorkflowStep[]
  executions  WorkflowExecution[]

  @@index([userId])
  @@index([workspaceId])
  @@map("workflows")
}

model WorkflowStep {
  id           String  @id @default(cuid())
  workflowId   String
  promptId     String
  order        Int     // 0-indexed position in workflow
  inputMapping Json?   // { "variableName": "source" } where source is "initial.varName" or "step.N.output"
  createdAt    DateTime @default(now())

  // Relations
  workflow   Workflow                @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  prompt     Prompt                  @relation(fields: [promptId], references: [id], onDelete: Cascade)
  executions WorkflowStepExecution[]

  @@unique([workflowId, order])
  @@index([promptId])
  @@map("workflow_steps")
}

enum WorkflowExecutionStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

model WorkflowExecution {
  id          String                  @id @default(cuid())
  workflowId  String
  userId      String
  status      WorkflowExecutionStatus @default(PENDING)
  initialInput Json                   // User-provided initial variables
  finalOutput  Json?                  // Final step output
  totalTokens  Int                    @default(0)
  totalCost    Float                  @default(0)
  errorMessage String?
  startedAt    DateTime               @default(now())
  completedAt  DateTime?

  // Relations
  workflow Workflow                  @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  steps    WorkflowStepExecution[]

  @@index([workflowId])
  @@index([userId])
  @@index([startedAt])
  @@map("workflow_executions")
}

enum StepExecutionStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  SKIPPED
}

model WorkflowStepExecution {
  id           String              @id @default(cuid())
  executionId  String
  stepId       String
  stepOrder    Int                 // Denormalized for easy ordering
  status       StepExecutionStatus @default(PENDING)
  input        Json?               // Resolved input for this step
  output       String?             @db.Text // LLM response
  tokens       Int                 @default(0)
  cost         Float               @default(0)
  durationMs   Int?
  errorMessage String?
  startedAt    DateTime?
  completedAt  DateTime?

  // Relations
  execution WorkflowExecution @relation(fields: [executionId], references: [id], onDelete: Cascade)
  step      WorkflowStep      @relation(fields: [stepId], references: [id], onDelete: Cascade)

  @@index([executionId])
  @@index([stepId])
  @@map("workflow_step_executions")
}
```

### 4.2 Add Relations to Existing Models

```prisma
// Add to existing User model
model User {
  // ... existing fields ...
  workflows Workflow[]
}

// Add to existing Workspace model
model Workspace {
  // ... existing fields ...
  workflows Workflow[]
}

// Add to existing Prompt model
model Prompt {
  // ... existing fields ...
  workflowSteps WorkflowStep[]
}
```

---

## 5. API Design

### 5.1 tRPC Router: `workflow`

```typescript
// workflow.ts router
export const workflowRouter = router({
  // CRUD
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      workspaceId: z.string().optional(),
      isPublic: z.boolean().default(false),
    }))
    .mutation(/* ... */),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(/* ... */),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(/* ... */),

  // Read
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(/* ... */),

  list: protectedProcedure
    .input(z.object({
      workspaceId: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(/* ... */),

  // Steps
  addStep: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      promptId: z.string(),
      order: z.number().int().min(0),
      inputMapping: z.record(z.string()).optional(),
    }))
    .mutation(/* ... */),

  updateStep: protectedProcedure
    .input(z.object({
      stepId: z.string(),
      order: z.number().int().min(0).optional(),
      inputMapping: z.record(z.string()).optional(),
    }))
    .mutation(/* ... */),

  removeStep: protectedProcedure
    .input(z.object({ stepId: z.string() }))
    .mutation(/* ... */),

  reorderSteps: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      stepIds: z.array(z.string()), // New order
    }))
    .mutation(/* ... */),

  // Execution
  execute: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      initialInput: z.record(z.any()),
    }))
    .mutation(/* ... */),

  cancelExecution: protectedProcedure
    .input(z.object({ executionId: z.string() }))
    .mutation(/* ... */),

  // Execution History
  getExecution: protectedProcedure
    .input(z.object({ executionId: z.string() }))
    .query(/* ... */),

  listExecutions: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      limit: z.number().min(1).max(50).default(10),
      cursor: z.string().optional(),
    }))
    .query(/* ... */),
});
```

### 5.2 Execution Service

```typescript
// services/workflow-execution.ts
interface WorkflowExecutionService {
  // Start execution - returns execution ID
  start(workflowId: string, userId: string, initialInput: Record<string, any>): Promise<string>;

  // Execute next step (called internally or by job queue)
  executeStep(executionId: string, stepOrder: number): Promise<StepExecutionResult>;

  // Cancel running execution
  cancel(executionId: string): Promise<void>;

  // Get real-time status (for polling or SSE)
  getStatus(executionId: string): Promise<ExecutionStatus>;
}

interface StepExecutionResult {
  success: boolean;
  output?: string;
  tokens: number;
  cost: number;
  durationMs: number;
  error?: string;
}

interface ExecutionStatus {
  status: WorkflowExecutionStatus;
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    order: number;
    status: StepExecutionStatus;
    output?: string;
  }>;
}
```

---

## 6. UI Design

### 6.1 New Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/workflows` | WorkflowListPage | List all workflows |
| `/workflows/new` | WorkflowBuilderPage | Create new workflow |
| `/workflows/[id]` | WorkflowDetailPage | View/run workflow |
| `/workflows/[id]/edit` | WorkflowBuilderPage | Edit existing workflow |
| `/workflows/[id]/executions` | ExecutionHistoryPage | Past executions |
| `/workflows/[id]/executions/[execId]` | ExecutionDetailPage | Single execution detail |

### 6.2 Key Components

```
components/workflows/
├── WorkflowCard.tsx           # Preview card for list view
├── WorkflowBuilder.tsx        # Main builder with step management
├── StepList.tsx               # Drag-drop reorderable step list
├── StepCard.tsx               # Individual step with prompt preview
├── InputMappingEditor.tsx     # Define variable mappings
├── VariableSelector.tsx       # Select from available variables
├── WorkflowRunner.tsx         # Run workflow modal/page
├── ExecutionProgress.tsx      # Real-time progress display
├── StepOutput.tsx             # Display step output
├── ExecutionHistory.tsx       # List of past executions
└── ExecutionDetail.tsx        # Full execution detail view
```

### 6.3 Workflow Builder Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Workflows                                    [Save]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Workflow Name: [____________________________]                  │
│  Description:   [____________________________]                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  STEPS                                          [+ Add Step]    │
│  ─────                                                          │
│  ┌─ 1 ─────────────────────────────────────────────────────┐   │
│  │ ≡  Extract Key Points                           [✕]     │   │
│  │    Variables: {{text}}                                   │   │
│  │    Input: [initial.text ▼]                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                     │
│  ┌─ 2 ─────────────────────────────────────────────────────┐   │
│  │ ≡  Summarize for Executive                      [✕]     │   │
│  │    Variables: {{content}}, {{tone}}                      │   │
│  │    Input: [step.1.output ▼], [initial.tone ▼]           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                     │
│  ┌─ 3 ─────────────────────────────────────────────────────┐   │
│  │ ≡  Generate Action Items                        [✕]     │   │
│  │    Variables: {{summary}}                                │   │
│  │    Input: [step.2.output ▼]                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  Initial Inputs Required:                                       │
│    • text (string)                                              │
│    • tone (string)                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Workflow Runner Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ Run: Extract → Summarize → Actions                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INITIAL INPUTS                                                 │
│  ──────────────                                                 │
│  text: [                                                    ]   │
│        [                                                    ]   │
│                                                                 │
│  tone: [professional ▼]                                         │
│                                                                 │
│                                      [Cancel]  [Run Workflow]   │
├─────────────────────────────────────────────────────────────────┤
│  PROGRESS                                                       │
│  ────────                                                       │
│  ✓ Step 1: Extract Key Points              23 sec | 1,234 tok  │
│    Output: "Key points: 1. Revenue grew..."                     │
│                                                                 │
│  ◉ Step 2: Summarize for Executive         Running...          │
│    [████████░░░░░░░░░░░░]                                       │
│                                                                 │
│  ○ Step 3: Generate Action Items           Pending              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Total: ~$0.02 estimated | 2 of 3 steps complete                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Implementation Phases

### Phase 1A: Foundation (Week 1-2)

- [ ] Create Prisma schema for Workflow models
- [ ] Run migration
- [ ] Create basic tRPC router (CRUD for workflows)
- [ ] Create basic tRPC router (CRUD for steps)
- [ ] Unit tests for routers

### Phase 1B: Execution Engine (Week 3-4)

- [ ] Create WorkflowExecutionService
- [ ] Implement sequential step execution
- [ ] Implement input/output variable mapping
- [ ] Integrate with existing distillation service
- [ ] Add execution status tracking
- [ ] Create AiUsageLog entries for workflow executions
- [ ] Integration tests for execution

### Phase 1C: Builder UI (Week 5-7)

- [ ] WorkflowListPage with cards
- [ ] WorkflowBuilder component
- [ ] StepList with drag-drop (use @dnd-kit)
- [ ] InputMappingEditor
- [ ] Add/remove/reorder steps
- [ ] Save workflow with validation
- [ ] E2E tests for builder

### Phase 1D: Runner UI (Week 8-9)

- [ ] WorkflowRunner modal/page
- [ ] Initial input form (dynamic based on workflow)
- [ ] ExecutionProgress component
- [ ] Real-time step status updates (polling initially)
- [ ] StepOutput display
- [ ] Cancel execution
- [ ] E2E tests for runner

### Phase 1E: History & Polish (Week 10-12)

- [ ] ExecutionHistory list
- [ ] ExecutionDetail page
- [ ] Re-run with same inputs
- [ ] Token/cost display
- [ ] Error handling improvements
- [ ] Loading states and skeletons
- [ ] Mobile responsiveness
- [ ] Accessibility review
- [ ] Analytics events

---

## 8. Analytics Events

| Event | Properties | Trigger |
|-------|------------|---------|
| `workflow_created` | workflowId, stepCount, workspaceId | User saves new workflow |
| `workflow_updated` | workflowId, changes[] | User updates workflow |
| `workflow_deleted` | workflowId | User deletes workflow |
| `workflow_execution_started` | workflowId, executionId, stepCount | User runs workflow |
| `workflow_execution_completed` | executionId, stepCount, totalTokens, totalCost, durationMs | Workflow completes |
| `workflow_execution_failed` | executionId, failedStep, errorType | Workflow fails |
| `workflow_execution_cancelled` | executionId, cancelledAtStep | User cancels |
| `workflow_step_completed` | executionId, stepOrder, tokens, durationMs | Step completes |
| `workflow_shared` | workflowId, workspaceId | User shares to workspace |

---

## 9. Out of Scope (Future)

The following are explicitly **not** in Phase 1:

- Conditional branching (if/else in workflows)
- Parallel step execution
- Workflow templates (pre-built workflows)
- Workflow versioning
- Scheduled/recurring workflow execution
- Webhook triggers
- n8n/Zapier integration
- "Suggested next prompt" AI feature
- Workflow from captured conversation
- Public workflow marketplace

---

## 10. Open Questions

| Question | Options | Decision |
|----------|---------|----------|
| Real-time updates | Polling vs SSE vs WebSocket | Start with polling (simpler), migrate to SSE if needed |
| Execution timeout | Per-step vs per-workflow | Per-step (60s default), configurable |
| Step failure behavior | Stop vs skip vs retry | Stop (simplest), add retry later |
| Cost limits | Hard limit vs warning | Warning at $1, hard limit at $5 per execution |

---

## 11. Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| @dnd-kit/core | UI | Drag-drop for step reordering |
| BullMQ | Backend | Optional, for background execution (if needed) |
| Existing distillation service | Internal | Reuse for prompt execution |
| Existing prompt variable extraction | Internal | `{{variable}}` parsing |

---

## 12. Acceptance Criteria

**Workflow is complete when:**

1. User can create a workflow with 2+ prompts
2. User can define input variable mappings between steps
3. User can run a workflow and see progress in real-time
4. Each step's output is recorded and visible
5. Execution history is saved and viewable
6. Workflows can be shared with workspace members
7. Token usage and cost are tracked per execution
8. All MUST requirements from Section 3 are met
9. E2E tests pass for happy path
10. Analytics events fire correctly

---

*Last Updated: 2025-11-30*

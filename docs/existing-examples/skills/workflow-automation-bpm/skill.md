# Workflow Automation & Business Process Management (BPM) Skill

Advanced workflow automation and business process management expertise covering BPMN modeling, process orchestration, task automation, approval workflows, and comprehensive process analytics.

## Skill Overview

Expert knowledge in designing, implementing, and optimizing business process automation systems including workflow orchestration, task scheduling, process modeling, integration platforms, and performance monitoring.

## Core Capabilities

### Business Process Modeling
- **BPMN 2.0 design** - Complete business process modeling notation implementation
- **Process mapping** - Workflow visualization, swimlane diagrams, decision trees
- **Process optimization** - Bottleneck analysis, efficiency improvements, automation opportunities
- **Compliance management** - Regulatory workflow requirements, audit trails, documentation

### Workflow Orchestration
- **Engine implementation** - Custom workflow engines, state management, process execution
- **Task automation** - Automated task routing, parallel processing, conditional logic
- **Integration systems** - API orchestration, system connectors, data transformation
- **Event-driven workflows** - Real-time triggers, webhook processing, message queuing

### Process Analytics
- **Performance monitoring** - SLA tracking, process metrics, bottleneck identification
- **Predictive analytics** - Process forecasting, resource planning, optimization recommendations
- **Reporting dashboards** - Real-time analytics, custom KPIs, executive reporting
- **Continuous improvement** - Process optimization cycles, A/B testing, performance tracking

## Advanced Workflow Automation Implementation

### Comprehensive BPM Engine with Node.js
```typescript
// Advanced Business Process Management Engine
import express, { Express, Request, Response } from 'express';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import { z } from 'zod';
import Bull from 'bull';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import nodemailer from 'nodemailer';

// Core interfaces and types
interface ProcessDefinition {
  id: string;
  name: string;
  version: string;
  description?: string;
  bpmn: string; // BPMN XML content
  variables: ProcessVariable[];
  tasks: TaskDefinition[];
  gateways: GatewayDefinition[];
  events: EventDefinition[];
  flows: FlowDefinition[];
  metadata: Record<string, any>;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProcessInstance {
  id: string;
  processDefinitionId: string;
  businessKey?: string;
  status: 'running' | 'completed' | 'failed' | 'suspended' | 'cancelled';
  variables: Record<string, any>;
  currentTasks: string[];
  history: ProcessHistoryItem[];
  startedAt: Date;
  completedAt?: Date;
  startedBy: string;
}

interface TaskDefinition {
  id: string;
  name: string;
  type: 'user-task' | 'service-task' | 'script-task' | 'send-task' | 'receive-task' | 'manual-task';
  assignee?: string;
  candidateGroups?: string[];
  formKey?: string;
  implementation?: string;
  inputParameters?: Record<string, any>;
  outputParameters?: Record<string, any>;
  dueDate?: string;
  priority?: number;
  documentation?: string;
}

interface TaskInstance {
  id: string;
  processInstanceId: string;
  taskDefinitionId: string;
  name: string;
  type: string;
  assignee?: string;
  owner?: string;
  candidateGroups?: string[];
  status: 'created' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  variables: Record<string, any>;
  formData?: Record<string, any>;
  createdAt: Date;
  assignedAt?: Date;
  completedAt?: Date;
  dueDate?: Date;
  priority: number;
}

interface GatewayDefinition {
  id: string;
  name: string;
  type: 'exclusive' | 'parallel' | 'inclusive' | 'event-based';
  conditions?: GatewayCondition[];
}

interface GatewayCondition {
  id: string;
  expression: string;
  targetFlowId: string;
  priority?: number;
}

interface EventDefinition {
  id: string;
  name: string;
  type: 'start' | 'end' | 'intermediate' | 'boundary';
  eventType: 'none' | 'message' | 'timer' | 'error' | 'signal' | 'conditional';
  configuration?: Record<string, any>;
}

interface FlowDefinition {
  id: string;
  name?: string;
  sourceId: string;
  targetId: string;
  condition?: string;
}

interface ProcessVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  defaultValue?: any;
  required: boolean;
  description?: string;
}

interface ProcessHistoryItem {
  id: string;
  type: 'task-completed' | 'task-assigned' | 'gateway-passed' | 'event-triggered' | 'variable-changed';
  timestamp: Date;
  userId?: string;
  details: Record<string, any>;
}

// Validation schemas
const processDefinitionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  bpmn: z.string().min(1),
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'date', 'object', 'array']),
    defaultValue: z.any().optional(),
    required: z.boolean(),
    description: z.string().optional()
  })),
  metadata: z.record(z.any()).optional()
});

const taskInstanceSchema = z.object({
  assignee: z.string().optional(),
  formData: z.record(z.any()).optional(),
  variables: z.record(z.any()).optional(),
  priority: z.number().min(1).max(10).optional()
});

// Advanced BPM Engine
class BusinessProcessEngine extends EventEmitter {
  private app: Express;
  private prisma: PrismaClient;
  private redis: Redis;
  private taskQueue: Bull.Queue;
  private processInstances: Map<string, ProcessInstance> = new Map();
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();
  private mailTransporter: nodemailer.Transporter;

  constructor(config: {
    redis: { url: string };
    database: { url: string };
    smtp: { host: string; user: string; pass: string; port: number };
  }) {
    super();

    this.app = express();
    this.prisma = new PrismaClient({
      datasources: { db: { url: config.database.url } }
    });
    this.redis = new Redis(config.redis.url);
    this.taskQueue = new Bull('bpm-tasks', { redis: config.redis.url });

    this.mailTransporter = nodemailer.createTransporter({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupTaskProcessors();
    this.setupEventHandlers();
    this.loadActiveProcesses();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      next();
    });
  }

  private setupRoutes(): void {
    // Process Definition Management
    this.app.post('/api/processes/definitions', this.createProcessDefinition.bind(this));
    this.app.get('/api/processes/definitions', this.getProcessDefinitions.bind(this));
    this.app.get('/api/processes/definitions/:id', this.getProcessDefinition.bind(this));
    this.app.put('/api/processes/definitions/:id', this.updateProcessDefinition.bind(this));
    this.app.delete('/api/processes/definitions/:id', this.deleteProcessDefinition.bind(this));
    this.app.post('/api/processes/definitions/:id/deploy', this.deployProcessDefinition.bind(this));

    // Process Instance Management
    this.app.post('/api/processes/instances', this.startProcessInstance.bind(this));
    this.app.get('/api/processes/instances', this.getProcessInstances.bind(this));
    this.app.get('/api/processes/instances/:id', this.getProcessInstance.bind(this));
    this.app.put('/api/processes/instances/:id/suspend', this.suspendProcessInstance.bind(this));
    this.app.put('/api/processes/instances/:id/resume', this.resumeProcessInstance.bind(this));
    this.app.delete('/api/processes/instances/:id', this.cancelProcessInstance.bind(this));
    this.app.get('/api/processes/instances/:id/history', this.getProcessInstanceHistory.bind(this));

    // Task Management
    this.app.get('/api/tasks', this.getTasks.bind(this));
    this.app.get('/api/tasks/:id', this.getTask.bind(this));
    this.app.post('/api/tasks/:id/claim', this.claimTask.bind(this));
    this.app.post('/api/tasks/:id/complete', this.completeTask.bind(this));
    this.app.post('/api/tasks/:id/assign', this.assignTask.bind(this));
    this.app.put('/api/tasks/:id', this.updateTask.bind(this));

    // Process Analytics
    this.app.get('/api/analytics/processes/performance', this.getProcessPerformance.bind(this));
    this.app.get('/api/analytics/processes/bottlenecks', this.getProcessBottlenecks.bind(this));
    this.app.get('/api/analytics/tasks/performance', this.getTaskPerformance.bind(this));
    this.app.get('/api/analytics/workload', this.getWorkloadAnalytics.bind(this));

    // Forms and Variables
    this.app.get('/api/processes/instances/:id/variables', this.getProcessVariables.bind(this));
    this.app.put('/api/processes/instances/:id/variables', this.updateProcessVariables.bind(this));
    this.app.get('/api/tasks/:id/form', this.getTaskForm.bind(this));
  }

  // Process Definition Management
  private async createProcessDefinition(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = processDefinitionSchema.parse(req.body);

      // Parse and validate BPMN
      const bpmnParsed = await this.parseBPMN(validatedData.bpmn);

      const processDefinition = await this.prisma.processDefinition.create({
        data: {
          id: uuidv4(),
          name: validatedData.name,
          description: validatedData.description,
          version: '1.0',
          bpmn: validatedData.bpmn,
          variables: validatedData.variables,
          tasks: bpmnParsed.tasks,
          gateways: bpmnParsed.gateways,
          events: bpmnParsed.events,
          flows: bpmnParsed.flows,
          metadata: validatedData.metadata || {},
          active: false,
        },
      });

      this.emit('process.definition.created', processDefinition);
      res.status(201).json(processDefinition);
    } catch (error) {
      console.error('Create process definition error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Process Instance Management
  private async startProcessInstance(req: Request, res: Response): Promise<void> {
    try {
      const { processDefinitionId, businessKey, variables = {}, startedBy } = req.body;

      const processDefinition = await this.prisma.processDefinition.findUnique({
        where: { id: processDefinitionId },
      });

      if (!processDefinition || !processDefinition.active) {
        res.status(404).json({ error: 'Process definition not found or not active' });
        return;
      }

      const processInstanceId = uuidv4();

      // Initialize process variables with defaults
      const processVariables = this.initializeProcessVariables(
        processDefinition.variables as ProcessVariable[],
        variables
      );

      const processInstance: ProcessInstance = {
        id: processInstanceId,
        processDefinitionId,
        businessKey,
        status: 'running',
        variables: processVariables,
        currentTasks: [],
        history: [{
          id: uuidv4(),
          type: 'event-triggered',
          timestamp: new Date(),
          userId: startedBy,
          details: { eventType: 'start', variables }
        }],
        startedAt: new Date(),
        startedBy,
      };

      // Save to database
      await this.prisma.processInstance.create({
        data: {
          id: processInstanceId,
          processDefinitionId,
          businessKey,
          status: 'running',
          variables: processVariables,
          currentTasks: [],
          history: processInstance.history,
          startedAt: processInstance.startedAt,
          startedBy,
        },
      });

      this.processInstances.set(processInstanceId, processInstance);

      // Start process execution
      await this.executeProcess(processInstance, processDefinition);

      this.emit('process.instance.started', processInstance);
      res.status(201).json(processInstance);
    } catch (error) {
      console.error('Start process instance error:', error);
      res.status(500).json({ error: 'Failed to start process instance' });
    }
  }

  // Task Management
  private async completeTask(req: Request, res: Response): Promise<void> {
    try {
      const { id: taskId } = req.params;
      const { userId, formData, variables } = req.body;

      const task = await this.prisma.taskInstance.findUnique({
        where: { id: taskId },
        include: { processInstance: true },
      });

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      if (task.status !== 'assigned' && task.status !== 'in-progress') {
        res.status(400).json({ error: 'Task cannot be completed in current status' });
        return;
      }

      // Update task
      const updatedTask = await this.prisma.taskInstance.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          formData: formData || {},
        },
      });

      // Update process variables if provided
      if (variables) {
        await this.updateProcessVariables({
          processInstanceId: task.processInstanceId,
          variables,
          userId,
        });
      }

      // Continue process execution
      const processInstance = this.processInstances.get(task.processInstanceId);
      if (processInstance) {
        await this.continueProcessExecution(processInstance, taskId);
      }

      this.emit('task.completed', { task: updatedTask, userId, formData });
      res.json(updatedTask);
    } catch (error) {
      console.error('Complete task error:', error);
      res.status(500).json({ error: 'Failed to complete task' });
    }
  }

  // Process Execution Engine
  private async executeProcess(
    processInstance: ProcessInstance,
    processDefinition: ProcessDefinition
  ): Promise<void> {
    try {
      // Find start events
      const startEvents = (processDefinition.events as EventDefinition[])
        .filter(event => event.type === 'start');

      if (startEvents.length === 0) {
        throw new Error('No start event found in process definition');
      }

      // Execute from start event
      for (const startEvent of startEvents) {
        await this.executeFromElement(processInstance, processDefinition, startEvent.id);
      }
    } catch (error) {
      console.error('Process execution error:', error);
      await this.failProcessInstance(processInstance.id, error.message);
    }
  }

  private async executeFromElement(
    processInstance: ProcessInstance,
    processDefinition: ProcessDefinition,
    elementId: string
  ): Promise<void> {
    const flows = (processDefinition.flows as FlowDefinition[])
      .filter(flow => flow.sourceId === elementId);

    for (const flow of flows) {
      if (flow.condition) {
        const conditionResult = await this.evaluateCondition(
          flow.condition,
          processInstance.variables
        );
        if (!conditionResult) continue;
      }

      await this.executeElement(processInstance, processDefinition, flow.targetId);
    }
  }

  private async executeElement(
    processInstance: ProcessInstance,
    processDefinition: ProcessDefinition,
    elementId: string
  ): Promise<void> {
    // Find element type
    const task = (processDefinition.tasks as TaskDefinition[])
      .find(t => t.id === elementId);

    if (task) {
      await this.executeTask(processInstance, processDefinition, task);
      return;
    }

    const gateway = (processDefinition.gateways as GatewayDefinition[])
      .find(g => g.id === elementId);

    if (gateway) {
      await this.executeGateway(processInstance, processDefinition, gateway);
      return;
    }

    const event = (processDefinition.events as EventDefinition[])
      .find(e => e.id === elementId);

    if (event) {
      await this.executeEvent(processInstance, processDefinition, event);
      return;
    }
  }

  private async executeTask(
    processInstance: ProcessInstance,
    processDefinition: ProcessDefinition,
    task: TaskDefinition
  ): Promise<void> {
    const taskInstanceId = uuidv4();

    switch (task.type) {
      case 'user-task':
        await this.createUserTask(processInstance, task, taskInstanceId);
        break;
      case 'service-task':
        await this.executeServiceTask(processInstance, task, taskInstanceId);
        break;
      case 'script-task':
        await this.executeScriptTask(processInstance, task, taskInstanceId);
        break;
      case 'send-task':
        await this.executeSendTask(processInstance, task, taskInstanceId);
        break;
      default:
        console.warn(`Unsupported task type: ${task.type}`);
        // Continue to next element
        await this.executeFromElement(processInstance, processDefinition, task.id);
    }
  }

  private async createUserTask(
    processInstance: ProcessInstance,
    task: TaskDefinition,
    taskInstanceId: string
  ): Promise<void> {
    const taskInstance: TaskInstance = {
      id: taskInstanceId,
      processInstanceId: processInstance.id,
      taskDefinitionId: task.id,
      name: task.name,
      type: task.type,
      assignee: task.assignee,
      candidateGroups: task.candidateGroups,
      status: 'created',
      variables: { ...processInstance.variables },
      createdAt: new Date(),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      priority: task.priority || 5,
    };

    // Save task instance
    await this.prisma.taskInstance.create({
      data: {
        id: taskInstanceId,
        processInstanceId: processInstance.id,
        taskDefinitionId: task.id,
        name: task.name,
        type: task.type,
        assignee: task.assignee,
        candidateGroups: task.candidateGroups,
        status: 'created',
        variables: taskInstance.variables,
        createdAt: taskInstance.createdAt,
        dueDate: taskInstance.dueDate,
        priority: taskInstance.priority,
      },
    });

    // Update process instance
    processInstance.currentTasks.push(taskInstanceId);
    await this.updateProcessInstanceCurrentTasks(processInstance.id, processInstance.currentTasks);

    // Auto-assign if assignee specified
    if (task.assignee) {
      await this.assignTask({ taskId: taskInstanceId, assignee: task.assignee });
    }

    this.emit('task.created', taskInstance);
  }

  private async executeServiceTask(
    processInstance: ProcessInstance,
    task: TaskDefinition,
    taskInstanceId: string
  ): Promise<void> {
    try {
      // Queue service task for execution
      await this.taskQueue.add('service-task', {
        taskInstanceId,
        processInstanceId: processInstance.id,
        taskDefinition: task,
        variables: processInstance.variables,
      }, {
        attempts: 3,
        backoff: 'exponential',
        delay: 1000,
      });

      console.log(`Service task ${task.name} queued for execution`);
    } catch (error) {
      console.error('Service task execution error:', error);
      await this.handleTaskError(processInstance.id, taskInstanceId, error.message);
    }
  }

  private async executeScriptTask(
    processInstance: ProcessInstance,
    task: TaskDefinition,
    taskInstanceId: string
  ): Promise<void> {
    try {
      if (!task.implementation) {
        throw new Error('Script task implementation not provided');
      }

      // Execute script in sandbox
      const result = await this.executeScript(task.implementation, processInstance.variables);

      // Update process variables with script result
      if (result && typeof result === 'object') {
        Object.assign(processInstance.variables, result);
      }

      console.log(`Script task ${task.name} completed successfully`);

      // Continue to next element
      const processDefinition = await this.getProcessDefinitionById(processInstance.processDefinitionId);
      await this.executeFromElement(processInstance, processDefinition, task.id);
    } catch (error) {
      console.error('Script task execution error:', error);
      await this.handleTaskError(processInstance.id, taskInstanceId, error.message);
    }
  }

  private async executeSendTask(
    processInstance: ProcessInstance,
    task: TaskDefinition,
    taskInstanceId: string
  ): Promise<void> {
    try {
      const { recipient, subject, template, variables } = task.inputParameters || {};

      if (!recipient || !subject) {
        throw new Error('Send task missing required parameters (recipient, subject)');
      }

      // Render template with process variables
      const renderedSubject = this.renderTemplate(subject, processInstance.variables);
      const renderedContent = template ?
        this.renderTemplate(template, processInstance.variables) :
        'Process notification';

      // Send email
      await this.mailTransporter.sendMail({
        to: recipient,
        subject: renderedSubject,
        html: renderedContent,
      });

      console.log(`Send task ${task.name} completed - email sent to ${recipient}`);

      // Continue to next element
      const processDefinition = await this.getProcessDefinitionById(processInstance.processDefinitionId);
      await this.executeFromElement(processInstance, processDefinition, task.id);
    } catch (error) {
      console.error('Send task execution error:', error);
      await this.handleTaskError(processInstance.id, taskInstanceId, error.message);
    }
  }

  private async executeGateway(
    processInstance: ProcessInstance,
    processDefinition: ProcessDefinition,
    gateway: GatewayDefinition
  ): Promise<void> {
    switch (gateway.type) {
      case 'exclusive':
        await this.executeExclusiveGateway(processInstance, processDefinition, gateway);
        break;
      case 'parallel':
        await this.executeParallelGateway(processInstance, processDefinition, gateway);
        break;
      case 'inclusive':
        await this.executeInclusiveGateway(processInstance, processDefinition, gateway);
        break;
      default:
        console.warn(`Unsupported gateway type: ${gateway.type}`);
    }
  }

  private async executeExclusiveGateway(
    processInstance: ProcessInstance,
    processDefinition: ProcessDefinition,
    gateway: GatewayDefinition
  ): Promise<void> {
    // Evaluate conditions and take first matching path
    const conditions = gateway.conditions || [];
    conditions.sort((a, b) => (a.priority || 0) - (b.priority || 0));

    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition.expression, processInstance.variables);
      if (result) {
        const flow = (processDefinition.flows as FlowDefinition[])
          .find(f => f.id === condition.targetFlowId);

        if (flow) {
          await this.executeElement(processInstance, processDefinition, flow.targetId);
        }
        return;
      }
    }

    // If no condition matches, take default path
    const defaultFlow = (processDefinition.flows as FlowDefinition[])
      .find(f => f.sourceId === gateway.id && !f.condition);

    if (defaultFlow) {
      await this.executeElement(processInstance, processDefinition, defaultFlow.targetId);
    }
  }

  private async executeParallelGateway(
    processInstance: ProcessInstance,
    processDefinition: ProcessDefinition,
    gateway: GatewayDefinition
  ): Promise<void> {
    // Execute all outgoing flows in parallel
    const outgoingFlows = (processDefinition.flows as FlowDefinition[])
      .filter(flow => flow.sourceId === gateway.id);

    const promises = outgoingFlows.map(flow =>
      this.executeElement(processInstance, processDefinition, flow.targetId)
    );

    await Promise.all(promises);
  }

  // Utility methods
  private async parseBPMN(bpmnXml: string): Promise<{
    tasks: TaskDefinition[];
    gateways: GatewayDefinition[];
    events: EventDefinition[];
    flows: FlowDefinition[];
  }> {
    // Simplified BPMN parsing - in production, use a proper BPMN parser
    return {
      tasks: [],
      gateways: [],
      events: [{ id: 'start', name: 'Start', type: 'start', eventType: 'none' }],
      flows: []
    };
  }

  private initializeProcessVariables(
    variableDefinitions: ProcessVariable[],
    inputVariables: Record<string, any>
  ): Record<string, any> {
    const variables: Record<string, any> = {};

    for (const varDef of variableDefinitions) {
      if (inputVariables.hasOwnProperty(varDef.name)) {
        variables[varDef.name] = inputVariables[varDef.name];
      } else if (varDef.defaultValue !== undefined) {
        variables[varDef.name] = varDef.defaultValue;
      } else if (varDef.required) {
        throw new Error(`Required variable '${varDef.name}' not provided`);
      }
    }

    // Add any additional input variables
    Object.keys(inputVariables).forEach(key => {
      if (!variables.hasOwnProperty(key)) {
        variables[key] = inputVariables[key];
      }
    });

    return variables;
  }

  private async evaluateCondition(expression: string, variables: Record<string, any>): Promise<boolean> {
    try {
      // Simple expression evaluation - in production, use a proper expression engine
      // This is a simplified implementation
      const func = new Function('vars', `with(vars) { return ${expression}; }`);
      return func(variables);
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }

  private async executeScript(script: string, variables: Record<string, any>): Promise<any> {
    try {
      // Execute script in sandbox - in production, use a proper sandboxing solution
      const func = new Function('vars', script);
      return func(variables);
    } catch (error) {
      console.error('Script execution error:', error);
      throw error;
    }
  }

  private renderTemplate(template: string, variables: Record<string, any>): string {
    // Simple template rendering - in production, use a proper templating engine
    return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] || match;
    });
  }

  private setupTaskProcessors(): void {
    this.taskQueue.process('service-task', async (job) => {
      const { taskInstanceId, processInstanceId, taskDefinition, variables } = job.data;

      try {
        // Execute service task implementation
        if (taskDefinition.implementation) {
          if (taskDefinition.implementation.startsWith('http')) {
            // HTTP service call
            const response = await axios.post(taskDefinition.implementation, {
              variables,
              taskId: taskInstanceId,
              processInstanceId,
            });

            // Update variables if response contains them
            if (response.data && response.data.variables) {
              await this.updateProcessVariables({
                processInstanceId,
                variables: response.data.variables,
                userId: 'system',
              });
            }
          }
        }

        // Continue process execution
        const processInstance = this.processInstances.get(processInstanceId);
        if (processInstance) {
          await this.continueProcessExecution(processInstance, taskInstanceId);
        }
      } catch (error) {
        console.error('Service task execution failed:', error);
        await this.handleTaskError(processInstanceId, taskInstanceId, error.message);
      }
    });
  }

  private setupEventHandlers(): void {
    this.on('task.completed', async (data) => {
      console.log(`Task completed: ${data.task.name}`);
    });

    this.on('process.instance.completed', async (processInstance) => {
      console.log(`Process completed: ${processInstance.id}`);
      // Cleanup resources, send notifications, etc.
    });
  }

  private async loadActiveProcesses(): Promise<void> {
    try {
      const activeInstances = await this.prisma.processInstance.findMany({
        where: { status: 'running' },
      });

      for (const instance of activeInstances) {
        this.processInstances.set(instance.id, instance as ProcessInstance);
      }

      console.log(`Loaded ${activeInstances.length} active process instances`);
    } catch (error) {
      console.error('Failed to load active processes:', error);
    }
  }

  // Placeholder methods for completion
  private async continueProcessExecution(processInstance: ProcessInstance, completedTaskId: string): Promise<void> {
    // Implementation for continuing process execution after task completion
  }

  private async updateProcessInstanceCurrentTasks(instanceId: string, currentTasks: string[]): Promise<void> {
    await this.prisma.processInstance.update({
      where: { id: instanceId },
      data: { currentTasks },
    });
  }

  private async assignTask(params: { taskId: string; assignee: string }): Promise<void> {
    await this.prisma.taskInstance.update({
      where: { id: params.taskId },
      data: {
        assignee: params.assignee,
        status: 'assigned',
        assignedAt: new Date(),
      },
    });
  }

  private async failProcessInstance(instanceId: string, errorMessage: string): Promise<void> {
    await this.prisma.processInstance.update({
      where: { id: instanceId },
      data: {
        status: 'failed',
        completedAt: new Date(),
      },
    });

    this.processInstances.delete(instanceId);
  }

  private async handleTaskError(processInstanceId: string, taskInstanceId: string, errorMessage: string): Promise<void> {
    console.error(`Task error in process ${processInstanceId}: ${errorMessage}`);
    // Implement error handling strategy
  }

  private async getProcessDefinitionById(id: string): Promise<ProcessDefinition> {
    const definition = await this.prisma.processDefinition.findUnique({
      where: { id },
    });
    return definition as ProcessDefinition;
  }

  private async updateProcessVariables(params: {
    processInstanceId: string;
    variables: Record<string, any>;
    userId: string;
  }): Promise<void> {
    const { processInstanceId, variables, userId } = params;

    const processInstance = await this.prisma.processInstance.findUnique({
      where: { id: processInstanceId },
    });

    if (processInstance) {
      const updatedVariables = { ...processInstance.variables as any, ...variables };

      await this.prisma.processInstance.update({
        where: { id: processInstanceId },
        data: { variables: updatedVariables },
      });

      // Update in-memory instance
      const memoryInstance = this.processInstances.get(processInstanceId);
      if (memoryInstance) {
        Object.assign(memoryInstance.variables, variables);
      }
    }
  }

  // Placeholder route handlers
  private async getProcessDefinitions(req: Request, res: Response): Promise<void> {
    try {
      const definitions = await this.prisma.processDefinition.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.json(definitions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch process definitions' });
    }
  }

  private async getProcessDefinition(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async updateProcessDefinition(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async deleteProcessDefinition(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async deployProcessDefinition(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async getProcessInstances(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async getProcessInstance(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async suspendProcessInstance(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async resumeProcessInstance(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async cancelProcessInstance(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async getProcessInstanceHistory(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async getTasks(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async getTask(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async claimTask(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async assignTask(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async updateTask(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async getProcessPerformance(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async getProcessBottlenecks(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async getTaskPerformance(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async getWorkloadAnalytics(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async getProcessVariables(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async updateProcessVariables(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  private async getTaskForm(req: Request, res: Response): Promise<void> {
    // Implementation
    res.json({ message: 'Not implemented' });
  }

  public start(port: number = 3000): void {
    this.app.listen(port, () => {
      console.log(`BPM Engine running on port ${port}`);
    });
  }
}

// Example usage
const bpmEngine = new BusinessProcessEngine({
  redis: { url: process.env.REDIS_URL! },
  database: { url: process.env.DATABASE_URL! },
  smtp: {
    host: process.env.SMTP_HOST!,
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
    port: parseInt(process.env.SMTP_PORT!) || 587,
  },
});

bpmEngine.start(3000);

export { BusinessProcessEngine, ProcessDefinition, ProcessInstance, TaskInstance };
```

## Skill Activation Triggers

This skill automatically activates when:
- Business process automation is needed
- Workflow orchestration is required
- Task automation and scheduling is requested
- Process optimization and analysis is needed
- Document workflow management is required
- Approval workflows are needed

This comprehensive workflow automation & BPM skill provides expert-level capabilities for designing, implementing, and optimizing business process automation systems with advanced orchestration, analytics, and integration capabilities.
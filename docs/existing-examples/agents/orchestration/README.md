# Agent Orchestration & Coordination Templates

This directory contains templates for coordinating multiple Claude Code agents to work together on complex, multi-faceted tasks. These templates enable sophisticated workflows where specialized agents collaborate, hand off work, and build upon each other's contributions.

## Overview

Agent orchestration allows teams to break down complex tasks into specialized components, with each agent focusing on their area of expertise while maintaining coordination and consistency across the entire workflow.

**Key Benefits:**
- **Specialization**: Each agent focuses on their area of expertise
- **Parallel Processing**: Multiple agents can work simultaneously on different aspects
- **Quality Assurance**: Built-in review and validation steps between agents
- **Scalability**: Complex tasks can be systematically broken down and managed

## Templates Included

### Core Orchestration Patterns

1. **sequential-handoff.md** - Sequential workflow where agents pass work in order
2. **parallel-convergence.md** - Multiple agents work in parallel then converge
3. **review-approve.md** - Multi-stage review and approval workflow
4. **iterative-refinement.md** - Agents iteratively improve each other's work

### Specialized Coordination Templates

5. **code-pipeline.md** - End-to-end code development with multiple specialists
6. **content-production.md** - Collaborative content creation and editing
7. **system-architecture.md** - Multi-agent system design and implementation
8. **incident-response.md** - Coordinated incident investigation and resolution

### Advanced Orchestration Patterns

9. **dynamic-routing.md** - Smart routing based on task requirements
10. **quality-gates.md** - Automated quality checkpoints between stages
11. **rollback-recovery.md** - Error handling and rollback mechanisms
12. **performance-optimization.md** - Multi-agent performance analysis and optimization

## Quick Start Guide

### 1. Choose Your Pattern

Select the orchestration pattern that best fits your task:

- **Sequential tasks**: Use sequential-handoff.md for tasks requiring step-by-step completion
- **Independent components**: Use parallel-convergence.md for work that can be done simultaneously
- **Quality critical**: Use review-approve.md for tasks requiring multiple validation stages

### 2. Customize Agent Roles

Define specific roles for each agent in your workflow:

```markdown
## Agent Coordination Plan

### Primary Agent: Backend Developer
- **Responsibilities**: API implementation, database design, server setup
- **Handoff Criteria**: Complete API endpoints with tests
- **Next Agent**: Frontend Developer

### Secondary Agent: Frontend Developer
- **Responsibilities**: UI implementation, API integration, user experience
- **Prerequisites**: Complete backend API
- **Handoff Criteria**: Functional frontend with backend integration

### Quality Agent: Code Reviewer
- **Responsibilities**: Code review, security audit, performance analysis
- **Prerequisites**: Complete implementation from both agents
- **Output**: Approved codebase or feedback for iteration
```

### 3. Implement Coordination Protocol

Use structured handoffs between agents:

```markdown
## Handoff Protocol

### From Backend to Frontend
**Deliverables:**
- [ ] API documentation with all endpoints
- [ ] Working backend with test data
- [ ] Database schema and migrations
- [ ] Authentication/authorization implemented

**Validation Criteria:**
- [ ] All API endpoints return expected responses
- [ ] Unit tests pass with >90% coverage
- [ ] Integration tests validate full workflows
- [ ] Security scan shows no critical vulnerabilities

**Communication:**
"Backend implementation is complete. API is running on [URL] with documentation at [URL]. Frontend agent can now begin UI implementation and integration."
```

## Implementation Examples

### Example 1: Feature Development Workflow

```markdown
## Multi-Agent Feature Development

### Phase 1: Planning (Architect Agent)
- Analyze requirements and create technical specification
- Design system architecture and component interactions
- Define APIs and data models
- Create implementation timeline

**Handoff**: Technical specification and architecture diagrams

### Phase 2: Backend Implementation (Backend Agent)
- Implement APIs according to specification
- Set up database schema and migrations
- Create comprehensive test suite
- Deploy to development environment

**Handoff**: Working backend with full test coverage

### Phase 3: Frontend Implementation (Frontend Agent)
- Build UI components based on design system
- Integrate with backend APIs
- Implement responsive design and accessibility
- Add client-side validation and error handling

**Handoff**: Complete frontend application

### Phase 4: Integration & Testing (QA Agent)
- Perform end-to-end testing across full stack
- Validate business requirements are met
- Conduct security and performance testing
- Document any issues for resolution

**Output**: Validated, production-ready feature
```

### Example 2: Content Creation Pipeline

```markdown
## Multi-Agent Content Production

### Research Phase (Research Agent)
- Gather and validate technical information
- Create outline and content structure
- Identify code examples and use cases
- Compile reference materials

### Writing Phase (Technical Writer Agent)
- Create clear, comprehensive documentation
- Write step-by-step tutorials and guides
- Develop practical examples and code snippets
- Structure content for different skill levels

### Review Phase (Editor Agent)
- Review content for clarity and accuracy
- Validate all code examples work correctly
- Check links and references
- Ensure style guide compliance

### Production Phase (DevOps Agent)
- Deploy content to documentation site
- Optimize images and media assets
- Configure search indexing and analytics
- Set up automated content validation
```

## Coordination Protocols

### Status Communication Template

```markdown
## Agent Status Update

**Agent**: [Agent Name/Role]
**Task**: [Current task description]
**Status**: [In Progress/Completed/Blocked/Needs Review]
**Progress**: [Percentage or milestone indicator]

**Completed This Session:**
- [List of completed items]

**Current Focus:**
- [What the agent is working on now]

**Next Steps:**
- [Planned next actions]

**Blockers/Issues:**
- [Any issues preventing progress]

**Handoff Ready:**
- [ ] [Item 1 ready for next agent]
- [ ] [Item 2 ready for next agent]

**Notes for Next Agent:**
[Any important context or considerations]
```

### Quality Gate Checklist

```markdown
## Quality Gate Validation

### Technical Quality
- [ ] Code follows established patterns and standards
- [ ] All tests pass and coverage meets requirements
- [ ] Security scan shows no critical issues
- [ ] Performance meets established benchmarks

### Functional Quality
- [ ] Requirements are fully implemented
- [ ] User acceptance criteria are met
- [ ] Edge cases are handled appropriately
- [ ] Error conditions provide helpful feedback

### Process Quality
- [ ] Documentation is complete and accurate
- [ ] Code review feedback has been addressed
- [ ] Deployment process has been validated
- [ ] Rollback procedure is documented and tested

**Approval Status**: [Approved/Needs Work/Rejected]
**Reviewer**: [Reviewer name and role]
**Notes**: [Additional feedback or next steps]
```

## Advanced Coordination Patterns

### Dynamic Agent Selection

```markdown
## Smart Agent Routing

Based on task characteristics, route to appropriate specialist:

### Task Analysis
- **Complexity Level**: [Simple/Medium/Complex]
- **Domain**: [Frontend/Backend/DevOps/Data/Security]
- **Priority**: [Low/Medium/High/Critical]
- **Timeline**: [Immediate/This Week/This Month]

### Agent Selection Criteria
```yaml
routing_rules:
  frontend_tasks:
    - agent: "senior-frontend-developer"
      conditions:
        - complexity: "complex"
        - priority: "high"
    - agent: "frontend-developer"
      conditions:
        - complexity: ["simple", "medium"]

  backend_tasks:
    - agent: "backend-architect"
      conditions:
        - complexity: "complex"
        - involves: "architecture"
    - agent: "backend-developer"
      conditions:
        - complexity: ["simple", "medium"]

  security_review:
    - agent: "security-specialist"
      conditions:
        - priority: ["high", "critical"]
        - involves: "security"
```

### Parallel Processing Coordination

```markdown
## Parallel Agent Coordination

### Simultaneous Workstreams

**Workstream A: Backend Development**
- Agent: Backend Specialist
- Timeline: 3-5 days
- Dependencies: Database schema approval
- Output: REST API with authentication

**Workstream B: Frontend Development**
- Agent: Frontend Specialist
- Timeline: 4-6 days
- Dependencies: Design system completion
- Output: UI components and layouts

**Workstream C: Infrastructure Setup**
- Agent: DevOps Specialist
- Timeline: 2-3 days
- Dependencies: Requirements finalization
- Output: Deployment pipeline and monitoring

### Synchronization Points
- **Day 1**: All agents start with requirements briefing
- **Day 3**: Mid-point check-in and dependency validation
- **Day 5**: Integration testing begins
- **Day 7**: Final validation and deployment
```

## Troubleshooting Common Issues

### Communication Breakdowns

**Symptom**: Agents working with outdated requirements or conflicting assumptions

**Solution**:
- Implement regular sync points
- Use shared documentation that all agents update
- Establish clear handoff protocols with validation steps

### Quality Inconsistencies

**Symptom**: Different agents producing work at different quality levels

**Solution**:
- Establish clear quality gates and checklists
- Implement peer review between agents
- Use automated validation tools where possible

### Timeline Coordination Issues

**Symptom**: Agents finishing at different times, causing bottlenecks

**Solution**:
- Build buffer time into dependent tasks
- Have backup plans for delayed deliverables
- Enable parallel work where dependencies allow

## Best Practices

### Agent Coordination
1. **Clear Handoffs**: Define exactly what constitutes completion for each stage
2. **Validation Steps**: Include verification that handoff criteria are met
3. **Communication Protocol**: Establish regular check-ins and status updates
4. **Documentation**: Maintain shared context that all agents can reference

### Quality Management
1. **Consistent Standards**: Apply same quality criteria across all agents
2. **Incremental Validation**: Check quality at each handoff point
3. **Feedback Loops**: Enable agents to provide input on previous stages
4. **Final Validation**: Comprehensive review before considering task complete

### Workflow Optimization
1. **Identify Bottlenecks**: Monitor where delays commonly occur
2. **Parallel Processing**: Find opportunities for simultaneous work
3. **Skill Matching**: Route tasks to agents with appropriate expertise
4. **Continuous Improvement**: Regularly refine coordination patterns

These templates provide the foundation for sophisticated multi-agent workflows that can tackle complex, enterprise-scale challenges while maintaining quality and coordination.
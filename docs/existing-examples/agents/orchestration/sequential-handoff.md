# Sequential Handoff Agent Template

A coordinated workflow pattern where specialized agents work in sequence, with each agent building upon the previous agent's deliverables to complete complex, multi-stage tasks.

## Template Overview

This template orchestrates multiple specialized agents in a sequential workflow, ensuring each stage is completed and validated before proceeding to the next. Each agent focuses on their area of expertise while maintaining context and continuity from previous stages.

**Use Cases:**
- Feature development from design to deployment
- Content creation from research to publication
- System implementation from architecture to testing
- Bug investigation from reproduction to resolution

## Agent Workflow Structure

### Stage 1: Requirements & Planning Agent
**Role**: System Analyst / Project Coordinator
**Responsibilities**: Requirements analysis, planning, and initial design

```markdown
## Stage 1: Requirements Analysis & Planning

### Objective
Analyze requirements, create detailed specifications, and establish clear success criteria for the entire workflow.

### Deliverables
- [ ] Comprehensive requirements document
- [ ] Technical specifications with acceptance criteria
- [ ] Implementation timeline and milestones
- [ ] Risk assessment and mitigation strategies
- [ ] Success metrics and validation criteria

### Agent Instructions
You are a senior system analyst responsible for requirements analysis and project planning. Your role is to:

1. **Requirements Gathering**
   - Analyze all provided requirements and user stories
   - Identify missing or ambiguous requirements
   - Define clear, measurable acceptance criteria
   - Document assumptions and constraints

2. **Technical Planning**
   - Break down complex requirements into implementable components
   - Identify technical dependencies and integration points
   - Estimate effort and timeline for each component
   - Define APIs, data models, and system interfaces

3. **Quality Standards**
   - Establish testing requirements and quality gates
   - Define security and performance requirements
   - Specify documentation and maintenance requirements
   - Create validation and acceptance test plans

### Handoff Criteria
Before passing to the next agent, ensure:
- [ ] All requirements are clearly documented and validated
- [ ] Technical specifications are complete and feasible
- [ ] Success criteria and quality gates are defined
- [ ] Timeline and resource requirements are established
- [ ] Next agent has all context needed to begin implementation

### Handoff Package
```yaml
requirements_analysis:
  functional_requirements: [List of detailed functional requirements]
  non_functional_requirements: [Performance, security, scalability requirements]
  acceptance_criteria: [Measurable success criteria]

technical_specifications:
  architecture_overview: [High-level system design]
  component_breakdown: [Individual components to be implemented]
  api_specifications: [Interface definitions and contracts]
  data_models: [Database schema and data structures]

implementation_plan:
  timeline: [Phase breakdown with milestones]
  dependencies: [Critical dependencies and blockers]
  resources: [Required tools, services, and access]
  risks: [Identified risks and mitigation strategies]
```

**Handoff Message:**
"Requirements analysis and technical planning is complete. All functional and non-functional requirements have been documented with clear acceptance criteria. Technical specifications include detailed component breakdown and API contracts. Implementation timeline is established with defined milestones. Ready for development phase."
```

### Stage 2: Implementation Agent
**Role**: Senior Developer / Technical Specialist
**Responsibilities**: Core implementation based on specifications

```markdown
## Stage 2: Implementation

### Objective
Implement the solution according to specifications, ensuring all functional requirements are met with high code quality.

### Prerequisites from Previous Stage
- [ ] Complete requirements document with acceptance criteria
- [ ] Technical specifications with component breakdown
- [ ] API contracts and data model definitions
- [ ] Implementation timeline and quality standards

### Agent Instructions
You are a senior developer responsible for implementing the solution according to specifications. Your role is to:

1. **Implementation Planning**
   - Review all specifications and requirements from Stage 1
   - Plan implementation approach and development sequence
   - Set up development environment and necessary tools
   - Create implementation checklist based on requirements

2. **Core Development**
   - Implement all functional requirements per specifications
   - Follow established coding standards and best practices
   - Create comprehensive unit tests for all components
   - Document code with clear comments and README files

3. **Integration & Validation**
   - Integrate all components according to architectural design
   - Validate implementation against acceptance criteria
   - Perform initial testing and bug fixes
   - Prepare comprehensive handoff documentation

### Quality Standards
- [ ] Code follows established style guidelines and best practices
- [ ] Unit test coverage meets or exceeds 80% requirement
- [ ] All functional requirements have been implemented
- [ ] Code is well-documented with clear README and comments
- [ ] Integration testing validates component interactions
- [ ] Basic performance testing shows acceptable response times

### Deliverables
- [ ] Complete, working implementation of all requirements
- [ ] Comprehensive unit test suite with good coverage
- [ ] Integration tests validating component interactions
- [ ] Clear documentation (README, API docs, architecture notes)
- [ ] Deployment instructions and environment setup guide

### Handoff Criteria
Before passing to the next agent, ensure:
- [ ] All functional requirements are implemented and working
- [ ] Code quality meets established standards
- [ ] Test suite is comprehensive and all tests pass
- [ ] Documentation is complete and accurate
- [ ] Implementation is ready for quality assurance review

### Handoff Package
```yaml
implementation_deliverables:
  codebase: [Complete source code with proper organization]
  tests: [Unit tests, integration tests, test data]
  documentation: [README, API docs, setup instructions]

validation_results:
  requirements_coverage: [Mapping of implementation to requirements]
  test_results: [Test execution results and coverage report]
  performance_metrics: [Basic performance benchmarks]

deployment_package:
  environment_setup: [Development environment configuration]
  dependencies: [Package dependencies and version requirements]
  build_instructions: [Step-by-step build and deployment guide]
```

**Handoff Message:**
"Implementation is complete and validated against all functional requirements. Code follows best practices with comprehensive test coverage. All components are integrated and working as specified. Documentation includes setup instructions and API reference. Ready for quality assurance and testing phase."
```

### Stage 3: Quality Assurance Agent
**Role**: QA Engineer / Test Specialist
**Responsibilities**: Comprehensive testing, validation, and quality verification

```markdown
## Stage 3: Quality Assurance & Testing

### Objective
Perform comprehensive testing and validation to ensure the implementation meets all requirements and quality standards.

### Prerequisites from Previous Stage
- [ ] Complete implementation with working functionality
- [ ] Comprehensive unit and integration test suite
- [ ] Documentation including setup and usage instructions
- [ ] Mapping of implementation to original requirements

### Agent Instructions
You are a senior QA engineer responsible for comprehensive testing and quality validation. Your role is to:

1. **Test Planning & Environment Setup**
   - Review implementation and requirements from previous stages
   - Set up comprehensive test environment
   - Create detailed test plans covering all scenarios
   - Establish test data and test case documentation

2. **Comprehensive Testing**
   - Execute functional testing against all requirements
   - Perform edge case and negative testing scenarios
   - Conduct performance and load testing as specified
   - Validate security requirements and access controls

3. **Quality Validation**
   - Review code quality and adherence to standards
   - Validate documentation accuracy and completeness
   - Test user experience and accessibility requirements
   - Verify deployment procedures and rollback capabilities

### Testing Strategy
- **Functional Testing**: Validate all features work as specified
- **Integration Testing**: Ensure all components work together correctly
- **Performance Testing**: Verify response times and resource usage
- **Security Testing**: Validate access controls and data protection
- **Usability Testing**: Ensure good user experience and accessibility
- **Deployment Testing**: Validate installation and configuration procedures

### Quality Gates
- [ ] All functional requirements pass testing
- [ ] Performance meets specified benchmarks
- [ ] Security requirements are properly implemented
- [ ] Documentation is accurate and usable
- [ ] Error handling works correctly in all scenarios
- [ ] Deployment process works in clean environment

### Deliverables
- [ ] Comprehensive test execution report
- [ ] Performance testing results and recommendations
- [ ] Security testing report with any findings
- [ ] Documentation validation and improvement recommendations
- [ ] Final quality assessment with approval/rejection decision

### Handoff Criteria
For approval and progression to next stage:
- [ ] All critical and high-priority tests pass
- [ ] Performance meets or exceeds requirements
- [ ] Security validation shows no critical vulnerabilities
- [ ] Documentation is accurate and complete
- [ ] Overall quality meets established standards

### Handoff Package
```yaml
quality_assessment:
  test_execution_summary: [Overall test results and pass/fail status]
  functional_testing: [Detailed functional test results]
  performance_results: [Performance benchmarks and recommendations]
  security_assessment: [Security testing findings and recommendations]

quality_metrics:
  requirements_coverage: [Percentage of requirements validated]
  defect_summary: [Count and severity of issues found]
  performance_benchmarks: [Response times, throughput, resource usage]

recommendations:
  critical_issues: [Issues that must be fixed before deployment]
  improvements: [Suggested enhancements for next iteration]
  deployment_readiness: [Assessment of production readiness]
```

**Handoff Message:**
"Quality assurance testing is complete. All functional requirements pass validation with comprehensive test coverage. Performance testing confirms system meets benchmarks. Security assessment shows no critical vulnerabilities. Documentation has been validated and is accurate. Implementation is approved for deployment phase."
```

### Stage 4: Deployment Agent
**Role**: DevOps Engineer / Deployment Specialist
**Responsibilities**: Production deployment, monitoring setup, and go-live validation

```markdown
## Stage 4: Deployment & Go-Live

### Objective
Deploy the validated implementation to production environment with proper monitoring, backup procedures, and go-live validation.

### Prerequisites from Previous Stage
- [ ] QA-approved implementation with all tests passing
- [ ] Validated deployment procedures and documentation
- [ ] Performance and security testing completed successfully
- [ ] Comprehensive test results and quality assessment

### Agent Instructions
You are a senior DevOps engineer responsible for production deployment and operational readiness. Your role is to:

1. **Deployment Preparation**
   - Review QA results and deployment readiness assessment
   - Prepare production deployment environment
   - Set up monitoring, logging, and alerting systems
   - Create backup and rollback procedures

2. **Production Deployment**
   - Execute deployment following validated procedures
   - Implement proper security configurations
   - Configure monitoring and performance tracking
   - Validate deployment with smoke tests and health checks

3. **Go-Live Validation**
   - Execute comprehensive go-live testing in production
   - Monitor system performance and stability
   - Validate all monitoring and alerting systems
   - Document operational procedures and troubleshooting guides

### Deployment Checklist
- [ ] Production environment is properly configured
- [ ] All dependencies and services are available
- [ ] Security configurations are applied correctly
- [ ] Monitoring and logging systems are operational
- [ ] Backup and disaster recovery procedures are tested
- [ ] Rollback procedures are documented and validated

### Go-Live Validation
- [ ] All critical functionality works in production environment
- [ ] Performance meets specified requirements under production load
- [ ] Monitoring systems are collecting and reporting metrics correctly
- [ ] Security controls are functioning as designed
- [ ] User access and authentication systems work correctly
- [ ] Integration with external systems is functioning properly

### Deliverables
- [ ] Successful production deployment with validation
- [ ] Operational monitoring and alerting setup
- [ ] Deployment and rollback procedure documentation
- [ ] Go-live validation report with production testing results
- [ ] Operational handover documentation for support teams

### Completion Criteria
- [ ] Application is successfully deployed and running in production
- [ ] All critical functionality validated in production environment
- [ ] Monitoring and alerting systems are operational
- [ ] Support team has operational documentation and procedures
- [ ] Performance and security requirements confirmed in production
- [ ] Rollback procedures tested and documented

### Final Handoff Package
```yaml
deployment_results:
  deployment_status: "successful" | "failed" | "partial"
  production_url: [Production environment access details]
  deployment_timestamp: [When deployment was completed]

operational_setup:
  monitoring_dashboards: [URLs and access to monitoring systems]
  log_aggregation: [Log access and search procedures]
  alerting_configuration: [Alert routing and escalation procedures]

documentation:
  operational_procedures: [Day-to-day operational procedures]
  troubleshooting_guide: [Common issues and resolution steps]
  rollback_procedures: [Step-by-step rollback instructions]
  support_contacts: [Technical contacts for ongoing support]

validation_results:
  production_testing: [Results of production validation testing]
  performance_metrics: [Production performance baselines]
  security_validation: [Production security confirmation]
```

**Final Message:**
"Deployment completed successfully. Application is running in production with all functionality validated. Monitoring and alerting systems are operational. Support team has complete operational documentation. Production performance confirms all requirements are met. Workflow completed successfully."
```

## Workflow Coordination Protocol

### Inter-Stage Communication Template

```markdown
## Stage Handoff Protocol

**From**: [Previous Agent Role]
**To**: [Next Agent Role]
**Stage**: [Stage Number and Name]
**Date**: [Handoff Date]

### Handoff Summary
Brief description of what was accomplished in this stage and what the next agent needs to know.

### Deliverables Provided
- [ ] [Specific deliverable 1 with validation]
- [ ] [Specific deliverable 2 with validation]
- [ ] [Documentation and supporting materials]

### Key Context for Next Agent
- Important decisions made and rationale
- Constraints or limitations discovered
- Assumptions that should be validated
- Recommended approaches or considerations

### Success Criteria for Next Stage
- [ ] [Specific success criterion 1]
- [ ] [Specific success criterion 2]
- [ ] [Quality gates that must be met]

### Questions or Concerns
Any questions, concerns, or recommendations for the next agent.
```

### Quality Gate Validation

```markdown
## Quality Gate Checkpoint

**Stage**: [Current Stage]
**Agent**: [Agent Role]
**Status**: [Pass/Fail/Needs Review]

### Validation Checklist
- [ ] All deliverables meet specified quality standards
- [ ] Requirements from previous stage are fully addressed
- [ ] Documentation is complete and accurate
- [ ] Next stage has sufficient context to begin work

### Issues Identified
- [List any issues that need resolution]
- [Severity and recommended resolution approach]

### Approval Decision
- [X] **Approved**: Ready to proceed to next stage
- [ ] **Needs Work**: Issues must be resolved before proceeding
- [ ] **Rejected**: Major issues require restart of current stage

### Notes for Next Agent
Additional context, warnings, or recommendations for the next stage.
```

## Error Handling and Recovery

### Common Issues and Solutions

1. **Requirements Clarification Needed**
   - **Issue**: Ambiguous or incomplete requirements discovered during implementation
   - **Solution**: Pause workflow, return to Requirements Agent for clarification
   - **Prevention**: More thorough requirements review and stakeholder validation

2. **Quality Gate Failure**
   - **Issue**: Implementation doesn't meet quality standards
   - **Solution**: Return to appropriate previous stage for remediation
   - **Prevention**: More frequent validation checkpoints during implementation

3. **Integration Problems**
   - **Issue**: Components don't integrate correctly despite individual testing
   - **Solution**: Collaborative debugging session with Implementation and QA agents
   - **Prevention**: Earlier integration testing and clear interface specifications

### Rollback Procedures

```markdown
## Workflow Rollback Protocol

### Trigger Conditions
- Critical quality gate failure
- Discovery of fundamental design flaw
- External dependency changes affecting requirements

### Rollback Process
1. **Identify Rollback Point**: Determine which stage needs to be restarted
2. **Document Issues**: Clear documentation of problems requiring rollback
3. **Preserve Work**: Save any reusable work from current stage
4. **Reset Context**: Provide clean context for restarting agent
5. **Modified Approach**: Include lessons learned in new approach

### Communication Protocol
- Notify all agents in workflow of rollback decision
- Provide clear explanation of issues and proposed resolution
- Establish new timeline accounting for rollback and rework
```

This sequential handoff template provides a robust framework for complex, multi-stage workflows that require specialized expertise at each phase while maintaining quality and continuity throughout the entire process.
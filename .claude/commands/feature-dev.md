---
name: feature-dev
description: Complete feature development workflow coordinated by orchestrator with multi-agent collaboration
---

Use the orchestrator to coordinate a complete feature development workflow involving all specialized agents:

**Phase 1: Requirements & Architecture (Tech-Lead Agent)**
- Analyze feature requirements and technical feasibility
- Design system architecture and integration points
- Evaluate technology choices and trade-offs
- Plan resource allocation and timeline estimation
- Create technical specification and implementation plan
- Identify potential risks and mitigation strategies

**Phase 2: Implementation Coordination**

**Frontend Development (Frontend Agent):**
- React component implementation with TypeScript
- Browser extension popup/content script development
- State management with Zustand or Redux Toolkit
- UI/UX implementation following design system
- Responsive design and accessibility compliance
- Integration with backend APIs and AI services

**Backend Integration (Platform Agent):**
- API endpoint development with tRPC type safety
- Database schema design and Prisma migrations
- AI/LLM service integration and prompt engineering
- Vector database configuration for semantic search
- Authentication and authorization implementation
- Business logic and data processing services

**Security Implementation (Security Agent):**
- Browser extension security audit and implementation
- Privacy compliance validation (GDPR, CCPA)
- API security implementation (rate limiting, validation)
- Content Security Policy configuration
- Secure data handling and encryption
- AI safety measures and content filtering

**Phase 3: Quality Assurance (Quality Agent)**
- Comprehensive test suite development:
  - Unit tests with Vitest (80%+ coverage)
  - Integration tests for API endpoints
  - End-to-end tests with Playwright
  - Browser extension compatibility testing
  - AI functionality validation and testing
- Performance testing and optimization
- Cross-browser compatibility validation
- Load testing and stress testing

**Phase 4: Code Review (Code Reviewer Agent)**
- Comprehensive code quality assessment
- Security vulnerability scanning and analysis
- Performance optimization review
- Browser extension best practices validation
- Architecture pattern compliance check
- Documentation and code maintainability review

**Phase 5: Deployment (DevOps Agent)**
- Build and packaging automation
- Environment-specific configuration management
- Database migration execution
- Infrastructure deployment (Kubernetes)
- Browser extension store submission
- Monitoring and observability setup

**Feature Development Workflow:**
1. **Feature Planning:**
   - Create feature specification and technical design
   - Break down into implementable tasks
   - Estimate effort and assign to agents
   - Set up feature branch and tracking

2. **Parallel Development:**
   - Frontend and backend development proceed in parallel
   - Security considerations integrated throughout
   - Regular synchronization between agents
   - Continuous integration testing

3. **Integration & Testing:**
   - Component integration and system testing
   - Performance benchmarking
   - Security validation and penetration testing
   - User acceptance testing preparation

4. **Review & Deployment:**
   - Comprehensive code review process
   - Quality gate validation
   - Staged deployment (dev → staging → production)
   - Post-deployment monitoring and validation

**Quality Gates & Checkpoints:**
- **Architecture Review**: System design approval before implementation
- **Security Checkpoint**: Security validation before integration testing
- **Performance Validation**: Performance budget compliance check
- **Code Review Gate**: Code quality and security review before staging
- **UAT Gate**: User acceptance testing before production deployment

**Documentation Requirements:**
- Technical specification and architecture diagrams
- API documentation with OpenAPI/Swagger
- User documentation and feature guides
- Security and privacy impact assessment
- Performance benchmarks and optimization guide
- Deployment and rollback procedures

**Success Criteria:**
- Feature meets all functional requirements
- Performance budget maintained (load time < 2s, bundle < 500KB)
- Security audit passes with zero critical issues
- Cross-browser compatibility validated
- Test coverage >= 80% with meaningful tests
- Documentation complete and up-to-date

**Risk Management:**
- Technical risks identified and mitigated
- Security risks assessed and addressed
- Performance risks monitored and optimized
- Deployment risks minimized with rollback plans
- Timeline risks managed with contingency planning

**Agent Coordination Pattern:**
```
Tech-Lead (Architecture) →
[Frontend || Platform-Agent || Security] (Parallel Implementation) →
Quality (Testing) →
Code-Reviewer (Review) →
DevOps (Deployment)
```

Please coordinate this feature development ensuring all quality gates are met, proper documentation is maintained, and the feature delivers value while maintaining system reliability and security.

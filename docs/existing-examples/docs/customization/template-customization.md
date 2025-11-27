# Template Customization Guide

Comprehensive guide for adapting and customizing the Browser Extension + AI Web Application project template for your specific team, organization, and project requirements.

## Table of Contents
- [Customization Overview](#customization-overview)
- [Project Type Adaptations](#project-type-adaptations)
- [Agent Customization](#agent-customization)
- [Organization-Specific Setup](#organization-specific-setup)
- [Configuration Management](#configuration-management)
- [Team Workflow Adaptation](#team-workflow-adaptation)
- [Template Versioning and Updates](#template-versioning-and-updates)

## Customization Overview

### Philosophy of Customization

This template is designed to be highly customizable while maintaining its core benefits:
- **Preserve Core Architecture**: Keep the log-based agent coordination system
- **Adapt, Don't Replace**: Extend existing components rather than starting from scratch
- **Team-Specific Focus**: Customize for your team's specific technology stack and workflows
- **Gradual Evolution**: Start with the base template and evolve gradually

### Customization Levels

```
Level 1: Configuration Changes
├── Environment variables
├── Agent settings
├── Automation commands
└── Basic project metadata

Level 2: Content Adaptation
├── Agent expertise areas
├── Prompt templates
├── Workflow patterns
└── Documentation updates

Level 3: Structural Changes
├── Technology stack changes
├── Additional agents
├── Custom automation
└── Integration modifications

Level 4: Architectural Extensions
├── Custom coordination patterns
├── Enterprise integrations
├── Advanced security models
└── Custom deployment strategies
```

## Project Type Adaptations

### Web Application Focus (Remove Browser Extension)

For teams building only web applications without browser extensions:

#### 1. Remove Extension Components
```bash
# Remove browser extension package
rm -rf app/packages/browser-extension

# Update package.json
# Remove extension-related scripts:
# - "ext:dev"
# - "ext:build"
# - "ext:test"
```

#### 2. Update Agent Configurations
```markdown
<!-- .claude/agents/frontend/agent.md -->
# Frontend Development Agent - Web Application Specialist

## Expertise
- React 18+ with Next.js 14+
- TypeScript 5.2+ with strict configuration
- Modern CSS with Tailwind CSS 3+
- State management with Zustand/Redux Toolkit
- Performance optimization and Core Web Vitals
- Accessibility (WCAG 2.1 AA compliance)
- Progressive Web App (PWA) features

## Removed Capabilities
- Browser extension UI development
- Content script integration
- Cross-origin messaging
- Extension store deployment

## Enhanced Focus Areas
- Server-side rendering optimization
- Advanced React patterns (Suspense, Concurrent Features)
- Web performance optimization
- SEO and meta tag management
- Advanced form handling and validation
```

#### 3. Customize CI/CD Pipeline
```yaml
# .github/workflows/ci.yml - Remove extension-specific jobs
# Remove:
# - browser-extension-tests
# - cross-platform-compatibility (extension-specific parts)
# - extension deployment jobs
```

### API-Only Backend Service

For teams building only backend APIs:

#### 1. Remove Frontend Components
```bash
# Remove frontend packages
rm -rf app/packages/web-app
rm -rf app/packages/browser-extension

# Keep only:
# - api-server
# - shared-types
```

#### 2. Update Platform Agent
```markdown
<!-- .claude/agents/platform-agent/agent.md -->
# Platform Development Agent - API Service Specialist

## Enhanced Expertise
- Node.js 20+ with TypeScript
- Express.js with tRPC for type-safe APIs
- OpenAPI/Swagger documentation
- GraphQL with Apollo Server
- Database design (PostgreSQL, MongoDB)
- Microservices architecture
- Message queues (Redis, RabbitMQ)
- API rate limiting and security
- Performance monitoring and optimization

## AI/LLM Integration Focus
- Multi-provider AI integration (OpenAI, Anthropic, Azure)
- Prompt engineering and optimization
- Vector database integration (ChromaDB, Pinecone)
- AI safety and content filtering
- Cost optimization and usage monitoring
- Batch processing and queuing
- Model fine-tuning and evaluation
```

### Mobile Application Development

For teams adding React Native mobile apps:

#### 1. Add Mobile Package Structure
```bash
mkdir -p app/packages/mobile-app
cd app/packages/mobile-app

# Initialize React Native project
npx react-native init DistillMobile --template react-native-template-typescript
```

#### 2. Create Mobile Specialist Agent
```markdown
<!-- .claude/agents/mobile-specialist/agent.md -->
# Mobile Development Agent - React Native Specialist

## Expertise
- React Native 0.72+ with TypeScript
- Expo SDK 49+ for rapid development
- Native module development (iOS/Android)
- React Navigation 6+ for navigation
- State management with Zustand/Redux
- Async storage and data persistence
- Push notifications and deep linking
- App store deployment (iOS App Store, Google Play)
- Performance optimization for mobile

## AI Integration Specialization
- On-device AI with TensorFlow Lite
- Cloud AI service integration
- Offline conversation caching
- Background processing for AI tasks
- Battery and performance optimization
- Mobile-specific security patterns

## Cross-Platform Considerations
- Shared business logic with web app
- Platform-specific UI adaptations
- Native bridge communication
- Device-specific feature integration
```

### Data Science and Analytics Focus

For teams emphasizing data analysis and ML:

#### 1. Add Data Science Components
```bash
mkdir -p app/packages/data-science
cd app/packages/data-science

# Create Python environment
python -m venv venv
source venv/bin/activate
pip install pandas numpy scikit-learn jupyter tensorflow
```

#### 2. Create Data Science Agent
```markdown
<!-- .claude/agents/data-scientist/agent.md -->
# Data Science Agent - AI/ML Analytics Specialist

## Expertise
- Python 3.11+ with data science stack
- Pandas, NumPy, Scikit-learn for data processing
- TensorFlow, PyTorch for deep learning
- Jupyter notebooks for experimentation
- MLflow for model lifecycle management
- Apache Airflow for data pipelines
- Vector databases and embeddings
- Statistical analysis and visualization

## AI Conversation Analytics
- Conversation quality assessment
- Sentiment analysis and topic modeling
- User behavior pattern analysis
- Prompt effectiveness measurement
- AI model performance evaluation
- A/B testing for AI features
- Usage analytics and insights

## Integration Patterns
- Python backend integration
- Real-time analytics pipelines
- Model serving and inference APIs
- Data validation and monitoring
- Feature engineering workflows
```

## Agent Customization

### Creating Custom Agent Templates

#### 1. Agent Template Structure
```markdown
<!-- Custom agent template -->
# [Agent Name] - [Specialization]

## Role and Purpose
[Clear description of agent's role and primary purpose]

## Core Expertise Areas
- [Expertise area 1 with specific technologies]
- [Expertise area 2 with specific frameworks]
- [Domain knowledge area with specific focus]

## Technology Stack Specialization
### Primary Technologies
- [Technology 1] [version] - [specific use cases]
- [Technology 2] [version] - [specific capabilities]

### Secondary Technologies
- [Supporting technology 1]
- [Supporting technology 2]

## Integration Patterns
### Works Closely With
- [Agent 1]: [collaboration pattern]
- [Agent 2]: [handoff scenarios]

### Coordination Workflows
1. [Workflow name]: [brief description]
2. [Workflow name]: [brief description]

## Specialized Commands and Capabilities
### Custom Commands
- `/[command-name]` - [description]
- `/[command-name]` - [description]

### Automation Triggers
- [Trigger condition] → [automated action]
- [Trigger condition] → [automated action]

## Quality Standards and Practices
### Code Quality Requirements
- [Standard 1 with specific metrics]
- [Standard 2 with specific criteria]

### Testing Requirements
- [Test type 1] - [coverage requirements]
- [Test type 2] - [specific scenarios]

## Project Context Integration
### Current Project Focus
- [Project-specific consideration 1]
- [Project-specific consideration 2]

### Team Workflow Integration
- [Team process 1] - [how agent supports it]
- [Team process 2] - [integration point]

## Continuous Learning and Adaptation
### Knowledge Updates
- [How agent stays current with technology]
- [Learning from project patterns]

### Feedback Integration
- [How agent incorporates team feedback]
- [Performance improvement mechanisms]

## Coordination Protocol
### Log-Based Communication
```
Standardized log entries for agent coordination:

1. **Task Initiation**:
   ```
   ## [Agent Name] Task Start
   - **Task**: [Brief description]
   - **Context**: [Relevant background]
   - **Dependencies**: [Other agents or resources needed]
   - **Timeline**: [Expected completion]
   ```

2. **Progress Updates**:
   ```
   ## [Agent Name] Progress Update
   - **Completed**: [What has been finished]
   - **Current Focus**: [What is being worked on]
   - **Blockers**: [Any issues or dependencies]
   - **Next Steps**: [Planned actions]
   ```

3. **Handoff to Other Agents**:
   ```
   ## [Agent Name] → [Target Agent] Handoff
   - **Work Completed**: [Summary of completed work]
   - **Handoff Items**: [Specific deliverables]
   - **Context**: [Important background for next agent]
   - **Requirements**: [Specific needs or constraints]
   ```

4. **Task Completion**:
   ```
   ## [Agent Name] Task Completion
   - **Deliverables**: [What was produced]
   - **Quality Checks**: [Validation performed]
   - **Documentation**: [Where to find relevant docs]
   - **Follow-up**: [Any ongoing considerations]
   ```
```

### Agent Handoff Patterns
[Define specific handoff patterns between agents]

## Success Metrics
### Performance Indicators
- [Metric 1] - [Target value]
- [Metric 2] - [Success criteria]

### Quality Measures
- [Quality metric 1]
- [Quality metric 2]

---

*Last Updated: [Date]*
*Version: [Version number]*
```

#### 2. Agent Configuration File
```json
// .claude/agents/[agent-name]/config.json
{
  "name": "custom-specialist",
  "displayName": "Custom Specialist Agent",
  "version": "1.0.0",
  "specialization": ["custom-domain", "specific-technology"],
  "expertise": {
    "primary": [
      "Technology Stack 1",
      "Technology Stack 2"
    ],
    "secondary": [
      "Supporting Technology 1",
      "Supporting Technology 2"
    ]
  },
  "integrations": {
    "primaryCollaborators": ["platform-agent", "frontend"],
    "secondaryCollaborators": ["security", "quality"],
    "handoffPatterns": {
      "to": ["devops", "tech-lead"],
      "from": ["frontend", "platform-agent"]
    }
  },
  "automation": {
    "triggers": [
      {
        "condition": "file_pattern",
        "pattern": "src/custom-domain/**/*.ts",
        "action": "review_changes"
      }
    ],
    "commands": [
      "/custom-command",
      "/domain-analyze"
    ]
  },
  "logLevel": "detailed",
  "contextRetention": 7200,
  "preferences": {
    "codeStyle": "team-standard",
    "documentation": "comprehensive",
    "testing": "strict"
  }
}
```

### Industry-Specific Agent Examples

#### E-commerce Specialist Agent
```markdown
# E-commerce Development Agent - Online Commerce Specialist

## Expertise
- E-commerce platforms (Shopify, WooCommerce, custom)
- Payment processing (Stripe, PayPal, Square)
- Inventory management systems
- Shopping cart and checkout optimization
- Product catalog management
- Order fulfillment workflows
- Customer account management
- E-commerce analytics and reporting

## AI Integration for E-commerce
- Product recommendation engines
- Customer service chatbots
- Inventory demand forecasting
- Price optimization algorithms
- Personalized marketing content
- Review and rating analysis
- Fraud detection systems
```

#### Healthcare Compliance Agent
```markdown
# Healthcare Compliance Agent - HIPAA & Medical Data Specialist

## Expertise
- HIPAA compliance and medical data protection
- Healthcare interoperability standards (HL7, FHIR)
- Medical device integration
- Electronic Health Records (EHR) systems
- Telemedicine platform development
- Clinical workflow optimization
- Medical data encryption and security
- Audit logging for healthcare systems

## AI Integration for Healthcare
- Clinical decision support systems
- Medical image analysis
- Natural language processing for medical records
- Drug interaction checking
- Symptom analysis and triage
- Medical research data analysis
- Privacy-preserving ML for healthcare
```

## Organization-Specific Setup

### Enterprise Configuration Template

#### 1. Enterprise Settings Override
```json
// .claude/settings.enterprise.json
{
  "organization": {
    "name": "Your Enterprise Name",
    "domain": "yourcompany.com",
    "policies": {
      "security": "enterprise",
      "compliance": ["SOC2", "ISO27001", "GDPR"],
      "dataRetention": 2557440000,
      "auditLogging": true
    }
  },
  "permissions": {
    "allow": [
      "Read(**)",
      "Edit(src/**)",
      "Edit(tests/**)",
      "Edit(docs/**)",
      "Bash(npm **)",
      "Bash(yarn **)",
      "Bash(bun **)",
      "Bash(docker-compose **)",
      "Bash(kubectl **)"
    ],
    "deny": [
      "Read(.env*)",
      "Read(**/.aws/**)",
      "Read(**/.ssh/**)",
      "Edit(.claude/settings*.json)",
      "Bash(rm -rf **)",
      "Bash(sudo **)",
      "Bash(curl ** | bash)"
    ],
    "restricted": [
      "Bash(git push origin main)",
      "Bash(git push --force **)",
      "Bash(kubectl delete **)",
      "Bash(docker system prune **)"
    ]
  },
  "aiServices": {
    "budgetLimits": {
      "monthly": 500.00,
      "daily": 25.00,
      "perUser": 50.00
    },
    "approvedProviders": ["openai", "anthropic"],
    "dataPolicies": {
      "allowTraining": false,
      "dataRetention": 30,
      "encryptionRequired": true
    }
  },
  "integrations": {
    "required": {
      "sso": "okta",
      "monitoring": "datadog",
      "logging": "splunk",
      "secrets": "vault"
    },
    "mcpServers": {
      "enterprise-github": {
        "endpoint": "github-enterprise.yourcompany.com",
        "authentication": "oauth"
      },
      "jira": {
        "endpoint": "yourcompany.atlassian.net",
        "authentication": "api-key"
      },
      "confluence": {
        "endpoint": "yourcompany.atlassian.net",
        "authentication": "oauth"
      }
    }
  }
}
```

#### 2. Enterprise Agent Templates

```bash
# Create enterprise-specific agents
mkdir -p .claude/agents/enterprise/

# Enterprise Security Agent
cat > .claude/agents/enterprise/security.md << 'EOF'
# Enterprise Security Agent - Corporate Security Specialist

## Corporate Security Expertise
- Enterprise SSO integration (Okta, Azure AD)
- Corporate firewall and network security
- VPN and remote access security
- Enterprise compliance frameworks
- Corporate data classification
- Incident response procedures
- Security audit and reporting
- Vendor security assessments

## Enterprise AI Governance
- Corporate AI usage policies
- Data governance for AI training
- Enterprise prompt engineering guidelines
- AI audit trails and compliance
- Cross-departmental AI coordination
- Budget and usage monitoring
- Risk assessment for AI implementations
EOF

# Enterprise DevOps Agent
cat > .claude/agents/enterprise/devops.md << 'EOF'
# Enterprise DevOps Agent - Corporate Infrastructure Specialist

## Enterprise Infrastructure
- Multi-cloud deployment strategies
- Enterprise Kubernetes orchestration
- Corporate CI/CD pipeline management
- Infrastructure as Code (Terraform)
- Enterprise monitoring and alerting
- Disaster recovery and backup strategies
- Corporate security and compliance integration
- Cost optimization and resource management

## Corporate Deployment Patterns
- Blue-green deployment for enterprise
- Canary releases with approval gates
- Multi-environment management
- Enterprise change management integration
- Automated compliance checking
- Enterprise monitoring and observability
EOF
```

### Startup Configuration Template

#### 1. Startup-Optimized Settings
```json
// .claude/settings.startup.json
{
  "organization": {
    "name": "Your Startup Name",
    "stage": "early-stage",
    "focus": "rapid-iteration"
  },
  "permissions": {
    "allow": [
      "Read(**)",
      "Edit(**)",
      "Bash(**)"
    ],
    "deny": [
      "Read(.env*)",
      "Bash(rm -rf /)"
    ]
  },
  "aiServices": {
    "budgetLimits": {
      "monthly": 100.00,
      "daily": 5.00
    },
    "costOptimization": "aggressive",
    "fallbackChain": ["gpt-3.5-turbo", "claude-3-haiku"]
  },
  "development": {
    "speed": "prioritized",
    "perfectionism": "balanced",
    "documentation": "essential-only",
    "testing": "pragmatic"
  }
}
```

#### 2. Startup-Focused Agents

```markdown
<!-- .claude/agents/startup/product-manager.md -->
# Startup Product Manager Agent - Product Development Specialist

## Startup Product Expertise
- Rapid prototyping and MVP development
- User feedback integration and iteration
- Feature prioritization with limited resources
- Growth hacking and user acquisition
- Product-market fit validation
- Startup metrics and analytics (AARRR)
- Lean startup methodology
- Agile development with small teams

## AI-Powered Product Features
- Quick AI integration for competitive advantage
- Cost-effective AI feature development
- User behavior analysis with AI
- Automated user onboarding
- AI-powered customer support
- Rapid A/B testing of AI features
```

### Team Size Adaptations

#### Small Team (2-5 developers)
```json
// .claude/settings.small-team.json
{
  "agentConfiguration": {
    "consolidatedRoles": true,
    "agents": {
      "full-stack-developer": {
        "combines": ["frontend", "platform-agent", "devops"],
        "focus": "end-to-end development"
      },
      "quality-security": {
        "combines": ["quality", "security", "code-reviewer"],
        "focus": "comprehensive validation"
      },
      "tech-lead": {
        "focus": "architecture and coordination"
      }
    }
  }
}
```

#### Large Team (20+ developers)
```json
// .claude/settings.large-team.json
{
  "agentConfiguration": {
    "specializedRoles": true,
    "agents": {
      "frontend-react": {
        "specialization": "React and frontend frameworks"
      },
      "frontend-ui": {
        "specialization": "Design systems and UI components"
      },
      "backend-api": {
        "specialization": "API development and integration"
      },
      "backend-database": {
        "specialization": "Database design and optimization"
      },
      "ai-ml-engineer": {
        "specialization": "AI model integration and optimization"
      },
      "security-compliance": {
        "specialization": "Enterprise security and compliance"
      },
      "devops-infrastructure": {
        "specialization": "Infrastructure and deployment"
      },
      "devops-monitoring": {
        "specialization": "Monitoring and observability"
      }
    }
  }
}
```

## Configuration Management

### Environment-Based Configuration

#### 1. Configuration Hierarchy
```
.claude/
├── settings.json                    # Base configuration
├── settings.local.json             # Developer-specific overrides
├── settings.team.json              # Team-specific settings
├── settings.organization.json      # Organization defaults
└── settings.project.json           # Project-specific configuration

# Loading order (later files override earlier ones):
1. settings.json (base template)
2. settings.organization.json (org defaults)
3. settings.team.json (team customizations)
4. settings.project.json (project specifics)
5. settings.local.json (developer overrides)
```

#### 2. Configuration Template Generator
```bash
#!/bin/bash
# scripts/generate-config.sh

echo "Claude Code Configuration Generator"
echo "==================================="

# Collect organization information
read -p "Organization name: " org_name
read -p "Team size (small/medium/large): " team_size
read -p "Project type (web-app/api-only/browser-ext/mobile): " project_type
read -p "Industry focus (general/healthcare/fintech/ecommerce): " industry

# Generate organization config
cat > .claude/settings.organization.json << EOF
{
  "organization": {
    "name": "$org_name",
    "teamSize": "$team_size",
    "industry": "$industry"
  },
  "projectDefaults": {
    "type": "$project_type",
    "aiIntegration": true,
    "securityLevel": "standard"
  }
}
EOF

# Generate team-specific agents based on selections
case $team_size in
  "small")
    cp templates/agents/small-team/* .claude/agents/
    ;;
  "medium")
    cp templates/agents/standard/* .claude/agents/
    ;;
  "large")
    cp templates/agents/enterprise/* .claude/agents/
    ;;
esac

# Generate industry-specific customizations
case $industry in
  "healthcare")
    cp templates/agents/healthcare/* .claude/agents/
    cp templates/compliance/hipaa.json .claude/
    ;;
  "fintech")
    cp templates/agents/fintech/* .claude/agents/
    cp templates/compliance/pci-dss.json .claude/
    ;;
  "ecommerce")
    cp templates/agents/ecommerce/* .claude/agents/
    ;;
esac

echo "Configuration generated successfully!"
echo "Review and customize the generated files as needed."
```

### Dynamic Configuration Loading

```typescript
// src/shared/config/claude-config-loader.ts
export class ClaudeConfigLoader {
  private configCache = new Map<string, any>();

  async loadConfiguration(environment?: string): Promise<ClaudeConfiguration> {
    const configs = await this.loadConfigFiles(environment);
    return this.mergeConfigurations(configs);
  }

  private async loadConfigFiles(environment?: string): Promise<any[]> {
    const configFiles = [
      '.claude/settings.json',
      '.claude/settings.organization.json',
      '.claude/settings.team.json',
      '.claude/settings.project.json',
    ];

    if (environment) {
      configFiles.push(`.claude/settings.${environment}.json`);
    }

    // Always load local overrides last
    configFiles.push('.claude/settings.local.json');

    const configs = [];
    for (const file of configFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        configs.push(JSON.parse(content));
      } catch (error) {
        // File doesn't exist or is invalid - skip it
        continue;
      }
    }

    return configs;
  }

  private mergeConfigurations(configs: any[]): ClaudeConfiguration {
    // Deep merge configurations with later ones taking precedence
    return configs.reduce((merged, config) => {
      return this.deepMerge(merged, config);
    }, {});
  }
}
```

## Team Workflow Adaptation

### Agile/Scrum Integration

#### 1. Sprint Planning Agent
```markdown
# Sprint Planning Agent - Agile Development Coordinator

## Sprint Management Expertise
- User story estimation and planning
- Sprint capacity planning and allocation
- Backlog refinement and prioritization
- Cross-team dependency management
- Sprint goal definition and tracking
- Velocity tracking and improvement
- Retrospective facilitation
- Agile metrics and reporting

## AI-Enhanced Sprint Planning
- Automated story point estimation
- Risk assessment for sprint commitments
- Historical velocity analysis
- Capacity optimization recommendations
- Dependency impact analysis
- Sprint success prediction
```

#### 2. Sprint Integration Commands
```bash
# Create sprint-specific commands
cat > .claude/commands/sprint-planning.md << 'EOF'
# Sprint Planning Command

Coordinate sprint planning activities across all development agents.

## Usage
```
/sprint-planning
```

## Process
1. **Backlog Analysis**: Review and prioritize product backlog items
2. **Capacity Planning**: Assess team capacity and availability
3. **Story Estimation**: Coordinate estimation across technical areas
4. **Sprint Goal Setting**: Define clear, achievable sprint objectives
5. **Task Breakdown**: Break stories into technical tasks
6. **Risk Assessment**: Identify potential blockers and dependencies

## Agent Coordination
- **Tech Lead**: Overall technical planning and architecture decisions
- **Frontend/Platform**: Technical estimation and task breakdown
- **Quality**: Testing strategy and acceptance criteria
- **Security**: Security review requirements
- **DevOps**: Deployment and infrastructure considerations

## Outputs
- Sprint backlog with estimated stories
- Technical task breakdown
- Risk assessment and mitigation plans
- Sprint success metrics and goals
EOF
```

### DevOps Integration Patterns

#### 1. GitOps Workflow Integration
```yaml
# .claude/workflows/gitops-integration.yml
name: Claude Code GitOps Integration

triggers:
  - git_push
  - pull_request
  - deployment

agents:
  devops:
    responsibilities:
      - infrastructure_as_code
      - deployment_automation
      - monitoring_setup

  security:
    responsibilities:
      - security_scanning
      - compliance_validation
      - vulnerability_assessment

  quality:
    responsibilities:
      - test_automation
      - performance_validation
      - quality_gates

coordination:
  pre_deployment:
    - agent: security
      task: security_scan
    - agent: quality
      task: comprehensive_testing

  deployment:
    - agent: devops
      task: deploy_infrastructure
    - agent: devops
      task: deploy_application

  post_deployment:
    - agent: quality
      task: smoke_testing
    - agent: devops
      task: monitoring_validation
```

### Code Review Integration

#### 1. Enhanced Code Review Process
```bash
# .claude/commands/team-code-review.md
cat > .claude/commands/team-code-review.md << 'EOF'
# Team Code Review Command

Comprehensive code review process involving multiple specialized agents.

## Usage
```
/team-code-review [pull-request-number]
```

## Review Process
1. **Code Quality Review** (Code Reviewer Agent)
   - Static analysis and code standards
   - Best practices compliance
   - Performance considerations

2. **Security Review** (Security Agent)
   - Vulnerability scanning
   - Security best practices
   - Compliance verification

3. **Technical Architecture Review** (Tech Lead Agent)
   - Architecture compliance
   - Design pattern usage
   - Technical debt assessment

4. **Domain-Specific Review** (Specialist Agents)
   - Frontend: UI/UX and performance
   - Platform: API design and integration
   - DevOps: Deployment and monitoring impact

## Review Outputs
- Comprehensive feedback with severity levels
- Actionable improvement suggestions
- Approval/rejection recommendation
- Learning opportunities identification
EOF
```

## Template Versioning and Updates

### Version Management Strategy

#### 1. Template Version Control
```json
// template-version.json
{
  "version": "2.1.0",
  "releaseDate": "2024-01-15",
  "compatibility": {
    "claudeCode": ">=1.0.0",
    "node": ">=18.0.0",
    "bun": ">=1.0.0"
  },
  "changelog": {
    "2.1.0": {
      "added": [
        "Enterprise configuration templates",
        "Healthcare compliance agent",
        "Advanced AI cost optimization"
      ],
      "changed": [
        "Updated security agent with latest OWASP guidelines",
        "Improved agent coordination protocols"
      ],
      "deprecated": [
        "Legacy manifest V2 support"
      ],
      "removed": [
        "Outdated testing utilities"
      ],
      "fixed": [
        "Agent handoff timing issues",
        "Configuration loading edge cases"
      ]
    }
  },
  "migrationGuide": {
    "from": "2.0.x",
    "to": "2.1.0",
    "steps": [
      "Update agent configurations",
      "Migrate security settings",
      "Test agent coordination"
    ]
  }
}
```

#### 2. Update Management Script
```bash
#!/bin/bash
# scripts/update-template.sh

# Template update management script

CURRENT_VERSION=$(jq -r '.version' template-version.json)
LATEST_VERSION=$(curl -s https://api.github.com/repos/your-org/template/releases/latest | jq -r '.tag_name')

echo "Current template version: $CURRENT_VERSION"
echo "Latest template version: $LATEST_VERSION"

if [ "$CURRENT_VERSION" != "$LATEST_VERSION" ]; then
    echo "Update available!"

    read -p "Do you want to update? (y/N): " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        # Backup current configuration
        cp -r .claude .claude.backup.$(date +%Y%m%d)

        # Download and apply updates
        curl -s https://api.github.com/repos/your-org/template/zipball/$LATEST_VERSION \
            | tar -xz --strip=1 --exclude='.claude/settings.local.json'

        # Run migration scripts if needed
        if [ -f "scripts/migrate-$CURRENT_VERSION-to-$LATEST_VERSION.sh" ]; then
            ./scripts/migrate-$CURRENT_VERSION-to-$LATEST_VERSION.sh
        fi

        echo "Template updated successfully!"
        echo "Please review changes and test agent functionality."
    fi
else
    echo "Template is up to date."
fi
```

### Migration Patterns

#### 1. Configuration Migration
```typescript
// scripts/migrate-config.ts
export class ConfigurationMigrator {
  async migrate(fromVersion: string, toVersion: string): Promise<void> {
    const migrations = this.getMigrations(fromVersion, toVersion);

    for (const migration of migrations) {
      await this.applyMigration(migration);
    }
  }

  private getMigrations(from: string, to: string): Migration[] {
    // Define version-specific migrations
    const migrations: Record<string, Migration[]> = {
      '2.0.0-to-2.1.0': [
        {
          name: 'Update agent configurations',
          apply: async () => {
            await this.updateAgentConfigs();
          }
        },
        {
          name: 'Migrate security settings',
          apply: async () => {
            await this.migrateSecuritySettings();
          }
        }
      ]
    };

    return migrations[`${from}-to-${to}`] || [];
  }

  private async updateAgentConfigs(): Promise<void> {
    const agentDirs = await fs.readdir('.claude/agents');

    for (const agentDir of agentDirs) {
      const configPath = `.claude/agents/${agentDir}/config.json`;

      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);

        // Apply configuration updates
        if (config.version < '2.1.0') {
          config.capabilities = this.updateCapabilities(config.capabilities);
          config.version = '2.1.0';

          await fs.writeJson(configPath, config, { spaces: 2 });
        }
      }
    }
  }
}
```

## Best Practices for Template Maintenance

### 1. Regular Review and Updates

- **Monthly Agent Review**: Assess agent performance and update expertise
- **Quarterly Template Updates**: Incorporate new technologies and patterns
- **Continuous Integration**: Test template changes with real projects
- **Community Feedback**: Gather and incorporate user feedback

### 2. Documentation Maintenance

- **Keep Documentation Current**: Update docs with every template change
- **Version Documentation**: Maintain version-specific documentation
- **Migration Guides**: Provide clear upgrade paths
- **Example Projects**: Maintain working examples for each template variant

### 3. Testing and Validation

- **Template Validation**: Automated testing of template configurations
- **Agent Testing**: Validate agent coordination and capabilities
- **Integration Testing**: Test with various project types and sizes
- **Performance Testing**: Monitor template performance impact

### 4. Community and Contribution

- **Open Source Contribution**: Enable community contributions
- **Template Gallery**: Maintain examples of successful customizations
- **Best Practices Sharing**: Document and share successful patterns
- **User Success Stories**: Collect and share implementation experiences

---

This comprehensive customization guide provides everything needed to adapt the template for any organization, team size, or project type while maintaining the core benefits of the sophisticated agent coordination system and modern development practices.

**Key Takeaways:**
- Start with base template and customize gradually
- Preserve the log-based agent coordination system
- Adapt agents and configurations to your specific needs
- Maintain proper versioning and update processes
- Document customizations for team knowledge sharing

The template's flexibility enables it to grow and evolve with your team while maintaining the productivity benefits of AI-assisted development workflows.
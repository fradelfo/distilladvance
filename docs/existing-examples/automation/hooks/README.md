# Claude Code Hooks & Automation Templates

This directory contains templates for Claude Code hooks and automation workflows that enhance team productivity through intelligent automation triggered by specific events and tool usage.

## Overview

Claude Code hooks allow you to run shell commands automatically in response to events like tool calls, enabling powerful automation workflows. These templates provide proven patterns for common automation scenarios that teams find valuable.

**Key Benefits:**
- **Automatic Quality Checks**: Run tests, linting, and security scans automatically
- **Workflow Automation**: Trigger builds, deployments, and notifications
- **Development Efficiency**: Automate repetitive tasks and enforce standards
- **Team Coordination**: Automatic notifications and status updates

## Hook Types & Templates

### Development Workflow Hooks

1. **pre-commit-validation.json** - Quality checks before any code changes
2. **code-review-automation.json** - Automated code review and analysis
3. **test-automation.json** - Intelligent test execution based on changes
4. **build-pipeline.json** - Automated build and deployment triggers

### Quality Assurance Hooks

5. **security-scanning.json** - Automatic security analysis and vulnerability checking
6. **performance-monitoring.json** - Performance impact analysis and alerts
7. **documentation-sync.json** - Keep documentation in sync with code changes
8. **compliance-checking.json** - Regulatory and standards compliance validation

### Team Coordination Hooks

9. **slack-notifications.json** - Team communication and status updates
10. **project-tracking.json** - Automatic project management updates
11. **code-metrics.json** - Collect and report development metrics
12. **deployment-notifications.json** - Deployment status and rollback alerts

## Quick Start Guide

### 1. Choose Your Hook Template

Select hooks based on your team's needs:

```bash
# Copy relevant hook templates to your .claude/hooks directory
mkdir -p .claude/hooks
cp templates/automation/hooks/pre-commit-validation.json .claude/hooks/
cp templates/automation/hooks/slack-notifications.json .claude/hooks/
```

### 2. Configure Hook Settings

Edit the hook configuration to match your environment:

```json
{
  "name": "pre-commit-validation",
  "description": "Run quality checks before code changes",
  "trigger": "before_tool_call",
  "conditions": {
    "tools": ["Edit", "Write"],
    "file_patterns": ["*.js", "*.ts", "*.py", "*.go"]
  },
  "actions": [
    {
      "name": "lint",
      "command": "npm run lint",
      "timeout": 30,
      "required": true
    },
    {
      "name": "test",
      "command": "npm run test:changed",
      "timeout": 120,
      "required": false
    }
  ],
  "notifications": {
    "success": "✅ Code quality checks passed",
    "failure": "❌ Code quality issues found - check output"
  }
}
```

### 3. Test Hook Configuration

Validate your hook setup:

```bash
# Test hook configuration
claude hooks validate .claude/hooks/

# List active hooks
claude hooks list

# Test specific hook
claude hooks test pre-commit-validation
```

## Hook Configuration Patterns

### Event Triggers

```yaml
trigger_types:
  before_tool_call: "Before Claude executes a tool"
  after_tool_call: "After Claude completes a tool"
  on_file_change: "When files are modified"
  on_session_start: "At the beginning of a Claude session"
  on_session_end: "At the end of a Claude session"
  on_error: "When tool execution fails"
  periodic: "On scheduled intervals"
```

### Condition Matching

```json
{
  "conditions": {
    "tools": ["Edit", "Write", "Bash"],
    "file_patterns": ["src/**/*.ts", "tests/**/*.js"],
    "path_includes": ["components", "services"],
    "path_excludes": ["node_modules", ".git"],
    "file_size_max": "1MB",
    "working_hours": "09:00-17:00",
    "git_branch": ["main", "develop"]
  }
}
```

### Action Types

```yaml
action_patterns:
  validation: "Check code quality, run tests, lint"
  notification: "Send messages to Slack, email, etc."
  automation: "Trigger builds, deployments, backups"
  metrics: "Collect data, update dashboards"
  security: "Scan for vulnerabilities, check compliance"
  integration: "Update external systems, APIs"
```

## Common Hook Patterns

### Quality Gate Pattern
```json
{
  "name": "quality-gate",
  "trigger": "before_tool_call",
  "conditions": {
    "tools": ["Edit", "Write"],
    "file_patterns": ["src/**/*"]
  },
  "actions": [
    {
      "name": "lint",
      "command": "eslint ${MODIFIED_FILES}",
      "required": true,
      "timeout": 30
    },
    {
      "name": "type-check",
      "command": "tsc --noEmit",
      "required": true,
      "timeout": 60
    },
    {
      "name": "test-affected",
      "command": "jest --findRelatedTests ${MODIFIED_FILES}",
      "required": false,
      "timeout": 120
    }
  ],
  "failure_action": "block",
  "success_message": "Quality checks passed ✅",
  "failure_message": "Quality issues found ❌ - see output above"
}
```

### Notification Pattern
```json
{
  "name": "team-notifications",
  "trigger": "after_tool_call",
  "conditions": {
    "tools": ["Bash"],
    "command_patterns": ["git push", "npm run deploy"]
  },
  "actions": [
    {
      "name": "slack-notify",
      "command": "curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"${USER} deployed ${GIT_BRANCH} to ${ENVIRONMENT}\"}' ${SLACK_WEBHOOK_URL}",
      "timeout": 10
    }
  ]
}
```

### Automation Pipeline Pattern
```json
{
  "name": "deployment-pipeline",
  "trigger": "after_tool_call",
  "conditions": {
    "tools": ["Bash"],
    "command_patterns": ["git push origin main"],
    "git_branch": "main"
  },
  "actions": [
    {
      "name": "trigger-build",
      "command": "gh workflow run deploy.yml",
      "timeout": 30
    },
    {
      "name": "update-status",
      "command": "curl -X POST ${PROJECT_API}/deployments -d '{\"status\":\"triggered\",\"branch\":\"${GIT_BRANCH}\"}'",
      "timeout": 10
    }
  ]
}
```

## Security Considerations

### Safe Hook Practices
- **Input Validation**: Always validate inputs and file paths
- **Command Injection**: Use parameterized commands, avoid string concatenation
- **Access Control**: Limit hook permissions to necessary operations only
- **Secrets Management**: Use environment variables for sensitive data
- **Audit Logging**: Log all hook executions for security monitoring

### Hook Security Template
```json
{
  "security": {
    "allowed_commands": [
      "npm", "yarn", "eslint", "prettier", "jest", "curl", "git"
    ],
    "blocked_patterns": [
      "rm -rf", "sudo", "su", "chmod 777", "eval", "exec"
    ],
    "environment_isolation": true,
    "timeout_maximum": 300,
    "resource_limits": {
      "memory": "256MB",
      "cpu": "50%"
    }
  }
}
```

## Environment Variables

### Standard Variables Available in Hooks
```bash
# File and Tool Context
CLAUDE_TOOL_NAME        # Name of the tool being executed
CLAUDE_TOOL_ARGS        # Arguments passed to the tool
MODIFIED_FILES          # List of files being modified
TARGET_FILE            # Specific file being operated on
WORKING_DIRECTORY      # Current working directory

# Git Context
GIT_BRANCH             # Current git branch
GIT_COMMIT             # Current git commit hash
GIT_AUTHOR             # Git author of last commit
GIT_STATUS             # Git working tree status

# Project Context
PROJECT_NAME           # Name of the current project
PROJECT_ROOT           # Root directory of the project
PACKAGE_VERSION        # Version from package.json
ENVIRONMENT           # Current environment (dev, staging, prod)

# User Context
USER                  # Current system user
CLAUDE_SESSION_ID     # Unique session identifier
CLAUDE_MODEL         # Claude model being used
TIMESTAMP            # Current timestamp
```

### Custom Environment Setup
```bash
# .claude/hooks/environment.sh
export PROJECT_API="https://api.myproject.com"
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
export NOTIFICATION_CHANNEL="#development"
export QUALITY_THRESHOLD="80"
export DEPLOYMENT_ENVIRONMENT="staging"
```

## Hook Debugging & Troubleshooting

### Debugging Commands
```bash
# Enable hook debugging
export CLAUDE_HOOKS_DEBUG=true

# View hook execution logs
claude hooks logs --tail 50

# Test hook without execution
claude hooks dry-run pre-commit-validation

# Validate hook configuration
claude hooks validate .claude/hooks/

# Disable specific hook temporarily
claude hooks disable security-scanning
```

### Common Issues & Solutions

#### Hook Not Triggering
- **Check trigger conditions**: Verify tool names and file patterns match
- **Validate hook syntax**: Use `claude hooks validate` to check JSON syntax
- **Review permissions**: Ensure hook files are readable
- **Debug trigger matching**: Use debug mode to see trigger evaluation

#### Command Execution Failures
- **Check command availability**: Verify commands exist in PATH
- **Review permissions**: Ensure commands have necessary permissions
- **Validate environment**: Check required environment variables are set
- **Monitor timeouts**: Increase timeout for long-running commands

#### Performance Issues
- **Optimize conditions**: Use specific file patterns to reduce hook triggers
- **Parallel execution**: Use `async: true` for independent actions
- **Resource limits**: Set appropriate CPU and memory limits
- **Selective triggers**: Only trigger on relevant tool calls

## Advanced Hook Patterns

### Conditional Execution Chain
```json
{
  "name": "smart-testing",
  "trigger": "before_tool_call",
  "conditions": {
    "tools": ["Edit"],
    "file_patterns": ["src/**/*.ts"]
  },
  "actions": [
    {
      "name": "quick-lint",
      "command": "eslint ${TARGET_FILE} --quiet",
      "timeout": 10,
      "continue_on_failure": false
    },
    {
      "name": "type-check",
      "command": "tsc --noEmit ${TARGET_FILE}",
      "timeout": 30,
      "depends_on": ["quick-lint"]
    },
    {
      "name": "related-tests",
      "command": "jest --findRelatedTests ${TARGET_FILE} --passWithNoTests",
      "timeout": 60,
      "depends_on": ["type-check"],
      "async": true
    }
  ]
}
```

### Dynamic Hook Loading
```json
{
  "name": "dynamic-hooks",
  "trigger": "on_session_start",
  "actions": [
    {
      "name": "load-project-hooks",
      "command": "cat .project/hooks.json >> .claude/hooks/project-specific.json",
      "timeout": 5
    },
    {
      "name": "setup-environment",
      "command": "source .project/environment.sh",
      "timeout": 10
    }
  ]
}
```

### Metric Collection Hook
```json
{
  "name": "development-metrics",
  "trigger": "after_tool_call",
  "conditions": {
    "tools": ["Edit", "Write", "Bash"]
  },
  "actions": [
    {
      "name": "collect-metrics",
      "command": "node scripts/collect-metrics.js --tool=${CLAUDE_TOOL_NAME} --files=${MODIFIED_FILES}",
      "timeout": 15,
      "async": true
    }
  ]
}
```

## Integration Examples

### Slack Integration
```json
{
  "name": "slack-integration",
  "trigger": "after_tool_call",
  "conditions": {
    "tools": ["Bash"],
    "command_patterns": ["npm run deploy", "git push origin main"]
  },
  "actions": [
    {
      "name": "notify-team",
      "command": "curl -X POST -H 'Content-type: application/json' --data '{\"channel\": \"#deployments\", \"username\": \"Claude Bot\", \"text\": \"🚀 ${USER} deployed ${GIT_BRANCH} to production\", \"icon_emoji\": \":robot_face:\"}' ${SLACK_WEBHOOK_URL}",
      "timeout": 10
    }
  ]
}
```

### JIRA Integration
```json
{
  "name": "jira-update",
  "trigger": "after_tool_call",
  "conditions": {
    "tools": ["Bash"],
    "command_patterns": ["git commit -m.*PROJ-[0-9]+"]
  },
  "actions": [
    {
      "name": "update-jira-ticket",
      "command": "node scripts/update-jira.js --commit=${GIT_COMMIT} --message='${GIT_COMMIT_MESSAGE}'",
      "timeout": 30
    }
  ]
}
```

### GitHub Integration
```json
{
  "name": "github-automation",
  "trigger": "after_tool_call",
  "conditions": {
    "tools": ["Write"],
    "file_patterns": ["README.md", "docs/**/*.md"]
  },
  "actions": [
    {
      "name": "auto-commit-docs",
      "command": "git add ${MODIFIED_FILES} && git commit -m 'docs: Auto-update documentation via Claude Code' && git push",
      "timeout": 60
    }
  ]
}
```

This hooks and automation template library provides teams with powerful automation capabilities while maintaining security and reliability standards.
# Team Settings Usage Guide

This directory contains pre-configured settings.json templates for different team roles and organizational requirements. Each template provides secure, tested permission sets that can be deployed immediately or customized for specific needs.

## Available Templates

### Role-Based Templates

#### `junior-developer.json`
**Target**: New team members, interns, junior developers
**Focus**: Safety and guided learning
- ✅ Read access to all files
- ✅ Edit access to src/, tests/, docs/
- ✅ Basic git operations (status, diff, add, log)
- ✅ Standard development commands (npm, testing)
- ❌ System-level operations, deployments, force operations
- ⚠️ Requires approval for commits, config changes

**Use Case**: Onboarding new developers with safety guardrails

#### `senior-developer.json`
**Target**: Experienced developers, full-stack engineers
**Focus**: Full development capabilities with security safeguards
- ✅ Comprehensive development permissions
- ✅ Docker operations (build, run, logs)
- ✅ Advanced git operations
- ✅ Package management and testing
- ❌ Production deployments, force push to main
- ⚠️ Requires approval for main branch pushes, package.json changes

**Use Case**: Daily development work for experienced team members

#### `tech-lead.json`
**Target**: Technical leads, architects, senior engineers
**Focus**: Architecture decisions and team coordination
- ✅ Full development and architectural permissions
- ✅ Advanced tooling and analysis capabilities
- ✅ Team coordination tools
- ✅ Most git operations
- ❌ Destructive operations, credential access
- ⚠️ Requires approval for force pushes, production operations

**Use Case**: Technical leadership and architectural decision-making

#### `devops-specialist.json`
**Target**: DevOps engineers, site reliability engineers
**Focus**: Infrastructure and deployment automation
- ✅ Infrastructure files (Docker, Kubernetes, Terraform)
- ✅ Cloud platform tools (AWS, GCP, Azure)
- ✅ Deployment and monitoring tools
- ✅ System administration commands
- ❌ Production deletions, source code modifications
- ⚠️ Requires approval for production deployments

**Use Case**: Infrastructure management and deployment automation

### Security & Compliance Templates

#### `security-focused.json`
**Target**: Security engineers, compliance officers
**Focus**: Security analysis and compliance validation
- ✅ Security analysis tools and scanners
- ✅ Audit and compliance capabilities
- ✅ Security documentation and policies
- ✅ Vulnerability assessment tools
- ❌ Source code modifications, system operations
- ⚠️ Requires approval for most code changes

**Use Case**: Security audits, compliance validation, vulnerability assessment

#### `enterprise.json`
**Target**: Enterprise environments with strict governance
**Focus**: Compliance, audit trails, cost control
- ✅ Standard development operations with logging
- ✅ Comprehensive audit trail
- ✅ Cost monitoring and controls
- ✅ Compliance-focused permissions
- ❌ Most advanced operations restricted
- ⚠️ Extensive approval requirements for changes

**Use Case**: Large organizations with regulatory compliance requirements

## Installation Instructions

### 1. Choose Your Template
Select the template that best matches your role and organizational requirements.

### 2. Copy to Claude Code Configuration
```bash
# For project-specific settings (shared with team)
cp templates/team-settings/[template].json .claude/settings.json

# For personal settings (user-specific)
cp templates/team-settings/[template].json ~/.claude/settings.json

# For local project override (not committed)
cp templates/team-settings/[template].json .claude/settings.local.json
```

### 3. Customize for Your Needs
Edit the copied file to match your specific requirements:
- Add/remove specific file patterns
- Adjust command permissions
- Modify environment variables
- Update hooks for your workflow

### 4. Test Configuration
```bash
# Test with Claude Code
claude

# Verify permissions work as expected
/permissions

# Check status line shows correct mode
```

## Customization Guidelines

### Permission Patterns
```json
{
  "allow": [
    "ToolName(*)",           // Allow all arguments
    "ToolName(pattern)",     // Allow specific patterns
    "Edit(src/**)",          // Edit files in src directory
    "Bash(npm run *)"        // Allow all npm run commands
  ],
  "deny": [
    "Read(.env*)",           // Block environment files
    "Bash(sudo *)",          // Block sudo commands
    "Edit(**/secrets/**)"    // Block secrets directories
  ],
  "ask": [
    "Bash(git push:*)",      // Require approval for pushes
    "Edit(package.json)"     // Require approval for package.json
  ]
}
```

### Environment Variables
Use environment variables to customize behavior:
```json
{
  "env": {
    "NODE_ENV": "development",
    "CLAUDE_SAFETY_MODE": "strict",
    "MAX_CONCURRENT_TASKS": "3",
    "CUSTOM_WORKFLOW": "true"
  }
}
```

### Hooks Configuration
Add automation with hooks:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint --fix || true"
          }
        ]
      }
    ]
  }
}
```

## Security Best Practices

### 1. Principle of Least Privilege
- Start with restrictive permissions
- Add permissions as needed
- Regular permission audits

### 2. Environment Protection
- Always deny access to .env files
- Block secrets and credentials directories
- Use ask permissions for sensitive operations

### 3. Audit and Monitoring
- Enable audit logging for enterprise use
- Monitor permission usage patterns
- Track cost and usage metrics

### 4. Version Control
- Commit shared team settings to repository
- Use .claude/settings.local.json for personal overrides
- Document permission changes in commit messages

## Troubleshooting

### Permission Denied Errors
1. Check if operation is in `deny` list
2. Verify pattern matching is correct
3. Consider moving to `ask` list for approval-based access

### Performance Issues
1. Reduce `MAX_CONCURRENT_TASKS` for lower-spec machines
2. Optimize hook commands for speed
3. Use more restrictive permissions to reduce overhead

### Team Conflicts
1. Use project-level settings for team standards
2. Allow personal overrides with settings.local.json
3. Document team permission policies

### Cost Management
1. Set `maxTokensPerDay` limits
2. Use `costThreshold` warnings and limits
3. Monitor usage with enterprise audit logs

## Migration Between Templates

### Upgrading Permissions
```bash
# Backup current settings
cp .claude/settings.json .claude/settings.backup.json

# Apply new template
cp templates/team-settings/[new-template].json .claude/settings.json

# Merge custom configurations if needed
```

### Team Standardization
```bash
# Apply team standard across projects
for project in */; do
  cp templates/team-settings/senior-developer.json "$project/.claude/settings.json"
done
```

## Support and Updates

- Templates are regularly updated with latest Claude Code features
- Security patches are applied to all templates
- Feedback and customization requests welcome
- Enterprise support available for large deployments

Choose the template that best fits your role and customize as needed for your specific workflow and organizational requirements.
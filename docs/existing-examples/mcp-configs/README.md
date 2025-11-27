# MCP Configuration Templates

Model Context Protocol (MCP) configuration templates for popular development tools and services. These templates enable Claude Code to integrate seamlessly with your existing development stack.

## Available Integrations

### Development Tools
- **[GitHub](./github.json)** - Repository management, issues, pull requests, and project coordination
- **[Slack](./slack.json)** - Team communication, notifications, and workflow automation

### Data & Infrastructure
- **[PostgreSQL](./postgresql.json)** - Database operations, analytics, and schema management
- **[AWS Services](./aws-services.json)** - Cloud infrastructure management and monitoring

### Additional Integrations (Coming Soon)
- GitLab CI/CD
- Jira Project Management
- Docker & Kubernetes
- Notion Knowledge Base
- Datadog Monitoring

## Quick Setup Guide

### 1. Choose Your Integrations
Select the MCP configurations that match your development stack from the templates above.

### 2. Configure Environment Variables
Each integration requires specific environment variables. Create a `.env` file in your project root:

```bash
# GitHub Integration
GITHUB_TOKEN=ghp_your_github_token_here

# Slack Integration
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_APP_TOKEN=xapp-your-app-token

# PostgreSQL Integration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# AWS Integration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_DEFAULT_REGION=us-east-1
```

### 3. Create MCP Configuration
Copy the relevant templates to your project's `.mcp.json` file:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}",
        "SLACK_APP_TOKEN": "${SLACK_APP_TOKEN}"
      }
    },
    "postgresql": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

### 4. Test Integration
Restart Claude Code and test the integration:

```bash
claude
# Claude will now have access to your configured services
```

## Integration Details

### GitHub Integration
**Capabilities:**
- Repository browsing and file access
- Issue management and automation
- Pull request operations and reviews
- Project planning and coordination

**Common Use Cases:**
```bash
# Analyze and respond to GitHub issue
"Analyze GitHub issue #123 and provide solution recommendations"

# Review pull request
"Review PR #456 for code quality and security issues"

# Generate release notes
"Create release notes for v2.1.0 based on recent commits"
```

**Security Setup:**
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Create token with `repo`, `read:org`, `read:user` scopes
3. Store securely in environment variables

### Slack Integration
**Capabilities:**
- Send messages and notifications
- Read channel history and threads
- File sharing and uploads
- Team coordination automation

**Common Use Cases:**
```bash
# Send deployment notification
"Notify #deployments about successful production deployment"

# Create project update
"Send weekly project status update to team channel"

# Alert on critical issues
"Send alert to #alerts channel for system errors"
```

**Security Setup:**
1. Create Slack app at https://api.slack.com/apps
2. Add required bot scopes and install to workspace
3. Configure app-level token for socket mode
4. Store tokens securely in environment variables

### PostgreSQL Integration
**Capabilities:**
- Data analysis and reporting
- Schema exploration and documentation
- Performance monitoring
- Business intelligence queries

**Common Use Cases:**
```bash
# Generate business report
"Create monthly sales report with key metrics and trends"

# Analyze user behavior
"Analyze user engagement patterns over the last quarter"

# Monitor database health
"Check database performance and identify optimization opportunities"
```

**Security Setup:**
1. Create read-only database user for Claude Code
2. Grant minimal required permissions
3. Use SSL connections for production
4. Store credentials securely

### AWS Services Integration
**Capabilities:**
- Infrastructure monitoring and analysis
- Cost optimization recommendations
- Security auditing
- Resource management

**Common Use Cases:**
```bash
# Cost analysis
"Analyze AWS costs and identify optimization opportunities"

# Security audit
"Review S3 buckets for security best practices"

# Performance monitoring
"Check EC2 instances and RDS performance metrics"
```

**Security Setup:**
1. Create IAM user with minimal required permissions
2. Use IAM roles instead of access keys when possible
3. Enable CloudTrail for audit logging
4. Rotate credentials regularly

## Security Best Practices

### Credential Management
- **Never commit credentials to version control**
- **Use environment variables for all sensitive data**
- **Rotate tokens and passwords regularly (every 90 days)**
- **Use least-privilege permissions for all integrations**
- **Monitor access logs and audit trails**

### Access Control
```bash
# Example: Read-only PostgreSQL user
CREATE ROLE claude_readonly;
GRANT CONNECT ON DATABASE myapp TO claude_readonly;
GRANT USAGE ON SCHEMA public TO claude_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO claude_readonly;

CREATE USER claude_user WITH PASSWORD 'secure_random_password';
GRANT claude_readonly TO claude_user;
```

### Environment Isolation
- **Use separate credentials for development/staging/production**
- **Implement environment-specific access controls**
- **Tag resources for proper access management**
- **Monitor cross-environment access attempts**

## Troubleshooting

### Common Issues

#### Connection Failures
```bash
# Test connectivity
curl -f https://api.github.com/user -H "Authorization: token $GITHUB_TOKEN"
psql $DATABASE_URL -c "SELECT 1;"
aws sts get-caller-identity
```

#### Permission Errors
- **GitHub**: Verify token has required repository permissions
- **Slack**: Ensure bot is invited to channels and has necessary scopes
- **PostgreSQL**: Check user permissions and database access
- **AWS**: Review IAM policies and resource access

#### Rate Limiting
- **Implement request throttling and retry logic**
- **Use caching for frequently accessed data**
- **Monitor API usage and limits**
- **Consider pagination for large data sets**

### Debug Commands
```bash
# Check Claude Code MCP status
claude --debug

# List active MCP servers
claude mcp list

# Test specific server
claude mcp test server-name

# View MCP logs
tail -f ~/.claude/logs/mcp.log
```

## Integration Patterns

### Multi-Service Workflows
Combine multiple integrations for powerful workflows:

```bash
# GitHub + Slack workflow
"When GitHub issue is created, analyze it and post summary to Slack #issues channel"

# Database + Slack reporting
"Generate weekly database performance report and share in #engineering channel"

# AWS + GitHub integration
"Monitor AWS costs and create GitHub issue if budget threshold exceeded"
```

### Automation Examples
```bash
# Daily standup automation
"Create daily standup summary from GitHub activity and Slack messages"

# Incident response
"When AWS CloudWatch alarm triggers, create GitHub issue and notify Slack"

# Code review automation
"Analyze GitHub PR for security issues and post findings to review thread"
```

## Advanced Configuration

### Custom MCP Servers
Create organization-specific MCP servers:

```javascript
// custom-api-server.js
import { McpServer } from '@modelcontextprotocol/server';

const server = new McpServer({
  name: 'custom-api',
  version: '1.0.0'
});

// Implement custom tools and resources
server.addTool('analyze-metrics', async (params) => {
  // Custom business logic
  return await analyzeBusinessMetrics(params);
});

export default server;
```

### Performance Optimization
- **Connection pooling for database integrations**
- **Caching for frequently accessed data**
- **Request batching for API calls**
- **Asynchronous processing for long operations**

### Monitoring and Analytics
```json
{
  "monitoring": {
    "metrics": [
      "mcp_requests_total",
      "mcp_response_time",
      "mcp_errors_total"
    ],
    "alerting": {
      "error_rate_threshold": 0.05,
      "response_time_threshold": "5s"
    }
  }
}
```

## Migration and Updates

### Updating Integrations
1. **Backup current configuration**
2. **Update MCP server versions**
3. **Test new features in development**
4. **Deploy updates with rollback plan**
5. **Monitor for issues after deployment**

### Adding New Integrations
1. **Assess security requirements**
2. **Create development environment setup**
3. **Test integration thoroughly**
4. **Document configuration and usage**
5. **Train team on new capabilities**

## Support and Community

### Getting Help
- **Official MCP Documentation**: [MCP Protocol Specification](https://modelcontextprotocol.io/docs)
- **Claude Code Documentation**: [Claude Code Docs](https://code.claude.com/docs)
- **Community Forums**: Share experiences and get help from other users
- **GitHub Issues**: Report bugs and request features

### Contributing
- **Share custom MCP configurations**
- **Submit integration templates**
- **Report security issues responsibly**
- **Contribute to documentation improvements**

### Best Practice Sharing
- **Document successful integration patterns**
- **Share performance optimization techniques**
- **Collaborate on security improvements**
- **Create reusable integration templates**

These MCP configuration templates provide a solid foundation for integrating Claude Code with your development stack while maintaining security and performance best practices.
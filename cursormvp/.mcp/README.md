# MCP Integration Configurations

This directory contains comprehensive Model Context Protocol (MCP) server configurations for browser extension + AI web application development. These configurations enable Claude Code to interact with external services and cloud infrastructure seamlessly.

## 🚀 Quick Start

1. **Choose your configuration**:
   - `config.json` - Complete integration setup with all services
   - Individual files - Pick and choose specific integrations

2. **Copy to your project root**:
   ```bash
   cp .mcp/config.json .mcp.json
   # OR for individual services
   cp .mcp/github.json .mcp.json
   ```

3. **Set environment variables** (see setup guides below)

4. **Test the connection**:
   ```bash
   claude mcp health-check
   ```

## 📁 Available Configurations

### Core Integrations

| Configuration | Description | Key Features |
|---------------|-------------|--------------|
| [`config.json`](./config.json) | Complete setup with all services | All integrations, environment-specific configs, security controls |
| [`github.json`](./github.json) | GitHub repository management | Issues, PRs, releases, automation workflows |
| [`postgresql.json`](./postgresql.json) | Database operations and monitoring | User data, AI conversations, analytics, vector search |
| [`slack.json`](./slack.json) | Team notifications and collaboration | Alerts, status updates, interactive features |
| [`aws.json`](./aws.json) | Cloud infrastructure management | Monitoring, cost optimization, deployment automation |

### Service Overview

#### 🐙 GitHub Integration
- **Issues & PR Management**: Automated triaging, review assignments, status tracking
- **Release Automation**: Semantic versioning, changelog generation, deployment triggers
- **Code Review Integration**: Claude Code agent analysis, security scanning, quality gates
- **Workflow Automation**: CI/CD integration, automated responses, team notifications

#### 🗃️ PostgreSQL Database
- **User Data Management**: Secure user accounts, preferences, conversation history
- **AI Analytics**: Usage tracking, cost monitoring, performance metrics
- **Vector Search**: Semantic search with pgvector extension
- **Security Controls**: Row-level security, encryption, audit logging

#### 💬 Slack Collaboration
- **Development Notifications**: PR updates, build status, deployment alerts
- **AI Workflow Integration**: Cost alerts, experiment results, usage reports
- **Interactive Features**: Slash commands, buttons, scheduled reports
- **Team Coordination**: Standups, retrospectives, knowledge sharing

#### ☁️ AWS Infrastructure
- **Resource Monitoring**: EC2, RDS, EKS, Lambda metrics and health checks
- **Cost Management**: Budget alerts, usage tracking, optimization recommendations
- **Security Automation**: Secrets rotation, security scanning, compliance monitoring
- **Disaster Recovery**: Backup automation, failover procedures, incident response

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env` file in your project root:

```bash
# GitHub Integration
GITHUB_TOKEN=ghp_your_github_token_here
GITHUB_OWNER=your_username_or_org
GITHUB_REPO=your_repository_name

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
ENCRYPTION_KEY=your_32_byte_encryption_key_here

# Slack Integration
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_APP_TOKEN=xapp-your-slack-app-token
SLACK_SIGNING_SECRET=your_slack_signing_secret

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
PROJECT_NAME=your_project_name

# AI Services (Optional - for cost tracking)
OPENAI_API_KEY=sk-your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Additional Services
REDIS_URL=redis://localhost:6379
SENTRY_AUTH_TOKEN=your_sentry_token
```

### Environment-Specific Configuration

The configurations support different environments:

- **Development**: Full read/write access, local services
- **Staging**: Limited access, production-like environment
- **Production**: Read-only access, security hardened

Set `NODE_ENV` to automatically apply the appropriate configuration:

```bash
export NODE_ENV=development  # or staging, production
```

## 🛠️ Service-Specific Setup

### GitHub Integration Setup

1. **Create Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create token with these scopes:
     - `repo` (Full control of private repositories)
     - `read:org` (Read org and team membership)
     - `project` (Full control of projects)

2. **Configure Repository**:
   ```bash
   export GITHUB_OWNER=your_username
   export GITHUB_REPO=your_repository
   export GITHUB_TOKEN=ghp_your_token_here
   ```

3. **Test Connection**:
   ```bash
   claude mcp test github
   ```

### PostgreSQL Setup

1. **Install pgvector Extension**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **Configure Connection**:
   ```bash
   export DATABASE_URL=postgresql://user:password@localhost:5432/yourdb
   ```

3. **Run Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

### Slack Integration Setup

1. **Create Slack App**:
   - Go to [api.slack.com](https://api.slack.com)
   - Create new app with these permissions:
     - `channels:read`, `channels:write`
     - `chat:write`, `files:write`
     - `reactions:write`, `users:read`

2. **Configure Tokens**:
   ```bash
   export SLACK_BOT_TOKEN=xoxb-your-bot-token
   export SLACK_APP_TOKEN=xapp-your-app-token
   ```

3. **Install to Workspace and Test**:
   ```bash
   claude mcp test slack
   ```

### AWS Integration Setup

1. **Create IAM User/Role**:
   - Minimal permissions: `ReadOnlyAccess`
   - Additional permissions based on your needs
   - Enable MFA for enhanced security

2. **Tag Resources**:
   ```bash
   # Tag your AWS resources with:
   Project=your_project_name
   Environment=dev|staging|prod
   Team=your_team_name
   ```

3. **Configure and Test**:
   ```bash
   export AWS_ACCESS_KEY_ID=your_key
   export AWS_SECRET_ACCESS_KEY=your_secret
   export AWS_REGION=us-east-1
   claude mcp test aws
   ```

## 🔒 Security Best Practices

### Access Controls
- **Least Privilege**: Grant minimal required permissions
- **Environment Separation**: Use different credentials for each environment
- **Token Rotation**: Regularly rotate API keys and tokens
- **Audit Logging**: Enable comprehensive logging for all integrations

### Data Protection
- **Environment Variables**: Store secrets in environment variables, not code
- **Encryption**: Use encryption for sensitive data in databases
- **Network Security**: Use VPNs and private networks where possible
- **Regular Security Reviews**: Audit permissions and access regularly

### Production Hardening
- **Read-Only by Default**: Production integrations should be read-only
- **Approval Workflows**: Require approval for sensitive operations
- **Monitoring**: Set up comprehensive monitoring and alerting
- **Incident Response**: Have procedures for security incidents

## 📊 Monitoring and Maintenance

### Health Monitoring

Each integration includes health check capabilities:

```bash
# Check all integrations
claude mcp health-check

# Check specific service
claude mcp health-check github
claude mcp health-check postgresql
claude mcp health-check slack
claude mcp health-check aws
```

### Performance Monitoring

Monitor integration performance:

- **Response Times**: Track API response times
- **Error Rates**: Monitor failed requests
- **Usage Patterns**: Analyze usage trends
- **Cost Tracking**: Monitor service costs

### Maintenance Tasks

Regular maintenance activities:

1. **Weekly**:
   - Review error logs
   - Check service health
   - Monitor usage patterns

2. **Monthly**:
   - Rotate API keys
   - Review permissions
   - Analyze cost trends
   - Update configurations

3. **Quarterly**:
   - Security audit
   - Performance review
   - Capacity planning
   - Documentation updates

## 🔧 Troubleshooting

### Common Issues

#### Connection Failures
```bash
# Check environment variables
env | grep -E "(GITHUB|DATABASE|SLACK|AWS)"

# Validate credentials
claude mcp validate credentials

# Test individual services
claude mcp test [service_name]
```

#### Permission Errors
```bash
# Check IAM permissions (AWS)
aws sts get-caller-identity

# Verify GitHub token scopes
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### Rate Limiting
- Implement exponential backoff
- Reduce request frequency
- Use caching where appropriate
- Consider upgrading service tiers

### Debug Mode

Enable debug logging:

```bash
export DEBUG=mcp:*
claude mcp test [service]
```

### Support Resources

- **MCP Documentation**: [Model Context Protocol Docs](https://spec.modelcontextprotocol.io/)
- **Claude Code Docs**: [Claude Code Documentation](https://code.claude.com/docs)
- **Service-Specific Docs**: Check individual service documentation
- **Community Support**: GitHub issues and community forums

## 🚀 Advanced Configuration

### Custom MCP Servers

Create custom MCP servers for specialized needs:

```json
{
  "mcpServers": {
    "custom-service": {
      "command": "node",
      "args": ["./custom-mcp-server.js"],
      "env": {
        "CUSTOM_API_KEY": "${CUSTOM_API_KEY}"
      }
    }
  }
}
```

### Proxy Configuration

For enterprise environments with proxies:

```json
{
  "proxy": {
    "http": "http://proxy.company.com:8080",
    "https": "https://proxy.company.com:8080",
    "no_proxy": "localhost,127.0.0.1,.internal"
  }
}
```

### Performance Tuning

Optimize for your specific use case:

```json
{
  "performance": {
    "timeout": 30000,
    "retry_attempts": 3,
    "connection_pooling": true,
    "cache_ttl": 300
  }
}
```

## 📈 Usage Analytics

### Metrics Collection

The configurations include built-in metrics collection:

- **Request Count**: Number of API calls per service
- **Response Time**: Average and P95 response times
- **Error Rate**: Percentage of failed requests
- **Data Transfer**: Amount of data transferred

### Cost Tracking

Monitor integration costs:

- **API Usage**: Track API call costs
- **Data Storage**: Monitor storage costs
- **Compute Usage**: Track computational costs
- **Optimization Opportunities**: Identify cost reduction areas

### Performance Analytics

Analyze performance trends:

- **Throughput**: Requests per second
- **Latency**: Response time distribution
- **Availability**: Service uptime
- **Resource Utilization**: Memory and CPU usage

---

## 📝 Configuration Templates

### Minimal Setup
For quick testing and development:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

### Production Setup
For production deployments with full monitoring:

```json
{
  "mcpServers": {
    "github": { "...": "full github config" },
    "postgresql": { "...": "full database config" },
    "slack": { "...": "full slack config" },
    "aws": { "...": "full aws config" }
  },
  "environments": {
    "production": {
      "read_only_mode": true,
      "require_approval": ["database_writes", "infrastructure_changes"],
      "audit_logging": true,
      "encryption": "required"
    }
  }
}
```

### Team Collaboration
For enhanced team workflows:

```json
{
  "mcpServers": {
    "github": { "...": "github config with automation" },
    "slack": { "...": "slack config with notifications" }
  },
  "workflows": {
    "code_review": {
      "auto_assign_reviewers": true,
      "notify_on_approval": true,
      "require_tests": true
    }
  }
}
```

This comprehensive MCP integration setup provides the foundation for powerful Claude Code workflows that integrate seamlessly with your development infrastructure and team collaboration tools.
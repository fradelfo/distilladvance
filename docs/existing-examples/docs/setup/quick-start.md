# Quick Start Guide - Browser Extension + AI Web Application

Get your AI-powered browser extension project running in 15 minutes with our comprehensive template.

## Prerequisites (2 minutes)

### Required Tools
```bash
# 1. Node.js 18+ (check version)
node --version

# 2. Install Bun package manager
curl -fsSL https://bun.sh/install | bash

# 3. Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# 4. Verify installations
bun --version
claude --version
```

### Optional but Recommended
- Docker Desktop (for full-stack development)
- VS Code with recommended extensions
- Git configured with your credentials

## Step 1: Create Your Project (3 minutes)

### Option A: Clone Template (Recommended)
```bash
# Clone the template repository
git clone <your-template-repo-url> my-ai-extension
cd my-ai-extension

# Initialize as your own repository
rm -rf .git
git init
git add .
git commit -m "Initial commit: AI extension project template"
```

### Option B: Copy Template Files
```bash
# Create new project directory
mkdir my-ai-extension && cd my-ai-extension

# Copy template files (adjust path as needed)
cp -r /path/to/project-skeleton-template/* .
cp -r /path/to/project-skeleton-template/.* . 2>/dev/null || true

# Initialize git repository
git init
git add .
git commit -m "Initial commit: AI extension project template"
```

## Step 2: Environment Setup (5 minutes)

### Automated Setup (Recommended)
```bash
# Run the comprehensive setup script
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh

# This script will:
# - Install all dependencies with Bun
# - Set up development databases (PostgreSQL, Redis)
# - Configure environment files
# - Set up Git hooks and VS Code settings
# - Configure development tools
```

### Manual Setup (If automation fails)
```bash
# Install dependencies
bun install

# Install sub-package dependencies
cd app/packages/browser-extension && bun install && cd ../../..
cd app/packages/web-app && bun install && cd ../../..
cd app/packages/api-server && bun install && cd ../../..

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Database Setup
```bash
# Option 1: Docker (Recommended)
docker-compose -f docker-compose.dev.yml up -d

# Option 2: Local installation
# Install PostgreSQL and Redis locally, then:
bun run db:migrate
bun run db:seed
```

## Step 3: Configure Claude Code (2 minutes)

### Start Claude Code
```bash
# Start Claude Code (it will auto-detect configuration)
claude

# You should see the status line: "🚀 AI Extension Development"
```

### Test Agent System
```bash
# In Claude Code session, test agents:
"Use the frontend agent to analyze the React component structure"

# Test automation commands:
/code-review

# Test multi-agent coordination:
/team-coordination
```

### Verify Configuration
```bash
# Check that all agents are loaded
"List all available agents and their specializations"

# Check permissions
"Show my current permissions and capabilities"

# Test MCP integrations
"List available MCP server connections"
```

## Step 4: Start Development (3 minutes)

### Start All Services
```bash
# Option 1: Start everything at once
bun run dev

# This starts:
# - Browser extension development server
# - React web app (localhost:3000)
# - API server (localhost:3001)
# - Database services
```

### Start Services Individually
```bash
# Terminal 1: Browser extension with hot reload
bun run ext:dev

# Terminal 2: Web application
bun run web:dev

# Terminal 3: API server
bun run api:dev

# Terminal 4: Database services (if not using Docker)
docker-compose -f docker-compose.dev.yml up postgres redis
```

### Load Browser Extension
```bash
# Chrome
1. Open chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/extension/` directory

# Firefox
bun run ext:firefox  # Uses web-ext for automatic loading

# Edge
1. Open edge://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/extension/` directory
```

## Step 5: Verify Everything Works (2 minutes)

### Test Browser Extension
1. Extension should appear in browser toolbar
2. Click extension icon to open popup
3. Navigate to an AI chat site (OpenAI, Claude, etc.)
4. Verify content scripts inject distillation UI

### Test Web Application
1. Open http://localhost:3000
2. Verify React app loads correctly
3. Test navigation and basic UI components
4. Check browser console for errors

### Test API Server
```bash
# Test API health endpoint
curl http://localhost:3001/health

# Test API with authentication
curl http://localhost:3001/api/v1/user/profile \
  -H "Authorization: Bearer your-test-token"
```

### Run Test Suite
```bash
# Run all tests to verify setup
bun run test:all

# Run specific test categories
bun run test:unit          # Unit tests
bun run test:extension     # Browser extension tests
bun run test:e2e           # End-to-end tests
```

## Common Quick Start Issues

### Permission Errors
```bash
# If you get Claude Code permission errors
cat .claude/settings.json

# Verify permissions are correctly set
# Adjust if needed for your environment
```

### Environment Variables Missing
```bash
# Check .env file exists
ls -la .env*

# Verify required variables are set
cat .env | grep -E "(API_KEY|DATABASE_URL|PORT)"

# Set missing variables
echo "OPENAI_API_KEY=your_key_here" >> .env
```

### Dependencies Issues
```bash
# Clear and reinstall dependencies
rm -rf node_modules
bun install

# For sub-packages
find app/packages -name "node_modules" -type d -exec rm -rf {} +
bun run install:all
```

### Database Connection Issues
```bash
# Check database is running
docker-compose ps

# Check connection
bun run db:test-connection

# Reset database if corrupted
bun run db:reset
```

### Browser Extension Not Loading
```bash
# Rebuild extension
bun run ext:build

# Check for build errors
bun run ext:lint

# Verify manifest.json is valid
bun run ext:validate
```

## Next Steps After Quick Start

### Immediate Actions (Today)
1. **Explore the Agent System**: Try different agent specializations
   ```bash
   # In Claude Code:
   "Use the security agent to review the authentication system"
   "Use the platform agent to design the AI integration architecture"
   ```

2. **Test Automation Commands**: Try the pre-built commands
   ```bash
   /code-review
   /generate-tests app/packages/browser-extension/src/
   /security-audit
   ```

3. **Customize for Your Project**: Update project-specific configuration
   - Edit `CLAUDE.md` with your project details
   - Update `package.json` with your project name
   - Configure `.env` with your API keys and services

### This Week
1. **Deep Dive into Agent Coordination**: Learn the log-based workflow system
2. **Set Up CI/CD**: Configure GitHub Actions for your repository
3. **Add Team Members**: Share setup process with team
4. **Custom Extensions**: Add project-specific agents and commands

### Advanced Features
1. **MCP Integrations**: Connect additional services (Slack, AWS, etc.)
2. **Custom Testing**: Add project-specific test scenarios
3. **Deployment**: Set up staging and production environments
4. **Monitoring**: Configure application and infrastructure monitoring

## Quick Reference Commands

### Development Commands
```bash
# Start development
bun run dev

# Build for production
bun run build

# Run tests
bun run test:all
bun run test:unit
bun run test:e2e
bun run test:extension

# Code quality
bun run lint
bun run type-check
bun run format

# Database operations
bun run db:migrate
bun run db:seed
bun run db:reset
```

### Browser Extension Commands
```bash
# Development
bun run ext:dev
bun run ext:build
bun run ext:package

# Testing
bun run ext:test
bun run ext:lint
bun run ext:validate

# Cross-browser
bun run ext:firefox
bun run ext:edge
```

### Claude Code Commands
```bash
# Start Claude Code
claude

# Inside Claude Code session:
/help                  # Show available commands
/permissions          # Check permissions
/agents               # List available agents
/code-review          # Run code review
/generate-tests       # Generate test files
/security-audit       # Security scan
/deploy-application   # Deploy to staging/prod
```

## Support and Resources

### Getting Help
- **Documentation**: Check `/docs/` directory for detailed guides
- **Agent Help**: Use `/help` in Claude Code sessions
- **Issues**: Create GitHub issues for bugs or feature requests
- **Community**: Join our Discord/Slack for real-time support

### Useful Documentation
- [Agent System Guide](../development/agent-system.md) - Deep dive into agent coordination
- [Browser Extension Development](../extension/development.md) - Extension-specific guides
- [AI Integration](../development/ai-integration.md) - Working with AI services
- [Security Guide](../security/best-practices.md) - Security and compliance
- [Deployment Guide](../deployment/production.md) - Production deployment

### Performance Tips
- Use `bun` instead of `npm` for faster operations
- Enable Docker BuildKit for faster container builds
- Use the agent system for routine tasks
- Set up proper Git hooks for quality gates

---

**Congratulations!** 🎉 You now have a fully functional AI-powered browser extension development environment. The combination of modern tools, intelligent agents, and automation will significantly accelerate your development process.

**Next recommended action**: Try the [Agent System Guide](../development/agent-system.md) to understand how to leverage the multi-agent coordination system effectively.
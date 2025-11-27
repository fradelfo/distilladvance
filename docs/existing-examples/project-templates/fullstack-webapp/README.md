# Full-Stack Web Application Template

A comprehensive Claude Code setup template for full-stack web applications using modern frameworks and best practices.

## What's Included

### Project Structure
- **Frontend**: React/Next.js with TypeScript
- **Backend**: Node.js/Express API with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Jest, Cypress, Playwright
- **DevOps**: Docker, CI/CD workflows
- **Documentation**: Automated API docs, user guides

### Claude Code Configuration
- Optimized settings.json for web development
- Frontend and backend specialist agents
- Custom commands for common workflows
- Automated testing and deployment hooks
- MCP integration for database and GitHub

### Automation Features
- Code quality checks and linting
- Test generation and execution
- Database migration management
- API documentation generation
- Deployment automation

## Tech Stack

- **Frontend**: React 18+, Next.js 14+, TypeScript, Tailwind CSS
- **Backend**: Node.js 18+, Express, TypeScript, Prisma
- **Database**: PostgreSQL 15+, Redis (caching)
- **Testing**: Jest, React Testing Library, Cypress, Playwright
- **DevOps**: Docker, GitHub Actions, Vercel/Railway
- **Code Quality**: ESLint, Prettier, Husky, lint-staged

## Quick Setup

1. **Copy Template**
   ```bash
   cp -r templates/project-templates/fullstack-webapp/* your-project/
   cd your-project
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Setup Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize Database**
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   cd ..
   ```

5. **Start Claude Code**
   ```bash
   claude
   # Claude will automatically use the included configuration
   ```

## Directory Structure

```
your-project/
├── .claude/                    # Claude Code configuration
│   ├── settings.json          # Web development optimized settings
│   ├── agents/               # Specialized agents
│   │   ├── frontend-specialist.md
│   │   ├── backend-specialist.md
│   │   └── fullstack-coordinator.md
│   ├── commands/             # Custom commands
│   │   ├── create-api-endpoint.md
│   │   ├── create-react-component.md
│   │   ├── generate-tests.md
│   │   └── deploy-staging.md
│   └── hooks/               # Automation hooks
│       └── quality-check.sh
├── frontend/                 # React/Next.js frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── next.config.js
├── backend/                  # Express API backend
│   ├── src/
│   ├── prisma/
│   ├── tests/
│   └── package.json
├── docs/                     # Project documentation
├── tests/                    # E2E tests
├── .github/workflows/        # CI/CD workflows
├── docker-compose.yml        # Development environment
├── CLAUDE.md                 # Project constitution
└── README.md                 # Project overview
```

## Available Commands

### Development Commands
- `/create-api-endpoint <name>` - Generate new API endpoint with tests
- `/create-component <name>` - Create React component with TypeScript
- `/generate-tests <file>` - Generate comprehensive test suite
- `/update-docs` - Update API documentation

### Database Commands
- `/migration <description>` - Create database migration
- `/seed-db` - Populate database with test data
- `/reset-db` - Reset database to clean state

### Deployment Commands
- `/deploy-staging` - Deploy to staging environment
- `/deploy-prod` - Deploy to production (requires approval)
- `/rollback` - Rollback last deployment

## Specialized Agents

### Frontend Specialist
- React component development
- State management (Redux, Zustand)
- UI/UX optimization
- Performance tuning
- Accessibility compliance

### Backend Specialist
- API design and implementation
- Database schema design
- Authentication and authorization
- Performance optimization
- Security best practices

### Full-Stack Coordinator
- End-to-end feature development
- API-frontend integration
- Cross-cutting concerns
- Architecture decisions
- Code review coordination

## Automated Workflows

### Code Quality
- ESLint and Prettier formatting
- TypeScript type checking
- Unit and integration tests
- Security vulnerability scanning
- Performance analysis

### Testing
- Automated test generation
- Component testing with React Testing Library
- API endpoint testing with Jest
- E2E testing with Cypress/Playwright
- Visual regression testing

### Deployment
- Staging environment deployment
- Production deployment with approvals
- Database migration automation
- Health checks and monitoring
- Rollback capabilities

## Customization Guide

### 1. Modify Tech Stack
Edit `package.json` files and configuration to match your preferred stack:
- Switch from React to Vue/Angular
- Use different backend framework (Fastify, Koa, etc.)
- Change database (MySQL, MongoDB, etc.)
- Update testing frameworks

### 2. Adjust Agent Behavior
Modify agent prompts in `.claude/agents/` to match your:
- Coding standards and conventions
- Architectural patterns
- Team processes and workflows
- Domain-specific requirements

### 3. Custom Commands
Add new commands in `.claude/commands/` for your specific workflows:
- Code generation patterns
- Deployment processes
- Testing strategies
- Documentation updates

### 4. Environment Configuration
Update environment files and configuration:
- Development/staging/production settings
- API keys and credentials
- Feature flags and configurations
- Monitoring and logging setup

## Best Practices

### Development Workflow
1. Use feature branches for all development
2. Run tests before committing changes
3. Keep components small and focused
4. Follow REST API conventions
5. Implement proper error handling

### Claude Code Usage
1. Use specialized agents for focused tasks
2. Leverage custom commands for repetitive work
3. Review generated code for quality and security
4. Keep CLAUDE.md updated with project changes
5. Regularly update agent prompts based on learnings

### Team Collaboration
1. Shared settings.json for consistent permissions
2. Personal overrides in settings.local.json
3. Document custom workflows in README
4. Regular team reviews of automation effectiveness
5. Continuous improvement of templates and processes

## Troubleshooting

### Common Issues
- **Port conflicts**: Update ports in docker-compose.yml
- **Database connection**: Verify DATABASE_URL in .env
- **Permission errors**: Check Claude Code settings.json
- **Build failures**: Ensure all dependencies are installed

### Performance Optimization
- Enable React strict mode for development
- Use proper database indexing
- Implement caching strategies
- Optimize bundle size with code splitting
- Monitor and profile performance regularly

This template provides a solid foundation for full-stack web development with Claude Code, enabling rapid development while maintaining code quality and best practices.
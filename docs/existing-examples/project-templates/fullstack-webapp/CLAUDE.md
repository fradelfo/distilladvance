# Full-Stack Web Application

## Project Overview
Modern full-stack web application with React/Next.js frontend, Node.js/Express backend, and PostgreSQL database. Optimized for team collaboration with Claude Code automation.

## Tech Stack
- **Frontend**: React 18, Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js 18, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL 15, Redis (caching)
- **Testing**: Jest, React Testing Library, Cypress, Playwright
- **DevOps**: Docker, GitHub Actions, Vercel

## Project Structure
- `frontend/` - React/Next.js application with TypeScript
- `backend/` - Express API with Prisma ORM
- `docs/` - Project documentation and API specs
- `tests/` - End-to-end tests and shared utilities
- `.github/workflows/` - CI/CD automation

## Key Commands
- `npm run dev` - Start development servers (frontend + backend)
- `npm run build` - Build production applications
- `npm run test` - Run all tests (unit + integration + e2e)
- `npm run lint` - Lint and format code
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data

## Development Workflow
1. Create feature branch from main
2. Implement frontend and backend changes
3. Write tests for new functionality
4. Run quality checks and tests
5. Submit PR for review
6. Deploy to staging for validation
7. Merge and deploy to production

## Code Style
- Use TypeScript strict mode for all code
- Follow React functional component patterns with hooks
- Implement proper error boundaries and handling
- Use Prisma for all database operations
- Follow REST API conventions for backend endpoints
- Implement proper authentication and authorization

## Architecture Patterns
- **Frontend**: Component composition, custom hooks, context for state
- **Backend**: MVC pattern, middleware for cross-cutting concerns
- **Database**: Normalized schema with proper relationships
- **Testing**: Test pyramid with unit, integration, and E2E tests

## Security Guidelines
- Validate all user inputs on frontend and backend
- Use parameterized queries for database operations
- Implement proper CORS and CSP headers
- Follow OWASP security best practices
- Regular dependency updates and vulnerability scanning

## Performance Considerations
- Implement code splitting and lazy loading
- Use React.memo and useMemo for expensive operations
- Optimize database queries with proper indexing
- Implement caching strategies (Redis, React Query)
- Monitor performance with proper instrumentation

## Do Not
- Commit credentials or API keys
- Make direct database queries without Prisma
- Skip tests for new functionality
- Deploy without running full test suite
- Modify shared configuration without team approval
- Use any instead of proper TypeScript types

## Import References
See @frontend/package.json for frontend dependencies and scripts
See @backend/package.json for backend dependencies and scripts
See @docs/api.md for API endpoint documentation
See @.github/workflows/ for CI/CD configuration

This project emphasizes type safety, comprehensive testing, and automated quality assurance to enable fast, reliable development with Claude Code assistance.
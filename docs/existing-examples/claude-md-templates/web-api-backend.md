# [Project Name] - Web API Backend

A scalable REST API backend service built with modern web technologies, designed for high performance and maintainability.

## Project Overview

This project provides a robust backend API service with comprehensive features including authentication, data management, and business logic implementation. Built with industry best practices for security, scalability, and developer experience.

**Primary Goals:**
- Deliver reliable and performant API endpoints
- Ensure data security and user privacy
- Maintain clean, testable, and maintainable code
- Support horizontal scaling and high availability

## Tech Stack

### Backend Framework
- **Runtime**: Node.js 18+ / Python 3.11+ / Go 1.21+
- **Framework**: Express.js / FastAPI / Gin
- **Language**: TypeScript / Python / Go
- **API Style**: REST with OpenAPI/Swagger documentation

### Database & Storage
- **Primary Database**: PostgreSQL 15+ / MongoDB 6+
- **Cache Layer**: Redis 7+
- **File Storage**: AWS S3 / Google Cloud Storage
- **Database ORM**: Prisma / SQLAlchemy / GORM

### Authentication & Security
- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control (RBAC)
- **Security**: HTTPS, CORS, rate limiting, input validation
- **Secrets Management**: AWS Secrets Manager / HashiCorp Vault

### DevOps & Monitoring
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes / Docker Swarm
- **Monitoring**: Prometheus + Grafana
- **Logging**: Structured logging with correlation IDs
- **CI/CD**: GitHub Actions / GitLab CI

## Project Structure

```
├── src/
│   ├── controllers/       # API endpoint handlers
│   ├── middleware/        # Authentication, validation, logging
│   ├── models/           # Data models and schemas
│   ├── services/         # Business logic implementation
│   ├── repositories/     # Data access layer
│   ├── utils/            # Helper functions and utilities
│   └── routes/           # API route definitions
├── tests/
│   ├── unit/             # Unit tests for components
│   ├── integration/      # API integration tests
│   └── fixtures/         # Test data and mocks
├── docs/
│   ├── api/              # API documentation
│   └── deployment/       # Deployment guides
├── scripts/              # Build and deployment scripts
├── migrations/           # Database migration files
└── config/              # Environment configurations
```

## Development Guidelines

### API Design Principles
- **RESTful Design**: Follow REST conventions and HTTP status codes
- **Consistent Responses**: Standardized response format across all endpoints
- **Versioning**: API versioning strategy (URL path or headers)
- **Documentation**: Comprehensive OpenAPI/Swagger documentation
- **Error Handling**: Detailed error messages with proper HTTP status codes

### Code Quality Standards
- **Type Safety**: Full TypeScript/type annotations coverage
- **Testing**: Minimum 80% code coverage with unit and integration tests
- **Linting**: ESLint/Pylint/golangci-lint with strict rules
- **Code Reviews**: All code changes require peer review
- **Performance**: Sub-200ms response time for 95% of requests

### Security Requirements
- **Input Validation**: Validate and sanitize all user inputs
- **SQL Injection Prevention**: Use parameterized queries/ORM
- **XSS Protection**: Proper output encoding and CSP headers
- **Rate Limiting**: API rate limits based on user authentication
- **Audit Logging**: Log all significant operations with user context

### Database Guidelines
- **Schema Design**: Normalized schema with proper indexing
- **Migrations**: Version-controlled database migrations
- **Backup Strategy**: Automated daily backups with point-in-time recovery
- **Connection Pooling**: Optimized database connection management
- **Query Optimization**: Monitor and optimize slow queries

## Key Commands

### Development
- `npm run dev` / `python -m uvicorn main:app --reload` - Start development server
- `npm run build` / `python -m build` - Build production bundle
- `npm run test` / `pytest` - Run test suite
- `npm run test:watch` / `pytest --watch` - Run tests in watch mode
- `npm run lint` / `flake8 .` - Run code linting

### Database Operations
- `npm run db:migrate` / `alembic upgrade head` - Run database migrations
- `npm run db:seed` / `python seed.py` - Seed database with test data
- `npm run db:reset` / `alembic downgrade base` - Reset database
- `npm run db:generate` / `alembic revision --autogenerate` - Generate migration

### Deployment
- `docker-compose up` - Start local development environment
- `npm run deploy:staging` - Deploy to staging environment
- `npm run deploy:prod` - Deploy to production environment
- `kubectl apply -f k8s/` - Deploy to Kubernetes cluster

## API Endpoints Overview

### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access token
- `POST /auth/register` - User registration

### User Management
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update user profile
- `DELETE /users/account` - Delete user account
- `GET /users/{id}` - Get user by ID (admin only)

### Core Business Logic
- `GET /api/v1/resources` - List resources with pagination
- `POST /api/v1/resources` - Create new resource
- `GET /api/v1/resources/{id}` - Get specific resource
- `PUT /api/v1/resources/{id}` - Update resource
- `DELETE /api/v1/resources/{id}` - Delete resource

### System & Monitoring
- `GET /health` - Health check endpoint
- `GET /metrics` - Prometheus metrics
- `GET /api/docs` - API documentation (Swagger UI)

## Environment Configuration

### Required Environment Variables
```bash
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# External Services
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET=your-s3-bucket

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

## Testing Strategy

### Test Types and Coverage
- **Unit Tests**: Business logic, utilities, and service functions
- **Integration Tests**: API endpoints and database operations
- **Contract Tests**: API contract validation with consumers
- **Load Tests**: Performance and scalability validation
- **Security Tests**: Vulnerability scanning and penetration testing

### Test Data Management
- Use factories and fixtures for consistent test data
- Isolate tests with database transactions and rollbacks
- Mock external services and third-party APIs
- Maintain separate test database for integration tests

## Deployment & Operations

### Production Requirements
- **Scalability**: Support for horizontal scaling with load balancer
- **High Availability**: Multi-zone deployment with failover
- **Monitoring**: Comprehensive application and infrastructure monitoring
- **Backup & Recovery**: Automated backup with tested recovery procedures
- **Security**: Regular security updates and vulnerability assessments

### Performance Targets
- **Response Time**: 95th percentile under 200ms
- **Throughput**: Support 1000+ concurrent users
- **Uptime**: 99.9% availability target
- **Error Rate**: Less than 0.1% error rate in production

## Security Considerations

### Data Protection
- Encrypt sensitive data at rest and in transit
- Implement proper data retention and deletion policies
- Regular security audits and compliance checks
- GDPR/CCPA compliance for user data handling

### Access Control
- Principle of least privilege for all system access
- Regular access reviews and permission audits
- Secure API key and credential management
- Multi-factor authentication for administrative access

## Development Workflow

### Feature Development
1. Create feature branch from main
2. Implement feature with comprehensive tests
3. Update API documentation if needed
4. Submit pull request with detailed description
5. Code review and approval process
6. Automated testing and deployment

### Code Review Checklist
- [ ] Code follows established patterns and conventions
- [ ] Comprehensive test coverage for new functionality
- [ ] Security considerations addressed
- [ ] Performance impact assessed
- [ ] Documentation updated as needed
- [ ] Database changes include proper migrations

## Claude Code Integration Notes

When working with this API backend project, focus on:
- **Security First**: Always validate security implications of code changes
- **Performance**: Consider database query optimization and caching strategies
- **Testing**: Ensure comprehensive test coverage for all business logic
- **Documentation**: Keep API documentation current with code changes
- **Monitoring**: Include appropriate logging and metrics for operational visibility

For database operations, use read-only access when analyzing data and always use the ORM for data modifications to prevent SQL injection vulnerabilities.
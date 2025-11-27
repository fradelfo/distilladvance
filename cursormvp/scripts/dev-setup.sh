#!/bin/bash

# Development Environment Setup Script
# Comprehensive setup for browser extension + AI web application development

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Get OS type
get_os_type() {
    case "$(uname -s)" in
        Darwin*)    echo "macos";;
        Linux*)     echo "linux";;
        CYGWIN*|MINGW*|MSYS*) echo "windows";;
        *)          echo "unknown";;
    esac
}

# Check system requirements
check_system_requirements() {
    log_step "Checking system requirements..."

    local os_type
    os_type=$(get_os_type)
    log_info "Detected OS: $os_type"

    # Check Node.js version
    if command_exists node; then
        local node_version
        node_version=$(node --version | sed 's/v//')
        local required_node="18.0.0"

        if [ "$(printf '%s\n' "$required_node" "$node_version" | sort -V | head -n1)" = "$required_node" ]; then
            log_success "Node.js $node_version (>= $required_node required)"
        else
            log_error "Node.js $node_version found, but >= $required_node required"
            return 1
        fi
    else
        log_error "Node.js not found. Please install Node.js >= 18.0.0"
        return 1
    fi

    # Check Git
    if command_exists git; then
        local git_version
        git_version=$(git --version | awk '{print $3}')
        log_success "Git $git_version found"
    else
        log_error "Git not found. Please install Git"
        return 1
    fi

    # Check for recommended tools
    local recommended_tools=("curl" "unzip" "jq")
    for tool in "${recommended_tools[@]}"; do
        if command_exists "$tool"; then
            log_success "$tool found"
        else
            log_warning "$tool not found (recommended for full functionality)"
        fi
    done

    log_success "System requirements check completed"
}

# Install Bun package manager
install_bun() {
    log_step "Installing Bun package manager..."

    if command_exists bun; then
        local bun_version
        bun_version=$(bun --version)
        log_success "Bun $bun_version already installed"
        return 0
    fi

    log_info "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash

    # Add Bun to PATH for current session
    export PATH="$HOME/.bun/bin:$PATH"

    if command_exists bun; then
        local bun_version
        bun_version=$(bun --version)
        log_success "Bun $bun_version installed successfully"
    else
        log_error "Failed to install Bun"
        log_info "Please restart your terminal and run this script again"
        return 1
    fi
}

# Install project dependencies
install_dependencies() {
    log_step "Installing project dependencies..."

    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Are you in the project root directory?"
        return 1
    fi

    log_info "Installing main dependencies..."
    bun install

    # Install dependencies for sub-packages
    local packages_dir="app/packages"
    if [ -d "$packages_dir" ]; then
        for package_dir in "$packages_dir"/*; do
            if [ -d "$package_dir" ] && [ -f "$package_dir/package.json" ]; then
                local package_name
                package_name=$(basename "$package_dir")
                log_info "Installing dependencies for $package_name..."
                (cd "$package_dir" && bun install)
            fi
        done
    fi

    log_success "Dependencies installed successfully"
}

# Setup development database
setup_database() {
    log_step "Setting up development database..."

    # Check if PostgreSQL is running
    if command_exists pg_isready; then
        if pg_isready >/dev/null 2>&1; then
            log_success "PostgreSQL is running"
        else
            log_warning "PostgreSQL is not running"
            log_info "Please start PostgreSQL service"

            local os_type
            os_type=$(get_os_type)
            case "$os_type" in
                "macos")
                    log_info "Try: brew services start postgresql"
                    ;;
                "linux")
                    log_info "Try: sudo systemctl start postgresql"
                    ;;
                "windows")
                    log_info "Start PostgreSQL service from Services manager"
                    ;;
            esac
        fi
    else
        log_warning "PostgreSQL not found"
        log_info "Please install PostgreSQL for full development experience"
    fi

    # Setup development database if Prisma is available
    if [ -f "prisma/schema.prisma" ]; then
        log_info "Setting up Prisma database..."

        # Generate Prisma client
        bunx prisma generate

        # Create development database
        if [ -f ".env" ]; then
            bunx prisma db push
            log_success "Database schema synced"

            # Seed database if seeder exists
            if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
                log_info "Seeding development database..."
                bunx prisma db seed
                log_success "Database seeded"
            fi
        else
            log_warning "No .env file found. Database setup skipped."
            log_info "Please create .env file with DATABASE_URL"
        fi
    fi
}

# Setup Redis cache
setup_redis() {
    log_step "Setting up Redis cache..."

    # Check if Redis is running
    if command_exists redis-cli; then
        if redis-cli ping >/dev/null 2>&1; then
            log_success "Redis is running"
        else
            log_warning "Redis is not running"
            log_info "Please start Redis service"

            local os_type
            os_type=$(get_os_type)
            case "$os_type" in
                "macos")
                    log_info "Try: brew services start redis"
                    ;;
                "linux")
                    log_info "Try: sudo systemctl start redis"
                    ;;
                "windows")
                    log_info "Start Redis service or use Docker"
                    ;;
            esac
        fi
    else
        log_warning "Redis not found"
        log_info "Redis is optional but recommended for caching"
    fi
}

# Setup environment files
setup_environment_files() {
    log_step "Setting up environment configuration..."

    # Create .env file from template
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        log_info "Creating .env file from template..."
        cp .env.example .env
        log_success ".env file created"
        log_warning "Please edit .env file with your configuration"
    elif [ -f ".env" ]; then
        log_success ".env file already exists"
    else
        log_warning "No .env.example template found"
    fi

    # Create local environment files for packages
    local packages=("web-app" "api-server" "browser-extension")
    for package in "${packages[@]}"; do
        local package_dir="app/packages/$package"
        if [ -d "$package_dir" ]; then
            if [ ! -f "$package_dir/.env.local" ] && [ -f "$package_dir/.env.example" ]; then
                log_info "Creating .env.local for $package..."
                cp "$package_dir/.env.example" "$package_dir/.env.local"
            fi
        fi
    done

    # Create development environment variables
    cat > .env.development << 'EOF'
# Development Environment Configuration
NODE_ENV=development
DEBUG=distill:*

# API Configuration
API_URL=http://localhost:3001
WEB_URL=http://localhost:3000

# Development Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/distill_dev

# Redis Cache
REDIS_URL=redis://localhost:6379

# Development AI Keys (use test keys)
OPENAI_API_KEY=sk-test-key-for-development
ANTHROPIC_API_KEY=sk-ant-test-key-for-development

# Extension Development
EXTENSION_ENV=development
HOT_RELOAD=true

# Logging
LOG_LEVEL=debug
EOF

    log_success "Development environment files created"
}

# Setup Git hooks
setup_git_hooks() {
    log_step "Setting up Git hooks..."

    # Install Husky if available
    if [ -f "package.json" ] && grep -q "husky" package.json; then
        log_info "Setting up Husky Git hooks..."
        bunx husky install

        # Create pre-commit hook
        cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting and formatting
bun run lint-staged

# Run type checking
bun run type-check

# Run unit tests for changed files
bun run test:changed
EOF

        # Create pre-push hook
        cat > .husky/pre-push << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run security audit
bun audit

# Run comprehensive tests
bun run test:ci

# Validate builds
bun run build:validate
EOF

        chmod +x .husky/pre-commit .husky/pre-push
        log_success "Git hooks installed"
    else
        log_warning "Husky not found in package.json"
    fi

    # Setup Git configuration
    log_info "Configuring Git settings..."

    # Set up commit message template
    if [ ! -f ".gitmessage" ]; then
        cat > .gitmessage << 'EOF'
# <type>: <description>
#
# [optional body]
#
# [optional footer(s)]
#
# Types:
# feat: A new feature
# fix: A bug fix
# docs: Documentation only changes
# style: Changes that do not affect the meaning of the code
# refactor: A code change that neither fixes a bug nor adds a feature
# perf: A code change that improves performance
# test: Adding missing tests or correcting existing tests
# chore: Changes to the build process or auxiliary tools
#
# Examples:
# feat: add conversation distillation feature
# fix: resolve extension content script injection issue
# docs: update API documentation for v2 endpoints
EOF

        git config commit.template .gitmessage
        log_success "Git commit message template installed"
    fi

    # Configure Git aliases for development workflow
    git config alias.co checkout
    git config alias.br branch
    git config alias.ci commit
    git config alias.st status
    git config alias.unstage 'reset HEAD --'
    git config alias.last 'log -1 HEAD'
    git config alias.visual '!gitk'

    log_success "Git configuration completed"
}

# Setup development tools
setup_development_tools() {
    log_step "Setting up development tools..."

    # Setup VS Code settings if VS Code is detected
    if command_exists code; then
        log_info "Setting up VS Code configuration..."

        mkdir -p .vscode

        # Create VS Code settings
        cat > .vscode/settings.json << 'EOF'
{
  "typescript.preferences.useAliasesForRenames": false,
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.fixAll.biome": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true,
    "**/.next": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true,
    "**/.next": true,
    "**/playwright-report": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "extension.enableCodeGPT": false,
  "ai.development.safetyFirst": true
}
EOF

        # Create VS Code extensions recommendations
        cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "biomejs.biome",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode-remote.remote-containers",
    "github.copilot",
    "esbenp.prettier-vscode"
  ],
  "unwantedRecommendations": [
    "ms-vscode.vscode-eslint"
  ]
}
EOF

        # Create VS Code launch configuration
        cat > .vscode/launch.json << 'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Web App",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/app/packages/web-app/server.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "sourceMaps": true
    },
    {
      "name": "Debug API Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/app/packages/api-server/src/index.ts",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "sourceMaps": true
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vitest",
      "args": ["run", "--no-coverage"],
      "console": "integratedTerminal",
      "sourceMaps": true
    }
  ]
}
EOF

        log_success "VS Code configuration created"
    fi

    # Setup browser extension development tools
    log_info "Setting up browser extension development tools..."

    # Install web-ext for Firefox extension testing
    if ! bunx web-ext --version >/dev/null 2>&1; then
        log_info "Installing web-ext for Firefox extension development..."
        bun add -D web-ext
    fi

    # Create Chrome extension development profile
    mkdir -p .chrome-dev-profile
    echo "Chrome development profile directory created"

    log_success "Development tools setup completed"
}

# Setup Docker development environment
setup_docker_environment() {
    log_step "Setting up Docker development environment..."

    if command_exists docker; then
        log_success "Docker found"

        # Create development docker-compose file
        if [ ! -f "docker-compose.dev.yml" ]; then
            cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: distill_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    environment:
      MH_STORAGE: maildir

volumes:
  postgres_data:
  redis_data:
EOF
            log_success "Docker Compose development configuration created"
        fi

        # Create database initialization script
        mkdir -p scripts
        if [ ! -f "scripts/init-db.sql" ]; then
            cat > scripts/init-db.sql << 'EOF'
-- Development database initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create development user
CREATE USER distill_dev WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE distill_dev TO distill_dev;
EOF
        fi

        log_success "Docker development environment configured"
    else
        log_warning "Docker not found. Docker setup skipped."
        log_info "Install Docker for containerized development environment"
    fi
}

# Setup monitoring and debugging tools
setup_monitoring_tools() {
    log_step "Setting up monitoring and debugging tools..."

    # Create monitoring configuration
    mkdir -p monitoring

    # Setup development logging configuration
    cat > monitoring/logging.dev.json << 'EOF'
{
  "level": "debug",
  "transport": {
    "target": "pino-pretty",
    "options": {
      "colorize": true,
      "translateTime": "yyyy-mm-dd HH:MM:ss",
      "ignore": "pid,hostname"
    }
  },
  "formatters": {
    "level": "levelFirst"
  },
  "redact": {
    "paths": [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "apiKey",
      "password",
      "token"
    ],
    "censor": "[REDACTED]"
  }
}
EOF

    # Create performance monitoring configuration
    cat > monitoring/performance.dev.json << 'EOF'
{
  "enabled": true,
  "metrics": {
    "http": {
      "requests": true,
      "responseTime": true,
      "throughput": true
    },
    "system": {
      "cpu": true,
      "memory": true,
      "eventLoop": true
    },
    "custom": {
      "aiRequestLatency": true,
      "extensionEvents": true,
      "distillationPerformance": true
    }
  },
  "alerts": {
    "highLatency": 5000,
    "highMemoryUsage": 512,
    "errorRate": 0.05
  }
}
EOF

    log_success "Monitoring and debugging tools configured"
}

# Create development scripts
create_development_scripts() {
    log_step "Creating development scripts..."

    mkdir -p scripts/dev

    # Create development startup script
    cat > scripts/dev/start-all.sh << 'EOF'
#!/bin/bash
# Start all development services

set -e

echo "Starting development environment..."

# Start Docker services
if command -v docker-compose >/dev/null 2>&1; then
    echo "Starting Docker services..."
    docker-compose -f docker-compose.dev.yml up -d
fi

# Start API server
echo "Starting API server..."
cd app/packages/api-server
bun run dev &
API_PID=$!

# Start web application
echo "Starting web application..."
cd ../web-app
bun run dev &
WEB_PID=$!

# Start extension development
echo "Starting browser extension development..."
cd ../browser-extension
bun run dev &
EXT_PID=$!

echo "Development environment started!"
echo "API Server: http://localhost:3001"
echo "Web App: http://localhost:3000"
echo "Extension: Load dist/ directory in browser"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt signal
trap 'echo "Stopping services..."; kill $API_PID $WEB_PID $EXT_PID; exit 0' INT
wait
EOF

    # Create database reset script
    cat > scripts/dev/reset-db.sh << 'EOF'
#!/bin/bash
# Reset development database

set -e

echo "Resetting development database..."

# Stop API server if running
pkill -f "bun.*api.*dev" || true

# Reset Prisma database
bunx prisma db push --force-reset

# Seed database
if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
    bunx prisma db seed
fi

echo "Database reset complete!"
EOF

    # Create clean script
    cat > scripts/dev/clean.sh << 'EOF'
#!/bin/bash
# Clean development environment

set -e

echo "Cleaning development environment..."

# Stop all services
pkill -f "bun.*dev" || true

# Clean build artifacts
rm -rf dist/
rm -rf .next/
rm -rf coverage/
rm -rf node_modules/.cache/

# Clean package build artifacts
find app/packages -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find app/packages -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true

# Clean dependencies (optional)
if [ "$1" = "--deps" ]; then
    echo "Removing node_modules..."
    rm -rf node_modules/
    find app/packages -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
fi

echo "Development environment cleaned!"
EOF

    chmod +x scripts/dev/*.sh
    log_success "Development scripts created"
}

# Run development health check
run_health_check() {
    log_step "Running development environment health check..."

    local errors=0

    # Check Node.js
    if command_exists node; then
        log_success "✓ Node.js available"
    else
        log_error "✗ Node.js not available"
        ((errors++))
    fi

    # Check Bun
    if command_exists bun; then
        log_success "✓ Bun package manager available"
    else
        log_error "✗ Bun package manager not available"
        ((errors++))
    fi

    # Check Git
    if command_exists git; then
        log_success "✓ Git available"
    else
        log_error "✗ Git not available"
        ((errors++))
    fi

    # Check dependencies
    if [ -d "node_modules" ]; then
        log_success "✓ Dependencies installed"
    else
        log_warning "⚠ Dependencies not installed (run bun install)"
        ((errors++))
    fi

    # Check environment file
    if [ -f ".env" ]; then
        log_success "✓ Environment file exists"
    else
        log_warning "⚠ Environment file missing"
    fi

    # Check database connection
    if command_exists pg_isready && pg_isready >/dev/null 2>&1; then
        log_success "✓ PostgreSQL available"
    else
        log_warning "⚠ PostgreSQL not available or not running"
    fi

    # Check Redis connection
    if command_exists redis-cli && redis-cli ping >/dev/null 2>&1; then
        log_success "✓ Redis available"
    else
        log_warning "⚠ Redis not available or not running"
    fi

    # Summary
    if [ $errors -eq 0 ]; then
        log_success "Health check passed! Development environment is ready."
    else
        log_warning "Health check completed with $errors error(s)."
        log_info "Please resolve the issues above for optimal development experience."
    fi

    return $errors
}

# Main setup function
main() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║         Browser Extension + AI Web App Development Setup    ║"
    echo "║                                                              ║"
    echo "║   This script will set up your complete development         ║"
    echo "║   environment for the Distill project.                      ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # Parse command line arguments
    local skip_deps=false
    local skip_docker=false
    local quick_setup=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-deps)
                skip_deps=true
                shift
                ;;
            --skip-docker)
                skip_docker=true
                shift
                ;;
            --quick)
                quick_setup=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-deps    Skip dependency installation"
                echo "  --skip-docker  Skip Docker setup"
                echo "  --quick        Quick setup (minimal configuration)"
                echo "  --help, -h     Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Run setup steps
    check_system_requirements

    if ! $quick_setup; then
        install_bun
    fi

    if ! $skip_deps; then
        install_dependencies
    fi

    setup_environment_files

    if ! $quick_setup; then
        setup_git_hooks
        setup_development_tools

        if ! $skip_docker; then
            setup_docker_environment
        fi

        setup_monitoring_tools
        create_development_scripts
    fi

    setup_database
    setup_redis

    # Run health check
    echo ""
    run_health_check

    # Final instructions
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗"
    echo "║                    Setup Complete!                          ║"
    echo "╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    log_success "Development environment is ready!"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo "1. Review and update .env file with your configuration"
    echo "2. Start development servers: ${YELLOW}./scripts/dev/start-all.sh${NC}"
    echo "3. Open your browser and navigate to:"
    echo "   • Web App: ${BLUE}http://localhost:3000${NC}"
    echo "   • API Health: ${BLUE}http://localhost:3001/health${NC}"
    echo ""
    echo -e "${CYAN}Available commands:${NC}"
    echo "• ${YELLOW}bun run dev${NC} - Start all development servers"
    echo "• ${YELLOW}bun run test${NC} - Run tests"
    echo "• ${YELLOW}bun run lint${NC} - Run code linting"
    echo "• ${YELLOW}bun run ext:dev${NC} - Start extension development"
    echo ""
    echo -e "${CYAN}Documentation:${NC}"
    echo "• Project docs: ${BLUE}./docs/README.md${NC}"
    echo "• API docs: ${BLUE}http://localhost:3001/docs${NC}"
    echo "• Extension guide: ${BLUE}./docs/extension/development.md${NC}"
    echo ""
    echo -e "${GREEN}Happy coding! 🚀${NC}"
}

# Run main function with all arguments
main "$@"
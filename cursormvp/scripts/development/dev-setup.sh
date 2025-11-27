#!/usr/bin/env bash
# =============================================================================
# Distill Development Environment Setup
# =============================================================================
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
log() {
  echo -e "${BLUE}[distill]${NC} $1"
}

success() {
  echo -e "${GREEN}[distill]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[distill]${NC} $1"
}

error() {
  echo -e "${RED}[distill]${NC} $1"
  exit 1
}

# Check if command exists
check_command() {
  if ! command -v "$1" &> /dev/null; then
    error "$1 is not installed. Please install it first."
  fi
}

# Main setup function
main() {
  log "Starting Distill development environment setup..."
  echo ""

  # Check prerequisites
  log "Checking prerequisites..."
  check_command "node"
  check_command "bun"
  check_command "git"

  NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -lt 20 ]; then
    error "Node.js 20+ is required. Current version: $(node -v)"
  fi
  success "Prerequisites satisfied"
  echo ""

  # Install dependencies
  log "Installing dependencies..."
  bun install
  success "Dependencies installed"
  echo ""

  # Setup environment file
  if [ ! -f ".env" ]; then
    log "Creating .env file from template..."
    cp .env.example .env
    warn "Please update .env with your API keys and configuration"
  else
    log ".env file already exists, skipping..."
  fi
  echo ""

  # Setup git hooks
  log "Setting up git hooks..."
  if [ -d ".git" ]; then
    bun run prepare
    success "Git hooks configured"
  else
    warn "Not a git repository, skipping git hooks setup"
  fi
  echo ""

  # Build shared types
  log "Building shared types..."
  bun --cwd app/packages/shared-types run build || true
  success "Shared types built"
  echo ""

  # Check Docker for database services
  if command -v docker &> /dev/null; then
    log "Docker detected. You can start services with:"
    echo "  docker-compose up -d postgres redis chromadb"
    echo ""
  else
    warn "Docker not detected. You'll need to setup databases manually."
  fi

  # Print next steps
  echo ""
  success "Development environment setup complete!"
  echo ""
  echo "Next steps:"
  echo "  1. Update .env with your API keys (OpenAI, Anthropic)"
  echo "  2. Start database services:"
  echo "     docker-compose up -d postgres redis chromadb"
  echo "  3. Run database migrations:"
  echo "     bun run db:migrate"
  echo "  4. Start development servers:"
  echo "     bun run dev"
  echo ""
  echo "Available commands:"
  echo "  bun run ext:dev    - Start extension development"
  echo "  bun run web:dev    - Start web app development"
  echo "  bun run api:dev    - Start API server development"
  echo "  bun run test       - Run all tests"
  echo ""
}

main "$@"

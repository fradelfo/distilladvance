# Multi-stage Dockerfile for Express.js TypeScript Application
# Optimized for production with security, performance, and minimal image size

# === BUILD STAGE ===
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma/ ./prisma/

# Install all dependencies (including dev dependencies)
RUN npm ci --include=dev --frozen-lockfile

# Copy source code
COPY src/ ./src/

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript application
RUN npm run build

# Remove dev dependencies and install production only
RUN npm ci --omit=dev --frozen-lockfile && npm cache clean --force

# === PRODUCTION STAGE ===
FROM node:20-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S express -u 1001

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS="--max-old-space-size=512" \
    NPM_CONFIG_LOGLEVEL=warn

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy production dependencies from builder
COPY --from=builder --chown=express:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=express:nodejs /app/dist ./dist
COPY --from=builder --chown=express:nodejs /app/package*.json ./
COPY --from=builder --chown=express:nodejs /app/prisma ./prisma

# Create logs directory
RUN mkdir -p /app/logs && chown express:nodejs /app/logs

# Switch to non-root user
USER express

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Expose port
EXPOSE $PORT

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/server.js"]

# === DEVELOPMENT STAGE ===
FROM node:20-alpine AS development

# Install development dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    bash

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S express -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies
RUN npm ci --include=dev

# Copy source and config files
COPY --chown=express:nodejs . .

# Switch to app user
USER express

# Generate Prisma client
RUN npx prisma generate

# Expose port for development
EXPOSE 3000

# Development command with hot reload
CMD ["npm", "run", "dev"]

# === TESTING STAGE ===
FROM development AS testing

# Set test environment
ENV NODE_ENV=test

# Copy test files
COPY tests/ ./tests/

# Run tests
CMD ["npm", "run", "test:coverage"]

# === SECURITY SCANNER STAGE ===
FROM builder AS security

# Install security scanning tools
RUN npm install -g audit-ci

# Run security audit
RUN npm audit --audit-level moderate

# Scan for vulnerabilities
RUN audit-ci --moderate
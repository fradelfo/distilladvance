# DevOps & Deployment Patterns Skill

## Skill Overview
Advanced deployment patterns for browser extensions and AI-powered web applications, including multi-environment deployment, Chrome Web Store automation, containerization, monitoring, and cost optimization for production systems.

## Core Capabilities

### Browser Extension Deployment Pipeline

#### Chrome Web Store Automation
```typescript
// deployment/chrome-store-deployment.ts
interface ChromeStoreConfig {
  extensionId: string
  clientId: string
  clientSecret: string
  refreshToken: string
  publishTarget: 'default' | 'trustedTesters'
}

interface DeploymentManifest {
  version: string
  releaseNotes: string
  screenshots?: string[]
  promotion?: {
    from: 'draft' | 'development' | 'staging'
    to: 'staging' | 'production'
  }
}

interface DeploymentResult {
  success: boolean
  uploadId?: string
  publishStatus: 'pending' | 'inReview' | 'published' | 'rejected'
  errors?: string[]
  warnings?: string[]
  reviewNotes?: string
}

class ChromeStoreDeployer {
  private config: ChromeStoreConfig
  private httpClient: HttpClient

  constructor(config: ChromeStoreConfig) {
    this.config = config
    this.httpClient = new HttpClient()
  }

  async deployExtension(
    zipFilePath: string,
    manifest: DeploymentManifest
  ): Promise<DeploymentResult> {
    try {
      // Step 1: Get access token
      const accessToken = await this.getAccessToken()

      // Step 2: Upload extension package
      const uploadResult = await this.uploadPackage(zipFilePath, accessToken)
      if (!uploadResult.success) {
        throw new Error(`Upload failed: ${uploadResult.errors?.join(', ')}`)
      }

      // Step 3: Update store listing if needed
      if (manifest.releaseNotes || manifest.screenshots) {
        await this.updateStoreListing(manifest, accessToken)
      }

      // Step 4: Publish extension
      const publishResult = await this.publishExtension(
        manifest.publishTarget || 'default',
        accessToken
      )

      return {
        success: true,
        uploadId: uploadResult.uploadId,
        publishStatus: publishResult.status,
        warnings: publishResult.warnings
      }

    } catch (error) {
      return {
        success: false,
        publishStatus: 'pending',
        errors: [error instanceof Error ? error.message : 'Unknown deployment error']
      }
    }
  }

  private async getAccessToken(): Promise<string> {
    const tokenResponse = await this.httpClient.post('https://oauth2.googleapis.com/token', {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.config.refreshToken,
      grant_type: 'refresh_token'
    })

    if (!tokenResponse.access_token) {
      throw new Error('Failed to obtain access token')
    }

    return tokenResponse.access_token
  }

  private async uploadPackage(zipFilePath: string, accessToken: string): Promise<{
    success: boolean
    uploadId?: string
    errors?: string[]
  }> {
    const formData = new FormData()
    const zipBuffer = await this.readZipFile(zipFilePath)
    formData.append('package', new Blob([zipBuffer]), 'extension.zip')

    const response = await fetch(
      `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${this.config.extensionId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-goog-api-version': '2'
        },
        body: formData
      }
    )

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        errors: [result.error?.message || 'Upload failed']
      }
    }

    return {
      success: true,
      uploadId: result.uploadState || 'unknown'
    }
  }

  private async updateStoreListing(
    manifest: DeploymentManifest,
    accessToken: string
  ): Promise<void> {
    const listingData = {
      summary: manifest.releaseNotes,
      ...(manifest.screenshots && { screenshots: manifest.screenshots })
    }

    const response = await this.httpClient.put(
      `https://www.googleapis.com/chromewebstore/v1.1/items/${this.config.extensionId}`,
      listingData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to update store listing')
    }
  }

  private async publishExtension(
    publishTarget: string,
    accessToken: string
  ): Promise<{ status: string; warnings?: string[] }> {
    const response = await this.httpClient.post(
      `https://www.googleapis.com/chromewebstore/v1.1/items/${this.config.extensionId}/publish`,
      { publishTarget },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return {
      status: response.status || 'pending',
      warnings: response.warnings
    }
  }

  async checkPublishStatus(accessToken?: string): Promise<{
    status: 'draft' | 'pending' | 'inReview' | 'published' | 'rejected'
    lastStatusChange?: Date
    reviewDetails?: string
  }> {
    const token = accessToken || await this.getAccessToken()

    const response = await this.httpClient.get(
      `https://www.googleapis.com/chromewebstore/v1.1/items/${this.config.extensionId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    return {
      status: response.publishedStatus || 'draft',
      lastStatusChange: response.lastStatusChange ? new Date(response.lastStatusChange) : undefined,
      reviewDetails: response.reviewDetails
    }
  }

  private async readZipFile(filePath: string): Promise<ArrayBuffer> {
    // Implementation would read the zip file from filesystem
    // This is a placeholder for the actual file reading logic
    throw new Error('Not implemented - read zip file from filesystem')
  }
}

// Firefox Add-ons deployment
class FirefoxAddonDeployer {
  private config: {
    addonId: string
    jwtIssuer: string
    jwtSecret: string
  }

  constructor(config: any) {
    this.config = config
  }

  async deployAddon(
    xpiFilePath: string,
    metadata: {
      version: string
      releaseNotes: string
      channel: 'listed' | 'unlisted'
    }
  ): Promise<DeploymentResult> {
    try {
      // Step 1: Generate JWT token
      const jwtToken = this.generateJWT()

      // Step 2: Upload XPI file
      const uploadResult = await this.uploadXPI(xpiFilePath, jwtToken)

      // Step 3: Create version
      const versionResult = await this.createVersion(metadata, uploadResult.uuid, jwtToken)

      return {
        success: true,
        uploadId: uploadResult.uuid,
        publishStatus: versionResult.channel === 'listed' ? 'inReview' : 'published'
      }

    } catch (error) {
      return {
        success: false,
        publishStatus: 'pending',
        errors: [error instanceof Error ? error.message : 'Firefox deployment failed']
      }
    }
  }

  private generateJWT(): string {
    const jwt = require('jsonwebtoken')

    const payload = {
      iss: this.config.jwtIssuer,
      jti: Math.random().toString(36),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 5 // 5 minutes
    }

    return jwt.sign(payload, this.config.jwtSecret, { algorithm: 'HS256' })
  }

  private async uploadXPI(filePath: string, jwtToken: string): Promise<{ uuid: string }> {
    const formData = new FormData()
    const xpiBuffer = await this.readXPIFile(filePath)
    formData.append('upload', new Blob([xpiBuffer]), 'addon.xpi')

    const response = await fetch('https://addons.mozilla.org/api/v5/addons/upload/', {
      method: 'POST',
      headers: {
        'Authorization': `JWT ${jwtToken}`
      },
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`XPI upload failed: ${result.error || 'Unknown error'}`)
    }

    return { uuid: result.uuid }
  }

  private async createVersion(
    metadata: any,
    uploadUuid: string,
    jwtToken: string
  ): Promise<{ channel: string }> {
    const versionData = {
      upload: uploadUuid,
      release_notes: { 'en-US': metadata.releaseNotes },
      approval_notes: 'Automated deployment via CI/CD',
      source: null // No source code required for listed add-ons
    }

    const response = await fetch(
      `https://addons.mozilla.org/api/v5/addons/addon/${this.config.addonId}/versions/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `JWT ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(versionData)
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`Version creation failed: ${result.error || 'Unknown error'}`)
    }

    return { channel: metadata.channel }
  }

  private async readXPIFile(filePath: string): Promise<ArrayBuffer> {
    // Implementation would read the XPI file from filesystem
    throw new Error('Not implemented - read XPI file from filesystem')
  }
}
```

#### Deployment Pipeline Orchestration
```bash
# deployment/deploy-extension.sh
#!/bin/bash

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/dist"
DEPLOYMENT_CONFIG="$PROJECT_ROOT/.deployment/config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to validate environment
validate_environment() {
    log_info "Validating deployment environment..."

    # Check required tools
    local required_tools=("node" "npm" "zip" "jq" "curl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "Required tool '$tool' is not installed"
            exit 1
        fi
    done

    # Check required environment variables
    local required_vars=("CHROME_EXTENSION_ID" "CHROME_CLIENT_ID" "CHROME_CLIENT_SECRET" "CHROME_REFRESH_TOKEN")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Required environment variable '$var' is not set"
            exit 1
        fi
    done

    # Validate deployment configuration
    if [[ ! -f "$DEPLOYMENT_CONFIG" ]]; then
        log_error "Deployment configuration not found at $DEPLOYMENT_CONFIG"
        exit 1
    fi

    log_success "Environment validation complete"
}

# Function to build extension
build_extension() {
    local target_env="$1"

    log_info "Building extension for $target_env environment..."

    # Clean previous build
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"

    # Set environment variables for build
    export NODE_ENV="$target_env"
    export EXTENSION_ENV="$target_env"

    # Run build process
    cd "$PROJECT_ROOT"

    # Install dependencies if needed
    if [[ ! -d "node_modules" ]] || [[ "package.json" -nt "node_modules" ]]; then
        log_info "Installing dependencies..."
        npm ci --silent
    fi

    # Build extension
    log_info "Building extension..."
    npm run build:extension

    # Validate build output
    if [[ ! -f "$BUILD_DIR/manifest.json" ]]; then
        log_error "Build failed - manifest.json not found"
        exit 1
    fi

    log_success "Extension build complete"
}

# Function to run tests
run_tests() {
    log_info "Running tests..."

    cd "$PROJECT_ROOT"

    # Run unit tests
    npm run test:unit

    # Run extension-specific tests
    npm run test:extension

    # Run security validation
    npm run validate:security

    # Run extension linting
    npm run lint:extension

    log_success "All tests passed"
}

# Function to package extension
package_extension() {
    local version="$1"
    local target="$2"

    log_info "Packaging extension version $version for $target..."

    local package_name="extension-${target}-${version}.zip"
    local package_path="$BUILD_DIR/$package_name"

    # Create zip package
    cd "$BUILD_DIR"
    zip -r "$package_name" . -x "*.zip"

    # Validate package
    if [[ ! -f "$package_path" ]]; then
        log_error "Package creation failed"
        exit 1
    fi

    local package_size=$(wc -c < "$package_path")
    log_info "Package size: $(($package_size / 1024))KB"

    # Validate package size (Chrome Web Store limit: 128MB)
    if [[ $package_size -gt 134217728 ]]; then
        log_error "Package exceeds Chrome Web Store size limit (128MB)"
        exit 1
    fi

    echo "$package_path"
}

# Function to deploy to Chrome Web Store
deploy_to_chrome_store() {
    local package_path="$1"
    local version="$2"
    local release_notes="$3"

    log_info "Deploying to Chrome Web Store..."

    # Create deployment payload
    local temp_config=$(mktemp)
    cat > "$temp_config" << EOF
{
  "extensionId": "$CHROME_EXTENSION_ID",
  "clientId": "$CHROME_CLIENT_ID",
  "clientSecret": "$CHROME_CLIENT_SECRET",
  "refreshToken": "$CHROME_REFRESH_TOKEN",
  "packagePath": "$package_path",
  "version": "$version",
  "releaseNotes": "$release_notes"
}
EOF

    # Deploy using Node.js script
    node "$SCRIPT_DIR/chrome-store-deploy.js" "$temp_config"
    local deploy_result=$?

    # Cleanup
    rm -f "$temp_config"

    if [[ $deploy_result -eq 0 ]]; then
        log_success "Chrome Web Store deployment initiated"
    else
        log_error "Chrome Web Store deployment failed"
        return 1
    fi
}

# Function to deploy to Firefox Add-ons
deploy_to_firefox_addons() {
    local package_path="$1"
    local version="$2"
    local release_notes="$3"

    log_info "Deploying to Firefox Add-ons..."

    # Check if Firefox deployment is enabled
    if [[ -z "${FIREFOX_JWT_ISSUER:-}" ]] || [[ -z "${FIREFOX_JWT_SECRET:-}" ]]; then
        log_warning "Firefox deployment skipped - credentials not configured"
        return 0
    fi

    # Create Firefox package (rename .zip to .xpi)
    local firefox_package="${package_path%.zip}.xpi"
    cp "$package_path" "$firefox_package"

    # Create deployment payload
    local temp_config=$(mktemp)
    cat > "$temp_config" << EOF
{
  "addonId": "$FIREFOX_ADDON_ID",
  "jwtIssuer": "$FIREFOX_JWT_ISSUER",
  "jwtSecret": "$FIREFOX_JWT_SECRET",
  "packagePath": "$firefox_package",
  "version": "$version",
  "releaseNotes": "$release_notes"
}
EOF

    # Deploy using Node.js script
    node "$SCRIPT_DIR/firefox-addon-deploy.js" "$temp_config"
    local deploy_result=$?

    # Cleanup
    rm -f "$temp_config" "$firefox_package"

    if [[ $deploy_result -eq 0 ]]; then
        log_success "Firefox Add-ons deployment initiated"
    else
        log_error "Firefox Add-ons deployment failed"
        return 1
    fi
}

# Function to monitor deployment status
monitor_deployment() {
    local extension_id="$1"
    local max_attempts=30
    local attempt=1

    log_info "Monitoring deployment status..."

    while [[ $attempt -le $max_attempts ]]; do
        log_info "Checking deployment status (attempt $attempt/$max_attempts)..."

        # Check Chrome Web Store status
        local status=$(node "$SCRIPT_DIR/check-deployment-status.js" "$extension_id")

        case "$status" in
            "published")
                log_success "Extension published successfully!"
                return 0
                ;;
            "inReview")
                log_info "Extension is under review..."
                ;;
            "rejected")
                log_error "Extension was rejected during review"
                return 1
                ;;
            *)
                log_info "Current status: $status"
                ;;
        esac

        sleep 30
        ((attempt++))
    done

    log_warning "Deployment monitoring timeout - check manually"
    return 0
}

# Function to create deployment report
create_deployment_report() {
    local version="$1"
    local environment="$2"
    local status="$3"

    log_info "Creating deployment report..."

    local report_file="$PROJECT_ROOT/.deployment/reports/deployment-${version}-${environment}-$(date +%Y%m%d-%H%M%S).json"
    mkdir -p "$(dirname "$report_file")"

    cat > "$report_file" << EOF
{
  "version": "$version",
  "environment": "$environment",
  "status": "$status",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "buildInfo": {
    "nodeVersion": "$(node --version)",
    "npmVersion": "$(npm --version)",
    "gitCommit": "$(git rev-parse HEAD)",
    "gitBranch": "$(git rev-parse --abbrev-ref HEAD)"
  },
  "deploymentDuration": "$SECONDS seconds"
}
EOF

    log_success "Deployment report created: $report_file"
}

# Function to rollback deployment
rollback_deployment() {
    local version="$1"

    log_warning "Rolling back deployment..."

    # Implementation would depend on rollback strategy
    # For browser extensions, this might involve:
    # 1. Publishing a previous version
    # 2. Disabling the current version
    # 3. Notifying monitoring systems

    log_info "Rollback completed for version $version"
}

# Function to send notifications
send_deployment_notification() {
    local version="$1"
    local status="$2"
    local environment="$3"

    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local emoji
        local color

        case "$status" in
            "success")
                emoji=":white_check_mark:"
                color="good"
                ;;
            "failure")
                emoji=":x:"
                color="danger"
                ;;
            *)
                emoji=":warning:"
                color="warning"
                ;;
        esac

        local payload=$(cat << EOF
{
  "attachments": [
    {
      "color": "$color",
      "title": "Extension Deployment $status",
      "fields": [
        {
          "title": "Version",
          "value": "$version",
          "short": true
        },
        {
          "title": "Environment",
          "value": "$environment",
          "short": true
        },
        {
          "title": "Status",
          "value": "$emoji $status",
          "short": true
        }
      ]
    }
  ]
}
EOF
)

        curl -X POST -H 'Content-type: application/json' \
             --data "$payload" \
             "$SLACK_WEBHOOK_URL" > /dev/null 2>&1

        log_info "Deployment notification sent"
    fi
}

# Main deployment function
main() {
    local environment="${1:-staging}"
    local version="${2:-}"
    local release_notes="${3:-Auto-deployment}"

    log_info "Starting extension deployment to $environment"

    # Start timer
    SECONDS=0

    # Get version if not provided
    if [[ -z "$version" ]]; then
        version=$(jq -r '.version' "$PROJECT_ROOT/package.json")
    fi

    log_info "Deploying version $version to $environment"

    # Deployment steps
    validate_environment
    build_extension "$environment"
    run_tests

    local package_path
    package_path=$(package_extension "$version" "$environment")

    local deployment_status="success"

    # Deploy to stores based on environment
    case "$environment" in
        "staging")
            deploy_to_chrome_store "$package_path" "$version" "$release_notes" || deployment_status="failure"
            ;;
        "production")
            deploy_to_chrome_store "$package_path" "$version" "$release_notes" || deployment_status="failure"
            deploy_to_firefox_addons "$package_path" "$version" "$release_notes" || deployment_status="failure"
            ;;
        *)
            log_error "Unknown environment: $environment"
            exit 1
            ;;
    esac

    # Monitor deployment if successful
    if [[ "$deployment_status" == "success" ]]; then
        monitor_deployment "$CHROME_EXTENSION_ID"
    else
        log_error "Deployment failed - initiating rollback"
        rollback_deployment "$version"
    fi

    # Create report and send notifications
    create_deployment_report "$version" "$environment" "$deployment_status"
    send_deployment_notification "$version" "$deployment_status" "$environment"

    if [[ "$deployment_status" == "success" ]]; then
        log_success "Deployment completed successfully in ${SECONDS} seconds"
        exit 0
    else
        log_error "Deployment failed after ${SECONDS} seconds"
        exit 1
    fi
}

# Help function
show_help() {
    cat << EOF
Extension Deployment Script

Usage:
    $0 [ENVIRONMENT] [VERSION] [RELEASE_NOTES]

Arguments:
    ENVIRONMENT    Target environment (staging|production) [default: staging]
    VERSION        Extension version [default: from package.json]
    RELEASE_NOTES  Release notes [default: "Auto-deployment"]

Environment Variables:
    CHROME_EXTENSION_ID     Chrome Web Store extension ID
    CHROME_CLIENT_ID        Chrome Web Store OAuth client ID
    CHROME_CLIENT_SECRET    Chrome Web Store OAuth client secret
    CHROME_REFRESH_TOKEN    Chrome Web Store OAuth refresh token
    FIREFOX_ADDON_ID        Firefox Add-ons addon ID (optional)
    FIREFOX_JWT_ISSUER      Firefox Add-ons JWT issuer (optional)
    FIREFOX_JWT_SECRET      Firefox Add-ons JWT secret (optional)
    SLACK_WEBHOOK_URL       Slack webhook for notifications (optional)

Examples:
    $0 staging                                    # Deploy to staging
    $0 production 1.2.3 "Bug fixes and improvements"  # Deploy to production

Options:
    -h, --help    Show this help message

EOF
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
```

### Container Orchestration Patterns

#### Kubernetes Deployment Configuration
```yaml
# k8s/production/ai-webapp-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-webapp
  namespace: distill-production
  labels:
    app: ai-webapp
    version: "1.0"
    component: frontend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ai-webapp
  template:
    metadata:
      labels:
        app: ai-webapp
        version: "1.0"
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: ai-webapp
        image: distill/ai-webapp:latest
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secrets
              key: url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-api-secrets
              key: openai-key
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-api-secrets
              key: anthropic-key
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
          timeoutSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: tmp-volume
          mountPath: /tmp
        - name: cache-volume
          mountPath: /app/.cache
      volumes:
      - name: tmp-volume
        emptyDir: {}
      - name: cache-volume
        emptyDir: {}
      serviceAccountName: ai-webapp-service-account
      automountServiceAccountToken: false
---
apiVersion: v1
kind: Service
metadata:
  name: ai-webapp-service
  namespace: distill-production
  labels:
    app: ai-webapp
spec:
  selector:
    app: ai-webapp
  ports:
  - name: http
    port: 80
    targetPort: 3000
    protocol: TCP
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-webapp-ingress
  namespace: distill-production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  tls:
  - hosts:
    - api.distill.ai
    secretName: ai-webapp-tls
  rules:
  - host: api.distill.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ai-webapp-service
            port:
              number: 80
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-webapp-hpa
  namespace: distill-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-webapp
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 30
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Max
```

#### AI Services Deployment
```yaml
# k8s/production/ai-services-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-processing-service
  namespace: distill-production
  labels:
    app: ai-processing
    component: ai-backend
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ai-processing
  template:
    metadata:
      labels:
        app: ai-processing
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
    spec:
      containers:
      - name: ai-processing
        image: distill/ai-processing:latest
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: WORKER_CONCURRENCY
          value: "4"
        - name: QUEUE_NAME
          value: "ai-processing-queue"
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis-url
        - name: VECTOR_DB_URL
          valueFrom:
            secretKeyRef:
              name: vector-db-secrets
              key: url
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
            nvidia.com/gpu: "0"
          limits:
            memory: "4Gi"
            cpu: "2000m"
            nvidia.com/gpu: "1"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
      nodeSelector:
        node-type: "gpu-enabled"
      tolerations:
      - key: "nvidia.com/gpu"
        operator: "Exists"
        effect: "NoSchedule"
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: model-cache-warmup
  namespace: distill-production
spec:
  schedule: "0 2 * * *" # Run daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: cache-warmup
            image: distill/model-cache-warmup:latest
            env:
            - name: MODELS_TO_WARM
              value: "gpt-4,claude-3-sonnet,text-embedding-3-large"
            resources:
              requests:
                memory: "512Mi"
                cpu: "250m"
              limits:
                memory: "1Gi"
                cpu: "500m"
          restartPolicy: OnFailure
      backoffLimit: 3
```

### Monitoring and Observability

#### Production Monitoring Stack
```yaml
# k8s/monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 30s
      evaluation_interval: 30s

    rule_files:
      - "alert_rules.yml"

    alerting:
      alertmanagers:
        - static_configs:
            - targets:
              - alertmanager:9093

    scrape_configs:
      - job_name: 'ai-webapp'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - distill-production
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__

      - job_name: 'chrome-web-store-metrics'
        static_configs:
          - targets: ['chrome-store-exporter:8080']
        scrape_interval: 5m

      - job_name: 'ai-cost-monitoring'
        static_configs:
          - targets: ['ai-cost-exporter:8080']
        scrape_interval: 1m

  alert_rules.yml: |
    groups:
      - name: ai_webapp_alerts
        rules:
          - alert: HighErrorRate
            expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "High error rate detected"
              description: "Error rate is {{ $value }} errors per second"

          - alert: AIServiceDown
            expr: up{job="ai-processing"} == 0
            for: 2m
            labels:
              severity: critical
            annotations:
              summary: "AI processing service is down"

          - alert: HighAICosts
            expr: ai_daily_cost_usd > 500
            for: 0m
            labels:
              severity: warning
            annotations:
              summary: "Daily AI costs exceeding budget"
              description: "Daily AI costs are ${{ $value }}"

          - alert: ExtensionDeploymentFailure
            expr: extension_deployment_success == 0
            for: 0m
            labels:
              severity: critical
            annotations:
              summary: "Extension deployment failed"

          - alert: HighMemoryUsage
            expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "High memory usage detected"
```

#### Custom Metrics and Dashboards
```typescript
// monitoring/metrics-collector.ts
import { register, Counter, Histogram, Gauge } from 'prom-client'

class MetricsCollector {
  private extensionDownloads = new Counter({
    name: 'extension_downloads_total',
    help: 'Total number of extension downloads',
    labelNames: ['store', 'version']
  })

  private aiRequestDuration = new Histogram({
    name: 'ai_request_duration_seconds',
    help: 'Duration of AI API requests',
    labelNames: ['provider', 'model', 'operation']
  })

  private aiCostGauge = new Gauge({
    name: 'ai_daily_cost_usd',
    help: 'Daily AI usage cost in USD'
  })

  private conversationDistillations = new Counter({
    name: 'conversation_distillations_total',
    help: 'Total number of conversation distillations',
    labelNames: ['source_platform', 'distillation_mode']
  })

  private extensionActiveUsers = new Gauge({
    name: 'extension_active_users',
    help: 'Number of active extension users',
    labelNames: ['timeframe']
  })

  recordExtensionDownload(store: string, version: string): void {
    this.extensionDownloads.inc({ store, version })
  }

  recordAIRequest(provider: string, model: string, operation: string, duration: number): void {
    this.aiRequestDuration.observe({ provider, model, operation }, duration)
  }

  updateDailyCost(cost: number): void {
    this.aiCostGauge.set(cost)
  }

  recordDistillation(sourcePlatform: string, mode: string): void {
    this.conversationDistillations.inc({ source_platform: sourcePlatform, distillation_mode: mode })
  }

  updateActiveUsers(timeframe: string, count: number): void {
    this.extensionActiveUsers.set({ timeframe }, count)
  }

  getMetrics(): string {
    return register.metrics()
  }
}

export const metricsCollector = new MetricsCollector()
```

### Cost Optimization and Resource Management

#### Auto-scaling Configuration
```typescript
// deployment/auto-scaling-manager.ts
interface ScalingMetrics {
  cpuUtilization: number
  memoryUtilization: number
  requestRate: number
  queueDepth: number
  aiCostRate: number
}

interface ScalingDecision {
  action: 'scale_up' | 'scale_down' | 'maintain'
  targetReplicas: number
  reason: string
  urgency: 'low' | 'medium' | 'high'
}

class AutoScalingManager {
  private currentReplicas = 3
  private minReplicas = 2
  private maxReplicas = 10

  async makeScalingDecision(metrics: ScalingMetrics): Promise<ScalingDecision> {
    // AI cost-aware scaling logic
    if (metrics.aiCostRate > 50) { // $50/hour threshold
      return {
        action: 'scale_down',
        targetReplicas: Math.max(this.currentReplicas - 1, this.minReplicas),
        reason: 'High AI cost rate detected',
        urgency: 'high'
      }
    }

    // High load scaling
    if (metrics.cpuUtilization > 80 || metrics.requestRate > 1000) {
      const targetReplicas = Math.min(
        Math.ceil(this.currentReplicas * 1.5),
        this.maxReplicas
      )

      return {
        action: 'scale_up',
        targetReplicas,
        reason: 'High resource utilization or request rate',
        urgency: 'medium'
      }
    }

    // Queue depth scaling
    if (metrics.queueDepth > 100) {
      return {
        action: 'scale_up',
        targetReplicas: Math.min(this.currentReplicas + 2, this.maxReplicas),
        reason: 'High queue depth',
        urgency: 'high'
      }
    }

    // Scale down during low usage
    if (metrics.cpuUtilization < 30 && metrics.requestRate < 100) {
      return {
        action: 'scale_down',
        targetReplicas: Math.max(this.currentReplicas - 1, this.minReplicas),
        reason: 'Low resource utilization',
        urgency: 'low'
      }
    }

    return {
      action: 'maintain',
      targetReplicas: this.currentReplicas,
      reason: 'Metrics within normal ranges',
      urgency: 'low'
    }
  }
}
```

This comprehensive DevOps and deployment patterns skill provides production-ready solutions for browser extension deployment, container orchestration, monitoring, and cost optimization essential for scaling AI-powered applications.
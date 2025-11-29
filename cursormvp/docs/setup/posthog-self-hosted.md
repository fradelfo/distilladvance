# PostHog Self-Hosted Production Setup

This guide covers deploying PostHog self-hosted for production analytics in Distill.

## Overview

PostHog provides product analytics, session recording, and feature flags. Self-hosted deployment offers:

- Full data ownership and privacy compliance
- No vendor data retention limits
- Cost efficiency at scale
- Custom data retention policies

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Browser Client  │────▶│   PostHog       │────▶│  ClickHouse     │
│ (posthog-js)    │     │   Server        │     │  (Analytics DB) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               │
┌─────────────────┐            │
│ API Server      │────────────┘
│ (posthog-node)  │
└─────────────────┘
```

## Prerequisites

- Kubernetes cluster (EKS, GKE, or self-managed)
- PostgreSQL 13+ (RDS or self-hosted)
- Redis 6+
- Object storage (S3, GCS, or MinIO)
- SSL certificates
- Domain name (e.g., analytics.distill.app)

### Resource Requirements

**Minimum (up to 10K monthly events):**
- 4 vCPUs
- 8GB RAM
- 50GB SSD

**Recommended (10K-1M monthly events):**
- 8 vCPUs
- 16GB RAM
- 200GB SSD

**Enterprise (1M+ monthly events):**
- 16+ vCPUs
- 32GB+ RAM
- ClickHouse cluster
- Redis cluster

## Installation Options

### Option 1: Docker Compose (Development/Staging)

```yaml
# docker-compose.posthog.yml
version: "3.8"

services:
  posthog:
    image: posthog/posthog:release-1.43
    container_name: posthog
    restart: unless-stopped
    ports:
      - "8080:8000"
    environment:
      DATABASE_URL: postgres://posthog:posthog@postgres:5432/posthog
      REDIS_URL: redis://redis:6379
      SECRET_KEY: ${POSTHOG_SECRET_KEY}
      SITE_URL: ${POSTHOG_SITE_URL}
      IS_BEHIND_PROXY: "true"
      DISABLE_SECURE_SSL_REDIRECT: "false"
      ASYNC_EVENT_PROPERTY_USAGE: "true"
    depends_on:
      - postgres
      - redis
      - clickhouse

  postgres:
    image: postgres:14-alpine
    container_name: posthog-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: posthog
      POSTGRES_USER: posthog
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - posthog-postgres:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: posthog-redis
    restart: unless-stopped
    volumes:
      - posthog-redis:/data

  clickhouse:
    image: clickhouse/clickhouse-server:23.6
    container_name: posthog-clickhouse
    restart: unless-stopped
    volumes:
      - posthog-clickhouse:/var/lib/clickhouse
    ulimits:
      nofile:
        soft: 262144
        hard: 262144

volumes:
  posthog-postgres:
  posthog-redis:
  posthog-clickhouse:
```

### Option 2: Helm Chart (Production)

```bash
# Add PostHog Helm repository
helm repo add posthog https://posthog.github.io/charts-clickhouse/
helm repo update

# Create namespace
kubectl create namespace posthog

# Create secrets
kubectl create secret generic posthog-secrets \
  --namespace posthog \
  --from-literal=POSTHOG_SECRET_KEY=$(openssl rand -hex 32) \
  --from-literal=POSTHOG_PERSONAL_API_KEY=phx_your_key

# Install PostHog
helm install posthog posthog/posthog \
  --namespace posthog \
  --values posthog-values.yaml
```

**posthog-values.yaml:**

```yaml
cloud: aws  # or gcp, azure

ingress:
  enabled: true
  hostname: analytics.distill.app
  tls:
    enabled: true
    secretName: posthog-tls

postgresql:
  enabled: false  # Use external PostgreSQL
  externalPostgresql:
    host: your-rds-endpoint.amazonaws.com
    port: 5432
    database: posthog
    username: posthog
    existingSecret: posthog-db-secret
    existingSecretPasswordKey: password

redis:
  enabled: true
  architecture: standalone

clickhouse:
  enabled: true
  persistence:
    size: 200Gi
    storageClass: gp3
  resources:
    requests:
      cpu: 2
      memory: 8Gi
    limits:
      cpu: 4
      memory: 16Gi

web:
  replicaCount: 2
  resources:
    requests:
      cpu: 500m
      memory: 1Gi

worker:
  replicaCount: 2
  resources:
    requests:
      cpu: 500m
      memory: 1Gi

plugins:
  enabled: true
  replicaCount: 1

env:
  - name: SITE_URL
    value: https://analytics.distill.app
  - name: IS_BEHIND_PROXY
    value: "true"
  - name: TRUST_ALL_PROXIES
    value: "false"
```

## Environment Configuration

### API Server (.env)

```bash
# PostHog Configuration
POSTHOG_API_KEY=phc_your_project_api_key
POSTHOG_HOST=https://analytics.distill.app
ANALYTICS_ENABLED=true

# Personal API Key (for admin operations)
POSTHOG_PERSONAL_API_KEY=phx_your_personal_api_key
```

### Web App (.env.local)

```bash
# PostHog Browser Client
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://analytics.distill.app
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

## Security Configuration

### Network Security

```yaml
# Network policy for PostHog namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: posthog-network-policy
  namespace: posthog
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: distill-api
      ports:
        - protocol: TCP
          port: 8000
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: posthog
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
      ports:
        - protocol: TCP
          port: 443
```

### SSL/TLS Configuration

```yaml
# Certificate (using cert-manager)
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: posthog-tls
  namespace: posthog
spec:
  secretName: posthog-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - analytics.distill.app
```

### CORS Configuration

PostHog needs to accept requests from your web app domain:

```python
# In PostHog settings
CORS_ALLOWED_ORIGINS = [
    "https://app.distill.app",
    "https://distill.app",
    "chrome-extension://*",  # Browser extension
]
```

## Data Retention

Configure data retention policies based on your needs:

```sql
-- In PostHog ClickHouse (via PostHog admin)
-- Set event retention to 365 days
ALTER TABLE events
MODIFY TTL timestamp + INTERVAL 365 DAY;

-- Set session recording retention to 30 days
ALTER TABLE session_recording_events
MODIFY TTL timestamp + INTERVAL 30 DAY;
```

## Monitoring

### Health Checks

```yaml
# Kubernetes liveness probe
livenessProbe:
  httpGet:
    path: /_health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

# Kubernetes readiness probe
readinessProbe:
  httpGet:
    path: /_ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Prometheus Metrics

PostHog exports Prometheus metrics on `/metrics`:

```yaml
# ServiceMonitor for Prometheus Operator
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: posthog
  namespace: posthog
spec:
  selector:
    matchLabels:
      app: posthog
  endpoints:
    - port: http
      path: /metrics
      interval: 30s
```

### Key Metrics to Monitor

- `posthog_events_ingested_total` - Total events captured
- `posthog_events_processing_queue_size` - Event processing backlog
- `posthog_clickhouse_query_duration_seconds` - Query performance
- `posthog_api_response_time_seconds` - API latency

## Backup & Recovery

### Database Backups

```bash
# PostgreSQL backup script
#!/bin/bash
pg_dump -h $POSTGRES_HOST -U posthog posthog | \
  gzip > backups/posthog_$(date +%Y%m%d_%H%M%S).sql.gz

# Upload to S3
aws s3 cp backups/posthog_*.sql.gz s3://distill-backups/posthog/
```

### ClickHouse Backups

```sql
-- Create backup
BACKUP DATABASE posthog TO Disk('backups', 'posthog_backup');

-- Restore from backup
RESTORE DATABASE posthog FROM Disk('backups', 'posthog_backup');
```

## Scaling Guidelines

### Horizontal Scaling

| Monthly Events | Web Replicas | Worker Replicas | ClickHouse |
|---------------|--------------|-----------------|------------|
| < 100K        | 2            | 2               | 1 node     |
| 100K - 1M     | 3            | 4               | 1 node     |
| 1M - 10M      | 5            | 8               | 3 nodes    |
| > 10M         | 10+          | 16+             | Cluster    |

### Auto-scaling Configuration

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: posthog-web
  namespace: posthog
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: posthog-web
  minReplicas: 2
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
```

## Troubleshooting

### Common Issues

**Events not appearing:**
1. Check API key is correct
2. Verify CORS settings allow your domain
3. Check browser console for errors
4. Verify PostHog is accessible from your app

**High latency:**
1. Check ClickHouse query performance
2. Verify sufficient resources allocated
3. Consider enabling async ingestion
4. Check network connectivity

**Session recording not working:**
1. Verify session recording is enabled in project settings
2. Check domain is whitelisted
3. Verify SSL certificate is valid

### Debug Mode

Enable debug logging:

```bash
# In PostHog container
export POSTHOG_DEBUG=true
export DJANGO_LOG_LEVEL=DEBUG
```

### Logs

```bash
# View web server logs
kubectl logs -n posthog -l app=posthog-web -f

# View worker logs
kubectl logs -n posthog -l app=posthog-worker -f

# View ClickHouse logs
kubectl logs -n posthog -l app=clickhouse -f
```

## Migration from PostHog Cloud

If migrating from PostHog Cloud:

1. Export data using PostHog's export API
2. Set up self-hosted instance
3. Import historical data
4. Update client API keys
5. Verify data flow
6. Decommission cloud instance

## Feature Flags Setup

Configure feature flags for gradual rollouts:

```typescript
// In your API or web app
import { isFeatureEnabled, getFeatureFlag } from './lib/analytics';

// Check boolean flag
if (isFeatureEnabled('new-coach-feature')) {
  // Show new feature
}

// Get multivariate flag
const variant = getFeatureFlag('onboarding-experiment');
if (variant === 'variant-a') {
  // Show variant A
}
```

## Cost Estimation

Self-hosted costs (approximate):

| Component         | Small    | Medium   | Large    |
|-------------------|----------|----------|----------|
| Kubernetes        | $200/mo  | $500/mo  | $1500/mo |
| PostgreSQL (RDS)  | $50/mo   | $200/mo  | $500/mo  |
| ClickHouse        | $100/mo  | $400/mo  | $1200/mo |
| Storage           | $20/mo   | $100/mo  | $500/mo  |
| **Total**         | ~$370/mo | ~$1200/mo| ~$3700/mo|

Compare to PostHog Cloud pricing for your event volume to determine the best option.

## References

- [PostHog Self-Hosting Docs](https://posthog.com/docs/self-host)
- [PostHog Helm Charts](https://github.com/PostHog/charts-clickhouse)
- [ClickHouse Operations](https://clickhouse.com/docs/en/operations/)
- [PostHog API Reference](https://posthog.com/docs/api)

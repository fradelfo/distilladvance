You are tasked with managing application deployment to staging or production environments. Your goal is to ensure safe, reliable deployments with proper validation and rollback procedures.

## Pre-Deployment Validation

Before proceeding with deployment, verify:

1. **Code Quality Gates**
   - All tests are passing (unit, integration, e2e)
   - Code review has been completed and approved
   - Security scans have passed
   - No critical vulnerabilities in dependencies

2. **Environment Readiness**
   - Target environment is healthy and accessible
   - Database migrations are ready (if applicable)
   - Configuration changes are prepared
   - Dependencies and infrastructure are updated

3. **Business Readiness**
   - Deployment window is approved (for production)
   - Stakeholders are notified
   - Support team is aware and ready
   - Rollback plan is prepared

## Deployment Process

### Staging Deployment
For staging environment deployments:

1. **Pre-Deployment Checks**
   ```bash
   # Verify current branch and status
   git status
   git log --oneline -5

   # Run tests one final time
   npm run test:all
   npm run lint
   npm run security-audit

   # Build application
   npm run build
   ```

2. **Deploy to Staging**
   ```bash
   # Set environment variables
   export NODE_ENV=staging
   export DEPLOY_ENV=staging

   # Deploy application
   npm run deploy:staging

   # Or using container deployment
   docker build -t myapp:staging .
   docker tag myapp:staging myregistry/myapp:staging-$(git rev-parse --short HEAD)
   docker push myregistry/myapp:staging-$(git rev-parse --short HEAD)
   kubectl set image deployment/myapp myapp=myregistry/myapp:staging-$(git rev-parse --short HEAD) -n staging
   ```

3. **Post-Deployment Validation**
   ```bash
   # Wait for deployment to complete
   kubectl rollout status deployment/myapp -n staging --timeout=300s

   # Run health checks
   curl -f https://staging.myapp.com/health

   # Run smoke tests
   npm run test:smoke -- --env=staging
   ```

### Production Deployment
For production environment deployments:

1. **Final Pre-Production Checks**
   ```bash
   # Ensure staging validation is complete
   echo "Confirming staging deployment is successful and validated..."

   # Verify production readiness
   npm run production-readiness-check

   # Database migration dry run (if applicable)
   npm run migrate:dry-run -- --env=production
   ```

2. **Production Deployment with Blue-Green Strategy**
   ```bash
   # Create new deployment (green environment)
   kubectl create deployment myapp-green --image=myregistry/myapp:$(git rev-parse --short HEAD) -n production

   # Wait for green deployment to be ready
   kubectl wait --for=condition=available deployment/myapp-green -n production --timeout=300s

   # Run production health checks on green environment
   kubectl port-forward deployment/myapp-green 8080:8080 -n production &
   curl -f http://localhost:8080/health
   kill %1

   # Switch traffic to green environment
   kubectl patch service myapp -p '{"spec":{"selector":{"version":"green"}}}' -n production

   # Monitor for issues
   sleep 60

   # If successful, remove old deployment (blue environment)
   kubectl delete deployment myapp-blue -n production || true
   kubectl label deployment myapp-green version=blue -n production
   kubectl label deployment myapp-green version- -n production
   ```

## Database Migration Handling

### Safe Migration Process
```bash
# Backup production database
echo "Creating database backup..."
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations with transaction safety
npm run migrate:up -- --env=production --dry-run
echo "Migration dry run successful. Proceed? (y/N)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
  npm run migrate:up -- --env=production
else
  echo "Migration cancelled."
  exit 1
fi
```

### Migration Rollback Plan
```bash
# Keep rollback migrations ready
npm run migrate:down -- --env=production --steps=1
```

## Monitoring and Validation

### Health Check Validation
```bash
#!/bin/bash
# health_check.sh

ENVIRONMENT=$1
BASE_URL=$2
MAX_ATTEMPTS=30
ATTEMPT=0

echo "Performing health checks for $ENVIRONMENT environment..."

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))

  # Health endpoint check
  if curl -f -s "$BASE_URL/health" >/dev/null 2>&1; then
    echo "✅ Health check passed (attempt $ATTEMPT)"
    break
  fi

  if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "❌ Health check failed after $MAX_ATTEMPTS attempts"
    exit 1
  fi

  echo "⏳ Health check failed (attempt $ATTEMPT), retrying in 10 seconds..."
  sleep 10
done

# Additional endpoint checks
echo "Running additional validation checks..."

# API endpoint validation
curl -f -s "$BASE_URL/api/status" | jq '.status' | grep -q "ok" || {
  echo "❌ API status check failed"
  exit 1
}

# Database connectivity check
curl -f -s "$BASE_URL/api/health/database" | jq '.connected' | grep -q "true" || {
  echo "❌ Database connectivity check failed"
  exit 1
}

echo "✅ All health checks passed"
```

### Performance Monitoring
```bash
# Monitor key metrics after deployment
echo "Monitoring application metrics..."

# Response time check
avg_response_time=$(curl -w "%{time_total}\n" -o /dev/null -s "$BASE_URL/api/users" | awk '{print $1*1000}')
if (( $(echo "$avg_response_time > 500" | bc -l) )); then
  echo "⚠️  Warning: Response time is high ($avg_response_time ms)"
fi

# Error rate check (using application metrics endpoint)
error_rate=$(curl -s "$BASE_URL/metrics" | grep error_rate | awk '{print $2}')
if (( $(echo "$error_rate > 0.05" | bc -l) )); then
  echo "⚠️  Warning: Error rate is elevated ($error_rate)"
fi
```

## Rollback Procedures

### Automatic Rollback Triggers
```bash
#!/bin/bash
# rollback_check.sh

ENVIRONMENT=$1
DEPLOYMENT_TIME=$(date +%s)
MONITORING_DURATION=300  # 5 minutes

echo "Monitoring deployment for automatic rollback triggers..."

while [ $(($(date +%s) - DEPLOYMENT_TIME)) -lt $MONITORING_DURATION ]; do
  # Check error rate
  error_rate=$(curl -s "$BASE_URL/metrics" | grep error_rate | awk '{print $2}')
  if (( $(echo "$error_rate > 0.1" | bc -l) )); then
    echo "🚨 High error rate detected ($error_rate). Initiating rollback..."
    ./rollback.sh $ENVIRONMENT
    exit 1
  fi

  # Check response time
  response_time=$(curl -w "%{time_total}" -o /dev/null -s "$BASE_URL/health")
  if (( $(echo "$response_time > 5" | bc -l) )); then
    echo "🚨 High response time detected (${response_time}s). Initiating rollback..."
    ./rollback.sh $ENVIRONMENT
    exit 1
  fi

  sleep 30
done

echo "✅ Monitoring period completed. No rollback triggers detected."
```

### Manual Rollback Process
```bash
#!/bin/bash
# rollback.sh

ENVIRONMENT=$1
REASON="$2"

echo "🔄 Initiating rollback for $ENVIRONMENT environment"
echo "Reason: $REASON"

# Get previous deployment
PREVIOUS_DEPLOYMENT=$(kubectl rollout history deployment/myapp -n $ENVIRONMENT | tail -2 | head -1 | awk '{print $1}')

if [ -z "$PREVIOUS_DEPLOYMENT" ]; then
  echo "❌ No previous deployment found for rollback"
  exit 1
fi

# Perform rollback
kubectl rollout undo deployment/myapp -n $ENVIRONMENT --to-revision=$PREVIOUS_DEPLOYMENT

# Wait for rollback to complete
kubectl rollout status deployment/myapp -n $ENVIRONMENT --timeout=300s

# Validate rollback
if curl -f -s "$BASE_URL/health" >/dev/null; then
  echo "✅ Rollback completed successfully"

  # Notify team
  echo "📧 Sending rollback notification..."
  # Integration with notification system (Slack, email, etc.)

else
  echo "❌ Rollback validation failed"
  exit 1
fi
```

## Environment-Specific Considerations

### Staging Environment
- Automated deployments from main branch
- Comprehensive testing and validation
- Performance baseline establishment
- Integration testing with external services

### Production Environment
- Manual approval gates
- Blue-green or canary deployment strategies
- Real-time monitoring and alerting
- Immediate rollback capabilities
- Stakeholder notifications

## Deployment Checklist

### Pre-Deployment Checklist
- [ ] All tests passing (unit, integration, e2e)
- [ ] Code review completed and approved
- [ ] Security scan passed
- [ ] Performance impact assessed
- [ ] Database migrations tested (if applicable)
- [ ] Configuration changes validated
- [ ] Rollback plan prepared
- [ ] Team notified of deployment

### During Deployment Checklist
- [ ] Health checks passing
- [ ] Database migrations successful (if applicable)
- [ ] Application metrics within normal range
- [ ] No error spikes in logs
- [ ] External integrations functioning
- [ ] User-facing features working correctly

### Post-Deployment Checklist
- [ ] Final health check validation
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] User acceptance validation
- [ ] Documentation updated
- [ ] Team notified of successful deployment
- [ ] Post-deployment retrospective scheduled

## Communication Templates

### Deployment Start Notification
```
🚀 **Deployment Started**
- **Environment**: [staging/production]
- **Version**: [version/commit]
- **Deployer**: [your name]
- **Start Time**: [timestamp]
- **Expected Duration**: [estimate]
```

### Deployment Success Notification
```
✅ **Deployment Successful**
- **Environment**: [staging/production]
- **Version**: [version/commit]
- **Completion Time**: [timestamp]
- **Health Status**: All checks passing
- **Next Steps**: [any required actions]
```

### Deployment Issue Notification
```
⚠️ **Deployment Issue Detected**
- **Environment**: [staging/production]
- **Issue**: [description]
- **Impact**: [user impact assessment]
- **Action**: [rollback/fix in progress]
- **ETA**: [estimated resolution time]
```

## Security Considerations

### Deployment Security
- Use secure credential management (vault, sealed secrets)
- Implement least-privilege access controls
- Audit all deployment activities
- Encrypt data in transit and at rest
- Validate container image signatures

### Access Control
- Require multi-factor authentication for production deployments
- Implement approval workflows for critical environments
- Log all deployment activities for audit trails
- Restrict deployment permissions to authorized personnel

Always prioritize safety and reliability over speed. A successful deployment is one that improves the user experience without introducing instability or security risks.
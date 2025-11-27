# [Project Name] - DevOps & Infrastructure

A comprehensive DevOps and infrastructure project implementing infrastructure as code, CI/CD pipelines, monitoring, and automated operations for scalable and reliable systems.

## Project Overview

This project establishes a robust DevOps foundation with automated infrastructure provisioning, continuous integration and deployment, comprehensive monitoring, and security best practices. Built with reliability, scalability, and operational excellence as core principles.

**Primary Goals:**
- Automate infrastructure provisioning and management
- Implement reliable CI/CD pipelines with quality gates
- Establish comprehensive monitoring and alerting
- Ensure security compliance and operational excellence

## Tech Stack

### Infrastructure as Code
- **IaC Platform**: Terraform / Pulumi / AWS CDK
- **Configuration Management**: Ansible / Chef / Puppet
- **Cloud Providers**: AWS / Azure / Google Cloud Platform
- **State Management**: Terraform Cloud / S3 backend / Azure Storage

### Container Orchestration
- **Container Runtime**: Docker with multi-stage builds
- **Orchestration**: Kubernetes / Amazon EKS / Google GKE / Azure AKS
- **Service Mesh**: Istio / Linkerd for microservices communication
- **Container Registry**: ECR / ACR / GCR / Harbor

### CI/CD Pipeline
- **CI Platforms**: GitHub Actions / GitLab CI / Jenkins / Azure DevOps
- **Artifact Management**: Artifactory / Nexus / Cloud-native registries
- **Deployment Strategies**: Blue-green, canary, rolling deployments
- **GitOps**: ArgoCD / Flux for Kubernetes deployments

### Monitoring & Observability
- **Metrics**: Prometheus + Grafana / DataDog / New Relic
- **Logging**: ELK Stack / Splunk / AWS CloudWatch / Azure Monitor
- **Tracing**: Jaeger / Zipkin / AWS X-Ray
- **APM**: Application Performance Monitoring solutions

### Security & Compliance
- **Secrets Management**: HashiCorp Vault / AWS Secrets Manager / Azure Key Vault
- **Security Scanning**: Snyk / Twistlock / Aqua Security / Clair
- **Compliance**: CIS Benchmarks, SOC 2, PCI DSS frameworks
- **Network Security**: VPC, Security Groups, Network Policies

## Project Structure

```
├── infrastructure/
│   ├── terraform/           # Terraform modules and configurations
│   │   ├── modules/        # Reusable Terraform modules
│   │   ├── environments/   # Environment-specific configurations
│   │   └── shared/         # Shared resources and data sources
│   ├── kubernetes/         # Kubernetes manifests and configs
│   │   ├── base/          # Base Kustomize configurations
│   │   ├── overlays/      # Environment-specific overlays
│   │   └── helm-charts/   # Custom Helm charts
│   └── ansible/           # Configuration management playbooks
├── ci-cd/
│   ├── pipelines/         # CI/CD pipeline definitions
│   ├── scripts/           # Build and deployment scripts
│   └── configs/           # Pipeline configurations
├── monitoring/
│   ├── prometheus/        # Prometheus configurations and rules
│   ├── grafana/           # Grafana dashboards and datasources
│   ├── alertmanager/      # Alert routing and notifications
│   └── logging/           # Logging configurations (ELK, Fluentd)
├── security/
│   ├── policies/          # Security policies and compliance rules
│   ├── scanning/          # Security scanning configurations
│   └── secrets/           # Secret management configurations
├── docs/
│   ├── runbooks/          # Operational runbooks and procedures
│   ├── architecture/      # System architecture documentation
│   └── troubleshooting/   # Troubleshooting guides
└── tools/                 # Utility scripts and automation tools
```

## Development Guidelines

### Infrastructure as Code Principles
- **Version Control**: All infrastructure changes tracked in Git
- **Immutable Infrastructure**: Replace rather than modify infrastructure
- **Modular Design**: Create reusable Terraform/Pulumi modules
- **Environment Parity**: Consistent infrastructure across environments
- **Documentation**: Comprehensive documentation for all infrastructure components

### CI/CD Best Practices
- **Pipeline as Code**: Define pipelines in version-controlled files
- **Fail Fast**: Early detection of issues with comprehensive testing
- **Quality Gates**: Automated security, quality, and performance checks
- **Rollback Strategy**: Quick rollback mechanisms for failed deployments
- **Deployment Automation**: Minimize manual intervention in deployments

### Security-First Approach
- **Least Privilege**: Minimal necessary permissions for all systems
- **Defense in Depth**: Multiple layers of security controls
- **Secrets Management**: No secrets in code; use dedicated secret stores
- **Regular Updates**: Automated security updates and vulnerability scanning
- **Audit Logging**: Comprehensive logging of all infrastructure changes

### Monitoring & Alerting Strategy
- **Proactive Monitoring**: Monitor key metrics and business KPIs
- **Alert Fatigue Prevention**: Meaningful alerts with proper escalation
- **Observability**: Full visibility into system behavior and performance
- **SLA/SLO Tracking**: Define and monitor service level objectives
- **Incident Response**: Clear procedures for incident management

## Key Commands

### Infrastructure Management
```bash
# Terraform operations
terraform init                          # Initialize Terraform working directory
terraform plan -var-file="prod.tfvars" # Preview infrastructure changes
terraform apply -var-file="prod.tfvars" # Apply infrastructure changes
terraform destroy -var-file="prod.tfvars" # Destroy infrastructure

# Kubernetes operations
kubectl apply -k overlays/production/   # Apply Kustomize configurations
kubectl get pods -A                     # List all pods across namespaces
kubectl logs -f deployment/app-name     # Follow application logs
kubectl exec -it pod-name -- /bin/bash  # Execute commands in pod

# Helm operations
helm install myapp ./helm-charts/myapp --namespace production
helm upgrade myapp ./helm-charts/myapp --namespace production
helm rollback myapp 1 --namespace production
helm list -A                           # List all Helm releases
```

### CI/CD Pipeline Operations
```bash
# GitHub Actions
gh workflow run deploy.yml              # Trigger workflow manually
gh run list                            # List workflow runs
gh run view --log                      # View workflow logs

# Docker operations
docker build -t myapp:latest .         # Build Docker image
docker push registry.example.com/myapp:latest # Push to registry
docker-compose up -d                   # Start services with Docker Compose
docker system prune -a                 # Clean up Docker resources
```

### Monitoring Commands
```bash
# Prometheus queries
curl -G 'http://prometheus:9090/api/v1/query' \
  --data-urlencode 'query=up{job="kubernetes-nodes"}'

# Kubectl monitoring
kubectl top nodes                      # Node resource usage
kubectl top pods -A                    # Pod resource usage
kubectl get events --sort-by='.lastTimestamp' # Recent cluster events

# Log aggregation
kubectl logs -l app=myapp --tail=100   # Application logs
journalctl -u kubelet                  # System service logs
```

### Security Operations
```bash
# Vulnerability scanning
trivy image myapp:latest               # Scan container image
kube-bench run --config-dir /etc/kube-bench/cfg --config cfg/config.yaml

# Secret management
vault kv put secret/myapp/prod username=admin password=secret
kubectl create secret generic mysecret --from-literal=password=secret

# Compliance checking
inspec exec compliance-profile/        # Run compliance tests
```

## Infrastructure Modules

### Terraform VPC Module
```hcl
# modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-igw"
  })
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  count         = length(var.public_subnet_cidrs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}
```

### Kubernetes Deployment Manifests
```yaml
# kubernetes/base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: web-app
        image: web-app:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
  labels:
    app: web-app
spec:
  selector:
    app: web-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - app.example.com
    secretName: web-app-tls
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-app-service
            port:
              number: 80
```

## CI/CD Pipeline Examples

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy Infrastructure and Application

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  TF_VERSION: 1.5.0
  KUBECTL_VERSION: 1.27.0
  AWS_REGION: us-west-2

jobs:
  terraform-plan:
    runs-on: ubuntu-latest
    outputs:
      tfplanExitCode: ${{ steps.tf-plan.outputs.exitcode }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Terraform Init
        working-directory: infrastructure/terraform
        run: terraform init

      - name: Terraform Format
        working-directory: infrastructure/terraform
        run: terraform fmt -check

      - name: Terraform Plan
        id: tf-plan
        working-directory: infrastructure/terraform
        run: |
          export exitcode=0
          terraform plan -detailed-exitcode -no-color -out tfplan || export exitcode=$?
          echo "exitcode=$exitcode" >> $GITHUB_OUTPUT

          if [ $exitcode -eq 1 ]; then
            echo Terraform Plan Failed!
            exit 1
          else
            exit 0
          fi

      - name: Publish Terraform Plan
        uses: actions/upload-artifact@v3
        with:
          name: tfplan
          path: infrastructure/terraform/tfplan

  terraform-apply:
    runs-on: ubuntu-latest
    needs: [terraform-plan]
    if: github.ref == 'refs/heads/main' && needs.terraform-plan.outputs.tfplanExitCode == 2
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Download Terraform Plan
        uses: actions/download-artifact@v3
        with:
          name: tfplan
          path: infrastructure/terraform

      - name: Terraform Init
        working-directory: infrastructure/terraform
        run: terraform init

      - name: Terraform Apply
        working-directory: infrastructure/terraform
        run: terraform apply -auto-approve tfplan

  deploy-application:
    runs-on: ubuntu-latest
    needs: [terraform-apply]
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: ${{ env.KUBECTL_VERSION }}

      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig --region ${{ env.AWS_REGION }} --name production-cluster

      - name: Deploy to Kubernetes
        working-directory: infrastructure/kubernetes
        run: |
          kubectl apply -k overlays/production/
          kubectl rollout status deployment/web-app -n production --timeout=300s

      - name: Verify deployment
        run: |
          kubectl get pods -n production -l app=web-app
          kubectl get svc -n production -l app=web-app
```

## Monitoring Configuration

### Prometheus Configuration
```yaml
# monitoring/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
    - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
    - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
      action: keep
      regex: default;kubernetes;https

  - job_name: 'kubernetes-nodes'
    kubernetes_sd_configs:
    - role: node
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
    - action: labelmap
      regex: __meta_kubernetes_node_label_(.+)

  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
    - role: pod
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
```

### Alerting Rules
```yaml
# monitoring/prometheus/rules/application.yml
groups:
- name: application.rules
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} errors per second for {{ $labels.service }}"

  - alert: HighMemoryUsage
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage detected"
      description: "Memory usage is above 90% on {{ $labels.instance }}"

  - alert: KubernetesPodCrashLooping
    expr: increase(kube_pod_container_status_restarts_total[1h]) > 5
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Pod is crash looping"
      description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is crash looping"

  - alert: KubernetesNodeNotReady
    expr: kube_node_status_condition{condition="Ready",status="true"} == 0
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Node is not ready"
      description: "Node {{ $labels.node }} is not ready"
```

### Grafana Dashboard Configuration
```json
{
  "dashboard": {
    "title": "Kubernetes Cluster Overview",
    "tags": ["kubernetes", "monitoring"],
    "panels": [
      {
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total{container!=\"\"}[5m])",
            "legendFormat": "{{ pod }}"
          }
        ],
        "yAxes": [
          {
            "label": "CPU Usage",
            "unit": "percent"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "container_memory_usage_bytes{container!=\"\"}",
            "legendFormat": "{{ pod }}"
          }
        ],
        "yAxes": [
          {
            "label": "Memory Usage",
            "unit": "bytes"
          }
        ]
      },
      {
        "title": "Pod Status",
        "type": "stat",
        "targets": [
          {
            "expr": "kube_pod_status_phase",
            "legendFormat": "{{ phase }}"
          }
        ]
      }
    ]
  }
}
```

## Security Configuration

### Vault Configuration
```hcl
# security/vault/vault.hcl
ui = true
disable_mlock = true

storage "consul" {
  address = "127.0.0.1:8500"
  path    = "vault/"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 0
  tls_cert_file = "/etc/vault/tls/vault.crt"
  tls_key_file  = "/etc/vault/tls/vault.key"
}

seal "awskms" {
  region     = "us-west-2"
  kms_key_id = "arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012"
}

telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = true
}
```

### Network Policies
```yaml
# security/network-policies/default-deny.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web-app
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: web-app
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: nginx-ingress
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
  - to: []
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
```

## Disaster Recovery

### Backup Strategy
```bash
#!/bin/bash
# scripts/backup-cluster.sh

# Backup etcd
ETCDCTL_API=3 etcdctl snapshot save snapshot.db \
  --endpoints=https://etcd:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/peer.crt \
  --key=/etc/kubernetes/pki/etcd/peer.key

# Upload to S3
aws s3 cp snapshot.db s3://my-backup-bucket/etcd-snapshots/snapshot-$(date +%Y%m%d-%H%M%S).db

# Backup persistent volumes
kubectl get pv -o yaml > pv-backup-$(date +%Y%m%d).yaml
aws s3 cp pv-backup-$(date +%Y%m%d).yaml s3://my-backup-bucket/pv-backups/

# Database backup
kubectl exec deployment/postgres -- pg_dump -U postgres mydb > db-backup-$(date +%Y%m%d).sql
aws s3 cp db-backup-$(date +%Y%m%d).sql s3://my-backup-bucket/db-backups/
```

### Restoration Procedure
```bash
#!/bin/bash
# scripts/restore-cluster.sh

# Restore etcd from snapshot
sudo systemctl stop etcd
sudo rm -rf /var/lib/etcd/
sudo etcdctl snapshot restore snapshot.db --data-dir=/var/lib/etcd/
sudo systemctl start etcd

# Restore Kubernetes objects
kubectl apply -f pv-backup.yaml

# Restore database
kubectl exec -it deployment/postgres -- psql -U postgres -d mydb -f /tmp/db-backup.sql
```

## Performance Optimization

### Resource Management
```yaml
# Resource quotas and limits
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    requests.cpu: "100"
    requests.memory: 200Gi
    limits.cpu: "200"
    limits.memory: 400Gi
    persistentvolumeclaims: "10"
    services: "20"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: production-limits
  namespace: production
spec:
  limits:
  - default:
      cpu: "200m"
      memory: "256Mi"
    defaultRequest:
      cpu: "100m"
      memory: "128Mi"
    type: Container
```

### Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 3
  maxReplicas: 100
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
        periodSeconds: 60
```

## Development Workflow

### Infrastructure Changes
1. **Plan Phase**: Create Terraform plan and review impact
2. **Validation**: Run compliance and security scans
3. **Testing**: Test changes in staging environment
4. **Approval**: Peer review and approval process
5. **Deployment**: Apply changes with rollback plan
6. **Verification**: Validate deployment and monitor metrics

### Application Deployment
1. **Build**: Create container image with security scanning
2. **Testing**: Run integration and performance tests
3. **Staging**: Deploy to staging environment for validation
4. **Production**: Blue-green or canary deployment to production
5. **Monitoring**: Monitor application metrics and logs
6. **Rollback**: Automatic rollback on failure detection

### Code Review Checklist
- [ ] Infrastructure code follows best practices and security guidelines
- [ ] Resource limits and requests properly configured
- [ ] Monitoring and alerting configured for new services
- [ ] Backup and disaster recovery procedures updated
- [ ] Security policies and network policies implemented
- [ ] Documentation updated with operational procedures

## Claude Code Integration Notes

When working with this DevOps infrastructure project, focus on:
- **Security First**: Always consider security implications of infrastructure changes
- **Automation**: Prefer automated solutions over manual processes
- **Monitoring**: Ensure comprehensive observability for all systems
- **Reliability**: Design for fault tolerance and disaster recovery
- **Cost Optimization**: Monitor and optimize resource usage and costs
- **Documentation**: Maintain clear runbooks and operational procedures

For infrastructure operations, prioritize safety and reliability over speed, and always maintain comprehensive audit trails for all changes.
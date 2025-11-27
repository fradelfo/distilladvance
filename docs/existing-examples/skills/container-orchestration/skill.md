# Container Orchestration Skill

Expert-level Docker and Kubernetes container orchestration capabilities with production-ready patterns and modern best practices.

## Skill Overview

This skill provides comprehensive container orchestration expertise including Docker containerization, Kubernetes deployment, service mesh integration, and cloud-native application patterns using the latest tools and methodologies.

## Core Capabilities

### Docker Containerization
- **Multi-stage builds** - Optimized container images with minimal attack surface
- **Security hardening** - Non-root users, minimal base images, secret management
- **Build optimization** - Layer caching, BuildKit features, multi-platform builds
- **Container scanning** - Vulnerability assessment with Trivy, Grype, Snyk

### Kubernetes Orchestration
- **Production deployments** - Stateless/stateful applications with best practices
- **Auto-scaling strategies** - HPA, VPA, KEDA for event-driven scaling
- **Service mesh integration** - Istio, Linkerd, Consul Connect implementation
- **Operator development** - Custom controllers and CRDs for complex applications

### Cloud-Native Patterns
- **Microservices architecture** - Service decomposition and communication patterns
- **Event-driven architecture** - Async messaging with NATS, RabbitMQ, Kafka
- **Circuit breaker patterns** - Resilience with Hystrix, resilience4j
- **Observability patterns** - Distributed tracing, metrics, logging

### GitOps & CI/CD
- **GitOps workflows** - ArgoCD, Flux, Tekton pipeline integration
- **Progressive delivery** - Canary deployments, blue-green strategies
- **Security scanning** - Container and manifest security in pipelines
- **Helm chart development** - Advanced templating and lifecycle management

## Advanced Kubernetes Features

### Custom Resources & Operators
```yaml
# Custom Resource Definition
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: webapplications.platform.company.com
spec:
  group: platform.company.com
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              image:
                type: string
              replicas:
                type: integer
                minimum: 1
                maximum: 10
              resources:
                type: object
                properties:
                  cpu:
                    type: string
                  memory:
                    type: string
          status:
            type: object
            properties:
              conditions:
                type: array
                items:
                  type: object
                  properties:
                    type:
                      type: string
                    status:
                      type: string
                    reason:
                      type: string
  scope: Namespaced
  names:
    plural: webapplications
    singular: webapplication
    kind: WebApplication
```

### Advanced Networking
```yaml
# Network Policies with Calico
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
  - to:
    - namespaceSelector:
        matchLabels:
          name: production
    - podSelector:
        matchLabels:
          role: database
    ports:
    - protocol: TCP
      port: 5432
```

### Service Mesh Configuration
```yaml
# Istio Virtual Service
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: api-gateway
spec:
  hosts:
  - api.example.com
  gateways:
  - api-gateway
  http:
  - match:
    - uri:
        prefix: /api/v1/users
    route:
    - destination:
        host: user-service
        subset: v2
      weight: 20
    - destination:
        host: user-service
        subset: v1
      weight: 80
    fault:
      delay:
        percentage:
          value: 0.1
        fixedDelay: 5s
    retries:
      attempts: 3
      perTryTimeout: 2s
```

## Container Security

### Security Scanning Pipeline
```dockerfile
# Multi-stage Dockerfile with security scanning
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Security scanning stage
FROM aquasec/trivy AS security-scan
COPY --from=build /app .
RUN trivy fs --security-checks vuln,config,secret --format sarif --output trivy-report.sarif .

# Production stage
FROM node:18-alpine AS production
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]
```

### Pod Security Standards
```yaml
# Pod Security Policy v2 (Pod Security Standards)
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/audit-version: latest
    pod-security.kubernetes.io/warn-version: latest
```

### RBAC & Service Accounts
```yaml
# Minimal RBAC for application
apiVersion: v1
kind: ServiceAccount
metadata:
  name: webapp-sa
  namespace: production
automountServiceAccountToken: false

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: webapp-role
  namespace: production
rules:
- apiGroups: [""]
  resources: ["secrets", "configmaps"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: webapp-binding
  namespace: production
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: webapp-role
subjects:
- kind: ServiceAccount
  name: webapp-sa
  namespace: production
```

## Modern Container Tools

### BuildKit & Docker Buildx
```bash
# Advanced multi-platform builds
export DOCKER_BUILDKIT=1
docker buildx create --use --name multi-arch-builder

# Multi-platform build with cache optimization
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --cache-from type=registry,ref=myregistry/myapp:cache \
  --cache-to type=registry,ref=myregistry/myapp:cache,mode=max \
  --push \
  -t myregistry/myapp:latest \
  .

# Attestation and SBOM generation
docker buildx build \
  --attest type=provenance \
  --attest type=sbom \
  --push \
  -t myregistry/myapp:latest \
  .
```

### Container Registry Security
```bash
# Cosign for container signing
cosign generate-key-pair
cosign sign --key cosign.key myregistry/myapp:latest

# Notation for OCI artifact signing
notation cert generate-test --default "myapp"
notation sign --signature-format cose myregistry/myapp:latest

# Harbor registry configuration
helm upgrade --install harbor harbor/harbor \
  --set expose.type=ingress \
  --set expose.tls.enabled=true \
  --set persistence.enabled=true \
  --set trivy.enabled=true \
  --set notary.enabled=true
```

### Admission Controllers
```yaml
# OPA Gatekeeper constraint
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: requiredlabels
spec:
  crd:
    spec:
      names:
        kind: RequiredLabels
      validation:
        properties:
          labels:
            type: array
            items:
              type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package requiredlabels

        violation[{"msg": msg}] {
          required := input.parameters.labels
          provided := input.review.object.metadata.labels
          missing := required[_]
          not provided[missing]
          msg := sprintf("Missing required label: %v", [missing])
        }
```

## Observability & Monitoring

### Prometheus Monitoring
```yaml
# ServiceMonitor for application metrics
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: webapp-metrics
spec:
  selector:
    matchLabels:
      app: webapp
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
    honorLabels: true
    scrapeTimeout: 10s
    metricRelabelings:
    - sourceLabels: [__name__]
      regex: 'go_.*'
      action: drop
```

### Distributed Tracing
```yaml
# OpenTelemetry Collector configuration
apiVersion: opentelemetry.io/v1alpha1
kind: OpenTelemetryCollector
metadata:
  name: otel-collector
spec:
  config: |
    receivers:
      jaeger:
        protocols:
          grpc:
            endpoint: 0.0.0.0:14250
          thrift_http:
            endpoint: 0.0.0.0:14268
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318

    processors:
      batch:
      memory_limiter:
        limit_mib: 512

    exporters:
      jaeger:
        endpoint: jaeger-collector:14250
        tls:
          insecure: true
      prometheus:
        endpoint: "0.0.0.0:8889"

    service:
      pipelines:
        traces:
          receivers: [jaeger, otlp]
          processors: [memory_limiter, batch]
          exporters: [jaeger]
        metrics:
          receivers: [otlp]
          processors: [memory_limiter, batch]
          exporters: [prometheus]
```

## Production Deployment Patterns

### Blue-Green Deployment
```yaml
# ArgoCD Rollout with Blue-Green
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: webapp-rollout
spec:
  replicas: 5
  strategy:
    blueGreen:
      activeService: webapp-active
      previewService: webapp-preview
      autoPromotionEnabled: false
      scaleDownDelaySeconds: 30
      prePromotionAnalysis:
        templates:
        - templateName: success-rate
        args:
        - name: service-name
          value: webapp-preview
      postPromotionAnalysis:
        templates:
        - templateName: success-rate
        args:
        - name: service-name
          value: webapp-active
  selector:
    matchLabels:
      app: webapp
  template:
    metadata:
      labels:
        app: webapp
    spec:
      containers:
      - name: webapp
        image: myregistry/webapp:latest
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: http
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Chaos Engineering
```yaml
# Chaos Mesh experiment
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: pod-kill-experiment
spec:
  action: pod-kill
  mode: one
  duration: "30s"
  selector:
    namespaces:
    - production
    labelSelectors:
      app: webapp
  scheduler:
    cron: "@every 2h"
```

## Skill Activation Triggers

This skill automatically activates when:
- Container or Docker-related tasks are detected
- Kubernetes manifest creation or modification is needed
- Container orchestration optimization is requested
- Cloud-native architecture design is required
- Service mesh configuration is needed
- Container security scanning is requested

## Advanced Capabilities

### Multi-Cluster Management
- **Cluster federation** - Cross-cluster service discovery and deployment
- **GitOps at scale** - Multi-environment promotion pipelines
- **Cost optimization** - Resource rightsizing and cluster autoscaling
- **Disaster recovery** - Cross-region backup and restoration strategies

### Edge Computing
- **Edge Kubernetes** - K3s, MicroK8s deployment patterns
- **IoT orchestration** - Container workloads on edge devices
- **Network optimization** - CDN integration and edge caching
- **Offline capabilities** - Disconnected operation patterns

## Helm Chart Development

### Advanced Helm Templating
```yaml
# Chart.yaml with dependencies
apiVersion: v2
name: microservice
description: Production-ready microservice Helm chart
type: application
version: 0.1.0
appVersion: "1.0.0"

dependencies:
  - name: redis
    version: 17.3.7
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
  - name: postgresql
    version: 11.9.13
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
  - name: prometheus
    version: 15.18.0
    repository: https://prometheus-community.github.io/helm-charts
    condition: monitoring.prometheus.enabled

annotations:
  artifacthub.io/changes: |
    - Added support for custom metrics
    - Improved security contexts
    - Enhanced network policies
```

### Dynamic Values and Templating
```yaml
# values.yaml with comprehensive configuration
global:
  imageRegistry: ""
  imagePullSecrets: []
  storageClass: ""

replicaCount: 3

image:
  registry: docker.io
  repository: myorg/myapp
  tag: ""
  pullPolicy: IfNotPresent
  digest: ""

nameOverride: ""
fullnameOverride: ""

serviceAccount:
  create: true
  annotations: {}
  name: ""
  automount: true

podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/metrics"

podSecurityContext:
  fsGroup: 2000
  runAsNonRoot: true
  runAsUser: 1000

securityContext:
  allowPrivilegeEscalation: false
  capabilities:
    drop:
    - ALL
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 1000

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 100
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max

nodeSelector: {}

tolerations: []

affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app.kubernetes.io/name
            operator: In
            values:
            - myapp
        topologyKey: kubernetes.io/hostname

topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: kubernetes.io/hostname
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app.kubernetes.io/name: myapp

config:
  database:
    host: "{{ include \"postgresql.primary.fullname\" .Subcharts.postgresql }}"
    port: 5432
    name: myapp
  redis:
    host: "{{ include \"redis.fullname\" .Subcharts.redis }}-master"
    port: 6379
  logging:
    level: info
    format: json

secrets:
  database:
    username: myapp
    password: ""
  jwt:
    secret: ""

monitoring:
  enabled: true
  prometheus:
    enabled: true
    port: 8080
    path: /metrics
  jaeger:
    enabled: true
    endpoint: http://jaeger-collector:14268/api/traces

ingress:
  enabled: false
  className: "nginx"
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: myapp.local
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: myapp-tls
      hosts:
        - myapp.local

networkPolicy:
  enabled: true
  ingress:
    - from:
      - namespaceSelector:
          matchLabels:
            name: ingress-nginx
      ports:
      - protocol: TCP
        port: 8080
    - from:
      - podSelector:
          matchLabels:
            app.kubernetes.io/name: prometheus
      ports:
      - protocol: TCP
        port: 8080
  egress:
    - to:
      - podSelector:
          matchLabels:
            app.kubernetes.io/name: postgresql
      ports:
      - protocol: TCP
        port: 5432
    - to:
      - podSelector:
          matchLabels:
            app.kubernetes.io/name: redis
      ports:
      - protocol: TCP
        port: 6379
```

### Advanced Deployment Template
```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: {{ .Values.strategy.rollingUpdate.maxUnavailable | default "25%" }}
      maxSurge: {{ .Values.strategy.rollingUpdate.maxSurge | default "25%" }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        checksum/secret: {{ include (print $.Template.BasePath "/secret.yaml") . | sha256sum }}
        {{- with .Values.podAnnotations }}
        {{- toYaml . | nindent 8 }}
        {{- end }}
      labels:
        {{- include "myapp.selectorLabels" . | nindent 8 }}
        version: {{ .Values.image.tag | default .Chart.AppVersion }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "myapp.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      initContainers:
        - name: wait-for-db
          image: busybox:1.35
          command: ['sh', '-c']
          args:
            - until nc -z {{ .Values.config.database.host }} {{ .Values.config.database.port }}; do
                echo "Waiting for database...";
                sleep 2;
              done;
              echo "Database is ready!";
        - name: migration
          image: {{ include "myapp.image" . }}
          command: ["npm", "run", "migrate"]
          env:
            {{- include "myapp.env" . | nindent 12 }}
          resources:
            limits:
              cpu: 100m
              memory: 128Mi
            requests:
              cpu: 50m
              memory: 64Mi
      containers:
        - name: {{ .Chart.Name }}
          securityContext:
            {{- toYaml .Values.securityContext | nindent 12 }}
          image: {{ include "myapp.image" . }}
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          env:
            {{- include "myapp.env" . | nindent 12 }}
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
            - name: metrics
              containerPort: 9090
              protocol: TCP
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
            successThreshold: 1
          readinessProbe:
            httpGet:
              path: /ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
            successThreshold: 1
          startupProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 30
            successThreshold: 1
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          volumeMounts:
            - name: config
              mountPath: /app/config
              readOnly: true
            - name: secrets
              mountPath: /app/secrets
              readOnly: true
            - name: tmp
              mountPath: /tmp
            - name: cache
              mountPath: /app/cache
        {{- if .Values.monitoring.jaeger.enabled }}
        - name: jaeger-agent
          image: jaegertracing/jaeger-agent:1.39
          ports:
            - containerPort: 5775
              protocol: UDP
            - containerPort: 6831
              protocol: UDP
            - containerPort: 6832
              protocol: UDP
            - containerPort: 5778
              protocol: TCP
          args:
            - --reporter.grpc.host-port={{ .Values.monitoring.jaeger.endpoint }}
          resources:
            limits:
              cpu: 50m
              memory: 64Mi
            requests:
              cpu: 10m
              memory: 32Mi
        {{- end }}
      volumes:
        - name: config
          configMap:
            name: {{ include "myapp.fullname" . }}
        - name: secrets
          secret:
            secretName: {{ include "myapp.fullname" . }}
        - name: tmp
          emptyDir: {}
        - name: cache
          emptyDir: {}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.topologySpreadConstraints }}
      topologySpreadConstraints:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

### Helm Testing and Validation
```yaml
# templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "myapp.fullname" . }}-test"
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-weight": "1"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: test
      image: curlimages/curl:7.85.0
      command:
        - /bin/sh
        - -c
        - |
          set -e
          echo "Testing application health endpoint..."
          curl -f http://{{ include "myapp.fullname" . }}:{{ .Values.service.port }}/health

          echo "Testing metrics endpoint..."
          curl -f http://{{ include "myapp.fullname" . }}:{{ .Values.service.port }}/metrics

          echo "Testing API endpoint..."
          curl -f http://{{ include "myapp.fullname" . }}:{{ .Values.service.port }}/api/v1/health

          echo "All tests passed!"
```

## Advanced Kubernetes Operators

### Custom Controller with Kubebuilder
```go
// controllers/webapplication_controller.go
package controllers

import (
    "context"
    "fmt"
    "time"

    appsv1 "k8s.io/api/apps/v1"
    corev1 "k8s.io/api/core/v1"
    "k8s.io/apimachinery/pkg/api/errors"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/apimachinery/pkg/runtime"
    "k8s.io/apimachinery/pkg/util/intstr"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/client"
    "sigs.k8s.io/controller-runtime/pkg/log"

    platformv1 "github.com/example/webapp-operator/api/v1"
)

// WebApplicationReconciler reconciles a WebApplication object
type WebApplicationReconciler struct {
    client.Client
    Scheme *runtime.Scheme
}

//+kubebuilder:rbac:groups=platform.example.com,resources=webapplications,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=platform.example.com,resources=webapplications/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=platform.example.com,resources=webapplications/finalizers,verbs=update
//+kubebuilder:rbac:groups=apps,resources=deployments,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=core,resources=services,verbs=get;list;watch;create;update;patch;delete

func (r *WebApplicationReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    logger := log.FromContext(ctx)

    // Fetch the WebApplication instance
    var webapp platformv1.WebApplication
    if err := r.Get(ctx, req.NamespacedName, &webapp); err != nil {
        if errors.IsNotFound(err) {
            logger.Info("WebApplication resource not found. Ignoring since object must be deleted")
            return ctrl.Result{}, nil
        }
        logger.Error(err, "Failed to get WebApplication")
        return ctrl.Result{}, err
    }

    // Check if the deployment already exists, if not create a new one
    deployment := &appsv1.Deployment{}
    err := r.Get(ctx, req.NamespacedName, deployment)
    if err != nil && errors.IsNotFound(err) {
        // Define a new deployment
        dep := r.deploymentForWebApp(&webapp)
        logger.Info("Creating a new Deployment", "Deployment.Namespace", dep.Namespace, "Deployment.Name", dep.Name)
        if err := r.Create(ctx, dep); err != nil {
            logger.Error(err, "Failed to create new Deployment", "Deployment.Namespace", dep.Namespace, "Deployment.Name", dep.Name)
            return ctrl.Result{}, err
        }
        // Deployment created successfully - return and requeue
        return ctrl.Result{Requeue: true}, nil
    } else if err != nil {
        logger.Error(err, "Failed to get Deployment")
        return ctrl.Result{}, err
    }

    // Ensure the deployment size matches the WebApplication spec
    size := webapp.Spec.Replicas
    if *deployment.Spec.Replicas != size {
        deployment.Spec.Replicas = &size
        if err := r.Update(ctx, deployment); err != nil {
            logger.Error(err, "Failed to update Deployment", "Deployment.Namespace", deployment.Namespace, "Deployment.Name", deployment.Name)
            return ctrl.Result{}, err
        }
        // Spec updated - return and requeue
        return ctrl.Result{Requeue: true}, nil
    }

    // Check if the service already exists, if not create a new one
    service := &corev1.Service{}
    err = r.Get(ctx, req.NamespacedName, service)
    if err != nil && errors.IsNotFound(err) {
        // Define a new service
        svc := r.serviceForWebApp(&webapp)
        logger.Info("Creating a new Service", "Service.Namespace", svc.Namespace, "Service.Name", svc.Name)
        if err := r.Create(ctx, svc); err != nil {
            logger.Error(err, "Failed to create new Service", "Service.Namespace", svc.Namespace, "Service.Name", svc.Name)
            return ctrl.Result{}, err
        }
        // Service created successfully - return and requeue
        return ctrl.Result{Requeue: true}, nil
    } else if err != nil {
        logger.Error(err, "Failed to get Service")
        return ctrl.Result{}, err
    }

    // Update the WebApplication status with the pod names
    podList := &corev1.PodList{}
    listOpts := []client.ListOption{
        client.InNamespace(webapp.Namespace),
        client.MatchingLabels(labelsForWebApp(webapp.Name)),
    }
    if err = r.List(ctx, podList, listOpts...); err != nil {
        logger.Error(err, "Failed to list pods", "WebApplication.Namespace", webapp.Namespace, "WebApplication.Name", webapp.Name)
        return ctrl.Result{}, err
    }
    podNames := getPodNames(podList.Items)

    // Update status.Nodes if needed
    if !reflect.DeepEqual(podNames, webapp.Status.Nodes) {
        webapp.Status.Nodes = podNames
        if err := r.Status().Update(ctx, &webapp); err != nil {
            logger.Error(err, "Failed to update WebApplication status")
            return ctrl.Result{}, err
        }
    }

    // Update ready condition
    readyCondition := metav1.Condition{
        Type:   "Ready",
        Status: metav1.ConditionTrue,
        Reason: "DeploymentReady",
        Message: fmt.Sprintf("Deployment %s is ready with %d replicas", webapp.Name, len(podNames)),
    }

    meta.SetStatusCondition(&webapp.Status.Conditions, readyCondition)
    if err := r.Status().Update(ctx, &webapp); err != nil {
        logger.Error(err, "Failed to update WebApplication status conditions")
        return ctrl.Result{}, err
    }

    return ctrl.Result{RequeueAfter: time.Minute * 5}, nil
}

// deploymentForWebApp returns a WebApplication Deployment object
func (r *WebApplicationReconciler) deploymentForWebApp(webapp *platformv1.WebApplication) *appsv1.Deployment {
    labels := labelsForWebApp(webapp.Name)
    replicas := webapp.Spec.Replicas

    dep := &appsv1.Deployment{
        ObjectMeta: metav1.ObjectMeta{
            Name:      webapp.Name,
            Namespace: webapp.Namespace,
        },
        Spec: appsv1.DeploymentSpec{
            Replicas: &replicas,
            Selector: &metav1.LabelSelector{
                MatchLabels: labels,
            },
            Template: corev1.PodTemplateSpec{
                ObjectMeta: metav1.ObjectMeta{
                    Labels: labels,
                },
                Spec: corev1.PodSpec{
                    Containers: []corev1.Container{{
                        Image:   webapp.Spec.Image,
                        Name:    "webapp",
                        Command: []string{"./app"},
                        Ports: []corev1.ContainerPort{{
                            ContainerPort: 8080,
                            Name:          "webapp",
                        }},
                        Resources: webapp.Spec.Resources,
                        SecurityContext: &corev1.SecurityContext{
                            RunAsNonRoot:             &[]bool{true}[0],
                            RunAsUser:                &[]int64{1000}[0],
                            AllowPrivilegeEscalation: &[]bool{false}[0],
                            Capabilities: &corev1.Capabilities{
                                Drop: []corev1.Capability{"ALL"},
                            },
                            ReadOnlyRootFilesystem: &[]bool{true}[0],
                        },
                        LivenessProbe: &corev1.Probe{
                            ProbeHandler: corev1.ProbeHandler{
                                HTTPGet: &corev1.HTTPGetAction{
                                    Path: "/health",
                                    Port: intstr.IntOrString{Type: intstr.String, StrVal: "webapp"},
                                },
                            },
                            InitialDelaySeconds: 30,
                            PeriodSeconds:       10,
                        },
                        ReadinessProbe: &corev1.Probe{
                            ProbeHandler: corev1.ProbeHandler{
                                HTTPGet: &corev1.HTTPGetAction{
                                    Path: "/ready",
                                    Port: intstr.IntOrString{Type: intstr.String, StrVal: "webapp"},
                                },
                            },
                            InitialDelaySeconds: 5,
                            PeriodSeconds:       5,
                        },
                    }},
                },
            },
        },
    }

    // Set WebApplication instance as the owner and controller
    ctrl.SetControllerReference(webapp, dep, r.Scheme)
    return dep
}

// serviceForWebApp returns a WebApplication Service object
func (r *WebApplicationReconciler) serviceForWebApp(webapp *platformv1.WebApplication) *corev1.Service {
    labels := labelsForWebApp(webapp.Name)

    svc := &corev1.Service{
        ObjectMeta: metav1.ObjectMeta{
            Name:      webapp.Name,
            Namespace: webapp.Namespace,
        },
        Spec: corev1.ServiceSpec{
            Selector: labels,
            Ports: []corev1.ServicePort{
                {
                    Name:       "http",
                    Port:       80,
                    TargetPort: intstr.IntOrString{Type: intstr.String, StrVal: "webapp"},
                },
            },
        },
    }

    // Set WebApplication instance as the owner and controller
    ctrl.SetControllerReference(webapp, svc, r.Scheme)
    return svc
}

// labelsForWebApp returns the labels for selecting the resources
func labelsForWebApp(name string) map[string]string {
    return map[string]string{
        "app.kubernetes.io/name":       "WebApplication",
        "app.kubernetes.io/instance":   name,
        "app.kubernetes.io/part-of":    "webapp-operator",
        "app.kubernetes.io/created-by": "controller-manager",
    }
}

// getPodNames returns the pod names of the array of pods passed in
func getPodNames(pods []corev1.Pod) []string {
    var podNames []string
    for _, pod := range pods {
        podNames = append(podNames, pod.Name)
    }
    return podNames
}

// SetupWithManager sets up the controller with the Manager.
func (r *WebApplicationReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&platformv1.WebApplication{}).
        Owns(&appsv1.Deployment{}).
        Owns(&corev1.Service{}).
        Complete(r)
}
```

### Operator SDK Configuration
```yaml
# config/manager/manager.yaml
apiVersion: v1
kind: Namespace
metadata:
  labels:
    control-plane: controller-manager
    app.kubernetes.io/name: namespace
    app.kubernetes.io/instance: system
    app.kubernetes.io/component: manager
    app.kubernetes.io/created-by: webapp-operator
    app.kubernetes.io/part-of: webapp-operator
    app.kubernetes.io/managed-by: kustomize
  name: system
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: controller-manager
  namespace: system
  labels:
    control-plane: controller-manager
    app.kubernetes.io/name: deployment
    app.kubernetes.io/instance: controller-manager
    app.kubernetes.io/component: manager
    app.kubernetes.io/created-by: webapp-operator
    app.kubernetes.io/part-of: webapp-operator
    app.kubernetes.io/managed-by: kustomize
spec:
  selector:
    matchLabels:
      control-plane: controller-manager
  replicas: 1
  template:
    metadata:
      annotations:
        kubectl.kubernetes.io/default-container: manager
      labels:
        control-plane: controller-manager
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: kubernetes.io/arch
                operator: In
                values:
                - amd64
                - arm64
                - ppc64le
                - s390x
              - key: kubernetes.io/os
                operator: In
                values:
                - linux
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
      - command:
        - /manager
        args:
        - --leader-elect
        image: controller:latest
        name: manager
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - "ALL"
          readOnlyRootFilesystem: true
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8081
          initialDelaySeconds: 15
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: /readyz
            port: 8081
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          limits:
            cpu: 500m
            memory: 128Mi
          requests:
            cpu: 10m
            memory: 64Mi
        env:
        - name: WATCH_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      serviceAccountName: controller-manager
      terminationGracePeriodSeconds: 10
      volumes:
      - name: tmp
        emptyDir: {}
```

## Advanced Networking and Service Mesh

### Advanced Ingress Configuration
```yaml
# Advanced NGINX Ingress with authentication and rate limiting
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: webapp-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/rewrite-target: /$2

    # Rate limiting
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/rate-limit-connections: "10"

    # Authentication
    nginx.ingress.kubernetes.io/auth-url: "https://auth.example.com/oauth2/auth"
    nginx.ingress.kubernetes.io/auth-signin: "https://auth.example.com/oauth2/start?rd=https://$host$request_uri"
    nginx.ingress.kubernetes.io/auth-response-headers: "x-auth-request-user,x-auth-request-email"

    # Security headers
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "X-Content-Type-Options: nosniff";
      more_set_headers "X-Frame-Options: DENY";
      more_set_headers "X-XSS-Protection: 1; mode=block";
      more_set_headers "Strict-Transport-Security: max-age=31536000; includeSubDomains";

    # CORS configuration
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://app.example.com"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization"
    nginx.ingress.kubernetes.io/enable-cors: "true"

    # Caching
    nginx.ingress.kubernetes.io/upstream-hash-by: "$request_uri"
    nginx.ingress.kubernetes.io/server-snippet: |
      location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
      }

spec:
  tls:
  - hosts:
    - api.example.com
    - app.example.com
    secretName: webapp-tls
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
  - host: app.example.com
    http:
      paths:
      - path: /app(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

### Istio Service Mesh Advanced Configuration
```yaml
# Advanced Istio Gateway with multiple hosts
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: webapp-gateway
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "*.example.com"
    tls:
      httpsRedirect: true
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: webapp-tls
    hosts:
    - "*.example.com"
  - port:
      number: 15443
      name: tls-passthrough
      protocol: TLS
    tls:
      mode: PASSTHROUGH
    hosts:
    - secure-app.example.com

---
# Advanced Virtual Service with traffic splitting and fault injection
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: webapp-vs
spec:
  hosts:
  - api.example.com
  gateways:
  - webapp-gateway
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: webapp-service
        subset: v2
    fault:
      delay:
        percentage:
          value: 0.1
        fixedDelay: 2s
      abort:
        percentage:
          value: 0.01
        httpStatus: 500
    timeout: 30s
    retries:
      attempts: 3
      perTryTimeout: 10s
      retryOn: 5xx,reset,connect-failure,refused-stream
  - match:
    - uri:
        prefix: "/api/v1"
    route:
    - destination:
        host: webapp-service
        subset: v2
      weight: 20
    - destination:
        host: webapp-service
        subset: v1
      weight: 80
    headers:
      request:
        set:
          x-request-id: "%REQ(x-request-id)%"
        add:
          x-source: "istio-gateway"
      response:
        add:
          x-version: "v1.2.0"

---
# Destination Rule with circuit breaker and load balancing
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: webapp-dr
spec:
  host: webapp-service
  trafficPolicy:
    loadBalancer:
      consistentHash:
        httpHeaderName: "x-user-id"
    connectionPool:
      tcp:
        maxConnections: 100
        connectTimeout: 30s
        tcpKeepalive:
          time: 7200s
          interval: 75s
      http:
        http1MaxPendingRequests: 64
        http2MaxRequests: 100
        maxRequestsPerConnection: 2
        maxRetries: 3
        consecutiveGatewayErrors: 5
        interval: 30s
        baseEjectionTime: 30s
        maxEjectionPercent: 50
        splitExternalLocalOriginErrors: true
    outlierDetection:
      consecutiveGatewayErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      splitExternalLocalOriginErrors: true
  subsets:
  - name: v1
    labels:
      version: v1
    trafficPolicy:
      connectionPool:
        tcp:
          maxConnections: 50
  - name: v2
    labels:
      version: v2
    trafficPolicy:
      connectionPool:
        tcp:
          maxConnections: 100

---
# Security policy with mutual TLS
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: webapp-mtls
spec:
  selector:
    matchLabels:
      app: webapp
  mtls:
    mode: STRICT

---
# Authorization policy
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: webapp-authz
spec:
  selector:
    matchLabels:
      app: webapp
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/webapp-sa"]
    - source:
        namespaces: ["production"]
    to:
    - operation:
        methods: ["GET", "POST"]
        paths: ["/api/v1/*"]
    when:
    - key: request.headers[authorization]
      values: ["Bearer *"]
  - from:
    - source:
        principals: ["cluster.local/ns/monitoring/sa/prometheus"]
    to:
    - operation:
        methods: ["GET"]
        paths: ["/metrics"]
```

## Multi-Cluster Management

### Cluster Federation with Admiral
```yaml
# Admiral Global Traffic Policy
apiVersion: admiral.io/v1
kind: GlobalTrafficPolicy
metadata:
  name: webapp-gtp
  namespace: admiral
spec:
  policy:
  - dns:
      exact: webapp.global
    match:
    - sourceLabels:
        app: webapp
        env: production
    - sourceLabels:
        app: frontend
        env: production
  - dns:
      exact: webapp-staging.global
    match:
    - sourceLabels:
        app: webapp
        env: staging
  selector:
    app: webapp
  clusters:
  - name: us-west
    weight: 80
    locality: us-west-2
  - name: us-east
    weight: 20
    locality: us-east-1
  outlierDetection:
    consecutiveGatewayErrors: 3
    interval: 30s
    baseEjectionTime: 30s

---
# Dependency configuration
apiVersion: admiral.io/v1
kind: Dependency
metadata:
  name: webapp-deps
  namespace: admiral
spec:
  source: webapp
  destinations:
  - database
  - redis
  - auth-service
  syncNamespace: production
```

### Cross-Cluster Service Discovery
```yaml
# Linkerd multicluster configuration
apiVersion: linkerd.io/v1alpha2
kind: Link
metadata:
  name: west-to-east
  namespace: linkerd-multicluster
spec:
  clusterName: us-east
  targetClusterName: us-west
  targetClusterDomain: cluster.local
  selector:
    matchLabels:
      mirror.linkerd.io/cluster-name: us-east

---
# Service mirror
apiVersion: v1
kind: Service
metadata:
  name: webapp-us-east
  namespace: production
  annotations:
    mirror.linkerd.io/cluster-name: us-east
    mirror.linkerd.io/remote-service-name: webapp
    mirror.linkerd.io/remote-discovery: linkerd-endpoint-mirror
spec:
  ports:
  - name: http
    port: 80
    protocol: TCP
  selector:
    mirror.linkerd.io/cluster-name: us-east
```

## Backup and Disaster Recovery

### Velero Backup Configuration
```yaml
# Velero Schedule for daily backups
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: daily-backup
  namespace: velero
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  template:
    includedNamespaces:
    - production
    - staging
    excludedResources:
    - events
    - events.events.k8s.io
    - backups.velero.io
    - restores.velero.io
    - resticrepositories.velero.io
    snapshotVolumes: true
    ttl: 720h0m0s  # 30 days retention
    defaultVolumesToRestic: false
    metadata:
      labels:
        backup-type: scheduled
    hooks:
      resources:
      - name: database-backup-hook
        includedNamespaces:
        - production
        includedResources:
        - pods
        labelSelector:
          matchLabels:
            app: postgresql
        pre:
        - exec:
            container: postgresql
            command:
            - /bin/bash
            - -c
            - "PGPASSWORD=$POSTGRES_PASSWORD pg_dump -U $POSTGRES_USER $POSTGRES_DB > /backup/$(date +%Y%m%d_%H%M%S)_backup.sql"
            onError: Fail
            timeout: 10m
        post:
        - exec:
            container: postgresql
            command:
            - /bin/bash
            - -c
            - "rm -f /backup/*.sql"
            onError: Continue

---
# BackupStorageLocation for multi-cloud setup
apiVersion: velero.io/v1
kind: BackupStorageLocation
metadata:
  name: aws-backup
  namespace: velero
spec:
  provider: aws
  objectStorage:
    bucket: production-k8s-backups
    prefix: cluster-production
  config:
    region: us-west-2
    s3ForcePathStyle: "false"
  default: true

---
apiVersion: velero.io/v1
kind: BackupStorageLocation
metadata:
  name: azure-backup
  namespace: velero
spec:
  provider: azure
  objectStorage:
    bucket: production-backups
    prefix: k8s-backups
  config:
    resourceGroup: backup-rg
    storageAccount: prodbackupstorage
```

### ETCD Backup Automation
```bash
#!/bin/bash
# ETCD backup script for disaster recovery

set -euo pipefail

ETCD_ENDPOINTS="https://10.0.0.10:2379,https://10.0.0.11:2379,https://10.0.0.12:2379"
BACKUP_DIR="/backup/etcd"
RETENTION_DAYS=30
CERT_DIR="/etc/kubernetes/pki/etcd"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Generate backup filename with timestamp
BACKUP_FILE="${BACKUP_DIR}/etcd-backup-$(date +%Y%m%d-%H%M%S).db"

echo "Creating ETCD backup: ${BACKUP_FILE}"

# Create backup using etcdctl
ETCDCTL_API=3 etcdctl snapshot save "${BACKUP_FILE}" \
  --endpoints="${ETCD_ENDPOINTS}" \
  --cacert="${CERT_DIR}/ca.crt" \
  --cert="${CERT_DIR}/server.crt" \
  --key="${CERT_DIR}/server.key"

# Verify backup integrity
echo "Verifying backup integrity..."
ETCDCTL_API=3 etcdctl snapshot status "${BACKUP_FILE}" \
  --write-out=table

# Compress backup
echo "Compressing backup..."
gzip "${BACKUP_FILE}"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Upload to cloud storage
echo "Uploading to S3..."
aws s3 cp "${BACKUP_FILE}" "s3://production-k8s-backups/etcd/"

# Cleanup old backups locally
echo "Cleaning up old local backups..."
find "${BACKUP_DIR}" -name "etcd-backup-*.db.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup completed successfully: ${BACKUP_FILE}"
```

## Performance Optimization

### Resource Management and QoS
```yaml
# Pod QoS classes configuration
apiVersion: v1
kind: Pod
metadata:
  name: guaranteed-pod
spec:
  containers:
  - name: app
    image: myapp:latest
    resources:
      limits:
        cpu: "1"
        memory: "1Gi"
      requests:
        cpu: "1"       # Same as limits = Guaranteed
        memory: "1Gi"  # Same as limits = Guaranteed

---
# Burstable QoS class
apiVersion: v1
kind: Pod
metadata:
  name: burstable-pod
spec:
  containers:
  - name: app
    image: myapp:latest
    resources:
      limits:
        cpu: "2"
        memory: "2Gi"
      requests:
        cpu: "500m"    # Less than limits = Burstable
        memory: "512Mi"

---
# Vertical Pod Autoscaler
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: webapp-vpa
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: webapp
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: webapp
      maxAllowed:
        cpu: 2
        memory: 4Gi
      minAllowed:
        cpu: 100m
        memory: 128Mi
      controlledResources: ["cpu", "memory"]
      mode: Auto

---
# Pod Disruption Budget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: webapp-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: webapp
```

### Cluster Autoscaling
```yaml
# Cluster Autoscaler configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      serviceAccountName: cluster-autoscaler
      containers:
      - image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.25.0
        name: cluster-autoscaler
        resources:
          limits:
            cpu: 100m
            memory: 300Mi
          requests:
            cpu: 100m
            memory: 300Mi
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=aws
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/production
        - --balance-similar-node-groups
        - --scale-down-enabled=true
        - --scale-down-delay-after-add=10m
        - --scale-down-unneeded-time=10m
        - --scale-down-utilization-threshold=0.5
        - --max-node-provision-time=15m
        env:
        - name: AWS_REGION
          value: us-west-2

---
# Node pool with mixed instance types
apiVersion: v1
kind: ConfigMap
metadata:
  name: nodepool-config
  namespace: kube-system
data:
  nodepool.yaml: |
    apiVersion: kops.k8s.io/v1alpha2
    kind: InstanceGroup
    metadata:
      name: mixed-nodes
    spec:
      image: 099720109477/ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-20210907
      machineType: m5.large
      mixedInstancesPolicy:
        instances:
        - m5.large
        - m5.xlarge
        - m5a.large
        - m5a.xlarge
        - m4.large
        - m4.xlarge
        onDemandAboveBase: 0
        onDemandBase: 1
        spotInstancePools: 4
      maxSize: 20
      minSize: 3
      nodeLabels:
        kops.k8s.io/instancegroup: mixed-nodes
        node-type: worker
      taints:
      - effect: NoSchedule
        key: spot-instance
        value: "true"
```

### Advanced Autoscaling with KEDA
```yaml
# KEDA ScaledObject for event-driven autoscaling
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: webapp-scaledobject
spec:
  scaleTargetRef:
    name: webapp
  minReplicaCount: 2
  maxReplicaCount: 50
  pollingInterval: 15
  cooldownPeriod: 60
  idleReplicaCount: 0
  triggers:
  - type: prometheus
    metadata:
      serverAddress: http://prometheus.monitoring.svc.cluster.local:9090
      metricName: http_requests_per_second
      threshold: '50'
      query: sum(rate(http_requests_total{job="webapp"}[1m]))
  - type: memory
    metricType: Utilization
    metadata:
      value: '70'
  - type: cpu
    metricType: Utilization
    metadata:
      value: '70'
  - type: rabbitmq
    metadata:
      protocol: amqp
      host: rabbitmq.messaging.svc.cluster.local:5672
      vhostName: /
      mode: QueueLength
      value: '10'
      queueName: webapp-queue
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max

---
# Prometheus adapter for custom metrics
apiVersion: v1
kind: ConfigMap
metadata:
  name: adapter-config
  namespace: monitoring
data:
  config.yaml: |
    rules:
    - seriesQuery: 'http_requests_total{namespace!="",pod!=""}'
      resources:
        overrides:
          namespace:
            resource: namespace
          pod:
            resource: pod
      name:
        matches: "^(.*)"
        as: "http_requests_per_second"
      metricsQuery: 'sum(rate(<<.Series>>{<<.LabelMatchers>>}[2m])) by (<<.GroupBy>>)'
    - seriesQuery: 'queue_depth{namespace!="",pod!=""}'
      resources:
        overrides:
          namespace:
            resource: namespace
          pod:
            resource: pod
      name:
        matches: "^(.*)"
        as: "queue_depth_average"
      metricsQuery: 'avg(<<.Series>>{<<.LabelMatchers>>}) by (<<.GroupBy>>)'
```

## Cost Optimization Strategies

### Resource Optimization
```yaml
# Resource quotas for cost control
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    requests.cpu: "50"
    requests.memory: 100Gi
    limits.cpu: "100"
    limits.memory: 200Gi
    persistentvolumeclaims: "20"
    requests.storage: 500Gi
    pods: "50"
    services: "20"
    secrets: "50"
    configmaps: "50"

---
# Limit ranges for automatic resource assignment
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: production
spec:
  limits:
  - default:
      cpu: 500m
      memory: 512Mi
    defaultRequest:
      cpu: 100m
      memory: 128Mi
    type: Container
  - max:
      cpu: "4"
      memory: 8Gi
    min:
      cpu: 50m
      memory: 64Mi
    type: Container
  - max:
      storage: 100Gi
    min:
      storage: 1Gi
    type: PersistentVolumeClaim

---
# Pod Priority Classes for workload prioritization
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000
globalDefault: false
description: "High priority class for critical workloads"

---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: low-priority
value: 100
globalDefault: false
description: "Low priority class for batch workloads"
preemptionPolicy: PreemptLowerPriority
```

### Spot Instance Management
```yaml
# Node affinity for spot instances
apiVersion: apps/v1
kind: Deployment
metadata:
  name: batch-processor
spec:
  replicas: 5
  selector:
    matchLabels:
      app: batch-processor
  template:
    metadata:
      labels:
        app: batch-processor
    spec:
      priorityClassName: low-priority
      tolerations:
      - key: "spot-instance"
        operator: "Equal"
        value: "true"
        effect: "NoSchedule"
      - key: "kubernetes.azure.com/scalesetpriority"
        operator: "Equal"
        value: "spot"
        effect: "NoSchedule"
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            preference:
              matchExpressions:
              - key: node.kubernetes.io/instance-type
                operator: In
                values:
                - "m5.large"
                - "m5.xlarge"
              - key: kubernetes.io/arch
                operator: In
                values:
                - "amd64"
          - weight: 50
            preference:
              matchExpressions:
              - key: node.kubernetes.io/lifecycle
                operator: In
                values:
                - "spot"
      containers:
      - name: processor
        image: batch-processor:latest
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi

---
# Spot instance interruption handler
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: spot-interrupt-handler
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: spot-interrupt-handler
  template:
    metadata:
      labels:
        app: spot-interrupt-handler
    spec:
      tolerations:
      - operator: Exists
      hostNetwork: true
      containers:
      - name: spot-interrupt-handler
        image: amazon/aws-node-termination-handler:v1.17.0
        env:
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: SPOT_POD_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
        - name: DELETE_LOCAL_DATA
          value: "true"
        - name: IGNORE_DAEMON_SETS
          value: "true"
        - name: POD_TERMINATION_GRACE_PERIOD
          value: "30"
        - name: INSTANCE_METADATA_URL
          value: "http://169.254.169.254"
        - name: NODE_TERMINATION_GRACE_PERIOD
          value: "120"
        resources:
          limits:
            cpu: 100m
            memory: 128Mi
          requests:
            cpu: 50m
            memory: 64Mi
```

## Advanced GitOps Workflows

### ArgoCD Application of Applications Pattern
```yaml
# App of Apps pattern for GitOps
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: app-of-apps
  namespace: argocd
  finalizers:
  - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/company/k8s-platform
    targetRevision: main
    path: applications
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
    - CreateNamespace=true
    - PrunePropagationPolicy=foreground
    - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m

---
# Application for infrastructure components
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: infrastructure
  namespace: argocd
spec:
  project: platform
  source:
    repoURL: https://github.com/company/k8s-infrastructure
    targetRevision: main
    path: infrastructure
    helm:
      valueFiles:
      - values-production.yaml
      parameters:
      - name: global.environment
        value: production
      - name: monitoring.enabled
        value: "true"
  destination:
    server: https://kubernetes.default.svc
    namespace: infrastructure
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
    - ServerSideApply=true
  ignoreDifferences:
  - group: apps
    kind: Deployment
    jsonPointers:
    - /spec/replicas
  - group: v1
    kind: Service
    managedFieldsManagers:
    - external-dns

---
# Progressive delivery with Argo Rollouts
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: webapp-rollout
spec:
  replicas: 10
  strategy:
    canary:
      maxSurge: "25%"
      maxUnavailable: 1
      analysis:
        templates:
        - templateName: success-rate
        - templateName: latency
        args:
        - name: service-name
          value: webapp-canary
        startingStep: 2
        interval: 5m
      steps:
      - setWeight: 10
      - pause:
          duration: 5m
      - setWeight: 20
      - pause:
          duration: 5m
      - setWeight: 50
      - pause:
          duration: 10m
      - setWeight: 80
      - pause:
          duration: 10m
      trafficRouting:
        istio:
          virtualService:
            name: webapp-vs
            routes:
            - primary
          destinationRule:
            name: webapp-dr
            canarySubsetName: canary
            stableSubsetName: stable
      scaleDownDelaySeconds: 600

---
# Analysis template for success rate
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
spec:
  args:
  - name: service-name
  - name: prometheus-url
    value: http://prometheus.monitoring.svc.cluster.local:9090
  metrics:
  - name: success-rate
    interval: 2m
    count: 3
    successCondition: result[0] >= 0.95
    failureLimit: 2
    provider:
      prometheus:
        address: "{{args.prometheus-url}}"
        query: |
          sum(irate(
            istio_requests_total{reporter="source",destination_service_name=~"{{args.service-name}}",response_code!~"5.*"}[2m]
          )) /
          sum(irate(
            istio_requests_total{reporter="source",destination_service_name=~"{{args.service-name}}"}[2m]
          ))
  - name: latency
    interval: 2m
    count: 3
    successCondition: result[0] <= 500
    failureLimit: 2
    provider:
      prometheus:
        address: "{{args.prometheus-url}}"
        query: |
          histogram_quantile(0.95,
            sum(irate(
              istio_request_duration_milliseconds_bucket{reporter="source",destination_service_name=~"{{args.service-name}}"}[2m]
            )) by (le)
          )
```

## Troubleshooting and Debugging

### Advanced Debugging Tools
```yaml
# Debug pod with network tools
apiVersion: v1
kind: Pod
metadata:
  name: netshoot
  namespace: production
spec:
  containers:
  - name: netshoot
    image: nicolaka/netshoot:latest
    command: ["/bin/bash"]
    args: ["-c", "while true; do sleep 30; done;"]
    securityContext:
      capabilities:
        add: ["NET_ADMIN", "NET_RAW"]
    volumeMounts:
    - name: host-proc
      mountPath: /host/proc
      readOnly: true
    - name: host-sys
      mountPath: /host/sys
      readOnly: true
  volumes:
  - name: host-proc
    hostPath:
      path: /proc
  - name: host-sys
    hostPath:
      path: /sys
  nodeSelector:
    debug: "true"

---
# Debugging scripts ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: debug-scripts
  namespace: kube-system
data:
  node-debug.sh: |
    #!/bin/bash
    # Node debugging script

    echo "=== Node Information ==="
    kubectl get nodes -o wide

    echo "=== Node Resources ==="
    kubectl describe nodes

    echo "=== Pod Resources by Node ==="
    kubectl get pods --all-namespaces -o wide --field-selector spec.nodeName=$1

    echo "=== Node Events ==="
    kubectl get events --all-namespaces --field-selector involvedObject.kind=Node,involvedObject.name=$1

    echo "=== Kubelet Logs ==="
    kubectl logs -n kube-system -l component=kubelet --tail=100

  pod-debug.sh: |
    #!/bin/bash
    # Pod debugging script

    NAMESPACE=${1:-default}
    POD_NAME=${2}

    if [ -z "$POD_NAME" ]; then
      echo "Usage: $0 <namespace> <pod-name>"
      exit 1
    fi

    echo "=== Pod Description ==="
    kubectl describe pod $POD_NAME -n $NAMESPACE

    echo "=== Pod Events ==="
    kubectl get events -n $NAMESPACE --field-selector involvedObject.name=$POD_NAME

    echo "=== Pod Resources ==="
    kubectl top pod $POD_NAME -n $NAMESPACE

    echo "=== Container Logs ==="
    kubectl logs $POD_NAME -n $NAMESPACE --all-containers=true

    echo "=== Previous Container Logs ==="
    kubectl logs $POD_NAME -n $NAMESPACE --all-containers=true --previous || echo "No previous logs"

  network-debug.sh: |
    #!/bin/bash
    # Network debugging script

    echo "=== Network Policies ==="
    kubectl get networkpolicy --all-namespaces

    echo "=== Services ==="
    kubectl get svc --all-namespaces -o wide

    echo "=== Ingress ==="
    kubectl get ingress --all-namespaces

    echo "=== CNI Plugin Status ==="
    kubectl get pods -n kube-system -l app=calico-node
    kubectl get pods -n kube-system -l k8s-app=kube-dns

    echo "=== DNS Resolution Test ==="
    kubectl run test-dns --image=busybox:1.28 --rm -it --restart=Never -- nslookup kubernetes.default
```

### Performance Profiling
```yaml
# Performance profiling sidecar
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp-with-profiling
spec:
  replicas: 1
  selector:
    matchLabels:
      app: webapp
  template:
    metadata:
      labels:
        app: webapp
    spec:
      containers:
      - name: webapp
        image: myapp:latest
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 6060
          name: pprof
        env:
        - name: ENABLE_PPROF
          value: "true"
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 1000m
            memory: 512Mi
      - name: pprof-collector
        image: prom/pushgateway:latest
        ports:
        - containerPort: 9091
        args:
        - --web.listen-address=:9091
        - --persistence.file=/data/metrics
        - --persistence.interval=5m
        volumeMounts:
        - name: pprof-data
          mountPath: /data
      volumes:
      - name: pprof-data
        emptyDir: {}

---
# Custom metrics for profiling
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: webapp-profiling
spec:
  selector:
    matchLabels:
      app: webapp
  endpoints:
  - port: pprof
    path: /debug/pprof/profile
    interval: 30s
    params:
      seconds: ['30']
  - port: pprof
    path: /debug/pprof/heap
    interval: 30s
  - port: pprof
    path: /debug/pprof/goroutine
    interval: 30s
```

This comprehensive container orchestration skill enables expert-level containerization and Kubernetes deployment with production-ready security, monitoring, operational excellence, cost optimization, and advanced troubleshooting capabilities.
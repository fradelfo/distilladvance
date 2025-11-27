# DevSecOps & Security Automation Skill

Advanced DevSecOps and security automation expertise covering SAST/DAST integration, container security scanning, policy as code, compliance automation, and comprehensive security platform development with shift-left security practices.

## Skill Overview

Expert DevSecOps knowledge including security-first development practices, automated vulnerability scanning, container security hardening, compliance as code, security policy enforcement, incident response automation, and modern security platform engineering.

## Core Capabilities

### Security Testing Automation
- **SAST/DAST integration** - SonarQube, CodeQL, Checkmarx, OWASP ZAP, Burp Suite automation
- **Container security** - Trivy, Snyk, Twistlock, Aqua Security scanning and policy enforcement
- **Infrastructure scanning** - Terraform security, CloudFormation compliance, infrastructure vulnerability assessment
- **Dependency scanning** - npm audit, pip-audit, Dependabot, supply chain security analysis

### Policy as Code & Compliance
- **OPA/Gatekeeper** - Rego policies, Kubernetes admission controllers, policy testing
- **Sentinel policies** - HashiCorp policy enforcement, cost controls, security governance
- **Cloud security posture** - AWS Config, Azure Policy, GCP Organization Policies
- **Compliance frameworks** - SOC 2, ISO 27001, NIST, GDPR automation and reporting

### Secrets Management & Encryption
- **Secrets automation** - HashiCorp Vault, AWS Secrets Manager, Azure Key Vault integration
- **Certificate management** - Let's Encrypt automation, cert-manager, certificate rotation
- **Encryption at rest/transit** - KMS integration, TLS automation, data classification
- **Secret detection** - GitGuardian, TruffleHog, GitHub secret scanning integration

### Incident Response & Monitoring
- **Security monitoring** - SIEM integration, log analysis, threat detection automation
- **Incident automation** - PagerDuty integration, runbook automation, response workflows
- **Forensics tooling** - Evidence collection, artifact preservation, investigation automation
- **Threat intelligence** - IOC feeds, vulnerability databases, threat hunting automation

## Modern DevSecOps Platform Implementation

### Comprehensive DevSecOps Platform with Security Automation
```typescript
// Advanced DevSecOps platform with automated security scanning and policy enforcement
import express, { Express, Request, Response, NextFunction } from 'express';
import Docker from 'dockerode';
import { execSync, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import * as k8s from '@kubernetes/client-node';
import AWS from 'aws-sdk';
import { Octokit } from '@octokit/rest';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import axios from 'axios';
import nodemailer from 'nodemailer';
import cron from 'node-cron';

// Types and interfaces
interface DevSecOpsConfig {
  scanners: {
    sast: SastConfig;
    dast: DastConfig;
    container: ContainerScanConfig;
    infrastructure: InfraScanConfig;
    dependency: DependencyScanConfig;
  };
  vault: {
    url: string;
    token: string;
    namespace?: string;
  };
  kubernetes: {
    configFile?: string;
    namespace: string;
  };
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  notifications: {
    slack: {
      webhookUrl: string;
      channels: string[];
    };
    email: {
      smtp: {
        host: string;
        port: number;
        user: string;
        pass: string;
      };
      recipients: string[];
    };
  };
  compliance: {
    frameworks: string[];
    reportingSchedule: string;
    retentionPeriod: string;
  };
}

interface SastConfig {
  sonarqube: {
    url: string;
    token: string;
    projectKey: string;
  };
  codeql: {
    enabled: boolean;
    languages: string[];
  };
  eslint: {
    enabled: boolean;
    configFile: string;
  };
}

interface DastConfig {
  owaspZap: {
    url: string;
    apiKey: string;
  };
  burpSuite: {
    url: string;
    apiKey: string;
  };
  targets: string[];
}

interface ContainerScanConfig {
  trivy: {
    enabled: boolean;
    dbUpdateSchedule: string;
  };
  snyk: {
    token: string;
    enabled: boolean;
  };
  dockerBench: {
    enabled: boolean;
  };
}

interface InfraScanConfig {
  checkov: {
    enabled: boolean;
    configFile: string;
  };
  tfsec: {
    enabled: boolean;
  };
  kics: {
    enabled: boolean;
  };
}

interface DependencyScanConfig {
  npmAudit: {
    enabled: boolean;
    auditLevel: 'low' | 'moderate' | 'high' | 'critical';
  };
  snyk: {
    enabled: boolean;
    token: string;
  };
  githubSecurity: {
    enabled: boolean;
    token: string;
  };
}

interface SecurityScan {
  id: string;
  type: 'sast' | 'dast' | 'container' | 'infrastructure' | 'dependency';
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  findings: SecurityFinding[];
  metadata: Record<string, any>;
}

interface SecurityFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  category: string;
  cwe?: string;
  cve?: string;
  location: {
    file?: string;
    line?: number;
    column?: number;
    url?: string;
    container?: string;
  };
  remediation?: string;
  references: string[];
  falsePositive: boolean;
  suppressedUntil?: Date;
  suppressedBy?: string;
  suppressedReason?: string;
}

interface PolicyRule {
  id: string;
  name: string;
  description: string;
  framework: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule: string; // OPA Rego policy
  enabled: boolean;
  exceptions: string[];
  metadata: Record<string, any>;
}

interface ComplianceReport {
  id: string;
  framework: string;
  generatedAt: Date;
  period: { start: Date; end: Date };
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    skipped: number;
    score: number;
  };
  findings: ComplianceFinding[];
  recommendations: string[];
}

interface ComplianceFinding {
  checkId: string;
  control: string;
  status: 'pass' | 'fail' | 'skip';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  evidence: any[];
  remediation: string;
}

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignee?: string;
  findings: SecurityFinding[];
  timeline: IncidentTimelineEvent[];
  createdAt: Date;
  updatedAt: Date;
}

interface IncidentTimelineEvent {
  timestamp: Date;
  actor: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
}

// Core DevSecOps Platform
class DevSecOpsPlatform {
  private config: DevSecOpsConfig;
  private docker: Docker;
  private k8sApi: k8s.CoreV1Api;
  private k8sAppsApi: k8s.AppsV1Api;
  private redis: Redis;
  private logger: Logger;
  private app: Express;

  // Scanners
  private activeScanners: Map<string, any> = new Map();
  private scanQueue: SecurityScan[] = [];
  private scanResults: Map<string, SecurityScan> = new Map();

  // Policy Engine
  private policies: Map<string, PolicyRule> = new Map();
  private policyViolations: SecurityFinding[] = [];

  // Vault Integration
  private vaultClient: any;

  // AWS Services
  private aws: AWS.Config;
  private secretsManager: AWS.SecretsManager;
  private securityHub: AWS.SecurityHub;

  // Metrics and Monitoring
  private securityMetrics: Map<string, number> = new Map();
  private incidents: Map<string, SecurityIncident> = new Map();

  constructor(config: DevSecOpsConfig) {
    this.config = config;

    // Initialize Docker
    this.docker = new Docker({
      socketPath: '/var/run/docker.sock',
    });

    // Initialize Kubernetes
    const kc = new k8s.KubeConfig();
    if (config.kubernetes.configFile) {
      kc.loadFromFile(config.kubernetes.configFile);
    } else {
      kc.loadFromDefault();
    }
    this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    this.k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);

    // Initialize Redis
    this.redis = new Redis(process.env.REDIS_URL);

    // Initialize AWS
    this.aws = AWS.config.update({
      region: config.aws.region,
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    });
    this.secretsManager = new AWS.SecretsManager();
    this.securityHub = new AWS.SecurityHub();

    // Initialize Express
    this.app = express();

    // Initialize Logger
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.Console({ format: format.simple() }),
        new transports.File({ filename: 'devsecops-platform.log' })
      ]
    });

    this.setupExpress();
    this.setupVaultIntegration();
    this.setupPolicyEngine();
    this.setupMetrics();
    this.scheduleScans();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize scanners
      await this.initializeScanners();

      // Load default policies
      await this.loadDefaultPolicies();

      // Setup Kubernetes admission controllers
      await this.setupAdmissionControllers();

      // Start background tasks
      this.startScanProcessor();
      this.startPolicyEvaluator();
      this.startIncidentProcessor();

      this.logger.info('DevSecOps platform initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize DevSecOps platform', { error });
      throw error;
    }
  }

  // Security Scanning
  async scanCode(repository: string, branch: string = 'main'): Promise<string> {
    const scanId = uuidv4();
    const scan: SecurityScan = {
      id: scanId,
      type: 'sast',
      target: `${repository}:${branch}`,
      status: 'pending',
      startedAt: new Date(),
      findings: [],
      metadata: { repository, branch },
    };

    this.scanQueue.push(scan);
    this.scanResults.set(scanId, scan);

    this.logger.info('SAST scan queued', { scanId, repository, branch });
    return scanId;
  }

  async scanContainer(imageTag: string): Promise<string> {
    const scanId = uuidv4();
    const scan: SecurityScan = {
      id: scanId,
      type: 'container',
      target: imageTag,
      status: 'pending',
      startedAt: new Date(),
      findings: [],
      metadata: { imageTag },
    };

    this.scanQueue.push(scan);
    this.scanResults.set(scanId, scan);

    this.logger.info('Container scan queued', { scanId, imageTag });
    return scanId;
  }

  async scanInfrastructure(terraformPath: string): Promise<string> {
    const scanId = uuidv4();
    const scan: SecurityScan = {
      id: scanId,
      type: 'infrastructure',
      target: terraformPath,
      status: 'pending',
      startedAt: new Date(),
      findings: [],
      metadata: { terraformPath },
    };

    this.scanQueue.push(scan);
    this.scanResults.set(scanId, scan);

    this.logger.info('Infrastructure scan queued', { scanId, terraformPath });
    return scanId;
  }

  async scanApplication(url: string): Promise<string> {
    const scanId = uuidv4();
    const scan: SecurityScan = {
      id: scanId,
      type: 'dast',
      target: url,
      status: 'pending',
      startedAt: new Date(),
      findings: [],
      metadata: { url },
    };

    this.scanQueue.push(scan);
    this.scanResults.set(scanId, scan);

    this.logger.info('DAST scan queued', { scanId, url });
    return scanId;
  }

  // SAST Scanning Implementation
  private async runSastScan(scan: SecurityScan): Promise<void> {
    const { repository, branch } = scan.metadata;

    try {
      scan.status = 'running';

      // Clone repository
      const tempDir = `/tmp/scan-${scan.id}`;
      execSync(`git clone -b ${branch} ${repository} ${tempDir}`, { stdio: 'inherit' });

      const findings: SecurityFinding[] = [];

      // SonarQube scan
      if (this.config.scanners.sast.sonarqube) {
        const sonarFindings = await this.runSonarQubeScan(tempDir, scan.id);
        findings.push(...sonarFindings);
      }

      // CodeQL scan
      if (this.config.scanners.sast.codeql.enabled) {
        const codeqlFindings = await this.runCodeQLScan(tempDir);
        findings.push(...codeqlFindings);
      }

      // ESLint security scan
      if (this.config.scanners.sast.eslint.enabled) {
        const eslintFindings = await this.runESLintSecurityScan(tempDir);
        findings.push(...eslintFindings);
      }

      scan.findings = findings;
      scan.status = 'completed';
      scan.completedAt = new Date();

      // Cleanup
      execSync(`rm -rf ${tempDir}`, { stdio: 'inherit' });

      this.updateMetrics(scan);
      await this.processFindings(scan);
    } catch (error) {
      scan.status = 'failed';
      scan.metadata.error = error.message;
      this.logger.error('SAST scan failed', { scanId: scan.id, error });
    }
  }

  private async runSonarQubeScan(projectPath: string, scanId: string): Promise<SecurityFinding[]> {
    const { url, token, projectKey } = this.config.scanners.sast.sonarqube;
    const findings: SecurityFinding[] = [];

    try {
      // Run SonarQube scanner
      execSync(
        `sonar-scanner -Dsonar.projectKey=${projectKey}-${scanId} -Dsonar.host.url=${url} -Dsonar.login=${token} -Dsonar.sources=${projectPath}`,
        { stdio: 'inherit' }
      );

      // Get results from SonarQube API
      const response = await axios.get(
        `${url}/api/issues/search?componentKeys=${projectKey}-${scanId}&severities=BLOCKER,CRITICAL,MAJOR`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      for (const issue of response.data.issues) {
        findings.push({
          id: issue.key,
          severity: this.mapSonarSeverity(issue.severity),
          title: issue.rule,
          description: issue.message,
          category: 'Code Quality',
          location: {
            file: issue.component.split(':').pop(),
            line: issue.textRange?.startLine,
            column: issue.textRange?.startOffset,
          },
          remediation: issue.rule,
          references: [`${url}/coding_rules?rule_key=${issue.rule}`],
          falsePositive: false,
        });
      }
    } catch (error) {
      this.logger.error('SonarQube scan error', { error });
    }

    return findings;
  }

  private async runCodeQLScan(projectPath: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    try {
      // Create CodeQL database
      const dbPath = `/tmp/codeql-db-${Date.now()}`;
      execSync(`codeql database create ${dbPath} --language=javascript --source-root=${projectPath}`, { stdio: 'inherit' });

      // Run analysis
      const resultsPath = `/tmp/codeql-results-${Date.now()}.sarif`;
      execSync(`codeql database analyze ${dbPath} --format=sarif-latest --output=${resultsPath}`, { stdio: 'inherit' });

      // Parse SARIF results
      const sarif = JSON.parse(await fs.readFile(resultsPath, 'utf-8'));

      for (const run of sarif.runs) {
        for (const result of run.results) {
          findings.push({
            id: uuidv4(),
            severity: this.mapCodeQLSeverity(result.level),
            title: result.ruleId,
            description: result.message.text,
            category: 'Security',
            cwe: result.rule?.properties?.['security-severity'],
            location: {
              file: result.locations[0]?.physicalLocation?.artifactLocation?.uri,
              line: result.locations[0]?.physicalLocation?.region?.startLine,
              column: result.locations[0]?.physicalLocation?.region?.startColumn,
            },
            references: result.rule?.helpUri ? [result.rule.helpUri] : [],
            falsePositive: false,
          });
        }
      }

      // Cleanup
      execSync(`rm -rf ${dbPath} ${resultsPath}`, { stdio: 'inherit' });
    } catch (error) {
      this.logger.error('CodeQL scan error', { error });
    }

    return findings;
  }

  // Container Security Scanning
  private async runContainerScan(scan: SecurityScan): Promise<void> {
    const { imageTag } = scan.metadata;

    try {
      scan.status = 'running';
      const findings: SecurityFinding[] = [];

      // Trivy scan
      if (this.config.scanners.container.trivy.enabled) {
        const trivyFindings = await this.runTrivyScan(imageTag);
        findings.push(...trivyFindings);
      }

      // Snyk scan
      if (this.config.scanners.container.snyk.enabled) {
        const snykFindings = await this.runSnykContainerScan(imageTag);
        findings.push(...snykFindings);
      }

      // Docker Bench scan
      if (this.config.scanners.container.dockerBench.enabled) {
        const benchFindings = await this.runDockerBenchScan(imageTag);
        findings.push(...benchFindings);
      }

      scan.findings = findings;
      scan.status = 'completed';
      scan.completedAt = new Date();

      this.updateMetrics(scan);
      await this.processFindings(scan);
    } catch (error) {
      scan.status = 'failed';
      scan.metadata.error = error.message;
      this.logger.error('Container scan failed', { scanId: scan.id, error });
    }
  }

  private async runTrivyScan(imageTag: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    try {
      const resultsPath = `/tmp/trivy-results-${Date.now()}.json`;
      execSync(`trivy image --format json --output ${resultsPath} ${imageTag}`, { stdio: 'inherit' });

      const results = JSON.parse(await fs.readFile(resultsPath, 'utf-8'));

      for (const result of results.Results || []) {
        for (const vulnerability of result.Vulnerabilities || []) {
          findings.push({
            id: vulnerability.VulnerabilityID,
            severity: vulnerability.Severity.toLowerCase(),
            title: `${vulnerability.VulnerabilityID}: ${vulnerability.Title}`,
            description: vulnerability.Description,
            category: 'Container Security',
            cve: vulnerability.VulnerabilityID,
            location: {
              container: imageTag,
              file: result.Target,
            },
            remediation: vulnerability.FixedVersion ? `Update to ${vulnerability.FixedVersion}` : 'No fix available',
            references: vulnerability.References || [],
            falsePositive: false,
          });
        }
      }

      execSync(`rm -f ${resultsPath}`, { stdio: 'inherit' });
    } catch (error) {
      this.logger.error('Trivy scan error', { error });
    }

    return findings;
  }

  // Infrastructure Security Scanning
  private async runInfrastructureScan(scan: SecurityScan): Promise<void> {
    const { terraformPath } = scan.metadata;

    try {
      scan.status = 'running';
      const findings: SecurityFinding[] = [];

      // Checkov scan
      if (this.config.scanners.infrastructure.checkov.enabled) {
        const checkovFindings = await this.runCheckovScan(terraformPath);
        findings.push(...checkovFindings);
      }

      // tfsec scan
      if (this.config.scanners.infrastructure.tfsec.enabled) {
        const tfsecFindings = await this.runTfsecScan(terraformPath);
        findings.push(...tfsecFindings);
      }

      // KICS scan
      if (this.config.scanners.infrastructure.kics.enabled) {
        const kicsFindings = await this.runKicsScan(terraformPath);
        findings.push(...kicsFindings);
      }

      scan.findings = findings;
      scan.status = 'completed';
      scan.completedAt = new Date();

      this.updateMetrics(scan);
      await this.processFindings(scan);
    } catch (error) {
      scan.status = 'failed';
      scan.metadata.error = error.message;
      this.logger.error('Infrastructure scan failed', { scanId: scan.id, error });
    }
  }

  // Policy Engine
  private async setupPolicyEngine(): Promise<void> {
    // Initialize OPA policies for different frameworks
    const policies = [
      {
        id: 'pod-security-policy',
        name: 'Pod Security Policy',
        description: 'Enforce pod security standards',
        framework: 'kubernetes',
        category: 'security',
        severity: 'high' as const,
        rule: `
          package kubernetes.admission

          deny[msg] {
            input.request.kind.kind == "Pod"
            input.request.object.spec.containers[_].securityContext.privileged
            msg := "Privileged containers are not allowed"
          }

          deny[msg] {
            input.request.kind.kind == "Pod"
            not input.request.object.spec.containers[_].securityContext.runAsNonRoot
            msg := "Containers must run as non-root user"
          }
        `,
        enabled: true,
        exceptions: [],
        metadata: {},
      },
      {
        id: 'aws-s3-encryption',
        name: 'S3 Bucket Encryption',
        description: 'Ensure S3 buckets have encryption enabled',
        framework: 'aws',
        category: 'encryption',
        severity: 'critical' as const,
        rule: `
          package terraform.analysis

          deny[msg] {
            input.resource_type == "aws_s3_bucket"
            not input.server_side_encryption_configuration
            msg := "S3 bucket must have server-side encryption enabled"
          }
        `,
        enabled: true,
        exceptions: [],
        metadata: {},
      },
    ];

    for (const policy of policies) {
      this.policies.set(policy.id, policy);
    }

    this.logger.info('Policy engine initialized', { policyCount: policies.length });
  }

  async evaluatePolicy(policyId: string, input: any): Promise<{ violations: string[]; allowed: boolean }> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    try {
      // In a real implementation, this would use OPA or another policy engine
      // For now, we'll do a simplified evaluation
      const violations: string[] = [];
      let allowed = true;

      // Simplified policy evaluation (in production, use OPA)
      if (policyId === 'pod-security-policy' && input.kind === 'Pod') {
        if (input.spec?.containers?.some((c: any) => c.securityContext?.privileged)) {
          violations.push('Privileged containers are not allowed');
          allowed = false;
        }
        if (!input.spec?.containers?.every((c: any) => c.securityContext?.runAsNonRoot)) {
          violations.push('Containers must run as non-root user');
          allowed = false;
        }
      }

      return { violations, allowed };
    } catch (error) {
      this.logger.error('Policy evaluation error', { policyId, error });
      return { violations: ['Policy evaluation failed'], allowed: false };
    }
  }

  // Kubernetes Admission Controller
  private async setupAdmissionControllers(): Promise<void> {
    // Setup webhook for admission control
    this.app.post('/admission-webhook', async (req: Request, res: Response) => {
      const admissionRequest = req.body;

      try {
        const violations: string[] = [];

        // Evaluate all enabled policies
        for (const [policyId, policy] of this.policies) {
          if (policy.enabled && policy.framework === 'kubernetes') {
            const evaluation = await this.evaluatePolicy(policyId, admissionRequest.request.object);
            violations.push(...evaluation.violations);
          }
        }

        const allowed = violations.length === 0;

        if (!allowed) {
          await this.createSecurityIncident({
            title: 'Policy Violation in Kubernetes Admission',
            description: `Policy violations detected: ${violations.join(', ')}`,
            severity: 'high',
            findings: violations.map(v => ({
              id: uuidv4(),
              severity: 'high' as const,
              title: 'Policy Violation',
              description: v,
              category: 'Policy',
              location: { container: 'kubernetes' },
              references: [],
              falsePositive: false,
            })),
          });
        }

        const response = {
          apiVersion: 'admission.k8s.io/v1',
          kind: 'AdmissionResponse',
          response: {
            uid: admissionRequest.request.uid,
            allowed,
            status: {
              message: violations.join('; '),
            },
          },
        };

        res.json(response);
      } catch (error) {
        this.logger.error('Admission controller error', { error });
        res.status(500).json({
          apiVersion: 'admission.k8s.io/v1',
          kind: 'AdmissionResponse',
          response: {
            uid: admissionRequest.request.uid,
            allowed: false,
            status: {
              message: 'Internal server error',
            },
          },
        });
      }
    });
  }

  // Compliance Reporting
  async generateComplianceReport(framework: string): Promise<ComplianceReport> {
    const reportId = uuidv4();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      const findings: ComplianceFinding[] = [];
      let totalChecks = 0;
      let passed = 0;
      let failed = 0;

      // Collect findings from recent scans
      for (const [_, scan] of this.scanResults) {
        if (scan.startedAt >= thirtyDaysAgo) {
          for (const finding of scan.findings) {
            const mappedControl = this.mapFindingToComplianceControl(finding, framework);
            if (mappedControl) {
              findings.push({
                checkId: finding.id,
                control: mappedControl,
                status: finding.severity === 'critical' || finding.severity === 'high' ? 'fail' : 'pass',
                severity: finding.severity,
                description: finding.description,
                evidence: [finding],
                remediation: finding.remediation || 'No remediation available',
              });
              totalChecks++;
              if (findings[findings.length - 1].status === 'pass') {
                passed++;
              } else {
                failed++;
              }
            }
          }
        }
      }

      const score = totalChecks > 0 ? Math.round((passed / totalChecks) * 100) : 100;

      const report: ComplianceReport = {
        id: reportId,
        framework,
        generatedAt: now,
        period: { start: thirtyDaysAgo, end: now },
        summary: {
          totalChecks,
          passed,
          failed,
          skipped: 0,
          score,
        },
        findings,
        recommendations: this.generateRecommendations(findings),
      };

      // Store report
      await this.storeComplianceReport(report);

      this.logger.info('Compliance report generated', {
        reportId,
        framework,
        score,
        totalChecks,
      });

      return report;
    } catch (error) {
      this.logger.error('Failed to generate compliance report', { framework, error });
      throw error;
    }
  }

  // Incident Management
  async createSecurityIncident(incident: {
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    findings: SecurityFinding[];
    assignee?: string;
  }): Promise<string> {
    const incidentId = uuidv4();
    const securityIncident: SecurityIncident = {
      id: incidentId,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      status: 'open',
      assignee: incident.assignee,
      findings: incident.findings,
      timeline: [
        {
          timestamp: new Date(),
          actor: 'system',
          action: 'created',
          description: 'Security incident created automatically',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.incidents.set(incidentId, securityIncident);

    // Send notifications
    await this.sendSecurityNotification(securityIncident);

    // Auto-assign if high/critical severity
    if (incident.severity === 'critical' || incident.severity === 'high') {
      await this.autoAssignIncident(incidentId);
    }

    this.logger.warn('Security incident created', {
      incidentId,
      title: incident.title,
      severity: incident.severity,
      findingsCount: incident.findings.length,
    });

    return incidentId;
  }

  // Utility Methods
  private async initializeScanners(): Promise<void> {
    // Initialize scanner configurations
    // This would setup API clients, validate configurations, etc.
    this.logger.info('Security scanners initialized');
  }

  private async loadDefaultPolicies(): Promise<void> {
    // Load additional policies from files or external sources
    this.logger.info('Default security policies loaded');
  }

  private startScanProcessor(): void {
    // Process scan queue
    setInterval(async () => {
      if (this.scanQueue.length > 0) {
        const scan = this.scanQueue.shift()!;

        switch (scan.type) {
          case 'sast':
            await this.runSastScan(scan);
            break;
          case 'container':
            await this.runContainerScan(scan);
            break;
          case 'infrastructure':
            await this.runInfrastructureScan(scan);
            break;
          case 'dast':
            await this.runDastScan(scan);
            break;
          case 'dependency':
            await this.runDependencyScan(scan);
            break;
        }
      }
    }, 5000);
  }

  private startPolicyEvaluator(): void {
    // Regular policy evaluation
    cron.schedule('0 */6 * * *', async () => {
      await this.evaluateAllPolicies();
    });
  }

  private startIncidentProcessor(): void {
    // Process and escalate incidents
    cron.schedule('*/15 * * * *', async () => {
      await this.processIncidentEscalation();
    });
  }

  private updateMetrics(scan: SecurityScan): void {
    this.securityMetrics.set(`scans_${scan.type}_total`,
      (this.securityMetrics.get(`scans_${scan.type}_total`) || 0) + 1);

    const criticalFindings = scan.findings.filter(f => f.severity === 'critical').length;
    this.securityMetrics.set('critical_findings_total',
      (this.securityMetrics.get('critical_findings_total') || 0) + criticalFindings);
  }

  private async processFindings(scan: SecurityScan): Promise<void> {
    const criticalFindings = scan.findings.filter(f => f.severity === 'critical');
    const highFindings = scan.findings.filter(f => f.severity === 'high');

    if (criticalFindings.length > 0) {
      await this.createSecurityIncident({
        title: `Critical Security Findings in ${scan.type.toUpperCase()} Scan`,
        description: `${criticalFindings.length} critical findings detected in ${scan.target}`,
        severity: 'critical',
        findings: criticalFindings,
      });
    } else if (highFindings.length > 0) {
      await this.createSecurityIncident({
        title: `High Priority Security Findings in ${scan.type.toUpperCase()} Scan`,
        description: `${highFindings.length} high priority findings detected in ${scan.target}`,
        severity: 'high',
        findings: highFindings,
      });
    }
  }

  private setupExpress(): void {
    this.app.use(express.json());

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date(),
        metrics: Object.fromEntries(this.securityMetrics),
      });
    });

    // Security scan endpoints
    this.app.post('/scans/code', async (req: Request, res: Response) => {
      const { repository, branch } = req.body;
      const scanId = await this.scanCode(repository, branch);
      res.json({ scanId, status: 'queued' });
    });

    this.app.post('/scans/container', async (req: Request, res: Response) => {
      const { imageTag } = req.body;
      const scanId = await this.scanContainer(imageTag);
      res.json({ scanId, status: 'queued' });
    });

    this.app.get('/scans/:scanId', (req: Request, res: Response) => {
      const scan = this.scanResults.get(req.params.scanId);
      if (scan) {
        res.json(scan);
      } else {
        res.status(404).json({ error: 'Scan not found' });
      }
    });
  }

  private setupVaultIntegration(): void {
    // Initialize HashiCorp Vault client
    // This would setup the vault client for secret management
  }

  private setupMetrics(): void {
    this.securityMetrics.set('scans_sast_total', 0);
    this.securityMetrics.set('scans_dast_total', 0);
    this.securityMetrics.set('scans_container_total', 0);
    this.securityMetrics.set('scans_infrastructure_total', 0);
    this.securityMetrics.set('critical_findings_total', 0);
    this.securityMetrics.set('incidents_total', 0);
  }

  private scheduleScans(): void {
    // Schedule automated security scans
    cron.schedule('0 2 * * *', async () => {
      // Daily infrastructure scans
      await this.runScheduledScans('infrastructure');
    });

    cron.schedule('0 0 * * 0', async () => {
      // Weekly full scans
      await this.runScheduledScans('full');
    });
  }

  // Placeholder implementations for missing methods
  private async runESLintSecurityScan(tempDir: string): Promise<SecurityFinding[]> {
    return [];
  }

  private mapSonarSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const mapping: Record<string, any> = {
      'BLOCKER': 'critical',
      'CRITICAL': 'critical',
      'MAJOR': 'high',
      'MINOR': 'medium',
      'INFO': 'info',
    };
    return mapping[severity] || 'medium';
  }

  private mapCodeQLSeverity(level: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const mapping: Record<string, any> = {
      'error': 'critical',
      'warning': 'medium',
      'note': 'low',
    };
    return mapping[level] || 'medium';
  }

  private async runSnykContainerScan(imageTag: string): Promise<SecurityFinding[]> {
    return [];
  }

  private async runDockerBenchScan(imageTag: string): Promise<SecurityFinding[]> {
    return [];
  }

  private async runCheckovScan(terraformPath: string): Promise<SecurityFinding[]> {
    return [];
  }

  private async runTfsecScan(terraformPath: string): Promise<SecurityFinding[]> {
    return [];
  }

  private async runKicsScan(terraformPath: string): Promise<SecurityFinding[]> {
    return [];
  }

  private async runDastScan(scan: SecurityScan): Promise<void> {
    // DAST scan implementation
  }

  private async runDependencyScan(scan: SecurityScan): Promise<void> {
    // Dependency scan implementation
  }

  private async evaluateAllPolicies(): Promise<void> {
    // Evaluate all policies against current infrastructure
  }

  private async processIncidentEscalation(): Promise<void> {
    // Process incident escalation logic
  }

  private mapFindingToComplianceControl(finding: SecurityFinding, framework: string): string | null {
    // Map security findings to compliance framework controls
    return null;
  }

  private generateRecommendations(findings: ComplianceFinding[]): string[] {
    return ['Review and address high-priority findings', 'Update security policies'];
  }

  private async storeComplianceReport(report: ComplianceReport): Promise<void> {
    // Store compliance report in database
  }

  private async sendSecurityNotification(incident: SecurityIncident): Promise<void> {
    // Send notifications via Slack, email, etc.
  }

  private async autoAssignIncident(incidentId: string): Promise<void> {
    // Auto-assign incidents based on severity and team availability
  }

  private async runScheduledScans(type: string): Promise<void> {
    // Run scheduled security scans
  }

  public start(port: number = 3000): void {
    this.app.listen(port, () => {
      this.logger.info(`DevSecOps platform running on port ${port}`);
    });
  }
}

// Example usage
export async function createDevSecOpsExample(): Promise<void> {
  const config: DevSecOpsConfig = {
    scanners: {
      sast: {
        sonarqube: {
          url: 'http://localhost:9000',
          token: process.env.SONARQUBE_TOKEN!,
          projectKey: 'my-project',
        },
        codeql: {
          enabled: true,
          languages: ['javascript', 'typescript', 'python'],
        },
        eslint: {
          enabled: true,
          configFile: '.eslintrc.security.js',
        },
      },
      dast: {
        owaspZap: {
          url: 'http://localhost:8080',
          apiKey: process.env.ZAP_API_KEY!,
        },
        burpSuite: {
          url: 'http://localhost:1337',
          apiKey: process.env.BURP_API_KEY!,
        },
        targets: ['https://app.example.com'],
      },
      container: {
        trivy: {
          enabled: true,
          dbUpdateSchedule: '0 2 * * *',
        },
        snyk: {
          token: process.env.SNYK_TOKEN!,
          enabled: true,
        },
        dockerBench: {
          enabled: true,
        },
      },
      infrastructure: {
        checkov: {
          enabled: true,
          configFile: '.checkov.yml',
        },
        tfsec: {
          enabled: true,
        },
        kics: {
          enabled: true,
        },
      },
      dependency: {
        npmAudit: {
          enabled: true,
          auditLevel: 'high',
        },
        snyk: {
          enabled: true,
          token: process.env.SNYK_TOKEN!,
        },
        githubSecurity: {
          enabled: true,
          token: process.env.GITHUB_TOKEN!,
        },
      },
    },
    vault: {
      url: 'http://localhost:8200',
      token: process.env.VAULT_TOKEN!,
    },
    kubernetes: {
      namespace: 'security',
    },
    aws: {
      region: 'us-west-2',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    notifications: {
      slack: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL!,
        channels: ['#security', '#devops'],
      },
      email: {
        smtp: {
          host: 'smtp.example.com',
          port: 587,
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!,
        },
        recipients: ['security@example.com'],
      },
    },
    compliance: {
      frameworks: ['SOC2', 'ISO27001', 'NIST'],
      reportingSchedule: '0 0 * * 1', // Weekly
      retentionPeriod: '2y',
    },
  };

  const platform = new DevSecOpsPlatform(config);
  await platform.initialize();

  // Example scans
  await platform.scanCode('https://github.com/example/repo', 'main');
  await platform.scanContainer('nginx:latest');
  await platform.scanInfrastructure('./terraform');
  await platform.scanApplication('https://app.example.com');

  platform.start(3000);
}

export { DevSecOpsPlatform, DevSecOpsConfig };
```

## Skill Activation Triggers

This skill automatically activates when:
- Security automation and DevSecOps implementation is needed
- SAST/DAST integration and vulnerability scanning is required
- Container security hardening and compliance is requested
- Policy as code and governance automation is needed
- Security incident response and threat detection is required
- Compliance reporting and audit automation is requested

This comprehensive DevSecOps and security automation skill provides expert-level capabilities for building modern, secure development platforms with advanced features for vulnerability management, policy enforcement, and compliance automation.
# Infrastructure as Code (IaC) Skill

Advanced Infrastructure as Code expertise covering Terraform modules, Pulumi deployments, cloud-native automation, GitOps workflows, and comprehensive infrastructure platform development with modern tools and practices.

## Skill Overview

Expert IaC knowledge including infrastructure automation, declarative configuration management, multi-cloud deployments, state management, GitOps implementation, policy as code, and modern infrastructure platform engineering.

## Core Capabilities

### Terraform Ecosystem & Modules
- **Terraform Core** - Module design, state management, provider configuration, workspace strategies
- **Terraform Cloud** - Remote state, policy as code, sentinel policies, cost estimation
- **Module development** - Reusable modules, versioning, testing, documentation patterns
- **Advanced patterns** - Dynamic configuration, meta-arguments, for_each, conditional logic

### Multi-Cloud & Modern IaC
- **Pulumi** - TypeScript/Python/Go infrastructure, component architecture, automation API
- **AWS CDK** - CloudFormation synthesis, constructs library, CDK for Terraform
- **Crossplane** - Kubernetes-native infrastructure, composite resources, composition functions
- **OpenTofu** - Open-source Terraform fork, compatibility, migration strategies

### GitOps & Automation
- **ArgoCD/FluxCD** - GitOps workflows, application deployment, progressive delivery
- **Atlantis** - Pull request automation, plan/apply workflows, policy enforcement
- **CI/CD integration** - Pipeline automation, testing, validation, drift detection
- **Configuration management** - Helm charts, Kustomize, templating strategies

### Policy & Compliance
- **OPA/Gatekeeper** - Policy as code, admission controllers, compliance automation
- **Sentinel policies** - Cost controls, security policies, governance frameworks
- **Security scanning** - Checkov, tfsec, infrastructure security validation
- **Compliance frameworks** - SOC 2, PCI DSS, HIPAA infrastructure requirements

## Modern Infrastructure as Code Implementation

### Comprehensive IaC Platform with Terraform and Pulumi
```typescript
// Advanced Infrastructure as Code platform with multi-cloud support
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as azure from '@pulumi/azure-native';
import * as gcp from '@pulumi/gcp';
import * as k8s from '@pulumi/kubernetes';
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Octokit } from '@octokit/rest';
import axios from 'axios';

// Types and interfaces
interface InfrastructureConfig {
  project: string;
  environment: string;
  region: string;
  cloud: 'aws' | 'azure' | 'gcp' | 'multi-cloud';
  networking: {
    vpcCidr: string;
    subnets: SubnetConfig[];
    enableNatGateway: boolean;
    enableVpnGateway: boolean;
  };
  kubernetes: {
    enabled: boolean;
    version: string;
    nodeGroups: NodeGroupConfig[];
    addons: string[];
  };
  monitoring: {
    enabled: boolean;
    retention: string;
    alerting: boolean;
  };
  security: {
    enableWaf: boolean;
    sslCertificates: string[];
    secrets: SecretConfig[];
  };
  backup: {
    enabled: boolean;
    retention: string;
    crossRegion: boolean;
  };
}

interface SubnetConfig {
  name: string;
  cidr: string;
  type: 'public' | 'private';
  availabilityZone: string;
}

interface NodeGroupConfig {
  name: string;
  instanceType: string;
  minSize: number;
  maxSize: number;
  desiredSize: number;
  labels: Record<string, string>;
  taints: TaintConfig[];
}

interface TaintConfig {
  key: string;
  value: string;
  effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
}

interface SecretConfig {
  name: string;
  type: 'database' | 'api-key' | 'certificate' | 'generic';
  rotation: boolean;
  rotationPeriod?: string;
}

interface TerraformModule {
  name: string;
  source: string;
  version: string;
  variables: Record<string, any>;
  providers: string[];
}

interface GitOpsConfig {
  repository: string;
  branch: string;
  path: string;
  syncPolicy: 'manual' | 'automated';
  pruning: boolean;
  selfHeal: boolean;
}

// Core Infrastructure Platform
class InfrastructurePlatform {
  private config: InfrastructureConfig;
  private pulumiStack: pulumi.automation.LocalWorkspace;
  private terraformModules: Map<string, TerraformModule> = new Map();
  private gitOpsConfig: GitOpsConfig;
  private outputs: Map<string, any> = new Map();

  constructor(config: InfrastructureConfig, gitOpsConfig: GitOpsConfig) {
    this.config = config;
    this.gitOpsConfig = gitOpsConfig;
  }

  async initialize(): Promise<void> {
    // Initialize Pulumi workspace
    this.pulumiStack = await pulumi.automation.LocalWorkspace.createOrSelectStack({
      stackName: `${this.config.project}-${this.config.environment}`,
      projectName: this.config.project,
      workDir: './infrastructure',
    });

    await this.setupTerraformModules();
    await this.validateConfiguration();

    console.log(`Infrastructure platform initialized for ${this.config.project}`);
  }

  // Multi-Cloud Infrastructure Deployment
  async deployInfrastructure(): Promise<Map<string, any>> {
    const infrastructure = await this.createInfrastructureStack();

    // Deploy with Pulumi
    const upResult = await this.pulumiStack.up({
      onOutput: (output) => {
        console.log(`Pulumi: ${output}`);
      },
    });

    // Store outputs
    for (const [key, value] of Object.entries(upResult.outputs)) {
      this.outputs.set(key, value.value);
    }

    // Deploy Terraform modules
    for (const [name, module] of this.terraformModules) {
      await this.deployTerraformModule(name, module);
    }

    // Setup GitOps
    await this.setupGitOps();

    return this.outputs;
  }

  private async createInfrastructureStack(): Promise<any> {
    const infraProgram = async () => {
      const resources: any = {};

      switch (this.config.cloud) {
        case 'aws':
          resources.aws = await this.createAWSInfrastructure();
          break;
        case 'azure':
          resources.azure = await this.createAzureInfrastructure();
          break;
        case 'gcp':
          resources.gcp = await this.createGCPInfrastructure();
          break;
        case 'multi-cloud':
          resources.aws = await this.createAWSInfrastructure();
          resources.azure = await this.createAzureInfrastructure();
          resources.gcp = await this.createGCPInfrastructure();
          break;
      }

      // Common Kubernetes setup
      if (this.config.kubernetes.enabled) {
        resources.kubernetes = await this.createKubernetesInfrastructure();
      }

      // Monitoring setup
      if (this.config.monitoring.enabled) {
        resources.monitoring = await this.createMonitoringInfrastructure();
      }

      return resources;
    };

    await this.pulumiStack.setProgram(infraProgram);
    return infraProgram;
  }

  // AWS Infrastructure Creation
  private async createAWSInfrastructure(): Promise<any> {
    // VPC and Networking
    const vpc = new aws.ec2.Vpc(`${this.config.project}-vpc`, {
      cidrBlock: this.config.networking.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${this.config.project}-${this.config.environment}-vpc`,
        Environment: this.config.environment,
        Project: this.config.project,
      },
    });

    const internetGateway = new aws.ec2.InternetGateway(`${this.config.project}-igw`, {
      vpcId: vpc.id,
      tags: {
        Name: `${this.config.project}-${this.config.environment}-igw`,
      },
    });

    // Subnets
    const subnets: aws.ec2.Subnet[] = [];
    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];

    for (const subnetConfig of this.config.networking.subnets) {
      const subnet = new aws.ec2.Subnet(`${subnetConfig.name}`, {
        vpcId: vpc.id,
        cidrBlock: subnetConfig.cidr,
        availabilityZone: subnetConfig.availabilityZone,
        mapPublicIpOnLaunch: subnetConfig.type === 'public',
        tags: {
          Name: `${this.config.project}-${this.config.environment}-${subnetConfig.name}`,
          Type: subnetConfig.type,
          'kubernetes.io/role/elb': subnetConfig.type === 'public' ? '1' : '',
          'kubernetes.io/role/internal-elb': subnetConfig.type === 'private' ? '1' : '',
        },
      });

      subnets.push(subnet);

      if (subnetConfig.type === 'public') {
        publicSubnets.push(subnet);
      } else {
        privateSubnets.push(subnet);
      }
    }

    // Route Tables
    const publicRouteTable = new aws.ec2.RouteTable(`${this.config.project}-public-rt`, {
      vpcId: vpc.id,
      routes: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: internetGateway.id,
        },
      ],
      tags: {
        Name: `${this.config.project}-${this.config.environment}-public-rt`,
      },
    });

    // Associate public subnets with public route table
    for (let i = 0; i < publicSubnets.length; i++) {
      new aws.ec2.RouteTableAssociation(`public-rt-association-${i}`, {
        routeTableId: publicRouteTable.id,
        subnetId: publicSubnets[i].id,
      });
    }

    // NAT Gateway for private subnets
    let natGateway;
    let privateRouteTable;

    if (this.config.networking.enableNatGateway && publicSubnets.length > 0) {
      const eip = new aws.ec2.Eip(`${this.config.project}-nat-eip`, {
        domain: 'vpc',
        tags: {
          Name: `${this.config.project}-${this.config.environment}-nat-eip`,
        },
      });

      natGateway = new aws.ec2.NatGateway(`${this.config.project}-nat`, {
        allocationId: eip.id,
        subnetId: publicSubnets[0].id,
        tags: {
          Name: `${this.config.project}-${this.config.environment}-nat`,
        },
      });

      privateRouteTable = new aws.ec2.RouteTable(`${this.config.project}-private-rt`, {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway.id,
          },
        ],
        tags: {
          Name: `${this.config.project}-${this.config.environment}-private-rt`,
        },
      });

      // Associate private subnets with private route table
      for (let i = 0; i < privateSubnets.length; i++) {
        new aws.ec2.RouteTableAssociation(`private-rt-association-${i}`, {
          routeTableId: privateRouteTable.id,
          subnetId: privateSubnets[i].id,
        });
      }
    }

    // Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(`${this.config.project}-alb-sg`, {
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.id,
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        Name: `${this.config.project}-${this.config.environment}-alb-sg`,
      },
    });

    const clusterSecurityGroup = new aws.ec2.SecurityGroup(`${this.config.project}-cluster-sg`, {
      description: 'Security group for EKS cluster',
      vpcId: vpc.id,
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          securityGroups: [albSecurityGroup.id],
        },
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        Name: `${this.config.project}-${this.config.environment}-cluster-sg`,
      },
    });

    // EKS Cluster (if enabled)
    let eksCluster;
    let nodeGroups: aws.eks.NodeGroup[] = [];

    if (this.config.kubernetes.enabled) {
      // IAM Role for EKS Cluster
      const eksRole = new aws.iam.Role(`${this.config.project}-eks-role`, {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'eks.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
      });

      new aws.iam.RolePolicyAttachment(`${this.config.project}-eks-service-policy`, {
        role: eksRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
      });

      // EKS Cluster
      eksCluster = new aws.eks.Cluster(`${this.config.project}-cluster`, {
        name: `${this.config.project}-${this.config.environment}`,
        version: this.config.kubernetes.version,
        roleArn: eksRole.arn,
        vpcConfig: {
          subnetIds: [...publicSubnets.map(s => s.id), ...privateSubnets.map(s => s.id)],
          securityGroupIds: [clusterSecurityGroup.id],
          endpointPrivateAccess: true,
          endpointPublicAccess: true,
        },
        enabledClusterLogTypes: [
          'api',
          'audit',
          'authenticator',
          'controllerManager',
          'scheduler',
        ],
        tags: {
          Name: `${this.config.project}-${this.config.environment}`,
          Environment: this.config.environment,
        },
      });

      // Node Groups
      const nodeGroupRole = new aws.iam.Role(`${this.config.project}-nodegroup-role`, {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
      });

      const nodeGroupPolicies = [
        'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
        'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
        'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      ];

      for (let i = 0; i < nodeGroupPolicies.length; i++) {
        new aws.iam.RolePolicyAttachment(`nodegroup-policy-${i}`, {
          role: nodeGroupRole.name,
          policyArn: nodeGroupPolicies[i],
        });
      }

      for (const nodeGroupConfig of this.config.kubernetes.nodeGroups) {
        const nodeGroup = new aws.eks.NodeGroup(`${nodeGroupConfig.name}`, {
          clusterName: eksCluster.name,
          nodeGroupName: nodeGroupConfig.name,
          nodeRoleArn: nodeGroupRole.arn,
          subnetIds: privateSubnets.map(s => s.id),
          instanceTypes: [nodeGroupConfig.instanceType],
          scalingConfig: {
            minSize: nodeGroupConfig.minSize,
            maxSize: nodeGroupConfig.maxSize,
            desiredSize: nodeGroupConfig.desiredSize,
          },
          updateConfig: {
            maxUnavailablePercentage: 25,
          },
          labels: nodeGroupConfig.labels,
          taints: nodeGroupConfig.taints.map(taint => ({
            key: taint.key,
            value: taint.value,
            effect: taint.effect,
          })),
          tags: {
            Name: `${this.config.project}-${this.config.environment}-${nodeGroupConfig.name}`,
          },
        });

        nodeGroups.push(nodeGroup);
      }
    }

    // RDS Database
    const dbSubnetGroup = new aws.rds.SubnetGroup(`${this.config.project}-db-subnet-group`, {
      subnetIds: privateSubnets.map(s => s.id),
      tags: {
        Name: `${this.config.project}-${this.config.environment}-db-subnet-group`,
      },
    });

    const dbSecurityGroup = new aws.ec2.SecurityGroup(`${this.config.project}-db-sg`, {
      description: 'Security group for RDS database',
      vpcId: vpc.id,
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          securityGroups: [clusterSecurityGroup.id],
        },
      ],
      tags: {
        Name: `${this.config.project}-${this.config.environment}-db-sg`,
      },
    });

    const database = new aws.rds.Instance(`${this.config.project}-db`, {
      identifier: `${this.config.project}-${this.config.environment}-db`,
      engine: 'postgres',
      engineVersion: '14.9',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: 'gp2',
      storageEncrypted: true,
      dbName: this.config.project.replace(/-/g, '_'),
      username: 'dbadmin',
      password: 'changeme123!', // In production, use AWS Secrets Manager
      vpcSecurityGroupIds: [dbSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: true,
      deletionProtection: this.config.environment === 'production',
      tags: {
        Name: `${this.config.project}-${this.config.environment}-db`,
        Environment: this.config.environment,
      },
    });

    return {
      vpc,
      internetGateway,
      subnets,
      publicSubnets,
      privateSubnets,
      natGateway,
      securityGroups: {
        alb: albSecurityGroup,
        cluster: clusterSecurityGroup,
        database: dbSecurityGroup,
      },
      eks: {
        cluster: eksCluster,
        nodeGroups,
      },
      database,
    };
  }

  // Azure Infrastructure Creation
  private async createAzureInfrastructure(): Promise<any> {
    // Resource Group
    const resourceGroup = new azure.resources.ResourceGroup(`${this.config.project}-rg`, {
      resourceGroupName: `${this.config.project}-${this.config.environment}-rg`,
      location: this.config.region,
      tags: {
        Environment: this.config.environment,
        Project: this.config.project,
      },
    });

    // Virtual Network
    const vnet = new azure.network.VirtualNetwork(`${this.config.project}-vnet`, {
      resourceGroupName: resourceGroup.name,
      virtualNetworkName: `${this.config.project}-${this.config.environment}-vnet`,
      location: resourceGroup.location,
      addressSpace: {
        addressPrefixes: [this.config.networking.vpcCidr],
      },
      tags: {
        Environment: this.config.environment,
      },
    });

    // Subnets
    const subnets: azure.network.Subnet[] = [];
    for (const subnetConfig of this.config.networking.subnets) {
      const subnet = new azure.network.Subnet(`${subnetConfig.name}`, {
        resourceGroupName: resourceGroup.name,
        virtualNetworkName: vnet.name,
        subnetName: subnetConfig.name,
        addressPrefix: subnetConfig.cidr,
      });

      subnets.push(subnet);
    }

    // AKS Cluster (if enabled)
    let aksCluster;
    if (this.config.kubernetes.enabled) {
      aksCluster = new azure.containerservice.ManagedCluster(`${this.config.project}-aks`, {
        resourceGroupName: resourceGroup.name,
        resourceName: `${this.config.project}-${this.config.environment}-aks`,
        location: resourceGroup.location,
        kubernetesVersion: this.config.kubernetes.version,
        dnsPrefix: `${this.config.project}-${this.config.environment}`,
        identity: {
          type: 'SystemAssigned',
        },
        agentPoolProfiles: this.config.kubernetes.nodeGroups.map(ng => ({
          name: ng.name,
          count: ng.desiredSize,
          minCount: ng.minSize,
          maxCount: ng.maxSize,
          vmSize: ng.instanceType,
          enableAutoScaling: true,
          mode: 'System',
          nodeLabels: ng.labels,
          nodeTaints: ng.taints.map(t => `${t.key}=${t.value}:${t.effect}`),
        })),
        networkProfile: {
          networkPlugin: 'azure',
          serviceCidr: '10.96.0.0/12',
          dnsServiceIp: '10.96.0.10',
        },
        tags: {
          Environment: this.config.environment,
        },
      });
    }

    return {
      resourceGroup,
      vnet,
      subnets,
      aks: aksCluster,
    };
  }

  // GCP Infrastructure Creation
  private async createGCPInfrastructure(): Promise<any> {
    // VPC Network
    const network = new gcp.compute.Network(`${this.config.project}-vpc`, {
      name: `${this.config.project}-${this.config.environment}-vpc`,
      autoCreateSubnetworks: false,
      description: `VPC for ${this.config.project} ${this.config.environment}`,
    });

    // Subnets
    const subnets: gcp.compute.Subnetwork[] = [];
    for (const subnetConfig of this.config.networking.subnets) {
      const subnet = new gcp.compute.Subnetwork(`${subnetConfig.name}`, {
        name: subnetConfig.name,
        network: network.id,
        ipCidrRange: subnetConfig.cidr,
        region: this.config.region,
        privateIpGoogleAccess: true,
        secondaryIpRanges: [
          {
            rangeName: 'pods',
            ipCidrRange: '10.96.0.0/14',
          },
          {
            rangeName: 'services',
            ipCidrRange: '10.100.0.0/16',
          },
        ],
      });

      subnets.push(subnet);
    }

    // GKE Cluster (if enabled)
    let gkeCluster;
    if (this.config.kubernetes.enabled && subnets.length > 0) {
      gkeCluster = new gcp.container.Cluster(`${this.config.project}-gke`, {
        name: `${this.config.project}-${this.config.environment}-gke`,
        location: this.config.region,
        minMasterVersion: this.config.kubernetes.version,
        network: network.name,
        subnetwork: subnets[0].name,
        ipAllocationPolicy: {
          clusterSecondaryRangeName: 'pods',
          servicesSecondaryRangeName: 'services',
        },
        removeDefaultNodePool: true,
        initialNodeCount: 1,
        workloadIdentityConfig: {
          workloadPool: `${gcp.config.project}.svc.id.goog`,
        },
        addonsConfig: {
          httpLoadBalancing: { disabled: false },
          horizontalPodAutoscaling: { disabled: false },
          networkPolicyConfig: { disabled: false },
        },
        networkPolicy: {
          enabled: true,
          provider: 'CALICO',
        },
        masterAuth: {
          clientCertificateConfig: {
            issueClientCertificate: false,
          },
        },
      });

      // Node Pools
      for (const nodeGroupConfig of this.config.kubernetes.nodeGroups) {
        new gcp.container.NodePool(`${nodeGroupConfig.name}`, {
          name: nodeGroupConfig.name,
          cluster: gkeCluster.name,
          location: gkeCluster.location,
          nodeCount: nodeGroupConfig.desiredSize,
          autoscaling: {
            minNodeCount: nodeGroupConfig.minSize,
            maxNodeCount: nodeGroupConfig.maxSize,
          },
          nodeConfig: {
            machineType: nodeGroupConfig.instanceType,
            diskSizeGb: 100,
            diskType: 'pd-ssd',
            preemptible: false,
            labels: nodeGroupConfig.labels,
            taints: nodeGroupConfig.taints.map(t => ({
              key: t.key,
              value: t.value,
              effect: t.effect.toUpperCase(),
            })),
            oauthScopes: [
              'https://www.googleapis.com/auth/cloud-platform',
            ],
            workloadMetadataConfig: {
              mode: 'GKE_METADATA',
            },
          },
          management: {
            autoRepair: true,
            autoUpgrade: true,
          },
        });
      }
    }

    return {
      network,
      subnets,
      gke: gkeCluster,
    };
  }

  // Kubernetes Infrastructure Setup
  private async createKubernetesInfrastructure(): Promise<any> {
    // Setup Kubernetes provider
    const k8sProvider = new k8s.Provider('k8s-provider', {
      // Provider configuration will be set based on the cloud provider
    });

    // Namespaces
    const namespaces = ['default', 'monitoring', 'ingress-nginx', 'cert-manager'];
    const k8sNamespaces: k8s.core.v1.Namespace[] = [];

    for (const ns of namespaces) {
      if (ns !== 'default') {
        const namespace = new k8s.core.v1.Namespace(
          `${ns}-namespace`,
          {
            metadata: { name: ns },
          },
          { provider: k8sProvider }
        );
        k8sNamespaces.push(namespace);
      }
    }

    // NGINX Ingress Controller
    const nginxIngress = new k8s.helm.v3.Release(
      'nginx-ingress',
      {
        chart: 'ingress-nginx',
        repositoryOpts: {
          repo: 'https://kubernetes.github.io/ingress-nginx',
        },
        namespace: 'ingress-nginx',
        values: {
          controller: {
            service: {
              type: 'LoadBalancer',
              annotations: {
                'service.beta.kubernetes.io/aws-load-balancer-type': 'nlb',
              },
            },
            metrics: {
              enabled: true,
            },
            podAnnotations: {
              'prometheus.io/scrape': 'true',
              'prometheus.io/port': '10254',
            },
          },
        },
      },
      { provider: k8sProvider }
    );

    // Cert-Manager
    const certManager = new k8s.helm.v3.Release(
      'cert-manager',
      {
        chart: 'cert-manager',
        version: 'v1.13.0',
        repositoryOpts: {
          repo: 'https://charts.jetstack.io',
        },
        namespace: 'cert-manager',
        values: {
          installCRDs: true,
          prometheus: {
            enabled: true,
          },
        },
      },
      { provider: k8sProvider }
    );

    // ArgoCD for GitOps
    const argoCD = new k8s.helm.v3.Release(
      'argocd',
      {
        chart: 'argo-cd',
        repositoryOpts: {
          repo: 'https://argoproj.github.io/argo-helm',
        },
        namespace: 'argocd',
        values: {
          server: {
            extraArgs: ['--insecure'],
            service: {
              type: 'LoadBalancer',
            },
          },
          configs: {
            secret: {
              argocdServerAdminPassword: '$2a$10$rRyBsGSHK6.uc8fntPwVIuLVHgsAhAX7TcdrqW/RADU0uh7CaChLa', // 'password'
            },
          },
        },
      },
      { provider: k8sProvider }
    );

    return {
      namespaces: k8sNamespaces,
      nginxIngress,
      certManager,
      argoCD,
    };
  }

  // Monitoring Infrastructure
  private async createMonitoringInfrastructure(): Promise<any> {
    const k8sProvider = new k8s.Provider('k8s-provider', {});

    // Prometheus
    const prometheus = new k8s.helm.v3.Release(
      'prometheus',
      {
        chart: 'prometheus',
        repositoryOpts: {
          repo: 'https://prometheus-community.github.io/helm-charts',
        },
        namespace: 'monitoring',
        values: {
          alertmanager: {
            enabled: this.config.monitoring.alerting,
          },
          server: {
            retention: this.config.monitoring.retention,
            persistentVolume: {
              enabled: true,
              size: '50Gi',
            },
          },
          pushgateway: {
            enabled: true,
          },
        },
      },
      { provider: k8sProvider }
    );

    // Grafana
    const grafana = new k8s.helm.v3.Release(
      'grafana',
      {
        chart: 'grafana',
        repositoryOpts: {
          repo: 'https://grafana.github.io/helm-charts',
        },
        namespace: 'monitoring',
        values: {
          adminPassword: 'admin123', // Change in production
          service: {
            type: 'LoadBalancer',
          },
          datasources: {
            'datasources.yaml': {
              apiVersion: 1,
              datasources: [
                {
                  name: 'Prometheus',
                  type: 'prometheus',
                  url: 'http://prometheus-server.monitoring.svc.cluster.local',
                  isDefault: true,
                },
              ],
            },
          },
        },
      },
      { provider: k8sProvider }
    );

    return {
      prometheus,
      grafana,
    };
  }

  // Terraform Module Management
  private async setupTerraformModules(): Promise<void> {
    const modules = [
      {
        name: 'vpc',
        source: 'terraform-aws-modules/vpc/aws',
        version: '~> 3.0',
        variables: {
          name: `${this.config.project}-${this.config.environment}`,
          cidr: this.config.networking.vpcCidr,
          azs: this.config.networking.subnets.map(s => s.availabilityZone),
          private_subnets: this.config.networking.subnets
            .filter(s => s.type === 'private')
            .map(s => s.cidr),
          public_subnets: this.config.networking.subnets
            .filter(s => s.type === 'public')
            .map(s => s.cidr),
          enable_nat_gateway: this.config.networking.enableNatGateway,
          enable_vpn_gateway: this.config.networking.enableVpnGateway,
          enable_dns_hostnames: true,
          enable_dns_support: true,
          tags: {
            Terraform: 'true',
            Environment: this.config.environment,
            Project: this.config.project,
          },
        },
        providers: ['aws'],
      },
      {
        name: 'security-group',
        source: 'terraform-aws-modules/security-group/aws',
        version: '~> 4.0',
        variables: {
          name: `${this.config.project}-${this.config.environment}-sg`,
          description: 'Security group for application',
          vpc_id: '${module.vpc.vpc_id}',
          ingress_rules: ['http-80-tcp', 'https-443-tcp'],
          egress_rules: ['all-all'],
          tags: {
            Environment: this.config.environment,
          },
        },
        providers: ['aws'],
      },
    ];

    for (const module of modules) {
      this.terraformModules.set(module.name, module);
    }
  }

  private async deployTerraformModule(name: string, module: TerraformModule): Promise<void> {
    const terraformDir = `./terraform/${name}`;
    await fs.mkdir(terraformDir, { recursive: true });

    // Generate main.tf
    const mainTf = `
module "${module.name}" {
  source  = "${module.source}"
  version = "${module.version}"

${Object.entries(module.variables)
  .map(([key, value]) => {
    const tfValue = typeof value === 'string' && value.startsWith('${')
      ? value
      : JSON.stringify(value);
    return `  ${key} = ${tfValue}`;
  })
  .join('\n')}
}

output "${module.name}_outputs" {
  value = module.${module.name}
}
`;

    await fs.writeFile(path.join(terraformDir, 'main.tf'), mainTf);

    // Generate providers.tf
    const providersTf = module.providers.map(provider => {
      switch (provider) {
        case 'aws':
          return `
provider "aws" {
  region = var.region
}
`;
        case 'azurerm':
          return `
provider "azurerm" {
  features {}
}
`;
        case 'google':
          return `
provider "google" {
  project = var.project
  region  = var.region
}
`;
        default:
          return '';
      }
    }).join('\n');

    await fs.writeFile(path.join(terraformDir, 'providers.tf'), providersTf);

    // Generate variables.tf
    const variablesTf = `
variable "region" {
  description = "AWS region"
  type        = string
  default     = "${this.config.region}"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "${this.config.project}"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "${this.config.environment}"
}
`;

    await fs.writeFile(path.join(terraformDir, 'variables.tf'), variablesTf);

    // Initialize and apply Terraform
    try {
      execSync('terraform init', { cwd: terraformDir, stdio: 'inherit' });
      execSync('terraform plan', { cwd: terraformDir, stdio: 'inherit' });
      execSync('terraform apply -auto-approve', { cwd: terraformDir, stdio: 'inherit' });

      console.log(`Terraform module ${name} deployed successfully`);
    } catch (error) {
      console.error(`Failed to deploy Terraform module ${name}:`, error);
      throw error;
    }
  }

  // GitOps Setup
  private async setupGitOps(): Promise<void> {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // Create ArgoCD Application
    const appDefinition = {
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'Application',
      metadata: {
        name: `${this.config.project}-${this.config.environment}`,
        namespace: 'argocd',
      },
      spec: {
        project: 'default',
        source: {
          repoURL: this.gitOpsConfig.repository,
          targetRevision: this.gitOpsConfig.branch,
          path: this.gitOpsConfig.path,
        },
        destination: {
          server: 'https://kubernetes.default.svc',
          namespace: 'default',
        },
        syncPolicy: this.gitOpsConfig.syncPolicy === 'automated' ? {
          automated: {
            prune: this.gitOpsConfig.pruning,
            selfHeal: this.gitOpsConfig.selfHeal,
          },
          syncOptions: ['CreateNamespace=true'],
        } : undefined,
      },
    };

    // Apply ArgoCD Application
    const appYaml = yaml.dump(appDefinition);
    await fs.writeFile('./argocd-app.yaml', appYaml);

    console.log('GitOps setup completed');
  }

  // Configuration Validation
  private async validateConfiguration(): Promise<void> {
    // Validate network configuration
    if (!this.isValidCIDR(this.config.networking.vpcCidr)) {
      throw new Error(`Invalid VPC CIDR: ${this.config.networking.vpcCidr}`);
    }

    for (const subnet of this.config.networking.subnets) {
      if (!this.isValidCIDR(subnet.cidr)) {
        throw new Error(`Invalid subnet CIDR: ${subnet.cidr}`);
      }
    }

    // Validate Kubernetes configuration
    if (this.config.kubernetes.enabled) {
      if (this.config.kubernetes.nodeGroups.length === 0) {
        throw new Error('At least one node group is required for Kubernetes');
      }

      for (const nodeGroup of this.config.kubernetes.nodeGroups) {
        if (nodeGroup.minSize > nodeGroup.maxSize) {
          throw new Error(`Invalid node group size configuration for ${nodeGroup.name}`);
        }
      }
    }

    console.log('Configuration validation passed');
  }

  private isValidCIDR(cidr: string): boolean {
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    return cidrRegex.test(cidr);
  }

  // Drift Detection
  async detectDrift(): Promise<any> {
    const driftResults = new Map();

    // Check Pulumi stack for drift
    const refreshResult = await this.pulumiStack.refresh({
      onOutput: (output) => {
        console.log(`Refresh: ${output}`);
      },
    });

    driftResults.set('pulumi', refreshResult.summary);

    // Check Terraform modules for drift
    for (const [name] of this.terraformModules) {
      try {
        const terraformDir = `./terraform/${name}`;
        const planOutput = execSync('terraform plan -detailed-exitcode', {
          cwd: terraformDir,
          encoding: 'utf8'
        });
        driftResults.set(`terraform-${name}`, { drift: false, output: planOutput });
      } catch (error: any) {
        if (error.status === 2) {
          driftResults.set(`terraform-${name}`, { drift: true, output: error.stdout });
        } else {
          driftResults.set(`terraform-${name}`, { error: error.message });
        }
      }
    }

    return Object.fromEntries(driftResults);
  }

  // Cost Estimation
  async estimateCosts(): Promise<any> {
    // This would integrate with cloud provider cost estimation APIs
    // For now, return a basic estimate structure
    return {
      monthly: {
        compute: 500,
        storage: 50,
        networking: 100,
        database: 200,
        total: 850,
      },
      currency: 'USD',
      region: this.config.region,
      estimatedAt: new Date(),
    };
  }

  // Cleanup
  async destroy(): Promise<void> {
    // Destroy Pulumi stack
    await this.pulumiStack.destroy({
      onOutput: (output) => {
        console.log(`Destroy: ${output}`);
      },
    });

    // Destroy Terraform modules
    for (const [name] of this.terraformModules) {
      const terraformDir = `./terraform/${name}`;
      try {
        execSync('terraform destroy -auto-approve', { cwd: terraformDir, stdio: 'inherit' });
        console.log(`Terraform module ${name} destroyed`);
      } catch (error) {
        console.error(`Failed to destroy Terraform module ${name}:`, error);
      }
    }

    console.log('Infrastructure destruction completed');
  }
}

// Example usage
export async function createInfrastructureExample(): Promise<void> {
  const config: InfrastructureConfig = {
    project: 'my-application',
    environment: 'staging',
    region: 'us-west-2',
    cloud: 'aws',
    networking: {
      vpcCidr: '10.0.0.0/16',
      subnets: [
        {
          name: 'public-1',
          cidr: '10.0.1.0/24',
          type: 'public',
          availabilityZone: 'us-west-2a',
        },
        {
          name: 'public-2',
          cidr: '10.0.2.0/24',
          type: 'public',
          availabilityZone: 'us-west-2b',
        },
        {
          name: 'private-1',
          cidr: '10.0.3.0/24',
          type: 'private',
          availabilityZone: 'us-west-2a',
        },
        {
          name: 'private-2',
          cidr: '10.0.4.0/24',
          type: 'private',
          availabilityZone: 'us-west-2b',
        },
      ],
      enableNatGateway: true,
      enableVpnGateway: false,
    },
    kubernetes: {
      enabled: true,
      version: '1.28',
      nodeGroups: [
        {
          name: 'general',
          instanceType: 't3.medium',
          minSize: 2,
          maxSize: 10,
          desiredSize: 3,
          labels: {
            'node-type': 'general',
          },
          taints: [],
        },
      ],
      addons: ['aws-load-balancer-controller', 'cluster-autoscaler'],
    },
    monitoring: {
      enabled: true,
      retention: '15d',
      alerting: true,
    },
    security: {
      enableWaf: true,
      sslCertificates: ['*.example.com'],
      secrets: [
        {
          name: 'database-credentials',
          type: 'database',
          rotation: true,
          rotationPeriod: '90d',
        },
      ],
    },
    backup: {
      enabled: true,
      retention: '30d',
      crossRegion: true,
    },
  };

  const gitOpsConfig: GitOpsConfig = {
    repository: 'https://github.com/myorg/my-application-config',
    branch: 'main',
    path: 'kubernetes/staging',
    syncPolicy: 'automated',
    pruning: true,
    selfHeal: true,
  };

  const platform = new InfrastructurePlatform(config, gitOpsConfig);
  await platform.initialize();

  console.log('Deploying infrastructure...');
  const outputs = await platform.deployInfrastructure();

  console.log('Infrastructure outputs:', Object.fromEntries(outputs));

  // Monitor for drift
  setInterval(async () => {
    console.log('Checking for infrastructure drift...');
    const drift = await platform.detectDrift();
    console.log('Drift detection results:', drift);
  }, 300000); // Check every 5 minutes
}

export { InfrastructurePlatform, InfrastructureConfig, GitOpsConfig };
```

## Skill Activation Triggers

This skill automatically activates when:
- Infrastructure automation is needed
- Terraform or Pulumi development is required
- GitOps workflow implementation is requested
- Multi-cloud infrastructure deployment is needed
- Infrastructure as Code best practices are required
- Policy as code and compliance automation is requested

This comprehensive Infrastructure as Code skill provides expert-level capabilities for building modern, scalable infrastructure platforms with advanced automation, security, and compliance features.
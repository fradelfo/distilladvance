# Enterprise Claude Code Infrastructure as Code
# Terraform template for large-scale Claude Code deployment
# Supports multi-region, high availability, and enterprise security

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }

  backend "s3" {
    bucket         = "claude-enterprise-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-locking"
  }
}

# Variables for enterprise configuration
variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"
}

variable "organization_name" {
  description = "Organization name for resource tagging"
  type        = string
}

variable "regions" {
  description = "List of AWS regions for multi-region deployment"
  type        = list(string)
  default     = ["us-east-1", "eu-west-1", "ap-southeast-2"]
}

variable "enterprise_config" {
  description = "Enterprise-specific configuration"
  type = object({
    compliance_frameworks = list(string)
    data_residency_regions = map(string)
    security_level = string
    audit_retention_years = number
  })
  default = {
    compliance_frameworks = ["SOC2", "GDPR", "HIPAA"]
    data_residency_regions = {
      "us-east-1"      = "US"
      "eu-west-1"      = "EU"
      "ap-southeast-2" = "AU"
    }
    security_level = "high"
    audit_retention_years = 7
  }
}

variable "cluster_config" {
  description = "EKS cluster configuration"
  type = object({
    node_groups = map(object({
      instance_types = list(string)
      min_size      = number
      max_size      = number
      desired_size  = number
    }))
  })
  default = {
    node_groups = {
      "api-nodes" = {
        instance_types = ["c5.2xlarge", "c5.4xlarge"]
        min_size      = 3
        max_size      = 50
        desired_size  = 6
      }
      "worker-nodes" = {
        instance_types = ["m5.large", "m5.xlarge"]
        min_size      = 2
        max_size      = 20
        desired_size  = 4
      }
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local values for consistent resource naming
locals {
  common_tags = {
    Environment     = var.environment
    Organization    = var.organization_name
    Project         = "claude-enterprise"
    ManagedBy      = "terraform"
    CostCenter     = "engineering"
    Compliance     = join(",", var.enterprise_config.compliance_frameworks)
    SecurityLevel  = var.enterprise_config.security_level
  }

  cluster_name = "claude-enterprise-${var.environment}"

  # Enterprise security groups
  security_group_rules = {
    api_ingress = [
      {
        from_port   = 443
        to_port     = 443
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
        description = "HTTPS API access"
      },
      {
        from_port   = 80
        to_port     = 80
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
        description = "HTTP redirect to HTTPS"
      }
    ]
  }
}

# VPC and Networking
resource "aws_vpc" "claude_enterprise" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-vpc-${var.environment}"
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "claude_enterprise" {
  vpc_id = aws_vpc.claude_enterprise.id

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-igw-${var.environment}"
  })
}

# Subnets for multi-AZ deployment
resource "aws_subnet" "public" {
  count = min(length(data.aws_availability_zones.available.names), 3)

  vpc_id                  = aws_vpc.claude_enterprise.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-public-${count.index + 1}-${var.environment}"
    Type = "Public"
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/elb" = "1"
  })
}

resource "aws_subnet" "private" {
  count = min(length(data.aws_availability_zones.available.names), 3)

  vpc_id            = aws_vpc.claude_enterprise.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-private-${count.index + 1}-${var.environment}"
    Type = "Private"
    "kubernetes.io/cluster/${local.cluster_name}" = "owned"
    "kubernetes.io/role/internal-elb" = "1"
  })
}

# NAT Gateways for private subnet internet access
resource "aws_eip" "nat" {
  count = min(length(data.aws_availability_zones.available.names), 3)

  domain = "vpc"
  depends_on = [aws_internet_gateway.claude_enterprise]

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-nat-eip-${count.index + 1}-${var.environment}"
  })
}

resource "aws_nat_gateway" "claude_enterprise" {
  count = min(length(data.aws_availability_zones.available.names), 3)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  depends_on    = [aws_internet_gateway.claude_enterprise]

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-nat-${count.index + 1}-${var.environment}"
  })
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.claude_enterprise.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.claude_enterprise.id
  }

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-public-rt-${var.environment}"
  })
}

resource "aws_route_table" "private" {
  count  = min(length(data.aws_availability_zones.available.names), 3)
  vpc_id = aws_vpc.claude_enterprise.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.claude_enterprise[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-private-rt-${count.index + 1}-${var.environment}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = min(length(data.aws_availability_zones.available.names), 3)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = min(length(data.aws_availability_zones.available.names), 3)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "claude_api" {
  name        = "claude-enterprise-api-${var.environment}"
  description = "Security group for Claude API servers"
  vpc_id      = aws_vpc.claude_enterprise.id

  # HTTPS access from anywhere
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP access for redirects
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-api-sg-${var.environment}"
    Type = "API"
  })
}

resource "aws_security_group" "claude_database" {
  name        = "claude-enterprise-database-${var.environment}"
  description = "Security group for Claude database servers"
  vpc_id      = aws_vpc.claude_enterprise.id

  # Database access from API servers
  ingress {
    description     = "Database access"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.claude_api.id]
  }

  # Redis access from API servers
  ingress {
    description     = "Redis access"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.claude_api.id]
  }

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-db-sg-${var.environment}"
    Type = "Database"
  })
}

# KMS Key for encryption
resource "aws_kms_key" "claude_enterprise" {
  description             = "KMS key for Claude Enterprise encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-kms-${var.environment}"
  })
}

resource "aws_kms_alias" "claude_enterprise" {
  name          = "alias/claude-enterprise-${var.environment}"
  target_key_id = aws_kms_key.claude_enterprise.key_id
}

# RDS PostgreSQL for user management and configuration
resource "aws_db_subnet_group" "claude_enterprise" {
  name       = "claude-enterprise-${var.environment}"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-db-subnet-group-${var.environment}"
  })
}

resource "aws_db_parameter_group" "claude_enterprise" {
  family = "postgres15"
  name   = "claude-enterprise-${var.environment}"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = local.common_tags
}

resource "aws_db_instance" "claude_enterprise" {
  identifier = "claude-enterprise-${var.environment}"

  # Database configuration
  engine                = "postgres"
  engine_version        = "15.4"
  instance_class        = "db.r6g.xlarge"
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.claude_enterprise.arn

  # Database credentials
  db_name  = "claude_enterprise"
  username = "claude_admin"
  password = random_password.db_password.result

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.claude_enterprise.name
  vpc_security_group_ids = [aws_security_group.claude_database.id]
  publicly_accessible    = false
  multi_az              = true

  # Backup configuration
  backup_retention_period = var.enterprise_config.audit_retention_years * 365
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Monitoring and logging
  enabled_cloudwatch_logs_exports = ["postgresql"]
  monitoring_interval            = 60
  monitoring_role_arn           = aws_iam_role.rds_monitoring.arn
  performance_insights_enabled   = true

  # Security
  parameter_group_name = aws_db_parameter_group.claude_enterprise.name
  deletion_protection  = true

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-database-${var.environment}"
  })
}

resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Store database password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "claude-enterprise-db-password-${var.environment}"
  description            = "Database password for Claude Enterprise"
  kms_key_id             = aws_kms_key.claude_enterprise.arn
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = aws_db_instance.claude_enterprise.username
    password = random_password.db_password.result
    endpoint = aws_db_instance.claude_enterprise.endpoint
    port     = aws_db_instance.claude_enterprise.port
    dbname   = aws_db_instance.claude_enterprise.db_name
  })
}

# ElastiCache Redis for caching
resource "aws_elasticache_subnet_group" "claude_enterprise" {
  name       = "claude-enterprise-cache-${var.environment}"
  subnet_ids = aws_subnet.private[*].id

  tags = local.common_tags
}

resource "aws_elasticache_replication_group" "claude_enterprise" {
  replication_group_id       = "claude-enterprise-${var.environment}"
  description                = "Redis cluster for Claude Enterprise"

  port               = 6379
  parameter_group_name = "default.redis7"
  node_type          = "cache.r6g.large"
  num_cache_clusters = 3

  subnet_group_name  = aws_elasticache_subnet_group.claude_enterprise.name
  security_group_ids = [aws_security_group.claude_database.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_password.result
  kms_key_id                 = aws_kms_key.claude_enterprise.arn

  automatic_failover_enabled = true
  multi_az_enabled          = true

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format      = "text"
    log_type        = "slow-log"
  }

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-redis-${var.environment}"
  })
}

resource "random_password" "redis_password" {
  length  = 32
  special = false
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "redis" {
  name              = "/aws/elasticache/claude-enterprise-${var.environment}"
  retention_in_days = var.enterprise_config.audit_retention_years * 365
  kms_key_id        = aws_kms_key.claude_enterprise.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "eks" {
  name              = "/aws/eks/claude-enterprise-${var.environment}/cluster"
  retention_in_days = var.enterprise_config.audit_retention_years * 365
  kms_key_id        = aws_kms_key.claude_enterprise.arn

  tags = local.common_tags
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "claude-enterprise-rds-monitoring-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# EKS Cluster
resource "aws_eks_cluster" "claude_enterprise" {
  name     = local.cluster_name
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = concat(aws_subnet.public[*].id, aws_subnet.private[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs    = ["0.0.0.0/0"]
    security_group_ids     = [aws_security_group.eks_cluster.id]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.claude_enterprise.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
    aws_cloudwatch_log_group.eks,
  ]

  tags = merge(local.common_tags, {
    Name = local.cluster_name
  })
}

# EKS Cluster IAM Role
resource "aws_iam_role" "eks_cluster" {
  name = "claude-enterprise-eks-cluster-${var.environment}"

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster.name
}

# EKS Cluster Security Group
resource "aws_security_group" "eks_cluster" {
  name        = "claude-enterprise-eks-cluster-${var.environment}"
  description = "Security group for EKS cluster"
  vpc_id      = aws_vpc.claude_enterprise.id

  ingress {
    from_port = 443
    to_port   = 443
    protocol  = "tcp"
    cidr_blocks = [aws_vpc.claude_enterprise.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-eks-cluster-sg-${var.environment}"
  })
}

# EKS Node Groups
resource "aws_eks_node_group" "claude_enterprise" {
  for_each = var.cluster_config.node_groups

  cluster_name    = aws_eks_cluster.claude_enterprise.name
  node_group_name = each.key
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = each.value.instance_types

  scaling_config {
    desired_size = each.value.desired_size
    max_size     = each.value.max_size
    min_size     = each.value.min_size
  }

  update_config {
    max_unavailable_percentage = 25
  }

  ami_type       = "AL2_x86_64"
  capacity_type  = "ON_DEMAND"
  disk_size      = 50

  remote_access {
    ec2_ssh_key = aws_key_pair.claude_enterprise.key_name
    source_security_group_ids = [aws_security_group.eks_nodes.id]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-${each.key}-${var.environment}"
  })
}

# EKS Node Group IAM Role
resource "aws_iam_role" "eks_node_group" {
  name = "claude-enterprise-eks-node-group-${var.environment}"

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group.name
}

# EKS Nodes Security Group
resource "aws_security_group" "eks_nodes" {
  name        = "claude-enterprise-eks-nodes-${var.environment}"
  description = "Security group for EKS worker nodes"
  vpc_id      = aws_vpc.claude_enterprise.id

  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
  }

  ingress {
    from_port       = 1025
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-eks-nodes-sg-${var.environment}"
  })
}

# Key Pair for EC2 access
resource "aws_key_pair" "claude_enterprise" {
  key_name   = "claude-enterprise-${var.environment}"
  public_key = file("~/.ssh/claude_enterprise.pub")

  tags = local.common_tags
}

# Application Load Balancer
resource "aws_lb" "claude_enterprise" {
  name               = "claude-enterprise-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.claude_api.id]
  subnets           = aws_subnet.public[*].id

  enable_deletion_protection = true
  enable_http2              = true

  access_logs {
    bucket  = aws_s3_bucket.claude_logs.bucket
    prefix  = "alb-logs"
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "claude-enterprise-alb-${var.environment}"
  })
}

# S3 Bucket for logs
resource "aws_s3_bucket" "claude_logs" {
  bucket = "claude-enterprise-logs-${var.environment}-${random_string.bucket_suffix.result}"

  tags = local.common_tags
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_versioning" "claude_logs" {
  bucket = aws_s3_bucket.claude_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "claude_logs" {
  bucket = aws_s3_bucket.claude_logs.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.claude_enterprise.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "claude_logs" {
  bucket = aws_s3_bucket.claude_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Outputs
output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.claude_enterprise.endpoint
  sensitive   = true
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.claude_enterprise.name
}

output "cluster_arn" {
  description = "EKS cluster ARN"
  value       = aws_eks_cluster.claude_enterprise.arn
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.claude_enterprise.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_replication_group.claude_enterprise.primary_endpoint_address
  sensitive   = true
}

output "load_balancer_dns" {
  description = "Load balancer DNS name"
  value       = aws_lb.claude_enterprise.dns_name
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.claude_enterprise.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.claude_enterprise.id
}
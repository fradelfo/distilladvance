# Cloud Optimization Skill

Advanced cloud infrastructure optimization covering cost management, performance tuning, resource rightsizing, and multi-cloud strategies.

## Skill Overview

Expert cloud optimization knowledge including AWS/Azure/GCP cost optimization, resource management, auto-scaling strategies, performance monitoring, and FinOps best practices using modern tools and automation.

## Core Capabilities

### Cost Optimization
- **Resource rightsizing** - CPU, memory, storage optimization based on actual usage
- **Reserved instance management** - RI planning, optimization, and lifecycle management
- **Spot instance strategies** - Fault-tolerant workload migration to spot instances
- **Cost allocation** - Tagging strategies, chargeback, and department-level cost tracking

### Performance Optimization
- **Auto-scaling** - Predictive scaling, custom metrics, scheduled scaling
- **Load balancing** - Geographic distribution, health checking, traffic routing
- **Caching strategies** - CDN optimization, database caching, application-level caching
- **Network optimization** - Bandwidth optimization, latency reduction, peering

### Resource Management
- **Infrastructure as Code** - Terraform, CloudFormation, Pulumi optimization
- **Multi-cloud management** - Workload placement, vendor lock-in mitigation
- **Governance & compliance** - Policy automation, security compliance, audit trails
- **Disaster recovery** - RTO/RPO optimization, backup strategies, failover automation

### FinOps Implementation
- **Cost visibility** - Real-time cost monitoring, budget alerts, forecasting
- **Optimization automation** - Automated rightsizing, scheduled shutdowns
- **Procurement optimization** - Contract negotiation, usage-based pricing
- **ROI analysis** - Cloud migration ROI, feature cost analysis

## Modern Cloud Cost Optimization

### AWS Cost Optimization Framework
```python
# Comprehensive AWS cost optimization automation
import boto3
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
import json
import logging
from dataclasses import dataclass

@dataclass
class OptimizationRecommendation:
    resource_id: str
    resource_type: str
    current_cost: float
    optimized_cost: float
    savings: float
    action: str
    confidence: float
    risk_level: str

class AWSCostOptimizer:
    def __init__(self):
        self.ce_client = boto3.client('ce')  # Cost Explorer
        self.ec2_client = boto3.client('ec2')
        self.rds_client = boto3.client('rds')
        self.cloudwatch = boto3.client('cloudwatch')
        self.compute_optimizer = boto3.client('compute-optimizer')
        self.trusted_advisor = boto3.client('support')

    def get_cost_and_usage(self, days: int = 30) -> pd.DataFrame:
        """Retrieve cost and usage data"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        response = self.ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': start_date.strftime('%Y-%m-%d'),
                'End': end_date.strftime('%Y-%m-%d')
            },
            Granularity='DAILY',
            Metrics=['BlendedCost', 'UsageQuantity'],
            GroupBy=[
                {'Type': 'DIMENSION', 'Key': 'SERVICE'},
                {'Type': 'DIMENSION', 'Key': 'INSTANCE_TYPE'}
            ]
        )

        # Process cost data
        cost_data = []
        for result in response['ResultsByTime']:
            date = result['TimePeriod']['Start']
            for group in result['Groups']:
                service = group['Keys'][0]
                instance_type = group['Keys'][1] if len(group['Keys']) > 1 else 'N/A'
                cost = float(group['Metrics']['BlendedCost']['Amount'])
                usage = float(group['Metrics']['UsageQuantity']['Amount'])

                cost_data.append({
                    'date': date,
                    'service': service,
                    'instance_type': instance_type,
                    'cost': cost,
                    'usage': usage
                })

        return pd.DataFrame(cost_data)

    def analyze_ec2_rightsizing(self) -> List[OptimizationRecommendation]:
        """Analyze EC2 instances for rightsizing opportunities"""
        recommendations = []

        # Get EC2 instances
        response = self.ec2_client.describe_instances()

        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                if instance['State']['Name'] != 'running':
                    continue

                instance_id = instance['InstanceId']
                instance_type = instance['InstanceType']

                # Get CPU utilization metrics
                cpu_utilization = self._get_cpu_utilization(instance_id)
                memory_utilization = self._get_memory_utilization(instance_id)

                # Determine rightsizing recommendation
                recommendation = self._calculate_rightsizing_recommendation(
                    instance_id, instance_type, cpu_utilization, memory_utilization
                )

                if recommendation:
                    recommendations.append(recommendation)

        return recommendations

    def _get_cpu_utilization(self, instance_id: str, days: int = 14) -> float:
        """Get average CPU utilization for an instance"""
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=days)

        response = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName='CPUUtilization',
            Dimensions=[
                {'Name': 'InstanceId', 'Value': instance_id}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,  # 1 hour
            Statistics=['Average']
        )

        if response['Datapoints']:
            return sum(point['Average'] for point in response['Datapoints']) / len(response['Datapoints'])
        return 0.0

    def _get_memory_utilization(self, instance_id: str, days: int = 14) -> float:
        """Get memory utilization (requires CloudWatch agent)"""
        # Similar to CPU but for memory metrics
        # Implementation depends on CloudWatch agent configuration
        return 0.0  # Placeholder

    def _calculate_rightsizing_recommendation(self,
                                           instance_id: str,
                                           instance_type: str,
                                           cpu_utilization: float,
                                           memory_utilization: float) -> OptimizationRecommendation:
        """Calculate rightsizing recommendation"""

        # Define thresholds
        CPU_UNDERUTILIZED = 5.0  # Under 5% CPU
        CPU_OVERUTILIZED = 80.0  # Over 80% CPU

        # Get current instance pricing
        current_cost = self._get_instance_cost(instance_type)

        # Determine recommendation
        if cpu_utilization < CPU_UNDERUTILIZED:
            # Recommend downsize
            smaller_type = self._get_smaller_instance_type(instance_type)
            if smaller_type:
                optimized_cost = self._get_instance_cost(smaller_type)
                return OptimizationRecommendation(
                    resource_id=instance_id,
                    resource_type='EC2',
                    current_cost=current_cost,
                    optimized_cost=optimized_cost,
                    savings=current_cost - optimized_cost,
                    action=f"Downsize to {smaller_type}",
                    confidence=0.8,
                    risk_level='LOW'
                )

        elif cpu_utilization > CPU_OVERUTILIZED:
            # Recommend upsize
            larger_type = self._get_larger_instance_type(instance_type)
            if larger_type:
                optimized_cost = self._get_instance_cost(larger_type)
                return OptimizationRecommendation(
                    resource_id=instance_id,
                    resource_type='EC2',
                    current_cost=current_cost,
                    optimized_cost=optimized_cost,
                    savings=current_cost - optimized_cost,  # May be negative (cost increase)
                    action=f"Upsize to {larger_type}",
                    confidence=0.7,
                    risk_level='MEDIUM'
                )

        return None

    def analyze_unused_resources(self) -> List[OptimizationRecommendation]:
        """Identify unused resources"""
        recommendations = []

        # Unused EBS volumes
        unused_volumes = self._find_unused_ebs_volumes()
        for volume in unused_volumes:
            cost_per_month = self._get_ebs_cost(volume['Size'], volume['VolumeType'])
            recommendations.append(OptimizationRecommendation(
                resource_id=volume['VolumeId'],
                resource_type='EBS',
                current_cost=cost_per_month,
                optimized_cost=0.0,
                savings=cost_per_month,
                action='Delete unused volume',
                confidence=0.9,
                risk_level='LOW'
            ))

        # Unused Elastic IPs
        unused_eips = self._find_unused_elastic_ips()
        for eip in unused_eips:
            recommendations.append(OptimizationRecommendation(
                resource_id=eip['AllocationId'],
                resource_type='EIP',
                current_cost=5.0,  # $5/month for unused EIP
                optimized_cost=0.0,
                savings=5.0,
                action='Release unused Elastic IP',
                confidence=0.95,
                risk_level='LOW'
            ))

        # Unused Load Balancers
        unused_albs = self._find_unused_load_balancers()
        for alb in unused_albs:
            cost_per_month = 22.5  # Approximate ALB cost
            recommendations.append(OptimizationRecommendation(
                resource_id=alb['LoadBalancerArn'],
                resource_type='ALB',
                current_cost=cost_per_month,
                optimized_cost=0.0,
                savings=cost_per_month,
                action='Delete unused load balancer',
                confidence=0.8,
                risk_level='MEDIUM'
            ))

        return recommendations

    def analyze_reserved_instance_opportunities(self) -> List[OptimizationRecommendation]:
        """Analyze RI purchasing opportunities"""
        recommendations = []

        # Get RI recommendations from Cost Explorer
        response = self.ce_client.get_reservation_purchase_recommendation(
            Service='Amazon Elastic Compute Cloud - Compute',
            PaymentOption='PARTIAL_UPFRONT',
            TermInYears='ONE_YEAR'
        )

        for rec in response['Recommendations']:
            details = rec['RecommendationDetails']
            savings = float(rec['RecommendationSummary']['TotalEstimatedMonthlySavings']['Amount'])

            recommendations.append(OptimizationRecommendation(
                resource_id=details['InstanceDetails']['EC2InstanceDetails']['InstanceType'],
                resource_type='RI',
                current_cost=float(details['EstimatedMonthlyCost']['Amount']),
                optimized_cost=float(details['EstimatedMonthlyCost']['Amount']) - savings,
                savings=savings,
                action=f"Purchase {details['RecommendedNumberOfInstancesToPurchase']} RIs",
                confidence=0.85,
                risk_level='LOW'
            ))

        return recommendations

    def generate_optimization_report(self) -> Dict[str, Any]:
        """Generate comprehensive optimization report"""

        # Collect all recommendations
        ec2_recommendations = self.analyze_ec2_rightsizing()
        unused_recommendations = self.analyze_unused_resources()
        ri_recommendations = self.analyze_reserved_instance_opportunities()

        all_recommendations = ec2_recommendations + unused_recommendations + ri_recommendations

        # Calculate total savings
        total_savings = sum(rec.savings for rec in all_recommendations if rec.savings > 0)
        total_current_cost = sum(rec.current_cost for rec in all_recommendations)

        # Categorize recommendations by risk and impact
        high_impact = [rec for rec in all_recommendations if rec.savings > 100]
        low_risk = [rec for rec in all_recommendations if rec.risk_level == 'LOW']

        report = {
            'summary': {
                'total_recommendations': len(all_recommendations),
                'total_potential_savings': total_savings,
                'current_monthly_cost': total_current_cost,
                'optimization_percentage': (total_savings / total_current_cost * 100) if total_current_cost > 0 else 0
            },
            'high_impact_recommendations': [
                {
                    'resource_id': rec.resource_id,
                    'resource_type': rec.resource_type,
                    'action': rec.action,
                    'monthly_savings': rec.savings,
                    'confidence': rec.confidence
                } for rec in high_impact
            ],
            'quick_wins': [
                {
                    'resource_id': rec.resource_id,
                    'resource_type': rec.resource_type,
                    'action': rec.action,
                    'monthly_savings': rec.savings
                } for rec in low_risk if rec.savings > 10
            ],
            'recommendations_by_type': {
                'ec2_rightsizing': len(ec2_recommendations),
                'unused_resources': len(unused_recommendations),
                'reserved_instances': len(ri_recommendations)
            },
            'generated_at': datetime.now().isoformat()
        }

        return report

    def _find_unused_ebs_volumes(self) -> List[Dict]:
        """Find EBS volumes not attached to any instance"""
        response = self.ec2_client.describe_volumes(
            Filters=[
                {'Name': 'status', 'Values': ['available']}
            ]
        )
        return response['Volumes']

    def _find_unused_elastic_ips(self) -> List[Dict]:
        """Find Elastic IPs not associated with any instance"""
        response = self.ec2_client.describe_addresses()
        return [eip for eip in response['Addresses'] if 'InstanceId' not in eip]

    def _find_unused_load_balancers(self) -> List[Dict]:
        """Find load balancers with no active targets"""
        elbv2_client = boto3.client('elbv2')
        response = elbv2_client.describe_load_balancers()

        unused_albs = []
        for alb in response['LoadBalancers']:
            # Check if ALB has healthy targets
            targets = elbv2_client.describe_target_groups(
                LoadBalancerArn=alb['LoadBalancerArn']
            )

            if not targets['TargetGroups']:
                unused_albs.append(alb)

        return unused_albs

# Multi-cloud cost optimization
class MultiCloudOptimizer:
    def __init__(self):
        self.aws_optimizer = AWSCostOptimizer()
        # Initialize other cloud providers
        self.cloud_costs = {}

    def compare_cloud_pricing(self, workload_requirements: Dict[str, Any]) -> Dict[str, float]:
        """Compare pricing across cloud providers"""
        pricing_comparison = {}

        # AWS pricing
        aws_cost = self._calculate_aws_cost(workload_requirements)
        pricing_comparison['AWS'] = aws_cost

        # Azure pricing
        azure_cost = self._calculate_azure_cost(workload_requirements)
        pricing_comparison['Azure'] = azure_cost

        # GCP pricing
        gcp_cost = self._calculate_gcp_cost(workload_requirements)
        pricing_comparison['GCP'] = gcp_cost

        return pricing_comparison

    def recommend_workload_placement(self, workloads: List[Dict]) -> Dict[str, Any]:
        """Recommend optimal cloud placement for workloads"""
        recommendations = {}

        for workload in workloads:
            costs = self.compare_cloud_pricing(workload['requirements'])

            # Consider additional factors beyond cost
            factors = {
                'cost': min(costs.values()),
                'latency': workload.get('latency_requirements', 0),
                'compliance': workload.get('compliance_requirements', []),
                'data_residency': workload.get('data_residency', None)
            }

            # Simple cost-based recommendation (could be more sophisticated)
            recommended_cloud = min(costs, key=costs.get)

            recommendations[workload['name']] = {
                'recommended_cloud': recommended_cloud,
                'estimated_monthly_cost': costs[recommended_cloud],
                'cost_comparison': costs,
                'factors_considered': factors
            }

        return recommendations
```

### Infrastructure as Code Optimization
```terraform
# Optimized Terraform configuration with cost controls
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state with cost optimization
  backend "s3" {
    bucket = "terraform-state-optimized"
    key    = "infrastructure/terraform.tfstate"
    region = "us-west-2"

    # Enable versioning for cost tracking
    versioning = true

    # Use IA storage class for cost savings
    server_side_encryption_configuration {
      rule {
        apply_server_side_encryption_by_default {
          sse_algorithm = "AES256"
        }
      }
    }
  }
}

# Cost optimization variables
variable "cost_center" {
  description = "Cost center for resource allocation"
  type        = string
}

variable "environment" {
  description = "Environment (dev/staging/prod)"
  type        = string

  validation {
    condition = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "auto_shutdown" {
  description = "Enable auto-shutdown for non-production environments"
  type        = bool
  default     = true
}

# Cost-optimized instance configuration
locals {
  # Environment-specific instance sizes
  instance_sizes = {
    dev     = "t3.micro"
    staging = "t3.small"
    prod    = "t3.medium"
  }

  # Spot instance eligibility
  use_spot = var.environment != "prod"

  # Common tags for cost allocation
  common_tags = {
    Environment  = var.environment
    CostCenter   = var.cost_center
    Project      = "optimization-demo"
    ManagedBy    = "terraform"
    CreatedDate  = formatdate("YYYY-MM-DD", timestamp())
  }
}

# Cost-optimized Auto Scaling Group
resource "aws_autoscaling_group" "web" {
  name                = "web-asg-${var.environment}"
  vpc_zone_identifier = data.aws_subnets.private.ids
  target_group_arns   = [aws_lb_target_group.web.arn]

  # Dynamic sizing based on environment
  min_size         = var.environment == "prod" ? 2 : 1
  max_size         = var.environment == "prod" ? 10 : 3
  desired_capacity = var.environment == "prod" ? 2 : 1

  # Cost optimization with mixed instance policy
  mixed_instances_policy {
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.web.id
        version           = "$Latest"
      }

      # Multiple instance types for spot diversity
      override {
        instance_type = local.instance_sizes[var.environment]
      }

      override {
        instance_type = "t3a.micro"  # AMD alternative
      }

      override {
        instance_type = "t4g.micro"  # ARM-based Graviton
      }
    }

    instances_distribution {
      # Use spot instances for non-prod
      on_demand_base_capacity                  = var.environment == "prod" ? 1 : 0
      on_demand_percentage_above_base_capacity = var.environment == "prod" ? 50 : 0
      spot_allocation_strategy                 = "diversified"
      spot_instance_pools                      = 3
      spot_max_price                          = "0.05"
    }
  }

  # Scheduled scaling for predictable workloads
  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  # Auto-shutdown for dev/staging
  dynamic "tag" {
    for_each = var.auto_shutdown && var.environment != "prod" ? [1] : []
    content {
      key                 = "AutoShutdown"
      value               = "true"
      propagate_at_launch = true
    }
  }
}

# Cost-optimized launch template
resource "aws_launch_template" "web" {
  name_prefix   = "web-lt-${var.environment}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = local.instance_sizes[var.environment]
  key_name      = aws_key_pair.web.key_name

  vpc_security_group_ids = [aws_security_group.web.id]

  # Instance metadata service v2 for security
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
    http_put_response_hop_limit = 1
  }

  # EBS optimization
  ebs_optimized = true

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_type           = "gp3"  # Cost-effective storage
      volume_size           = var.environment == "prod" ? 20 : 10
      delete_on_termination = true
      encrypted            = true

      # Performance tuning for gp3
      throughput = 125
      iops      = 3000
    }
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    environment = var.environment
  }))

  tag_specifications {
    resource_type = "instance"
    tags          = local.common_tags
  }

  tag_specifications {
    resource_type = "volume"
    tags          = local.common_tags
  }
}

# Cost-optimized RDS instance
resource "aws_db_instance" "main" {
  identifier = "db-${var.environment}"

  # Environment-specific instance class
  instance_class = var.environment == "prod" ? "db.r6g.large" : "db.t3.micro"

  engine         = "postgres"
  engine_version = "14.9"

  allocated_storage     = var.environment == "prod" ? 100 : 20
  max_allocated_storage = var.environment == "prod" ? 1000 : 100
  storage_type         = "gp3"
  storage_encrypted    = true

  db_name  = "appdb"
  username = "dbadmin"

  # Use AWS Secrets Manager for production
  manage_master_user_password = var.environment == "prod"

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  # Cost optimizations
  backup_retention_period = var.environment == "prod" ? 30 : 7
  backup_window          = "03:00-04:00"  # Off-peak hours
  maintenance_window     = "sun:04:00-sun:05:00"

  # Monitoring
  monitoring_interval = var.environment == "prod" ? 60 : 0
  monitoring_role_arn = var.environment == "prod" ? aws_iam_role.rds_monitoring[0].arn : null

  # Performance Insights
  performance_insights_enabled = var.environment == "prod"

  # Auto minor version upgrade
  auto_minor_version_upgrade = true

  # Deletion protection for production
  deletion_protection = var.environment == "prod"

  # Skip final snapshot for non-prod
  skip_final_snapshot = var.environment != "prod"

  tags = local.common_tags
}

# Auto-shutdown Lambda for cost savings
resource "aws_lambda_function" "auto_shutdown" {
  count = var.auto_shutdown && var.environment != "prod" ? 1 : 0

  filename         = "auto_shutdown.zip"
  function_name    = "auto-shutdown-${var.environment}"
  role            = aws_iam_role.lambda_shutdown[0].arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 60

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = local.common_tags
}

# EventBridge rule for scheduled shutdown
resource "aws_cloudwatch_event_rule" "shutdown_schedule" {
  count = var.auto_shutdown && var.environment != "prod" ? 1 : 0

  name                = "auto-shutdown-${var.environment}"
  description         = "Trigger auto-shutdown for ${var.environment} environment"
  schedule_expression = "cron(0 18 * * MON-FRI)"  # 6 PM on weekdays

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "lambda" {
  count = var.auto_shutdown && var.environment != "prod" ? 1 : 0

  rule      = aws_cloudwatch_event_rule.shutdown_schedule[0].name
  target_id = "TriggerLambdaFunction"
  arn       = aws_lambda_function.auto_shutdown[0].arn
}

# Cost monitoring and alerting
resource "aws_cloudwatch_metric_alarm" "high_cost" {
  count = var.environment == "prod" ? 1 : 0

  alarm_name          = "high-cost-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "EstimatedCharges"
  namespace           = "AWS/Billing"
  period              = "86400"  # 24 hours
  statistic           = "Maximum"
  threshold           = "1000"  # $1000
  alarm_description   = "This metric monitors estimated charges"
  alarm_actions       = [aws_sns_topic.cost_alerts[0].arn]

  dimensions = {
    Currency = "USD"
  }

  tags = local.common_tags
}

# Output cost optimization metrics
output "cost_optimization_summary" {
  description = "Cost optimization summary"
  value = {
    environment                = var.environment
    estimated_monthly_savings  = var.environment != "prod" ? "30-50%" : "10-20%"
    spot_instance_enabled     = local.use_spot
    auto_shutdown_enabled     = var.auto_shutdown && var.environment != "prod"
    storage_optimizations     = "gp3, lifecycle policies"
    monitoring_level          = var.environment == "prod" ? "enhanced" : "basic"
  }
}
```

### FinOps Dashboard Implementation
```python
# Comprehensive FinOps dashboard with cost analytics
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import boto3
from datetime import datetime, timedelta
import json

class FinOpsDashboard:
    def __init__(self):
        self.ce_client = boto3.client('ce')
        st.set_page_config(
            page_title="FinOps Dashboard",
            page_icon="💰",
            layout="wide"
        )

    def run(self):
        """Main dashboard interface"""
        st.title("☁️ Cloud FinOps Dashboard")
        st.markdown("---")

        # Sidebar controls
        with st.sidebar:
            st.header("Filters")

            # Date range selector
            days = st.selectbox("Time Period", [7, 14, 30, 60, 90], index=2)

            # Service filter
            services = ["All", "EC2", "RDS", "S3", "Lambda", "CloudWatch"]
            selected_service = st.selectbox("Service", services)

            # Refresh button
            if st.button("🔄 Refresh Data"):
                st.experimental_rerun()

        # Main dashboard layout
        col1, col2, col3, col4 = st.columns(4)

        # KPI cards
        with col1:
            self._display_cost_kpi("Current Month", self._get_current_month_cost())

        with col2:
            self._display_cost_kpi("Last Month", self._get_last_month_cost())

        with col3:
            savings = self._get_potential_savings()
            st.metric("Potential Savings", f"${savings:,.0f}", delta=f"{savings/self._get_current_month_cost()*100:.1f}%")

        with col4:
            efficiency = self._calculate_efficiency_score()
            st.metric("Efficiency Score", f"{efficiency:.1f}%", delta="2.3%")

        # Charts row 1
        col1, col2 = st.columns(2)

        with col1:
            st.subheader("📈 Cost Trend")
            cost_trend_chart = self._create_cost_trend_chart(days)
            st.plotly_chart(cost_trend_chart, use_container_width=True)

        with col2:
            st.subheader("🥧 Cost by Service")
            service_pie_chart = self._create_service_breakdown_chart()
            st.plotly_chart(service_pie_chart, use_container_width=True)

        # Charts row 2
        col1, col2 = st.columns(2)

        with col1:
            st.subheader("💡 Optimization Recommendations")
            self._display_recommendations()

        with col2:
            st.subheader("🎯 Reserved Instance Coverage")
            ri_coverage_chart = self._create_ri_coverage_chart()
            st.plotly_chart(ri_coverage_chart, use_container_width=True)

        # Detailed tables
        st.subheader("📊 Detailed Cost Analysis")

        tab1, tab2, tab3 = st.tabs(["Daily Costs", "Resource Details", "Optimization Actions"])

        with tab1:
            daily_costs = self._get_daily_costs(days)
            st.dataframe(daily_costs, use_container_width=True)

        with tab2:
            resource_details = self._get_resource_details()
            st.dataframe(resource_details, use_container_width=True)

        with tab3:
            optimization_actions = self._get_optimization_actions()
            st.dataframe(optimization_actions, use_container_width=True)

    def _display_cost_kpi(self, title: str, value: float):
        """Display cost KPI card"""
        delta_value = value - self._get_last_month_cost() if title == "Current Month" else None
        delta_str = f"{delta_value:+.1f}" if delta_value else None

        st.metric(title, f"${value:,.0f}", delta=delta_str)

    def _create_cost_trend_chart(self, days: int):
        """Create cost trend chart"""
        # Generate sample data (replace with actual AWS Cost Explorer data)
        dates = pd.date_range(end=datetime.now(), periods=days)
        costs = [1000 + i*10 + (i%7)*50 for i in range(days)]

        df = pd.DataFrame({
            'Date': dates,
            'Cost': costs,
            'Forecast': [None]*days
        })

        # Add forecast data
        forecast_dates = pd.date_range(start=dates[-1], periods=7)[1:]
        forecast_costs = [costs[-1] + i*15 for i in range(1, 8)]

        fig = go.Figure()

        # Historical costs
        fig.add_trace(go.Scatter(
            x=df['Date'], y=df['Cost'],
            mode='lines+markers',
            name='Actual Cost',
            line=dict(color='#1f77b4', width=3)
        ))

        # Forecast
        fig.add_trace(go.Scatter(
            x=forecast_dates, y=forecast_costs,
            mode='lines+markers',
            name='Forecast',
            line=dict(color='#ff7f0e', dash='dash', width=2)
        ))

        fig.update_layout(
            xaxis_title="Date",
            yaxis_title="Daily Cost ($)",
            hovermode='x unified',
            showlegend=True
        )

        return fig

    def _create_service_breakdown_chart(self):
        """Create service cost breakdown pie chart"""
        services = ['EC2', 'RDS', 'S3', 'Lambda', 'CloudWatch', 'Other']
        costs = [3500, 1200, 800, 300, 200, 500]

        fig = px.pie(
            values=costs,
            names=services,
            title="Cost Distribution by Service"
        )

        return fig

    def _display_recommendations(self):
        """Display optimization recommendations"""
        recommendations = [
            {"Action": "Rightsize t2.large instances", "Savings": "$320/month", "Confidence": "High"},
            {"Action": "Delete unused EBS volumes", "Savings": "$180/month", "Confidence": "High"},
            {"Action": "Purchase RIs for steady workloads", "Savings": "$450/month", "Confidence": "Medium"},
            {"Action": "Enable S3 lifecycle policies", "Savings": "$90/month", "Confidence": "High"}
        ]

        for rec in recommendations:
            with st.container():
                col1, col2, col3 = st.columns([3, 1, 1])
                with col1:
                    st.write(f"• {rec['Action']}")
                with col2:
                    st.write(rec['Savings'])
                with col3:
                    color = "green" if rec['Confidence'] == "High" else "orange"
                    st.markdown(f":{color}[{rec['Confidence']}]")

    def _get_current_month_cost(self) -> float:
        """Get current month cost"""
        return 6500.0  # Sample data

    def _get_last_month_cost(self) -> float:
        """Get last month cost"""
        return 6200.0  # Sample data

    def _get_potential_savings(self) -> float:
        """Calculate potential savings"""
        return 1040.0  # Sum of all recommendations

    def _calculate_efficiency_score(self) -> float:
        """Calculate cost efficiency score"""
        return 78.5  # Sample efficiency score

# Usage
if __name__ == "__main__":
    dashboard = FinOpsDashboard()
    dashboard.run()
```

## Skill Activation Triggers

This skill automatically activates when:
- Cloud cost optimization is needed
- Resource rightsizing is requested
- Multi-cloud strategy planning is required
- FinOps implementation is needed
- Infrastructure cost analysis is requested
- Cloud governance and compliance setup is required

This comprehensive cloud optimization skill provides expert-level capabilities for managing, optimizing, and governing cloud infrastructure costs across all major cloud providers using modern tools and best practices.
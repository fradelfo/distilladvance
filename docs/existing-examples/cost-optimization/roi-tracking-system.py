#!/usr/bin/env python3
"""
ROI Tracking System for Claude Code Enterprise Deployments

A comprehensive system for measuring and tracking return on investment
from Claude Code usage across enterprise organizations.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum
import logging
import json
import sqlite3
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MetricCategory(Enum):
    """Categories of ROI metrics"""
    PRODUCTIVITY = "productivity"
    QUALITY = "quality"
    COST_SAVINGS = "cost_savings"
    REVENUE_IMPACT = "revenue_impact"
    EFFICIENCY = "efficiency"
    INNOVATION = "innovation"

@dataclass
class ROIMetric:
    """Data class for ROI metrics"""
    name: str
    category: MetricCategory
    value: float
    unit: str
    measurement_date: datetime
    team_id: str
    business_unit: str
    confidence_score: float
    measurement_method: str
    notes: Optional[str] = None

@dataclass
class CostData:
    """Data class for cost information"""
    total_cost: float
    subscription_cost: float
    usage_cost: float
    implementation_cost: float
    training_cost: float
    support_cost: float
    measurement_period: timedelta
    currency: str = "USD"

@dataclass
class BenefitData:
    """Data class for benefit information"""
    productivity_savings: float
    quality_improvements: float
    cost_avoidance: float
    revenue_acceleration: float
    innovation_value: float
    measurement_period: timedelta
    currency: str = "USD"

class ROICalculator:
    """Core ROI calculation engine"""

    def __init__(self):
        self.metrics_history = []
        self.baseline_metrics = {}

    def calculate_financial_roi(self, costs: CostData, benefits: BenefitData) -> Dict[str, float]:
        """Calculate traditional financial ROI metrics"""

        total_benefits = (
            benefits.productivity_savings +
            benefits.quality_improvements +
            benefits.cost_avoidance +
            benefits.revenue_acceleration +
            benefits.innovation_value
        )

        total_costs = costs.total_cost

        # Basic ROI calculation
        roi_percentage = ((total_benefits - total_costs) / total_costs) * 100

        # Net benefit
        net_benefit = total_benefits - total_costs

        # ROI ratio
        roi_ratio = total_benefits / total_costs

        # Benefit-cost ratio
        benefit_cost_ratio = total_benefits / total_costs

        return {
            "roi_percentage": roi_percentage,
            "net_benefit": net_benefit,
            "roi_ratio": roi_ratio,
            "benefit_cost_ratio": benefit_cost_ratio,
            "total_costs": total_costs,
            "total_benefits": total_benefits
        }

    def calculate_payback_period(self, initial_investment: float,
                                monthly_net_benefit: float) -> Dict[str, float]:
        """Calculate payback period metrics"""

        if monthly_net_benefit <= 0:
            return {
                "payback_months": float('inf'),
                "payback_years": float('inf'),
                "break_even_achieved": False
            }

        payback_months = initial_investment / monthly_net_benefit
        payback_years = payback_months / 12

        return {
            "payback_months": payback_months,
            "payback_years": payback_years,
            "break_even_achieved": True
        }

    def calculate_npv(self, cash_flows: List[float], discount_rate: float) -> float:
        """Calculate Net Present Value"""

        npv = 0
        for i, cash_flow in enumerate(cash_flows):
            npv += cash_flow / ((1 + discount_rate) ** i)

        return npv

    def calculate_irr(self, cash_flows: List[float], initial_guess: float = 0.1) -> float:
        """Calculate Internal Rate of Return using Newton-Raphson method"""

        def npv_func(rate):
            return sum(cf / ((1 + rate) ** i) for i, cf in enumerate(cash_flows))

        def npv_derivative(rate):
            return sum(-i * cf / ((1 + rate) ** (i + 1)) for i, cf in enumerate(cash_flows) if i > 0)

        rate = initial_guess
        for _ in range(100):  # Maximum iterations
            npv = npv_func(rate)
            if abs(npv) < 1e-6:  # Convergence threshold
                return rate

            derivative = npv_derivative(rate)
            if abs(derivative) < 1e-10:
                break

            rate = rate - npv / derivative

            if rate < -0.99 or rate > 1000:  # Reasonable bounds
                break

        return rate if not np.isnan(rate) else None

class ProductivityAnalyzer:
    """Analyze productivity improvements from Claude Code usage"""

    def __init__(self):
        self.baseline_metrics = {}

    def measure_coding_productivity(self, usage_data: pd.DataFrame) -> Dict[str, float]:
        """Measure coding productivity improvements"""

        # Group data by user and calculate metrics
        user_metrics = usage_data.groupby('user_id').agg({
            'lines_of_code_generated': 'sum',
            'time_saved_minutes': 'sum',
            'tasks_completed': 'sum',
            'code_review_time_minutes': 'sum',
            'bug_fix_time_minutes': 'sum'
        }).reset_index()

        # Calculate productivity metrics
        avg_time_saved_per_user = user_metrics['time_saved_minutes'].mean()
        total_loc_generated = user_metrics['lines_of_code_generated'].sum()
        avg_tasks_per_user = user_metrics['tasks_completed'].mean()

        # Estimate productivity improvement
        avg_developer_hours_per_month = 160  # ~20 working days * 8 hours
        avg_time_saved_hours = avg_time_saved_per_user / 60
        productivity_improvement_percentage = (avg_time_saved_hours / avg_developer_hours_per_month) * 100

        return {
            "avg_time_saved_minutes_per_user": avg_time_saved_per_user,
            "total_lines_of_code_generated": total_loc_generated,
            "avg_tasks_completed_per_user": avg_tasks_per_user,
            "productivity_improvement_percentage": productivity_improvement_percentage,
            "total_users": len(user_metrics)
        }

    def calculate_development_velocity_improvement(self, before_data: Dict, after_data: Dict) -> Dict[str, float]:
        """Calculate development velocity improvements"""

        # Story points completed per sprint
        velocity_improvement = ((after_data['story_points_per_sprint'] - before_data['story_points_per_sprint'])
                               / before_data['story_points_per_sprint']) * 100

        # Cycle time reduction
        cycle_time_reduction = ((before_data['avg_cycle_time_days'] - after_data['avg_cycle_time_days'])
                               / before_data['avg_cycle_time_days']) * 100

        # Lead time reduction
        lead_time_reduction = ((before_data['avg_lead_time_days'] - after_data['avg_lead_time_days'])
                              / before_data['avg_lead_time_days']) * 100

        return {
            "velocity_improvement_percentage": velocity_improvement,
            "cycle_time_reduction_percentage": cycle_time_reduction,
            "lead_time_reduction_percentage": lead_time_reduction,
            "deployment_frequency_improvement": after_data.get('deployments_per_week', 0) - before_data.get('deployments_per_week', 0)
        }

class QualityAnalyzer:
    """Analyze quality improvements from Claude Code usage"""

    def calculate_code_quality_improvements(self, before_metrics: Dict, after_metrics: Dict) -> Dict[str, float]:
        """Calculate code quality improvements"""

        # Bug density reduction
        bug_density_reduction = ((before_metrics['bugs_per_kloc'] - after_metrics['bugs_per_kloc'])
                                / before_metrics['bugs_per_kloc']) * 100

        # Test coverage improvement
        test_coverage_improvement = after_metrics['test_coverage_percentage'] - before_metrics['test_coverage_percentage']

        # Security vulnerability reduction
        security_vuln_reduction = ((before_metrics['security_vulnerabilities'] - after_metrics['security_vulnerabilities'])
                                  / before_metrics['security_vulnerabilities']) * 100 if before_metrics['security_vulnerabilities'] > 0 else 0

        # Code maintainability improvement
        maintainability_improvement = after_metrics['maintainability_score'] - before_metrics['maintainability_score']

        return {
            "bug_density_reduction_percentage": bug_density_reduction,
            "test_coverage_improvement_percentage": test_coverage_improvement,
            "security_vulnerability_reduction_percentage": security_vuln_reduction,
            "maintainability_improvement_score": maintainability_improvement
        }

    def calculate_quality_cost_savings(self, quality_improvements: Dict, developer_hourly_rate: float) -> Dict[str, float]:
        """Calculate cost savings from quality improvements"""

        # Estimate time saved on bug fixes
        avg_bug_fix_time_hours = 4  # Average time to fix a bug
        bugs_prevented_per_month = quality_improvements.get('bug_density_reduction_percentage', 0) * 0.1  # Rough estimate
        bug_fix_cost_savings = bugs_prevented_per_month * avg_bug_fix_time_hours * developer_hourly_rate

        # Estimate reduced rework costs
        rework_reduction_percentage = quality_improvements.get('test_coverage_improvement_percentage', 0) * 0.5  # Rough correlation
        estimated_rework_hours_per_month = 20  # Per developer
        rework_cost_savings = (rework_reduction_percentage / 100) * estimated_rework_hours_per_month * developer_hourly_rate

        # Security vulnerability cost avoidance
        security_incident_cost = 50000  # Average cost of security incident
        security_incidents_avoided_per_year = quality_improvements.get('security_vulnerability_reduction_percentage', 0) * 0.01  # Conservative estimate
        security_cost_avoidance_monthly = (security_incidents_avoided_per_year / 12) * security_incident_cost

        return {
            "bug_fix_cost_savings_monthly": bug_fix_cost_savings,
            "rework_cost_savings_monthly": rework_cost_savings,
            "security_cost_avoidance_monthly": security_cost_avoidance_monthly,
            "total_quality_cost_savings_monthly": bug_fix_cost_savings + rework_cost_savings + security_cost_avoidance_monthly
        }

class BusinessImpactAnalyzer:
    """Analyze business impact and revenue effects"""

    def calculate_time_to_market_impact(self, delivery_acceleration: Dict) -> Dict[str, float]:
        """Calculate time-to-market improvements and revenue impact"""

        # Feature delivery acceleration
        features_delivered_faster_per_month = delivery_acceleration.get('velocity_improvement_percentage', 0) * 0.1
        avg_feature_revenue_impact = 100000  # Average revenue impact per feature per month

        # Faster time to market revenue
        ttm_revenue_acceleration = features_delivered_faster_per_month * avg_feature_revenue_impact

        # Competitive advantage value
        market_position_improvement = delivery_acceleration.get('lead_time_reduction_percentage', 0) * 0.01
        competitive_advantage_value = market_position_improvement * 500000  # Estimated monthly value

        # Customer satisfaction impact
        customer_satisfaction_improvement = min(delivery_acceleration.get('velocity_improvement_percentage', 0) * 0.02, 10)  # Cap at 10%
        customer_retention_value = customer_satisfaction_improvement * 50000  # Estimated monthly retention value

        return {
            "time_to_market_revenue_monthly": ttm_revenue_acceleration,
            "competitive_advantage_value_monthly": competitive_advantage_value,
            "customer_retention_value_monthly": customer_retention_value,
            "total_business_impact_monthly": ttm_revenue_acceleration + competitive_advantage_value + customer_retention_value
        }

class ROITrackingSystem:
    """Main ROI tracking system coordinating all components"""

    def __init__(self, database_path: str = "roi_tracking.db"):
        self.database_path = database_path
        self.roi_calculator = ROICalculator()
        self.productivity_analyzer = ProductivityAnalyzer()
        self.quality_analyzer = QualityAnalyzer()
        self.business_impact_analyzer = BusinessImpactAnalyzer()

        self._initialize_database()

    def _initialize_database(self):
        """Initialize SQLite database for storing ROI data"""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()

        # Create tables
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS roi_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                value REAL NOT NULL,
                unit TEXT NOT NULL,
                measurement_date TEXT NOT NULL,
                team_id TEXT,
                business_unit TEXT,
                confidence_score REAL,
                measurement_method TEXT,
                notes TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cost_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                measurement_date TEXT NOT NULL,
                total_cost REAL NOT NULL,
                subscription_cost REAL,
                usage_cost REAL,
                implementation_cost REAL,
                training_cost REAL,
                support_cost REAL,
                business_unit TEXT,
                currency TEXT DEFAULT 'USD'
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS roi_calculations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                calculation_date TEXT NOT NULL,
                calculation_type TEXT NOT NULL,
                result_json TEXT NOT NULL,
                business_unit TEXT,
                time_period_start TEXT,
                time_period_end TEXT
            )
        ''')

        conn.commit()
        conn.close()

    def record_metric(self, metric: ROIMetric):
        """Record an ROI metric in the database"""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO roi_metrics
            (name, category, value, unit, measurement_date, team_id, business_unit, confidence_score, measurement_method, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            metric.name,
            metric.category.value,
            metric.value,
            metric.unit,
            metric.measurement_date.isoformat(),
            metric.team_id,
            metric.business_unit,
            metric.confidence_score,
            metric.measurement_method,
            metric.notes
        ))

        conn.commit()
        conn.close()
        logger.info(f"Recorded metric: {metric.name} = {metric.value} {metric.unit}")

    def calculate_comprehensive_roi(self, business_unit: str,
                                   start_date: datetime,
                                   end_date: datetime) -> Dict[str, Any]:
        """Calculate comprehensive ROI for a business unit over a time period"""

        # Get cost data
        costs = self._get_cost_data(business_unit, start_date, end_date)

        # Get productivity improvements
        productivity_data = self._get_productivity_data(business_unit, start_date, end_date)
        productivity_analysis = self.productivity_analyzer.measure_coding_productivity(productivity_data)

        # Get quality improvements
        quality_before, quality_after = self._get_quality_data(business_unit, start_date, end_date)
        quality_analysis = self.quality_analyzer.calculate_code_quality_improvements(quality_before, quality_after)
        quality_savings = self.quality_analyzer.calculate_quality_cost_savings(quality_analysis, 75)  # $75/hour developer rate

        # Get business impact
        delivery_data = self._get_delivery_data(business_unit, start_date, end_date)
        business_impact = self.business_impact_analyzer.calculate_time_to_market_impact(delivery_data)

        # Calculate total benefits
        total_benefits = {
            "productivity_savings": self._calculate_productivity_value(productivity_analysis, 75),
            "quality_cost_savings": quality_savings['total_quality_cost_savings_monthly'],
            "business_impact_value": business_impact['total_business_impact_monthly']
        }

        # Prepare cost and benefit data structures
        cost_data = CostData(
            total_cost=costs['total_cost'],
            subscription_cost=costs['subscription_cost'],
            usage_cost=costs['usage_cost'],
            implementation_cost=costs['implementation_cost'],
            training_cost=costs['training_cost'],
            support_cost=costs['support_cost'],
            measurement_period=end_date - start_date
        )

        benefit_data = BenefitData(
            productivity_savings=total_benefits['productivity_savings'],
            quality_improvements=total_benefits['quality_cost_savings'],
            cost_avoidance=quality_savings['security_cost_avoidance_monthly'],
            revenue_acceleration=business_impact['time_to_market_revenue_monthly'],
            innovation_value=business_impact['competitive_advantage_value_monthly'],
            measurement_period=end_date - start_date
        )

        # Calculate financial ROI
        financial_roi = self.roi_calculator.calculate_financial_roi(cost_data, benefit_data)

        # Calculate payback period
        payback = self.roi_calculator.calculate_payback_period(
            costs['total_cost'],
            sum(total_benefits.values())
        )

        # Compile comprehensive results
        roi_results = {
            "calculation_date": datetime.utcnow().isoformat(),
            "business_unit": business_unit,
            "time_period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
                "duration_days": (end_date - start_date).days
            },
            "financial_metrics": financial_roi,
            "payback_analysis": payback,
            "productivity_analysis": productivity_analysis,
            "quality_analysis": quality_analysis,
            "business_impact_analysis": business_impact,
            "cost_breakdown": {
                "subscription_cost": costs['subscription_cost'],
                "usage_cost": costs['usage_cost'],
                "implementation_cost": costs['implementation_cost'],
                "training_cost": costs['training_cost'],
                "support_cost": costs['support_cost']
            },
            "benefit_breakdown": total_benefits,
            "recommendations": self._generate_roi_recommendations(financial_roi, productivity_analysis, quality_analysis)
        }

        # Store calculation results
        self._store_calculation_results(roi_results)

        return roi_results

    def _calculate_productivity_value(self, productivity_analysis: Dict, hourly_rate: float) -> float:
        """Calculate monetary value of productivity improvements"""

        time_saved_hours = productivity_analysis['avg_time_saved_minutes_per_user'] / 60
        total_users = productivity_analysis['total_users']

        return time_saved_hours * total_users * hourly_rate

    def _get_cost_data(self, business_unit: str, start_date: datetime, end_date: datetime) -> Dict[str, float]:
        """Retrieve cost data from database"""
        # This would typically query actual cost data
        # For demo purposes, returning sample data
        return {
            "total_cost": 50000,
            "subscription_cost": 30000,
            "usage_cost": 15000,
            "implementation_cost": 3000,
            "training_cost": 1500,
            "support_cost": 500
        }

    def _get_productivity_data(self, business_unit: str, start_date: datetime, end_date: datetime) -> pd.DataFrame:
        """Retrieve productivity data"""
        # Sample data for demo
        return pd.DataFrame({
            'user_id': range(50),
            'lines_of_code_generated': np.random.normal(5000, 1500, 50),
            'time_saved_minutes': np.random.normal(1200, 300, 50),
            'tasks_completed': np.random.normal(25, 8, 50),
            'code_review_time_minutes': np.random.normal(300, 100, 50),
            'bug_fix_time_minutes': np.random.normal(180, 60, 50)
        })

    def _get_quality_data(self, business_unit: str, start_date: datetime, end_date: datetime) -> Tuple[Dict, Dict]:
        """Retrieve quality metrics before and after Claude Code implementation"""

        before_metrics = {
            'bugs_per_kloc': 15.0,
            'test_coverage_percentage': 65.0,
            'security_vulnerabilities': 25,
            'maintainability_score': 6.5
        }

        after_metrics = {
            'bugs_per_kloc': 8.0,
            'test_coverage_percentage': 82.0,
            'security_vulnerabilities': 12,
            'maintainability_score': 8.2
        }

        return before_metrics, after_metrics

    def _get_delivery_data(self, business_unit: str, start_date: datetime, end_date: datetime) -> Dict[str, float]:
        """Retrieve delivery and velocity data"""

        return {
            'velocity_improvement_percentage': 28.0,
            'cycle_time_reduction_percentage': 35.0,
            'lead_time_reduction_percentage': 42.0,
            'deployment_frequency_improvement': 3.5
        }

    def _generate_roi_recommendations(self, financial_roi: Dict,
                                    productivity_analysis: Dict,
                                    quality_analysis: Dict) -> List[str]:
        """Generate actionable recommendations based on ROI analysis"""

        recommendations = []

        if financial_roi['roi_percentage'] < 50:
            recommendations.append("Consider optimization strategies to improve ROI - current ROI is below target")

        if productivity_analysis['productivity_improvement_percentage'] < 20:
            recommendations.append("Increase training programs to improve productivity gains")

        if quality_analysis.get('bug_density_reduction_percentage', 0) < 30:
            recommendations.append("Focus on code quality initiatives to maximize quality benefits")

        if financial_roi['roi_percentage'] > 200:
            recommendations.append("Excellent ROI achieved - consider expanding Claude Code usage to other teams")

        return recommendations

    def _store_calculation_results(self, results: Dict):
        """Store ROI calculation results in database"""

        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO roi_calculations
            (calculation_date, calculation_type, result_json, business_unit, time_period_start, time_period_end)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            results['calculation_date'],
            'comprehensive_roi',
            json.dumps(results),
            results['business_unit'],
            results['time_period']['start'],
            results['time_period']['end']
        ))

        conn.commit()
        conn.close()

    def generate_roi_report(self, business_unit: str = None) -> str:
        """Generate a comprehensive ROI report"""

        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=90)  # Last 90 days

        if business_unit:
            roi_results = self.calculate_comprehensive_roi(business_unit, start_date, end_date)
        else:
            # Calculate for all business units
            business_units = ['engineering', 'data_science', 'product_management']
            roi_results = {}
            for bu in business_units:
                roi_results[bu] = self.calculate_comprehensive_roi(bu, start_date, end_date)

        # Generate formatted report
        report = self._format_roi_report(roi_results)

        return report

    def _format_roi_report(self, roi_results: Dict) -> str:
        """Format ROI results into a readable report"""

        if isinstance(roi_results, dict) and 'financial_metrics' in roi_results:
            # Single business unit
            return self._format_single_unit_report(roi_results)
        else:
            # Multiple business units
            return self._format_multi_unit_report(roi_results)

    def _format_single_unit_report(self, results: Dict) -> str:
        """Format report for a single business unit"""

        financial = results['financial_metrics']
        payback = results['payback_analysis']

        report = f"""
Claude Code ROI Report - {results['business_unit']}
{'='*50}

Executive Summary:
- ROI: {financial['roi_percentage']:.1f}%
- Net Benefit: ${financial['net_benefit']:,.0f}
- Payback Period: {payback['payback_months']:.1f} months
- Total Investment: ${financial['total_costs']:,.0f}
- Total Benefits: ${financial['total_benefits']:,.0f}

Productivity Improvements:
- Time Saved: {results['productivity_analysis']['productivity_improvement_percentage']:.1f}%
- Lines of Code Generated: {results['productivity_analysis']['total_lines_of_code_generated']:,.0f}

Quality Improvements:
- Bug Density Reduction: {results['quality_analysis']['bug_density_reduction_percentage']:.1f}%
- Test Coverage Improvement: {results['quality_analysis']['test_coverage_improvement_percentage']:.1f}%

Recommendations:
"""

        for rec in results['recommendations']:
            report += f"- {rec}\n"

        return report

    def _format_multi_unit_report(self, results: Dict) -> str:
        """Format report for multiple business units"""

        report = "Claude Code Enterprise ROI Report\n"
        report += "="*40 + "\n\n"

        total_investment = 0
        total_benefits = 0

        for bu, bu_results in results.items():
            financial = bu_results['financial_metrics']
            total_investment += financial['total_costs']
            total_benefits += financial['total_benefits']

            report += f"{bu.title()} Division:\n"
            report += f"  ROI: {financial['roi_percentage']:.1f}%\n"
            report += f"  Investment: ${financial['total_costs']:,.0f}\n"
            report += f"  Benefits: ${financial['total_benefits']:,.0f}\n\n"

        overall_roi = ((total_benefits - total_investment) / total_investment) * 100

        report += f"Enterprise Summary:\n"
        report += f"  Overall ROI: {overall_roi:.1f}%\n"
        report += f"  Total Investment: ${total_investment:,.0f}\n"
        report += f"  Total Benefits: ${total_benefits:,.0f}\n"
        report += f"  Net Benefit: ${total_benefits - total_investment:,.0f}\n"

        return report

# Usage Example and Demo
if __name__ == "__main__":
    # Initialize ROI tracking system
    roi_system = ROITrackingSystem()

    # Record some sample metrics
    productivity_metric = ROIMetric(
        name="Developer Productivity Improvement",
        category=MetricCategory.PRODUCTIVITY,
        value=28.5,
        unit="percentage",
        measurement_date=datetime.utcnow(),
        team_id="engineering_team_1",
        business_unit="engineering",
        confidence_score=0.85,
        measurement_method="time_tracking_analysis"
    )

    roi_system.record_metric(productivity_metric)

    # Calculate comprehensive ROI for engineering division
    start_date = datetime.utcnow() - timedelta(days=90)
    end_date = datetime.utcnow()

    roi_results = roi_system.calculate_comprehensive_roi("engineering", start_date, end_date)

    print("ROI Calculation Results:")
    print(f"ROI: {roi_results['financial_metrics']['roi_percentage']:.1f}%")
    print(f"Payback Period: {roi_results['payback_analysis']['payback_months']:.1f} months")
    print(f"Net Benefit: ${roi_results['financial_metrics']['net_benefit']:,.0f}")

    # Generate comprehensive report
    report = roi_system.generate_roi_report("engineering")
    print("\nROI Report:")
    print(report)
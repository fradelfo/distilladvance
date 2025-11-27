# Business Analysis Skill

Comprehensive business analysis capabilities for requirements gathering, process optimization, and stakeholder management using modern methodologies and tools.

## Skill Overview

Expert business analysis knowledge covering requirements engineering, process modeling, stakeholder management, data analysis, and project coordination using industry-standard methodologies like Agile BA, Lean Six Sigma, and design thinking.

## Core Capabilities

### Requirements Engineering
- **Requirements elicitation** - Stakeholder interviews, workshops, observations
- **Requirements analysis** - Functional, non-functional, business rules documentation
- **Requirements validation** - Review processes, acceptance criteria definition
- **Requirements traceability** - End-to-end requirement tracking and impact analysis

### Process Analysis & Design
- **Current state analysis** - As-is process mapping and pain point identification
- **Future state design** - To-be process optimization and improvement recommendations
- **Gap analysis** - Identifying process improvement opportunities and ROI estimation
- **Change impact assessment** - Risk analysis and change management planning

### Stakeholder Management
- **Stakeholder identification** - Primary, secondary, and key influencer mapping
- **Communication planning** - Tailored messaging and engagement strategies
- **Conflict resolution** - Managing competing priorities and requirements
- **Consensus building** - Facilitation techniques for agreement and buy-in

### Data Analysis & Insights
- **Business intelligence** - KPI definition, dashboard design, reporting automation
- **Data modeling** - Logical and conceptual data model creation
- **Performance metrics** - Baseline measurement and improvement tracking
- **Predictive analytics** - Trend analysis and forecasting for business decisions

## Modern Business Analysis Methodologies

### Agile Business Analysis
```markdown
# Agile BA Practices

## User Story Development
**As a** [user type]
**I want** [functionality]
**So that** [business value]

**Acceptance Criteria:**
- Given [context]
- When [action]
- Then [outcome]

**Definition of Ready:**
- [ ] User story is independent
- [ ] User story is negotiable
- [ ] User story is valuable
- [ ] User story is estimable
- [ ] User story is small
- [ ] User story is testable

**Definition of Done:**
- [ ] Code is written and reviewed
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] User story meets acceptance criteria
- [ ] Documentation is updated
- [ ] Stakeholder approval obtained
```

### Process Modeling with BPMN 2.0
```xml
<!-- Business Process Model and Notation example -->
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="CustomerOnboarding" name="Customer Onboarding Process">

    <bpmn:startEvent id="StartEvent_1" name="New customer application received">
      <bpmn:outgoing>SequenceFlow_1</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:task id="Task_ValidateApplication" name="Validate customer application">
      <bpmn:incoming>SequenceFlow_1</bpmn:incoming>
      <bpmn:outgoing>SequenceFlow_2</bpmn:outgoing>
    </bpmn:task>

    <bpmn:exclusiveGateway id="Gateway_ValidationResult" name="Application valid?">
      <bpmn:incoming>SequenceFlow_2</bpmn:incoming>
      <bpmn:outgoing>SequenceFlow_Approved</bpmn:outgoing>
      <bpmn:outgoing>SequenceFlow_Rejected</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:task id="Task_SetupAccount" name="Setup customer account">
      <bpmn:incoming>SequenceFlow_Approved</bpmn:incoming>
      <bpmn:outgoing>SequenceFlow_3</bpmn:outgoing>
    </bpmn:task>

    <bpmn:task id="Task_SendRejection" name="Send rejection notification">
      <bpmn:incoming>SequenceFlow_Rejected</bpmn:incoming>
      <bpmn:outgoing>SequenceFlow_4</bpmn:outgoing>
    </bpmn:task>

    <bpmn:endEvent id="EndEvent_1" name="Process completed">
      <bpmn:incoming>SequenceFlow_3</bpmn:incoming>
      <bpmn:incoming>SequenceFlow_4</bpmn:incoming>
    </bpmn:endEvent>

  </bpmn:process>
</bpmn:definitions>
```

### Requirements Traceability Matrix
```markdown
# Requirements Traceability Matrix

| Req ID | Requirement | Business Need | Design Element | Test Case | Status |
|--------|-------------|---------------|----------------|-----------|--------|
| REQ-001 | User login with MFA | Security compliance | Authentication service | TC-001 | Complete |
| REQ-002 | Real-time notifications | User engagement | WebSocket service | TC-002 | In Progress |
| REQ-003 | Data export functionality | Regulatory compliance | Export API | TC-003 | Not Started |
| REQ-004 | Mobile responsiveness | User accessibility | Responsive UI | TC-004 | Complete |

## Traceability Rules
- All requirements must link to a business need
- All design elements must trace to requirements
- All test cases must validate requirements
- Impact analysis required for requirement changes
```

## Stakeholder Analysis & Management

### Stakeholder Mapping Framework
```python
# Stakeholder analysis automation
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from typing import List, Dict, Any

class StakeholderAnalyzer:
    def __init__(self):
        self.stakeholders = []

    def add_stakeholder(self, name: str, role: str, influence: int,
                       interest: int, attitude: str, communication_preference: str):
        """Add stakeholder with analysis metrics"""
        stakeholder = {
            'name': name,
            'role': role,
            'influence': influence,  # 1-10 scale
            'interest': interest,    # 1-10 scale
            'attitude': attitude,    # supportive, neutral, resistant
            'communication_preference': communication_preference,
            'engagement_strategy': self._determine_strategy(influence, interest),
            'priority': self._calculate_priority(influence, interest)
        }
        self.stakeholders.append(stakeholder)

    def _determine_strategy(self, influence: int, interest: int) -> str:
        """Determine engagement strategy based on influence/interest"""
        if influence >= 7 and interest >= 7:
            return "Manage Closely"
        elif influence >= 7 and interest < 7:
            return "Keep Satisfied"
        elif influence < 7 and interest >= 7:
            return "Keep Informed"
        else:
            return "Monitor"

    def _calculate_priority(self, influence: int, interest: int) -> str:
        """Calculate stakeholder priority"""
        score = (influence * 0.6) + (interest * 0.4)
        if score >= 8:
            return "High"
        elif score >= 6:
            return "Medium"
        else:
            return "Low"

    def generate_power_interest_grid(self):
        """Create power/interest grid visualization"""
        df = pd.DataFrame(self.stakeholders)

        plt.figure(figsize=(12, 8))
        colors = {'supportive': 'green', 'neutral': 'yellow', 'resistant': 'red'}

        for attitude, color in colors.items():
            subset = df[df['attitude'] == attitude]
            plt.scatter(subset['interest'], subset['influence'],
                       c=color, label=attitude, s=100, alpha=0.7)

        # Add quadrant lines
        plt.axhline(y=5, color='gray', linestyle='--', alpha=0.5)
        plt.axvline(x=5, color='gray', linestyle='--', alpha=0.5)

        # Add quadrant labels
        plt.text(2.5, 8.5, 'Keep Satisfied\n(High Power, Low Interest)',
                ha='center', va='center', fontsize=10, alpha=0.7)
        plt.text(7.5, 8.5, 'Manage Closely\n(High Power, High Interest)',
                ha='center', va='center', fontsize=10, alpha=0.7)
        plt.text(2.5, 2.5, 'Monitor\n(Low Power, Low Interest)',
                ha='center', va='center', fontsize=10, alpha=0.7)
        plt.text(7.5, 2.5, 'Keep Informed\n(Low Power, High Interest)',
                ha='center', va='center', fontsize=10, alpha=0.7)

        plt.xlabel('Interest Level')
        plt.ylabel('Influence Level')
        plt.title('Stakeholder Power/Interest Grid')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.show()

    def generate_communication_plan(self) -> pd.DataFrame:
        """Generate stakeholder communication plan"""
        df = pd.DataFrame(self.stakeholders)

        communication_plan = df.groupby(['engagement_strategy', 'communication_preference']).agg({
            'name': list,
            'priority': 'first'
        }).reset_index()

        return communication_plan

# Example usage
analyzer = StakeholderAnalyzer()

# Add stakeholders
analyzer.add_stakeholder("CEO", "Executive Sponsor", 9, 6, "supportive", "executive_briefing")
analyzer.add_stakeholder("IT Director", "Technical Lead", 8, 9, "neutral", "technical_meeting")
analyzer.add_stakeholder("End Users", "System Users", 3, 8, "resistant", "user_workshop")
analyzer.add_stakeholder("Compliance Officer", "Regulatory", 7, 7, "supportive", "formal_report")

# Generate analysis
analyzer.generate_power_interest_grid()
communication_plan = analyzer.generate_communication_plan()
```

### Business Process Analysis
```python
# Process performance analysis
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import plotly.express as px
import plotly.graph_objects as go

class ProcessAnalyzer:
    def __init__(self, process_data: pd.DataFrame):
        self.data = process_data
        self.kpis = {}

    def calculate_cycle_time(self) -> Dict[str, float]:
        """Calculate process cycle time metrics"""
        cycle_times = (self.data['end_time'] - self.data['start_time']).dt.total_seconds() / 3600

        self.kpis['cycle_time'] = {
            'mean': cycle_times.mean(),
            'median': cycle_times.median(),
            'p95': cycle_times.quantile(0.95),
            'p99': cycle_times.quantile(0.99),
            'std': cycle_times.std()
        }

        return self.kpis['cycle_time']

    def identify_bottlenecks(self) -> pd.DataFrame:
        """Identify process bottlenecks"""
        step_times = {}

        for step in self.data['process_step'].unique():
            step_data = self.data[self.data['process_step'] == step]
            step_duration = (step_data['step_end'] - step_data['step_start']).dt.total_seconds() / 3600

            step_times[step] = {
                'avg_duration': step_duration.mean(),
                'volume': len(step_data),
                'utilization': step_duration.sum(),
                'bottleneck_score': step_duration.mean() * len(step_data)
            }

        bottleneck_df = pd.DataFrame(step_times).T
        bottleneck_df = bottleneck_df.sort_values('bottleneck_score', ascending=False)

        return bottleneck_df

    def analyze_process_efficiency(self) -> Dict[str, Any]:
        """Comprehensive process efficiency analysis"""
        # First Time Right (FTR) rate
        ftr_rate = (self.data['rework_count'] == 0).mean() * 100

        # Process yield
        completed_cases = self.data[self.data['status'] == 'completed']
        process_yield = len(completed_cases) / len(self.data) * 100

        # Cost per transaction
        total_cost = self.data['labor_cost'] + self.data['system_cost']
        cost_per_transaction = total_cost.mean()

        # SLA compliance
        sla_met = (self.data['actual_duration'] <= self.data['sla_target']).mean() * 100

        efficiency_metrics = {
            'first_time_right_rate': ftr_rate,
            'process_yield': process_yield,
            'cost_per_transaction': cost_per_transaction,
            'sla_compliance': sla_met,
            'total_volume': len(self.data),
            'avg_processing_time': self.data['actual_duration'].mean()
        }

        return efficiency_metrics

    def generate_process_dashboard(self):
        """Create interactive process performance dashboard"""
        # Cycle time trend
        daily_cycle_time = self.data.groupby(self.data['start_time'].dt.date)['actual_duration'].mean()

        fig_trend = px.line(x=daily_cycle_time.index, y=daily_cycle_time.values,
                           title='Daily Average Cycle Time Trend')
        fig_trend.show()

        # Volume by process step
        volume_by_step = self.data['process_step'].value_counts()
        fig_volume = px.bar(x=volume_by_step.index, y=volume_by_step.values,
                           title='Transaction Volume by Process Step')
        fig_volume.show()

        # Cycle time distribution
        fig_dist = px.histogram(self.data, x='actual_duration', nbins=20,
                               title='Cycle Time Distribution')
        fig_dist.show()

# Process improvement recommendations
def generate_improvement_recommendations(efficiency_metrics: Dict, bottlenecks: pd.DataFrame) -> List[str]:
    """Generate automated process improvement recommendations"""
    recommendations = []

    if efficiency_metrics['first_time_right_rate'] < 80:
        recommendations.append(
            "QUALITY: Implement quality gates and validation checkpoints to improve First Time Right rate"
        )

    if efficiency_metrics['sla_compliance'] < 90:
        recommendations.append(
            "PERFORMANCE: Analyze and optimize the slowest process steps to improve SLA compliance"
        )

    # Identify top bottleneck
    top_bottleneck = bottlenecks.index[0]
    recommendations.append(
        f"BOTTLENECK: Focus improvement efforts on '{top_bottleneck}' step which shows highest impact"
    )

    if efficiency_metrics['cost_per_transaction'] > 100:  # Arbitrary threshold
        recommendations.append(
            "COST: Investigate automation opportunities for high-cost manual activities"
        )

    return recommendations
```

## Business Intelligence & Reporting

### KPI Dashboard Development
```python
# Automated KPI dashboard generator
import plotly.dashboard as dash
from plotly.dependencies import Input, Output
import plotly.graph_objs as go
import pandas as pd

class BusinessDashboard:
    def __init__(self):
        self.app = dash.Dash(__name__)
        self.setup_layout()
        self.setup_callbacks()

    def setup_layout(self):
        """Create responsive dashboard layout"""
        self.app.layout = dash.html.Div([
            # Header
            dash.html.H1("Business Performance Dashboard", className="header"),

            # KPI Cards
            dash.html.Div([
                dash.html.Div([
                    dash.html.H3("Revenue", className="kpi-title"),
                    dash.html.H2(id="revenue-value", className="kpi-value"),
                    dash.html.P(id="revenue-change", className="kpi-change")
                ], className="kpi-card"),

                dash.html.Div([
                    dash.html.H3("Customer Acquisition", className="kpi-title"),
                    dash.html.H2(id="acquisition-value", className="kpi-value"),
                    dash.html.P(id="acquisition-change", className="kpi-change")
                ], className="kpi-card"),

                dash.html.Div([
                    dash.html.H3("Process Efficiency", className="kpi-title"),
                    dash.html.H2(id="efficiency-value", className="kpi-value"),
                    dash.html.P(id="efficiency-change", className="kpi-change")
                ], className="kpi-card"),
            ], className="kpi-container"),

            # Charts
            dash.html.Div([
                dash.html.Div([
                    dash.dcc.Graph(id="revenue-trend")
                ], className="chart-container"),

                dash.html.Div([
                    dash.dcc.Graph(id="conversion-funnel")
                ], className="chart-container")
            ], className="charts-row"),

            # Data table
            dash.html.Div([
                dash.html.H3("Recent Transactions"),
                dash.dash_table.DataTable(
                    id="transactions-table",
                    columns=[
                        {"name": "Date", "id": "date"},
                        {"name": "Customer", "id": "customer"},
                        {"name": "Amount", "id": "amount", "type": "numeric", "format": {"specifier": "$.0f"}},
                        {"name": "Status", "id": "status"}
                    ],
                    page_size=10,
                    sort_action="native"
                )
            ], className="table-container"),

            # Auto-refresh interval
            dash.dcc.Interval(
                id='interval-component',
                interval=60*1000,  # Update every minute
                n_intervals=0
            )
        ])

    def setup_callbacks(self):
        """Setup dashboard callbacks for interactivity"""

        @self.app.callback(
            [Output('revenue-value', 'children'),
             Output('revenue-change', 'children'),
             Output('acquisition-value', 'children'),
             Output('acquisition-change', 'children'),
             Output('efficiency-value', 'children'),
             Output('efficiency-change', 'children')],
            [Input('interval-component', 'n_intervals')]
        )
        def update_kpi_cards(n):
            # Fetch latest data (would connect to actual data source)
            current_data = self.fetch_current_kpis()
            previous_data = self.fetch_previous_kpis()

            revenue_change = ((current_data['revenue'] - previous_data['revenue']) /
                            previous_data['revenue']) * 100

            acquisition_change = ((current_data['acquisition'] - previous_data['acquisition']) /
                                previous_data['acquisition']) * 100

            efficiency_change = ((current_data['efficiency'] - previous_data['efficiency']) /
                               previous_data['efficiency']) * 100

            return (
                f"${current_data['revenue']:,.0f}",
                f"{revenue_change:+.1f}%",
                f"{current_data['acquisition']:,.0f}",
                f"{acquisition_change:+.1f}%",
                f"{current_data['efficiency']:.1f}%",
                f"{efficiency_change:+.1f}%"
            )

        @self.app.callback(
            Output('revenue-trend', 'figure'),
            [Input('interval-component', 'n_intervals')]
        )
        def update_revenue_trend(n):
            # Generate revenue trend chart
            df = self.fetch_revenue_data()

            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=df['date'],
                y=df['revenue'],
                mode='lines+markers',
                name='Revenue',
                line=dict(color='#2E86AB', width=3)
            ))

            fig.update_layout(
                title="Revenue Trend (Last 30 Days)",
                xaxis_title="Date",
                yaxis_title="Revenue ($)",
                hovermode='x unified'
            )

            return fig

    def fetch_current_kpis(self) -> Dict[str, float]:
        """Fetch current KPI values from data source"""
        # This would connect to actual database/API
        return {
            'revenue': 125000,
            'acquisition': 450,
            'efficiency': 87.5
        }

    def run_dashboard(self, debug=True, port=8050):
        """Start the dashboard server"""
        self.app.run_server(debug=debug, port=port)
```

## Requirements Documentation Templates

### Functional Requirements Specification
```markdown
# Functional Requirements Specification

## Document Information
- **Project:** Customer Portal Enhancement
- **Version:** 2.1
- **Date:** 2024-01-15
- **Author:** Business Analyst
- **Approved By:** Product Owner

## Executive Summary
This document outlines the functional requirements for enhancing the customer portal to improve user experience and operational efficiency.

## Business Objectives
1. Increase customer self-service adoption by 40%
2. Reduce customer support ticket volume by 25%
3. Improve customer satisfaction score to 4.5/5

## Functional Requirements

### FR-001: User Authentication Enhancement
**Priority:** High
**Description:** Implement multi-factor authentication for enhanced security
**Acceptance Criteria:**
- Users can enable/disable MFA from profile settings
- Support for SMS and authenticator app methods
- Backup codes provided for account recovery
- Admin can enforce MFA for specific user groups

**Business Rules:**
- MFA mandatory for users with admin privileges
- Backup codes expire after 90 days
- Failed MFA attempts trigger account lockout after 5 tries

### FR-002: Real-time Notification System
**Priority:** Medium
**Description:** Provide real-time notifications for account activities
**Acceptance Criteria:**
- Users receive notifications for account changes
- Notification preferences configurable by user
- Support for email, SMS, and in-app notifications
- Notification history available for 30 days

**Dependencies:**
- Notification service infrastructure
- User preference management system

### FR-003: Advanced Search Functionality
**Priority:** Medium
**Description:** Enhanced search with filters and auto-complete
**Acceptance Criteria:**
- Auto-complete suggestions based on user history
- Filter by date range, category, status
- Search results sorted by relevance
- Export search results to CSV

## Non-Functional Requirements

### NFR-001: Performance
- Page load time < 2 seconds for 95% of requests
- Support for 1000 concurrent users
- 99.9% uptime during business hours

### NFR-002: Security
- All data encrypted in transit and at rest
- Regular security vulnerability scans
- Compliance with GDPR and SOX requirements

### NFR-003: Usability
- Mobile-responsive design for all screen sizes
- WCAG 2.1 Level AA accessibility compliance
- Support for major browsers (Chrome, Firefox, Safari, Edge)

## Data Requirements

### Customer Data Model
```json
{
  "customer": {
    "id": "string (UUID)",
    "personal_info": {
      "first_name": "string",
      "last_name": "string",
      "email": "string (validated)",
      "phone": "string (E.164 format)"
    },
    "account_info": {
      "account_number": "string",
      "account_type": "enum [personal, business]",
      "status": "enum [active, suspended, closed]",
      "created_date": "datetime",
      "last_login": "datetime"
    },
    "preferences": {
      "notifications": {
        "email": "boolean",
        "sms": "boolean",
        "in_app": "boolean"
      },
      "language": "string (ISO 639-1)",
      "timezone": "string (IANA)"
    }
  }
}
```

## Use Cases

### UC-001: Customer Login with MFA
**Actor:** Customer
**Precondition:** Customer has valid account and MFA enabled
**Main Flow:**
1. Customer enters username and password
2. System validates credentials
3. System sends MFA code to customer's device
4. Customer enters MFA code
5. System validates MFA code
6. System grants access to customer portal

**Alternative Flows:**
- 3a. Customer uses authenticator app instead of SMS
- 4a. Customer enters backup code if device unavailable
- 5a. Invalid MFA code - customer can retry up to 3 times

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data breach | High | Low | Implement robust security measures, regular audits |
| System downtime | High | Medium | Redundant infrastructure, comprehensive monitoring |
| User adoption | Medium | Medium | Comprehensive training, gradual rollout |
| Integration issues | Medium | High | Thorough testing, phased implementation |
```

## Skill Activation Triggers

This skill automatically activates when:
- Business requirements analysis is needed
- Process improvement opportunities are identified
- Stakeholder management support is requested
- Business intelligence and reporting is required
- Project coordination and planning assistance is needed
- Change management strategies are required

This comprehensive business analysis skill provides expert-level capabilities for understanding, analyzing, and improving business processes and requirements across all organizational domains.
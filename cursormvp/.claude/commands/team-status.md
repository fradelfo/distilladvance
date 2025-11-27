---
name: team-status
description: Intelligent team status reporting with multi-agent coordination analysis and productivity insights
---

Use the orchestrator to coordinate comprehensive team status reporting with insights from all specialized agents:

**Team Status Analysis Framework:**

**Phase 1: Development Progress Assessment**
1. **Code Contribution Analysis:**
   - Individual developer commit activity and impact
   - Code review participation and turnaround times
   - Feature completion rates and velocity tracking
   - Technical debt accumulation and resolution
   - Cross-team collaboration patterns

2. **Agent Utilization and Effectiveness:**
   - Claude Code agent usage patterns and frequency
   - Agent specialization effectiveness (Frontend, Platform, Security, etc.)
   - Multi-agent workflow coordination success rates
   - AI-assisted development productivity gains
   - Agent task completion and quality metrics

**Phase 2: Project Health and Momentum**

**Development Velocity Tracking:**
```typescript
// Comprehensive development metrics analysis
class DevelopmentVelocityAnalyzer {
  async analyzeTeamVelocity(timeframe: string = '2weeks'): Promise<VelocityMetrics> {
    const gitMetrics = await this.analyzeGitActivity(timeframe)
    const issueMetrics = await this.analyzeIssueProgress(timeframe)
    const prMetrics = await this.analyzePullRequests(timeframe)
    const agentMetrics = await this.analyzeAgentUtilization(timeframe)

    return {
      period: timeframe,
      timestamp: new Date().toISOString(),

      codeMetrics: {
        totalCommits: gitMetrics.commitCount,
        linesAdded: gitMetrics.additions,
        linesRemoved: gitMetrics.deletions,
        filesChanged: gitMetrics.filesModified,
        averageCommitSize: gitMetrics.avgCommitSize,
        commitFrequency: gitMetrics.commitsPerDay,

        commitQuality: {
          conventionalCommits: gitMetrics.conventionalCommitRatio,
          averageCommitMessageLength: gitMetrics.avgMessageLength,
          revertCount: gitMetrics.reverts,
          fixCommitRatio: gitMetrics.fixCommitRatio
        }
      },

      issueProgress: {
        issuesCreated: issueMetrics.created,
        issuesResolved: issueMetrics.resolved,
        issueVelocity: issueMetrics.resolved / issueMetrics.created,
        averageResolutionTime: issueMetrics.avgResolutionTime,

        byPriority: {
          critical: { created: issueMetrics.byPriority.critical.created, resolved: issueMetrics.byPriority.critical.resolved },
          high: { created: issueMetrics.byPriority.high.created, resolved: issueMetrics.byPriority.high.resolved },
          medium: { created: issueMetrics.byPriority.medium.created, resolved: issueMetrics.byPriority.medium.resolved },
          low: { created: issueMetrics.byPriority.low.created, resolved: issueMetrics.byPriority.low.resolved }
        },

        byCategory: {
          bugs: { count: issueMetrics.byType.bugs, avgTime: issueMetrics.byType.bugsAvgTime },
          features: { count: issueMetrics.byType.features, avgTime: issueMetrics.byType.featuresAvgTime },
          enhancements: { count: issueMetrics.byType.enhancements, avgTime: issueMetrics.byType.enhancementsAvgTime }
        }
      },

      pullRequestMetrics: {
        prsCreated: prMetrics.created,
        prsMerged: prMetrics.merged,
        prsRejected: prMetrics.rejected,
        averageReviewTime: prMetrics.avgReviewTime,
        averagePRSize: prMetrics.avgSize,

        reviewQuality: {
          averageReviewers: prMetrics.avgReviewers,
          reviewThoroughness: prMetrics.avgCommentsPerPR,
          approvalRate: prMetrics.approvalRate,
          changeRequestRate: prMetrics.changeRequestRate
        }
      },

      agentUtilization: {
        totalAgentSessions: agentMetrics.totalSessions,
        averageSessionLength: agentMetrics.avgSessionLength,

        agentBreakdown: {
          frontend: { sessions: agentMetrics.agents.frontend.sessions, effectiveness: agentMetrics.agents.frontend.taskCompletionRate },
          platform: { sessions: agentMetrics.agents.platform.sessions, effectiveness: agentMetrics.agents.platform.taskCompletionRate },
          security: { sessions: agentMetrics.agents.security.sessions, effectiveness: agentMetrics.agents.security.taskCompletionRate },
          devops: { sessions: agentMetrics.agents.devops.sessions, effectiveness: agentMetrics.agents.devops.taskCompletionRate },
          quality: { sessions: agentMetrics.agents.quality.sessions, effectiveness: agentMetrics.agents.quality.taskCompletionRate },
          codeReviewer: { sessions: agentMetrics.agents.codeReviewer.sessions, effectiveness: agentMetrics.agents.codeReviewer.taskCompletionRate },
          techLead: { sessions: agentMetrics.agents.techLead.sessions, effectiveness: agentMetrics.agents.techLead.taskCompletionRate }
        },

        productivityGains: {
          codeGenerationTime: agentMetrics.productivity.codeGenSavings,
          reviewTime: agentMetrics.productivity.reviewTimeSavings,
          debuggingTime: agentMetrics.productivity.debugTimeSavings,
          documentationTime: agentMetrics.productivity.docTimeSavings
        }
      }
    }
  }
}
```

**Individual Developer Insights:**
```typescript
// Individual developer performance and growth analysis
class DeveloperPerformanceAnalyzer {
  async generateDeveloperInsights(developerId: string, timeframe: string): Promise<DeveloperInsights> {
    const codeActivity = await this.analyzeDeveloperCodeActivity(developerId, timeframe)
    const agentCollaboration = await this.analyzeDeveloperAgentUsage(developerId, timeframe)
    const skillGrowth = await this.analyzeSkillGrowth(developerId, timeframe)
    const collaboration = await this.analyzeCollaborationPatterns(developerId, timeframe)

    return {
      developer: developerId,
      period: timeframe,

      codeContributions: {
        totalCommits: codeActivity.commits,
        linesOfCode: { added: codeActivity.additions, removed: codeActivity.deletions },
        filesContributed: codeActivity.filesModified,
        codeQuality: {
          bugIntroductionRate: codeActivity.bugRate,
          codeComplexity: codeActivity.avgComplexity,
          testCoverage: codeActivity.testCoverageContribution,
          conventionalCommitAdherence: codeActivity.conventionalCommitRate
        }
      },

      agentCollaboration: {
        preferredAgents: agentCollaboration.mostUsedAgents,
        collaborationEfficiency: agentCollaboration.taskCompletionRate,
        aiAssistedFeatures: agentCollaboration.featuresDelivered,
        learningVelocity: agentCollaboration.skillAcquisitionRate,

        agentSpecificMetrics: {
          frontend: { usage: agentCollaboration.frontend.hours, effectiveness: agentCollaboration.frontend.successRate },
          platform: { usage: agentCollaboration.platform.hours, effectiveness: agentCollaboration.platform.successRate },
          security: { usage: agentCollaboration.security.hours, effectiveness: agentCollaboration.security.successRate }
        }
      },

      skillDevelopment: {
        technologiesLearned: skillGrowth.newTechnologies,
        complexityGrowth: skillGrowth.taskComplexityIncrease,
        mentorshipActivities: skillGrowth.mentoring,
        knowledgeSharing: skillGrowth.documentation,

        growthAreas: {
          technical: skillGrowth.technical.improvements,
          architectural: skillGrowth.architectural.improvements,
          collaboration: skillGrowth.collaboration.improvements,
          leadership: skillGrowth.leadership.improvements
        }
      },

      teamCollaboration: {
        codeReviewsGiven: collaboration.reviewsProvided,
        codeReviewsReceived: collaboration.reviewsReceived,
        reviewQuality: collaboration.reviewQualityScore,
        helpingOthers: collaboration.assistanceProvided,
        knowledgeSharing: collaboration.knowledgeShared,
        crossTeamWork: collaboration.crossTeamContributions
      },

      recommendedGrowthPath: this.generateGrowthRecommendations(developerId, codeActivity, agentCollaboration, skillGrowth)
    }
  }

  private generateGrowthRecommendations(developerId: string, codeActivity: any, agentCollab: any, skillGrowth: any): GrowthRecommendation[] {
    const recommendations = []

    // Technical skill recommendations
    if (codeActivity.testCoverageContribution < 70) {
      recommendations.push({
        category: 'technical',
        priority: 'high',
        skill: 'Testing & Quality Assurance',
        recommendation: 'Focus on improving test coverage and quality',
        suggestedActions: [
          'Pair with Quality Agent to learn testing best practices',
          'Contribute to test automation improvements',
          'Lead a testing workshop for the team'
        ],
        estimatedTimeframe: '4-6 weeks'
      })
    }

    // Agent collaboration optimization
    if (agentCollab.taskCompletionRate < 85) {
      recommendations.push({
        category: 'ai-collaboration',
        priority: 'medium',
        skill: 'AI-Assisted Development',
        recommendation: 'Improve Claude Code agent collaboration techniques',
        suggestedActions: [
          'Review agent specialization documentation',
          'Practice complex multi-agent workflows',
          'Mentor others on effective agent usage'
        ],
        estimatedTimeframe: '2-3 weeks'
      })
    }

    // Leadership development
    if (skillGrowth.leadership.improvements < 2) {
      recommendations.push({
        category: 'leadership',
        priority: 'low',
        skill: 'Technical Leadership',
        recommendation: 'Develop technical leadership capabilities',
        suggestedActions: [
          'Lead a feature development initiative',
          'Mentor junior developers',
          'Contribute to architectural decisions'
        ],
        estimatedTimeframe: '8-12 weeks'
      })
    }

    return recommendations
  }
}
```

**Team Health and Coordination Analysis:**
```typescript
// Team health and coordination effectiveness
class TeamHealthAnalyzer {
  async assessTeamHealth(): Promise<TeamHealthReport> {
    const communicationMetrics = await this.analyzeCommunication()
    const knowledgeSharing = await this.analyzeKnowledgeSharing()
    const workloadDistribution = await this.analyzeWorkloadDistribution()
    const agentCoordination = await this.analyzeAgentCoordination()

    return {
      overallHealthScore: this.calculateOverallHealthScore({
        communication: communicationMetrics.score,
        knowledge: knowledgeSharing.score,
        workload: workloadDistribution.score,
        coordination: agentCoordination.score
      }),

      communicationHealth: {
        score: communicationMetrics.score,
        standupParticipation: communicationMetrics.standupEngagement,
        codeReviewEngagement: communicationMetrics.reviewEngagement,
        documentationQuality: communicationMetrics.docQuality,
        crossTeamCollaboration: communicationMetrics.crossTeamWork,

        indicators: {
          positive: communicationMetrics.positiveIndicators,
          concerning: communicationMetrics.concerningPatterns,
          recommended_actions: communicationMetrics.recommendedActions
        }
      },

      knowledgeSharing: {
        score: knowledgeSharing.score,
        documentationCoverage: knowledgeSharing.docCoverage,
        mentorshipActivity: knowledgeSharing.mentoring,
        skillDistribution: knowledgeSharing.skillSpread,
        learningInitiatives: knowledgeSharing.learning,

        knowledgeGaps: knowledgeSharing.identifiedGaps,
        expertiseAreas: knowledgeSharing.teamExpertise,
        recommendedTraining: knowledgeSharing.trainingRecommendations
      },

      workloadBalance: {
        score: workloadDistribution.score,
        distributionFairness: workloadDistribution.fairness,
        burnoutRisk: workloadDistribution.burnoutIndicators,
        capacityUtilization: workloadDistribution.capacityUsage,

        overloadedMembers: workloadDistribution.overloaded,
        underutilizedMembers: workloadDistribution.underutilized,
        recommendedRebalancing: workloadDistribution.rebalancingActions
      },

      agentCoordinationEffectiveness: {
        score: agentCoordination.score,
        multiAgentWorkflowSuccess: agentCoordination.workflowSuccessRate,
        agentSpecializationEfficiency: agentCoordination.specializationEfficiency,
        crossAgentKnowledgeTransfer: agentCoordination.knowledgeTransfer,

        coordinationPatterns: {
          mostEffective: agentCoordination.bestPractices,
          needsImprovement: agentCoordination.improvementAreas,
          emergingPatterns: agentCoordination.newPatterns
        }
      }
    }
  }
}
```

**Project Progress and Milestone Tracking:**
```typescript
// Project milestone and deliverable tracking
class ProjectProgressTracker {
  async generateProgressReport(projectId: string): Promise<ProjectProgressReport> {
    const milestones = await this.analyzeMilestoneProgress(projectId)
    const deliverables = await this.analyzeDeliverableStatus(projectId)
    const riskAssessment = await this.assessProjectRisks(projectId)
    const resourceUtilization = await this.analyzeResourceUtilization(projectId)

    return {
      project: projectId,
      reportDate: new Date().toISOString(),

      milestoneProgress: {
        totalMilestones: milestones.total,
        completed: milestones.completed,
        inProgress: milestones.inProgress,
        upcoming: milestones.upcoming,
        delayed: milestones.delayed,

        completionRate: milestones.completed / milestones.total,
        onTimeDelivery: milestones.onTimeCount / milestones.completed,
        averageDelayDays: milestones.avgDelay,

        upcomingDeadlines: milestones.upcomingDeadlines.map(m => ({
          name: m.name,
          dueDate: m.dueDate,
          completionEstimate: m.estimatedCompletion,
          riskLevel: m.riskLevel
        }))
      },

      deliverableStatus: {
        browser_extension: {
          status: deliverables.extension.status,
          completionPercentage: deliverables.extension.completion,
          qualityScore: deliverables.extension.quality,
          remainingTasks: deliverables.extension.remainingTasks,
          blockers: deliverables.extension.blockers
        },

        web_application: {
          status: deliverables.webApp.status,
          completionPercentage: deliverables.webApp.completion,
          qualityScore: deliverables.webApp.quality,
          remainingTasks: deliverables.webApp.remainingTasks,
          blockers: deliverables.webApp.blockers
        },

        ai_backend: {
          status: deliverables.aiBackend.status,
          completionPercentage: deliverables.aiBackend.completion,
          qualityScore: deliverables.aiBackend.quality,
          remainingTasks: deliverables.aiBackend.remainingTasks,
          blockers: deliverables.aiBackend.blockers
        }
      },

      riskAssessment: {
        overallRiskLevel: riskAssessment.overall,
        identifiedRisks: riskAssessment.risks.map(risk => ({
          category: risk.category,
          description: risk.description,
          probability: risk.probability,
          impact: risk.impact,
          mitigation: risk.mitigationPlan,
          owner: risk.owner
        })),
        mitigationStatus: riskAssessment.mitigationProgress
      },

      resourceUtilization: {
        teamCapacity: resourceUtilization.capacity,
        currentUtilization: resourceUtilization.utilization,
        agentUtilization: resourceUtilization.agentUsage,
        skillGaps: resourceUtilization.skillGaps,
        recommendedActions: resourceUtilization.recommendations
      }
    }
  }
}
```

**Executive Summary Generator:**
```typescript
// Executive summary generation for stakeholders
class ExecutiveSummaryGenerator {
  async generateExecutiveSummary(timeframe: string): Promise<ExecutiveSummary> {
    const velocityData = await this.getVelocityMetrics(timeframe)
    const healthData = await this.getTeamHealthMetrics(timeframe)
    const progressData = await this.getProgressMetrics(timeframe)
    const businessImpact = await this.calculateBusinessImpact(timeframe)

    return {
      period: timeframe,
      generatedAt: new Date().toISOString(),

      keyHighlights: [
        `Delivered ${progressData.featuresCompleted} features with ${velocityData.productivityGain}% AI-assisted productivity gain`,
        `Maintained ${healthData.teamHealthScore}% team health score with strong collaboration`,
        `Achieved ${progressData.qualityScore}% quality score across all deliverables`,
        `Reduced development time by ${businessImpact.timeReduction}% through agent optimization`
      ],

      metricsOverview: {
        development_velocity: {
          current: velocityData.current,
          trend: velocityData.trend,
          target: velocityData.target,
          status: velocityData.current >= velocityData.target ? 'on-track' : 'needs-attention'
        },

        quality_metrics: {
          bug_rate: progressData.bugRate,
          test_coverage: progressData.testCoverage,
          code_review_quality: progressData.reviewQuality,
          security_compliance: progressData.securityScore
        },

        team_health: {
          satisfaction_score: healthData.satisfaction,
          collaboration_effectiveness: healthData.collaboration,
          skill_growth: healthData.skillGrowth,
          retention_indicator: healthData.retention
        },

        ai_productivity_gains: {
          code_generation: businessImpact.codeGenGains,
          review_automation: businessImpact.reviewGains,
          testing_efficiency: businessImpact.testingGains,
          documentation_speed: businessImpact.docGains
        }
      },

      accomplishments: [
        ...this.extractMajorAccomplishments(progressData),
        ...this.extractTechnicalMilestones(velocityData),
        ...this.extractTeamGrowthMilestones(healthData)
      ],

      challenges: [
        ...this.identifyCurrentChallenges(progressData, healthData, velocityData),
        ...this.identifyUpcomingRisks(progressData)
      ],

      recommendations: [
        ...this.generateStrategicRecommendations(businessImpact),
        ...this.generateOperationalRecommendations(healthData, velocityData),
        ...this.generateInvestmentRecommendations(businessImpact)
      ],

      nextPeriodOutlook: {
        plannedDeliverables: progressData.upcomingFeatures,
        resourceRequirements: businessImpact.resourceNeeds,
        riskMitigation: progressData.riskMitigationPlans,
        expectedImpact: businessImpact.projectedGains
      }
    }
  }
}
```

**Automated Reporting and Distribution:**
```typescript
// Automated report generation and distribution
class TeamStatusReportManager {
  async generateAndDistributeReports(): Promise<void> {
    // Generate comprehensive team status report
    const teamReport = await this.orchestrator.generateTeamStatusReport()

    // Generate individual developer reports
    const developerReports = await Promise.all(
      this.team.members.map(member =>
        this.generateDeveloperReport(member.id)
      )
    )

    // Generate executive summary
    const executiveSummary = await this.generateExecutiveSummary()

    // Distribute reports to appropriate audiences
    await this.distributeReports({
      teamReport,
      developerReports,
      executiveSummary
    })
  }

  async distributeReports(reports: Reports): Promise<void> {
    // Send to team leads and managers
    await this.sendToManagement({
      summary: reports.executiveSummary,
      teamOverview: reports.teamReport.overview
    })

    // Send personalized reports to developers
    for (const devReport of reports.developerReports) {
      await this.sendToDeveloper(devReport.developer, {
        personalInsights: devReport.insights,
        growthRecommendations: devReport.recommendations,
        teamContribution: devReport.teamImpact
      })
    }

    // Update team dashboard
    await this.updateTeamDashboard(reports.teamReport)

    // Archive reports for historical analysis
    await this.archiveReports(reports)
  }
}
```

**Report Templates and Formats:**

**Weekly Team Standup Report:**
```markdown
# Weekly Team Status - Week of [Date]

## 🎯 Key Accomplishments
- [Major feature completions]
- [Significant bug fixes]
- [Process improvements]

## 📊 Team Velocity
- **Commits**: X commits (+Y% from last week)
- **Features Delivered**: X features
- **Issues Resolved**: X issues
- **Code Reviews**: X reviews completed

## 🤖 Agent Collaboration Highlights
- **Most Active Agent**: [Agent Name] with X sessions
- **Productivity Gain**: X% improvement in development speed
- **Quality Improvements**: X% reduction in review iterations

## ⚠️ Current Challenges
- [Challenge 1 with mitigation plan]
- [Challenge 2 with mitigation plan]

## 📅 Next Week Focus
- [Priority 1]
- [Priority 2]
- [Priority 3]

## 🏆 Team Member Highlights
- [Recognition for exceptional contributions]
```

**Monthly Executive Summary:**
```markdown
# Monthly Development Summary - [Month Year]

## Executive Overview
The development team achieved significant milestones this month with [X]% productivity gains through AI-assisted development and maintained high code quality standards.

## Key Metrics
- **Development Velocity**: [X] story points completed
- **Quality Score**: [X]% (target: 90%+)
- **Team Health**: [X]% satisfaction score
- **AI Productivity**: [X]% time savings through agent collaboration

## Major Deliverables Completed
1. [Deliverable 1] - [Impact]
2. [Deliverable 2] - [Impact]
3. [Deliverable 3] - [Impact]

## Investment Recommendations
Based on current productivity gains and team capacity analysis:
1. [Recommendation 1 with ROI projection]
2. [Recommendation 2 with resource requirements]
3. [Recommendation 3 with timeline]
```

**Quality Gates for Team Status:**
- All reports generated and distributed on schedule
- Metrics accuracy verified through multiple data sources
- Actionable insights and recommendations provided
- Individual developer privacy and confidentiality maintained
- Executive summaries focus on business impact
- Historical trend analysis included for context

Please specify the reporting timeframe and audience for comprehensive team status analysis and report generation.
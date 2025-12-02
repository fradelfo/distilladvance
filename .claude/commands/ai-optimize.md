---
name: ai-optimize
description: AI cost and performance optimization using platform-agent for prompt engineering and model selection
---

Use the platform-agent to perform comprehensive AI cost and performance optimization for LLM integrations:

**Cost Analysis & Optimization:**
- Analyze current AI usage patterns and costs
- Identify expensive operations and optimization opportunities
- Review prompt length and complexity for cost reduction
- Evaluate model selection strategy (GPT-4 vs GPT-4-mini vs Claude)
- Assess caching effectiveness and hit rates
- Calculate ROI and cost-benefit analysis

**Prompt Engineering Optimization:**
1. **Prompt Template Analysis:**
   - Review existing prompt templates for efficiency
   - Identify redundant instructions and unnecessary verbosity
   - Optimize prompt structure for better model performance
   - Test prompt variations with A/B testing framework

2. **Response Quality Assessment:**
   - Evaluate output quality vs cost trade-offs
   - Test different model configurations (temperature, max_tokens)
   - Benchmark response times and accuracy
   - Identify optimal model selection per task type

3. **Semantic Caching Implementation:**
   - Analyze query patterns for cache optimization
   - Implement semantic similarity caching
   - Configure cache TTL and invalidation strategies
   - Monitor cache hit rates and performance gains

**Model Selection Optimization:**
- **Fast Tasks** (simple queries, basic extraction): GPT-4o-mini or Claude Haiku
- **Complex Reasoning** (architectural decisions, complex analysis): Claude Sonnet or GPT-4
- **Specialized Tasks** (prompt distillation): Fine-tuned models or specialized prompts
- **Embedding Generation**: text-embedding-3-large for vector search

**Performance Optimization:**
1. **Batch Processing Implementation:**
   - Group similar requests for batch processing
   - Implement async processing with queue management
   - Optimize concurrent request handling
   - Monitor throughput and latency metrics

2. **Response Time Optimization:**
   - Implement response streaming for better UX
   - Optimize model selection based on urgency
   - Pre-compute common responses
   - Implement progressive loading strategies

**Cost Management Features:**
- Real-time budget tracking and alerts
- Usage quotas and rate limiting per user
- Cost attribution and reporting
- Automatic scaling based on usage patterns
- Emergency cost circuit breakers

**Monitoring & Analytics:**
1. **Cost Tracking:**
   - Daily/monthly usage and cost reports
   - Per-user and per-feature cost breakdown
   - Trend analysis and forecasting
   - Budget variance reporting

2. **Performance Metrics:**
   - Response time percentiles (p50, p95, p99)
   - Model accuracy and quality scores
   - Cache effectiveness metrics
   - User satisfaction scores

3. **Optimization Recommendations:**
   - Automated suggestions for cost reduction
   - Model selection recommendations
   - Prompt optimization opportunities
   - Caching strategy improvements

**Quality Assurance:**
- A/B test prompt variations for effectiveness
- Validate response quality after optimizations
- Monitor user satisfaction and engagement metrics
- Ensure optimizations don't compromise functionality

**Implementation Steps:**
1. Analyze current usage patterns and identify optimization opportunities
2. Implement semantic caching for frequently asked queries
3. Optimize prompt templates for cost and performance
4. Configure intelligent model routing based on task complexity
5. Set up comprehensive monitoring and alerting
6. Implement cost controls and budget management
7. Create optimization recommendations dashboard

**Expected Outcomes:**
- 20-40% reduction in AI costs through optimization
- Improved response times with better caching
- Enhanced user experience with faster AI responses
- Comprehensive cost visibility and control
- Automated optimization recommendations

Please focus on sustainable cost optimization that maintains or improves user experience while significantly reducing operational expenses.

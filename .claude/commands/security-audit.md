---
name: security-audit
description: Comprehensive security audit using security agent with browser extension and AI safety focus
---

Use the security agent to perform a comprehensive security audit covering browser extension security, web application security, and AI/LLM safety:

**Browser Extension Security Audit:**
1. **Manifest V3 Security Review:**
   - Permission minimization analysis (required vs optional vs host permissions)
   - Content Security Policy (CSP) strength assessment
   - Web accessible resources security validation
   - External connections and API access review
   - Background script security patterns

2. **Content Script Security:**
   - DOM injection safety and XSS prevention
   - Shadow DOM isolation implementation
   - Cross-origin message validation
   - Site compatibility and injection safety
   - User data handling and privacy protection

3. **Extension API Security:**
   - chrome.storage encryption and data protection
   - Message passing security and validation
   - Cookie and session handling security
   - Network request security and filtering
   - User privacy and data collection audit

**Web Application Security Audit:**
1. **OWASP Top 10 (2023) Assessment:**
   - A01: Broken Access Control
   - A02: Cryptographic Failures
   - A03: Injection Vulnerabilities
   - A04: Insecure Design
   - A05: Security Misconfiguration
   - A06: Vulnerable and Outdated Components
   - A07: Identification and Authentication Failures
   - A08: Software and Data Integrity Failures
   - A09: Security Logging and Monitoring Failures
   - A10: Server-Side Request Forgery (SSRF)

2. **API Security Assessment:**
   - Authentication and authorization validation
   - Input validation and sanitization
   - Rate limiting and abuse prevention
   - SQL injection and NoSQL injection testing
   - Cross-Site Request Forgery (CSRF) protection
   - API versioning and security headers

**AI/LLM Security Audit:**
1. **Prompt Injection Prevention:**
   - Input sanitization and validation
   - Prompt isolation and context separation
   - System prompt protection
   - User input boundary enforcement
   - Attack vector identification and mitigation

2. **AI Safety & Content Filtering:**
   - Content moderation implementation
   - Inappropriate content detection
   - Bias detection and mitigation
   - Model output validation
   - Safety guardrails and limits

3. **Data Privacy & AI Ethics:**
   - User conversation data protection
   - AI training data privacy compliance
   - Model usage monitoring and limits
   - Consent mechanisms for AI features
   - Transparency and explainability

**Privacy Compliance Audit:**
1. **GDPR Compliance (EU):**
   - Lawful basis for data processing
   - User consent mechanisms
   - Data minimization principles
   - Right to erasure implementation
   - Data portability features
   - Privacy by design validation

2. **CCPA Compliance (California):**
   - Consumer privacy rights implementation
   - Data disclosure and transparency
   - Opt-out mechanisms
   - Non-discrimination policies
   - Privacy policy completeness

**Automated Security Scanning:**
1. **Static Code Analysis:**
   - SAST (Static Application Security Testing) with Semgrep
   - Dependency vulnerability scanning with Snyk
   - License compliance checking
   - Secret detection and removal
   - Code quality security patterns

2. **Dynamic Security Testing:**
   - DAST (Dynamic Application Security Testing) with OWASP ZAP
   - API security testing
   - Authentication and session management testing
   - Input validation testing
   - Cross-browser security validation

**Infrastructure Security:**
1. **Container Security:**
   - Docker image vulnerability scanning with Trivy
   - Base image security validation
   - Container runtime security
   - Network policies and isolation
   - Secrets management and encryption

2. **Kubernetes Security:**
   - Pod Security Standards compliance
   - RBAC (Role-Based Access Control) configuration
   - Network policies implementation
   - Service mesh security (if applicable)
   - Admission controller validation

**Security Monitoring & Incident Response:**
1. **Logging & Monitoring:**
   - Security event logging
   - Anomaly detection patterns
   - Attack detection and alerting
   - Incident response procedures
   - Forensic data collection

2. **Threat Modeling:**
   - Asset identification and classification
   - Threat actor identification
   - Attack vector analysis
   - Risk assessment and prioritization
   - Mitigation strategy development

**Security Report Generation:**
1. **Vulnerability Assessment:**
   - Critical, High, Medium, Low severity classification
   - CVSS scoring for identified vulnerabilities
   - Exploitation likelihood and impact assessment
   - Remediation priority and effort estimation
   - Timeline for vulnerability resolution

2. **Compliance Report:**
   - GDPR compliance status and recommendations
   - OWASP Top 10 compliance assessment
   - Browser extension store security requirements
   - Industry-specific compliance (if applicable)
   - Security certification readiness

**Remediation Recommendations:**
- Immediate security fixes for critical vulnerabilities
- Security architecture improvements
- Process and procedure enhancements
- Security training and awareness needs
- Continuous security monitoring implementation
- Regular security audit scheduling

**Quality Gates for Security:**
- Zero critical and high-severity vulnerabilities in production
- All dependencies up-to-date with security patches
- Comprehensive input validation on all user inputs
- Strong authentication and authorization implemented
- Privacy compliance validated and documented
- Security monitoring and alerting operational

Please focus on practical security improvements that can be implemented immediately while building a foundation for ongoing security excellence.

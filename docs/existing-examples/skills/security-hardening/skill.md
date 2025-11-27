# Security Hardening Skill

Advanced cybersecurity expertise covering infrastructure hardening, application security, compliance frameworks, and enterprise security architecture.

## Skill Overview

Expert security knowledge including zero-trust architecture, infrastructure hardening, application security, compliance automation, threat modeling, and security operations using cutting-edge tools and frameworks.

## Core Capabilities

### Infrastructure Security
- **Zero-trust architecture** - Identity verification, network segmentation, micro-perimeters
- **Container security** - Image scanning, runtime protection, admission controllers
- **Cloud security** - CSP security configurations, IAM policies, secrets management
- **Network security** - Firewalls, VPNs, network monitoring, intrusion detection

### Application Security
- **Secure coding** - OWASP Top 10, secure design patterns, input validation
- **Authentication & authorization** - OAuth2, SAML, RBAC, attribute-based access control
- **API security** - Rate limiting, input validation, JWT security, API gateways
- **Dependency management** - Vulnerability scanning, license compliance, supply chain security

### Compliance & Governance
- **Regulatory compliance** - SOX, PCI-DSS, HIPAA, GDPR automated validation
- **Security frameworks** - NIST, ISO 27001, CIS Controls implementation
- **Risk management** - Threat modeling, vulnerability management, security metrics
- **Incident response** - SIEM integration, automated response, forensics

### Security Operations
- **SIEM/SOAR** - Log analysis, threat hunting, automated response workflows
- **Vulnerability management** - Continuous scanning, patch management, risk assessment
- **Security monitoring** - Real-time alerting, behavioral analysis, threat intelligence
- **Backup & recovery** - Secure backup strategies, disaster recovery, business continuity

## Advanced Security Implementation

### Zero-Trust Infrastructure
```yaml
# Zero-Trust Kubernetes Network Policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: zero-trust-default-deny
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress: []  # Deny all ingress by default
  egress: []   # Deny all egress by default

---
# Application-specific network policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: web-app-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: web-app
  policyTypes:
  - Ingress
  - Egress

  ingress:
  # Allow ingress from load balancer
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080

  egress:
  # Allow egress to database
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432

  # Allow egress to Redis
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379

  # Allow DNS resolution
  - to: []
    ports:
    - protocol: UDP
      port: 53

---
# Service mesh authorization with Istio
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: web-app-authz
  namespace: production
spec:
  selector:
    matchLabels:
      app: web-app
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/ingress/sa/nginx-ingress"]
  - to:
    - operation:
        methods: ["GET", "POST", "PUT"]
        paths: ["/api/*"]
  - when:
    - key: request.headers[authorization]
      values: ["Bearer *"]

---
# Pod Security Standards
apiVersion: v1
kind: Namespace
metadata:
  name: secure-workloads
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted

---
# Security Context Constraints
apiVersion: v1
kind: SecurityContextConstraints
metadata:
  name: restricted-scc
allowHostDirVolumePlugin: false
allowHostIPC: false
allowHostNetwork: false
allowHostPID: false
allowHostPorts: false
allowPrivilegedContainer: false
allowedCapabilities: null
defaultAddCapabilities: null
requiredDropCapabilities:
- KILL
- MKNOD
- SETUID
- SETGID
fsGroup:
  type: MustRunAs
  ranges:
  - min: 1
    max: 65535
runAsUser:
  type: MustRunAsNonRoot
seLinuxContext:
  type: MustRunAs
supplementalGroups:
  type: RunAsAny
volumes:
- configMap
- downwardAPI
- emptyDir
- persistentVolumeClaim
- projected
- secret

---
# Advanced admission controller with OPA Gatekeeper
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8srequiredsecuritycontext
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredSecurityContext
      validation:
        properties:
          runAsNonRoot:
            type: boolean
          readOnlyRootFilesystem:
            type: boolean
          allowPrivilegeEscalation:
            type: boolean
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredsecuritycontext

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.securityContext.runAsNonRoot
          msg := "Container must run as non-root user"
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.securityContext.readOnlyRootFilesystem
          msg := "Container must have read-only root filesystem"
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          container.securityContext.allowPrivilegeEscalation != false
          msg := "Container must not allow privilege escalation"
        }

---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredSecurityContext
metadata:
  name: require-security-context
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    namespaces: ["production", "staging"]
```

### Advanced Application Security
```python
# Comprehensive application security framework
from functools import wraps
from flask import Flask, request, jsonify, session
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import bcrypt
import hashlib
import secrets
import re
import logging
from datetime import datetime, timedelta
import redis
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
import time
from typing import Dict, List, Any, Optional, Tuple
import sqlalchemy
from sqlalchemy.orm import sessionmaker
import bleach
from markupsafe import Markup

class SecurityManager:
    def __init__(self, app: Flask, redis_client=None):
        self.app = app
        self.redis_client = redis_client or redis.Redis()
        self.logger = logging.getLogger(__name__)

        # Initialize rate limiter
        self.limiter = Limiter(
            app,
            key_func=get_remote_address,
            default_limits=["1000 per day", "100 per hour"],
            storage_uri="redis://localhost:6379"
        )

        # Security configuration
        self.setup_security_headers()
        self.setup_csrf_protection()
        self.setup_session_security()

    def setup_security_headers(self):
        """Configure security headers"""
        @self.app.after_request
        def set_security_headers(response):
            # Content Security Policy
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; "
                "style-src 'self' 'unsafe-inline' fonts.googleapis.com; "
                "font-src 'self' fonts.gstatic.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self' wss: api.example.com; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            )

            response.headers.update({
                'Content-Security-Policy': csp,
                'X-Frame-Options': 'DENY',
                'X-Content-Type-Options': 'nosniff',
                'X-XSS-Protection': '1; mode=block',
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
                'X-Permitted-Cross-Domain-Policies': 'none'
            })

            # Remove server header
            response.headers.pop('Server', None)
            return response

    def setup_csrf_protection(self):
        """Configure CSRF protection"""
        @self.app.before_request
        def csrf_protect():
            if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
                csrf_token = request.headers.get('X-CSRF-Token') or request.form.get('csrf_token')
                session_token = session.get('csrf_token')

                if not csrf_token or not session_token or not self.validate_csrf_token(csrf_token, session_token):
                    self.logger.warning(f"CSRF attack detected from {request.remote_addr}")
                    return jsonify({'error': 'CSRF token invalid'}), 403

    def setup_session_security(self):
        """Configure secure session management"""
        self.app.config.update({
            'SECRET_KEY': os.environ.get('SECRET_KEY', secrets.token_hex(32)),
            'SESSION_COOKIE_SECURE': True,
            'SESSION_COOKIE_HTTPONLY': True,
            'SESSION_COOKIE_SAMESITE': 'Strict',
            'PERMANENT_SESSION_LIFETIME': timedelta(hours=2)
        })

    def generate_csrf_token(self) -> str:
        """Generate CSRF token"""
        if 'csrf_token' not in session:
            session['csrf_token'] = secrets.token_hex(16)
        return session['csrf_token']

    def validate_csrf_token(self, token: str, session_token: str) -> bool:
        """Validate CSRF token with constant-time comparison"""
        return secrets.compare_digest(token, session_token)

    def rate_limit_decorator(self, limit_string: str, per_method: bool = True):
        """Advanced rate limiting decorator"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                # Create composite key for more granular rate limiting
                user_id = session.get('user_id', 'anonymous')
                endpoint = f"{request.endpoint}_{request.method}" if per_method else request.endpoint
                key = f"rate_limit:{user_id}:{endpoint}:{get_remote_address()}"

                # Check rate limit
                current_count = self.redis_client.get(key)
                if current_count and int(current_count) >= self.parse_limit(limit_string):
                    self.logger.warning(f"Rate limit exceeded for {user_id} on {endpoint}")
                    return jsonify({'error': 'Rate limit exceeded'}), 429

                # Increment counter
                pipe = self.redis_client.pipeline()
                pipe.incr(key)
                pipe.expire(key, self.parse_time_window(limit_string))
                pipe.execute()

                return f(*args, **kwargs)
            return decorated_function
        return decorator

    def require_authentication(self, roles: List[str] = None):
        """Authentication and authorization decorator"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                # Check for JWT token
                auth_header = request.headers.get('Authorization')
                if not auth_header or not auth_header.startswith('Bearer '):
                    return jsonify({'error': 'Authentication required'}), 401

                try:
                    token = auth_header.split(' ')[1]
                    payload = self.decode_jwt_token(token)

                    # Check token blacklist
                    if self.is_token_blacklisted(token):
                        return jsonify({'error': 'Token has been revoked'}), 401

                    # Check roles if specified
                    if roles:
                        user_roles = payload.get('roles', [])
                        if not any(role in user_roles for role in roles):
                            return jsonify({'error': 'Insufficient permissions'}), 403

                    # Add user info to request context
                    request.user = payload
                    return f(*args, **kwargs)

                except jwt.ExpiredSignatureError:
                    return jsonify({'error': 'Token has expired'}), 401
                except jwt.InvalidTokenError:
                    return jsonify({'error': 'Invalid token'}), 401
                except Exception as e:
                    self.logger.error(f"Authentication error: {e}")
                    return jsonify({'error': 'Authentication failed'}), 401
            return decorated_function
        return decorator

    def input_validation(self, schema: Dict[str, Any]):
        """Input validation and sanitization decorator"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                data = request.get_json() if request.is_json else request.form.to_dict()

                # Validate and sanitize input
                validated_data = {}
                errors = []

                for field, rules in schema.items():
                    value = data.get(field)

                    # Required field check
                    if rules.get('required', False) and not value:
                        errors.append(f"{field} is required")
                        continue

                    if value is None:
                        continue

                    # Type validation
                    if 'type' in rules:
                        if not isinstance(value, rules['type']):
                            try:
                                value = rules['type'](value)
                            except (ValueError, TypeError):
                                errors.append(f"{field} must be of type {rules['type'].__name__}")
                                continue

                    # Pattern validation
                    if 'pattern' in rules and isinstance(value, str):
                        if not re.match(rules['pattern'], value):
                            errors.append(f"{field} format is invalid")
                            continue

                    # Length validation
                    if 'min_length' in rules and len(str(value)) < rules['min_length']:
                        errors.append(f"{field} must be at least {rules['min_length']} characters")
                        continue

                    if 'max_length' in rules and len(str(value)) > rules['max_length']:
                        errors.append(f"{field} cannot exceed {rules['max_length']} characters")
                        continue

                    # Sanitization
                    if 'sanitize' in rules and isinstance(value, str):
                        if rules['sanitize'] == 'html':
                            value = bleach.clean(value, strip=True)
                        elif rules['sanitize'] == 'sql':
                            value = value.replace("'", "''")  # Basic SQL injection prevention

                    validated_data[field] = value

                if errors:
                    return jsonify({'errors': errors}), 400

                # Add validated data to request
                request.validated_data = validated_data
                return f(*args, **kwargs)
            return decorated_function
        return decorator

    def audit_log(self, action: str, resource: str = None):
        """Audit logging decorator"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                start_time = time.time()
                user_id = getattr(request, 'user', {}).get('user_id', 'anonymous')

                try:
                    result = f(*args, **kwargs)

                    # Log successful action
                    self.log_audit_event(
                        user_id=user_id,
                        action=action,
                        resource=resource or request.endpoint,
                        success=True,
                        duration=time.time() - start_time,
                        ip_address=get_remote_address(),
                        user_agent=request.headers.get('User-Agent')
                    )

                    return result

                except Exception as e:
                    # Log failed action
                    self.log_audit_event(
                        user_id=user_id,
                        action=action,
                        resource=resource or request.endpoint,
                        success=False,
                        error=str(e),
                        duration=time.time() - start_time,
                        ip_address=get_remote_address(),
                        user_agent=request.headers.get('User-Agent')
                    )
                    raise
            return decorated_function
        return decorator

    def secure_password_hash(self, password: str) -> str:
        """Generate secure password hash using bcrypt"""
        # Add pepper (application-level secret)
        pepper = os.environ.get('PASSWORD_PEPPER', '')
        peppered_password = password + pepper

        # Generate salt and hash
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(peppered_password.encode('utf-8'), salt).decode('utf-8')

    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        pepper = os.environ.get('PASSWORD_PEPPER', '')
        peppered_password = password + pepper

        try:
            return bcrypt.checkpw(peppered_password.encode('utf-8'), hashed.encode('utf-8'))
        except Exception:
            return False

    def generate_jwt_token(self, user_data: Dict[str, Any], expires_in: int = 3600) -> str:
        """Generate JWT token with security features"""
        now = datetime.utcnow()

        payload = {
            'user_id': user_data['user_id'],
            'email': user_data['email'],
            'roles': user_data.get('roles', []),
            'iat': now,
            'exp': now + timedelta(seconds=expires_in),
            'jti': secrets.token_hex(16),  # JWT ID for revocation
            'iss': 'secure-app',
            'aud': 'api'
        }

        return jwt.encode(
            payload,
            os.environ.get('JWT_SECRET_KEY'),
            algorithm='HS256'
        )

    def decode_jwt_token(self, token: str) -> Dict[str, Any]:
        """Decode and validate JWT token"""
        return jwt.decode(
            token,
            os.environ.get('JWT_SECRET_KEY'),
            algorithms=['HS256'],
            audience='api',
            issuer='secure-app'
        )

    def blacklist_token(self, token: str):
        """Add token to blacklist"""
        try:
            payload = self.decode_jwt_token(token)
            jti = payload['jti']
            exp = payload['exp']

            # Store in Redis with expiration
            ttl = int(exp) - int(time.time())
            if ttl > 0:
                self.redis_client.setex(f"blacklist:{jti}", ttl, "1")
        except Exception as e:
            self.logger.error(f"Error blacklisting token: {e}")

    def is_token_blacklisted(self, token: str) -> bool:
        """Check if token is blacklisted"""
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            jti = payload.get('jti')
            if jti:
                return bool(self.redis_client.get(f"blacklist:{jti}"))
        except Exception:
            pass
        return False

    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data for storage"""
        key = os.environ.get('ENCRYPTION_KEY').encode()
        f = Fernet(key)
        return f.encrypt(data.encode()).decode()

    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        key = os.environ.get('ENCRYPTION_KEY').encode()
        f = Fernet(key)
        return f.decrypt(encrypted_data.encode()).decode()

    def log_audit_event(self, **kwargs):
        """Log audit event to database and SIEM"""
        audit_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'audit',
            **kwargs
        }

        # Log to application logs
        self.logger.info(f"AUDIT: {audit_data}")

        # Send to SIEM system (implementation would depend on your SIEM)
        # self.send_to_siem(audit_data)

# Example usage with Flask routes
app = Flask(__name__)
security = SecurityManager(app)

# Input validation schemas
USER_REGISTRATION_SCHEMA = {
    'email': {
        'required': True,
        'type': str,
        'pattern': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
        'max_length': 255,
        'sanitize': 'html'
    },
    'password': {
        'required': True,
        'type': str,
        'min_length': 12,
        'max_length': 128,
        'pattern': r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]'
    },
    'first_name': {
        'required': True,
        'type': str,
        'min_length': 1,
        'max_length': 50,
        'sanitize': 'html'
    },
    'last_name': {
        'required': True,
        'type': str,
        'min_length': 1,
        'max_length': 50,
        'sanitize': 'html'
    }
}

@app.route('/api/register', methods=['POST'])
@security.rate_limit_decorator("5 per minute")
@security.input_validation(USER_REGISTRATION_SCHEMA)
@security.audit_log("user_registration")
def register_user():
    """Secure user registration endpoint"""
    data = request.validated_data

    # Check if user already exists
    # existing_user = User.query.filter_by(email=data['email']).first()
    # if existing_user:
    #     return jsonify({'error': 'User already exists'}), 409

    # Hash password securely
    password_hash = security.secure_password_hash(data['password'])

    # Create user (pseudocode)
    # user = User(
    #     email=data['email'],
    #     password_hash=password_hash,
    #     first_name=data['first_name'],
    #     last_name=data['last_name']
    # )
    # db.session.add(user)
    # db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
@security.rate_limit_decorator("10 per minute")
@security.audit_log("user_login")
def login():
    """Secure user login endpoint"""
    data = request.get_json()

    # Validate input
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    # Get user (pseudocode)
    # user = User.query.filter_by(email=email).first()
    # if not user or not security.verify_password(password, user.password_hash):
    #     return jsonify({'error': 'Invalid credentials'}), 401

    # Generate JWT token
    user_data = {
        'user_id': 'user123',  # user.id
        'email': email,
        'roles': ['user']  # user.roles
    }

    token = security.generate_jwt_token(user_data)

    return jsonify({
        'access_token': token,
        'token_type': 'Bearer',
        'expires_in': 3600
    })

@app.route('/api/protected', methods=['GET'])
@security.require_authentication(roles=['user', 'admin'])
@security.audit_log("access_protected_resource")
def protected_resource():
    """Protected endpoint requiring authentication"""
    return jsonify({
        'message': 'Access granted',
        'user': request.user
    })

@app.route('/api/admin', methods=['GET'])
@security.require_authentication(roles=['admin'])
@security.audit_log("admin_access")
def admin_only():
    """Admin-only endpoint"""
    return jsonify({'message': 'Admin access granted'})

# Security middleware for database queries
class SecureDatabase:
    def __init__(self, db_session):
        self.session = db_session

    def safe_query(self, model, filters: Dict[str, Any], user_context: Dict[str, Any] = None):
        """Execute safe database query with access control"""
        query = self.session.query(model)

        # Apply filters safely (parameterized queries)
        for field, value in filters.items():
            if hasattr(model, field):
                query = query.filter(getattr(model, field) == value)

        # Apply row-level security based on user context
        if user_context:
            query = self.apply_row_level_security(query, model, user_context)

        return query

    def apply_row_level_security(self, query, model, user_context):
        """Apply row-level security policies"""
        user_roles = user_context.get('roles', [])
        user_id = user_context.get('user_id')

        # Example: Users can only see their own data unless they're admin
        if 'admin' not in user_roles and hasattr(model, 'user_id'):
            query = query.filter(model.user_id == user_id)

        return query

if __name__ == '__main__':
    # Production security configuration
    app.config.update({
        'ENV': 'production',
        'DEBUG': False,
        'TESTING': False,
        'PROPAGATE_EXCEPTIONS': True,
        'SECRET_KEY': os.environ.get('SECRET_KEY'),
        'SERVER_NAME': os.environ.get('SERVER_NAME'),
        'PREFERRED_URL_SCHEME': 'https'
    })

    app.run(host='0.0.0.0', port=8080, ssl_context='adhoc')
```

### Compliance Automation Framework
```terraform
# Compliance-as-Code with automated validation
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

# Local compliance checks
locals {
  compliance_checks = {
    # SOX compliance requirements
    sox_controls = {
      encryption_at_rest = true
      encryption_in_transit = true
      access_logging = true
      change_management = true
      segregation_of_duties = true
      backup_retention = "7_years"
    }

    # PCI-DSS requirements
    pci_dss_controls = {
      network_segmentation = true
      access_control = true
      vulnerability_scanning = true
      penetration_testing = "quarterly"
      log_monitoring = true
      secure_coding = true
    }

    # HIPAA requirements
    hipaa_controls = {
      data_encryption = true
      access_controls = true
      audit_trails = true
      risk_assessment = "annual"
      breach_notification = true
      business_associate_agreements = true
    }
  }

  # Common tags for compliance tracking
  compliance_tags = {
    Compliance        = "enabled"
    DataClassification = var.data_classification
    Owner             = var.data_owner
    RetentionPeriod   = var.retention_period
    Environment       = var.environment
    CostCenter        = var.cost_center
  }
}

# Compliance validation using checks
check "sox_compliance" {
  assert {
    condition = alltrue([
      local.compliance_checks.sox_controls.encryption_at_rest,
      local.compliance_checks.sox_controls.encryption_in_transit,
      local.compliance_checks.sox_controls.access_logging
    ])
    error_message = "SOX compliance requirements not met"
  }
}

check "pci_dss_compliance" {
  assert {
    condition = alltrue([
      local.compliance_checks.pci_dss_controls.network_segmentation,
      local.compliance_checks.pci_dss_controls.access_control,
      local.compliance_checks.pci_dss_controls.vulnerability_scanning
    ])
    error_message = "PCI-DSS compliance requirements not met"
  }
}

# Secure S3 bucket with compliance features
resource "aws_s3_bucket" "secure_data" {
  bucket = "${var.project_name}-secure-data-${var.environment}"
  tags   = local.compliance_tags
}

resource "aws_s3_bucket_encryption" "secure_data" {
  bucket = aws_s3_bucket.secure_data.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.data_encryption.arn
        sse_algorithm     = "aws:kms"
      }
      bucket_key_enabled = true
    }
  }
}

resource "aws_s3_bucket_versioning" "secure_data" {
  bucket = aws_s3_bucket.secure_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "secure_data" {
  bucket = aws_s3_bucket.secure_data.id

  rule {
    id     = "compliance_retention"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = var.retention_period_days
    }

    expiration {
      days = var.retention_period_days
    }
  }
}

resource "aws_s3_bucket_logging" "secure_data" {
  bucket = aws_s3_bucket.secure_data.id

  target_bucket = aws_s3_bucket.audit_logs.id
  target_prefix = "s3-access-logs/"
}

resource "aws_s3_bucket_notification" "secure_data" {
  bucket = aws_s3_bucket.secure_data.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.compliance_monitor.arn
    events              = ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]
  }
}

# KMS key for encryption
resource "aws_kms_key" "data_encryption" {
  description             = "Data encryption key for ${var.project_name}"
  deletion_window_in_days = 7
  key_usage              = "ENCRYPT_DECRYPT"

  tags = merge(local.compliance_tags, {
    Purpose = "data_encryption"
  })

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableIAMUserPermissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowCloudTrailAccess"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "data_encryption" {
  name          = "alias/${var.project_name}-data-encryption"
  target_key_id = aws_kms_key.data_encryption.key_id
}

# CloudTrail for audit logging
resource "aws_cloudtrail" "audit_trail" {
  name                          = "${var.project_name}-audit-trail"
  s3_bucket_name               = aws_s3_bucket.audit_logs.bucket
  s3_key_prefix               = "cloudtrail-logs"
  kms_key_id                  = aws_kms_key.data_encryption.arn
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.secure_data.arn}/*"]
    }
  }

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  tags = local.compliance_tags
}

# Lambda function for compliance monitoring
resource "aws_lambda_function" "compliance_monitor" {
  filename      = "compliance_monitor.zip"
  function_name = "${var.project_name}-compliance-monitor"
  role          = aws_iam_role.compliance_monitor.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 300

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.compliance_alerts.arn
      ENCRYPTION_KEY = aws_kms_key.data_encryption.arn
    }
  }

  tags = local.compliance_tags
}

# Compliance monitoring Lambda code
data "archive_file" "compliance_monitor" {
  type        = "zip"
  output_path = "compliance_monitor.zip"
  source {
    content = <<EOF
import boto3
import json
import os
import logging
from datetime import datetime, timedelta

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """Monitor compliance events and send alerts"""

    sns = boto3.client('sns')
    s3 = boto3.client('s3')

    try:
        # Parse S3 event
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            event_name = record['eventName']

            logger.info(f"Processing {event_name} for {bucket}/{key}")

            # Check compliance requirements
            compliance_issues = check_compliance(bucket, key, event_name)

            if compliance_issues:
                send_compliance_alert(sns, compliance_issues, bucket, key)

            # Log access for audit trail
            log_access_event(bucket, key, event_name, record)

    except Exception as e:
        logger.error(f"Error processing compliance event: {e}")
        raise

def check_compliance(bucket, key, event_name):
    """Check various compliance requirements"""
    issues = []

    s3 = boto3.client('s3')

    try:
        # Check encryption
        response = s3.head_object(Bucket=bucket, Key=key)
        if not response.get('ServerSideEncryption'):
            issues.append("Object not encrypted at rest")

        # Check access patterns
        if 'sensitive' in key.lower() and event_name.startswith('ObjectCreated'):
            issues.append("Sensitive data uploaded - requires additional review")

        # Check retention compliance
        if event_name.startswith('ObjectRemoved'):
            # Check if retention period met
            last_modified = response.get('LastModified')
            if last_modified:
                retention_days = int(os.environ.get('RETENTION_DAYS', '2555'))  # 7 years
                if (datetime.now() - last_modified.replace(tzinfo=None)).days < retention_days:
                    issues.append(f"Data deleted before retention period ({retention_days} days)")

    except Exception as e:
        issues.append(f"Error checking compliance: {e}")

    return issues

def send_compliance_alert(sns, issues, bucket, key):
    """Send compliance alert"""
    message = {
        'timestamp': datetime.utcnow().isoformat(),
        'bucket': bucket,
        'key': key,
        'issues': issues,
        'severity': 'HIGH' if any('sensitive' in issue.lower() for issue in issues) else 'MEDIUM'
    }

    sns.publish(
        TopicArn=os.environ['SNS_TOPIC_ARN'],
        Subject='Compliance Alert',
        Message=json.dumps(message, indent=2)
    )

def log_access_event(bucket, key, event_name, record):
    """Log access event for audit trail"""
    audit_log = {
        'timestamp': datetime.utcnow().isoformat(),
        'event_type': 'data_access',
        'bucket': bucket,
        'key': key,
        'action': event_name,
        'source_ip': record.get('requestParameters', {}).get('sourceIPAddress'),
        'user_identity': record.get('userIdentity', {}),
        'request_id': record.get('s3', {}).get('configurationId')
    }

    logger.info(f"AUDIT: {json.dumps(audit_log)}")
EOF
    filename = "index.py"
  }
}

# IAM role for compliance monitor
resource "aws_iam_role" "compliance_monitor" {
  name = "${var.project_name}-compliance-monitor-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.compliance_tags
}

resource "aws_iam_role_policy" "compliance_monitor" {
  name = "${var.project_name}-compliance-monitor-policy"
  role = aws_iam_role.compliance_monitor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:HeadObject"
        ]
        Resource = [
          "${aws_s3_bucket.secure_data.arn}",
          "${aws_s3_bucket.secure_data.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.compliance_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.data_encryption.arn
      }
    ]
  })
}

# SNS topic for compliance alerts
resource "aws_sns_topic" "compliance_alerts" {
  name = "${var.project_name}-compliance-alerts"
  kms_master_key_id = aws_kms_key.data_encryption.arn
  tags = local.compliance_tags
}

# Config rules for continuous compliance monitoring
resource "aws_config_configuration_recorder" "compliance" {
  name     = "${var.project_name}-compliance-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "compliance" {
  name           = "${var.project_name}-compliance-channel"
  s3_bucket_name = aws_s3_bucket.config_logs.bucket
}

resource "aws_config_config_rule" "s3_encryption" {
  name = "s3-bucket-server-side-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.compliance]
}

# Output compliance report
output "compliance_status" {
  description = "Compliance framework status"
  value = {
    sox_compliant    = local.compliance_checks.sox_controls.encryption_at_rest && local.compliance_checks.sox_controls.access_logging
    pci_dss_compliant = local.compliance_checks.pci_dss_controls.network_segmentation && local.compliance_checks.pci_dss_controls.access_control
    hipaa_compliant   = local.compliance_checks.hipaa_controls.data_encryption && local.compliance_checks.hipaa_controls.audit_trails

    monitoring = {
      cloudtrail_enabled = aws_cloudtrail.audit_trail.is_logging
      config_enabled     = aws_config_configuration_recorder.compliance.name
      lambda_monitoring  = aws_lambda_function.compliance_monitor.function_name
    }

    encryption = {
      kms_key_id = aws_kms_key.data_encryption.arn
      s3_encrypted = true
    }
  }
}
```

## Skill Activation Triggers

This skill automatically activates when:
- Security hardening is requested
- Compliance framework implementation is needed
- Zero-trust architecture design is required
- Application security audit is requested
- Infrastructure security assessment is needed
- Regulatory compliance automation is required

This comprehensive security hardening skill provides expert-level capabilities for implementing defense-in-depth security strategies using modern tools and compliance frameworks.
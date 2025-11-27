# Authentication & Authorization Skill

Advanced authentication and authorization expertise covering OAuth 2.0/OIDC implementation, SSO solutions, zero-trust architecture, RBAC/ABAC systems, and comprehensive identity management platform development.

## Skill Overview

Expert authentication and authorization knowledge including identity provider integration, multi-factor authentication, session management, access control policies, security token service implementation, and modern identity platform architecture.

## Core Capabilities

### OAuth 2.0 & OpenID Connect
- **OAuth 2.0 flows** - Authorization code, implicit, client credentials, device flow implementation
- **OIDC integration** - ID tokens, userinfo endpoint, discovery, dynamic client registration
- **PKCE implementation** - Code challenge/verifier, security for public clients
- **Token management** - JWT/JWE tokens, refresh tokens, introspection, revocation

### Enterprise SSO & Identity
- **SAML 2.0** - Identity provider, service provider, assertion processing, metadata
- **LDAP/Active Directory** - Authentication, authorization, group mapping, directory synchronization
- **Identity providers** - Auth0, Okta, Keycloak, AWS Cognito integration and customization
- **Multi-factor authentication** - TOTP, WebAuthn, SMS, email, hardware tokens

### Access Control Systems
- **RBAC implementation** - Role-based access control, hierarchy, permissions, inheritance
- **ABAC systems** - Attribute-based access control, policy engines, dynamic authorization
- **Zero-trust architecture** - Continuous verification, least privilege, network segmentation
- **Policy as code** - Open Policy Agent (OPA), Rego policies, policy testing, governance

### Modern Auth Patterns
- **Passwordless authentication** - WebAuthn/FIDO2, magic links, biometric authentication
- **API security** - API keys, OAuth scopes, rate limiting, API gateway integration
- **Session management** - Secure session handling, concurrent sessions, session fixation protection
- **Identity federation** - Cross-domain identity, trust relationships, identity bridging

## Modern Authentication & Authorization Implementation

### Comprehensive Identity Platform with OAuth 2.0 and Zero-Trust
```typescript
// Advanced authentication and authorization platform with enterprise features
import express, { Express, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';
import ldap from 'ldapjs';
import saml from '@node-saml/node-saml';
import { WebAuthnAuthentication, WebAuthnRegistration } from '@webauthn/server';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import axios from 'axios';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import nodemailer from 'nodemailer';

// Types and interfaces
interface AuthConfig {
  jwtSecret: string;
  jwtRefreshSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventReuse: number;
  };
  mfa: {
    enabled: boolean;
    required: boolean;
    totpIssuer: string;
  };
  oauth: {
    authorizationCodeExpiry: number;
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
    pkceRequired: boolean;
  };
  saml: {
    entryPoint: string;
    issuer: string;
    cert: string;
    privateKey: string;
  };
  ldap: {
    url: string;
    bindDN: string;
    bindPassword: string;
    searchBase: string;
    searchFilter: string;
  };
}

interface User {
  id: string;
  email: string;
  username: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  roles: string[];
  attributes: Record<string, any>;
  mfaEnabled: boolean;
  mfaSecret?: string;
  webauthnCredentials: WebAuthnCredential[];
  lastLogin?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  passwordChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface WebAuthnCredential {
  id: string;
  publicKey: string;
  counter: number;
  transports: string[];
  createdAt: Date;
}

interface OAuthClient {
  id: string;
  secret: string;
  name: string;
  redirectUris: string[];
  scopes: string[];
  grantTypes: string[];
  responseTypes: string[];
  tokenEndpointAuthMethod: string;
  pkceRequired: boolean;
  trusted: boolean;
}

interface AuthorizationCode {
  code: string;
  clientId: string;
  userId: string;
  scopes: string[];
  redirectUri: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  expiresAt: Date;
  used: boolean;
}

interface AccessToken {
  token: string;
  clientId: string;
  userId: string;
  scopes: string[];
  expiresAt: Date;
  revoked: boolean;
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  effect: 'allow' | 'deny';
  conditions?: Record<string, any>;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  parentRoles: string[];
}

interface PolicyDecision {
  decision: 'allow' | 'deny';
  reasons: string[];
  appliedPolicies: string[];
}

// Validation schemas
const userRegistrationSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  mfaToken: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

const oauthClientSchema = z.object({
  name: z.string().min(1),
  redirectUris: z.array(z.string().url()),
  scopes: z.array(z.string()),
  grantTypes: z.array(z.enum(['authorization_code', 'client_credentials', 'refresh_token'])),
  trusted: z.boolean().default(false),
});

// Core Identity Platform
class IdentityPlatform {
  private app: Express;
  private config: AuthConfig;
  private redis: Redis;
  private prisma: PrismaClient;
  private logger: Logger;
  private rateLimiter: RateLimiterRedis;
  private emailTransporter: nodemailer.Transporter;
  private ldapClient?: ldap.Client;
  private samlStrategy?: saml.SAML;

  // In-memory stores (in production, use Redis/Database)
  private authorizationCodes: Map<string, AuthorizationCode> = new Map();
  private accessTokens: Map<string, AccessToken> = new Map();
  private refreshTokens: Map<string, any> = new Map();
  private sessions: Map<string, any> = new Map();
  private oauthClients: Map<string, OAuthClient> = new Map();
  private roles: Map<string, Role> = new Map();
  private policies: Map<string, any> = new Map();

  constructor(config: AuthConfig) {
    this.config = config;
    this.app = express();
    this.redis = new Redis(process.env.REDIS_URL);
    this.prisma = new PrismaClient();

    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.Console({ format: format.simple() }),
        new transports.File({ filename: 'identity-platform.log' })
      ]
    });

    this.rateLimiter = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'auth_rate_limit',
      points: 10, // Number of attempts
      duration: 900, // Per 15 minutes
    });

    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupLDAP();
    this.setupSAML();
    this.initializeDefaultRoles();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Security headers
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      next();
    });

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const requestId = uuidv4();
      req.headers['x-request-id'] = requestId;

      this.logger.info('Request received', {
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      next();
    });

    // Rate limiting
    this.app.use('/auth', this.createRateLimitMiddleware());
  }

  private setupRoutes(): void {
    // Authentication routes
    this.app.post('/auth/register', this.register.bind(this));
    this.app.post('/auth/login', this.login.bind(this));
    this.app.post('/auth/logout', this.authenticate.bind(this), this.logout.bind(this));
    this.app.post('/auth/refresh', this.refreshToken.bind(this));
    this.app.post('/auth/forgot-password', this.forgotPassword.bind(this));
    this.app.post('/auth/reset-password', this.resetPassword.bind(this));

    // MFA routes
    this.app.post('/auth/mfa/setup', this.authenticate.bind(this), this.setupMFA.bind(this));
    this.app.post('/auth/mfa/verify', this.authenticate.bind(this), this.verifyMFA.bind(this));
    this.app.post('/auth/mfa/disable', this.authenticate.bind(this), this.disableMFA.bind(this));

    // WebAuthn routes
    this.app.post('/auth/webauthn/register/begin', this.authenticate.bind(this), this.beginWebAuthnRegistration.bind(this));
    this.app.post('/auth/webauthn/register/complete', this.authenticate.bind(this), this.completeWebAuthnRegistration.bind(this));
    this.app.post('/auth/webauthn/authenticate/begin', this.beginWebAuthnAuthentication.bind(this));
    this.app.post('/auth/webauthn/authenticate/complete', this.completeWebAuthnAuthentication.bind(this));

    // OAuth 2.0 routes
    this.app.get('/oauth/authorize', this.authorize.bind(this));
    this.app.post('/oauth/token', this.token.bind(this));
    this.app.post('/oauth/introspect', this.introspect.bind(this));
    this.app.post('/oauth/revoke', this.revoke.bind(this));

    // OIDC routes
    this.app.get('/.well-known/openid-configuration', this.openidConfiguration.bind(this));
    this.app.get('/userinfo', this.authenticate.bind(this), this.userinfo.bind(this));
    this.app.get('/jwks', this.jwks.bind(this));

    // SAML routes
    this.app.get('/saml/metadata', this.samlMetadata.bind(this));
    this.app.post('/saml/acs', this.samlACS.bind(this));
    this.app.get('/saml/sls', this.samlSLS.bind(this));

    // User management routes
    this.app.get('/users/profile', this.authenticate.bind(this), this.getProfile.bind(this));
    this.app.put('/users/profile', this.authenticate.bind(this), this.updateProfile.bind(this));
    this.app.post('/users/change-password', this.authenticate.bind(this), this.changePassword.bind(this));

    // Admin routes
    this.app.get('/admin/users', this.authenticate.bind(this), this.authorize(['admin']).bind(this), this.getUsers.bind(this));
    this.app.post('/admin/clients', this.authenticate.bind(this), this.authorize(['admin']).bind(this), this.createOAuthClient.bind(this));
    this.app.get('/admin/audit', this.authenticate.bind(this), this.authorize(['admin']).bind(this), this.getAuditLogs.bind(this));

    // Health check
    this.app.get('/health', this.healthCheck.bind(this));
  }

  // Authentication middleware
  private async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, this.config.jwtSecret) as any;

      // Check if token is revoked
      const isRevoked = await this.redis.get(`revoked_token:${token}`);
      if (isRevoked) {
        res.status(401).json({ error: 'Token has been revoked' });
        return;
      }

      // Get user from database
      const user = await this.getUserById(decoded.userId);
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      // Check if user is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        res.status(401).json({ error: 'Account is locked' });
        return;
      }

      (req as any).user = user;
      (req as any).tokenPayload = decoded;

      next();
    } catch (error) {
      this.logger.error('Authentication error', { error });
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  // Authorization middleware
  private authorize(requiredRoles: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Check role-based access
      const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));
      if (!hasRequiredRole) {
        // Check attribute-based access
        const decision = await this.evaluatePolicies(user, req);
        if (decision.decision === 'deny') {
          this.logger.warn('Access denied', {
            userId: user.id,
            requiredRoles,
            userRoles: user.roles,
            resource: req.path,
            action: req.method,
            reasons: decision.reasons,
          });
          res.status(403).json({
            error: 'Access denied',
            reasons: decision.reasons
          });
          return;
        }
      }

      next();
    };
  }

  // User registration
  private async register(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = userRegistrationSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await this.getUserByEmail(validatedData.email);
      if (existingUser) {
        res.status(400).json({ error: 'User already exists' });
        return;
      }

      // Validate password policy
      const passwordValidation = this.validatePassword(validatedData.password);
      if (!passwordValidation.valid) {
        res.status(400).json({
          error: 'Password does not meet requirements',
          requirements: passwordValidation.requirements
        });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(validatedData.password, 12);

      // Create user
      const user: User = {
        id: uuidv4(),
        email: validatedData.email,
        username: validatedData.username,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        roles: ['user'], // Default role
        attributes: {},
        mfaEnabled: false,
        webauthnCredentials: [],
        loginAttempts: 0,
        passwordChangedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.saveUser(user);

      // Log audit event
      await this.logAuditEvent('user.registered', user.id, {
        email: user.email,
        username: user.username,
      });

      res.status(201).json({
        message: 'User registered successfully',
        userId: user.id,
      });
    } catch (error) {
      this.logger.error('Registration error', { error });
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // User login
  private async login(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);
      const clientIp = req.ip;

      // Rate limiting
      try {
        await this.rateLimiter.consume(clientIp);
      } catch (rejRes) {
        res.status(429).json({ error: 'Too many login attempts' });
        return;
      }

      // Get user
      const user = await this.getUserByEmail(validatedData.email);
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Check if user is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        res.status(401).json({ error: 'Account is locked' });
        return;
      }

      // Verify password
      if (!user.passwordHash || !await bcrypt.compare(validatedData.password, user.passwordHash)) {
        await this.handleFailedLogin(user);
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Check MFA
      if (user.mfaEnabled && !validatedData.mfaToken) {
        res.status(200).json({
          requiresMfa: true,
          message: 'MFA token required'
        });
        return;
      }

      if (user.mfaEnabled && validatedData.mfaToken) {
        const mfaValid = this.verifyTOTP(user.mfaSecret!, validatedData.mfaToken);
        if (!mfaValid) {
          res.status(401).json({ error: 'Invalid MFA token' });
          return;
        }
      }

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      // Update last login
      user.lastLogin = new Date();
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
      await this.saveUser(user);

      // Log audit event
      await this.logAuditEvent('user.login', user.id, {
        ip: clientIp,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        accessToken,
        refreshToken: validatedData.rememberMe ? refreshToken : undefined,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          mfaEnabled: user.mfaEnabled,
        },
      });
    } catch (error) {
      this.logger.error('Login error', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // MFA Setup
  private async setupMFA(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (user.mfaEnabled) {
        res.status(400).json({ error: 'MFA is already enabled' });
        return;
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        issuer: this.config.mfa.totpIssuer,
        name: user.email,
        length: 32,
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Store secret temporarily (confirm with verification)
      await this.redis.setex(`mfa_setup:${user.id}`, 300, secret.base32); // 5 minutes

      res.json({
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32,
      });
    } catch (error) {
      this.logger.error('MFA setup error', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // MFA Verification
  private async verifyMFA(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ error: 'MFA token is required' });
        return;
      }

      let secret = user.mfaSecret;

      // If setting up MFA, get temporary secret
      if (!user.mfaEnabled) {
        secret = await this.redis.get(`mfa_setup:${user.id}`);
        if (!secret) {
          res.status(400).json({ error: 'MFA setup session expired' });
          return;
        }
      }

      const isValid = this.verifyTOTP(secret, token);
      if (!isValid) {
        res.status(400).json({ error: 'Invalid MFA token' });
        return;
      }

      // If this was setup verification, enable MFA
      if (!user.mfaEnabled) {
        user.mfaSecret = secret;
        user.mfaEnabled = true;
        await this.saveUser(user);
        await this.redis.del(`mfa_setup:${user.id}`);

        await this.logAuditEvent('user.mfa.enabled', user.id, {});

        res.json({ message: 'MFA enabled successfully' });
      } else {
        res.json({ message: 'MFA token verified' });
      }
    } catch (error) {
      this.logger.error('MFA verification error', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // WebAuthn Registration
  private async beginWebAuthnRegistration(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      const options = await WebAuthnRegistration.generateRegistrationOptions({
        rpName: 'Identity Platform',
        rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
        userID: user.id,
        userName: user.email,
        userDisplayName: `${user.firstName} ${user.lastName}`,
        attestationType: 'direct',
        excludeCredentials: user.webauthnCredentials.map(cred => ({
          id: Buffer.from(cred.id, 'base64'),
          type: 'public-key',
          transports: cred.transports as any,
        })),
      });

      // Store challenge
      await this.redis.setex(
        `webauthn_challenge:${user.id}`,
        300,
        options.challenge
      );

      res.json(options);
    } catch (error) {
      this.logger.error('WebAuthn registration begin error', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // OAuth 2.0 Authorization
  private async authorize(req: Request, res: Response): Promise<void> {
    try {
      const {
        client_id,
        redirect_uri,
        response_type,
        scope,
        state,
        code_challenge,
        code_challenge_method,
      } = req.query;

      // Validate client
      const client = this.oauthClients.get(client_id as string);
      if (!client) {
        res.status(400).json({ error: 'invalid_client' });
        return;
      }

      // Validate redirect URI
      if (!client.redirectUris.includes(redirect_uri as string)) {
        res.status(400).json({ error: 'invalid_redirect_uri' });
        return;
      }

      // Validate response type
      if (!client.responseTypes.includes(response_type as string)) {
        res.status(400).json({ error: 'unsupported_response_type' });
        return;
      }

      // Validate PKCE if required
      if (client.pkceRequired && !code_challenge) {
        res.status(400).json({ error: 'code_challenge_required' });
        return;
      }

      // Check if user is authenticated
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.redirect(`/login?client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}`);
        return;
      }

      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, this.config.jwtSecret) as any;
        const user = await this.getUserById(decoded.userId);

        if (!user) {
          res.redirect(`/login?client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}`);
          return;
        }

        // Generate authorization code
        const authCode: AuthorizationCode = {
          code: this.generateRandomString(32),
          clientId: client_id as string,
          userId: user.id,
          scopes: (scope as string).split(' '),
          redirectUri: redirect_uri as string,
          codeChallenge: code_challenge as string,
          codeChallengeMethod: code_challenge_method as string,
          expiresAt: new Date(Date.now() + this.config.oauth.authorizationCodeExpiry),
          used: false,
        };

        this.authorizationCodes.set(authCode.code, authCode);

        // Redirect with authorization code
        const redirectUrl = new URL(redirect_uri as string);
        redirectUrl.searchParams.set('code', authCode.code);
        if (state) redirectUrl.searchParams.set('state', state as string);

        res.redirect(redirectUrl.toString());
      } catch (error) {
        res.redirect(`/login?client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}`);
      }
    } catch (error) {
      this.logger.error('OAuth authorize error', { error });
      res.status(500).json({ error: 'server_error' });
    }
  }

  // OAuth 2.0 Token
  private async token(req: Request, res: Response): Promise<void> {
    try {
      const {
        grant_type,
        code,
        redirect_uri,
        client_id,
        client_secret,
        code_verifier,
        refresh_token,
      } = req.body;

      // Validate client
      const client = this.oauthClients.get(client_id);
      if (!client) {
        res.status(400).json({ error: 'invalid_client' });
        return;
      }

      // Validate client secret for confidential clients
      if (client.secret && client.secret !== client_secret) {
        res.status(400).json({ error: 'invalid_client' });
        return;
      }

      if (grant_type === 'authorization_code') {
        await this.handleAuthorizationCodeGrant(req, res, client);
      } else if (grant_type === 'refresh_token') {
        await this.handleRefreshTokenGrant(req, res, client);
      } else if (grant_type === 'client_credentials') {
        await this.handleClientCredentialsGrant(req, res, client);
      } else {
        res.status(400).json({ error: 'unsupported_grant_type' });
      }
    } catch (error) {
      this.logger.error('OAuth token error', { error });
      res.status(500).json({ error: 'server_error' });
    }
  }

  // Policy Evaluation (ABAC)
  private async evaluatePolicies(user: User, req: Request): Promise<PolicyDecision> {
    const decision: PolicyDecision = {
      decision: 'deny',
      reasons: [],
      appliedPolicies: [],
    };

    // Example policy evaluation
    const resource = req.path;
    const action = req.method.toLowerCase();

    // Check time-based access
    const currentHour = new Date().getHours();
    if (currentHour < 6 || currentHour > 22) {
      if (!user.roles.includes('admin')) {
        decision.reasons.push('Access denied outside business hours');
        return decision;
      }
    }

    // Check location-based access (if available)
    const clientIp = req.ip;
    const trustedNetworks = ['192.168.0.0/16', '10.0.0.0/8'];
    // IP validation logic would go here

    // Check resource-based permissions
    for (const role of user.roles) {
      const roleObj = this.roles.get(role);
      if (roleObj) {
        for (const permission of roleObj.permissions) {
          if (this.matchesResource(permission.resource, resource) &&
              this.matchesAction(permission.action, action)) {
            if (permission.effect === 'allow') {
              decision.decision = 'allow';
              decision.appliedPolicies.push(`role:${role}:${permission.id}`);
            }
          }
        }
      }
    }

    return decision;
  }

  // Utility methods
  private validatePassword(password: string): { valid: boolean; requirements: string[] } {
    const requirements: string[] = [];
    const policy = this.config.passwordPolicy;

    if (password.length < policy.minLength) {
      requirements.push(`Minimum ${policy.minLength} characters`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      requirements.push('At least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      requirements.push('At least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      requirements.push('At least one number');
    }

    if (policy.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
      requirements.push('At least one special character');
    }

    return {
      valid: requirements.length === 0,
      requirements,
    };
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      attributes: user.attributes,
    };

    const accessToken = jwt.sign(tokenPayload, this.config.jwtSecret, {
      expiresIn: this.config.accessTokenExpiry,
      issuer: 'identity-platform',
      audience: 'api',
    });

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      this.config.jwtRefreshSecret,
      {
        expiresIn: this.config.refreshTokenExpiry,
        issuer: 'identity-platform',
      }
    );

    // Store refresh token
    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    return { accessToken, refreshToken };
  }

  private verifyTOTP(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow some clock drift
    });
  }

  private async handleFailedLogin(user: User): Promise<void> {
    user.loginAttempts += 1;

    if (user.loginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await this.logAuditEvent('user.locked', user.id, {
        reason: 'Failed login attempts',
      });
    }

    await this.saveUser(user);
  }

  private generateRandomString(length: number): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  private async logAuditEvent(event: string, userId: string, data: any): Promise<void> {
    const auditLog = {
      id: uuidv4(),
      event,
      userId,
      data,
      timestamp: new Date(),
      ip: data.ip,
      userAgent: data.userAgent,
    };

    // Store in database
    await this.redis.lpush('audit_logs', JSON.stringify(auditLog));

    this.logger.info('Audit event', auditLog);
  }

  // Database operations (simplified - use Prisma in production)
  private async getUserById(id: string): Promise<User | null> {
    // Implementation would query database
    return null;
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    // Implementation would query database
    return null;
  }

  private async saveUser(user: User): Promise<void> {
    // Implementation would save to database
  }

  // Setup methods
  private setupLDAP(): void {
    if (this.config.ldap?.url) {
      this.ldapClient = ldap.createClient({
        url: this.config.ldap.url,
      });
    }
  }

  private setupSAML(): void {
    if (this.config.saml?.entryPoint) {
      this.samlStrategy = new saml.SAML({
        entryPoint: this.config.saml.entryPoint,
        issuer: this.config.saml.issuer,
        cert: this.config.saml.cert,
        privateKey: this.config.saml.privateKey,
      });
    }
  }

  private initializeDefaultRoles(): void {
    // Initialize default roles
    this.roles.set('admin', {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access',
      permissions: [
        {
          id: 'admin-all',
          resource: '*',
          action: '*',
          effect: 'allow',
        },
      ],
      parentRoles: [],
    });

    this.roles.set('user', {
      id: 'user',
      name: 'User',
      description: 'Standard user access',
      permissions: [
        {
          id: 'user-profile',
          resource: '/users/profile',
          action: 'get',
          effect: 'allow',
        },
        {
          id: 'user-update',
          resource: '/users/profile',
          action: 'put',
          effect: 'allow',
        },
      ],
      parentRoles: [],
    });
  }

  private createRateLimitMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await this.rateLimiter.consume(req.ip);
        next();
      } catch (rejRes) {
        res.status(429).json({ error: 'Too many requests' });
      }
    };
  }

  private matchesResource(pattern: string, resource: string): boolean {
    if (pattern === '*') return true;
    return new RegExp(pattern.replace(/\*/g, '.*')).test(resource);
  }

  private matchesAction(pattern: string, action: string): boolean {
    if (pattern === '*') return true;
    return pattern === action;
  }

  private async handleAuthorizationCodeGrant(req: Request, res: Response, client: OAuthClient): Promise<void> {
    // Implementation for authorization code grant
    res.status(501).json({ error: 'not_implemented' });
  }

  private async handleRefreshTokenGrant(req: Request, res: Response, client: OAuthClient): Promise<void> {
    // Implementation for refresh token grant
    res.status(501).json({ error: 'not_implemented' });
  }

  private async handleClientCredentialsGrant(req: Request, res: Response, client: OAuthClient): Promise<void> {
    // Implementation for client credentials grant
    res.status(501).json({ error: 'not_implemented' });
  }

  // Placeholder route handlers
  private async refreshToken(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async logout(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async forgotPassword(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async resetPassword(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async disableMFA(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async completeWebAuthnRegistration(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async beginWebAuthnAuthentication(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async completeWebAuthnAuthentication(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async introspect(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async revoke(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async openidConfiguration(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async userinfo(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async jwks(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async samlMetadata(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async samlACS(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async samlSLS(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async getProfile(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async updateProfile(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async changePassword(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async getUsers(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async createOAuthClient(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async getAuditLogs(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented' });
  }

  private async healthCheck(req: Request, res: Response): Promise<void> {
    res.json({ status: 'healthy', timestamp: new Date() });
  }

  public start(port: number = 3000): void {
    this.app.listen(port, () => {
      this.logger.info(`Identity platform running on port ${port}`);
    });
  }
}

// Example usage
const config: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  accessTokenExpiry: '1h',
  refreshTokenExpiry: '30d',
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: 5,
  },
  mfa: {
    enabled: true,
    required: false,
    totpIssuer: 'Identity Platform',
  },
  oauth: {
    authorizationCodeExpiry: 600, // 10 minutes
    accessTokenExpiry: 3600, // 1 hour
    refreshTokenExpiry: 2592000, // 30 days
    pkceRequired: true,
  },
  saml: {
    entryPoint: process.env.SAML_ENTRY_POINT!,
    issuer: process.env.SAML_ISSUER!,
    cert: process.env.SAML_CERT!,
    privateKey: process.env.SAML_PRIVATE_KEY!,
  },
  ldap: {
    url: process.env.LDAP_URL!,
    bindDN: process.env.LDAP_BIND_DN!,
    bindPassword: process.env.LDAP_BIND_PASSWORD!,
    searchBase: process.env.LDAP_SEARCH_BASE!,
    searchFilter: process.env.LDAP_SEARCH_FILTER!,
  },
};

const identityPlatform = new IdentityPlatform(config);
identityPlatform.start(3000);

export { IdentityPlatform, AuthConfig };
```

## Skill Activation Triggers

This skill automatically activates when:
- User authentication and authorization systems are needed
- OAuth 2.0 or OIDC implementation is required
- SSO integration and identity management is requested
- Multi-factor authentication setup is needed
- Role-based or attribute-based access control is required
- Zero-trust security architecture implementation is requested

This comprehensive authentication and authorization skill provides expert-level capabilities for building modern, secure identity management systems with enterprise-grade features for authentication, authorization, and access control.
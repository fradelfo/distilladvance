# Cryptography & Security Skill

Advanced cryptographic implementation and security engineering expertise covering modern encryption, authentication protocols, secure communications, and security compliance frameworks.

## Skill Overview

Expert cryptographic knowledge including symmetric/asymmetric encryption, digital signatures, key management, secure protocols (TLS, OAuth, JWT), zero-knowledge proofs, blockchain security, and compliance with security standards.

## Core Capabilities

### Modern Cryptography
- **Symmetric encryption** - AES-256-GCM, ChaCha20-Poly1305, authenticated encryption
- **Asymmetric encryption** - RSA, ECDH, Ed25519, post-quantum cryptography
- **Hashing & integrity** - SHA-3, BLAKE3, Argon2, password hashing
- **Digital signatures** - ECDSA, EdDSA, RSA-PSS, signature verification

### Authentication & Authorization
- **Multi-factor authentication** - TOTP, HOTP, WebAuthn, FIDO2 integration
- **OAuth 2.0 & OpenID Connect** - Authorization flows, token management
- **JWT & session management** - Secure token design, refresh strategies
- **Zero-trust architecture** - Identity verification, continuous authentication

### Secure Communications
- **TLS/SSL implementation** - Certificate management, perfect forward secrecy
- **VPN protocols** - WireGuard, IPSec, OpenVPN configuration
- **Secure messaging** - Signal protocol, end-to-end encryption
- **Network security** - Firewall rules, intrusion detection, packet analysis

### Enterprise Security
- **Key management systems** - HSMs, KMS integration, key rotation
- **Compliance frameworks** - FIPS 140-2, Common Criteria, SOC 2 Type II
- **Security auditing** - Penetration testing, vulnerability assessment
- **Incident response** - Forensics, breach detection, recovery procedures

## Modern Cryptography Implementation

### Advanced Encryption Standards
```python
# Modern Python cryptography with best practices
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM, ChaCha20Poly1305
from cryptography.hazmat.primitives.asymmetric import rsa, ec, ed25519, padding
from cryptography.hazmat.primitives import hashes, hmac, kdf, serialization
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import os
import secrets
import base64
import json
from typing import Tuple, Dict, Any, Optional
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass
import hashlib

@dataclass
class EncryptionResult:
    ciphertext: bytes
    nonce: bytes
    tag: bytes
    salt: Optional[bytes] = None

@dataclass
class KeyPair:
    private_key: bytes
    public_key: bytes
    algorithm: str

class ModernCrypto:
    """Advanced cryptographic operations with security best practices"""

    def __init__(self):
        self.backend = default_backend()
        self.logger = logging.getLogger(__name__)

    # Symmetric Encryption with Authenticated Encryption (AEAD)
    def encrypt_aes_gcm(self, plaintext: bytes, key: bytes, associated_data: Optional[bytes] = None) -> EncryptionResult:
        """AES-256-GCM authenticated encryption"""

        if len(key) != 32:  # 256 bits
            raise ValueError("AES-256 requires 32-byte key")

        # Generate random nonce (96 bits for GCM)
        nonce = os.urandom(12)

        # Initialize cipher
        aesgcm = AESGCM(key)

        # Encrypt and authenticate
        ciphertext = aesgcm.encrypt(nonce, plaintext, associated_data)

        # Extract tag (last 16 bytes)
        tag = ciphertext[-16:]
        actual_ciphertext = ciphertext[:-16]

        return EncryptionResult(
            ciphertext=actual_ciphertext,
            nonce=nonce,
            tag=tag
        )

    def decrypt_aes_gcm(self, result: EncryptionResult, key: bytes,
                       associated_data: Optional[bytes] = None) -> bytes:
        """AES-256-GCM authenticated decryption"""

        if len(key) != 32:
            raise ValueError("AES-256 requires 32-byte key")

        # Reconstruct ciphertext with tag
        ciphertext_with_tag = result.ciphertext + result.tag

        # Initialize cipher
        aesgcm = AESGCM(key)

        try:
            # Decrypt and verify
            plaintext = aesgcm.decrypt(result.nonce, ciphertext_with_tag, associated_data)
            return plaintext
        except Exception as e:
            self.logger.error(f"Decryption failed: {e}")
            raise ValueError("Authentication verification failed")

    def encrypt_chacha20_poly1305(self, plaintext: bytes, key: bytes,
                                 associated_data: Optional[bytes] = None) -> EncryptionResult:
        """ChaCha20-Poly1305 authenticated encryption"""

        if len(key) != 32:
            raise ValueError("ChaCha20 requires 32-byte key")

        # Generate random nonce (96 bits)
        nonce = os.urandom(12)

        # Initialize cipher
        chacha = ChaCha20Poly1305(key)

        # Encrypt and authenticate
        ciphertext = chacha.encrypt(nonce, plaintext, associated_data)

        # Extract tag (last 16 bytes)
        tag = ciphertext[-16:]
        actual_ciphertext = ciphertext[:-16]

        return EncryptionResult(
            ciphertext=actual_ciphertext,
            nonce=nonce,
            tag=tag
        )

    def decrypt_chacha20_poly1305(self, result: EncryptionResult, key: bytes,
                                 associated_data: Optional[bytes] = None) -> bytes:
        """ChaCha20-Poly1305 authenticated decryption"""

        if len(key) != 32:
            raise ValueError("ChaCha20 requires 32-byte key")

        # Reconstruct ciphertext with tag
        ciphertext_with_tag = result.ciphertext + result.tag

        # Initialize cipher
        chacha = ChaCha20Poly1305(key)

        try:
            # Decrypt and verify
            plaintext = chacha.decrypt(result.nonce, ciphertext_with_tag, associated_data)
            return plaintext
        except Exception as e:
            self.logger.error(f"Decryption failed: {e}")
            raise ValueError("Authentication verification failed")

    # Asymmetric Cryptography
    def generate_rsa_keypair(self, key_size: int = 4096) -> KeyPair:
        """Generate RSA keypair with modern key sizes"""

        if key_size < 2048:
            raise ValueError("RSA key size must be at least 2048 bits")

        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=key_size,
            backend=self.backend
        )

        # Serialize private key (PKCS#8 format)
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )

        # Serialize public key
        public_key = private_key.public_key()
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

        return KeyPair(
            private_key=private_pem,
            public_key=public_pem,
            algorithm="RSA"
        )

    def generate_ec_keypair(self, curve: str = "secp384r1") -> KeyPair:
        """Generate Elliptic Curve keypair"""

        # Supported curves with security recommendations
        curves = {
            "secp256r1": ec.SECP256R1(),  # NIST P-256
            "secp384r1": ec.SECP384R1(),  # NIST P-384 (recommended)
            "secp521r1": ec.SECP521R1(),  # NIST P-521
        }

        if curve not in curves:
            raise ValueError(f"Unsupported curve: {curve}")

        # Generate private key
        private_key = ec.generate_private_key(curves[curve], self.backend)

        # Serialize private key
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )

        # Serialize public key
        public_key = private_key.public_key()
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

        return KeyPair(
            private_key=private_pem,
            public_key=public_pem,
            algorithm=f"ECDH_{curve}"
        )

    def generate_ed25519_keypair(self) -> KeyPair:
        """Generate Ed25519 keypair for digital signatures"""

        # Generate private key
        private_key = ed25519.Ed25519PrivateKey.generate()

        # Serialize private key
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )

        # Serialize public key
        public_key = private_key.public_key()
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

        return KeyPair(
            private_key=private_pem,
            public_key=public_pem,
            algorithm="Ed25519"
        )

    def rsa_encrypt(self, plaintext: bytes, public_key_pem: bytes) -> bytes:
        """RSA encryption with OAEP padding"""

        # Load public key
        public_key = serialization.load_pem_public_key(public_key_pem, backend=self.backend)

        # Encrypt with OAEP padding (secure)
        ciphertext = public_key.encrypt(
            plaintext,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        return ciphertext

    def rsa_decrypt(self, ciphertext: bytes, private_key_pem: bytes) -> bytes:
        """RSA decryption with OAEP padding"""

        # Load private key
        private_key = serialization.load_pem_private_key(
            private_key_pem,
            password=None,
            backend=self.backend
        )

        # Decrypt with OAEP padding
        plaintext = private_key.decrypt(
            ciphertext,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        return plaintext

    def sign_ed25519(self, message: bytes, private_key_pem: bytes) -> bytes:
        """Ed25519 digital signature"""

        # Load private key
        private_key = serialization.load_pem_private_key(
            private_key_pem,
            password=None,
            backend=self.backend
        )

        # Sign message
        signature = private_key.sign(message)
        return signature

    def verify_ed25519(self, message: bytes, signature: bytes, public_key_pem: bytes) -> bool:
        """Verify Ed25519 digital signature"""

        try:
            # Load public key
            public_key = serialization.load_pem_public_key(public_key_pem, backend=self.backend)

            # Verify signature
            public_key.verify(signature, message)
            return True
        except Exception as e:
            self.logger.warning(f"Signature verification failed: {e}")
            return False

    # Key Derivation and Password Hashing
    def derive_key_scrypt(self, password: str, salt: Optional[bytes] = None,
                         key_length: int = 32) -> Tuple[bytes, bytes]:
        """Derive key from password using Scrypt (memory-hard)"""

        if salt is None:
            salt = os.urandom(32)

        # Scrypt parameters (adjust based on security requirements)
        kdf = Scrypt(
            algorithm=hashes.SHA256(),
            length=key_length,
            salt=salt,
            n=2**14,  # CPU/memory cost parameter
            r=8,      # Block size
            p=1,      # Parallelization parameter
            backend=self.backend
        )

        key = kdf.derive(password.encode('utf-8'))
        return key, salt

    def derive_key_pbkdf2(self, password: str, salt: Optional[bytes] = None,
                         iterations: int = 100000, key_length: int = 32) -> Tuple[bytes, bytes]:
        """Derive key from password using PBKDF2"""

        if salt is None:
            salt = os.urandom(32)

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=key_length,
            salt=salt,
            iterations=iterations,
            backend=self.backend
        )

        key = kdf.derive(password.encode('utf-8'))
        return key, salt

    def hash_password_argon2(self, password: str) -> str:
        """Hash password using Argon2 (winner of password hashing competition)"""

        try:
            import argon2
            ph = argon2.PasswordHasher(
                time_cost=3,        # Number of iterations
                memory_cost=65536,  # Memory usage in KiB
                parallelism=1,      # Number of parallel threads
                hash_len=32,        # Hash length
                salt_len=16         # Salt length
            )
            return ph.hash(password)
        except ImportError:
            # Fallback to Scrypt if argon2 not available
            key, salt = self.derive_key_scrypt(password)
            return f"scrypt:{base64.b64encode(salt).decode()}:{base64.b64encode(key).decode()}"

    def verify_password_argon2(self, password: str, hashed: str) -> bool:
        """Verify password against Argon2 hash"""

        try:
            import argon2
            ph = argon2.PasswordHasher()
            ph.verify(hashed, password)
            return True
        except ImportError:
            # Handle scrypt fallback
            if hashed.startswith("scrypt:"):
                parts = hashed.split(":")
                if len(parts) != 3:
                    return False

                salt = base64.b64decode(parts[1])
                expected_key = base64.b64decode(parts[2])

                derived_key, _ = self.derive_key_scrypt(password, salt)
                return secrets.compare_digest(derived_key, expected_key)
            return False
        except Exception:
            return False

    # Secure Random Generation
    def generate_secure_token(self, length: int = 32) -> str:
        """Generate cryptographically secure random token"""
        return secrets.token_urlsafe(length)

    def generate_secure_bytes(self, length: int = 32) -> bytes:
        """Generate cryptographically secure random bytes"""
        return secrets.token_bytes(length)

    def generate_nonce(self, length: int = 12) -> bytes:
        """Generate nonce for encryption (number used once)"""
        return os.urandom(length)

    # Message Authentication Codes
    def compute_hmac(self, message: bytes, key: bytes, algorithm=hashes.SHA256) -> bytes:
        """Compute HMAC for message authentication"""

        h = hmac.HMAC(key, algorithm(), backend=self.backend)
        h.update(message)
        return h.finalize()

    def verify_hmac(self, message: bytes, key: bytes, expected_hmac: bytes,
                   algorithm=hashes.SHA256) -> bool:
        """Verify HMAC"""

        try:
            h = hmac.HMAC(key, algorithm(), backend=self.backend)
            h.update(message)
            h.verify(expected_hmac)
            return True
        except Exception:
            return False

    # Secure Hash Functions
    def hash_sha3_256(self, data: bytes) -> bytes:
        """Compute SHA-3 256-bit hash"""
        digest = hashes.Hash(hashes.SHA3_256(), backend=self.backend)
        digest.update(data)
        return digest.finalize()

    def hash_blake2b(self, data: bytes, key: Optional[bytes] = None) -> bytes:
        """Compute BLAKE2b hash (faster than SHA-3)"""
        digest = hashes.Hash(hashes.BLAKE2b(64, key=key), backend=self.backend)
        digest.update(data)
        return digest.finalize()

# JWT Token Security Implementation
import jwt
from datetime import datetime, timedelta
import uuid

class SecureJWT:
    """Secure JWT implementation with best practices"""

    def __init__(self, secret_key: bytes, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.crypto = ModernCrypto()

    def create_token(self, payload: Dict[str, Any], expires_in: int = 3600) -> str:
        """Create JWT token with security best practices"""

        now = datetime.utcnow()

        # Add standard claims
        token_payload = {
            **payload,
            "iat": now,                                    # Issued at
            "exp": now + timedelta(seconds=expires_in),    # Expiration
            "nbf": now,                                    # Not before
            "jti": str(uuid.uuid4()),                      # JWT ID for revocation
            "iss": "secure-api",                           # Issuer
        }

        # Sign token
        token = jwt.encode(
            token_payload,
            self.secret_key,
            algorithm=self.algorithm,
            headers={"alg": self.algorithm, "typ": "JWT"}
        )

        return token

    def verify_token(self, token: str, required_claims: Optional[List[str]] = None) -> Dict[str, Any]:
        """Verify JWT token with comprehensive validation"""

        try:
            # Decode and verify token
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                options={
                    "require_exp": True,
                    "require_iat": True,
                    "require_nbf": True,
                    "verify_exp": True,
                    "verify_iat": True,
                    "verify_nbf": True,
                }
            )

            # Check required claims
            if required_claims:
                missing_claims = [claim for claim in required_claims if claim not in payload]
                if missing_claims:
                    raise ValueError(f"Missing required claims: {missing_claims}")

            return payload

        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError as e:
            raise ValueError(f"Invalid token: {e}")

    def create_refresh_token(self, user_id: str) -> str:
        """Create long-lived refresh token"""

        payload = {
            "sub": user_id,
            "type": "refresh",
            "scope": "refresh_access"
        }

        return self.create_token(payload, expires_in=30*24*3600)  # 30 days

    def refresh_access_token(self, refresh_token: str, new_payload: Dict[str, Any]) -> str:
        """Create new access token from refresh token"""

        # Verify refresh token
        refresh_payload = self.verify_token(refresh_token, required_claims=["sub", "type"])

        if refresh_payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token type")

        # Create new access token
        access_payload = {
            **new_payload,
            "sub": refresh_payload["sub"],
            "type": "access"
        }

        return self.create_token(access_payload, expires_in=3600)  # 1 hour

# Two-Factor Authentication Implementation
import pyotp
import qrcode
from io import BytesIO
import base32

class TwoFactorAuth:
    """TOTP-based Two-Factor Authentication"""

    def __init__(self, issuer: str = "SecureApp"):
        self.issuer = issuer

    def generate_secret(self) -> str:
        """Generate base32 secret for TOTP"""
        return pyotp.random_base32()

    def get_totp_uri(self, secret: str, user_email: str) -> str:
        """Generate TOTP URI for QR code"""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(
            name=user_email,
            issuer_name=self.issuer
        )

    def generate_qr_code(self, uri: str) -> bytes:
        """Generate QR code image for TOTP setup"""
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(uri)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to bytes
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        return buffer.getvalue()

    def verify_totp(self, secret: str, token: str, window: int = 1) -> bool:
        """Verify TOTP token with time window"""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=window)

    def get_backup_codes(self, count: int = 10) -> List[str]:
        """Generate backup codes for 2FA"""
        codes = []
        crypto = ModernCrypto()

        for _ in range(count):
            # Generate 8-character backup code
            code = crypto.generate_secure_token(6).replace('-', '').replace('_', '')[:8].upper()
            codes.append(code)

        return codes

# Secure File Encryption
class SecureFileEncryption:
    """File encryption with hybrid cryptography"""

    def __init__(self):
        self.crypto = ModernCrypto()

    def encrypt_file(self, file_path: str, public_key_pem: bytes,
                    output_path: Optional[str] = None) -> str:
        """Encrypt file using hybrid encryption (AES + RSA)"""

        if output_path is None:
            output_path = file_path + ".encrypted"

        # Generate random AES key
        aes_key = self.crypto.generate_secure_bytes(32)

        # Read and encrypt file content
        with open(file_path, 'rb') as f:
            plaintext = f.read()

        # Encrypt content with AES-GCM
        encrypted_content = self.crypto.encrypt_aes_gcm(plaintext, aes_key)

        # Encrypt AES key with RSA
        encrypted_key = self.crypto.rsa_encrypt(aes_key, public_key_pem)

        # Create file structure
        file_data = {
            "version": "1.0",
            "algorithm": "AES-256-GCM + RSA-OAEP",
            "encrypted_key": base64.b64encode(encrypted_key).decode(),
            "nonce": base64.b64encode(encrypted_content.nonce).decode(),
            "tag": base64.b64encode(encrypted_content.tag).decode(),
            "ciphertext": base64.b64encode(encrypted_content.ciphertext).decode(),
            "timestamp": datetime.utcnow().isoformat()
        }

        # Write encrypted file
        with open(output_path, 'w') as f:
            json.dump(file_data, f, indent=2)

        return output_path

    def decrypt_file(self, encrypted_file_path: str, private_key_pem: bytes,
                    output_path: Optional[str] = None) -> str:
        """Decrypt file using hybrid decryption"""

        if output_path is None:
            output_path = encrypted_file_path.replace(".encrypted", "")

        # Read encrypted file
        with open(encrypted_file_path, 'r') as f:
            file_data = json.load(f)

        # Extract components
        encrypted_key = base64.b64decode(file_data["encrypted_key"])
        nonce = base64.b64decode(file_data["nonce"])
        tag = base64.b64decode(file_data["tag"])
        ciphertext = base64.b64decode(file_data["ciphertext"])

        # Decrypt AES key with RSA
        aes_key = self.crypto.rsa_decrypt(encrypted_key, private_key_pem)

        # Decrypt content with AES-GCM
        encryption_result = EncryptionResult(
            ciphertext=ciphertext,
            nonce=nonce,
            tag=tag
        )

        plaintext = self.crypto.decrypt_aes_gcm(encryption_result, aes_key)

        # Write decrypted file
        with open(output_path, 'wb') as f:
            f.write(plaintext)

        return output_path

# Example usage and testing
def main():
    """Demonstrate cryptographic operations"""

    crypto = ModernCrypto()

    # Symmetric encryption demo
    print("=== Symmetric Encryption Demo ===")
    message = b"This is a secret message that needs protection!"
    key = crypto.generate_secure_bytes(32)

    # AES-256-GCM encryption
    encrypted = crypto.encrypt_aes_gcm(message, key, b"additional_data")
    decrypted = crypto.decrypt_aes_gcm(encrypted, key, b"additional_data")

    print(f"Original: {message}")
    print(f"Encrypted (length): {len(encrypted.ciphertext)} bytes")
    print(f"Decrypted: {decrypted}")
    print(f"Match: {message == decrypted}")

    # Asymmetric encryption demo
    print("\n=== Asymmetric Encryption Demo ===")
    rsa_keypair = crypto.generate_rsa_keypair(2048)

    small_message = b"Small secret for RSA"
    rsa_encrypted = crypto.rsa_encrypt(small_message, rsa_keypair.public_key)
    rsa_decrypted = crypto.rsa_decrypt(rsa_encrypted, rsa_keypair.private_key)

    print(f"RSA Original: {small_message}")
    print(f"RSA Decrypted: {rsa_decrypted}")
    print(f"RSA Match: {small_message == rsa_decrypted}")

    # Digital signature demo
    print("\n=== Digital Signature Demo ===")
    ed25519_keypair = crypto.generate_ed25519_keypair()

    signature_message = b"Important document requiring signature"
    signature = crypto.sign_ed25519(signature_message, ed25519_keypair.private_key)
    is_valid = crypto.verify_ed25519(signature_message, signature, ed25519_keypair.public_key)

    print(f"Message: {signature_message}")
    print(f"Signature valid: {is_valid}")

    # Password hashing demo
    print("\n=== Password Hashing Demo ===")
    password = "MySecurePassword123!"
    hashed = crypto.hash_password_argon2(password)
    is_valid_password = crypto.verify_password_argon2(password, hashed)

    print(f"Password: {password}")
    print(f"Hash: {hashed[:50]}...")
    print(f"Verification: {is_valid_password}")

    # JWT demo
    print("\n=== JWT Token Demo ===")
    jwt_secret = crypto.generate_secure_bytes(32)
    jwt_handler = SecureJWT(jwt_secret)

    payload = {"user_id": "123", "role": "admin", "scope": "read write"}
    token = jwt_handler.create_token(payload)
    decoded = jwt_handler.verify_token(token, required_claims=["user_id", "role"])

    print(f"JWT Payload: {payload}")
    print(f"JWT Token: {token[:50]}...")
    print(f"Decoded: {decoded}")

    # TOTP demo
    print("\n=== TOTP Two-Factor Auth Demo ===")
    totp_auth = TwoFactorAuth("MySecureApp")
    secret = totp_auth.generate_secret()
    uri = totp_auth.get_totp_uri(secret, "user@example.com")

    print(f"TOTP Secret: {secret}")
    print(f"TOTP URI: {uri}")

    # Generate current TOTP token for testing
    import pyotp
    totp = pyotp.TOTP(secret)
    current_token = totp.now()
    is_valid_totp = totp_auth.verify_totp(secret, current_token)

    print(f"Current TOTP: {current_token}")
    print(f"TOTP Valid: {is_valid_totp}")

if __name__ == "__main__":
    main()
```

## Skill Activation Triggers

This skill automatically activates when:
- Cryptographic implementation is needed
- Security protocol design is required
- Authentication system development is requested
- Secure communication setup is needed
- Compliance with security standards is required
- Data protection and encryption are requested

This comprehensive cryptography and security skill provides expert-level capabilities for implementing modern security systems using cutting-edge cryptographic techniques and industry best practices.
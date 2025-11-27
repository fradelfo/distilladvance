/**
 * Password hashing and verification utilities using Web Crypto API.
 * Uses PBKDF2 with SHA-256 and a random salt for secure password storage.
 */

/**
 * Hash a password using PBKDF2 with a random salt.
 * Returns a base64-encoded string containing salt + hash.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Generate a random salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  // Combine salt and hash for storage
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);

  // Return as base64
  return Buffer.from(combined).toString('base64');
}

/**
 * Verify a password against a stored hash.
 * Performs constant-time comparison to prevent timing attacks.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Decode stored hash
  const combined = Buffer.from(storedHash, 'base64');
  const salt = combined.subarray(0, 16);
  const storedHashBytes = combined.subarray(16);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key using same parameters
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(derivedBits);

  // Constant-time comparison to prevent timing attacks
  if (hashArray.length !== storedHashBytes.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < hashArray.length; i++) {
    result |= hashArray[i] ^ storedHashBytes[i];
  }

  return result === 0;
}

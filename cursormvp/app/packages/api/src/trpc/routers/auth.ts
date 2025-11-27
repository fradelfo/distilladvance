import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../index.js";

// Password hashing using Web Crypto API (available in Node.js 20+)
// For production, consider using bcrypt or argon2
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    data,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
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
  return Buffer.from(combined).toString("base64");
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Decode stored hash
  const combined = Buffer.from(storedHash, "base64");
  const salt = combined.subarray(0, 16);
  const storedHashBytes = combined.subarray(16);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    data,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  // Derive key using same parameters
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(derivedBits);

  // Constant-time comparison
  if (hashArray.length !== storedHashBytes.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < hashArray.length; i++) {
    result |= hashArray[i] ^ storedHashBytes[i];
  }

  return result === 0;
}

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long").optional(),
});

const verifyCredentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Auth router for authentication-related operations.
 */
export const authRouter = router({
  /**
   * Register a new user with email and password.
   */
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const { email, password, name } = input;

      // Check if user already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create the user
      const user = await ctx.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name: name || null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      return {
        success: true,
        user,
      };
    }),

  /**
   * Verify user credentials (used by NextAuth).
   * Returns user data if credentials are valid, null otherwise.
   */
  verifyCredentials: publicProcedure
    .input(verifyCredentialsSchema)
    .mutation(async ({ ctx, input }) => {
      const { email, password } = input;

      // Find user by email
      const user = await ctx.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          password: true,
        },
      });

      // User not found or no password set (OAuth-only account)
      if (!user || !user.password) {
        return null;
      }

      // Verify password
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return null;
      }

      // Return user without password
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    }),
});

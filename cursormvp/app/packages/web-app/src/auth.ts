import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';

// Validation schema for credentials
const credentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Google OAuth Provider
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    // Email/Password Credentials Provider
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate input
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
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

          // Return user data (without password)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],

  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    newUser: '/onboarding',
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      // Store provider info
      if (account) {
        token.provider = account.provider;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | null;
      }
      return session;
    },

    async signIn({ user, account }) {
      // Allow OAuth sign in
      if (account?.provider === 'google') {
        // TODO: Create or update user in database
        // await prisma.user.upsert({
        //   where: { email: user.email },
        //   create: { email: user.email, name: user.name, image: user.image },
        //   update: { name: user.name, image: user.image },
        // });
        return true;
      }

      // Allow credentials sign in
      if (account?.provider === 'credentials') {
        return !!user;
      }

      return false;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  secret: process.env.AUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
});

// Type augmentation for session
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image: string | null;
    };
  }
}

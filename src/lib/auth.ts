import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    // Keep all non-credentials providers from config
    ...authConfig.providers.filter(
      (p) =>
        (p as { id?: string }).id !== "credentials" &&
        (p as { name?: string }).name !== "Credentials"
    ),
    // Override credentials with real DB implementation
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        // If user has a password, verify it
        if (user.password) {
          if (!password) return null;
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return null;
        } else {
          // User registered without password (OAuth-only) – deny credentials login
          return null;
        }

        // Block sign-in if email is not verified (credentials users only)
        if (!user.emailVerified) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      // Enrich token with role from DB
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, tokenInvalidBefore: true },
        });
        if (dbUser) {
          token.role = dbUser.role;

          // Check if token was issued before invalidation date
          if (dbUser.tokenInvalidBefore && token.iat) {
            const issuedAt = new Date((token.iat as number) * 1000);
            if (issuedAt < dbUser.tokenInvalidBefore) {
              // Token is invalidated – force re-login
              return { ...token, invalidated: true };
            }
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.invalidated) {
        // Return empty session to force sign out
        return { ...session, user: undefined as unknown as typeof session.user };
      }
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as typeof session.user.role;
      }
      return session;
    },
  },
});

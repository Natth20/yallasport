// src/lib/auth/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as never),
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      // Prefer Auth.js names; fall back to legacy GOOGLE_CLIENT_* for existing .env setups.
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Add credentials or other providers as needed
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.subscriptionStatus = user.subscriptionStatus;
      }
      return session;
    },
  },
});

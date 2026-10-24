// src/lib/auth/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const SUPER_ADMIN_EMAILS = new Set(
  [
    "mataridais@gmail.com",
    process.env.ADMIN_EMAIL,
    process.env.SUPER_ADMIN_EMAIL,
  ]
    .filter(Boolean)
    .map((e) => (e as string).toLowerCase().trim())
);

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
      allowDangerousEmailAccountLinking: true,
    }),
    // Add credentials or other providers as needed
  ],
  events: {
    async createUser({ user }) {
      if (user.email && SUPER_ADMIN_EMAILS.has(user.email.toLowerCase().trim())) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "SUPER_ADMIN" },
          });
        } catch (err) {
          console.error("Failed to set SUPER_ADMIN role on createUser:", err);
        }
      }
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const isSuperAdminEmail =
          !!session.user.email &&
          SUPER_ADMIN_EMAILS.has(session.user.email.toLowerCase().trim());
        const role = isSuperAdminEmail ? "SUPER_ADMIN" : user.role;
        session.user.role = role;
        session.user.subscriptionStatus = user.subscriptionStatus;

        // Auto-heal / sync role in database if needed
        if (isSuperAdminEmail && user.role !== "SUPER_ADMIN") {
          prisma.user
            .update({
              where: { id: user.id },
              data: { role: "SUPER_ADMIN" },
            })
            .catch((err) => {
              console.error("Failed to sync SUPER_ADMIN role:", err);
            });
        }
      }
      return session;
    },
  },
});


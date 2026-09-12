import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      subscriptionStatus: string;
    } & DefaultSession["user"]
  }

  interface User {
    role: string;
    subscriptionStatus: string;
  }
}

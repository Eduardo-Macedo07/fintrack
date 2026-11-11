import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authenticate } from "@/features/auth/server/authenticate";
import { prisma } from "@/server/db";

import { authConfig } from "./auth.config";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: (credentials) => authenticate(prisma, credentials),
    }),
  ],
});

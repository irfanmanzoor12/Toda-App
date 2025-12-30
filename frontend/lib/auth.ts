"""Better Auth server configuration.

Task: T209 - Minimal Better Auth setup for Next.js routing.
"""

import { betterAuth } from "better-auth";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

/**
 * Better Auth server configuration.
 *
 * Task: T209 - Better Auth setup with email/password authentication.
 */

import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

const db = new Database("./better-auth.db");

export const auth = betterAuth({
  database: db,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

"""Better Auth API routes.

Task: T209 - Better Auth API route handler.
"""

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
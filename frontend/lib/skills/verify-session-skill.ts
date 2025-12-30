/**
 * VerifySessionSkill - Verifies authentication session validity
 *
 * Responsibilities:
 * 1. Check Better Auth session exists and is valid
 * 2. Check backend JWT exists
 * 3. Optionally verify JWT with backend
 */

import { BaseAuthSkill, AuthResult } from './base-auth-skill';

interface Session {
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
}

interface VerificationResult {
  isAuthenticated: boolean;
  hasSession: boolean;
  hasJwt: boolean;
}

export class VerifySessionSkill extends BaseAuthSkill {
  /**
   * Execute session verification
   *
   * @param session - Better Auth session object
   * @returns AuthResult with verification details
   */
  async execute(session: Session | null): Promise<AuthResult<VerificationResult>> {
    try {
      const hasSession = !!(session && session.user);
      const jwt = this.getJwt();
      const hasJwt = !!jwt;

      // User is considered authenticated if both session and JWT exist
      const isAuthenticated = hasSession && hasJwt;

      return {
        success: true,
        data: {
          isAuthenticated,
          hasSession,
          hasJwt,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Session verification failed',
        data: {
          isAuthenticated: false,
          hasSession: false,
          hasJwt: false,
        },
      };
    }
  }

  /**
   * Get stored JWT token
   */
  getStoredJwt(): string | null {
    return this.getJwt();
  }
}

/**
 * GetCurrentUserSkill - Retrieves current authenticated user
 *
 * Responsibilities:
 * 1. Get user from Better Auth session (frontend)
 * 2. Optionally fetch user details from backend API
 */

import { BaseAuthSkill, AuthResult } from './base-auth-skill';

interface BetterAuthUser {
  id: string;
  email: string;
  name: string;
}

interface BackendUser {
  id: number;
  email: string;
  created_at: string;
}

interface Session {
  user: BetterAuthUser | null;
}

export class GetCurrentUserSkill extends BaseAuthSkill {
  /**
   * Get current user from Better Auth session
   *
   * @param session - Better Auth session object
   * @returns AuthResult with user data
   */
  async execute(session: Session | null): Promise<AuthResult<BetterAuthUser>> {
    try {
      if (!session || !session.user) {
        return {
          success: false,
          error: 'No active session',
        };
      }

      return {
        success: true,
        data: session.user,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get current user',
      };
    }
  }

  /**
   * Fetch user details from backend API
   * Requires valid JWT token
   */
  async fetchBackendUser(): Promise<AuthResult<BackendUser>> {
    try {
      const jwt = this.getJwt();
      if (!jwt) {
        return {
          success: false,
          error: 'No JWT token available',
        };
      }

      const user = await this.callBackendApi<BackendUser>('/api/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      return {
        success: true,
        data: user,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch backend user',
      };
    }
  }
}

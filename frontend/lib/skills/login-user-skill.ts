/**
 * LoginUserSkill - Handles user login flow
 *
 * Responsibilities:
 * 1. Authenticate with Better Auth (create frontend session)
 * 2. Authenticate with backend API (validate credentials)
 * 3. Obtain and store backend JWT token
 */

import { signIn } from '../auth-client';
import { BaseAuthSkill, AuthResult } from './base-auth-skill';

interface BackendAuthResponse {
  access_token: string;
  token_type: string;
}

export class LoginUserSkill extends BaseAuthSkill {
  /**
   * Execute the login flow
   *
   * @param email - User email address
   * @param password - User password
   * @returns AuthResult indicating success or failure
   */
  async execute(email: string, password: string): Promise<AuthResult> {
    try {
      // Step 1: Authenticate with Better Auth (creates frontend session)
      const betterAuthResult = await signIn.email({
        email,
        password,
      });

      if (betterAuthResult.error) {
        return {
          success: false,
          error: betterAuthResult.error.message || 'Authentication failed',
        };
      }

      // Step 2: Authenticate with backend to get JWT
      let jwt: string;
      try {
        jwt = await this.authenticateBackend(email, password);
      } catch (backendError: any) {
        // If backend auth fails, clear Better Auth session
        // Note: We don't await this to avoid circular dependency
        return {
          success: false,
          error: backendError.message || 'Backend authentication failed',
        };
      }

      // Step 3: Store JWT for API calls
      this.storeJwt(jwt);

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  }

  /**
   * Authenticate with backend and obtain JWT token
   */
  private async authenticateBackend(email: string, password: string): Promise<string> {
    const response = await this.callBackendApi<BackendAuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.access_token;
  }
}

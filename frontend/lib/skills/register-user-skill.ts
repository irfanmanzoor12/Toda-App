/**
 * RegisterUserSkill - Handles user registration flow
 *
 * Responsibilities:
 * 1. Register user with Better Auth (frontend session)
 * 2. Register user with backend API (backend database)
 * 3. Obtain backend JWT token
 * 4. Store JWT for subsequent API calls
 */

import { signUp } from '../auth-client';
import { BaseAuthSkill, AuthResult } from './base-auth-skill';

interface BackendUser {
  id: number;
  email: string;
  created_at: string;
}

interface BackendAuthResponse {
  access_token: string;
  token_type: string;
}

export class RegisterUserSkill extends BaseAuthSkill {
  /**
   * Execute the registration flow
   *
   * @param email - User email address
   * @param password - User password (min 8 characters)
   * @returns AuthResult with user data or error
   */
  async execute(email: string, password: string): Promise<AuthResult<BackendUser>> {
    try {
      // Step 1: Register with Better Auth (for frontend session management)
      const betterAuthResult = await signUp.email({
        email,
        password,
        name: email.split('@')[0], // Use email prefix as name
      });

      if (betterAuthResult.error) {
        return {
          success: false,
          error: betterAuthResult.error.message || 'Better Auth registration failed',
        };
      }

      // Step 2: Register with backend API (to create user in backend DB)
      let backendUser: BackendUser;
      try {
        backendUser = await this.registerBackendUser(email, password);
      } catch (backendError: any) {
        // If backend registration fails, we should ideally rollback Better Auth registration
        // For now, we'll just report the error
        return {
          success: false,
          error: backendError.message || 'Backend registration failed',
        };
      }

      // Step 3: Login to backend to get JWT
      let jwt: string;
      try {
        jwt = await this.obtainBackendJwt(email, password);
      } catch (jwtError: any) {
        return {
          success: false,
          error: jwtError.message || 'Failed to obtain JWT token',
        };
      }

      // Step 4: Store JWT for API calls
      this.storeJwt(jwt);

      return {
        success: true,
        data: backendUser,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    }
  }

  /**
   * Register user in backend database
   */
  private async registerBackendUser(email: string, password: string): Promise<BackendUser> {
    return this.callBackendApi<BackendUser>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Login to backend to obtain JWT token
   */
  private async obtainBackendJwt(email: string, password: string): Promise<string> {
    const response = await this.callBackendApi<BackendAuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.access_token;
  }
}

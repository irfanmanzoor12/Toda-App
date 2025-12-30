/**
 * LogoutUserSkill - Handles user logout flow
 *
 * Responsibilities:
 * 1. Clear Better Auth session
 * 2. Clear backend JWT token
 * 3. Clear any cached auth state
 */

import { signOut } from '../auth-client';
import { BaseAuthSkill, AuthResult } from './base-auth-skill';

export class LogoutUserSkill extends BaseAuthSkill {
  /**
   * Execute the logout flow
   *
   * @returns AuthResult indicating success or failure
   */
  async execute(): Promise<AuthResult> {
    try {
      // Step 1: Clear Better Auth session
      await signOut();

      // Step 2: Clear backend JWT and any legacy tokens
      this.clearJwt();

      return {
        success: true,
      };
    } catch (error: any) {
      // Even if signOut fails, we should clear local tokens
      this.clearJwt();

      return {
        success: false,
        error: error.message || 'Logout failed',
      };
    }
  }
}

/**
 * Authentication Skills
 *
 * Reusable backend skills for auth operations.
 * Each skill encapsulates a specific auth flow with Better Auth + Backend JWT integration.
 */

export { BaseAuthSkill, BACKEND_JWT_KEY } from './base-auth-skill';
export type { AuthResult } from './base-auth-skill';

export { RegisterUserSkill } from './register-user-skill';
export { LoginUserSkill } from './login-user-skill';
export { LogoutUserSkill } from './logout-user-skill';
export { VerifySessionSkill } from './verify-session-skill';
export { GetCurrentUserSkill } from './get-current-user-skill';

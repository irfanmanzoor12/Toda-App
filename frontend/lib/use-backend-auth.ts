'use client';

import { useEffect, useState } from 'react';
import { useSession } from './auth-client';
import {
  RegisterUserSkill,
  LoginUserSkill,
  LogoutUserSkill,
  VerifySessionSkill,
  BACKEND_JWT_KEY,
} from './skills';

/**
 * Custom hook that combines Better Auth session management
 * with backend JWT for API calls.
 *
 * This provides:
 * - Stable session state from Better Auth (no render loops)
 * - Backend JWT for API authorization
 * - Clean separation via skills architecture
 */
export function useBackendAuth() {
  const { data: session, isPending, error } = useSession();
  const [backendJwt, setBackendJwt] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize skills (can be reused across calls)
  const [registerSkill] = useState(() => new RegisterUserSkill());
  const [loginSkill] = useState(() => new LoginUserSkill());
  const [logoutSkill] = useState(() => new LogoutUserSkill());
  const [verifySkill] = useState(() => new VerifySessionSkill());

  // Hydrate backend JWT from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(BACKEND_JWT_KEY);
      if (stored) {
        setBackendJwt(stored);
      }
      setIsHydrated(true);
    }
  }, []);

  // Register: Create user in both Better Auth and Backend
  const register = async (email: string, password: string) => {
    const result = await registerSkill.execute(email, password);

    if (!result.success) {
      throw new Error(result.error || 'Registration failed');
    }

    // Update local JWT state
    const jwt = verifySkill.getStoredJwt();
    if (jwt) {
      setBackendJwt(jwt);
    }

    return { success: true, user: result.data };
  };

  // Login: Authenticate with both Better Auth and Backend
  const login = async (email: string, password: string) => {
    const result = await loginSkill.execute(email, password);

    if (!result.success) {
      throw new Error(result.error || 'Login failed');
    }

    // Update local JWT state
    const jwt = verifySkill.getStoredJwt();
    if (jwt) {
      setBackendJwt(jwt);
    }

    return { success: true };
  };

  // Logout: Clear both Better Auth session and backend JWT
  const logout = async () => {
    await logoutSkill.execute();
    setBackendJwt(null);
  };

  // Get current backend JWT for API calls
  const getBackendJwt = (): string | null => {
    return backendJwt;
  };

  // User is authenticated if Better Auth session exists
  // backendJwt is optional - Better Auth JWT is in cookies
  const isAuthenticated = !!session?.user;
  const loading = isPending || !isHydrated;

  return {
    // Session data from Better Auth
    user: session?.user || null,
    session,

    // Backend JWT for API calls
    backendJwt,
    getBackendJwt,

    // Combined auth state
    isAuthenticated,
    loading,

    // Auth actions
    login,
    register,
    logout,

    // Error state
    error,
  };
}

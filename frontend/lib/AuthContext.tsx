'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from 'react';
import {
  AuthState,
  User,
  login as authLogin,
  logout as authLogout,
  initializeAuth,
  isAuthenticated,
  getUser,
  refreshAccessToken,
  activityTracker,
} from './auth';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    isLoading: true,
    error: null,
  });

  // Initialize auth state from storage on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        const authState = initializeAuth();
        setState({
          ...authState,
          isLoading: false,
        });
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Failed to initialize authentication',
        }));
      }
    };

    initAuth();
  }, []);

  // Handle login
  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { user, tokens } = await authLogin(email, password);
      setState({
        isAuthenticated: true,
        user,
        accessToken: tokens.accessToken,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  // Handle logout
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await authLogout();
    } finally {
      setState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  // Refresh authentication
  const refreshAuth = useCallback(async () => {
    try {
      const tokens = await refreshAccessToken();
      if (tokens) {
        const user = getUser();
        setState({
          isAuthenticated: true,
          user,
          accessToken: tokens.accessToken,
          isLoading: false,
          error: null,
        });
      } else {
        // Refresh failed, user needs to re-login
        setState({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      setState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  // Set up session timeout handler
  useEffect(() => {
    if (state.isAuthenticated) {
      activityTracker.start(() => {
        logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login?reason=timeout';
        }
      });
    }

    return () => {
      activityTracker.stop();
    };
  }, [state.isAuthenticated, logout]);

  // Memoize context value
  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      refreshAuth,
    }),
    [state, login, logout, refreshAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Higher-order component to require authentication
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        window.location.href = '/login?reason=required';
      }
    }, [isAuthenticated, isLoading]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * Hook to require specific trust level
 */
export function useRequireTrustLevel(minLevel: number): {
  hasAccess: boolean;
  isLoading: boolean;
} {
  const { user, isLoading, isAuthenticated } = useAuth();

  const hasAccess = isAuthenticated && user !== null && user.trustLevel >= minLevel;

  return { hasAccess, isLoading };
}

/**
 * SHADOWGLASS Authentication Module
 * Secure token management with proper lifecycle handling
 */

// Token storage keys
const TOKEN_KEY = 'shadowglass_access_token';
const REFRESH_TOKEN_KEY = 'shadowglass_refresh_token';
const TOKEN_EXPIRY_KEY = 'shadowglass_token_expiry';
const USER_KEY = 'shadowglass_user';
const SESSION_TIMEOUT_KEY = 'shadowglass_session_timeout';

// Default session timeout: 30 minutes of inactivity
const DEFAULT_SESSION_TIMEOUT_MS = 30 * 60 * 1000;
// Token refresh threshold: refresh when less than 5 minutes remaining
const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

export interface User {
  id: string;
  email: string;
  name: string;
  trustLevel: number;
  role: 'admin' | 'analyst' | 'viewer';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until expiry
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Secure storage wrapper with encryption support
 */
class SecureStorage {
  private static encode(data: string): string {
    if (!isBrowser) return data;
    // Basic base64 encoding for storage obfuscation
    // In production, use Web Crypto API for actual encryption
    return btoa(data);
  }

  private static decode(data: string): string {
    if (!isBrowser) return data;
    try {
      return atob(data);
    } catch {
      return data;
    }
  }

  static setItem(key: string, value: string): void {
    if (!isBrowser) return;
    try {
      sessionStorage.setItem(key, this.encode(value));
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
    }
  }

  static getItem(key: string): string | null {
    if (!isBrowser) return null;
    try {
      const value = sessionStorage.getItem(key);
      return value ? this.decode(value) : null;
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    if (!isBrowser) return;
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('SecureStorage removeItem error:', error);
    }
  }

  static clear(): void {
    if (!isBrowser) return;
    try {
      // Only clear shadowglass-related items
      const keysToRemove = [
        TOKEN_KEY,
        REFRESH_TOKEN_KEY,
        TOKEN_EXPIRY_KEY,
        USER_KEY,
        SESSION_TIMEOUT_KEY,
      ];
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.error('SecureStorage clear error:', error);
    }
  }
}

/**
 * Activity tracker for session timeout
 */
class ActivityTracker {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private onTimeout: (() => void) | null = null;

  start(onTimeout: () => void, timeoutMs: number = DEFAULT_SESSION_TIMEOUT_MS): void {
    if (!isBrowser) return;

    this.onTimeout = onTimeout;
    this.resetTimer(timeoutMs);

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, () => this.resetTimer(timeoutMs), { passive: true });
    });
  }

  private resetTimer(timeoutMs: number): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    SecureStorage.setItem(SESSION_TIMEOUT_KEY, String(Date.now() + timeoutMs));

    this.timeoutId = setTimeout(() => {
      if (this.onTimeout) {
        this.onTimeout();
      }
    }, timeoutMs);
  }

  stop(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  isSessionValid(): boolean {
    const expiry = SecureStorage.getItem(SESSION_TIMEOUT_KEY);
    if (!expiry) return false;
    return Date.now() < parseInt(expiry, 10);
  }
}

export const activityTracker = new ActivityTracker();

/**
 * Token management functions
 */
export function setTokens(tokens: AuthTokens): void {
  const expiryTime = Date.now() + tokens.expiresIn * 1000;
  SecureStorage.setItem(TOKEN_KEY, tokens.accessToken);
  SecureStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  SecureStorage.setItem(TOKEN_EXPIRY_KEY, String(expiryTime));
}

export function getAccessToken(): string | null {
  return SecureStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return SecureStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getTokenExpiry(): number | null {
  const expiry = SecureStorage.getItem(TOKEN_EXPIRY_KEY);
  return expiry ? parseInt(expiry, 10) : null;
}

export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return Date.now() >= expiry;
}

export function shouldRefreshToken(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return Date.now() >= expiry - TOKEN_REFRESH_THRESHOLD_MS;
}

export function setUser(user: User): void {
  SecureStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): User | null {
  const userData = SecureStorage.getItem(USER_KEY);
  if (!userData) return null;
  try {
    return JSON.parse(userData) as User;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  SecureStorage.clear();
  activityTracker.stop();
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  const user = getUser();
  return !!token && !!user && !isTokenExpired();
}

/**
 * Login with credentials
 */
export async function login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || error.detail || 'Login failed');
  }

  const data = await response.json();

  const user: User = {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
    trustLevel: data.user.trust_level || data.user.trustLevel,
    role: data.user.role,
  };

  const tokens: AuthTokens = {
    accessToken: data.access_token || data.accessToken,
    refreshToken: data.refresh_token || data.refreshToken,
    expiresIn: data.expires_in || data.expiresIn || 3600,
  };

  setTokens(tokens);
  setUser(user);

  // Start session timeout tracking
  activityTracker.start(() => {
    logout();
    if (isBrowser) {
      window.location.href = '/login?reason=timeout';
    }
  });

  return { user, tokens };
}

/**
 * Logout and clear all auth data
 */
export async function logout(): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  const token = getAccessToken();

  // Clear local auth data first
  clearAuth();

  // Notify server (best effort)
  if (token) {
    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
    } catch {
      // Ignore server logout errors - local state is already cleared
    }
  }
}

/**
 * Refresh the access token
 */
export async function refreshAccessToken(): Promise<AuthTokens | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

  try {
    const response = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: 'include',
    });

    if (!response.ok) {
      // Refresh failed - user needs to re-authenticate
      clearAuth();
      return null;
    }

    const data = await response.json();

    const tokens: AuthTokens = {
      accessToken: data.access_token || data.accessToken,
      refreshToken: data.refresh_token || data.refreshToken || refreshToken,
      expiresIn: data.expires_in || data.expiresIn || 3600,
    };

    setTokens(tokens);
    return tokens;
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearAuth();
    return null;
  }
}

/**
 * Get valid access token (refreshing if needed)
 */
export async function getValidAccessToken(): Promise<string | null> {
  if (!isAuthenticated()) {
    return null;
  }

  if (shouldRefreshToken()) {
    const tokens = await refreshAccessToken();
    return tokens?.accessToken || null;
  }

  return getAccessToken();
}

/**
 * Initialize auth state from storage
 */
export function initializeAuth(): AuthState {
  const accessToken = getAccessToken();
  const user = getUser();
  const authenticated = !!accessToken && !!user && !isTokenExpired();

  if (authenticated) {
    // Resume activity tracking
    activityTracker.start(() => {
      logout();
      if (isBrowser) {
        window.location.href = '/login?reason=timeout';
      }
    });
  }

  return {
    isAuthenticated: authenticated,
    user,
    accessToken,
    isLoading: false,
    error: null,
  };
}

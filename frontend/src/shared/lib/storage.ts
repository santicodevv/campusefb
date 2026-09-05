// Token storage utilities
import Cookies from 'js-cookie';

const ACCESS_TOKEN_KEY = 'moddle_access_token';
const COOKIE_OPTIONS = {
  secure: import.meta.env.PROD,
  sameSite: 'strict' as const,
  expires: 7, // 7 days
};

export const storage = {
  // Access Token - stored in httpOnly cookie for security in production
  // For development, we use js-cookie for easier debugging
  getAccessToken(): string | null {
    return Cookies.get(ACCESS_TOKEN_KEY) || null;
  },

  setAccessToken(token: string): void {
    Cookies.set(ACCESS_TOKEN_KEY, token, COOKIE_OPTIONS);
  },

  removeAccessToken(): void {
    Cookies.remove(ACCESS_TOKEN_KEY);
  },

  // Clear all auth data
  clearAuth(): void {
    Cookies.remove(ACCESS_TOKEN_KEY);
  },

  // Check if user has a token (doesn't validate it)
  hasToken(): boolean {
    return !!this.getAccessToken();
  },
};

// Helper to decode JWT payload without verification
export function decodeToken<T = Record<string, unknown>>(token: string): T | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken<{ exp: number }>(token);
  if (!decoded || !decoded.exp) return true;

  // Add 10 second buffer
  return decoded.exp * 1000 < Date.now() + 10000;
}

// Auth API service
import { api } from '@/shared/lib';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RegisterResponse,
  RefreshTokenResponse,
  AuthUser,
} from '@/shared/types';

export const authApi = {
  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<AuthUser> {
    const response = await api.get<AuthUser>('/auth/me');
    return response.data;
  },

  /**
   * Update current user profile
   */
  async updateProfile(data: { displayName?: string; password?: string }): Promise<AuthUser> {
    const response = await api.patch<AuthUser>('/auth/me', data);
    return response.data;
  },

  /**
   * Refresh access token
   */
  async refresh(): Promise<RefreshTokenResponse> {
    const response = await api.post<RefreshTokenResponse>('/auth/refresh');
    return response.data;
  },

  /**
   * Logout (client-side only - clears tokens)
   */
  logout(): void {
    // The actual token invalidation happens via the storage clear
    // Backend doesn't maintain refresh tokens in this setup
  },

  /**
   * Change password
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await api.post('/auth/change-password', data);
  },
};

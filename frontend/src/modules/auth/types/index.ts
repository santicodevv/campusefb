// Auth request/response types

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterResponse {
  user: AuthUser;
  message: string;
}

export interface Role {
  id: number;
  code: RoleCode;
  description?: string;
}

export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  roles: Role[];
  isActive: boolean;
  moodleUserId?: number;
}

export interface RefreshTokenResponse {
  access_token: string;
}

// Role types
export type RoleCode = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface DecodedToken {
  sub: number;
  email: string;
  roles: RoleCode[];
  iat: number;
  exp: number;
}

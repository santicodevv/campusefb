// User types
import type { Role } from '@/modules/auth/types';

export interface User {
  username?: string;
  lastLoginAt?: string;
  id: number;
  email: string;
  displayName: string;
  isActive: boolean;
  moodleUserId?: number;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface MoodleUser {
  id: number;
  moodleId: number;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  userType: 'student' | 'teacher' | 'other';
  suspended: boolean;
  timemodified?: string;
  lastSyncedAt?: string;
}

// Request types
export interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  roleIds?: number[];
}

export interface UpdateUserRequest {
  email?: string;
  displayName?: string;
  isActive?: boolean;
  moodleUserId?: number;
}

export interface AssignRolesRequest {
  roleIds: number[];
}

// Query params
export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

// Response types
export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UserSearchResult {
  id: number;
  email: string;
  displayName: string | null;
  moodleUserId: number | null;
}

export interface TeacherUser {
  id: number;
  email: string;
  displayName?: string;
  roles?: { code: string }[];
}

export interface UsersResponseData {
  users: TeacherUser[];
  total: number;
}

export interface FlattenedCourse {
  courseMoodleId: number;
  courseName: string;
  courseShortname: string;
  totalGrade: number | null;
  comment: string | null;
  periodId: number | null;
  periodName: string;
  periodCode: string;
}

export interface FlattenedGrade {
  periodName: string;
  courseCode: string;
  courseName: string;
  grade: number | null;
  eq: string;
  isConvalidated: boolean;
  comments: string | null;
}

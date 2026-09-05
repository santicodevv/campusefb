// Users API service
import { api } from '@/shared/lib';
import type {
  User,
  Role,
  MoodleUser,
  CreateUserRequest,
  UpdateUserRequest,
  AssignRolesRequest,
  UsersQueryParams,
  PaginatedResponse,
  SuccessResponse,
} from '@/shared/types';

export const usersApi = {
  /**
   * Get paginated list of users
   */
  async getAll(params?: UsersQueryParams): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/users', { params });
    return response.data;
  },

  /**
   * Get user by ID
   */
  async getById(id: number): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Create a new user
   */
  async create(data: CreateUserRequest): Promise<User> {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  /**
   * Update user
   */
  async update(id: number, data: UpdateUserRequest): Promise<User> {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete user
   */
  async delete(id: number): Promise<SuccessResponse> {
    const response = await api.delete<SuccessResponse>(`/users/${id}`);
    return response.data;
  },

  /**
   * Assign roles to user
   */
  async assignRoles(userId: number, data: AssignRolesRequest): Promise<User> {
    const response = await api.post<User>(`/users/${userId}/roles`, data);
    return response.data;
  },

  /**
   * Link user to Moodle user
   */
  async linkToMoodle(userId: number, moodleUserId: number): Promise<User> {
    const response = await api.post<User>(`/users/${userId}/link-moodle`, {
      moodleUserId,
    });
    return response.data;
  },

  /**
   * Get all available roles
   */
  async getRoles(): Promise<Role[]> {
    const response = await api.get<Role[]>('/users/roles');
    return response.data;
  },

  /**
   * Get Moodle users (for linking)
   */
  async getMoodleUsers(params?: {
    search?: string;
    userType?: string;
  }): Promise<MoodleUser[]> {
    const response = await api.get<MoodleUser[]>('/moodle-users', { params });
    return response.data;
  },

  /**
   * Get all users with teacher role
   */
  async getTeachers(): Promise<{ id: number; email: string; displayName: string | null }[]> {
    const response = await api.get<{ id: number; email: string; displayName: string | null }[]>(
      '/users/teachers'
    );
    return response.data;
  },
};

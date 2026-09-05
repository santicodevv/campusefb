import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/axios';
import type { User, UsersResponse, CreateUserRequest, UpdateUserRequest } from '@/modules/admin/types/user.types';
import type { Role } from '@/modules/auth/types';
import toast from 'react-hot-toast';

export function useUsers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(20);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  
  const queryClient = useQueryClient();

  const isActiveParam =
    filterStatus === 'active' ? 'true' : filterStatus === 'inactive' ? 'false' : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, limit, search, filterStatus, filterRole],
    queryFn: async () => {
      const response = await api.get<UsersResponse>('/users', {
        params: {
          page,
          limit: limit === 0 ? 9999 : limit,
          search: search || undefined,
          isActive: isActiveParam,
          role: filterRole !== 'all' ? filterRole : undefined,
        },
      });
      return response.data;
    },
  });

  const { data: rolesData } = useQuery({
    queryKey: ['available-roles'],
    queryFn: async () => {
      const response = await api.get<Role[]>('/users/roles');
      return response.data;
    },
  });

  const updateUser = useMutation<User, Error, { id: number; data: UpdateUserRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await api.patch<User>(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuario actualizado exitosamente');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Error al actualizar usuario');
    },
  });

  const createUser = useMutation<User, Error, CreateUserRequest>({
    mutationFn: async (data) => {
      const response = await api.post<User>('/users/admin/create', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuario creado exitosamente');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Error al crear usuario');
    },
  });

  const resetFiltersAndPage = useCallback(() => setPage(1), []);

  return {
    search,
    setSearch,
    page,
    setPage,
    limit,
    setLimit,
    filterStatus,
    setFilterStatus,
    filterRole,
    setFilterRole,
    data,
    isLoading,
    rolesData,
    updateUser,
    createUser,
    resetFiltersAndPage,
  };
}

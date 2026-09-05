import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib';
import toast from 'react-hot-toast';
import type { User } from '@/modules/admin/types/user.types';

export interface EditAdminForm {
  displayName: string;
  email: string;
  password: string;
  isActive: boolean;
}

export function useEditarUsuario() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<EditAdminForm>({ displayName: '', email: '', password: '', isActive: true });
  const [confirmRemoveRole, setConfirmRemoveRole] = useState(false);

  // ── Fetch user ──
  const { data: adminUser, isLoading } = useQuery({
    queryKey: ['admin-user-detail', id],
    queryFn: async () => {
      const res = await api.get<User>(`/users/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const [prevUserId, setPrevUserId] = useState<number | null>(null);
  if (adminUser && adminUser.id !== prevUserId) {
    setPrevUserId(adminUser.id);
    setForm({
      displayName: adminUser.displayName || '',
      email: adminUser.email || '',
      password: '',
      isActive: adminUser.isActive,
    });
  }

  // ── Save changes ──
  const updateMutation = useMutation<User, Error, Partial<EditAdminForm>>({
    mutationFn: async (data) => {
      const res = await api.patch<User>(`/users/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] });
      toast.success('Administrador actualizado exitosamente');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Error al actualizar');
    },
  });

  // ── Quitar rol ADMIN ──
  const removeRoleMutation = useMutation<User, Error, void>({
    mutationFn: async () => {
      if (!adminUser) throw new Error('Administrador no encontrado');
      const newRoleIds = adminUser.roles.filter((r) => r.code !== 'ADMIN').map((r) => r.id);
      const res = await api.patch<User>(`/users/${id}`, { roleIds: newRoleIds });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Rol de Administrador removido.');
      navigate('/admin/settings/usuarios');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Error al remover el rol');
    },
  });

  const handleSave = () => {
    if (!adminUser) return;
    const changes: Partial<EditAdminForm> = {};
    if (form.displayName !== adminUser.displayName) changes.displayName = form.displayName;
    if (form.email !== adminUser.email) changes.email = form.email;
    if (form.password) changes.password = form.password;
    if (form.isActive !== adminUser.isActive) changes.isActive = form.isActive;
    
    if (Object.keys(changes).length === 0) { 
      toast('No hay cambios para guardar', { icon: 'ℹ️' }); 
      return; 
    }
    updateMutation.mutate(changes);
  };

  const isAdmin = adminUser?.roles.some((r) => r.code === 'ADMIN') || false;

  return {
    navigate,
    adminUser,
    isLoading,
    form,
    setForm,
    showPassword,
    setShowPassword,
    confirmRemoveRole,
    setConfirmRemoveRole,
    isAdmin,
    updateMutation,
    removeRoleMutation,
    handleSave,
  };
}

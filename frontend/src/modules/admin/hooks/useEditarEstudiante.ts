import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib';
import toast from 'react-hot-toast';
import type { User } from '@/modules/admin/types/user.types';

export interface EditStudentForm {
  displayName: string;
  email: string;
  password: string;
  isActive: boolean;
}

export function useEditarEstudiante() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<EditStudentForm>({ displayName: '', email: '', password: '', isActive: true });
  const [confirmRemoveRole, setConfirmRemoveRole] = useState(false);

  // ── Fetch user ──
  const { data: studentUser, isLoading } = useQuery({
    queryKey: ['student-detail', id],
    queryFn: async () => {
      const res = await api.get<User>(`/users/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const [prevUserId, setPrevUserId] = useState<number | null>(null);
  if (studentUser && studentUser.id !== prevUserId) {
    setPrevUserId(studentUser.id);
    setForm({
      displayName: studentUser.displayName || '',
      email: studentUser.email || '',
      password: '',
      isActive: studentUser.isActive,
    });
  }

  // ── Save changes ──
  const updateMutation = useMutation<User, Error, Partial<EditStudentForm>>({
    mutationFn: async (data) => {
      const res = await api.patch<User>(`/users/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['student-detail', id] });
      toast.success('Estudiante actualizado exitosamente');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Error al actualizar');
    },
  });

  // ── Quitar rol STUDENT ──
  const removeRoleMutation = useMutation<User, Error, void>({
    mutationFn: async () => {
      if (!studentUser) throw new Error('Estudiante no encontrado');
      const newRoleIds = studentUser.roles.filter((r) => r.code !== 'STUDENT').map((r) => r.id);
      const res = await api.patch<User>(`/users/${id}`, { roleIds: newRoleIds });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Rol de Estudiante removido.');
      navigate('/admin/settings/estudiantes');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Error al remover el rol');
    },
  });

  const handleSave = () => {
    if (!studentUser) return;
    const changes: Partial<EditStudentForm> = {};
    if (form.displayName !== studentUser.displayName) changes.displayName = form.displayName;
    if (form.email !== studentUser.email) changes.email = form.email;
    if (form.password) changes.password = form.password;
    if (form.isActive !== studentUser.isActive) changes.isActive = form.isActive;
    
    if (Object.keys(changes).length === 0) { 
      toast('No hay cambios para guardar', { icon: 'ℹ️' }); 
      return; 
    }
    updateMutation.mutate(changes);
  };

  const isStudent = studentUser?.roles.some((r) => r.code === 'STUDENT') || false;

  return {
    navigate,
    studentUser,
    isLoading,
    form,
    setForm,
    showPassword,
    setShowPassword,
    confirmRemoveRole,
    setConfirmRemoveRole,
    isStudent,
    updateMutation,
    removeRoleMutation,
    handleSave,
  };
}

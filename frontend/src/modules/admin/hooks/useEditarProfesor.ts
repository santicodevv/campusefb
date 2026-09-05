import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib';
import toast from 'react-hot-toast';
import type { User } from '@/modules/admin/types/user.types';

export interface EditForm {
  displayName: string;
  email: string;
  password: string;
  isActive: boolean;
}

export function useEditarProfesor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<EditForm>({ displayName: '', email: '', password: '', isActive: true });
  const [confirmRemoveRole, setConfirmRemoveRole] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── Fetch teacher ──
  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher-detail', id],
    queryFn: async () => {
      const res = await api.get<User>(`/users/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Populate form when teacher loads using render phase update instead of useEffect
  const [prevTeacherId, setPrevTeacherId] = useState<number | null>(null);
  if (teacher && teacher.id !== prevTeacherId) {
    setPrevTeacherId(teacher.id);
    setForm({
      displayName: teacher.displayName || '',
      email: teacher.email || '',
      password: '',
      isActive: teacher.isActive,
    });
  }

  // ── Save changes ──
  const updateMutation = useMutation<User, Error, Partial<EditForm>>({
    mutationFn: async (data) => {
      const res = await api.patch<User>(`/users/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-detail', id] });
      toast.success('Profesor actualizado exitosamente');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Error al actualizar');
    },
  });

  // ── Quitar rol TEACHER ──
  const removeRoleMutation = useMutation<User, Error, void>({
    mutationFn: async () => {
      if (!teacher) throw new Error('Profesor no encontrado');
      // Mantiene todos los roles excepto TEACHER
      const newRoleIds = teacher.roles.filter((r) => r.code !== 'TEACHER').map((r) => r.id);
      const res = await api.patch<User>(`/users/${id}`, { roleIds: newRoleIds });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-teachers'] });
      toast.success('Rol de Profesor removido. El usuario permanece en el sistema.');
      navigate('/admin/settings/profesores');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Error al remover el rol');
    },
  });

  // ── Desactivar usuario ──
  const deactivateMutation = useMutation<User, Error, void>({
    mutationFn: async () => {
      const res = await api.patch<User>(`/users/${id}`, { isActive: false });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-detail', id] });
      toast.success('Profesor desactivado');
      navigate('/admin/settings/profesores');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Error al desactivar');
    },
  });

  const handleSave = () => {
    if (!teacher) return;
    const changes: Partial<EditForm> = {};
    if (form.displayName !== teacher.displayName) changes.displayName = form.displayName;
    if (form.email !== teacher.email) changes.email = form.email;
    if (form.password) changes.password = form.password;
    if (form.isActive !== teacher.isActive) changes.isActive = form.isActive;
    if (Object.keys(changes).length === 0) { toast('No hay cambios para guardar'); return; }
    updateMutation.mutate(changes);
  };

  const isTeacher = teacher?.roles.some((r) => r.code === 'TEACHER') || false;

  return {
    navigate,
    teacher,
    isLoading,
    form,
    setForm,
    showPassword,
    setShowPassword,
    confirmRemoveRole,
    setConfirmRemoveRole,
    confirmDelete,
    setConfirmDelete,
    isTeacher,
    updateMutation,
    removeRoleMutation,
    deactivateMutation,
    handleSave,
  };
}

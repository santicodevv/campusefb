import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib';
import toast from 'react-hot-toast';

export interface CreateTeacherForm {
  displayName: string;
  email: string;
  password: string;
  isActive: boolean;
  syncToMoodle: boolean;
}

interface CreateTeacherResponse {
  moodleUserId?: number;
  [key: string]: unknown;
}

export function useNuevoProfesor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<CreateTeacherForm>({
    displayName: '',
    email: '',
    password: '',
    isActive: true,
    syncToMoodle: true,
  });

  const createTeacher = useMutation<CreateTeacherResponse, Error, CreateTeacherForm>({
    mutationFn: async (data) => {
      const res = await api.post<CreateTeacherResponse>('/users/admin/create-teacher', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings-teachers'] });
      const moodleMsg = data.moodleUserId
        ? ` · Moodle ID: ${data.moodleUserId}`
        : ' · Sin vincular a Moodle';
      toast.success(`Profesor creado exitosamente${moodleMsg}`);
      navigate('/admin/settings/profesores');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Error al crear el profesor');
    },
  });

  const handleSubmit = () => {
    if (!form.displayName.trim()) { toast.error('El nombre completo es requerido'); return; }
    if (!form.email.trim()) { toast.error('El email es requerido'); return; }
    if (!form.password || form.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres'); return;
    }
    createTeacher.mutate(form);
  };

  return {
    navigate,
    form,
    setForm,
    showPassword,
    setShowPassword,
    createTeacher,
    handleSubmit,
  };
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib';
import toast from 'react-hot-toast';

export interface CreateStudentForm {
  displayName: string;
  email: string;
  password: string;
  isActive: boolean;
  syncToMoodle: boolean;
}

interface CreateStudentResponse {
  moodleUserId?: number;
  [key: string]: unknown;
}

export function useNuevoEstudiante() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<CreateStudentForm>({
    displayName: '',
    email: '',
    password: '',
    isActive: true,
    syncToMoodle: true,
  });

  const createStudent = useMutation<CreateStudentResponse, Error, CreateStudentForm>({
    mutationFn: async (data) => {
      // Usamos el endpoint genérico de creación de usuario para admin si no existe create-student
      // El backend actual en create-user probablemente tome el rol
      const res = await api.post<CreateStudentResponse>('/users/admin/users', { ...data, roleCode: 'STUDENT' });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      const moodleMsg = data.moodleUserId
        ? ` · Moodle ID: ${data.moodleUserId}`
        : ' · Sin vincular a Moodle';
      toast.success(`Estudiante creado exitosamente${moodleMsg}`);
      navigate('/admin/users'); // Redirige a la lista de estudiantes
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Error al crear el estudiante');
    },
  });

  const handleSubmit = () => {
    if (!form.displayName.trim()) { toast.error('El nombre completo es requerido'); return; }
    if (!form.email.trim()) { toast.error('El email es requerido'); return; }
    if (!form.password || form.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres'); return;
    }
    createStudent.mutate(form);
  };

  return {
    navigate,
    form,
    setForm,
    showPassword,
    setShowPassword,
    createStudent,
    handleSubmit,
  };
}

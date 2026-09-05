import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/modules/admin/api/users.api';
import toast from 'react-hot-toast';

export interface CreateAdminForm {
  displayName: string;
  email: string;
  password: string;
  isActive: boolean;
}

export function useNuevoUsuario() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<CreateAdminForm>({
    displayName: '',
    email: '',
    password: '',
    isActive: true,
  });

  const createAdmin = useMutation({
    mutationFn: async (data: CreateAdminForm) => {
      // Fetch roles to find ADMIN role id
      const roles = await usersApi.getRoles();
      const adminRole = roles.find(r => r.code === 'ADMIN');
      
      if (!adminRole) {
        throw new Error('Rol ADMIN no encontrado');
      }

      // Create user
      return usersApi.create({
        displayName: data.displayName,
        email: data.email,
        password: data.password,
        roleIds: [adminRole.id]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Administrador creado exitosamente');
      navigate('/admin/settings/usuarios');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(apiError.response?.data?.message || apiError.message || 'Error al crear el administrador');
    },
  });

  const handleSubmit = () => {
    if (!form.displayName.trim()) { toast.error('El nombre completo es requerido'); return; }
    if (!form.email.trim()) { toast.error('El email es requerido'); return; }
    if (!form.password || form.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres'); return;
    }
    createAdmin.mutate(form);
  };

  return {
    navigate,
    form,
    setForm,
    showPassword,
    setShowPassword,
    createAdmin,
    handleSubmit,
  };
}

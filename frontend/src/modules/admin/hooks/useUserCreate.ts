import { useState } from 'react';
import toast from 'react-hot-toast';
import type { UseMutationResult } from '@tanstack/react-query';
import type { User, CreateUserRequest } from '@/shared/types';

export interface UseUserCreateProps {
  onClose: () => void;
  createUser: UseMutationResult<User, Error, CreateUserRequest>;
}

export interface CreateUserFormData {
  displayName: string;
  email: string;
  password: string;
  isActive: boolean;
  selectedRoleIds: number[];
}

export function useUserCreate({ onClose, createUser }: UseUserCreateProps) {
  const [createForm, setCreateForm] = useState<CreateUserFormData>({
    displayName: '',
    email: '',
    password: '',
    isActive: true,
    selectedRoleIds: [],
  });
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  const toggleCreateRole = (roleId: number) => {
    setCreateForm((prev) => {
      const has = prev.selectedRoleIds.includes(roleId);
      return { 
        ...prev, 
        selectedRoleIds: has 
          ? prev.selectedRoleIds.filter((id) => id !== roleId) 
          : [...prev.selectedRoleIds, roleId] 
      };
    });
  };

  const getRoleName = (code: string) => {
    switch (code) {
      case 'ADMIN': return 'Administrador';
      case 'TEACHER': return 'Profesor';
      case 'STUDENT': return 'Estudiante';
      default: return code;
    }
  };

  const handleCreate = () => {
    if (!createForm.email || !createForm.password) { 
      toast.error('Email y contraseña son requeridos'); 
      return; 
    }
    if (createForm.password.length < 6) { 
      toast.error('La contraseña debe tener al menos 6 caracteres'); 
      return; 
    }
    if (createForm.selectedRoleIds.length === 0) { 
      toast.error('Debe seleccionar al menos un rol'); 
      return; 
    }
    
    createUser.mutate({ 
        email: createForm.email, 
        password: createForm.password, 
        displayName: createForm.displayName, 
        roleIds: createForm.selectedRoleIds 
    }, {
        onSuccess: () => onClose()
    });
  };

  return {
    createForm,
    setCreateForm,
    showCreatePassword,
    setShowCreatePassword,
    toggleCreateRole,
    getRoleName,
    handleCreate,
  };
}

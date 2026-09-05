import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Button,
  Modal,
  ModalFooter,
  Input,
  Label,
} from '@/shared/components/ui';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/modules/auth/api';
import { useAuth } from '@/app/providers';
import type { AuthUser } from '@/shared/types';

interface EditProfileFormData {
  displayName: string;
  password: string;
  confirmPassword: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
}

export function EditProfileModal({ isOpen, onClose, user }: EditProfileModalProps) {
  const { refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditProfileFormData>({
    defaultValues: {
      displayName: user?.displayName || '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');

  useEffect(() => {
    if (isOpen) {
      reset({
        displayName: user?.displayName || '',
        password: '',
        confirmPassword: '',
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, user, reset]);

  const onSubmit = async (data: EditProfileFormData) => {
    setIsSaving(true);
    try {
      const payload: { displayName?: string; password?: string } = {};

      if (data.displayName && data.displayName !== user?.displayName) {
        payload.displayName = data.displayName;
      }
      if (data.password) {
        payload.password = data.password;
      }

      if (Object.keys(payload).length === 0) {
        toast('No hay cambios que guardar.', { icon: 'ℹ️' });
        onClose();
        return;
      }

      await authApi.updateProfile(payload);
      await refreshUser();
      toast.success('Perfil actualizado exitosamente');
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string | string[] } } };
      const msg = apiErr.response?.data?.message || 'Error al actualizar el perfil';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar perfil"
      description="Actualiza tu información básica de cuenta."
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1">
          <Label htmlFor="displayName">Nombre a mostrar</Label>
          <Input
            id="displayName"
            placeholder="Tu nombre completo"
            {...register('displayName', {
              required: 'El nombre es requerido',
              minLength: { value: 2, message: 'Mínimo 2 caracteres' },
            })}
          />
          {errors.displayName && (
            <p className="text-sm text-red-600">{errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">Nueva contraseña <span className="text-gray-400 font-normal">(opcional)</span></Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Dejar en blanco para no cambiar"
              {...register('password', {
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {passwordValue && (
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repite la nueva contraseña"
                {...register('confirmPassword', {
                  validate: (val) =>
                    val === passwordValue || 'Las contraseñas no coinciden',
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        )}

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Guardar cambios
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

import { Link } from 'react-router-dom';
import { Button, Input } from '@/shared/components/ui';
import { Mail, Lock, User } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { RegisterFormData } from '../schemas/register.schema';

interface RegisterFormProps {
  form: UseFormReturn<RegisterFormData>;
  onSubmit: (data: RegisterFormData) => void;
  isLoading: boolean;
}

export function RegisterForm({ form, onSubmit, isLoading }: RegisterFormProps) {
  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Nombre completo"
          type="text"
          placeholder="Tu nombre"
          autoComplete="name"
          leftIcon={<User className="h-5 w-5" />}
          error={errors.displayName?.message}
          {...register('displayName')}
        />

        <Input
          label="Correo electrónico"
          type="email"
          placeholder="tu@correo.com"
          autoComplete="email"
          leftIcon={<Mail className="h-5 w-5" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          leftIcon={<Lock className="h-5 w-5" />}
          hint="Mínimo 8 caracteres"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirmar contraseña"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          leftIcon={<Lock className="h-5 w-5" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Crear cuenta
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </>
  );
}

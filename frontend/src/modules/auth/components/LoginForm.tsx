import { Link } from 'react-router-dom';
import { Button, Input } from '@/shared/components/ui';
import { User, Lock } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { LoginFormData } from '../hooks/useLogin';

interface LoginFormProps {
  form: UseFormReturn<LoginFormData>;
  onSubmit: (data: LoginFormData) => void;
  isLoading: boolean;
  onMicrosoftLogin: () => void;
}

export function LoginForm({ form, onSubmit, isLoading, onMicrosoftLogin }: LoginFormProps) {
  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Correo o usuario"
          type="text"
          placeholder="correo@ejemplo.com o usuario"
          autoComplete="username"
          leftIcon={<User className="h-5 w-5" />}
          error={errors.identifier?.message}
          {...register('identifier')}
        />

        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          leftIcon={<Lock className="h-5 w-5" />}
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Iniciar sesión
        </Button>
      </form>

      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">O también</span>
        </div>
      </div>

      <div className="mt-6">
        <Button
          type="button"
          variant="outline"
          className="w-full relative flex items-center justify-center gap-2"
          size="lg"
          onClick={onMicrosoftLogin}
        >
          <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 0H0V10H10V0Z" fill="#F25022"/>
            <path d="M21 0H11V10H21V0Z" fill="#7FBA00"/>
            <path d="M10 11H0V21H10V11Z" fill="#00A4EF"/>
            <path d="M21 11H11V21H21V11Z" fill="#FFB900"/>
          </svg>
          Cuenta Institucional (Office 365)
        </Button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Regístrate
          </Link>
        </p>
      </div>
    </>
  );
}

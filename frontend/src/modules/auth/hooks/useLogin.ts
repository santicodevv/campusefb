import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/app/providers';
import { getErrorMessage } from '@/shared/lib';
import { STORAGE_KEYS } from '@/shared/constants';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'El correo o usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export function useLogin() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const ssoError = searchParams.get('sso_error');
    if (ssoError) {
      setError(decodeURIComponent(ssoError));
      setSearchParams(
        (prev) => {
          prev.delete('sso_error');
          return prev;
        },
        { replace: true }
      );
    }

    if (localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRED) === 'true') {
      setSessionExpired(true);
    }
  }, [searchParams, setSearchParams]);

  const handleAcknowledgeSessionExpired = () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRED);
    setSessionExpired(false);
  };

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setIsLoading(true);

    try {
      await login(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/microsoft`;
  };

  return {
    error,
    setError,
    sessionExpired,
    isLoading,
    form,
    onSubmit,
    handleAcknowledgeSessionExpired,
    handleMicrosoftLogin,
  };
}

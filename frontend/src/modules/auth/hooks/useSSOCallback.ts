import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { storage, decodeToken } from '@/shared/lib';
import type { DecodedToken } from '@/shared/types';

export function useSSOCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      // No hay token — redirigir al login con error
      navigate('/login?sso_error=' + encodeURIComponent('No se recibió el token de autenticación.'), { replace: true });
      return;
    }

    const decoded = decodeToken<DecodedToken>(token);
    if (!decoded) {
      navigate('/login?sso_error=' + encodeURIComponent('El token recibido no es válido.'), { replace: true });
      return;
    }

    // Guardar el token igual que lo hace el login normal
    storage.setAccessToken(token);

    // Redirigir según el rol del usuario
    const roles = decoded.roles || [];
    if (roles.includes('ADMIN')) {
      navigate('/admin', { replace: true });
    } else if (roles.includes('TEACHER')) {
      navigate('/teacher', { replace: true });
    } else {
      navigate('/student', { replace: true });
    }
  }, [token, navigate]);
}

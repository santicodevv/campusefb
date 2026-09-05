// Guest Route - Only accessible when NOT authenticated
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import type { RoleCode } from '@/shared/types';

export function GuestRoute() {
  const { isAuthenticated, isLoading, roles } = useAuth();

  // Show nothing while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    const defaultRoute = getDefaultRoute(roles);
    return <Navigate to={defaultRoute} replace />;
  }

  return <Outlet />;
}

function getDefaultRoute(roles: RoleCode[]): string {
  if (roles.includes('ADMIN')) return '/admin';
  if (roles.includes('TEACHER')) return '/teacher';
  return '/student';
}

export default GuestRoute;

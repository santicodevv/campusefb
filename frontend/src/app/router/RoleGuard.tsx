// Role Guard - Restricts access by role
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import type { RoleCode } from '@/shared/types';

interface RoleGuardProps {
  allowedRoles: RoleCode[];
  redirectTo?: string;
}

export function RoleGuard({ allowedRoles, redirectTo }: RoleGuardProps) {
  const { hasAnyRole, roles, isLoading } = useAuth();

  // Show nothing while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Check if user has any of the allowed roles
  if (!hasAnyRole(allowedRoles)) {
    // Determine where to redirect based on user's actual role
    const fallback = redirectTo || getDefaultRoute(roles);
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}

// Get the default route for a user based on their roles
function getDefaultRoute(roles: RoleCode[]): string {
  if (roles.includes('ADMIN')) return '/admin';
  if (roles.includes('TEACHER')) return '/teacher';
  if (roles.includes('STUDENT')) return '/student';
  return '/login';
}

export default RoleGuard;

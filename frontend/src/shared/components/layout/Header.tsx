// Header component
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import { cn, getCurrentDashboard } from '@/shared/lib';
import { Menu, User, LogOut, ChevronDown, Shield, GraduationCap, BookOpen } from 'lucide-react';
import type { RoleCode } from '@/shared/types';

interface HeaderProps {
  onMenuClick: () => void;
}

// Dashboard config por rol
const dashboardConfig: Record<RoleCode, { path: string; label: string; icon: typeof Shield }> = {
  ADMIN: { path: '/admin', label: 'Panel Admin', icon: Shield },
  TEACHER: { path: '/teacher', label: 'Panel Docente', icon: GraduationCap },
  STUDENT: { path: '/student', label: 'Panel Estudiante', icon: BookOpen },
};

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout, roles } = useAuth();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentDashboard = getCurrentDashboard(location.pathname);
  const currentRole = currentDashboard ? (currentDashboard.toUpperCase() as RoleCode) : null;

  const availableDashboards = roles.filter(
    (role) => role !== currentRole
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-full px-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Spacer for desktop */}
        <div className="hidden lg:block" />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
              'hover:bg-gray-100',
              isDropdownOpen && 'bg-gray-100'
            )}
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900">{user?.displayName}</p>
              <p className="text-xs text-gray-500">{user?.roles.map(r => r.code).join(', ')}</p>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-gray-500 transition-transform',
                isDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
              <Link
                to="/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <User className="h-4 w-4" />
                Mi Perfil
              </Link>

              {/* Cambiar de dashboard - solo si tiene múltiples roles */}
              {availableDashboards.length > 0 && (
                <>
                  <hr className="my-1 border-gray-200" />
                  <div className="px-4 py-1">
                    <p className="text-xs font-medium text-gray-400 uppercase">
                      Cambiar a
                    </p>
                  </div>
                  {availableDashboards.map((role) => {
                    const config = dashboardConfig[role];
                    const Icon = config.icon;
                    return (
                      <Link
                        key={role}
                        to={config.path}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Icon className="h-4 w-4" />
                        {config.label}
                      </Link>
                    );
                  })}
                </>
              )}

              <hr className="my-1 border-gray-200" />
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  logout();
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

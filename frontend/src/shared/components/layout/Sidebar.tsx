import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import { cn, getCurrentDashboard } from '@/shared/lib';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  RefreshCw,
  Users,
  Calendar,
  Database,
  FileSearch,
  UserSearch,
  FileText,
  TableIcon,
  Settings,
  DollarSign,
  UserRound,
  UserCog,
  Receipt,
  BarChart3,
} from 'lucide-react';
import type { RoleCode } from '@/shared/types';
import { SidebarLogo } from './SidebarLogo';
import { SidebarNavItem, type NavItem } from './SidebarNavItem';

const navItems: NavItem[] = [
  // Student
  {
    label: 'Dashboard',
    href: '/student',
    icon: LayoutDashboard,
    roles: ['STUDENT'],
  },
  {
    label: 'Mis Cursos',
    href: '/student/courses',
    icon: BookOpen,
    roles: ['STUDENT'],
  },
  {
    label: 'Calificaciones',
    href: '/student/grades',
    icon: ClipboardList,
    roles: ['STUDENT'],
  },
  {
    label: 'Reinscripción',
    href: '/student/reenrolment',
    icon: RefreshCw,
    roles: ['STUDENT'],
  },
  {
    label: 'Mis Facturas',
    href: '/student/payments',
    icon: Receipt,
    roles: ['STUDENT'],
  },

  // Teacher
  {
    label: 'Dashboard',
    href: '/teacher',
    icon: LayoutDashboard,
    roles: ['TEACHER'],
  },
  {
    label: 'Mis Cursos',
    href: '/teacher/courses',
    icon: BookOpen,
    roles: ['TEACHER'],
  },

  // Admin
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['ADMIN'],
  },
  {
    label: 'Estudiantes',
    href: '/admin/users',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    label: 'Cursos',
    href: '/admin/courses',
    icon: BookOpen,
    roles: ['ADMIN'],
  },
  {
    label: 'Calificaciones',
    href: '/admin/grades',
    icon: ClipboardList,
    roles: ['ADMIN'],
    children: [
      {
        label: 'Por Período',
        href: '/admin/grades',
        icon: ClipboardList,
        roles: ['ADMIN'],
      },
      {
        label: 'Por Usuario',
        href: '/admin/grades/user',
        icon: UserSearch,
        roles: ['ADMIN'],
      },
      {
        label: 'Record de Notas',
        href: '/admin/grades/record',
        icon: FileText,
        roles: ['ADMIN'],
      },
      {
        label: 'Resumen',
        href: '/admin/grades/summary',
        icon: TableIcon,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    label: 'Períodos',
    href: '/admin/periods',
    icon: Calendar,
    roles: ['ADMIN'],
  },
  {
    label: 'Reinscripciones',
    href: '/admin/reenrolments',
    icon: RefreshCw,
    roles: ['ADMIN'],
  },
  {
    label: 'Pagos',
    href: '/admin/payments',
    icon: DollarSign,
    roles: ['ADMIN'],
  },
  {
    label: 'Sincronización',
    href: '/admin/sync',
    icon: Database,
    roles: ['ADMIN'],
  },
  {
    label: 'Auditoría',
    href: '/admin/audit',
    icon: FileSearch,
    roles: ['ADMIN'],
  },
  {
    label: 'Proyección Académica',
    href: '/admin/academic-projection',
    icon: BarChart3,
    roles: ['ADMIN'],
  },
  {
    label: 'Configuración',
    href: '/admin/settings',
    icon: Settings,
    roles: ['ADMIN'],
    children: [
      {
        label: 'Profesores',
        href: '/admin/settings/profesores',
        icon: UserRound,
        roles: ['ADMIN'],
      },
      {
        label: 'Estudiantes',
        href: '/admin/settings/estudiantes',
        icon: Users,
        roles: ['ADMIN'],
      },

      {
        label: 'Usuarios',
        href: '/admin/settings/usuarios',
        icon: UserCog,
        roles: ['ADMIN'],
      },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { roles } = useAuth();

  const defaultRoute = roles.includes('ADMIN')
    ? '/admin'
    : roles.includes('TEACHER')
      ? '/teacher'
      : '/student';

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    '/admin/grades': location.pathname.startsWith('/admin/grades'),
    '/admin/settings': location.pathname.startsWith('/admin/settings'),
  });

  const currentDashboard = getCurrentDashboard(location.pathname);
  const currentRole = currentDashboard ? (currentDashboard.toUpperCase() as RoleCode) : null;

  const currentItems = navItems.filter((item) =>
    currentRole ? item.roles.includes(currentRole) : false,
  );

  const toggleMenu = (href: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [href]: !prev[href],
    }));
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-[240px] bg-white flex flex-col',
          'border-r border-gray-100 shadow-[2px_0_20px_rgba(0,0,0,0.06)]',
          'transform transition-transform duration-250 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarLogo defaultRoute={defaultRoute} onClose={onClose} />

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {currentItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              expandedMenus={expandedMenus}
              onToggle={toggleMenu}
              onClose={onClose}
              currentPath={location.pathname}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 px-4 py-3">
          <p className="text-[10px] text-gray-300 font-medium tracking-wider uppercase">
            EFB | Escuela de Formación Bíblica v1.0
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

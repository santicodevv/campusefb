import { Users, BookOpen, UserPlus, ClipboardList, FolderTree } from 'lucide-react';

export const entityConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  users: {
    label: 'Usuarios',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  categories: {
    label: 'Categorías',
    icon: FolderTree,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  courses: {
    label: 'Cursos',
    icon: BookOpen,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  enrolments: {
    label: 'Inscripciones',
    icon: UserPlus,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  grade_items: {
    label: 'Items Calificación',
    icon: ClipboardList,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  grades: {
    label: 'Calificaciones',
    icon: ClipboardList,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

export const formatLastSync = (dateStr?: string) => {
  if (!dateStr) return 'Nunca';
  const date = new Date(dateStr);
  return date.toLocaleString();
};

export const getTimeSinceSync = (dateStr?: string) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `Hace ${diffDays} día(s)`;
  if (diffHours > 0) return `Hace ${diffHours} hora(s)`;
  if (diffMins > 0) return `Hace ${diffMins} minuto(s)`;
  return 'Hace menos de un minuto';
};

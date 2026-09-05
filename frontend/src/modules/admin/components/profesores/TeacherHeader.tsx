import { Badge } from '@/shared/components/ui';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import type { User } from '@/modules/admin/types/user.types';
import type { NavigateFunction } from 'react-router-dom';

interface TeacherHeaderProps {
  teacher: User;
  navigate: NavigateFunction;
}

export function TeacherHeader({ teacher, navigate }: TeacherHeaderProps) {
  return (
    <>
      {/* Back */}
      <button
        onClick={() => navigate('/admin/settings/profesores')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 transition-colors mb-6 group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Volver a Profesores
      </button>

      {/* Page header */}
      <div className="mb-8 flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
          <span className="text-violet-700 font-bold text-lg">
            {teacher.displayName?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{teacher.displayName || teacher.email}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={teacher.isActive ? 'success' : 'danger'}>
              {teacher.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
            {teacher.moodleUserId ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle className="h-3.5 w-3.5" /> Moodle ID {teacher.moodleUserId}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                <AlertCircle className="h-3.5 w-3.5" /> Sin vincular a Moodle
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

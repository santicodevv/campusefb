import { Button } from '@/shared/components/ui';
import { GraduationCap, Plus } from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';

interface TeachersListHeaderProps {
  navigate: NavigateFunction;
}

export function TeachersListHeader({ navigate }: TeachersListHeaderProps) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
            <GraduationCap className="h-5 w-5 text-violet-600" />
          </span>
          Profesores
        </h1>
        <p className="mt-1 text-sm text-gray-500 ml-12">
          Gestiona los profesores del sistema y su vinculación con Moodle.
        </p>
      </div>
      <Button onClick={() => navigate('/admin/settings/profesores/nuevo')} className="shrink-0">
        <Plus className="h-4 w-4 mr-2" />
        Nuevo Profesor
      </Button>
    </div>
  );
}

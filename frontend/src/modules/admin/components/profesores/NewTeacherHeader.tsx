import { GraduationCap, ArrowLeft } from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';

interface NewTeacherHeaderProps {
  navigate: NavigateFunction;
}

export function NewTeacherHeader({ navigate }: NewTeacherHeaderProps) {
  return (
    <>
      {/* Breadcrumb / Back */}
      <button
        onClick={() => navigate('/admin/settings/profesores')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 transition-colors mb-6 group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Volver a Profesores
      </button>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
            <GraduationCap className="h-5 w-5 text-violet-600" />
          </span>
          Nuevo Profesor
        </h1>
        <p className="mt-1 text-sm text-gray-500 ml-12">
          Se asignará el rol <strong>Profesor</strong> automáticamente y se sincronizará con Moodle.
        </p>
      </div>
    </>
  );
}

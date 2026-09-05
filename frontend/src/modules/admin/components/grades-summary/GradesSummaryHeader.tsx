import { TableIcon } from 'lucide-react';

export function GradesSummaryHeader() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <TableIcon className="h-7 w-7 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calificaciones por Usuario</h1>
          <p className="text-gray-600">Vista detallada de todas las calificaciones de un usuario</p>
        </div>
      </div>
    </div>
  );
}

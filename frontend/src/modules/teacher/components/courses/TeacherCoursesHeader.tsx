import { Badge } from '@/shared/components/ui';

interface TeacherCoursesHeaderProps {
  editSessionStatus?: { isActive: boolean };
}

export function TeacherCoursesHeader({ editSessionStatus }: TeacherCoursesHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Cursos</h1>
        <p className="mt-1 text-gray-600">
          Seleccione un curso para gestionar calificaciones
        </p>
      </div>
      {editSessionStatus?.isActive && (
        <Badge variant="success" className="px-3 py-1 text-sm">
          Edición de notas habilitada
        </Badge>
      )}
    </div>
  );
}

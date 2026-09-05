import { Card, CardContent } from '@/shared/components/ui';
import { ClipboardList } from 'lucide-react';

interface TeacherEditSessionStatusProps {
  editSessionStatus?: { isActive: boolean };
}

export function TeacherEditSessionStatus({ editSessionStatus }: TeacherEditSessionStatusProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${
              editSessionStatus?.isActive ? 'bg-green-100' : 'bg-gray-100'
            }`}
          >
            <ClipboardList
              className={`h-5 w-5 ${
                editSessionStatus?.isActive ? 'text-green-600' : 'text-gray-400'
              }`}
            />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {editSessionStatus?.isActive
                ? 'La edición de notas está habilitada'
                : 'La edición de notas está deshabilitada'}
            </p>
            <p className="text-sm text-gray-500">
              {editSessionStatus?.isActive
                ? 'Puede editar las calificaciones de sus estudiantes. Una vez editada una nota, no podrá modificarla hasta que el administrador habilite una nueva sesión.'
                : 'Contacte al administrador para habilitar la edición de notas.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

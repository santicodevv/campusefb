import { Card, CardContent } from '@/shared/components/ui';
import { AlertTriangle } from 'lucide-react';

interface TeacherGradeEntryAlertProps {
  isEditingEnabled: boolean;
}

export function TeacherGradeEntryAlert({ isEditingEnabled }: TeacherGradeEntryAlertProps) {
  if (isEditingEnabled) return null;

  return (
    <Card className="mb-6 border-yellow-200 bg-yellow-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">Edición de notas deshabilitada</p>
            <p className="text-sm text-yellow-700">
              Contacte al administrador para habilitar la edición de calificaciones.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

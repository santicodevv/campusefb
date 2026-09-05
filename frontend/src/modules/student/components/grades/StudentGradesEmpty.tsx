import { Card, CardContent } from '@/shared/components/ui';
import { GraduationCap } from 'lucide-react';

export function StudentGradesEmpty() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">
          No tienes calificaciones registradas
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Las notas aparecerán aquí cuando tus profesores las registren
        </p>
      </CardContent>
    </Card>
  );
}

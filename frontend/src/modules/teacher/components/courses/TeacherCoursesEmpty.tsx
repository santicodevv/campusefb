import { Card, CardContent } from '@/shared/components/ui';
import { BookOpen } from 'lucide-react';

export function TeacherCoursesEmpty() {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center text-gray-500">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No hay cursos disponibles</p>
          <p className="text-sm mt-1">
            Los cursos aparecerán aquí cuando se sincronicen desde Moodle
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

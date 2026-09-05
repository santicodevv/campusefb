import { Card, CardContent } from '@/shared/components/ui';
import { AlertCircle } from 'lucide-react';

export function StudentCoursesEmpty() {
  return (
    <Card>
      <CardContent className="p-12">
        <div className="flex flex-col items-center justify-center text-gray-500">
          <AlertCircle className="h-12 w-12 mb-4 text-gray-300" />
          <p className="text-lg font-medium">No tienes cursos inscritos</p>
          <p className="text-sm">
            Cuando te inscriban en cursos, aparecerán aquí
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

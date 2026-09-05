import { Card, CardContent } from '@/shared/components/ui';
import { AlertCircle } from 'lucide-react';

interface StudentCoursesErrorProps {
  error: { response?: { data?: { message?: string } } } | null;
}

export function StudentCoursesError({ error }: StudentCoursesErrorProps) {
  return (
    <Card>
      <CardContent className="p-12">
        <div className="flex flex-col items-center justify-center text-red-500">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Error al cargar los cursos</p>
          <p className="text-sm text-gray-500">
            {error?.response?.data?.message || 'Intenta nuevamente'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

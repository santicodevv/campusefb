import { Card, CardContent, Button } from '@/shared/components/ui';
import { ArrowLeft } from 'lucide-react';

interface TeacherGradesErrorProps {
  onBack: () => void;
}

export function TeacherGradesError({ onBack }: TeacherGradesErrorProps) {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">Error al cargar las calificaciones</p>
          <Button variant="outline" className="mt-4" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a cursos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

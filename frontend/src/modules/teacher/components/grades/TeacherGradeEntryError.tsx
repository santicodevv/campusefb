import { Card, CardContent, Button } from '@/shared/components/ui';
import { XCircle, ArrowLeft } from 'lucide-react';

interface TeacherGradeEntryErrorProps {
  onBack: () => void;
}

export function TeacherGradeEntryError({ onBack }: TeacherGradeEntryErrorProps) {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="py-12 text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-gray-600">Error al cargar las calificaciones</p>
          <Button variant="outline" className="mt-4" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a cursos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

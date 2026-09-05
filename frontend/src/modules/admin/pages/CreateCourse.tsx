// Create Course Page
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@/shared/components/ui';
import { ArrowLeft } from 'lucide-react';
import { CreateCourseForm } from '../components/courses/CreateCourseForm';

export default function CreateCoursePage() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/courses')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Cursos
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Curso</h1>
        <p className="mt-1 text-gray-600">
          Crea un curso en Moodle y en el sistema local
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <CreateCourseForm
            onSuccess={() => navigate('/admin/courses')}
            onCancel={() => navigate('/admin/courses')}
          />
        </CardContent>
      </Card>
    </div>
  );
}

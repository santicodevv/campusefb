import { Button, Badge } from '@/shared/components/ui';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';
import type { Course } from '@/modules/admin/types/course.types';

interface CourseDetailHeaderProps {
  navigate: NavigateFunction;
  course: Course;
}

export function CourseDetailHeader({ navigate, course }: CourseDetailHeaderProps) {
  return (
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {course.subjectName || course.fullname}
          </h1>
          <p className="mt-1 text-gray-600">
            Detalles del curso y personas inscritas
          </p>
        </div>
        <Badge
          variant={course.visible ? 'success' : 'secondary'}
          className="text-sm"
        >
          {course.visible ? (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Visible
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Oculto
            </>
          )}
        </Badge>
      </div>
    </div>
  );
}

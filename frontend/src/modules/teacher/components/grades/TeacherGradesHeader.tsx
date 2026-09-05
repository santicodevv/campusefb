
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui';

interface TeacherGradesHeaderProps {
  courseShortname: string | null;
  courseName: string | null;
}

export function TeacherGradesHeader({ courseShortname, courseName }: TeacherGradesHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/courses')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{courseShortname || courseName}</h1>
          <p className="text-gray-600">{courseName}</p>
        </div>
      </div>
    </div>
  );
}

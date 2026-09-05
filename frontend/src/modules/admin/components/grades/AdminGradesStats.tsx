import { Card, CardContent } from '@/shared/components/ui';
import { BookOpen, Users, CheckCircle, TrendingUp } from 'lucide-react';

interface AdminGradesStatsProps {
  coursesCount: number;
  totalStudents: number;
  totalGraded: number;
}

export function AdminGradesStats({ coursesCount, totalStudents, totalGraded }: AdminGradesStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cursos</p>
              <p className="text-xl font-bold text-purple-600">{coursesCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Estudiantes</p>
              <p className="text-xl font-bold text-blue-600">{totalStudents}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Calificados</p>
              <p className="text-xl font-bold text-green-600">{totalGraded}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Progreso</p>
              <p className="text-xl font-bold text-orange-600">
                {totalStudents > 0 ? Math.round((totalGraded / totalStudents) * 100) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent } from '@/shared/components/ui';
import { BookOpen, CheckCircle, TrendingUp } from 'lucide-react';

interface StudentGradesStatsProps {
  stats: {
    totalCourses: number;
    gradedCourses: number;
    averageGrade: number | null;
  };
}

export function StudentGradesStats({ stats }: StudentGradesStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Cursos</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.totalCourses}
              </p>
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
              <p className="text-xl font-bold text-gray-900">
                {stats.gradedCourses}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Promedio</p>
              <p className="text-xl font-bold text-purple-600">
                {stats.averageGrade !== null ? stats.averageGrade.toFixed(1) : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

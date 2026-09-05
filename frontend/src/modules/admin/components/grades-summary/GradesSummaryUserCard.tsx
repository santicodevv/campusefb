import { Card, CardContent } from '@/shared/components/ui';
import { User, BookOpen, CheckCircle, TrendingUp } from 'lucide-react';
import type { UserGradesData } from '../../hooks/useGradesSummary';

interface GradesSummaryUserCardProps {
  userData: UserGradesData;
  stats: {
    totalCourses: number;
    gradedCourses: number;
    avgGrade: number | null;
  };
}

export function GradesSummaryUserCard({ userData, stats }: GradesSummaryUserCardProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {userData.user.displayName || userData.user.email}
              </h2>
              <p className="text-gray-500">{userData.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-gray-600">{stats.totalCourses} cursos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600">{stats.gradedCourses} con nota final</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600">
                Promedio: {stats.avgGrade !== null ? stats.avgGrade.toFixed(2) : '-'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent } from '@/shared/components/ui';
import { BookOpen, GraduationCap, Users } from 'lucide-react';
import type { CourseWithCounts } from '../../hooks/useStudentCourses';

interface StudentCoursesStatsProps {
  courses?: CourseWithCounts[];
}

export function StudentCoursesStats({ courses }: StudentCoursesStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Cursos</p>
              <p className="text-2xl font-bold text-blue-600">
                {courses?.length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100">
              <GraduationCap className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cursos Activos</p>
              <p className="text-2xl font-bold text-green-600">
                {courses?.filter((c) => c.visible).length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Compañeros</p>
              <p className="text-2xl font-bold text-purple-600">
                {courses?.reduce((sum, c) => sum + (c.studentCount || 0), 0) || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

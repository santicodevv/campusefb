import { Card, CardContent } from '@/shared/components/ui';
import { BookOpen, Hash, GraduationCap, UserCheck } from 'lucide-react';
import type { Course } from '@/modules/admin/types/course.types';

interface CourseDetailStatsProps {
  course: Course;
  studentsCount: number;
  teachersCount: number;
}

export function CourseDetailStats({ course, studentsCount, teachersCount }: CourseDetailStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Hash className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Grupo</p>
              <p className="font-mono font-medium">{course.shortname}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">ID Moodle</p>
              <p className="font-medium">{course.moodleId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Estudiantes</p>
              <p className="font-medium">{studentsCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Profesores</p>
              <p className="font-medium">{teachersCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

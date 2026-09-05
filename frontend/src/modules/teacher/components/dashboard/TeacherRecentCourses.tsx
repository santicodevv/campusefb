import { Card, CardContent, Spinner, Button } from '@/shared/components/ui';
import { ClipboardList, ArrowRight } from 'lucide-react';
import type { TeacherCourse } from '../../hooks/useTeacherDashboard';

interface TeacherRecentCoursesProps {
  courses: TeacherCourse[];
  isLoading: boolean;
  onNavigateCourses: () => void;
  onNavigateGrades: (moodleId: number) => void;
}

export function TeacherRecentCourses({
  courses,
  isLoading,
  onNavigateCourses,
  onNavigateGrades,
}: TeacherRecentCoursesProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Mis Cursos</h3>
          <Button variant="ghost" size="sm" onClick={onNavigateCourses}>
            Ver todos
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : courses.length > 0 ? (
          <div className="space-y-3">
            {courses.slice(0, 5).map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => onNavigateGrades(course.moodleId)}
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {course.subjectName || course.fullname}
                  </p>
                  <p className="text-sm text-gray-500">{course.shortname}</p>
                </div>
                <Button variant="outline" size="sm">
                  <ClipboardList className="h-4 w-4 mr-1" />
                  Calificar
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No tienes cursos asignados</p>
        )}
      </CardContent>
    </Card>
  );
}

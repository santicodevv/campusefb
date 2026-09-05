import { Card, CardContent, Button, Badge } from '@/shared/components/ui';
import { BookOpen, Users, ClipboardList, ChevronRight } from 'lucide-react';
import type { CourseWithStats } from '@/modules/admin/types/course.types';

interface TeacherCoursesListProps {
  courses: CourseWithStats[];
  onNavigate: (courseId: number) => void;
}

export function TeacherCoursesList({ courses, onNavigate }: TeacherCoursesListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Card
          key={course.moodleId}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onNavigate(course.moodleId)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{course.shortname}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {course.subjectName || course.fullname}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{course.studentCount ?? 0} Estudiantes</span>
              </div>
              {!course.visible && <Badge variant="secondary">Oculto</Badge>}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(course.moodleId);
              }}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Gestionar Calificaciones
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

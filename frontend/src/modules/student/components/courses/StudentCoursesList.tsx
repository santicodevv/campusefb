import { Card, CardContent, Badge } from '@/shared/components/ui';
import { BookOpen, Users, Calendar, ExternalLink } from 'lucide-react';
import type { CourseWithCounts } from '../../hooks/useStudentCourses';

interface StudentCoursesListProps {
  courses: CourseWithCounts[];
  getMoodleCourseUrl: (id: number) => string;
  formatDate: (date?: string) => string | null;
}

export function StudentCoursesList({ courses, getMoodleCourseUrl, formatDate }: StudentCoursesListProps) {
  return (
    <div className="grid gap-4">
      {courses.map((course) => (
        <a
          key={course.id}
          href={getMoodleCourseUrl(course.moodleId)}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {course.subjectName || course.fullname}
                      </h3>
                      {!course.visible && (
                        <Badge variant="secondary">Oculto</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {course.shortname}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.studentCount || 0} estudiantes
                      </span>
                      {course.startdate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Inicio: {formatDate(course.startdate)}
                        </span>
                      )}
                      {course.enddate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Fin: {formatDate(course.enddate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <span className="text-sm font-medium">Ir a Moodle</span>
                  <ExternalLink className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  );
}

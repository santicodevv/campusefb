import { Card, CardContent, Spinner } from '@/shared/components/ui';
import { BookOpen, MessageSquare, GraduationCap } from 'lucide-react';
import type { FlattenedCourse } from '../../types/user.types';
import { getGradeColor } from './utils';

interface UserGradesTableProps {
  gradesLoading: boolean;
  allCourses: FlattenedCourse[];
}

export function UserGradesTable({ gradesLoading, allCourses }: UserGradesTableProps) {
  if (gradesLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (allCourses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">
            Este usuario no tiene calificaciones registradas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Curso
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Periodo
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">
                  Nota Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Comentario
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allCourses.map((course) => (
                <tr
                  key={`${course.courseMoodleId}-${course.periodId}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{course.courseName}</p>
                        <p className="text-xs text-gray-500">{course.courseShortname}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">{course.periodName || '-'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={getGradeColor(course.totalGrade)}>
                      {course.totalGrade !== null ? course.totalGrade : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {course.comment ? (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{course.comment}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

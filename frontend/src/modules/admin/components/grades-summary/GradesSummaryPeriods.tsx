import { Card, CardContent, CardHeader, CardTitle, Spinner } from '@/shared/components/ui';
import { Calendar, BookOpen, GraduationCap } from 'lucide-react';
import type { UserGradesData } from '../../hooks/useGradesSummary';

interface GradesSummaryPeriodsProps {
  gradesLoading: boolean;
  userData: UserGradesData;
  getGradeColor: (grade: number | null, max?: number | null) => string;
  formatGrade: (grade: number | null, max: number | null) => string;
}

export function GradesSummaryPeriods({
  gradesLoading,
  userData,
  getGradeColor,
  formatGrade,
}: GradesSummaryPeriodsProps) {
  if (gradesLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (userData.periods.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Este usuario no tiene calificaciones registradas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {userData.periods.map((period) => (
        <Card key={period.periodId ?? 'no-period'}>
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-indigo-600" />
              {period.periodName}
              {period.periodCode && (
                <span className="text-sm font-normal text-gray-500">({period.periodCode})</span>
              )}
              <span className="ml-auto text-sm font-normal text-gray-500">
                {period.courses.length} curso{period.courses.length !== 1 ? 's' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {period.courses.map((course) => (
              <div
                key={`${period.periodId}-${course.courseMoodleId}`}
                className="border rounded-lg overflow-hidden"
              >
                <div className="bg-purple-50 px-4 py-2 border-b flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-gray-900">{course.courseName}</span>
                  <span className="text-xs text-gray-500">({course.courseShortname})</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        {course.gradeItems.map((item) => (
                          <th
                            key={item.itemMoodleId}
                            className="px-3 py-2 text-center text-xs font-medium text-gray-600 whitespace-nowrap border-r min-w-[100px]"
                            title={item.itemName}
                          >
                            {item.itemName.length > 15
                              ? item.itemName.substring(0, 15) + '...'
                              : item.itemName}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 whitespace-nowrap border-r bg-blue-50 min-w-[80px]">
                          Acumulado
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 whitespace-nowrap bg-green-50 min-w-[60px]">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        {course.gradeItems.map((item) => (
                          <td
                            key={item.itemMoodleId}
                            className="px-3 py-2 text-center border-r whitespace-nowrap"
                          >
                            <span className={getGradeColor(item.grade, item.gradeMax)}>
                              {formatGrade(item.grade, item.gradeMax)}
                            </span>
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center border-r bg-blue-50 whitespace-nowrap">
                          <span className={getGradeColor(course.sumGrade, course.sumMax)}>
                            {course.sumGrade}/{course.sumMax}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center bg-green-50 whitespace-nowrap">
                          <span className={getGradeColor(course.totalGrade, 10)}>
                            {course.totalGrade !== null ? course.totalGrade : '0'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {course.comment && (
                  <div className="px-4 py-2 bg-yellow-50 border-t text-sm">
                    <span className="font-medium text-gray-600">Comentario: </span>
                    <span className="text-gray-700">{course.comment}</span>
                  </div>
                )}

                {course.gradeItems.length === 0 && (
                  <div className="px-4 py-3 text-center text-gray-500 text-sm">
                    No hay items de calificación registrados en Moodle para este curso
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

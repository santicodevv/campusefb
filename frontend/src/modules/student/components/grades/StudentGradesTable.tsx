import { Card, CardContent } from '@/shared/components/ui';
import type { StudentCourseGrade } from '@/shared/types';

interface StudentGradesTableProps {
  grades: StudentCourseGrade[];
  selectedPeriodId: number | null;
}

export function StudentGradesTable({ grades, selectedPeriodId }: StudentGradesTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Curso
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comentario
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {grades.map((grade) => (
                <tr
                  key={`${grade.courseMoodleId}-${grade.periodId}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {grade.courseName}
                      </p>
                      {grade.periodName && !selectedPeriodId && (
                        <p className="text-xs text-gray-400">
                          {grade.periodName}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {grade.totalGrade !== null ? (
                      <span className="text-sm font-semibold text-gray-900">
                        {grade.totalGrade}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {grade.comment ? (
                      <p className="text-sm text-gray-700">
                        {grade.comment}
                      </p>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
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

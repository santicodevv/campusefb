import { Card, CardContent, Input, Spinner, Badge } from '@/shared/components/ui';
import { ClipboardList, Search, GraduationCap } from 'lucide-react';
import type { CourseGradeData } from '../../types/course.types';

interface CourseGradesTabProps {
  courseGrades: CourseGradeData[] | undefined;
  gradesLoading: boolean;
  gradesSearch: string;
  setGradesSearch: (val: string) => void;
}

export function CourseGradesTab({
  courseGrades,
  gradesLoading,
  gradesSearch,
  setGradesSearch,
}: CourseGradesTabProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            <ClipboardList className="h-5 w-5 inline mr-2" />
            Calificaciones de Estudiantes
          </h3>
        </div>

        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar estudiante..."
              value={gradesSearch}
              onChange={(e) => setGradesSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {gradesLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : courseGrades && courseGrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acumulado Moodle</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nota Final</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comentario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {courseGrades
                  .filter((grade) => {
                    if (!gradesSearch) return true;
                    const search = gradesSearch.toLowerCase();
                    return (
                      grade.studentName?.toLowerCase().includes(search) ||
                      grade.studentEmail?.toLowerCase().includes(search)
                    );
                  })
                  .map((grade, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-green-100 rounded-full">
                            <GraduationCap className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{grade.studentName}</p>
                            <p className="text-xs text-gray-500">{grade.studentEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{grade.periodName || 'Sin período'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-600">
                          {grade.moodleSumGrade !== null
                            ? `${grade.moodleSumGrade.toFixed(1)}/${grade.moodleSumMax?.toFixed(1) || '100'}`
                            : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-semibold px-2 py-1 rounded ${
                            grade.totalGrade === null
                              ? 'text-gray-400 bg-gray-50'
                              : grade.totalGrade >= 90
                                ? 'text-green-600 bg-green-50'
                                : grade.totalGrade >= 70
                                  ? 'text-blue-600 bg-blue-50'
                                  : grade.totalGrade >= 60
                                    ? 'text-yellow-600 bg-yellow-50'
                                    : 'text-red-600 bg-red-50'
                          }`}
                        >
                          {grade.totalGrade !== null ? grade.totalGrade : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{grade.comment || '-'}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ClipboardList className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p>No hay calificaciones registradas para este curso</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

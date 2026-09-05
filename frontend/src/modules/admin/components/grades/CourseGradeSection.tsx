import { Card, CardContent, Badge, Spinner, Input, Button } from '@/shared/components/ui';
import { ChevronDown, ChevronRight, BookOpen, User, MessageSquare, Save, Users } from 'lucide-react';
import { useCourseGradeSection } from '../../hooks/useCourseGradeSection';
import type { CourseWithGrades } from '../../hooks/useAdminGrades';
import type { StudentGradeWithDetails } from '@/shared/types';

interface CourseGradeSectionProps {
  course: CourseWithGrades;
  periodId: number;
  isExpanded: boolean;
  onToggle: () => void;
  editingGrades: Map<string, { totalGrade: number | null; comment: string | null }>;
  setEditingGrades: React.Dispatch<
    React.SetStateAction<Map<string, { totalGrade: number | null; comment: string | null }>>
  >;
}

export function CourseGradeSection({
  course,
  periodId,
  isExpanded,
  onToggle,
  editingGrades,
  setEditingGrades,
}: CourseGradeSectionProps) {
  const {
    grades,
    gradesLoading,
    updateGradeMutation,
    handleGradeChange,
    handleSave,
    hasChanges,
    getGradeColor,
  } = useCourseGradeSection(course, periodId, isExpanded, editingGrades, setEditingGrades);

  return (
    <Card>
      <CardContent className="p-0">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={onToggle}
        >
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{course.courseName}</h3>
              <p className="text-sm text-gray-500">
                {course.courseShortname} • {course.studentCount} estudiantes • {course.gradedCount} calificados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={course.gradedCount === course.studentCount ? 'success' : 'secondary'}>
              {course.gradedCount}/{course.studentCount}
            </Badge>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t">
            {gradesLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : grades && grades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">
                        Estudiante
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-32">
                        Acumulado
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-32">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">
                        Comentario
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {grades.map((grade: StudentGradeWithDetails) => {
                      const key = `${course.courseMoodleId}-${grade.studentId}`;
                      const editData = editingGrades.get(key);
                      const displayTotal = editData !== undefined ? editData.totalGrade : grade.totalGrade;
                      const displayComment = editData?.comment ?? grade.comment;

                      return (
                        <tr key={grade.studentId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-gray-100 rounded-full">
                                <User className="h-4 w-4 text-gray-600" />
                              </div>
                              <span className="font-medium text-gray-900 text-sm">
                                {grade.studentName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{grade.studentEmail}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-gray-600">
                              {grade.moodleSumGrade !== null ? grade.moodleSumGrade.toFixed(1) : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              value={displayTotal ?? ''}
                              onChange={(e) =>
                                handleGradeChange(
                                  grade.studentId,
                                  'totalGrade',
                                  e.target.value === '' ? null : Number(e.target.value)
                                )
                              }
                              className={`w-20 text-center ${getGradeColor(displayTotal)}`}
                              placeholder="-"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <Input
                                value={displayComment || ''}
                                onChange={(e) => handleGradeChange(grade.studentId, 'comment', e.target.value)}
                                placeholder="Sin comentario"
                                className="text-sm"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleSave(grade.studentId)}
                              disabled={!hasChanges(grade.studentId) || updateGradeMutation.isPending}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No hay estudiantes con calificaciones en este curso</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

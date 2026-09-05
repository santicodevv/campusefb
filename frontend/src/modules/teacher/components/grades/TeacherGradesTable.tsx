
import { User, Calculator, CheckCircle, MessageSquare, Lock, Save } from 'lucide-react';
import { Card, CardContent, Input, Badge, Button } from '@/shared/components/ui';
import type { StudentGradeWithDetails } from '@/shared/types';
import { getGradeColor } from '@/shared/lib/utils';

interface TeacherGradesTableProps {
  studentGrades: StudentGradeWithDetails[];
  localEdits: Map<number, { totalGrade?: number | null; comment?: string | null }>;
  handleGradeChange: (studentId: number, field: 'totalGrade' | 'comment', value: string) => void;
  handleSave: (studentId: number) => void;
  updateGradeMutation: { isPending: boolean };
}

export function TeacherGradesTable({ studentGrades, localEdits, handleGradeChange, handleSave, updateGradeMutation }: TeacherGradesTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {studentGrades && studentGrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    <div className="flex flex-col items-center">
                      <Calculator className="h-4 w-4 mb-1" />
                      <span>Sumatoria Moodle</span>
                      <span className="text-gray-400 font-normal">(Solo lectura)</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    <div className="flex flex-col items-center">
                      <CheckCircle className="h-4 w-4 mb-1" />
                      <span>Nota Final</span>
                      <span className="text-gray-400 font-normal">(0-10)</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    <div className="flex flex-col items-center">
                      <MessageSquare className="h-4 w-4 mb-1" />
                      <span>Comentario</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {studentGrades.map((student: StudentGradeWithDetails) => {
                  const localEdit = localEdits.get(student.studentId);
                  const displayTotal = localEdit !== undefined && localEdit.totalGrade !== undefined ? localEdit.totalGrade : student.totalGrade;
                  const displayComment = localEdit?.comment ?? student.comment ?? '';
                  const hasLocalEdit = localEdit !== undefined;
                  const isLocked = student.totalGrade !== null && !hasLocalEdit;

                  return (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded-full">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{student.studentName}</p>
                            <p className="text-xs text-gray-500">{student.studentEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium text-lg ${getGradeColor(student.moodleSumGrade !== null ? Math.round(student.moodleSumGrade * 10) : null)}`}>
                          {student.moodleSumGrade !== null ? student.moodleSumGrade.toFixed(1) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLocked ? (
                          <span className={`font-bold text-lg ${getGradeColor(student.totalGrade !== null ? Math.round(student.totalGrade * 10) : null)}`}>{student.totalGrade}</span>
                        ) : (
                          <Input
                            type="number"
                            value={displayTotal ?? ''}
                            onChange={(e) => handleGradeChange(student.studentId, 'totalGrade', e.target.value)}
                            min={0}
                            max={10}
                            step={0.1}
                            className="w-24 text-center mx-auto"
                            placeholder="-"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isLocked ? (
                          <span className="text-sm text-gray-700">{student.comment || '-'}</span>
                        ) : (
                          <Input
                            type="text"
                            value={displayComment}
                            onChange={(e) => handleGradeChange(student.studentId, 'comment', e.target.value)}
                            className="w-full min-w-[200px]"
                            placeholder="Agregar comentario..."
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLocked ? (
                          <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" /> Calificado</Badge>
                        ) : (
                          <>
                            {hasLocalEdit && (
                              <Button size="sm" onClick={() => handleSave(student.studentId)} disabled={updateGradeMutation.isPending}>
                                <Save className="h-4 w-4 mr-1" /> Guardar
                              </Button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay estudiantes en este curso para el periodo seleccionado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

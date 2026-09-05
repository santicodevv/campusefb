
import { User, Save, Lock, ClipboardList, Trash2 } from 'lucide-react';
import { Card, CardContent, Input, Badge, Button } from '@/shared/components/ui';
import { getGradeColor } from '@/shared/lib/utils';
import type { CourseGradesResponse } from '@/modules/teacher/types/grade.types';

interface GradeEntryTableProps {
  data: CourseGradesResponse;
  localEdits: Map<string, { grade?: number }>;
  handleGradeChange: (studentMoodleId: number, itemMoodleId: number, value: string, gradeMax: number) => void;
  handleSaveGrade: (studentMoodleId: number, itemMoodleId: number) => void;
  saveGrade: { isPending: boolean };
  deleteGrade: { mutate: (editId: number) => void; isPending: boolean } | null;
  isEditingEnabled: boolean;
}

export function GradeEntryTable({ data, localEdits, handleGradeChange, handleSaveGrade, saveGrade, deleteGrade, isEditingEnabled }: GradeEntryTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {data.participants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                    Estudiante
                  </th>
                  {data.gradeItems.map((item) => (
                    <th key={item.itemMoodleId} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[140px]">
                      <div className="flex flex-col items-center">
                        <span className="truncate max-w-[120px]" title={item.itemName}>{item.itemName}</span>
                        <span className="text-gray-400 font-normal">(max: {item.gradeMax})</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.participants.map((participant) => (
                  <tr key={participant.studentMoodleId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 sticky left-0 bg-white">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 rounded-full">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{participant.studentName}</p>
                          <p className="text-xs text-gray-500">{participant.studentEmail}</p>
                        </div>
                      </div>
                    </td>
                    {participant.grades.map((grade) => {
                      const key = `${participant.studentMoodleId}-${grade.itemMoodleId}`;
                      const localEdit = localEdits.get(key);
                      const displayGrade = localEdit?.grade ?? grade.editedGrade ?? grade.moodleGrade;
                      const hasLocalEdit = localEdit !== undefined;
                      const canEdit = isEditingEnabled && grade.editable;

                      return (
                        <td key={grade.itemMoodleId} className="px-4 py-3 text-center">
                          {canEdit ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  value={localEdit?.grade ?? displayGrade ?? ''}
                                  onChange={(e) => handleGradeChange(participant.studentMoodleId, grade.itemMoodleId, e.target.value, grade.gradeMax)}
                                  min={0}
                                  max={grade.gradeMax}
                                  step={0.01}
                                  className="w-20 text-center text-sm"
                                  placeholder="-"
                                />
                                {hasLocalEdit && (
                                  <Button size="sm" variant="primary" onClick={() => handleSaveGrade(participant.studentMoodleId, grade.itemMoodleId)} disabled={saveGrade.isPending}>
                                    <Save className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              {grade.moodleGrade !== null && <span className="text-xs text-gray-400">Original: {grade.moodleGrade}</span>}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${getGradeColor(displayGrade !== null ? Math.round((displayGrade / grade.gradeMax) * 100) : null)}`}>
                                  {displayGrade !== null ? displayGrade : '-'}
                                </span>
                                {grade.wasEdited && deleteGrade && grade.editId != null && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700" 
                                    onClick={() => deleteGrade.mutate(grade.editId!)}
                                    disabled={deleteGrade.isPending}
                                    title="Revertir edición"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              {grade.wasEdited && <Badge variant="secondary" className="text-xs mt-1 bg-yellow-100 text-yellow-800 border-yellow-200"><Lock className="h-3 w-3 mr-1" /> Editada</Badge>}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay estudiantes matriculados en este curso</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

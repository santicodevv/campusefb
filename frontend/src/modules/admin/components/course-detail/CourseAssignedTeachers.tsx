import { Card, CardContent, Button, Badge, Spinner } from '@/shared/components/ui';
import { UserCheck, Plus, Star, Trash2 } from 'lucide-react';
import type { CourseTeacher } from '@/shared/types';
import type { UseMutationResult } from '@tanstack/react-query';

interface CourseAssignedTeachersProps {
  assignedTeachers: CourseTeacher[] | undefined;
  teachersLoading: boolean;
  setShowAddTeacherModal: (val: boolean) => void;
  setPrimaryMutation: UseMutationResult<unknown, Error, number>;
  removeTeacherMutation: UseMutationResult<unknown, Error, number>;
}

export function CourseAssignedTeachers({
  assignedTeachers,
  teachersLoading,
  setShowAddTeacherModal,
  setPrimaryMutation,
  removeTeacherMutation,
}: CourseAssignedTeachersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            <UserCheck className="h-5 w-5 inline mr-2" />
            Gestionar Profesores Asignados
          </h3>
          <Button size="sm" onClick={() => setShowAddTeacherModal(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar Profesor
          </Button>
        </div>

        {teachersLoading ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : assignedTeachers && assignedTeachers.length > 0 ? (
          <div className="space-y-2">
            {assignedTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <UserCheck className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {teacher.teacher?.displayName ||
                          teacher.teacher?.email ||
                          `ID: ${teacher.teacherId}`}
                      </p>
                      {teacher.isPrimary && (
                        <Badge variant="warning" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Principal
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {teacher.teacher?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!teacher.isPrimary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrimaryMutation.mutate(teacher.teacherId)}
                      disabled={setPrimaryMutation.isPending}
                      title="Establecer como principal"
                    >
                      <Star className="h-4 w-4 text-yellow-500" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (window.confirm('¿Remover este profesor del curso?')) {
                        removeTeacherMutation.mutate(teacher.teacherId);
                      }
                    }}
                    disabled={removeTeacherMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <UserCheck className="h-10 w-10 mx-auto text-gray-300 mb-2" />
            <p>No hay profesores asignados a este curso</p>
            <p className="text-sm">Haz clic en "Agregar Profesor" para asignar uno</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

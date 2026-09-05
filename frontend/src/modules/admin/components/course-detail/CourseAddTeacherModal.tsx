import { Button, Input } from '@/shared/components/ui';
import { Search, X, UserCheck, Plus } from 'lucide-react';
import type { TeacherUser } from '../../types/user.types';
import type { UseMutationResult } from '@tanstack/react-query';

interface CourseAddTeacherModalProps {
  showAddTeacherModal: boolean;
  setShowAddTeacherModal: (val: boolean) => void;
  teacherSearch: string;
  setTeacherSearch: (val: string) => void;
  availableTeachers: TeacherUser[];
  assignTeacherMutation: UseMutationResult<unknown, Error, number>;
}

export function CourseAddTeacherModal({
  showAddTeacherModal,
  setShowAddTeacherModal,
  teacherSearch,
  setTeacherSearch,
  availableTeachers,
  assignTeacherMutation,
}: CourseAddTeacherModalProps) {
  if (!showAddTeacherModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Agregar Profesor</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowAddTeacherModal(false);
              setTeacherSearch('');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar profesor..."
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {availableTeachers.length > 0 ? (
            availableTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer"
                onClick={() => {
                  assignTeacherMutation.mutate(teacher.id);
                  setShowAddTeacherModal(false);
                  setTeacherSearch('');
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{teacher.displayName || teacher.email}</p>
                    <p className="text-sm text-gray-500">{teacher.email}</p>
                  </div>
                </div>
                <Plus className="h-4 w-4 text-blue-600" />
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay profesores disponibles para agregar
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setShowAddTeacherModal(false);
              setTeacherSearch('');
            }}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

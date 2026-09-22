import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Spinner } from '@/shared/components/ui';
import { Search, X, GraduationCap, Plus, UserPlus } from 'lucide-react';
import { coursesApi } from '@/shared/api';
import type { UseMutationResult } from '@tanstack/react-query';

interface CourseAddStudentModalProps {
  courseId: number;
  showModal: boolean;
  setShowModal: (val: boolean) => void;
  enrollStudentMutation: UseMutationResult<unknown, Error, number>;
}

export function CourseAddStudentModal({
  courseId,
  showModal,
  setShowModal,
  enrollStudentMutation,
}: CourseAddStudentModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: students, isLoading } = useQuery({
    queryKey: ['search-students-not-enrolled', courseId, debouncedSearch],
    queryFn: () => coursesApi.searchStudentsNotEnrolled(courseId, debouncedSearch, 20),
    enabled: showModal && debouncedSearch.length >= 2,
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    // Simple debounce
    setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  const handleClose = () => {
    setShowModal(false);
    setSearch('');
    setDebouncedSearch('');
  };

  const handleEnroll = (userMoodleId: number) => {
    enrollStudentMutation.mutate(userMoodleId);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-violet-600" />
            Agregar Estudiante
          </h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, usuario o email..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Escribe al menos 2 caracteres para buscar
          </p>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : debouncedSearch.length < 2 ? (
            <div className="text-center py-8 text-gray-500">
              <GraduationCap className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Busca estudiantes para inscribir</p>
            </div>
          ) : students && students.length > 0 ? (
            students.map((student) => (
              <div
                key={student.moodleId}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 cursor-pointer transition-colors"
                onClick={() => handleEnroll(student.moodleId)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <GraduationCap className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {student.firstname} {student.lastname}
                    </p>
                    <p className="text-sm text-gray-500">
                      @{student.username} · {student.email}
                    </p>
                  </div>
                </div>
                <Plus className="h-4 w-4 text-green-600" />
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No se encontraron estudiantes disponibles
            </p>
          )}
        </div>

        {enrollStudentMutation.isPending && (
          <div className="mt-4 flex items-center justify-center gap-2 text-violet-600">
            <Spinner />
            <span className="text-sm">Inscribiendo estudiante...</span>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

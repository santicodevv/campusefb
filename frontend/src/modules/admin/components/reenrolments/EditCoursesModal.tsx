import { Button, Spinner } from '@/shared/components/ui';
import { X, BookOpen, Minus, Plus } from 'lucide-react';
import type { ReEnrolmentRequest } from '@/shared/types';
import type { PeriodAvailableCourse } from '@/modules/admin/types/period.types';
import type { UseMutationResult } from '@tanstack/react-query';

interface EditCoursesModalProps {
  editCoursesModalOpen: boolean;
  setEditCoursesModalOpen: (open: boolean) => void;
  selectedRequest: ReEnrolmentRequest;
  availableCourses: PeriodAvailableCourse[];
  adminRemoveCoursesMutation: UseMutationResult<unknown, Error, { id: number; courseMoodleIds: number[] }, unknown>;
  adminAddCoursesMutation: UseMutationResult<unknown, Error, { id: number; courses: { courseMoodleId: number }[] }, unknown>;
}

export function EditCoursesModal({
  editCoursesModalOpen,
  setEditCoursesModalOpen,
  selectedRequest,
  availableCourses,
  adminRemoveCoursesMutation,
  adminAddCoursesMutation,
}: EditCoursesModalProps) {
  if (!editCoursesModalOpen || !selectedRequest) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Editar Cursos de la Solicitud</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditCoursesModalOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Cursos Actuales ({selectedRequest.lines?.length || 0})
          </h4>
          {selectedRequest.lines && selectedRequest.lines.length > 0 ? (
            <div className="space-y-2">
              {selectedRequest.lines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BookOpen className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {line.courseName || `Curso ID: ${line.courseMoodleId}`}
                      </p>
                      <p className="text-xs text-gray-500">ID: {line.courseMoodleId}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() =>
                      adminRemoveCoursesMutation.mutate({
                        id: selectedRequest.id,
                        courseMoodleIds: [Number(line.courseMoodleId)],
                      })
                    }
                    disabled={adminRemoveCoursesMutation.isPending}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No hay cursos en esta solicitud</p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Agregar Cursos Disponibles</h4>
          {availableCourses && availableCourses.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableCourses
                .filter(
                  (course) =>
                    !selectedRequest.lines?.some(
                      (line) => Number(line.courseMoodleId) === Number(course.courseMoodleId)
                    )
                )
                .map((course) => (
                  <div
                    key={course.courseMoodleId}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{course.courseName}</p>
                        <p className="text-xs text-gray-500">ID: {course.courseMoodleId}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() =>
                        adminAddCoursesMutation.mutate({
                          id: selectedRequest.id,
                          courses: [{ courseMoodleId: Number(course.courseMoodleId) }],
                        })
                      }
                      disabled={adminAddCoursesMutation.isPending}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              {availableCourses.filter(
                (course) =>
                  !selectedRequest.lines?.some(
                    (line) => Number(line.courseMoodleId) === Number(course.courseMoodleId)
                  )
              ).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Todos los cursos disponibles ya están en la solicitud
                </p>
              )}
            </div>
          ) : (
            <div className="flex justify-center py-4">
              <Spinner className="h-6 w-6" />
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => setEditCoursesModalOpen(false)}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

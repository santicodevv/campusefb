import { Card, CardContent, Spinner, Badge, Button } from '@/shared/components/ui';
import { BookOpen, AlertCircle, ChevronRight, CheckCircle, Trash2, Plus, Send } from 'lucide-react';
import type { AcademicPeriod } from '@/shared/types';
import type { PeriodAvailableCourse } from '@/modules/admin/types/period.types';
import type { ReEnrolmentRequest } from '@/shared/types';
import type { ViewMode } from '../../hooks/useStudentReEnrolment';
import type { UseMutationResult } from '@tanstack/react-query';

type ApiError = { response?: { data?: { message?: string } } };

interface SelectCoursesViewProps {
  selectedPeriod: AcademicPeriod;
  setViewMode: (mode: ViewMode) => void;
  setSelectedPeriod: (period: AcademicPeriod | null) => void;
  setSelectedCourses: (courses: number[]) => void;
  existingDraft: ReEnrolmentRequest | null | undefined;
  loadingCourses: boolean;
  availableCourses?: PeriodAvailableCourse[];
  selectedCourses: number[];
  alreadyRequestedCourses: Set<number>;
  handleToggleCourse: (id: number) => void;
  handleSaveDraft: () => void;
  handleSubmit: () => void;
  deleteMutation: UseMutationResult<unknown, ApiError, number, unknown>;
  createMutation: UseMutationResult<unknown, ApiError, { periodId: number; courses: { courseMoodleId: number }[] }, unknown>;
  updateMutation: UseMutationResult<unknown, ApiError, { id: number; courses: { courseMoodleId: number }[] }, unknown>;
  submitMutation: UseMutationResult<unknown, ApiError, number, unknown>;
}

export function SelectCoursesView({
  selectedPeriod,
  setViewMode,
  setSelectedPeriod,
  setSelectedCourses,
  existingDraft,
  loadingCourses,
  availableCourses,
  selectedCourses,
  alreadyRequestedCourses,
  handleToggleCourse,
  handleSaveDraft,
  handleSubmit,
  deleteMutation,
  createMutation,
  updateMutation,
  submitMutation,
}: SelectCoursesViewProps) {
  return (
    <div>
      <div className="mb-6">
        <button
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          onClick={() => {
            setViewMode('periods');
            setSelectedPeriod(null);
            setSelectedCourses([]);
          }}
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Volver a períodos
        </button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedPeriod.name}</h2>
              <p className="text-gray-500">Selecciona los cursos en los que deseas inscribirte</p>
            </div>
            {existingDraft && <Badge variant="secondary">Borrador guardado</Badge>}
          </div>
        </CardContent>
      </Card>

      {loadingCourses ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : availableCourses && availableCourses.length > 0 ? (
        <>
          <div className="grid gap-3 mb-6">
            {availableCourses.map((course) => {
              const isSelected = selectedCourses.includes(course.courseMoodleId);
              const isAlreadyRequested = alreadyRequestedCourses.has(Number(course.courseMoodleId));
              const isDisabled = isAlreadyRequested;

              return (
                <Card
                  key={course.id}
                  className={`transition-all ${
                    isDisabled
                      ? 'opacity-60 cursor-not-allowed bg-gray-50'
                      : isSelected
                      ? 'ring-2 ring-blue-500 bg-blue-50 cursor-pointer'
                      : 'hover:shadow-md cursor-pointer'
                  }`}
                  onClick={() => !isDisabled && handleToggleCourse(course.courseMoodleId)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isAlreadyRequested
                            ? 'bg-green-600 border-green-600'
                            : isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {(isSelected || isAlreadyRequested) && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <span className={`font-medium ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                            {course.courseName || `Curso ${course.courseMoodleId}`}
                          </span>
                          {isAlreadyRequested && (
                            <Badge variant="success" className="ml-2">
                              Ya solicitado
                            </Badge>
                          )}
                        </div>
                        {course.courseShortname && (
                          <p className="text-sm text-gray-500 ml-6">{course.courseShortname}</p>
                        )}
                      </div>
                      {course.maxStudents && (
                        <div className="text-sm text-gray-500">
                          {course.enrolledCount}/{course.maxStudents} inscritos
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="sticky bottom-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Cursos seleccionados</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedCourses.length}</p>
                </div>
                <div className="flex gap-3">
                  {existingDraft && (
                    <Button
                      variant="outline"
                      onClick={() => deleteMutation.mutate(existingDraft.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar borrador
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={selectedCourses.length === 0 || createMutation.isPending || updateMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Guardar borrador
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={selectedCourses.length === 0 || submitMutation.isPending || createMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar solicitud
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <AlertCircle className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No hay cursos disponibles</p>
              <p className="text-sm">No hay cursos habilitados para este período</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { Card, CardContent, Button, Input, Spinner } from '@/shared/components/ui';
import { BookOpen, CheckCircle, XCircle, Trash2, ChevronRight, Plus } from 'lucide-react';
import type { AcademicPeriod } from '@/shared/types';
import type { PeriodAvailableCourse } from '@/modules/admin/types/period.types';
import type { MoodleCourse } from '../../hooks/useAdminPeriods';
import type { UseMutationResult } from '@tanstack/react-query';

interface PeriodCoursesViewProps {
  selectedPeriod: AcademicPeriod;
  setViewMode: (mode: 'list' | 'detail' | 'courses') => void;
  loadingAvailableCourses: boolean;
  availableCourses: PeriodAvailableCourse[] | undefined;
  toggleCourseMutation: UseMutationResult<unknown, Error, { periodId: number; courseMoodleId: number; enabled: boolean }, unknown>;
  removeCoursesMutation: UseMutationResult<unknown, Error, { periodId: number; courseMoodleIds: number[] }, unknown>;
  courseSearch: string;
  setCourseSearch: (val: string) => void;
  loadingMoodleCourses: boolean;
  coursesToShow: MoodleCourse[] | undefined;
  selectedCoursesToAdd: number[];
  setSelectedCoursesToAdd: React.Dispatch<React.SetStateAction<number[]>>;
  handleAddCourses: () => void;
  addCoursesMutation: UseMutationResult<unknown, Error, { periodId: number; courses: { courseMoodleId: number; courseName?: string; courseShortname?: string; categoryMoodleId?: number }[] }, unknown>;
}

export function PeriodCoursesView({
  selectedPeriod,
  setViewMode,
  loadingAvailableCourses,
  availableCourses,
  toggleCourseMutation,
  removeCoursesMutation,
  courseSearch,
  setCourseSearch,
  loadingMoodleCourses,
  coursesToShow,
  selectedCoursesToAdd,
  setSelectedCoursesToAdd,
  handleAddCourses,
  addCoursesMutation,
}: PeriodCoursesViewProps) {
  return (
    <div>
      <button
        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mb-6"
        onClick={() => setViewMode('detail')}
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        Volver al período
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cursos disponibles para {selectedPeriod.name}</h2>
          <p className="text-gray-500">Agrega o quita cursos que estarán disponibles para reinscripción</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cursos Habilitados</h3>
            {loadingAvailableCourses ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : availableCourses && availableCourses.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableCourses.map((course) => (
                  <div
                    key={course.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      course.enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {course.courseName || `Curso ${course.courseMoodleId}`}
                        </p>
                        {course.courseShortname && (
                          <p className="text-sm text-gray-500">{course.courseShortname}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleCourseMutation.mutate({
                            periodId: selectedPeriod.id,
                            courseMoodleId: course.courseMoodleId,
                            enabled: !course.enabled,
                          })
                        }
                      >
                        {course.enabled ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeCoursesMutation.mutate({
                            periodId: selectedPeriod.id,
                            courseMoodleIds: [Number(course.courseMoodleId)],
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay cursos habilitados para este período</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Agregar Cursos</h3>
            <Input
              placeholder="Buscar curso..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              className="mb-4"
            />
            {loadingMoodleCourses ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : coursesToShow && coursesToShow.length > 0 ? (
              <>
                <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
                  {coursesToShow.map((course) => {
                    const isSelected = selectedCoursesToAdd.includes(course.moodleId);
                    return (
                      <div
                        key={course.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                        }`}
                        onClick={() =>
                          setSelectedCoursesToAdd((prev) =>
                            isSelected ? prev.filter((id) => id !== course.moodleId) : [...prev, course.moodleId],
                          )
                        }
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {course.subjectName || course.fullname}
                          </p>
                          <p className="text-sm text-gray-500">{course.shortname}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button
                  onClick={handleAddCourses}
                  disabled={selectedCoursesToAdd.length === 0 || addCoursesMutation.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar {selectedCoursesToAdd.length} curso(s)
                </Button>
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay más cursos disponibles para agregar</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

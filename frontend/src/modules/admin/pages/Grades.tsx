import { Card, CardContent, Spinner } from '@/shared/components/ui';
import { ClipboardList, GraduationCap } from 'lucide-react';
import { useAdminGrades } from '../hooks/useAdminGrades';
import { AdminGradesHeader } from '../components/grades/AdminGradesHeader';
import { AdminGradesPeriodSelector } from '../components/grades/AdminGradesPeriodSelector';
import { AdminGradesStats } from '../components/grades/AdminGradesStats';
import { CourseGradeSection } from '../components/grades/CourseGradeSection';

export default function AdminGrades() {
  const {
    periods,
    periodsLoading,
    effectivePeriodId,
    handlePeriodChange,
    courses,
    coursesLoading,
    totalStudents,
    totalGraded,
    expandedCourses,
    toggleCourse,
    editingGrades,
    setEditingGrades,
  } = useAdminGrades();

  if (periodsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <AdminGradesHeader />

      <AdminGradesPeriodSelector
        effectivePeriodId={effectivePeriodId}
        handlePeriodChange={handlePeriodChange}
        periods={periods}
      />

      {effectivePeriodId && courses && (
        <AdminGradesStats
          coursesCount={courses.length}
          totalStudents={totalStudents}
          totalGraded={totalGraded}
        />
      )}

      {effectivePeriodId && (
        <>
          {coursesLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : courses && courses.length > 0 ? (
            <div className="space-y-4">
              {courses.map((course) => (
                <CourseGradeSection
                  key={course.courseMoodleId}
                  course={course}
                  periodId={effectivePeriodId}
                  isExpanded={expandedCourses.has(course.courseMoodleId)}
                  onToggle={() => toggleCourse(course.courseMoodleId)}
                  editingGrades={editingGrades}
                  setEditingGrades={setEditingGrades}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No hay calificaciones registradas para este período</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!effectivePeriodId && (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Selecciona un período académico para ver las calificaciones</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/shared/components/ui';
import { useTeacherGrades } from '@/modules/teacher/hooks/useTeacherGrades';
import { TeacherGradesHeader } from '../components/grades/TeacherGradesHeader';
import { TeacherGradesFilters } from '../components/grades/TeacherGradesFilters';
import { TeacherGradesTable } from '../components/grades/TeacherGradesTable';
import { TeacherGradesLegend } from '../components/grades/TeacherGradesLegend';
import { TeacherGradesError } from '../components/grades/TeacherGradesError';

export default function TeacherGrades() {
  const navigate = useNavigate();
  const gradesHook = useTeacherGrades();

  const isLoading = gradesHook.periodsLoading || gradesHook.gradesLoading;

  const handleBack = () => navigate('/teacher/courses');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (gradesHook.error) {
    return <TeacherGradesError onBack={handleBack} />;
  }

  const {
    periods,
    setSelectedPeriodId,
    effectivePeriodId,
    studentGrades,
    localEdits,
    updateGradeMutation,
    handleGradeChange,
    handleSave,
  } = gradesHook;

  const courseName = studentGrades?.[0]?.courseName || 'Curso';
  const courseShortname = studentGrades?.[0]?.courseShortname || '';

  return (
    <div className="p-6">
      <TeacherGradesHeader courseName={courseName} courseShortname={courseShortname} />
      <TeacherGradesFilters
        periods={periods ?? []}
        effectivePeriodId={effectivePeriodId ?? null}
        setSelectedPeriodId={setSelectedPeriodId}
      />
      <TeacherGradesTable
        studentGrades={studentGrades ?? []}
        localEdits={localEdits as Map<number, { totalGrade?: number | null; comment?: string | null }>}
        handleGradeChange={handleGradeChange}
        handleSave={handleSave}
        updateGradeMutation={updateGradeMutation}
      />
      <TeacherGradesLegend />
    </div>
  );
}

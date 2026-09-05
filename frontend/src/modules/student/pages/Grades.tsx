import { Spinner } from '@/shared/components/ui';
import { useStudentGrades } from '../hooks/useStudentGrades';
import { StudentGradesHeader } from '../components/grades/StudentGradesHeader';
import { StudentGradesFilter } from '../components/grades/StudentGradesFilter';
import { StudentGradesStats } from '../components/grades/StudentGradesStats';
import { StudentGradesTable } from '../components/grades/StudentGradesTable';
import { StudentGradesEmpty } from '../components/grades/StudentGradesEmpty';

export default function StudentGrades() {
  const {
    selectedPeriodId,
    setSelectedPeriodId,
    myPeriods,
    periodsLoading,
    grades,
    isLoading,
    stats,
  } = useStudentGrades();

  return (
    <div className="p-6">
      <StudentGradesHeader />
      
      <StudentGradesFilter
        selectedPeriodId={selectedPeriodId}
        setSelectedPeriodId={setSelectedPeriodId}
        myPeriods={myPeriods}
        periodsLoading={periodsLoading}
      />

      {!isLoading && grades && grades.length > 0 && (
        <StudentGradesStats stats={stats} />
      )}

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Spinner />
        </div>
      ) : grades && grades.length > 0 ? (
        <StudentGradesTable grades={grades} selectedPeriodId={selectedPeriodId} />
      ) : (
        <StudentGradesEmpty />
      )}
    </div>
  );
}

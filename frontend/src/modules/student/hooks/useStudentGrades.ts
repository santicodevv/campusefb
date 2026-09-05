import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gradesApi } from '@/modules/teacher/api/grades.api';
import type { StudentCourseGrade } from '@/shared/types';

export function useStudentGrades() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);

  // Fetch periods where I have grades
  const { data: myPeriods, isLoading: periodsLoading } = useQuery({
    queryKey: ['my-periods-with-grades'],
    queryFn: () => gradesApi.getMyPeriodsWithGrades(),
  });

  // Fetch my grades filtered by period only (no course filter)
  const { data: grades, isLoading: gradesLoading } = useQuery({
    queryKey: ['my-grades', selectedPeriodId],
    queryFn: () => gradesApi.getMyGrades(selectedPeriodId || undefined, undefined),
    enabled: true,
  });

  const isLoading = periodsLoading || gradesLoading;

  // Calculate statistics with useMemo
  const stats = useMemo(() => {
    const gradedCourses = grades?.filter((g: StudentCourseGrade) => g.totalGrade !== null) || [];
    const averageGrade = gradedCourses.length > 0
      ? gradedCourses.reduce((sum: number, g: StudentCourseGrade) => sum + (g.totalGrade || 0), 0) / gradedCourses.length
      : null;

    return {
      totalCourses: grades?.length || 0,
      gradedCourses: gradedCourses.length,
      averageGrade,
    };
  }, [grades]);

  return {
    selectedPeriodId,
    setSelectedPeriodId,
    myPeriods,
    periodsLoading,
    grades,
    gradesLoading,
    isLoading,
    stats,
  };
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gradesApi, periodsApi } from '@/shared/api';

export interface CourseWithGrades {
  courseMoodleId: number;
  courseName: string;
  courseShortname: string;
  studentCount: number;
  gradedCount: number;
}

export function useAdminGrades() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set());
  const [editingGrades, setEditingGrades] = useState<
    Map<string, { totalGrade: number | null; comment: string | null }>
  >(new Map());

  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ['periods'],
    queryFn: () => periodsApi.getAll(),
  });

  const activePeriod = periods?.find((p) => p.status === 'open');
  const effectivePeriodId = selectedPeriodId ?? activePeriod?.id;

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['period-courses-grades', effectivePeriodId],
    queryFn: () => gradesApi.getCoursesWithGradesForPeriod(effectivePeriodId!),
    enabled: !!effectivePeriodId,
  });

  const totalStudents = courses?.reduce((sum, c) => sum + c.studentCount, 0) || 0;
  const totalGraded = courses?.reduce((sum, c) => sum + c.gradedCount, 0) || 0;

  const toggleCourse = (courseMoodleId: number) => {
    setExpandedCourses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseMoodleId)) {
        newSet.delete(courseMoodleId);
      } else {
        newSet.add(courseMoodleId);
      }
      return newSet;
    });
  };

  const handlePeriodChange = (periodId: number | null) => {
    setSelectedPeriodId(periodId);
    setExpandedCourses(new Set());
    setEditingGrades(new Map());
  };

  return {
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
  };
}

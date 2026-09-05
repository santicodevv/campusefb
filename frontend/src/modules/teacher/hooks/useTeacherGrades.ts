
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gradesApi } from '@/modules/teacher/api/grades.api';
import { periodsApi } from '@/modules/admin/api/periods.api';
import toast from 'react-hot-toast';
import type { UpdateStudentGradeDto } from '@/shared/types';

export function useTeacherGrades() {
  const { courseId } = useParams<{ courseId: string }>();
  const queryClient = useQueryClient();

  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [localEdits, setLocalEdits] = useState<Map<number, UpdateStudentGradeDto>>(new Map());

  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ['periods'],
    queryFn: () => periodsApi.getAll(),
  });

  const activePeriod = periods?.find((p) => p.status === 'open');
  const effectivePeriodId = selectedPeriodId ?? activePeriod?.id;

  const {
    data: studentGrades,
    isLoading: gradesLoading,
    error,
  } = useQuery({
    queryKey: ['teacher-student-grades', courseId, effectivePeriodId],
    queryFn: () => gradesApi.getStudentGradesByCourse(Number(courseId), effectivePeriodId!),
    enabled: !!courseId && !!effectivePeriodId,
  });

  const updateGradeMutation = useMutation({
    mutationFn: async ({ studentId, data }: { studentId: number; data: UpdateStudentGradeDto }) => {
      return gradesApi.updateStudentGrade(Number(courseId), studentId, effectivePeriodId!, data);
    },
    onSuccess: (_, variables) => {
      setLocalEdits((prev) => {
        const newMap = new Map(prev);
        newMap.delete(variables.studentId);
        return newMap;
      });
      queryClient.invalidateQueries({ queryKey: ['teacher-student-grades', courseId, effectivePeriodId] });
      toast.success('Calificacion guardada');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al guardar');
    },
  });

  const handleGradeChange = (studentId: number, field: 'totalGrade' | 'comment', value: string) => {
    setLocalEdits((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(studentId) || {};

      if (field === 'totalGrade') {
        const numValue = value === '' ? null : parseFloat(value);
        if (numValue !== null) {
          if (isNaN(numValue) || numValue < 0 || numValue > 10) {
            toast.error('Solo se permite calificaciones del 0 - 10');
            return prev;
          }
        }
        newMap.set(studentId, { ...existing, totalGrade: numValue });
      } else {
        newMap.set(studentId, { ...existing, comment: value });
      }

      return newMap;
    });
  };

  const handleSave = (studentId: number) => {
    const edit = localEdits.get(studentId);
    if (!edit) return;
    updateGradeMutation.mutate({ studentId, data: edit });
  };

  return {
    courseId,
    periods,
    periodsLoading,
    selectedPeriodId,
    setSelectedPeriodId,
    effectivePeriodId,
    studentGrades,
    gradesLoading,
    error,
    localEdits,
    updateGradeMutation,
    handleGradeChange,
    handleSave,
  };
}

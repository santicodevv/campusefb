
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gradesApi } from '@/modules/teacher/api/grades.api';
import { periodsApi } from '@/modules/admin/api/periods.api';
import { api } from '@/shared/lib';
import toast from 'react-hot-toast';
import type { UpdateStudentGradeDto } from '@/shared/types';

export function useTeacherGrades() {
  const { courseId } = useParams<{ courseId: string }>();
  const queryClient = useQueryClient();

  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [localEdits, setLocalEdits] = useState<Map<number, UpdateStudentGradeDto>>(new Map());
  // Estudiante cuya nota ya registrada se está corrigiendo (pide motivo antes de guardar)
  const [correctionStudentId, setCorrectionStudentId] = useState<number | null>(null);

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

  const { data: editSessionStatus } = useQuery<{ isActive: boolean }>({
    queryKey: ['edit-session-status'],
    queryFn: async () => {
      const response = await api.get('/grades/edit-session/status');
      return response.data;
    },
  });
  const isEditingEnabled = editSessionStatus?.isActive ?? false;

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
      setCorrectionStudentId(null);
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
          if (isNaN(numValue) || numValue < 0 || numValue > 100) {
            toast.error('Solo se permite calificaciones del 0 - 100');
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
    const saved = studentGrades?.find((s) => s.studentId === studentId);
    if (saved?.totalGrade != null) {
      setCorrectionStudentId(studentId);
      return;
    }
    updateGradeMutation.mutate({ studentId, data: edit });
  };

  const handleConfirmCorrection = (reason: string) => {
    if (correctionStudentId === null) return;
    const edit = localEdits.get(correctionStudentId);
    if (!edit) return;
    updateGradeMutation.mutate({ studentId: correctionStudentId, data: { ...edit, reason } });
  };

  const correctionStudent = studentGrades?.find((s) => s.studentId === correctionStudentId) ?? null;

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
    isEditingEnabled,
    correctionStudent,
    correctionGrade: correctionStudentId !== null ? localEdits.get(correctionStudentId)?.totalGrade : undefined,
    handleConfirmCorrection,
    cancelCorrection: () => setCorrectionStudentId(null),
  };
}

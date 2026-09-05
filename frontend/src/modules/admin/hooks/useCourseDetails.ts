import { useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Course } from '@/modules/admin/types/course.types';

interface UseCourseDetailsProps {
  selectedCourse: Course | null;
  updateSubjectNameMutation: UseMutationResult<unknown, unknown, { id: number; subjectName: string }>;
  updateCodeMutation: UseMutationResult<unknown, unknown, { id: number; code: string }>;
  deleteMutation: UseMutationResult<unknown, unknown, number>;
}

export function useCourseDetails({
  selectedCourse,
  updateSubjectNameMutation,
  updateCodeMutation,
  deleteMutation
}: UseCourseDetailsProps) {
  const [editingSubjectName, setEditingSubjectName] = useState(false);
  const [subjectNameValue, setSubjectNameValue] = useState('');
  const [editingCode, setEditingCode] = useState(false);
  const [codeValue, setCodeValue] = useState('');

  const [prevCourseId, setPrevCourseId] = useState<number | undefined>(selectedCourse?.id);

  if (selectedCourse?.id !== prevCourseId) {
    setPrevCourseId(selectedCourse?.id);
    setEditingSubjectName(false);
    setEditingCode(false);
  }

  const handleEditSubjectName = () => {
    setSubjectNameValue(selectedCourse?.subjectName || '');
    setEditingSubjectName(true);
  };

  const handleSaveSubjectName = () => {
    if (!selectedCourse) return;
    updateSubjectNameMutation.mutate(
      { id: selectedCourse.id, subjectName: subjectNameValue },
      { onSuccess: () => setEditingSubjectName(false) }
    );
  };

  const handleCancelSubjectName = () => setEditingSubjectName(false);

  const handleEditCode = () => {
    setCodeValue(selectedCourse?.code || '');
    setEditingCode(true);
  };

  const handleSaveCode = () => {
    if (!selectedCourse) return;
    updateCodeMutation.mutate(
      { id: selectedCourse.id, code: codeValue },
      { onSuccess: () => setEditingCode(false) }
    );
  };

  const handleCancelCode = () => setEditingCode(false);

  const handleDelete = () => {
    if (!selectedCourse) return;
    if (confirm('¿Eliminar este curso? Se eliminara solo de la base de datos local, no de Moodle.')) {
      deleteMutation.mutate(selectedCourse.id);
    }
  };

  return {
    editingSubjectName,
    subjectNameValue,
    setSubjectNameValue,
    handleEditSubjectName,
    handleSaveSubjectName,
    handleCancelSubjectName,
    
    editingCode,
    codeValue,
    setCodeValue,
    handleEditCode,
    handleSaveCode,
    handleCancelCode,
    
    handleDelete
  };
}

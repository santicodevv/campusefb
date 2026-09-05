
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/axios';
import { coursesApi } from '@/shared/api';
import type { Course, CoursesResponse } from '@/modules/admin/types/course.types';
import toast from 'react-hot-toast';

export function useCourses() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const limit = 20;

  const updateSubjectNameMutation = useMutation({
    mutationFn: ({ id, subjectName }: { id: number; subjectName: string }) =>
      coursesApi.updateSubjectName(id, subjectName),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      if (selectedCourse) {
        setSelectedCourse({
          ...selectedCourse,
          subjectName: updated.subjectName,
        });
      }
      toast.success('Nombre de asignatura actualizado');
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const updateCodeMutation = useMutation({
    mutationFn: ({ id, code }: { id: number; code: string }) =>
      coursesApi.updateCode(id, code),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      if (selectedCourse) {
        setSelectedCourse({
          ...selectedCourse,
          code: updated.code,
        });
      }
      toast.success('Código actualizado');
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => coursesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setSelectedCourse(null);
      toast.success('Curso eliminado');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al eliminar curso');
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: (id: number) => coursesApi.toggleVisibility(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      if (selectedCourse && selectedCourse.id === updated.id) {
        setSelectedCourse({
          ...selectedCourse,
          visible: updated.visible,
        });
      }
      toast.success(
        updated.visible ? 'Curso habilitado en Moodle' : 'Curso deshabilitado en Moodle'
      );
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al cambiar visibilidad');
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses', page, search],
    queryFn: async () => {
      const response = await api.get<CoursesResponse>('/courses', {
        params: { page, limit, search: search || undefined },
      });
      return response.data;
    },
  });

  return {
    search, setSearch,
    page, setPage,
    limit,
    selectedCourse, setSelectedCourse,
    updateSubjectNameMutation,
    updateCodeMutation,
    deleteMutation,
    toggleVisibilityMutation,
    data, isLoading,
  };
}

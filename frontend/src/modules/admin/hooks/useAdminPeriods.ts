import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { periodsApi } from '@/shared/api';
import { api } from '@/shared/lib';
import toast from 'react-hot-toast';
import type { AcademicPeriod } from '@/shared/types';

export type ViewMode = 'list' | 'detail' | 'courses';

export interface MoodleCourse {
  id: number;
  moodleId: number;
  shortname: string;
  fullname: string;
  subjectName?: string;
  categoryId: number;
}

export interface ApiError {
  response?: {
    data?: {
      message?: string | string[];
      error?: string | string[];
    };
  };
}

export function useAdminPeriods() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showReenrolmentConfig, setShowReenrolmentConfig] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);

  const [editPeriodData, setEditPeriodData] = useState({
    id: 0,
    code: '',
    name: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const [newPeriod, setNewPeriod] = useState({
    code: '',
    name: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const [reenrolmentConfig, setReenrolmentConfig] = useState({
    reenrolmentStartDate: '',
    reenrolmentEndDate: '',
  });

  const [selectedCoursesToAdd, setSelectedCoursesToAdd] = useState<number[]>([]);

  // Queries
  const { data: periods, isLoading: loadingPeriods } = useQuery({
    queryKey: ['admin-periods'],
    queryFn: () => periodsApi.getAll(),
  });

  const { data: availableCourses, isLoading: loadingAvailableCourses } = useQuery({
    queryKey: ['period-available-courses', selectedPeriod?.id],
    queryFn: () => periodsApi.getAllAvailableCourses(selectedPeriod!.id),
    enabled: !!selectedPeriod && viewMode === 'courses',
  });

  const { data: moodleCourses, isLoading: loadingMoodleCourses } = useQuery({
    queryKey: ['moodle-courses'],
    queryFn: async () => {
      const response = await api.get<{ courses: MoodleCourse[]; total: number }>('/courses', {
        params: { limit: 1000 },
      });
      return response.data.courses;
    },
    enabled: viewMode === 'courses',
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: typeof newPeriod) => periodsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-periods'] });
      setShowCreateForm(false);
      setNewPeriod({
        code: '',
        name: '',
        startDate: '',
        endDate: '',
        description: '',
      });
      toast.success('Período creado');
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error al crear período';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const configReenrolmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof reenrolmentConfig }) =>
      periodsApi.configureReenrolment(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-periods'] });
      setSelectedPeriod(updated);
      setShowReenrolmentConfig(false);
      toast.success('Configuración de reinscripción actualizada');
    },
    onError: (error: ApiError) => {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al guardar la configuración de reinscripción';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const openReenrolmentMutation = useMutation({
    mutationFn: (id: number) => periodsApi.openReenrolment(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-periods'] });
      setSelectedPeriod(updated);
      toast.success('Reinscripción abierta');
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error al abrir reinscripción';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const closeReenrolmentMutation = useMutation({
    mutationFn: (id: number) => periodsApi.closeReenrolment(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-periods'] });
      setSelectedPeriod(updated);
      toast.success('Reinscripción cerrada');
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error al cerrar reinscripción';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const openPeriodMutation = useMutation({
    mutationFn: (id: number) => periodsApi.open(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-periods'] });
      setSelectedPeriod(updated);
      toast.success('Período abierto');
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const closePeriodMutation = useMutation({
    mutationFn: (id: number) => periodsApi.close(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-periods'] });
      setSelectedPeriod(updated);
      toast.success('Período cerrado');
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const addCoursesMutation = useMutation({
    mutationFn: ({ periodId, courses }: { periodId: number; courses: { courseMoodleId: number; courseName?: string; courseShortname?: string; categoryMoodleId?: number }[] }) =>
      periodsApi.addAvailableCourses(periodId, { courses }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-available-courses'] });
      setSelectedCoursesToAdd([]);
      toast.success('Cursos agregados');
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error al agregar cursos';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const removeCoursesMutation = useMutation({
    mutationFn: ({ periodId, courseMoodleIds }: { periodId: number; courseMoodleIds: number[] }) =>
      periodsApi.removeAvailableCourses(periodId, courseMoodleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-available-courses'] });
      toast.success('Curso eliminado');
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error al eliminar';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const toggleCourseMutation = useMutation({
    mutationFn: ({
      periodId,
      courseMoodleId,
      enabled,
    }: {
      periodId: number;
      courseMoodleId: number;
      enabled: boolean;
    }) => periodsApi.updateAvailableCourse(periodId, courseMoodleId, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-available-courses'] });
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const updatePeriodMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof editPeriodData }) =>
      periodsApi.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-periods'] });
      setSelectedPeriod(updated);
      setShowEditForm(false);
      toast.success('Período actualizado con éxito');
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error al actualizar período';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const deletePeriodMutation = useMutation({
    mutationFn: (id: number) => periodsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-periods'] });
      setViewMode('list');
      setSelectedPeriod(null);
      toast.success('Período eliminado');
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error al eliminar período';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const handleSelectPeriod = (period: AcademicPeriod) => {
    setSelectedPeriod(period);
    setReenrolmentConfig({
      reenrolmentStartDate: period.reenrolmentStartDate?.split('T')[0] || '',
      reenrolmentEndDate: period.reenrolmentEndDate?.split('T')[0] || '',
    });
    setViewMode('detail');
  };

  const handleAddCourses = () => {
    if (!selectedPeriod || selectedCoursesToAdd.length === 0) return;

    const courses = selectedCoursesToAdd.map((moodleId) => {
      const course = moodleCourses?.find((c) => c.moodleId === moodleId);
      return {
        courseMoodleId: moodleId,
        courseName: course?.subjectName || course?.fullname,
        courseShortname: course?.shortname,
        categoryMoodleId: course?.categoryId,
      };
    });

    addCoursesMutation.mutate({ periodId: selectedPeriod.id, courses });
  };

  const coursesToShow = moodleCourses
    ?.filter((c) => !availableCourses?.some((ac) => ac.courseMoodleId === c.moodleId))
    ?.filter((c) => {
      if (!courseSearch) return true;
      const q = courseSearch.toLowerCase();
      return (
        c.fullname.toLowerCase().includes(q) ||
        c.shortname.toLowerCase().includes(q) ||
        (c.subjectName && c.subjectName.toLowerCase().includes(q))
      );
    });

  return {
    viewMode,
    setViewMode,
    selectedPeriod,
    setSelectedPeriod,
    showCreateForm,
    setShowCreateForm,
    showReenrolmentConfig,
    setShowReenrolmentConfig,
    courseSearch,
    setCourseSearch,
    showEditForm,
    setShowEditForm,
    editPeriodData,
    setEditPeriodData,
    newPeriod,
    setNewPeriod,
    reenrolmentConfig,
    setReenrolmentConfig,
    selectedCoursesToAdd,
    setSelectedCoursesToAdd,
    periods,
    loadingPeriods,
    availableCourses,
    loadingAvailableCourses,
    moodleCourses,
    loadingMoodleCourses,
    createMutation,
    configReenrolmentMutation,
    openReenrolmentMutation,
    closeReenrolmentMutation,
    openPeriodMutation,
    closePeriodMutation,
    addCoursesMutation,
    removeCoursesMutation,
    toggleCourseMutation,
    updatePeriodMutation,
    deletePeriodMutation,
    handleSelectPeriod,
    handleAddCourses,
    coursesToShow,
  };
}

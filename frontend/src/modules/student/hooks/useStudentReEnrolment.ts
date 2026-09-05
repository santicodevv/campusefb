import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { periodsApi, reenrolmentsApi } from '@/shared/api';
import toast from 'react-hot-toast';
import type { AcademicPeriod, ReEnrolmentRequest } from '@/shared/types';

export type ViewMode = 'periods' | 'select-courses' | 'history';

export function useStudentReEnrolment() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('periods');
  const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);

  // Períodos con reinscripción abierta
  const { data: openPeriods, isLoading: loadingPeriods } = useQuery({
    queryKey: ['periods-open-reenrolment'],
    queryFn: () => periodsApi.getOpenForReenrolment(),
  });

  // Solicitudes del estudiante
  const { data: myRequests, isLoading: loadingRequests } = useQuery({
    queryKey: ['my-reenrolments'],
    queryFn: () => reenrolmentsApi.getMine(),
  });

  // Cursos disponibles del período seleccionado
  const { data: availableCourses, isLoading: loadingCourses } = useQuery({
    queryKey: ['available-courses', selectedPeriod?.id],
    queryFn: () => periodsApi.getAvailableCourses(selectedPeriod!.id),
    enabled: !!selectedPeriod,
  });

  // Borrador existente del período seleccionado
  const { data: existingDraft } = useQuery({
    queryKey: ['my-draft', selectedPeriod?.id],
    queryFn: async () => {
      const draft = await reenrolmentsApi.getMyDraft(selectedPeriod!.id);
      return draft;
    },
    enabled: !!selectedPeriod,
  });

  // Mutaciones
  const createMutation = useMutation({
    mutationFn: (data: { periodId: number; courses: { courseMoodleId: number }[] }) =>
      reenrolmentsApi.create({ ...data, notes: '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reenrolments'] });
      queryClient.invalidateQueries({ queryKey: ['my-draft'] });
      toast.success('Solicitud creada');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al crear solicitud');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, courses }: { id: number; courses: { courseMoodleId: number }[] }) =>
      reenrolmentsApi.update(id, { courses }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reenrolments'] });
      queryClient.invalidateQueries({ queryKey: ['my-draft'] });
      toast.success('Solicitud actualizada');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: number) => reenrolmentsApi.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reenrolments'] });
      queryClient.invalidateQueries({ queryKey: ['my-draft'] });
      toast.success('Solicitud enviada para revisión');
      setViewMode('history');
      setSelectedPeriod(null);
      setSelectedCourses([]);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al enviar');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => reenrolmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reenrolments'] });
      queryClient.invalidateQueries({ queryKey: ['my-draft'] });
      toast.success('Borrador eliminado');
      setSelectedCourses([]);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    },
  });

  // Handlers
  const handleSelectPeriod = (period: AcademicPeriod) => {
    setSelectedPeriod(period);
    setSelectedCourses([]);
    setViewMode('select-courses');
    // Attempt to load draft courses from cache
    const cachedDraft = queryClient.getQueryData<ReEnrolmentRequest>(['my-draft', period.id]);
    if (cachedDraft?.lines && cachedDraft.lines.length > 0) {
      const draftCourseIds = cachedDraft.lines.map((l) => l.courseMoodleId);
      if (draftCourseIds.length > 0) {
        setSelectedCourses(draftCourseIds);
      }
    }
  };

  const handleToggleCourse = (courseMoodleId: number) => {
    setSelectedCourses((prev) =>
      prev.includes(courseMoodleId)
        ? prev.filter((id) => id !== courseMoodleId)
        : [...prev, courseMoodleId]
    );
  };

  const handleSaveDraft = async () => {
    if (!selectedPeriod) return;

    const courses = selectedCourses.map((id) => ({ courseMoodleId: id }));

    if (existingDraft) {
      updateMutation.mutate({ id: existingDraft.id, courses });
    } else {
      createMutation.mutate({ periodId: selectedPeriod.id, courses });
    }
  };

  const handleSubmit = async () => {
    if (!existingDraft && !selectedCourses.length) {
      toast.error('Selecciona al menos un curso');
      return;
    }

    if (!existingDraft) {
      const courses = selectedCourses.map((id) => ({ courseMoodleId: id }));
      const created = await reenrolmentsApi.create({
        periodId: selectedPeriod!.id,
        courses,
        notes: '',
      });
      submitMutation.mutate(created.id);
    } else {
      if (selectedCourses.length > 0) {
        const courses = selectedCourses.map((id) => ({ courseMoodleId: id }));
        await reenrolmentsApi.update(existingDraft.id, { courses });
      }
      submitMutation.mutate(existingDraft.id);
    }
  };



  const getAlreadyRequestedCourses = (): Set<number> => {
    if (!selectedPeriod || !myRequests) return new Set();

    const requestedCourses = new Set<number>();
    const relevantRequests = myRequests.filter(
      (r) =>
        r.periodId === selectedPeriod.id &&
        ['submitted', 'approved', 'applied'].includes(r.status)
    );
    for (const request of relevantRequests) {
      for (const line of request.lines || []) {
        requestedCourses.add(Number(line.courseMoodleId));
      }
    }

    return requestedCourses;
  };

  return {
    viewMode,
    setViewMode,
    selectedPeriod,
    setSelectedPeriod,
    selectedCourses,
    setSelectedCourses,
    openPeriods,
    loadingPeriods,
    myRequests,
    loadingRequests,
    availableCourses,
    loadingCourses,
    existingDraft,
    handleSelectPeriod,
    handleToggleCourse,
    handleSaveDraft,
    handleSubmit,
    deleteMutation,
    createMutation,
    updateMutation,
    submitMutation,
    alreadyRequestedCourses: getAlreadyRequestedCourses(),
  };
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reenrolmentsApi, periodsApi } from '@/shared/api';
import type { ReEnrolmentRequest, ReEnrolmentStatus } from '@/shared/types';
import toast from 'react-hot-toast';
export interface ApiError {
  response?: {
    data?: {
      message?: string | string[];
      error?: string | string[];
    };
  };
}

export type ViewMode = 'list' | 'detail';

export function useAdminReEnrolments() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRequest, setSelectedRequest] = useState<ReEnrolmentRequest | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReEnrolmentStatus | 'all'>('submitted');
  const [periodFilter, setPeriodFilter] = useState<number | 'all'>('all');
  
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  
  const [editCoursesModalOpen, setEditCoursesModalOpen] = useState(false);

  const { data: periods } = useQuery({
    queryKey: ['periods-for-filter'],
    queryFn: () => periodsApi.getAll(),
  });

  const { data: stats } = useQuery({
    queryKey: ['reenrolment-stats', periodFilter],
    queryFn: () => reenrolmentsApi.getStats(periodFilter !== 'all' ? periodFilter : undefined),
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-reenrolments', statusFilter, periodFilter, search],
    queryFn: async () => {
      // Obtenemos todas las solicitudes para asegurar que los filtros funcionen correctamente
      let data = await reenrolmentsApi.getAll();

      // Filtro por período
      if (periodFilter !== 'all') {
        data = data.filter((r) => r.periodId === periodFilter);
      }

      // Filtro por estado
      if (statusFilter !== 'all') {
        data = data.filter((r) => r.status?.toLowerCase() === statusFilter.toLowerCase());
      } else {
        data = data.filter((r) => r.status?.toLowerCase() !== 'draft');
      }

      // Filtro de búsqueda
      if (search) {
        const searchLower = search.toLowerCase();
        data = data.filter(
          (r) =>
            r.student?.displayName?.toLowerCase().includes(searchLower) ||
            r.student?.email?.toLowerCase().includes(searchLower) ||
            r.period?.name?.toLowerCase().includes(searchLower) ||
            r.period?.code?.toLowerCase().includes(searchLower),
        );
      }
      return data;
    },
  });

  const applyMutation = useMutation({
    mutationFn: (id: number) => reenrolmentsApi.applyToMoodle(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reenrolments'] });
      queryClient.invalidateQueries({ queryKey: ['reenrolment-stats'] });
      toast.success('Solicitud aplicada e inscrita en Moodle correctamente');
      if (data) setSelectedRequest(data);
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error al aplicar la solicitud a Moodle';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => reenrolmentsApi.approve(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reenrolments'] });
      queryClient.invalidateQueries({ queryKey: ['reenrolment-stats'] });
      toast.success('Solicitud aprobada (pendiente de pago/aplicación)');
      if (data) setSelectedRequest(data);
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error al aprobar la solicitud';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => reenrolmentsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reenrolments'] });
      queryClient.invalidateQueries({ queryKey: ['reenrolment-stats'] });
      toast.success('Solicitud rechazada');
      setRejectModalOpen(false);
      setRejectReason('');
      setRejectingId(null);
      if (selectedRequest) {
        setSelectedRequest({ ...selectedRequest, status: 'rejected' });
      }
    },
    onError: () => toast.error('Error al rechazar la solicitud'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => reenrolmentsApi.adminDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reenrolments'] });
      queryClient.invalidateQueries({ queryKey: ['reenrolment-stats'] });
      toast.success('Solicitud eliminada');
      if (selectedRequest) {
        setViewMode('list');
        setSelectedRequest(null);
      }
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error al eliminar';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const { data: availableCourses } = useQuery({
    queryKey: ['available-courses', selectedRequest?.periodId],
    queryFn: () => periodsApi.getAvailableCourses(selectedRequest!.periodId),
    enabled: editCoursesModalOpen && !!selectedRequest?.periodId,
  });

  const adminAddCoursesMutation = useMutation({
    mutationFn: ({ id, courses }: { id: number; courses: { courseMoodleId: number }[] }) =>
      reenrolmentsApi.adminAddCourses(id, courses),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reenrolments'] });
      toast.success('Cursos agregados correctamente');
      if (data) setSelectedRequest(data);
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error al agregar cursos';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const adminRemoveCoursesMutation = useMutation({
    mutationFn: ({ id, courseMoodleIds }: { id: number; courseMoodleIds: number[] }) =>
      reenrolmentsApi.adminRemoveCourses(id, courseMoodleIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reenrolments'] });
      toast.success('Curso eliminado correctamente');
      if (data) setSelectedRequest(data);
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error al eliminar curso';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const openRejectModal = (id: number) => {
    setRejectingId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = () => {
    if (rejectingId && rejectReason.trim()) {
      rejectMutation.mutate({ id: rejectingId, reason: rejectReason.trim() });
    }
  };

  const viewDetail = (request: ReEnrolmentRequest) => {
    setSelectedRequest(request);
    setViewMode('detail');
  };

  const backToList = () => {
    setViewMode('list');
    setSelectedRequest(null);
  };

  return {
    viewMode,
    selectedRequest,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    periodFilter,
    setPeriodFilter,
    rejectModalOpen,
    setRejectModalOpen,
    rejectReason,
    setRejectReason,
    editCoursesModalOpen,
    setEditCoursesModalOpen,
    periods,
    stats,
    requests,
    isLoading,
    approveMutation,
    applyMutation,
    rejectMutation,
    deleteMutation,
    availableCourses,
    adminAddCoursesMutation,
    adminRemoveCoursesMutation,
    openRejectModal,
    handleReject,
    viewDetail,
    backToList,
  };
}

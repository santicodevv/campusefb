import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib';
import toast from 'react-hot-toast';
export interface ApiError { response?: { data?: { message?: string | string[]; error?: string | string[]; }; }; }

export interface SyncState {
  entity: string;
  lastCheckpoint?: string;
  lastSyncedAt?: string;
}

export interface SyncStatus {
  states: SyncState[];
  isRunning: boolean;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  moodleConnected: boolean;
  responseTimeMs: number;
  coursesAvailable?: number;
  error?: string;
  checkedAt: string;
}

export interface IntegrationStatus {
  moodle: {
    status: string;
    coursesInMoodle: number;
  };
  mirror: {
    users: number;
    categories: number;
    courses: number;
    enrolments: number;
    gradeItems: number;
    grades: number;
  };
  syncStates: SyncState[];
  generatedAt: string;
}

export interface ReconcileResult {
  success: boolean;
  message: string;
  before: Record<string, number>;
  after: Record<string, number>;
  differences: Record<string, number>;
  completedAt: string;
}

export function useAdminSync() {
  const queryClient = useQueryClient();
  const [showReconcileResult, setShowReconcileResult] = useState<ReconcileResult | null>(null);

  const { data: syncStatus, isLoading: syncLoading } = useQuery({
    queryKey: ['sync-status'],
    queryFn: async () => {
      const response = await api.get<SyncStatus>('/sync/status');
      return response.data;
    },
    refetchInterval: 5000,
  });

  const { data: healthStatus, isLoading: healthLoading } = useQuery({
    queryKey: ['moodle-health'],
    queryFn: async () => {
      const response = await api.get<HealthStatus>('/integrations/moodle/health');
      return response.data;
    },
    refetchInterval: 30000,
  });

  const { data: integrationStatus, isLoading: integrationLoading } = useQuery({
    queryKey: ['integration-status'],
    queryFn: async () => {
      const response = await api.get<IntegrationStatus>('/integrations/moodle/status');
      return response.data;
    },
    refetchInterval: 10000,
  });

  const triggerAllMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/sync/trigger');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['integration-status'] });
      toast.success('Sincronización completa iniciada');
    },
    onError: () => toast.error('Error al iniciar sincronización'),
  });

  const triggerEntityMutation = useMutation({
    mutationFn: async (entity: string) => {
      const response = await api.post(`/sync/trigger/${entity.toLowerCase()}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['integration-status'] });
      toast.success('Sincronización de entidad iniciada');
    },
    onError: () => toast.error('Error al iniciar sincronización'),
  });

  const bootstrapMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/integrations/moodle/sync/bootstrap');
      return response.data;
    },
    onSuccess: (data: { syncedCounts?: { users?: number; courses?: number } }) => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['integration-status'] });
      toast.success(`Bootstrap completado: ${data.syncedCounts?.users || 0} usuarios, ${data.syncedCounts?.courses || 0} cursos`);
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error en bootstrap';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<ReconcileResult>('/integrations/moodle/sync/reconcile');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['integration-status'] });
      setShowReconcileResult(data);
      toast.success('Reconciliación completada');
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error en reconciliación';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const fixTeachersMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/sync/fix-teachers');
      return response.data;
    },
    onSuccess: (data: { results?: { teacherRolesAssigned?: number; courseTeachersCreated?: number } }) => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      toast.success(
        `Profesores corregidos: ${data.results?.teacherRolesAssigned || 0} roles, ${data.results?.courseTeachersCreated || 0} asignaciones`
      );
    },
    onError: (error: ApiError) => {
      const msg = error.response?.data?.message || 'Error al corregir profesores';
      toast.error(Array.isArray(msg) ? msg[0] : msg as string);
    },
  });

  const isAnyMutationPending =
    triggerAllMutation.isPending ||
    bootstrapMutation.isPending ||
    reconcileMutation.isPending ||
    fixTeachersMutation.isPending;

  return {
    showReconcileResult,
    setShowReconcileResult,
    syncStatus,
    syncLoading,
    healthStatus,
    healthLoading,
    integrationStatus,
    integrationLoading,
    triggerAllMutation,
    triggerEntityMutation,
    bootstrapMutation,
    reconcileMutation,
    fixTeachersMutation,
    isAnyMutationPending,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers';
import { api } from '@/shared/lib';
import type { DashboardStats, RecentActivity, ActiveStudent } from '@/modules/admin/types/dashboard.types';
import toast from 'react-hot-toast';

export function useAdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get<DashboardStats>('/reports/global/summary');
      return response.data;
    },
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const response = await api.get<RecentActivity[]>('/audit', {
        params: { limit: 5 },
      });
      return response.data;
    },
  });

  const { data: pendingReenrolments } = useQuery({
    queryKey: ['pending-reenrolments'],
    queryFn: async () => {
      const response = await api.get<unknown[]>('/re-enrolments/pending');
      return response.data;
    },
  });

  const { data: editSessionStatus } = useQuery({
    queryKey: ['edit-session-status'],
    queryFn: async () => {
      const response = await api.get<{ isActive: boolean }>('/grades/edit-session/status');
      return response.data;
    },
  });

  const { data: activeStudents, isLoading: studentsLoading } = useQuery({
    queryKey: ['active-students'],
    queryFn: async () => {
      const response = await api.get<ActiveStudent[]>('/reports/global/active-students', {
        params: { limit: 8 },
      });
      return response.data;
    },
  });

  const toggleEditSession = useMutation<unknown, Error, void>({
    mutationFn: async () => {
      const response = await api.post('/grades/edit-session/toggle');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['edit-session-status'] });
      toast.success((data as { message?: string }).message || 'Estado actualizado');
    },
    onError: () => {
      toast.error('Error al cambiar el estado');
    },
  });

  const pendingReenrolmentsCount = Array.isArray(pendingReenrolments) ? pendingReenrolments.length : '-';

  return {
    user,
    stats,
    statsLoading,
    recentActivity,
    activityLoading,
    pendingReenrolmentsCount,
    editSessionStatus,
    activeStudents,
    studentsLoading,
    toggleEditSession,
  };
}

export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Sin acceso';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return `${diffSeconds} segundos`;
  } else if (diffMinutes < 60) {
    const secs = diffSeconds % 60;
    return secs > 0 ? `${diffMinutes} min ${secs} seg` : `${diffMinutes} minutos`;
  } else if (diffHours < 24) {
    const mins = diffMinutes % 60;
    return mins > 0 ? `${diffHours} hora${diffHours > 1 ? 's' : ''} ${mins} min` : `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  } else {
    return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
  }
}

export function getInitials(firstname: string, lastname: string): string {
  const first = firstname?.charAt(0)?.toUpperCase() || '';
  const last = lastname?.charAt(0)?.toUpperCase() || '';
  return first + last || '??';
}

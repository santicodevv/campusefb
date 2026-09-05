import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib';
import type { AuditLog } from '@/modules/admin/types/audit.types';

export function useAdminAudit() {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search, entityFilter],
    queryFn: async () => {
      const response = await api.get<AuditLog[]>('/audit', {
        params: {
          limit: page * limit,
          entity: entityFilter || undefined,
        },
      });
      return response.data;
    },
  });

  // Get unique entities for filter
  const entities = logs
    ? [...new Set(logs.map((log) => log.entity))].sort()
    : [];

  // Filter logs based on search
  const filteredLogs = logs?.filter((log) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.entity.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.entityKey.toLowerCase().includes(searchLower) ||
      log.actor?.email.toLowerCase().includes(searchLower) ||
      log.actor?.displayName.toLowerCase().includes(searchLower)
    );
  });

  return {
    search,
    setSearch,
    entityFilter,
    setEntityFilter,
    page,
    setPage,
    isLoading,
    entities,
    filteredLogs,
  };
}

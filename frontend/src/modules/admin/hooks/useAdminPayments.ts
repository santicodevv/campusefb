import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../api/payments.api';
import { buildPageRange } from '../hooks/useUsersTable';
import type { PaymentsQueryParams } from '../types/payment.types';

const DEFAULT_LIMIT = 12;

export function useAdminPayments() {
  const [filters, setFilters] = useState<PaymentsQueryParams>({
    page: 1,
    limit: DEFAULT_LIMIT,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-payments', filters],
    queryFn: () => paymentsApi.getDashboard(filters),
    select: (res) => res.data,
  });

  const { data: statsData } = useQuery({
    queryKey: ['admin-payments-stats'],
    queryFn: () => paymentsApi.getStats(),
    select: (res) => res.data,
    staleTime: 30000,
  });

  const updateFilters = useCallback((updates: Partial<PaymentsQueryParams>) => {
    setFilters((prev) => ({ ...prev, ...updates, page: updates.page ?? 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ page: 1, limit: DEFAULT_LIMIT });
  }, []);

  const total = data?.total ?? 0;
  const limit = data?.limit ?? DEFAULT_LIMIT;
  const page = data?.page ?? 1;

  const totalPages = useMemo(() => (limit > 0 ? Math.ceil(total / limit) : 1), [total, limit]);
  const pageRange = useMemo(() => buildPageRange(page, totalPages), [page, totalPages]);

  const setPage = useCallback((p: number) => {
    setFilters((prev) => ({ ...prev, page: p }));
  }, []);

  return {
    items: data?.items ?? [],
    stats: data?.stats ?? statsData,
    total,
    page,
    limit,
    totalPages,
    pageRange,
    setPage,
    isLoading,
    isError,
    error,
    filters,
    updateFilters,
    clearFilters,
    refetch,
  };
}

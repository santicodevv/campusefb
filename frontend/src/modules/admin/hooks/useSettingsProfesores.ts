import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/shared/lib';

export interface Teacher {
  id: number;
  email: string;
  displayName: string;
  moodleUserId?: number;
  isActive: boolean;
  createdAt: string;
}

export interface UsersResponse {
  users: Teacher[];
  total: number;
  page: number;
  limit: number;
}

export const PAGE_SIZE = 20;

export function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [];
  const around = new Set(
    [1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total),
  );
  let prev: number | null = null;
  for (const p of [...around].sort((a, b) => a - b)) {
    if (prev !== null && p - prev > 1) pages.push('...');
    pages.push(p);
    prev = p;
  }
  return pages;
}

export function useSettingsProfesores() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['settings-teachers', page, search],
    queryFn: async () => {
      const res = await api.get<UsersResponse>('/users', {
        params: { page, limit: PAGE_SIZE, search: search || undefined, role: 'TEACHER' },
      });
      return res.data;
    },
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;
  const pageRange = buildPageRange(page, totalPages);

  return {
    navigate,
    search,
    setSearch,
    page,
    setPage,
    data,
    isLoading,
    totalPages,
    pageRange,
  };
}

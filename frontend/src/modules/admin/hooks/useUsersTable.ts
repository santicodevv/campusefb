import { useState } from 'react';
import type { UsersResponse } from '@/modules/admin/types/user.types';

export const PAGE_SIZE_OPTIONS = [20, 50, 100, 0] as const;

export function getPageSizeLabel(size: number) {
  return size === 0 ? 'Todos' : String(size);
}

export function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [];
  const around = new Set([1, total, current - 1, current, current + 1].filter(p => p >= 1 && p <= total));
  let prev: number | null = null;
  for (const p of [...around].sort((a, b) => a - b)) {
    if (prev !== null && p - prev > 1) pages.push('...');
    pages.push(p);
    prev = p;
  }
  return pages;
}

export function useUsersTable(data: UsersResponse | undefined, limit: number, page: number, setPage: (page: number) => void) {
  const [jumpInput, setJumpInput] = useState('');

  const getRoleBadgeVariant = (code: string) => {
    switch (code) {
      case 'ADMIN': return 'default' as const;
      case 'TEACHER': return 'success' as const;
      case 'STUDENT': return 'info' as const;
      default: return 'secondary' as const;
    }
  };

  const getRoleName = (code: string) => {
    switch (code) {
      case 'ADMIN': return 'Administrador';
      case 'TEACHER': return 'Profesor';
      case 'STUDENT': return 'Estudiante';
      default: return code;
    }
  };

  const totalPages = data && limit > 0 ? Math.ceil(data.total / limit) : 1;
  const pageRange = buildPageRange(page, totalPages);

  const handleJumpPage = () => {
    const n = parseInt(jumpInput, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      setPage(n);
      setJumpInput('');
    }
  };

  return {
    jumpInput,
    setJumpInput,
    getRoleBadgeVariant,
    getRoleName,
    totalPages,
    pageRange,
    handleJumpPage,
  };
}

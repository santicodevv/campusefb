import { Card, CardContent, Input, Button } from '@/shared/components/ui';
import { Search, Filter } from 'lucide-react';
import type { ReEnrolmentStatus, AcademicPeriod } from '@/shared/types';

interface ReEnrolmentsFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  statusFilter: ReEnrolmentStatus | 'all';
  setStatusFilter: (status: ReEnrolmentStatus | 'all') => void;
  periodFilter: number | 'all';
  setPeriodFilter: (periodId: number | 'all') => void;
  periods?: AcademicPeriod[];
}

export function ReEnrolmentsFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  periodFilter,
  setPeriodFilter,
  periods,
}: ReEnrolmentsFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por estudiante o período..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={periodFilter}
                onChange={(e) =>
                  setPeriodFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
              >
                <option value="all">Todos los períodos</option>
                {periods?.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.code} - {period.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'submitted', 'approved', 'rejected', 'applied'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' && 'Todas'}
                {status === 'submitted' && 'Pendientes'}
                {status === 'approved' && 'Aprobadas'}
                {status === 'rejected' && 'Rechazadas'}
                {status === 'applied' && 'Aplicadas'}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

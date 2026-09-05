import { Input, Button } from '@/shared/components/ui';
import { Search, X } from 'lucide-react';
import type { PaymentsQueryParams, PaymentStatus } from '../../types/payment.types';

interface PaymentsFiltersProps {
  filters: PaymentsQueryParams;
  onFilterChange: (updates: Partial<PaymentsQueryParams>) => void;
  onClear: () => void;
}

const statusOptions: { value: PaymentStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'Pagado', label: 'Pagado' },
  { value: 'Parcial', label: 'Parcial' },
  { value: 'Pendiente', label: 'Pendiente' },
];

export function PaymentsFilters({ filters, onFilterChange, onClear }: PaymentsFiltersProps) {
  const hasFilters = filters.search || filters.status;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar estudiante o factura..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={(filters.status || '') === opt.value ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onFilterChange({ status: opt.value || undefined })}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  );
}

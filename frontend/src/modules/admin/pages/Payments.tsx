import { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAdminPayments } from '../hooks/useAdminPayments';
import { PaymentsHeader } from '../components/payments/PaymentsHeader';
import { PaymentsStatsCards } from '../components/payments/PaymentsStatsCards';
import { PaymentsFilters } from '../components/payments/PaymentsFilters';
import { PaymentsTable } from '../components/payments/PaymentsTable';
import { PaymentDetailModal } from '../components/payments/PaymentDetailModal';
import { PaymentsPagination } from '../components/payments/PaymentsPagination';
import { Alert, Button } from '@/shared/components/ui';
import type { PaymentDashboardItem } from '../types/payment.types';

export default function AdminPayments() {
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentDashboardItem | null>(null);

  const {
    items,
    stats,
    total,
    page,
    limit,
    totalPages,
    pageRange,
    isLoading,
    isError,
    filters,
    updateFilters,
    clearFilters,
    setPage,
    refetch,
  } = useAdminPayments();

  return (
    <div>
      <PaymentsHeader />

      <PaymentsStatsCards stats={stats} loading={isLoading} />

      {isError ? (
        <Alert variant="error" className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>Error al cargar datos de pagos. Verifica la conexión con EFB.</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reintentar
            </Button>
          </div>
        </Alert>
      ) : (
        <>
          <PaymentsFilters
            filters={filters}
            onFilterChange={updateFilters}
            onClear={clearFilters}
          />

          <div className="mb-2 text-sm text-gray-500">
            {total > 0 && `${total} factura${total !== 1 ? 's' : ''}`}
          </div>

          <PaymentsTable items={items} isLoading={isLoading} onViewDetail={setSelectedInvoice} />

          {!isLoading && items.length > 0 && (
            <PaymentsPagination
              page={page}
              totalPages={totalPages}
              pageRange={pageRange}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {selectedInvoice && (
        <PaymentDetailModal
          item={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}

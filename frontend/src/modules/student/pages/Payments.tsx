import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { studentPaymentsApi } from '../api/payments.api';
import { Alert, Badge, Button, Spinner } from '@/shared/components/ui';
import { PaymentDetailModal } from '@/modules/admin/components/payments/PaymentDetailModal';
import type { PaymentDashboardItem } from '@/modules/admin/types/payment.types';

function formatCurrency(amount: number): string {
  return `RD$${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' });
}

const statusBadge = {
  Pagado: 'success' as const,
  Parcial: 'warning' as const,
  Pendiente: 'danger' as const,
};

export default function StudentPayments() {
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentDashboardItem | null>(null);

  const { data: invoices, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-my-invoices'],
    queryFn: () => studentPaymentsApi.getMyInvoices(),
    select: (res) => res.data,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis Facturas</h1>
        <p className="text-sm text-gray-500 mt-1">Historial de facturación y pagos</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <Alert variant="error" className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>Error al cargar tus facturas. Intenta de nuevo.</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reintentar
            </Button>
          </div>
        </Alert>
      ) : !invoices || invoices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No tienes facturas registradas.</p>
          <p className="text-sm text-gray-400 mt-1">Las facturas aparecerán aquí cuando tengas pagos asociados a tu cuenta.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((item) => (
            <div
              key={item.invoiceId}
              onClick={() => setSelectedInvoice(item)}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.factura}</h3>
                  <p className="text-sm text-gray-500">{formatDate(item.fecha)}</p>
                  {item.moodleCode && (
                    <p className="text-xs text-gray-400 mt-0.5">ID: {item.moodleCode}</p>
                  )}
                </div>
                <Badge variant={statusBadge[item.estado]}>{item.estado}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Total facturado</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(item.total)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pagado</p>
                  <p className="font-semibold text-green-600">{formatCurrency(item.pagado)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pendiente</p>
                  <p className="font-semibold text-red-600">{formatCurrency(item.pendiente)}</p>
                </div>
              </div>

              {item.pagos.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">{item.pagos.length} pago{item.pagos.length !== 1 ? 's' : ''} realizado{item.pagos.length !== 1 ? 's' : ''}</p>
                </div>
              )}
            </div>
          ))}
        </div>
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
import { useState } from 'react';
import { Badge, Spinner } from '@/shared/components/ui';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import type { PaymentDashboardItem } from '../../types/payment.types';

interface PaymentsTableProps {
  items: PaymentDashboardItem[];
  isLoading: boolean;
  onViewDetail: (item: PaymentDashboardItem) => void;
}

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

export function PaymentsTable({ items, isLoading, onViewDetail }: PaymentsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No se encontraron facturas
      </div>
    );
  }

  const toggleExpand = (invoiceId: string) => {
    setExpandedRow(expandedRow === invoiceId ? null : invoiceId);
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-3 w-10"></th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factura</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pagado</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pendiente</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th className="px-2 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item, idx) => (
            <tr key={item.invoiceId + idx} className="hover:bg-gray-50 transition-colors">
              <td className="px-2 py-4">
                <button
                  onClick={() => toggleExpand(item.invoiceId)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Ver pagos"
                >
                  {expandedRow === item.invoiceId ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <div>{item.estudiante}</div>
                {item.moodleCode && (
                  <div className="text-xs text-gray-400 font-normal">ID: {item.moodleCode}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {item.factura}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                {formatCurrency(item.total)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                {formatCurrency(item.pagado)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-medium">
                {formatCurrency(item.pendiente)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <Badge variant={statusBadge[item.estado]}>
                  {item.estado}
                </Badge>
              </td>
              <td className="px-2 py-4">
                <button
                  onClick={() => onViewDetail(item)}
                  className="text-blue-500 hover:text-blue-700 transition-colors"
                  title="Ver detalle"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {expandedRow && (
        <ExpandedPayments items={items} expandedRow={expandedRow} />
      )}
    </div>
  );
}

function ExpandedPayments({ items, expandedRow }: { items: PaymentDashboardItem[]; expandedRow: string }) {
  const item = items.find((i) => i.invoiceId === expandedRow);
  if (!item || item.pagos.length === 0) {
    return (
      <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
        No hay pagos registrados para esta factura.
      </div>
    );
  }

  return (
    <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Pagos realizados</h4>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 uppercase">
            <th className="pb-1 pr-4">Monto</th>
            <th className="pb-1 pr-4">Método</th>
            <th className="pb-1 pr-4">Fecha</th>
            <th className="pb-1">Estado</th>
          </tr>
        </thead>
        <tbody>
          {item.pagos.map((p) => (
            <tr key={p.id} className="text-gray-700">
              <td className="py-1 pr-4 font-medium">{formatCurrency(p.monto)}</td>
              <td className="py-1 pr-4">{p.metodo}</td>
              <td className="py-1 pr-4">{formatDate(p.fecha)}</td>
              <td className="py-1">
                <Badge variant="success">{p.estado}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

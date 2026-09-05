import { Card, CardContent, Spinner } from '@/shared/components/ui';
import { DollarSign, CreditCard, AlertTriangle } from 'lucide-react';
import type { PaymentStats } from '../../types/payment.types';

interface PaymentsStatsCardsProps {
  stats?: PaymentStats | null;
  loading?: boolean;
}

function formatCurrency(amount: number): string {
  return `RD$${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PaymentsStatsCards({ stats, loading }: PaymentsStatsCardsProps) {
  const cards = [
    {
      label: 'Total Facturado',
      value: stats ? formatCurrency(stats.totalFacturado) : '-',
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Total Cobrado',
      value: stats ? formatCurrency(stats.totalCobrado) : '-',
      icon: CreditCard,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Total Pendiente',
      value: stats ? formatCurrency(stats.totalPendiente) : '-',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  const countCards = stats
    ? [
        { label: 'Pagadas', value: stats.facturasPagadas, color: 'text-green-700', bg: 'bg-green-50' },
        { label: 'Parciales', value: stats.facturasParciales, color: 'text-yellow-700', bg: 'bg-yellow-50' },
        { label: 'Pendientes', value: stats.facturasPendientes, color: 'text-red-700', bg: 'bg-red-50' },
      ]
    : [];

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <div className={`text-2xl font-bold ${card.color}`}>
                    {loading ? <Spinner size="sm" /> : card.value}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {countCards.length > 0 && (
        <div className="flex gap-4">
          {countCards.map((c) => (
            <div key={c.label} className={`px-4 py-2 rounded-lg ${c.bg}`}>
              <span className={`font-semibold ${c.color}`}>{c.value}</span>
              <span className="text-gray-500 ml-2 text-sm">{c.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { Card, CardContent, Spinner } from '@/shared/components/ui';
import { Users, RefreshCw } from 'lucide-react';
import type { DashboardStats } from '../../types/dashboard.types';

interface DashboardStatsGridProps {
  stats: DashboardStats | undefined;
  statsLoading: boolean;
  pendingReenrolmentsCount: number | string;
}

export function DashboardStatsGrid({ stats, statsLoading, pendingReenrolmentsCount }: DashboardStatsGridProps) {
  const statCards = [
    {
      label: 'Usuarios',
      value: stats?.totalUsers ?? '-',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },

    {
      label: 'Reinscripciones Pendientes',
      value: pendingReenrolmentsCount,
      icon: RefreshCw,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {statsLoading ? <Spinner size="sm" /> : stat.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { Card, CardContent } from '@/shared/components/ui';
import { BookOpen, ClipboardList, FileText, TrendingUp } from 'lucide-react';

export function StudentDashboardStats() {
  const stats = [
    {
      label: 'Cursos Activos',
      value: '-',
      icon: BookOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Promedio General',
      value: '-',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Calificaciones Pendientes',
      value: '-',
      icon: ClipboardList,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      label: 'Constancias Generadas',
      value: '-',
      icon: FileText,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

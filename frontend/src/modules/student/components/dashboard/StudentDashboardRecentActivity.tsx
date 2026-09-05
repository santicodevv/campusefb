import { Card, CardContent } from '@/shared/components/ui';

export function StudentDashboardRecentActivity() {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Actividad Reciente
        </h3>
        <p className="text-gray-500 text-center py-8">
          No hay actividad reciente
        </p>
      </CardContent>
    </Card>
  );
}

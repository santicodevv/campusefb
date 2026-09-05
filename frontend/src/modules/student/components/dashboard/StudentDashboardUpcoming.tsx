import { Card, CardContent } from '@/shared/components/ui';

export function StudentDashboardUpcoming() {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Próximas Entregas
        </h3>
        <p className="text-gray-500 text-center py-8">
          No hay entregas próximas
        </p>
      </CardContent>
    </Card>
  );
}

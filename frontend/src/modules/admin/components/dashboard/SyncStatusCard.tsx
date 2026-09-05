import { Card, CardContent, Badge } from '@/shared/components/ui';
import { Database } from 'lucide-react';
import type { DashboardStats } from '../../types/dashboard.types';

interface SyncStatusCardProps {
  stats: DashboardStats | undefined;
}

export function SyncStatusCard({ stats }: SyncStatusCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Estado de Sincronización</h3>
          <Badge variant="success">
            <Database className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Usuarios Moodle</span>
            <span className="text-gray-900 font-medium">{stats?.totalUsers ?? '-'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Cursos Sincronizados</span>
            <span className="text-gray-900 font-medium">{stats?.totalCourses ?? '-'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Inscripciones</span>
            <span className="text-gray-900 font-medium">{stats?.totalEnrolments ?? '-'}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Calificaciones</span>
            <span className="text-gray-900 font-medium">{stats?.totalGrades ?? '-'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

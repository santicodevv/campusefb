import { Card, CardContent } from '@/shared/components/ui';
import { Server, Users, BookOpen, UserPlus, ClipboardList, Activity, FolderTree } from 'lucide-react';
import type { IntegrationStatus } from '../../hooks/useAdminSync';

interface SyncMirrorStatsProps {
  integrationStatus?: IntegrationStatus;
  integrationLoading: boolean;
}

export function SyncMirrorStats({ integrationStatus, integrationLoading }: SyncMirrorStatsProps) {
  if (integrationLoading || !integrationStatus) return null;

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Datos en Mirror Local</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-600">{integrationStatus.mirror.users}</p>
            <p className="text-xs text-gray-500">Usuarios</p>
          </div>
          <div className="text-center p-3 bg-teal-50 rounded-lg">
            <FolderTree className="h-6 w-6 text-teal-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-teal-600">{integrationStatus.mirror.categories}</p>
            <p className="text-xs text-gray-500">Categorías</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <BookOpen className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">{integrationStatus.mirror.courses}</p>
            <p className="text-xs text-gray-500">Cursos</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <UserPlus className="h-6 w-6 text-purple-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-purple-600">{integrationStatus.mirror.enrolments}</p>
            <p className="text-xs text-gray-500">Inscripciones</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <ClipboardList className="h-6 w-6 text-orange-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-orange-600">{integrationStatus.mirror.gradeItems}</p>
            <p className="text-xs text-gray-500">Items Calif.</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <Activity className="h-6 w-6 text-red-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-red-600">{integrationStatus.mirror.grades}</p>
            <p className="text-xs text-gray-500">Calificaciones</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

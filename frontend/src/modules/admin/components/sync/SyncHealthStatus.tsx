import { Card, CardContent, Badge, Spinner } from '@/shared/components/ui';
import { Wifi, WifiOff, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import type { HealthStatus, SyncStatus } from '../../hooks/useAdminSync';

interface SyncHealthStatusProps {
  healthStatus?: HealthStatus;
  healthLoading: boolean;
  syncStatus?: SyncStatus;
}

export function SyncHealthStatus({ healthStatus, healthLoading, syncStatus }: SyncHealthStatusProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${healthStatus?.moodleConnected ? 'bg-green-100' : 'bg-red-100'}`}>
                {healthLoading ? (
                  <Spinner size="sm" />
                ) : healthStatus?.moodleConnected ? (
                  <Wifi className="h-6 w-6 text-green-600" />
                ) : (
                  <WifiOff className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Conexión Moodle</h3>
                <p className="text-sm text-gray-500">
                  {healthStatus?.moodleConnected
                    ? `Conectado (${healthStatus.responseTimeMs}ms)`
                    : healthStatus?.error || 'Desconectado'}
                </p>
              </div>
            </div>
            <Badge variant={healthStatus?.moodleConnected ? 'success' : 'danger'}>
              {healthStatus?.moodleConnected ? 'Online' : 'Offline'}
            </Badge>
          </div>
          {healthStatus?.coursesAvailable !== undefined && (
            <p className="mt-3 text-sm text-gray-500">
              Cursos disponibles en Moodle:{' '}
              <span className="font-semibold">{healthStatus.coursesAvailable}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${syncStatus?.isRunning ? 'bg-yellow-100' : 'bg-green-100'}`}>
                {syncStatus?.isRunning ? (
                  <RefreshCw className="h-6 w-6 text-yellow-600 animate-spin" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Estado del Sistema</h3>
                <p className="text-sm text-gray-500">
                  {syncStatus?.isRunning
                    ? 'Sincronización en progreso...'
                    : 'Sistema sincronizado'}
                </p>
              </div>
            </div>
            <Badge variant={syncStatus?.isRunning ? 'warning' : 'success'}>
              {syncStatus?.isRunning ? (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  En Progreso
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Listo
                </>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

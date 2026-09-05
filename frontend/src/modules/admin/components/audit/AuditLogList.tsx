import { Card, CardContent, Badge, Spinner, Button } from '@/shared/components/ui';
import { User, Clock, AlertCircle, Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { AuditLog } from '../../types/audit.types';

interface AuditLogListProps {
  logs?: AuditLog[];
  isLoading: boolean;
  search: string;
  entityFilter: string;
  setPage: (val: number | ((prev: number) => number)) => void;
}

const actionIcons: Record<string, typeof Plus> = {
  CREATE: Plus,
  UPDATE: RefreshCw,
  DELETE: Trash2,
};

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-600',
  UPDATE: 'bg-blue-100 text-blue-600',
  DELETE: 'bg-red-100 text-red-600',
};

const sourceLabels: Record<string, string> = {
  app: 'Aplicación',
  moodle: 'Moodle',
  sync: 'Sincronización',
};

export function AuditLogList({ logs, isLoading, search, entityFilter, setPage }: AuditLogListProps) {
  const getActionBadge = (action: string) => {
    const Icon = actionIcons[action] || RefreshCw;
    const colorClass = actionColors[action] || 'bg-gray-100 text-gray-600';

    return (
      <div className={`p-2 rounded-full ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No hay registros de auditoría</p>
            <p className="text-sm">
              {search || entityFilter
                ? 'No se encontraron registros con esos filtros'
                : 'No hay actividad registrada aún'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <Card key={log.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {getActionBadge(log.action)}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {log.action}
                  </span>
                  <Badge variant="secondary">{log.entity}</Badge>
                  <span className="text-sm text-gray-500">
                    ID: {log.entityKey}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  {log.actor ? (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {log.actor.displayName || log.actor.email}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Sistema
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                  <Badge variant="outline">
                    {sourceLabels[log.source ?? ''] || log.source || 'App'}
                  </Badge>
                </div>

                {/* Show data changes for updates */}
                {log.action === 'UPDATE' && (!!log.beforeData || !!log.afterData) && (
                  <details className="mt-3">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:underline">
                      Ver cambios
                    </summary>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {log.beforeData ? (
                        <div className="p-3 bg-red-50 rounded-lg">
                          <p className="font-medium text-red-700 mb-1">Antes:</p>
                          <pre className="text-red-600 overflow-auto max-h-32">
                            {JSON.stringify(log.beforeData, null, 2)}
                          </pre>
                        </div>
                      ) : null}
                      {log.afterData ? (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="font-medium text-green-700 mb-1">Después:</p>
                          <pre className="text-green-600 overflow-auto max-h-32">
                            {JSON.stringify(log.afterData, null, 2)}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  </details>
                )}

                {/* Show data for creates */}
                {log.action === 'CREATE' && log.afterData ? (
                  <details className="mt-3">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:underline">
                      Ver datos
                    </summary>
                    <div className="mt-2 p-3 bg-green-50 rounded-lg text-xs">
                      <pre className="text-green-600 overflow-auto max-h-32">
                        {JSON.stringify(log.afterData, null, 2)}
                      </pre>
                    </div>
                  </details>
                ) : null}

                {/* Show data for deletes */}
                {log.action === 'DELETE' && log.beforeData ? (
                  <details className="mt-3">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:underline">
                      Ver datos eliminados
                    </summary>
                    <div className="mt-2 p-3 bg-red-50 rounded-lg text-xs">
                      <pre className="text-red-600 overflow-auto max-h-32">
                        {JSON.stringify(log.beforeData, null, 2)}
                      </pre>
                    </div>
                  </details>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Load More */}
      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoading}
        >
          Cargar más registros
        </Button>
      </div>
    </div>
  );
}

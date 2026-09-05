import { Card, CardContent, Badge, Spinner, Button } from '@/shared/components/ui';
import { Clock, CheckCircle, AlertCircle, Play } from 'lucide-react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { SyncStatus, IntegrationStatus } from '../../hooks/useAdminSync';
import { entityConfig, formatLastSync, getTimeSinceSync } from './utils';

interface SyncEntityStatusProps {
  syncLoading: boolean;
  integrationStatus?: IntegrationStatus;
  syncStatus?: SyncStatus;
  triggerEntityMutation: UseMutationResult<unknown, Error, string, unknown>;
}

export function SyncEntityStatus({
  syncLoading,
  integrationStatus,
  syncStatus,
  triggerEntityMutation,
}: SyncEntityStatusProps) {
  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado por Entidad</h3>
      {syncLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-4">
          {Object.entries(entityConfig).map(([entity, config]) => {
            const state = integrationStatus?.syncStates?.find(
              (s) => s.entity.toLowerCase() === entity.toLowerCase()
            );
            const Icon = config.icon;

            return (
              <Card key={entity}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${config.bgColor}`}>
                        <Icon className={`h-6 w-6 ${config.color}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{config.label}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Última sync: {formatLastSync(state?.lastSyncedAt)}
                          </span>
                          {state?.lastSyncedAt && (
                            <span className="text-blue-600">
                              {getTimeSinceSync(state.lastSyncedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {state?.lastSyncedAt ? (
                        <Badge variant="success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Sincronizado
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerEntityMutation.mutate(entity)}
                        disabled={triggerEntityMutation.isPending || syncStatus?.isRunning}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Sincronizar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

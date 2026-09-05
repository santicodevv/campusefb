import { Card, CardContent, Button, Spinner } from '@/shared/components/ui';
import { Zap, RefreshCw, RotateCcw, UserCog } from 'lucide-react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { HealthStatus, SyncStatus } from '../../hooks/useAdminSync';

interface SyncActionButtonsProps {
  triggerAllMutation: UseMutationResult<unknown, Error, void, unknown>;
  bootstrapMutation: UseMutationResult<unknown, Error, void, unknown>;
  reconcileMutation: UseMutationResult<unknown, Error, void, unknown>;
  fixTeachersMutation: UseMutationResult<unknown, Error, void, unknown>;
  isAnyMutationPending: boolean;
  syncStatus?: SyncStatus;
  healthStatus?: HealthStatus;
}

export function SyncActionButtons({
  triggerAllMutation,
  bootstrapMutation,
  reconcileMutation,
  fixTeachersMutation,
  isAnyMutationPending,
  syncStatus,
  healthStatus,
}: SyncActionButtonsProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Acciones de Sincronización</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => triggerAllMutation.mutate()}
            disabled={isAnyMutationPending || syncStatus?.isRunning}
          >
            {triggerAllMutation.isPending ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sincronizar Todo
          </Button>

          <Button
            variant="outline"
            onClick={() => bootstrapMutation.mutate()}
            disabled={
              isAnyMutationPending ||
              syncStatus?.isRunning ||
              !healthStatus?.moodleConnected
            }
          >
            {bootstrapMutation.isPending ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Bootstrap (Sync Inicial)
          </Button>

          <Button
            variant="outline"
            onClick={() => reconcileMutation.mutate()}
            disabled={
              isAnyMutationPending ||
              syncStatus?.isRunning ||
              !healthStatus?.moodleConnected
            }
          >
            {reconcileMutation.isPending ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Reconciliar
          </Button>

          <Button
            variant="outline"
            onClick={() => fixTeachersMutation.mutate()}
            disabled={isAnyMutationPending || syncStatus?.isRunning}
          >
            {fixTeachersMutation.isPending ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <UserCog className="h-4 w-4 mr-2" />
            )}
            Corregir Profesores
          </Button>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          <strong>Bootstrap:</strong> Reinicia y hace sync completo desde cero.
          <strong className="ml-2">Reconciliar:</strong> Compara y repara diferencias entre Moodle y mirror local.
          <strong className="ml-2">Corregir Profesores:</strong> Asigna roles y cursos a profesores detectados en Moodle.
        </p>
      </CardContent>
    </Card>
  );
}

import { useAdminSync } from '../hooks/useAdminSync';
import { SyncHeader } from '../components/sync/SyncHeader';
import { SyncHealthStatus } from '../components/sync/SyncHealthStatus';
import { SyncMirrorStats } from '../components/sync/SyncMirrorStats';
import { SyncActionButtons } from '../components/sync/SyncActionButtons';
import { SyncReconcileResult } from '../components/sync/SyncReconcileResult';
import { SyncEntityStatus } from '../components/sync/SyncEntityStatus';
import { SyncInfoCard } from '../components/sync/SyncInfoCard';
import type { UseMutationResult } from '@tanstack/react-query';

export default function AdminSync() {
  const hookState = useAdminSync();

  return (
    <div>
      <SyncHeader />
      <SyncHealthStatus
        healthStatus={hookState.healthStatus}
        healthLoading={hookState.healthLoading}
        syncStatus={hookState.syncStatus}
      />
      <SyncMirrorStats
        integrationStatus={hookState.integrationStatus}
        integrationLoading={hookState.integrationLoading}
      />
      <SyncActionButtons
        triggerAllMutation={hookState.triggerAllMutation}
        bootstrapMutation={hookState.bootstrapMutation as unknown as UseMutationResult<unknown, Error, void, unknown>}
        reconcileMutation={hookState.reconcileMutation as unknown as UseMutationResult<unknown, Error, void, unknown>}
        fixTeachersMutation={hookState.fixTeachersMutation as unknown as UseMutationResult<unknown, Error, void, unknown>}
        isAnyMutationPending={hookState.isAnyMutationPending}
        syncStatus={hookState.syncStatus}
        healthStatus={hookState.healthStatus}
      />
      <SyncReconcileResult
        showReconcileResult={hookState.showReconcileResult}
        setShowReconcileResult={hookState.setShowReconcileResult}
      />
      <SyncEntityStatus
        syncLoading={hookState.syncLoading}
        integrationStatus={hookState.integrationStatus}
        syncStatus={hookState.syncStatus}
        triggerEntityMutation={hookState.triggerEntityMutation}
      />
      <SyncInfoCard />
    </div>
  );
}

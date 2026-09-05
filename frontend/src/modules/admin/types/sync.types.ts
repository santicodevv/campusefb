// Sync types

export type SyncEntityType = 'users' | 'categories' | 'courses' | 'enrolments' | 'grade_items' | 'grades';

export interface SyncState {
  id: number;
  entity: SyncEntityType;
  lastCheckpoint?: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface SyncStatus {
  isConnected: boolean;
  moodleUrl: string;
  lastFullSync?: string;
  entities: SyncEntityStatus[];
}

export interface SyncEntityStatus {
  entity: SyncEntityType;
  count: number;
  lastSyncedAt?: string;
  status: 'ok' | 'error' | 'syncing';
  errorMessage?: string;
}

export interface SyncJob {
  id: number;
  entity: SyncEntityType;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  recordsProcessed?: number;
  errorMessage?: string;
}

// Request types
export interface ForceSyncRequest {
  entity?: SyncEntityType; // If null, syncs all
}

// Response types
export interface SyncResult {
  success: boolean;
  entity: SyncEntityType;
  recordsProcessed: number;
  duration: number;
  errors?: string[];
}

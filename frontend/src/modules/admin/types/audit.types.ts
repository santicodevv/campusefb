// Audit log types

export interface AuditLog {
  id: number;
  actorUserId?: number;
  action: string;
  entity: string;
  entityKey: string;
  source?: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  createdAt: string;
  // Relations
  actor?: {
    id: number;
    email: string;
    displayName: string;
  };
}

// Common audit actions
export type AuditAction =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.login'
  | 'user.logout'
  | 'grade.created'
  | 'grade.updated'
  | 'period.created'
  | 'period.updated'
  | 'period.closed'
  | 'reenrol.submitted'
  | 'reenrol.approved'
  | 'reenrol.rejected'
  | 'reenrol.applied'
  | 'transcript.generated'
  | 'transcript.revoked'
  | 'sync.started'
  | 'sync.completed'
  | 'sync.failed'
  | 'webhook.processed';

// Query params
export interface AuditQueryParams {
  userId?: number;
  action?: string;
  entity?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

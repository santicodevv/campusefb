// Re-enrolment types

export type ReEnrolmentStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'applied';
export type ReEnrolmentLineAction = 'enrol' | 'suspend' | 'unenrol';
export type ReEnrolmentLineStatus = 'pending' | 'done' | 'failed';

export interface ReEnrolmentRequest {
  id: number;
  appUserId: number;
  periodId: number;
  status: ReEnrolmentStatus;
  submittedAt?: string;
  decidedAt?: string;
  decidedBy?: number;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  period?: {
    id: number;
    code: string;
    name: string;
  };
  student?: {
    id: number;
    email: string;
    displayName: string;
  };
  lines?: ReEnrolmentLine[];
}

export interface ReEnrolmentLine {
  id: number;
  requestId: number;
  courseMoodleId: number;
  action: ReEnrolmentLineAction;
  status: ReEnrolmentLineStatus;
  lastError?: string;
  // For display
  courseName?: string;
  courseCredits?: number;
}

// Request types
export interface CreateReEnrolmentRequest {
  periodId: number;
  courseIds: number[];
}

export interface UpdateReEnrolmentRequest {
  courseIds?: number[];
}

export interface ProcessReEnrolmentRequest {
  status: 'approved' | 'rejected';
  notes?: string;
}

// Query params
export interface ReEnrolmentsQueryParams {
  periodId?: number;
  status?: ReEnrolmentStatus;
  userId?: number;
  page?: number;
  limit?: number;
}

// Summary for display
export interface ReEnrolmentSummary {
  id: number;
  studentName: string;
  studentEmail: string;
  periodCode: string;
  coursesCount: number;
  totalCredits: number;
  status: ReEnrolmentStatus;
  submittedAt?: string;
}

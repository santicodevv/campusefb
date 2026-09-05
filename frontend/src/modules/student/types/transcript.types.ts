// Transcript types

export type TranscriptStatus = 'generated' | 'revoked';

export interface Transcript {
  id: number;
  appUserId: number;
  periodId?: number;
  transcriptNumber: string;
  fileUrl?: string;
  fileHash: string;
  status: TranscriptStatus;
  generatedAt: string;
  // Relations
  user?: {
    id: number;
    email: string;
    displayName: string;
  };
  period?: {
    id: number;
    code: string;
    name: string;
  };
}

// Request types
export interface GenerateTranscriptRequest {
  periodId?: number; // If null, generates complete transcript
}

// Transcript content (for PDF generation)
export interface TranscriptContent {
  studentName: string;
  studentId: string;
  studentEmail: string;
  program?: string;
  generatedAt: string;
  transcriptNumber: string;
  periods: TranscriptPeriod[];
  cumulativeGPA: number;
  totalCredits: number;
}

export interface TranscriptPeriod {
  periodCode: string;
  periodName: string;
  courses: TranscriptCourse[];
  periodGPA: number;
  periodCredits: number;
}

export interface TranscriptCourse {
  courseCode: string;
  courseName: string;
  credits: number;
  grade: number;
  letterGrade: string;
  status: 'approved' | 'failed' | 'in_progress';
}

// Query params
export interface TranscriptsQueryParams {
  userId?: number;
  status?: TranscriptStatus;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrolments: number;
  totalGrades: number;
  pendingReEnrolments: number;
  activePeriod?: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
}

export interface RecentActivity {
  id: number;
  action: string;
  entity: string;
  entityKey: string;
  actorUserId: number;
  actor?: {
    id: number;
    email: string;
    displayName: string;
  };
  createdAt: string;
}

export interface ActiveStudent {
  id: number;
  moodleId: number;
  firstname: string;
  lastname: string;
  email: string;
  lastAccess: string | null;
}

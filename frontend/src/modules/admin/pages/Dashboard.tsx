import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { DashboardStatsGrid } from '../components/dashboard/DashboardStatsGrid';
import { ActivePeriodCard } from '../components/dashboard/ActivePeriodCard';
import { GradeEditSessionCard } from '../components/dashboard/GradeEditSessionCard';
import { ActiveStudentsCard } from '../components/dashboard/ActiveStudentsCard';
import { SyncStatusCard } from '../components/dashboard/SyncStatusCard';
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard';

export default function AdminDashboard() {
  const {
    user,
    stats,
    statsLoading,
    recentActivity,
    activityLoading,
    pendingReenrolmentsCount,
    editSessionStatus,
    activeStudents,
    studentsLoading,
    toggleEditSession,
  } = useAdminDashboard();

  return (
    <div>
      <DashboardHeader displayName={user?.displayName} />

      <DashboardStatsGrid 
        stats={stats} 
        statsLoading={statsLoading} 
        pendingReenrolmentsCount={pendingReenrolmentsCount} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivePeriodCard activePeriod={stats?.activePeriod} />
        
        <GradeEditSessionCard 
          editSessionStatus={editSessionStatus} 
          toggleEditSession={toggleEditSession} 
        />
        
        <ActiveStudentsCard 
          activeStudents={activeStudents} 
          studentsLoading={studentsLoading} 
        />
        
        <SyncStatusCard stats={stats} />
        
        <RecentActivityCard 
          recentActivity={recentActivity} 
          activityLoading={activityLoading} 
        />
      </div>
    </div>
  );
}

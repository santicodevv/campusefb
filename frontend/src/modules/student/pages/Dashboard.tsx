import { useAuth } from '@/app/providers';
import { StudentDashboardHeader } from '../components/dashboard/StudentDashboardHeader';
import { StudentDashboardStats } from '../components/dashboard/StudentDashboardStats';
import { StudentDashboardUpcoming } from '../components/dashboard/StudentDashboardUpcoming';
import { StudentDashboardRecentActivity } from '../components/dashboard/StudentDashboardRecentActivity';

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <StudentDashboardHeader displayName={user?.displayName} />
      <StudentDashboardStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudentDashboardUpcoming />
        <StudentDashboardRecentActivity />
      </div>
    </div>
  );
}
